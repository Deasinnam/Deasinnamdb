#!/usr/bin/env bash
# 에뮬레이터에 시험용 APK를 깔고 자동 점검을 돌립니다. 결과는 selftest-*.txt 로 남깁니다.
# 성공 조건: 문서 엔진(Node)이 뜨고, 6개 편집기가 모두 "ok"를 보고.
set -u
APK="$1"
PKG=com.daesinnam.ieum
adb install -r -g "$APK" || exit 1
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez ieum.selftest true
for i in $(seq 1 60); do
  sleep 5
  if adb logcat -d -s IEUM_SELFTEST:I | grep -q "DONE all"; then break; fi
done
adb logcat -d -s IEUM_SELFTEST:I IeumNode:* > selftest-result.txt
adb logcat -d > selftest-full.txt
echo "===== 점검 결과 ====="
grep -E "IEUM_SELFTEST" selftest-result.txt || true
echo "===== 문서 엔진 기록 (끝부분) ====="
grep IeumNode selftest-result.txt | tail -40 || true
ok=$(grep -c "IEUM_SELFTEST.* ok " selftest-result.txt || true)
if grep -q "DONE all" selftest-result.txt && [ "$ok" -ge 6 ]; then
  echo "자동 점검 통과 ($ok/6)"
  exit 0
fi
echo "자동 점검 실패 ($ok/6)"
grep -E "AndroidRuntime|FATAL|chromium" selftest-full.txt | tail -40 || true
exit 1
