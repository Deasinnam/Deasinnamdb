#!/usr/bin/env bash
# 덜누름 워크 에뮬레이터 자동 점검: 첫 화면 → 문서 편집 6종 → 사진 편집 → 동영상 편집.
# 결과는 selftest-*.txt, 화면은 work-screen-*.png 로 남깁니다.
set -u
APK="$1"
PKG=com.daesinnam.work
adb install -r -g "$APK" || exit 1
fail=0

# ---------- 첫 화면 ----------
adb logcat -c
adb shell am start -n "$PKG/.HomeActivity"
sleep 10
adb exec-out screencap -p > work-screen-home.png
adb shell am force-stop "$PKG"

# ---------- 문서 편집 (6개 편집기 + 문서 엔진 + 엑셀 엔진) ----------
adb logcat -c
adb shell am start -n "$PKG/.OfficeActivity" --ez ieum.selftest true
for i in $(seq 1 60); do
  sleep 5
  if adb logcat -d -s IEUM_SELFTEST:I | grep -q "DONE all"; then break; fi
done
adb exec-out screencap -p > work-screen-office.png
# 떠 있는 "홈" 버튼이 있는지, 누르면 첫 화면으로 가는지
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb shell cat /sdcard/ui.xml > ui-office.xml 2>/dev/null
if grep -q '덜누름 워크 첫 화면으로' ui-office.xml; then
  B=$(grep -o 'content-desc="덜누름 워크 첫 화면으로"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' ui-office.xml | grep -o '\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]' | tr '[],' '   ')
  set -- $B; adb shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 )); sleep 3
  if adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity" | grep -q HomeActivity; then echo "홈 버튼 통과"; else echo "홈 버튼 실패 (첫 화면으로 가지 않음)"; fail=1; fi
  adb exec-out screencap -p > work-screen-home-after.png
else
  echo "홈 버튼 실패 (버튼 없음)"; fail=1
fi
adb logcat -d -s IEUM_SELFTEST:I IeumNode:* > selftest-office.txt
echo "===== 문서 편집 ====="
grep -E "IEUM_SELFTEST" selftest-office.txt || true
ok=$(grep -c "IEUM_SELFTEST.* ok " selftest-office.txt || true)
if grep -q "DONE all" selftest-office.txt && [ "$ok" -ge 6 ]; then echo "문서 편집 통과 ($ok/6)"; else
  echo "문서 편집 실패 ($ok/6)"; fail=1
  grep IeumNode selftest-office.txt | tail -40
  adb logcat -d -b crash | tail -40
fi
adb shell am force-stop "$PKG"

# ---------- 사진 편집 ----------
adb logcat -c
adb shell am start -n "$PKG/.PhotoActivity" --ez photo.selftest true
for i in $(seq 1 45); do
  sleep 5
  [ "$i" = 8 ] && adb exec-out screencap -p > work-screen-photo.png
  if adb logcat -d -s PHOTO_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > work-screen-photo-end.png
adb logcat -d -s PHOTO_SELFTEST:I Work-photo:* Work-photoConsole:* > selftest-photo.txt
echo "===== 사진 편집 ====="
grep PHOTO_SELFTEST selftest-photo.txt | cut -c1-400 || true
if grep -qE "PHOTO_SELFTEST: page .*started=true" selftest-photo.txt && grep -q "PHOTO_SELFTEST: save ok" selftest-photo.txt; then
  echo "사진 편집 통과"; else echo "사진 편집 실패"; fail=1; tail -30 selftest-photo.txt; fi
adb shell am force-stop "$PKG"

# ---------- 동영상 편집 ----------
adb logcat -c
adb shell am start -n "$PKG/.FilmActivity" --ez film.selftest true
for i in $(seq 1 60); do
  sleep 5
  if adb logcat -d -s FILM_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > work-screen-film.png
adb logcat -d -s FILM_SELFTEST:I Work-film:* Work-filmConsole:* > selftest-film.txt
echo "===== 동영상 편집 ====="
grep FILM_SELFTEST selftest-film.txt | cut -c1-400 || true
saved=$(grep -c "FILM_SELFTEST: save ok" selftest-film.txt || true)
if grep -qE "FILM_SELFTEST: page .*started=true" selftest-film.txt && grep -qE "FILM_SELFTEST: import items=[1-9]" selftest-film.txt && [ "$saved" -ge 1 ]; then
  echo "동영상 편집 통과"
elif grep -q "FILM_SELFTEST: load wasmLoaded=true gpuLimit=true" selftest-film.txt && [ "$saved" -ge 1 ]; then
  # 에뮬레이터 GPU 텍스처 한도(4096) < 편집기 요구(8192): 앱 연결만 확인, 편집기 동작은 크롬 점검이 맡음
  echo "동영상 편집 통과 (에뮬레이터 GPU 한도: 앱 연결만 확인)"
else
  echo "동영상 편집 실패"; fail=1; tail -30 selftest-film.txt
fi

adb logcat -d > selftest-full.txt
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
grep -E "AndroidRuntime|FATAL" selftest-full.txt | tail -40 || true
exit 1
