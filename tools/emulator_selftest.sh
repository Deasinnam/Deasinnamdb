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
step "작업 목록"
adb shell dumpsys activity activities > selftest-activities.txt
grep -q "com.android.settings" selftest-activities.txt && echo "설정 앱 열림 통과" || { echo "설정 앱 열림 실패"; fail=1; }
adb shell settings put system user_rotation 0
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"; exit 1
