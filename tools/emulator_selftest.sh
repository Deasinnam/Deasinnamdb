#!/usr/bin/env bash
# 덜누름 패드 에뮬레이터 점검: 기본 판 만들기 · 저장 · 버튼을 누르면 앱이 "큰 화면"(두 번째 화면)에서 열리는지.
# 에뮬레이터에는 DeX가 없으므로, 안드로이드 개발자 옵션의 "보조 디스플레이 시뮬레이션"(overlay display)으로 큰 화면을 흉내 냅니다.
set -u
APK="$1"
PKG=com.daesinnam.pad
fail=0
adb() { timeout 40 command adb "$@"; local r=$?; [ $r = 124 ] && echo "!! adb $* 시간 초과" | tee -a selftest-trace.txt; return $r; }
step() { echo "== $*" | tee -a selftest-trace.txt; }
step "설치"
ok=0
for t in 1 2 3; do
  command adb wait-for-device
  if timeout 240 command adb install -r -g "$APK" >> selftest-trace.txt 2>&1; then ok=1; break; fi
  echo "설치 실패 $t" | tee -a selftest-trace.txt; sleep 15
done
[ $ok = 1 ] || exit 1
adb shell settings put global overlay_display_devices 1280x720/213
sleep 6
adb shell dumpsys display | grep -E "mDisplayId=|mBaseDisplayInfo" | head -8 > selftest-displays.txt
EXT=$(adb shell dumpsys display | grep -o 'mDisplayId=[0-9]*' | cut -d= -f2 | sort -un | awk '$1 != 0' | head -1)
echo "두 번째 화면: ${EXT:-없음}"
step "앱 시작"
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez pad.selftest true
for i in $(seq 1 30); do
  sleep 2
  if adb logcat -d -s PAD_SELFTEST:I | grep -q "DONE"; then break; fi
done
step "결과 모으기"
adb logcat -d -t 400 "*:W" > selftest-logcat.txt
sleep 3
adb logcat -d -s PAD_SELFTEST:I DeolnureumPad:I > selftest-result.txt
step "화면 찍기"
adb exec-out screencap -p > pad-screen-home.png
cat selftest-result.txt
grep -q "SAVE ok" selftest-result.txt && echo "저장 통과" || { echo "저장 실패"; fail=1; }
n=$(grep -o "KEYS-SHOWN [0-9]*" selftest-result.txt | awk '{print $2}')
if [ "${n:-0}" -gt 0 ]; then echo "기본 판 통과 ($n개)"; else echo "기본 판 실패"; fail=1; fi
if grep -q '"external":true' selftest-result.txt; then echo "큰 화면에서 열기 요청 통과"; else echo "큰 화면에서 열기 요청 실패"; fail=1; fi
# 실제로 설정 앱이 두 번째 화면에 떠 있는지
step "작업 목록"
adb shell dumpsys activity activities > selftest-activities.txt
where=$(awk '/^ *Display #[0-9]+/{d=$2} /com\.android\.settings/{print d; exit}' selftest-activities.txt | tr -d '#')
echo "설정 앱이 뜬 화면: ${where:-못 찾음}"
if [ -n "${EXT:-}" ] && [ "${where:-}" = "$EXT" ]; then echo "두 번째 화면에서 열림 통과"; else echo "두 번째 화면에서 열림 실패"; fail=1; fi
adb shell settings delete global overlay_display_devices
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"; exit 1
