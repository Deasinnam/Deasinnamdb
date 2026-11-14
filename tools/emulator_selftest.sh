#!/usr/bin/env bash
# 덜누름 브라우저 에뮬레이터 점검:
#  1) 시험용 빌드: 위쪽 줄 높이, PC 사용자 에이전트, PC 화면 폭, 클라이언트 힌트(모바일 아님),
#     파일 받기(스크립트로 만든 파일 + 일반 HTTPS 파일)
#  2) 배포용 빌드(코드 줄이기 적용): 켜지고 꺼지지 않는지
set -u
DEBUG_APK="$1"
RELEASE_APK="${2:-}"
PKG=com.daesinnam.browser
fail=0

adb install -r -g "$DEBUG_APK" || exit 1
# 에뮬레이터가 막 켜진 직후에는 인터넷(이름 찾기)이 아직 안 될 수 있어 잠시 기다립니다
for i in $(seq 1 30); do
  if adb shell ping -c 1 -W 2 example.com >/dev/null 2>&1; then echo "인터넷 연결 확인 (${i}번째 시도)"; break; fi
  sleep 3
done
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez browser.selftest true --es browser.url "https://example.com/"
for i in $(seq 1 80); do
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
echo "===== 다운로드 폴더 ====="
adb shell ls -la /sdcard/Download/ | tee -a selftest-result.txt
dl=$(grep -c "BROWSER_SELFTEST: PASS download" selftest-result.txt || true)
if [ "$dl" -lt 2 ]; then echo "파일 받기 점검 실패 (통과 $dl/2)"; fail=1; fi
if ! grep -q "BROWSER_SELFTEST: DONE" selftest-result.txt || [ "$failn" != 0 ]; then fail=1; fi
if [ "$pass" -lt 3 ]; then fail=1; fi
if [ "$skip" != 0 ]; then echo "에뮬레이터에서 시험 페이지를 불러오지 못해 PC 모드를 확인하지 못했습니다 (다시 돌려야 함)"; fail=1; fi

# 구글 로그인 점검: 유튜브 스튜디오 → 구글 로그인 화면 → "안전하지 않은 브라우저" 차단이 나오지 않는지
echo "===== 구글 로그인 (유튜브 스튜디오) ====="
adb shell am force-stop "$PKG"
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez browser.selftest true --ez browser.google true --es browser.url "https://studio.youtube.com/" >/dev/null
for i in $(seq 1 50); do
  sleep 3
  if adb logcat -d -s BROWSER_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > browser-screen-google.png
adb logcat -d -s BROWSER_SELFTEST:I > google-result.txt
sed 's/^.*BROWSER_SELFTEST: //' google-result.txt | cut -c1-500
cat google-result.txt >> selftest-result.txt
if grep -q "BROWSER_SELFTEST: FAIL" google-result.txt; then echo "구글 로그인이 차단됨"; fail=1; fi
if ! grep -q "BROWSER_SELFTEST: PASS google" google-result.txt; then echo "구글 로그인 진행을 확인하지 못함 (기록 확인 필요)"; fi

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
