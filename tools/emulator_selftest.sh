#!/usr/bin/env bash
# 에뮬레이터에 시험용 APK를 깔고 FilmCraft 웹판이 뜨는지, 미디어 가져오기와 저장 경로가 동작하는지 봅니다.
set -u
APK="$1"
PKG=com.daesinnam.filmcraft
adb install -r -g "$APK" || exit 1
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez filmcraft.selftest true
shot=0
for i in $(seq 1 120); do
  sleep 5
  [ "$i" = 6 ] && adb exec-out screencap -p > filmcraft-screen-30s.png
  if [ "$shot" = 0 ] && adb logcat -d -s FILMCRAFT_SELFTEST:I | grep -q "page started=true"; then
    sleep 8; adb exec-out screencap -p > filmcraft-screen-started.png; shot=1
  fi
  if adb logcat -d -s FILMCRAFT_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > filmcraft-screen-end.png
adb logcat -d -s FILMCRAFT_SELFTEST:I FilmCraft:* FilmCraftConsole:* > selftest-result.txt
echo "===== 점검 결과 ====="
grep FILMCRAFT_SELFTEST selftest-result.txt | tail -30
echo "===== 콘솔 (끝부분) ====="
grep -v FILMCRAFT_SELFTEST selftest-result.txt | tail -40
page=$(grep -c "FILMCRAFT_SELFTEST: page started=true" selftest-result.txt || true)
imported=$(grep -cE "FILMCRAFT_SELFTEST: import items=[1-9]" selftest-result.txt || true)
saved=$(grep -c "FILMCRAFT_SELFTEST: save ok" selftest-result.txt || true)
echo "page=$page imported=$imported saved=$saved"
if [ "$page" -ge 1 ] && [ "$imported" -ge 1 ] && [ "$saved" -ge 1 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
adb logcat -d | grep -E "AndroidRuntime|FATAL|chromium" | tail -40
exit 1
