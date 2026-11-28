#!/usr/bin/env bash
# 덜누름 PC 런처 에뮬레이터 점검
# 1부: PC 화면(덜누름 데스크와 같은 바탕화면) — 앱 목록·아이콘, 시작 메뉴·검색, 내부 창, 내 사진 배경, 바깥 앱 띄우기
# 2부: 가상 모니터(안드로이드 overlay display)로 — 모니터 찾기 · 모니터에 PC 화면 열기 · 거기서 앱 띄우기 · 터치패드 · 폰 키보드
set -u
APK="$1"
PKG=com.daesinnam.pc
adb install -r -g "$APK" || exit 1
# 자유 창을 켜 봄 (다시 시작해야 적용되는 기기도 있어 결과는 참고용)
adb shell settings put global enable_freeform_support 1
adb shell settings put global force_resizable_activities 1
# 위젯: 실제 기기에서는 처음 올릴 때 안드로이드가 허용 여부를 묻습니다. 점검에서는 미리 허용해 둡니다.
adb shell appwidget grantbind --package "$PKG" --user 0 || adb shell cmd appwidget grantbind --package "$PKG" --user 0
# 펼친 화면처럼 넓은 화면(가로 1600, 1.5배 밀도)에서 점검합니다. 기본 에뮬레이터 화면(320×640)은 너무 좁아 위젯이 좌우를 다 차지합니다.
BIG=1600x1080; BIGD=240
adb shell wm size $BIG; adb shell wm density $BIGD; sleep 3
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez desk.selftest true
shot=0; tap1=0; tap2=0; rs1=0; rs2=0
# 1번: 같은 밀도로 화면만 작게(창 내리기·DeX 창 크기), 2번: 접은 화면처럼 좁고 길게 + 밀도도 다르게
small1=880x650; small2=720x1500; small2d=320
echo "화면 $BIG@$BIGD → 1번 $small1, 2번 $small2@$small2d"
for i in $(seq 1 90); do
  sleep 3
  # 위젯 누르기: 화면이 알려 준 자리(위젯 가운데)를 실제로 눌러 봄
  if [ "$tap1" = 0 ]; then
    at=$(adb logcat -d -s DESK_SELFTEST:I | grep -o "WIDGET-AT [0-9]* [0-9]*" | tail -1)
    if [ -n "$at" ]; then set -- $at; adb shell input tap "$2" "$3"; tap1=1; echo "위젯 누름 ($2,$3)"; fi
  fi
  if [ "$tap2" = 0 ]; then
    at=$(adb logcat -d -s DESK_SELFTEST:I | grep -o "WIDGET-BLOCKED-AT [0-9]* [0-9]*" | tail -1)
    if [ -n "$at" ]; then set -- $at; adb shell input tap "$2" "$3"; tap2=1; echo "메뉴가 열린 채 같은 자리 누름 ($2,$3)"; fi
  fi
  if [ "$rs1" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "RESIZE-1"; then
    rs1=1; echo "화면 줄였다 되돌리기 1"
    adb shell wm size "$small1"; sleep 5; adb exec-out screencap -p > desk-screen-small.png; adb shell wm size $BIG; sleep 4
  fi
  if [ "$rs2" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "RESIZE-2"; then
    rs2=1; echo "다른 앱을 띄운 채 화면 줄였다 되돌리기 2"
    adb shell am start -a android.settings.SETTINGS >/dev/null; sleep 2
    adb shell wm size "$small2"; adb shell wm density $small2d; sleep 4; adb shell wm size $BIG; adb shell wm density $BIGD; sleep 2
    adb shell am start -n "$PKG/.MainActivity" >/dev/null; sleep 3
    adb exec-out screencap -p > desk-screen-after-resize.png
  fi
  # 같은 순간 읽은 기록으로 SHOT3·DONE을 함께 봄(둘이 같은 때 찍히면 SHOT3 점검을 건너뛰고 끝나던 문제)
  L=$(adb logcat -d -s DESK_SELFTEST:I)
  if [ "${shot3:-0}" = 0 ] && echo "$L" | grep -q "SHOT3"; then
    adb exec-out screencap -p > desk-screen-split.png; shot3=1
    # 실제로 그 앱 창이 왼쪽 위 4분의 1(가로 0~800)에 떴는지 안드로이드 창 목록에서 확인
    spkg=$(adb logcat -d -s DESK_SELFTEST:I | grep -o "SPLIT-PKG [a-z0-9._]*" | tail -1 | cut -d' ' -f2)
    adb shell dumpsys activity activities > activities.txt
    if [ -n "$spkg" ] && grep -A40 "$spkg" activities.txt | grep -qE "mBounds=Rect\(0, [0-9]+ - 800, "; then sq="PASS"; else sq="FAIL"; fi
    echo "실제 창 자리 점검: $sq ($spkg)"; grep -A40 "$spkg" activities.txt | grep -m3 -E "mBounds=" || true
  fi
  if [ "${shot4:-0}" = 0 ] && echo "$L" | grep -q "SHOT4"; then
    adb exec-out screencap -p > desk-screen-arrange.png; shot4=1
    # 창정리: 배치로 연 바깥 앱이 오른쪽 3분의 2(가로 533~1600)에 떴는지
    apkg=$(echo "$L" | grep -o "ARRANGE-PKG [a-z0-9._]*" | tail -1 | cut -d' ' -f2)
    adb shell dumpsys activity activities > activities-arrange.txt
    echo "창정리 바깥 앱: $apkg"; grep -A40 "$apkg" activities-arrange.txt | grep -m2 -E "mBounds=" || true
    # 고급 기능(Shizuku)과 같은 셸 권한으로: 창 목록 형식, 열린 창 옮기기
    adb shell am stack list > selftest-stack.txt 2>&1
    head -30 selftest-stack.txt
    if grep -qE "taskId=[0-9]+: [^/ ]+/[^ ]+ bounds=\[-?[0-9]+,-?[0-9]+\]\[-?[0-9]+,-?[0-9]+\].*visible=" selftest-stack.txt; then echo "창 목록 형식 점검: PASS"; else echo "창 목록 형식 점검: FAIL"; fi
    tid=$(grep -oE "taskId=[0-9]+: com.android.settings" selftest-stack.txt | head -1 | grep -oE "[0-9]+" | head -1)
    if [ -n "$tid" ]; then
      adb shell am task resize "$tid" 100 120 900 700 2>&1 | head -3
      sleep 1
      adb shell am stack list | grep "taskId=$tid:" | tee selftest-stack-after.txt
      if grep -q "bounds=\[100,120\]\[900,700\]" selftest-stack-after.txt; then echo "열린 창 옮기기 점검: PASS"; else echo "열린 창 옮기기 점검: FAIL"; fi
    else echo "열린 창 옮기기 점검: 설정 창 없음"; fi
  fi
  if [ "$shot" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "SHOT"; then adb exec-out screencap -p > desk-screen-windows.png; shot=1; fi
  if echo "$L" | grep -q "DONE"; then break; fi
done
sleep 4
adb exec-out screencap -p > desk-screen-launched.png
adb logcat -d -s DESK_SELFTEST:I Desk:* DeskConsole:* > selftest-result.txt
adb logcat -d -b crash > crash-1.txt 2>/dev/null
adb logcat -d | grep -E "chromium|WebView|cr_|Desk|ActivityManager.*daesinnam|libc " | tail -150 > logcat-1.txt
# 2단계: 앱을 완전히 껐다 켠 뒤 위젯이 놓아 둔 자리에 그대로 있는지
adb shell am force-stop "$PKG"
sleep 2
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez desk.selftest true --es desk.phase 2
shot2=0
for i in $(seq 1 20); do
  sleep 2
  if [ "$shot2" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "SHOT2"; then adb exec-out screencap -p > desk-screen-restart.png; shot2=1; fi
  if adb logcat -d -s DESK_SELFTEST:I | grep -q "DONE2"; then break; fi
done
adb logcat -d -s DESK_SELFTEST:I Desk:* DeskConsole:* >> selftest-result.txt
echo "===== 점검 결과 ====="
grep DESK_SELFTEST selftest-result.txt | cut -c1-400
echo "===== 앱 아이콘 대상 (폰 화면이어야 함) ====="
adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PKG" 2>/dev/null | tail -1 | tee launcher-target.txt
if grep -q "$PKG/.PhoneActivity" launcher-target.txt; then echo "x DESK_SELFTEST: PASS app icon opens PhoneActivity" >> selftest-result.txt; else echo "x DESK_SELFTEST: FAIL app icon target" >> selftest-result.txt; fi
echo "===== 띄운 앱의 창 방식 (참고) ====="
adb shell dumpsys activity activities | grep -E "mWindowingMode=|windowingMode=" | sort | uniq -c | head -8
adb shell am start -n "$PKG/.MainActivity" >/dev/null 2>&1; sleep 2
adb exec-out screencap -p > desk-screen-home.png
# 밝은 색 · 시작 메뉴 화면도 찍어 둠 (디자인 확인용)
adb shell input keyevent KEYCODE_META_LEFT >/dev/null 2>&1; sleep 1
adb exec-out screencap -p > desk-screen-start.png
adb shell input keyevent KEYCODE_ESCAPE >/dev/null 2>&1
adb shell wm size reset; adb shell wm density reset
echo "===== 앱이 꺼진 까닭 (exit-info) ====="
adb shell dumpsys activity exit-info "$PKG" | grep -E "ApplicationExitInfo|reason=|description=|timestamp=|pid=" | head -40 | tee exit-info.txt
echo "===== crash ====="; cat crash-1.txt | head -40
echo "===== 2부: 가상 모니터 ====="
# 모니터 대신: 에뮬레이터 다중 디스플레이(보통 외부 화면처럼 접근성 · 입력이 됨).
# 안 되면 안드로이드 개발용 가상 화면(overlay display) — 이 화면은 안드로이드가 접근성에서 빼 두어 터치패드 점검은 건너뜀
adb emu multidisplay add 1 1280 720 160 0 2>&1 | head -3
sleep 6
MONTYPE=multidisplay
MON=$(adb shell dumpsys display | grep -oE "mDisplayId=[0-9]+" | cut -d= -f2 | sort -un | grep -v "^0$" | head -1 | tr -d '\r')
if [ -z "$MON" ]; then
  MONTYPE=overlay
  adb shell settings put global overlay_display_devices 1280x720/160
  sleep 5
  MON=$(adb shell dumpsys display | grep -oE "mDisplayId=[0-9]+" | cut -d= -f2 | sort -un | grep -v "^0$" | head -1 | tr -d '\r')
fi
adb shell dumpsys display | grep -E "mDisplayId=|DisplayDeviceInfo\{|type [A-Z]+" | head -12 > pc-displays.txt
echo "가상 모니터: ${MONTYPE} 번호 ${MON:-없음}"; cat pc-displays.txt
# 터치패드(접근성) 켜기 — 실제 기기에서는 사용자가 접근성 설정에서 켭니다
adb shell settings put secure enabled_accessibility_services "$PKG/$PKG.PointerService"
adb shell settings put secure accessibility_enabled 1
sleep 3
adb logcat -c
adb shell am start -n "$PKG/.PhoneActivity" --ez pc.selftest true
typed=0
for i in $(seq 1 60); do
  sleep 2
  L=$(adb logcat -d -s PC_SELFTEST:I)
  if [ ! -f pc-screen-phone.png ] && echo "$L" | grep -q "SHOT-HOME"; then adb exec-out screencap -p > pc-screen-phone.png; fi
  if [ ! -f pc-screen-monitor.png ] && echo "$L" | grep -q "SHOT-MONITOR"; then
    adb exec-out screencap -p > pc-screen-monitor.png
    adb shell dumpsys activity activities > pc-activities.txt
  fi
  if [ ! -f pc-screen-pad.png ] && echo "$L" | grep -q "SHOT-PAD"; then adb exec-out screencap -p > pc-screen-pad.png; fi
  if [ "$typed" = 0 ] && echo "$L" | grep -q "INPUT-READY"; then
    typed=1; adb shell am start --display "${MON:-2}" -n "$PKG/.TestInputActivity" | head -3
  fi
  if [ ! -f pc-screen-type.png ] && echo "$L" | grep -q "SHOT-TYPE"; then adb exec-out screencap -p > pc-screen-type.png; fi
  if echo "$L" | grep -q "DONE"; then break; fi
done
adb logcat -d -s PC_SELFTEST:I PcPointer:* PcMonitor:* PcMonitorSvc:* PcPhone:* PcPhoneConsole:* Desk:I > selftest-pc.txt
echo "===== 2부 기록 ====="; grep -E "PC_SELFTEST|PcPointer|PcMonitor" selftest-pc.txt | cut -c1-260 | head -60
# 모니터 화면(Display #MON) 안에 바탕화면과 거기서 띄운 설정 앱이 있는지
awk -v m="Display #${MON:-2} " 'index($0,"Display #")==1{on=(index($0,m)==1)} on' pc-activities.txt > pc-monitor-tasks.txt
grep -oE "(com\.daesinnam\.pc|com\.android\.settings)/[.A-Za-z]+" pc-monitor-tasks.txt | sort -u | sed 's/^/모니터 화면 위: /'
pcres() { if eval "$2"; then echo "x DESK_SELFTEST: PASS pc $1" >> selftest-result.txt; echo "PASS $1"; else echo "x DESK_SELFTEST: FAIL pc $1" >> selftest-result.txt; echo "FAIL $1"; fi; }
pcres "monitor found" 'grep -q "STATUS connected true" selftest-pc.txt'
pcres "desktop opened on monitor" 'grep -q "DESKTOP-ON true" selftest-pc.txt && grep -q "com.daesinnam.pc/.MainActivity" pc-monitor-tasks.txt'
pcres "app launched from monitor desktop lands on monitor" 'grep -q "com.android.settings/" pc-monitor-tasks.txt'
pcres "pointer moved" 'grep -E "POS from .* to [0-9]+,[0-9]+" selftest-pc.txt | grep -qv "to 0,0,"'
if [ "$MONTYPE" = overlay ]; then
  echo "터치패드 점검 건너뜀: 개발용 가상 화면은 안드로이드가 접근성에서 빼 둠 (실제 모니터는 해당 없음)"
else
  pcres "click lands on monitor app" 'grep -q "GESTURE done click" selftest-pc.txt && grep -qE "TOUCH ACTION_DOWN 30[0-9],20[0-9] display ${MON}" selftest-pc.txt'
  pcres "drag on monitor" 'grep -q "GESTURE done drag-end" selftest-pc.txt'
  pcres "phone keyboard text into monitor input" 'grep -q "INPUT-NOW \[안녕 PC!\] display ${MON}" selftest-pc.txt'
fi
grep -iE "FATAL|AndroidRuntime" -A5 <(adb logcat -d -b crash) | head -20
[ "$MONTYPE" = overlay ] && adb shell settings put global overlay_display_devices '""' >/dev/null 2>&1 || true
echo "x DESK_SELFTEST: ${sq:-FAIL} real window placed in top-left quarter (${spkg:-})" >> selftest-result.txt
pass=$(grep -c "DESK_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "DESK_SELFTEST: FAIL" selftest-result.txt || true)
clicks=$(grep -c "DESK_SELFTEST: WIDGET-CLICK" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn 위젯이 받은 누름=$clicks (1이어야 함: 드러난 위젯은 받고, 메뉴가 열려 있으면 받지 않음)"
if grep -q "DESK_SELFTEST: DONE2" selftest-result.txt && [ "$pass" -ge 19 ] && [ "$failn" = 0 ] && [ "$clicks" = 1 ] && [ "$tap1" = 1 ] && [ "$tap2" = 1 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
grep -v DESK_SELFTEST selftest-result.txt | tail -30
adb logcat -d | grep -E "AndroidRuntime|FATAL" | tail -30
exit 1
