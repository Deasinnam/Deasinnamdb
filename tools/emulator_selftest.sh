#!/usr/bin/env bash
# 덜누름 벤치 에뮬레이터 점검: 빠른 측정을 처음부터 끝까지 돌리고 화면 · 기록을 남깁니다.
set -u
APK="$1"
PKG=com.daesinnam.bench
adb install -r -g "$APK" || exit 1
sleep 2
adb logcat -c
# 기록을 실시간으로 파일에 받아 둡니다 (에뮬레이터가 중간에 꺼져도 어디까지 갔는지 남도록)
adb logcat -v time BENCH_SELFTEST:I Bench:* BenchConsole:* AndroidRuntime:E ActivityManager:I lowmemorykiller:* DEBUG:* '*:F' > logcat-live.txt 2>&1 &
LOGPID=$!
adb shell am start -n "$PKG/.MainActivity" --ez bench.selftest true
for i in $(seq 1 150); do
  sleep 2
  if ! timeout 10 adb get-state >/dev/null 2>&1; then echo "에뮬레이터 연결 끊김 ($((i*2))초)"; echo "DEVICE-LOST at ${i}" >> logcat-live.txt; break; fi
  L=$(timeout 15 adb logcat -d -s BENCH_SELFTEST:I)
  for s in HOME RESULT DETAIL DETAIL2; do
    if echo "$L" | grep -q "SHOT-$s\$\|SHOT-$s\r\?$" && [ ! -f "bench-screen-$(echo $s | tr A-Z a-z).png" ]; then
      sleep 1; timeout 15 adb exec-out screencap -p > "bench-screen-$(echo $s | tr A-Z a-z).png"
    fi
  done
  # 측정 중 화면 (창 · 그래픽 · 계기판 시험이 돌 때)
  if echo "$L" | grep -q "CAT audio" && [ ! -f bench-screen-run1.png ]; then sleep 2; timeout 15 adb exec-out screencap -p > bench-screen-run1.png; fi
  if echo "$L" | grep -q "CAT web" && [ ! -f bench-screen-run2.png ]; then sleep 3; timeout 15 adb exec-out screencap -p > bench-screen-run2.png; fi
  if echo "$L" | grep -q "DONE"; then break; fi
done
kill $LOGPID 2>/dev/null
timeout 20 adb logcat -d -s BENCH_SELFTEST:I Bench:* BenchConsole:* > selftest-result.txt || cp logcat-live.txt selftest-result.txt
timeout 20 adb logcat -d -b crash > crash-1.txt 2>/dev/null
[ -s selftest-result.txt ] || cp logcat-live.txt selftest-result.txt
echo "----- 실시간 기록 끝부분 -----"; tail -40 logcat-live.txt | cut -c1-300
echo "===== 점검 결과 ====="
cut -c1-400 selftest-result.txt
fail=0
grep -q "DONE" selftest-result.txt || { echo "FAIL: 측정이 끝까지 가지 못함"; fail=1; }
for c in doc photo audio desk video web game ai speed; do
  grep -q "CAT $c " selftest-result.txt || { echo "FAIL: $c 분야 결과 없음"; fail=1; }
done
grep -q "TOTAL [0-9]" selftest-result.txt || { echo "FAIL: 총점 없음"; fail=1; }
grep -q "$PKG" crash-1.txt && { echo "FAIL: 앱이 멈춤"; fail=1; }
grep -q "ERROR" selftest-result.txt && echo "참고: 측정 중 오류가 있었음 (위 기록 확인)"
exit $fail
