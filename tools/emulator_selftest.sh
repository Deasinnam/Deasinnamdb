#!/usr/bin/env bash
# 덜누름 데스크 에뮬레이터 점검: 앱 목록·아이콘, 시작 메뉴·검색, 내부 창, 내 사진 배경, 바깥 앱 띄우기.
set -u
APK="$1"
PKG=com.daesinnam.desk
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
  if [ "$shot" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "SHOT"; then adb exec-out screencap -p > desk-screen-windows.png; shot=1; fi
  if adb logcat -d -s DESK_SELFTEST:I | grep -q "DONE"; then break; fi
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
echo "===== 홈 앱으로 고를 수 있는지 ====="
adb shell cmd package query-activities -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null | grep -c "$PKG" | sed 's/^/홈 후보 등록 수: /'
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
pass=$(grep -c "DESK_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "DESK_SELFTEST: FAIL" selftest-result.txt || true)
clicks=$(grep -c "DESK_SELFTEST: WIDGET-CLICK" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn 위젯이 받은 누름=$clicks (1이어야 함: 드러난 위젯은 받고, 메뉴가 열려 있으면 받지 않음)"
if grep -q "DESK_SELFTEST: DONE2" selftest-result.txt && [ "$pass" -ge 17 ] && [ "$failn" = 0 ] && [ "$clicks" = 1 ] && [ "$tap1" = 1 ] && [ "$tap2" = 1 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
grep -v DESK_SELFTEST selftest-result.txt | tail -30
adb logcat -d | grep -E "AndroidRuntime|FATAL" | tail -30
exit 1
