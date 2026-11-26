#!/bin/bash
# 에뮬레이터 자동 점검: 진짜 Gemma 4 E2B 모델을 넣고 기기 안 AI로 글 · 사진 질문 → 실제 화면 캡처
# 사용: tools/emulator_selftest.sh 시험용.apk 모델파일
set -u
APK="$1"; MODEL="$2"; IMG="${3:-}"; PKG=com.daesinnam.localai
OUT=selftest-result.txt; : > $OUT
log(){ echo "$*" | tee -a $OUT; }
shot(){ adb exec-out screencap -p > "localai-screen-$1.png"; }
adb wait-for-device
adb shell settings put global window_animation_scale 0
adb install -r -g "$APK" || { log "FAIL install"; exit 1; }
# 화면 크기: 폴드8 울트라 펼친 화면 비율에 가깝게
adb shell wm size 1904x1716; adb shell wm density 360
adb shell am start -n $PKG/.MainActivity >/dev/null; sleep 6
shot 1-setup
# 데모 화면(가짜 데이터)
for d in chat settings dl plus tool; do adb shell am start -S -n $PKG/.MainActivity --es demo $d >/dev/null; sleep 5; shot "2-demo-$d"; done
adb shell am force-stop $PKG
# 모델 넣기: 앱 전용 폴더(내려받기와 같은 자리)
DIR=/sdcard/Android/data/$PKG/files/models
adb shell mkdir -p $DIR
if ! adb push "$MODEL" $DIR/gemma-4-E2B-it.litertlm >/dev/null 2>&1; then
  log "INFO push to app dir failed → run-as"
  adb push "$MODEL" /data/local/tmp/m.litertlm >/dev/null && adb shell run-as $PKG sh -c "mkdir -p files/m && cp /data/local/tmp/m.litertlm files/m/"
fi
adb shell ls -la $DIR | tee -a $OUT
# 1) 엔진 직접 점검(CPU): 글 · 이어 묻기 · 사진
adb logcat -c
adb shell am start -S -n $PKG/.MainActivity --es selftest $DIR/gemma-4-E2B-it.litertlm >/dev/null
for i in $(seq 1 180); do
  sleep 10
  if adb logcat -d -s LA_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb logcat -d -s LA_SELFTEST:I | grep -o 'LA_SELFTEST: .*' | sed 's/^LA_SELFTEST: //' | tee -a $OUT
timeout 30 adb logcat -d | grep -iE 'litert|LocalAI|AndroidRuntime' | tail -60 > logcat-tail.txt
# 1-b) 그림 엔진 직접 점검(작게 256px · 4단계)
if [ -n "$IMG" ]; then
  adb push "$IMG" $DIR/dreamshaper-7-lcm-f16.gguf >/dev/null 2>&1 || log "FAIL push image model"
  adb logcat -c
  adb shell am start -S -n $PKG/.MainActivity --es selftestimg $DIR/dreamshaper-7-lcm-f16.gguf >/dev/null
  for i in $(seq 1 120); do sleep 10; if timeout 20 adb logcat -d -s LA_SELFTEST:I | grep -q "IMGDONE"; then break; fi; done
  timeout 20 adb logcat -d -s LA_SELFTEST:I | grep -o 'LA_SELFTEST: .*' | sed 's/^LA_SELFTEST: //' | grep -v IMGDONE | tee -a $OUT
  timeout 20 adb logcat -d -s DnrImg:* | tail -30 > logcat-img.txt
  timeout 30 adb pull /sdcard/Android/data/$PKG/files/selftest-image.png selftest-image.png >/dev/null 2>&1
fi
# 2) 실제 화면에서 질문(CPU로 고정 — 에뮬레이터는 GPU가 없음)
adb shell am force-stop $PKG
adb shell am start -n $PKG/.MainActivity --ez cpu true --es ask "\"인터넷 없이 폰 안에서 AI가 돌아가면 좋은 점 3가지를 짧게 알려 줘\"" >/dev/null
sleep 25; shot 3-real-loading
OK=0
for i in $(seq 1 36); do
  sleep 10
  if timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null | grep -q '"role":"model"'; then OK=1; break; fi
done
sleep 3; shot 4-real-answer
CH=$(timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null)
if [ $OK = 1 ] && ! echo "$CH" | grep -q '"error"'; then log "PASS ui chat answered: $(echo "$CH" | grep -o '"role":"model","text":"[^"]\{0,80\}' | head -1 | cut -c25-)"; else log "FAIL ui chat ($(echo "$CH" | grep -o '"error":"[^"]*' | head -1))"; fi
# 2-b) 실제 화면에서 그림 요청(대화 → 영어 설명 → 그림)
if [ -n "$IMG" ]; then
  adb shell am force-stop $PKG
  adb shell am start -n $PKG/.MainActivity --ez cpu true --ez imgsmall true --es ask "\"노을 진 바닷가에 앉아 있는 고양이를 그려 줘\"" >/dev/null
  OK=0
  for i in $(seq 1 110); do
    sleep 10
    if timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null | grep -q '"image":"'; then OK=1; break; fi
  done
  sleep 3; shot 4b-real-draw
  CH=$(timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null)
  if [ $OK = 1 ]; then log "PASS ui draw: $(echo "$CH" | grep -o '"prompt":"[^"]\{0,90\}' | head -1)"; else log "FAIL ui draw ($(echo "$CH" | grep -o '"error":"[^"]*' | tail -1))"; fi
  # 2-c) 그림 다음에 같은 대화에서 다시 질문 → 답이 와야 함(그림 뒤 질문이 막히던 문제)
  if [ $OK = 1 ]; then
    N0=$(echo "$CH" | grep -o '"role":"model","text":"[^"]' | wc -l)
    adb shell am start -n $PKG/.MainActivity --es ask "\"이 고양이에게 어울리는 이름 세 개만 지어 줘\"" >/dev/null
    OK2=0
    for i in $(seq 1 40); do
      sleep 10
      N1=$(timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null | grep -o '"role":"model","text":"[^"]' | wc -l)
      if [ "$N1" -gt "$N0" ]; then OK2=1; break; fi
    done
    sleep 3; shot 4c-chat-after-draw
    CH=$(timeout 20 adb shell "run-as $PKG sh -c 'cat files/chats/*.json'" 2>/dev/null)
    if [ $OK2 = 1 ]; then log "PASS ui chat after draw: $(echo "$CH" | grep -o '"role":"model","text":"[^"]\{0,60\}' | tail -1 | cut -c25-)"; else log "FAIL ui chat after draw ($(echo "$CH" | grep -o '"error":"[^"]*' | tail -1))"; fi
  fi
fi
# 3) 사진 붙여 화면 질문 — 공유하기로 사진 넣기
adb shell am force-stop $PKG
adb shell am start -n $PKG/.MainActivity --es demo stream >/dev/null; sleep 5; shot 5-demo-stream
PASS=$(grep -c '^PASS' $OUT); FAIL=$(grep -c '^FAIL' $OUT)
log "SUMMARY pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ] && [ "$PASS" -ge 5 ]
