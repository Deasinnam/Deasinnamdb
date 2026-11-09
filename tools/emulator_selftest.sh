#!/usr/bin/env bash
# 에뮬레이터에 시험용 APK를 깔고 PhotoCraft 웹판이 뜨는지, 저장 경로가 동작하는지 봅니다.
set -u
APK="$1"
PKG=com.daesinnam.photocraft
adb install -r -g "$APK" || exit 1
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez photocraft.selftest true
for i in $(seq 1 45); do
  sleep 5
  [ "$i" = 6 ] && adb exec-out screencap -p > photocraft-screen-30s.png
  if adb logcat -d -s PHOTOCRAFT_SELFTEST:I | grep -q "DONE"; then break; fi
done
adb exec-out screencap -p > photocraft-screen-end.png
adb logcat -d -s PHOTOCRAFT_SELFTEST:I PhotoCraft:* PhotoCraftConsole:* > selftest-result.txt
echo "===== 점검 결과 ====="
cat selftest-result.txt | tail -60
page=$(grep -c "PHOTOCRAFT_SELFTEST.*page started=true" selftest-result.txt || true)
saved=$(grep -c "PHOTOCRAFT_SELFTEST.*save ok" selftest-result.txt || true)
if [ "$page" -ge 1 ] && [ "$saved" -ge 1 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패 (page=$page saved=$saved)"
adb logcat -d | grep -E "AndroidRuntime|FATAL|chromium" | tail -40
exit 1
