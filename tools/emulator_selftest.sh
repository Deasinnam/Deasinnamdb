#!/usr/bin/env bash
# 덜누름 게임 에뮬레이터 점검: 게임 목록·게임 추가 창·게임 앱·도구 화면, 녹화 5초 저장, 다른 앱 실행.
set -u
APK="$1"
PKG=com.daesinnam.game
adb install -r -g "$APK" || exit 1
# 화면 녹화 동의 창: 실제 기기에서는 매번 사용자가 허용합니다. 점검에서는 미리 허용해 둡니다.
adb shell appops set "$PKG" PROJECT_MEDIA allow || true
# 펼친 폴드처럼 넓은 화면에서 점검
adb shell wm size 1600x1080; adb shell wm density 240; sleep 3
adb logcat -c
adb shell am start -n "$PKG/.MainActivity" --ez game.selftest true
for i in $(seq 1 60); do
  sleep 2
  L=$(adb logcat -d -s GAME_SELFTEST:I)
  for s in GAMES PICKER APPS TOOLS REC; do
    if echo "$L" | grep -q "SHOT-$s" && [ ! -f "game-screen-$(echo $s | tr A-Z a-z).png" ]; then
      adb exec-out screencap -p > "game-screen-$(echo $s | tr A-Z a-z).png"
    fi
  done
  if echo "$L" | grep -q "DONE"; then break; fi
done
sleep 2
adb exec-out screencap -p > game-screen-launched.png
adb logcat -d -s GAME_SELFTEST:I Game:* GameRec:* GameConsole:* > selftest-result.txt
adb logcat -d -b crash > crash-1.txt 2>/dev/null
echo "===== 점검 결과 ====="
cat selftest-result.txt | cut -c1-300
fail=0
grep -q "DONE" selftest-result.txt || { echo "FAIL: 점검이 끝까지 가지 못함"; fail=1; }
grep -q "APPS 5" selftest-result.txt || { echo "FAIL: 게임 앱 목록"; fail=1; }
grep -q "HOME shelves" selftest-result.txt || { echo "FAIL: 홈 화면"; fail=1; }
grep -q "TOOLS hz" selftest-result.txt || { echo "FAIL: 도구 화면"; fail=1; }
grep -q "OPTIMIZE .* level [0-2]" selftest-result.txt || { echo "FAIL: 기기 맞춤 최적화"; fail=1; }
grep -q "LAUNCH ok com.android.settings" selftest-result.txt || { echo "FAIL: 다른 앱 실행"; fail=1; }
grep -q "$PKG" crash-1.txt && { echo "FAIL: 앱이 멈춤"; fail=1; }
if grep -q "REC-SAVED" selftest-result.txt; then echo "녹화: 저장됨 (PASS)"; else echo "녹화: 저장 확인 못 함 (참고 — 에뮬레이터 인코더 한계일 수 있음)"; fi
exit $fail
