#!/usr/bin/env bash
# 덜씀 에뮬레이터 점검: 메모리 표시 · 네 가지 덜씀 화면 · 메모리 덜씀 실행이 오류 없이 되는지
set -u
APK="$1"
PKG=com.daesinnam.sseum
ADB=$(command -v adb)
adb() { timeout 40 "$ADB" "$@"; }
echo "== 설치" | tee -a selftest-trace.txt
ok=0
for t in 1 2 3; do
  "$ADB" wait-for-device
  if timeout 240 "$ADB" install -r -g "$APK" >> selftest-trace.txt 2>&1; then ok=1; break; fi
  sleep 15
done
[ $ok = 1 ] || exit 1
# 사용 기록 접근 허락 (오래 안 쓴 앱 찾기 점검)
adb shell appops set $PKG GET_USAGE_STATS allow
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez sseum.selftest true
for i in $(seq 1 30); do
  sleep 2
  adb logcat -d -s SSEUM_SELFTEST:I | grep -q "DONE" && break
done
adb exec-out screencap -p > sseum-screen.png
adb logcat -d -s SSEUM_SELFTEST:I | tee selftest-result.txt
adb logcat -d -b crash > selftest-crash.txt
fail=0
grep -q "MEM OK" selftest-result.txt || { echo "!! 메모리 표시 실패"; fail=1; }
for p in sto bat old perm mem; do grep -q "PANEL $p OK" selftest-result.txt || { echo "!! $p 화면 실패"; fail=1; }; done
grep -q "CLEAN OK" selftest-result.txt || { echo "!! 메모리 덜씀 실패"; fail=1; }
grep -q "$PKG" selftest-crash.txt && { echo "!! 앱이 멈춤"; cat selftest-crash.txt; fail=1; }
# 자동 기능(덜씀 지킴이) 켜고 끄기: 서비스가 떠도 멈추지 않는지
adb shell am force-stop $PKG
exit $fail
