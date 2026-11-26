#!/bin/bash
# 에뮬레이터 자동 점검: 진짜 Gemma 4 E2B 모델을 넣고 기기 안 AI로 글 · 사진 질문 → 실제 화면 캡처
# 사용: tools/emulator_selftest.sh 시험용.apk 모델파일
set -u
APK="$1"; MODEL="$2"; PKG=com.daesinnam.localai
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
for d in chat settings dl; do adb shell am start -S -n $PKG/.MainActivity --es demo $d >/dev/null; sleep 5; shot "2-demo-$d"; done
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
# 3) 사진 붙여 화면 질문 — 공유하기로 사진 넣기
adb shell am force-stop $PKG
adb shell am start -n $PKG/.MainActivity --es demo stream >/dev/null; sleep 5; shot 5-demo-stream
PASS=$(grep -c '^PASS' $OUT); FAIL=$(grep -c '^FAIL' $OUT)
log "SUMMARY pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ] && [ "$PASS" -ge 4 ]
