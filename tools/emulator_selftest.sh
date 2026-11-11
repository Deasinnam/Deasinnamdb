#!/usr/bin/env bash
# 덜누름 브라우저 에뮬레이터 점검:
#  1) 시험용 빌드: 위쪽 줄 높이, PC 사용자 에이전트, PC 화면 폭, 클라이언트 힌트(모바일 아님)
#  2) 배포용 빌드(코드 줄이기 적용): 켜지고 꺼지지 않는지
set -u
DEBUG_APK="$1"
RELEASE_APK="${2:-}"
PKG=com.daesinnam.browser
fail=0

adb install -r -g "$DEBUG_APK" || exit 1
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez browser.selftest true --es browser.url "https://example.com/"
for i in $(seq 1 40); do
  sleep 3
  if adb logcat -d -s BROWSER_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > browser-screen-test.png
adb logcat -d -s BROWSER_SELFTEST:I > selftest-result.txt
echo "===== 점검 결과 ====="
sed 's/^.*BROWSER_SELFTEST: //' selftest-result.txt | cut -c1-300
pass=$(grep -c "BROWSER_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "BROWSER_SELFTEST: FAIL" selftest-result.txt || true)
skip=$(grep -c "BROWSER_SELFTEST: SKIP page load" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn"
if ! grep -q "BROWSER_SELFTEST: DONE" selftest-result.txt || [ "$failn" != 0 ]; then fail=1; fi
if [ "$skip" = 0 ] && [ "$pass" -lt 3 ]; then fail=1; fi
if [ "$skip" != 0 ]; then echo "참고: 에뮬레이터에서 시험 페이지를 불러오지 못해 화면 배치만 확인했습니다"; fi

# 실제 첫 화면(네이버)이 PC 화면으로 뜨는 모습 (기록용)
adb shell am force-stop "$PKG"
adb shell am start -n "$PKG/.MainActivity" >/dev/null
sleep 20
adb exec-out screencap -p > browser-screen-home.png

if [ -n "$RELEASE_APK" ] && [ -f "$RELEASE_APK" ]; then
  echo "===== 배포용 빌드 ====="
  adb uninstall "$PKG" >/dev/null
  adb install -g "$RELEASE_APK" || fail=1
  adb logcat -c
  adb shell am start -n "$PKG/.MainActivity" >/dev/null
  sleep 20
  adb exec-out screencap -p > browser-screen-release.png
  if adb shell pidof "$PKG" >/dev/null && ! adb logcat -d | grep -A3 "FATAL EXCEPTION" | grep -q "$PKG"; then
    echo "배포용 빌드: 켜져 있음, 오류 없음"
  else
    echo "배포용 빌드 실패 (꺼졌거나 오류)"; adb logcat -d | grep -B2 -A25 "FATAL EXCEPTION" | tail -60; fail=1
  fi
  adb logcat -d > logcat-release.txt
fi
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
adb logcat -d | grep -E "AndroidRuntime|FATAL" | tail -30
exit 1
