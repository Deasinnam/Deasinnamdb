#!/usr/bin/env bash
# 덜누름 TV 에뮬레이터 점검: 기본 서비스 타일 · 저장 · 방향키 포커스 · 앱 열기(같은 화면, 전체 화면 요청).
set -u
APK="$1"
PKG=com.daesinnam.tv
fail=0
adb() { timeout 40 adb "$@"; local r=$?; [ $r = 124 ] && echo "!! adb $* 시간 초과" | tee -a selftest-trace.txt; return $r; }
step() { echo "== $*" | tee -a selftest-trace.txt; }
step "설치"
ok=0
for t in 1 2 3; do
  command adb wait-for-device
  if timeout 240 adb install -r -g "$APK" >> selftest-trace.txt 2>&1; then ok=1; break; fi
  echo "설치 실패 $t" | tee -a selftest-trace.txt; sleep 15
done
[ $ok = 1 ] || exit 1
# TV처럼 가로 화면
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
# 홈 단추 점검용: "다른 앱 위에 표시" 허락
adb shell appops set $PKG SYSTEM_ALERT_WINDOW allow
step "앱 시작"
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez tv.selftest true
for i in $(seq 1 30); do
  sleep 2
  if adb logcat -d -s TV_SELFTEST:I | grep -q "DONE"; then break; fi
  # 점검 도중 화면 찍기 (앱을 열기 전)
  if [ ! -s tv-screen-home.png ] && adb logcat -d -s TV_SELFTEST:I | grep -q "FOCUS"; then adb exec-out screencap -p > tv-screen-home.png; fi
done
step "결과 모으기"
adb logcat -d -t 400 "*:W" > selftest-logcat.txt
adb logcat -d -s TV_SELFTEST:I DeolnureumTV:I > selftest-result.txt
adb exec-out screencap -p > tv-screen-after-launch.png
cat selftest-result.txt
n=$(grep -o "TILES [0-9]*" selftest-result.txt | awk '{print $2}')
if [ "${n:-0}" = 5 ]; then echo "기본 서비스 5개 통과"; else echo "기본 서비스 실패 (${n:-없음})"; fail=1; fi
grep -q "SAVE ok" selftest-result.txt && echo "저장 통과" || { echo "저장 실패"; fail=1; }
grep -q "FOCUS [a-z]" selftest-result.txt && echo "방향키 포커스 통과" || { echo "방향키 포커스 실패"; fail=1; }
grep -q 'LAUNCH {"ok":true' selftest-result.txt && echo "앱 열기 통과" || { echo "앱 열기 실패"; fail=1; }
step "홈 단추"
sleep 2
adb shell dumpsys activity services $PKG > selftest-services.txt
if grep -q "HomeButton" selftest-services.txt; then echo "홈 단추 뜸 통과"; else echo "홈 단추 뜸 실패"; fail=1; fi
adb exec-out screencap -p > tv-screen-home-button.png
# 기본 자리(오른쪽 가장자리, 높이 42%)를 눌러 덜누름 TV로 돌아오는지
read W H < <(adb shell wm size | grep -oE "[0-9]+x[0-9]+" | tail -1 | tr x ' ')
D=$(adb shell wm density | grep -oE "[0-9]+" | tail -1)
size=$(( 56 * D / 160 )); m=$(( 20 * D / 160 ))
# 가로로 돌렸으면 너비 · 높이 바꾸기
if [ "$(adb shell dumpsys input | grep -m1 -oE 'SurfaceOrientation: [0-9]' | grep -oE '[0-9]$')" = 1 ]; then t=$W; W=$H; H=$t; fi
x=$(( W - m - size / 2 )); y=$(( H * 42 / 100 + size / 2 ))
echo "홈 단추 누르기: $x,$y (화면 ${W}x${H})"
adb shell input tap $x $y
sleep 3
adb shell dumpsys activity activities | grep -m3 -E "topResumedActivity|mResumedActivity" | tee selftest-top.txt
if grep -q "$PKG" selftest-top.txt; then echo "홈 단추로 돌아오기 통과"; else echo "홈 단추로 돌아오기 실패"; fail=1; fi
step "전체 화면 명령 (Shizuku와 같은 셸 권한)"
adb shell settings put global enable_freeform_support 1
adb shell settings put global force_resizable_activities 1
CLK=$(grep -o "LAUNCH-PKG [a-z0-9._]*" selftest-result.txt | awk '{print $2}')
adb shell am force-stop "$CLK"; sleep 1
adb shell am start --windowingMode 5 -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -f 0x10200000 -p "$CLK" > /dev/null 2>&1 || true
CMP=$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$CLK" | tail -1)
adb shell am force-stop "$CLK"; sleep 1
adb shell am start --windowingMode 5 -n "$CMP" 2>&1 | head -2; sleep 2
adb shell dumpsys activity activities | grep -m2 -E "Task\{.*$CLK" | tee selftest-mode-before.txt
mode() { adb shell dumpsys activity activities | grep -m1 -oE "Task\{[^}]*$CLK[^}]*mode=[a-z]+" | grep -oE "mode=[a-z]+"; }
# 방법 1: 새 작업으로 (CLEAR_TASK)
adb shell am start --windowingMode 1 --display 0 -f 0x10008000 -n "$CMP" 2>&1 | head -1; sleep 2
echo "방법1 CLEAR_TASK: $(mode)" | tee -a selftest-modes.txt
adb shell am start --windowingMode 5 -n "$CMP" >/dev/null 2>&1; sleep 1
adb shell am force-stop "$CLK"; adb shell am start --windowingMode 5 -n "$CMP" >/dev/null 2>&1; sleep 2
echo "다시 창: $(mode)" | tee -a selftest-modes.txt
# 방법 2: 작업을 닫고(remove-task) 전체 화면으로 다시
TID=$(adb shell dumpsys activity activities | grep -m1 -oE "Task\{[0-9a-f]+ #[0-9]+[^}]*$CLK" | grep -oE "#[0-9]+" | tr -d '#')
adb shell am stack remove "$TID" 2>&1 | head -1
adb shell cmd activity remove-task "$TID" 2>&1 | head -1
sleep 1
adb shell am start --windowingMode 1 --display 0 -f 0x10200000 -n "$CMP" 2>&1 | head -1; sleep 2
echo "방법2 작업 닫고 다시: $(mode)" | tee -a selftest-modes.txt
# 방법 3: force-stop 후 전체 화면
adb shell am start --windowingMode 5 -n "$CMP" >/dev/null 2>&1; sleep 1
adb shell am force-stop "$CLK"; sleep 1
adb shell am start --windowingMode 1 --display 0 -f 0x10200000 -n "$CMP" 2>&1 | head -1; sleep 2
echo "방법3 force-stop 후: $(mode)" | tee -a selftest-modes.txt
step "작업 목록"
adb shell dumpsys activity activities > selftest-activities.txt
LP=$(grep -o "LAUNCH-PKG [a-z0-9._]*" selftest-result.txt | awk '{print $2}')
grep -q "${LP:-none}" selftest-activities.txt && echo "앱 열림 통과 ($LP)" || { echo "앱 열림 실패"; fail=1; }
adb shell settings put system user_rotation 0
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"; exit 1
