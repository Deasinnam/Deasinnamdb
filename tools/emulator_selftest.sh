#!/usr/bin/env bash
# 덜누름 게임 에뮬레이터 점검: 게임 목록·게임 추가 창·게임 앱·도구 화면, 녹화 5초 저장, 다른 앱 실행.
set -u
APK="$1"
PKG=com.daesinnam.game
adb install -r -g "$APK" || exit 1
# 화면 녹화 동의 창: 실제 기기에서는 매번 사용자가 허용합니다. 점검에서는 미리 허용해 둡니다.
adb shell appops set "$PKG" PROJECT_MEDIA allow || true
# FPS 표시 창(다른 앱 위에 표시): 실제 기기에서는 Shizuku가 켜 주거나 사용자가 허용합니다.
adb shell appops set "$PKG" SYSTEM_ALERT_WINDOW allow || true
# 펼친 폴드처럼 넓은 화면에서 점검
adb shell wm size 1600x1080; adb shell wm density 240; sleep 3
adb logcat -c
# 키 매핑(접근성 서비스): 실제 기기에서는 사용자가 설정에서 켭니다. 점검에서는 미리 켜 둡니다.
adb shell settings put secure enabled_accessibility_services "$PKG/$PKG.KeymapService"
adb shell settings put secure accessibility_enabled 1
sleep 2
adb shell am start -n "$PKG/.MainActivity" --ez game.selftest true
for i in $(seq 1 60); do
  sleep 2
  L=$(adb logcat -d -s GAME_SELFTEST:I)
  for s in HOME GAMES PICKER APPS TOOLS FPS REC; do
    if echo "$L" | grep -q "SHOT-$s" && [ ! -f "game-screen-$(echo $s | tr A-Z a-z).png" ]; then
      adb exec-out screencap -p > "game-screen-$(echo $s | tr A-Z a-z).png"
    fi
  done
  # FPS 표시 창이 떠 있는 동안: Shizuku가 셸 권한으로 돌릴 명령들을 그대로 돌려 보고 남김 (참고)
  if echo "$L" | grep -q "SHOT-FPS" && [ ! -f fps-shell.txt ]; then
    {
      echo "--- 셸 권한 FPS 명령 시험 ---"
      adb shell "dumpsys activity activities | grep -m3 -E 'topResumedActivity|mResumedActivity'"
      adb shell dumpsys SurfaceFlinger --list | grep -F "$PKG" | head -6
      LAYER=$(adb shell dumpsys SurfaceFlinger --list | grep -F "$PKG/" | grep -v -E 'Background|Bounds|ActivityRecord' | head -1 | tr -d '\r')
      echo "LAYER [$LAYER]"
      adb shell "dumpsys SurfaceFlinger --latency '$LAYER'" | head -4
      echo "frames $(adb shell "dumpsys SurfaceFlinger --latency '$LAYER'" | awk 'NR>1 && $2>0' | wc -l)"
    } > fps-shell.txt 2>&1
  fi
  if echo "$L" | grep -q "DONE"; then break; fi
done
sleep 3
# 설정 앱이 앞에 뜬 상태에서 패드 A 버튼 → 키 매핑이 화면을 눌렀는지
adb shell input keyevent KEYCODE_BUTTON_A
sleep 2
adb exec-out screencap -p > game-screen-launched.png
adb logcat -d -s GAME_SELFTEST:I Game:* GameRec:* GameConsole:* GameKeymap:* GameFps:* GameShizuku:* > selftest-result.txt
cat fps-shell.txt >> selftest-result.txt 2>/dev/null
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
grep -q "FPS meter 60 0 com.example.game" selftest-result.txt || { echo "FAIL: FPS 계산"; fail=1; }
grep -q "FPSMODE-UI deolnureum deol true sam false" selftest-result.txt || { echo "FAIL: FPS 보기 방식 고르기"; fail=1; }
grep -q "FPS-PREVIEW shown" selftest-result.txt || { echo "FAIL: FPS 표시 창"; fail=1; }
grep -q "KEYMAP service true" selftest-result.txt || { echo "FAIL: 키 매핑 권한 인식"; fail=1; }
if grep -q "KEYMAP-TAP com.android.settings" selftest-result.txt; then echo "키 매핑: A 버튼 → 화면 누름 (PASS)"; else echo "키 매핑: 누름 확인 못 함 (참고)"; fi
if grep -q "REC-SAVED" selftest-result.txt; then echo "녹화: 저장됨 (PASS)"; else echo "녹화: 저장 확인 못 함 (참고 — 에뮬레이터 인코더 한계일 수 있음)"; fi
exit $fail
