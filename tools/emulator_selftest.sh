#!/usr/bin/env bash
# 에뮬레이터 종단 점검: 가짜 OpenAI 서버를 띄우고, 녹음 → 받아쓰기 → 분석 → 캘린더 등록을 확인합니다.
set -u
APK="$1"
PKG=com.daesinnam.meeting
python3 tools/mock_openai.py 8787 &
MOCK=$!
sleep 1
adb install -r -g "$APK" || exit 1
adb shell appops set "$PKG" RECORD_AUDIO allow || true
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez meeting.selftest true
for i in $(seq 1 36); do
  sleep 5
  if adb logcat -d -s MEETING_SELFTEST:* | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > meeting-screen.png
adb logcat -d -s MEETING_SELFTEST:* Meeting:* MeetingRecorder:* AndroidRuntime:E > selftest-result.txt
kill $MOCK 2>/dev/null
echo "===== 앱 점검 기록 ====="; cat selftest-result.txt | tail -40
echo "===== 가짜 OpenAI 서버 기록 ====="; cat mock-openai.log
fails=$( (grep -c "FAIL" selftest-result.txt; grep -c "FAIL" mock-openai.log) | paste -sd+ | bc)
passes=$( (grep -c "PASS" selftest-result.txt; grep -c "PASS" mock-openai.log) | paste -sd+ | bc)
echo "PASS=$passes FAIL=$fails"
[ "$fails" = 0 ] && [ "$passes" -ge 5 ] && echo "자동 점검 통과" && exit 0
echo "자동 점검 실패"; exit 1
