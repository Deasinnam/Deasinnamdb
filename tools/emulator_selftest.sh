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
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez desk.selftest true
shot=0; tap1=0; tap2=0
for i in $(seq 1 60); do
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
  if [ "$shot" = 0 ] && adb logcat -d -s DESK_SELFTEST:I | grep -q "SHOT"; then adb exec-out screencap -p > desk-screen-windows.png; shot=1; fi
  if adb logcat -d -s DESK_SELFTEST:I | grep -q "DONE"; then break; fi
done
sleep 4
adb exec-out screencap -p > desk-screen-launched.png
adb logcat -d -s DESK_SELFTEST:I Desk:* DeskConsole:* > selftest-result.txt
echo "===== 점검 결과 ====="
grep DESK_SELFTEST selftest-result.txt | cut -c1-400
echo "===== 홈 앱으로 고를 수 있는지 ====="
adb shell cmd package query-activities -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null | grep -c "$PKG" | sed 's/^/홈 후보 등록 수: /'
echo "===== 띄운 앱의 창 방식 (참고) ====="
adb shell dumpsys activity activities | grep -E "mWindowingMode=|windowingMode=" | sort | uniq -c | head -8
adb shell am start -n "$PKG/.MainActivity" >/dev/null 2>&1; sleep 2
adb exec-out screencap -p > desk-screen-home.png
pass=$(grep -c "DESK_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "DESK_SELFTEST: FAIL" selftest-result.txt || true)
clicks=$(grep -c "DESK_SELFTEST: WIDGET-CLICK" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn 위젯이 받은 누름=$clicks (1이어야 함: 드러난 위젯은 받고, 메뉴가 열려 있으면 받지 않음)"
if grep -q "DESK_SELFTEST: DONE" selftest-result.txt && [ "$pass" -ge 10 ] && [ "$failn" = 0 ] && [ "$clicks" = 1 ] && [ "$tap1" = 1 ] && [ "$tap2" = 1 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
grep -v DESK_SELFTEST selftest-result.txt | tail -30
adb logcat -d | grep -E "AndroidRuntime|FATAL" | tail -30
exit 1
