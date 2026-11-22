#!/usr/bin/env bash
# 덜누름 테이블오더 에뮬레이터 점검:
#  1) 시험용 빌드: 카운터 서버 켜기 · 주문(가격 다시 계산) · 사장님 열쇠 · 품절 거절 · 상태 반영 · 바로 깨어나기 · 사진 올리기 · 와이파이 주소로 접속
#     + 화면 기록(카운터 주문판 · 테이블 주문 화면 · 장바구니 · 처음 화면)
#  2) 배포용 빌드(코드 줄이기 적용): 켜지고 꺼지지 않는지
set -u
DEBUG_APK="$1"
RELEASE_APK="${2:-}"
PKG=com.daesinnam.tableorder
fail=0
adb install -r -g "$DEBUG_APK" || exit 1
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez to.selftest true
shot=""
for i in $(seq 1 200); do
  sleep 1
  for s in admin table cart cafe korean detail start; do
    if [ "${shot#*$s}" = "$shot" ] && adb logcat -d -s TO_SELFTEST:I | grep -q "SHOT $s"; then
      sleep 1; adb exec-out screencap -p > "tableorder-screen-$s.png"; shot="$shot $s"
    fi
  done
  if adb logcat -d -s TO_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb logcat -d -s TO_SELFTEST:I > selftest-result.txt
echo "===== 점검 결과 ====="
sed 's/^.*TO_SELFTEST: //' selftest-result.txt | cut -c1-300
pass=$(grep -c "TO_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "TO_SELFTEST: FAIL" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn"
if ! grep -q "TO_SELFTEST: DONE" selftest-result.txt || [ "$failn" != 0 ] || [ "$pass" -lt 26 ]; then fail=1; fi
if adb logcat -d | grep -A3 "FATAL EXCEPTION" | grep -q "$PKG"; then echo "시험용 빌드가 꺼졌습니다"; adb logcat -d | grep -A25 "FATAL EXCEPTION" | tail -40; fail=1; fi

if [ -n "$RELEASE_APK" ] && [ -f "$RELEASE_APK" ]; then
  echo "===== 배포용 빌드 ====="
  adb uninstall "$PKG" >/dev/null
  adb install -g "$RELEASE_APK" || fail=1
  adb logcat -c
  adb shell am start -n "$PKG/.MainActivity" --ez to.selftest true >/dev/null
  for i in $(seq 1 60); do sleep 1; adb logcat -d -s TO_SELFTEST:I | grep -q "SHOT table" && break; done
  sleep 5
  adb exec-out screencap -p > tableorder-screen-release.png
  rp=$(adb logcat -d -s TO_SELFTEST:I | grep -c "PASS" || true)
  rf=$(adb logcat -d -s TO_SELFTEST:I | grep -c "FAIL" || true)
  if adb shell pidof "$PKG" >/dev/null && [ "$rf" = 0 ] && [ "$rp" -ge 12 ]; then
    echo "배포용 빌드: 켜져 있음, 점검 통과 ($rp)"
  else
    echo "배포용 빌드 실패 (PASS=$rp FAIL=$rf)"; adb logcat -d -s TO_SELFTEST:I | tail -30; adb logcat -d | grep -B2 -A25 "FATAL EXCEPTION" | tail -60; fail=1
  fi
fi
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
adb logcat -d | grep -E "AndroidRuntime|FATAL|TableOrder" | tail -40
exit 1
