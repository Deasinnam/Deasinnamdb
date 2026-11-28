#!/usr/bin/env bash
# 덜누름 덱스 에뮬레이터 점검: 태블릿 크기 화면 + 자유 창 + 가짜 외부 모니터(오버레이 화면)에서
#  ① 바탕화면 · 앱 서랍 · 덱스 설정 · 메뉴 화면  ② 설정 앱이 실제로 '창'으로 뜨는지  ③ 모니터에 덱스 화면이 따로 뜨는지
set -u
APK="$1"; PKG=com.daesinnam.dex
log() { echo "$*" | tee -a selftest-result.txt; }
: > selftest-result.txt
shot() { timeout 15 adb exec-out screencap -p > "dex-screen-$1.png" 2>/dev/null; }

# 태블릿처럼: 가로 2000×1200, 자유 창 · 외부 모니터 데스크톱 켜고 가짜 모니터(1280×720) 붙이기 → 다시 시작
adb shell settings put global enable_freeform_support 1
adb shell settings put global force_resizable_activities 1
adb shell settings put global force_desktop_mode_on_external_displays 1
adb shell settings put global overlay_display_devices 1280x720/160
adb reboot
timeout 300 adb wait-for-device
for i in $(seq 1 90); do [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break; sleep 3; done
sleep 8
adb shell wm size 2000x1200; adb shell wm density 240
adb shell settings put system user_rotation 1 2>/dev/null; adb shell settings put system accelerometer_rotation 0
adb shell input keyevent KEYCODE_WAKEUP; adb shell wm dismiss-keyguard 2>/dev/null; sleep 2

adb install -r -g "$APK" || { log "FAIL install"; exit 1; }
# 홈 앱으로 지정 (모니터의 보조 홈도 우리 앱이 맡도록)
adb shell cmd package set-home-activity $PKG/.MainActivity >/dev/null 2>&1 || true
adb logcat -c
adb shell am start -n $PKG/.MainActivity --ez dex.selftest true
for i in $(seq 1 60); do
  sleep 1.5
  L=$(timeout 15 adb logcat -d -s DEX_SELFTEST:I)
  for s in DESK DRAWER SETUP MENU; do
    f=dex-screen-$(echo $s | tr A-Z a-z).png
    if echo "$L" | grep -q "SHOT-$s" && [ ! -f "$f" ]; then sleep 0.8; shot $(echo $s | tr A-Z a-z); fi
  done
  if echo "$L" | grep -q "SHOT-WINDOW" && [ ! -f dex-screen-window.png ]; then sleep 3; shot window; fi
  echo "$L" | grep -q "DONE" && break
done
sleep 2
timeout 20 adb logcat -d -s DEX_SELFTEST:I Dex:* DexConsole:* > logcat-dex.txt
timeout 20 adb logcat -d -b crash > crash.txt 2>/dev/null
timeout 20 adb shell dumpsys activity activities > activities.txt 2>/dev/null
timeout 20 adb shell dumpsys display > displays.txt 2>/dev/null

# 모니터 화면 찍기 (오버레이 화면의 SurfaceFlinger 번호로)
SFID=$(timeout 10 adb shell dumpsys SurfaceFlinger --display-id 2>/dev/null | tr -d '\r' | sed -n 's/^Display \([0-9]*\).*/\1/p' | sed -n 2p)
[ -n "$SFID" ] && timeout 15 adb exec-out screencap -d "$SFID" -p > dex-screen-monitor.png 2>/dev/null

echo "===== 점검 ====="
grep -q "DONE" logcat-dex.txt && log "PASS 화면 흐름 끝까지 (바탕화면 → 서랍 → 설정 → 메뉴 → 앱 열기)" || log "FAIL 화면 흐름이 끝나지 않음"
grep -o 'READY .*' logcat-dex.txt | cut -c1-300 | sed 's/^/INFO /' | tee -a selftest-result.txt
grep -q '"freeform":true' logcat-dex.txt && log "PASS 덱스가 자유 창 켜짐을 알아봄" || log "FAIL 자유 창 켜짐을 알아보지 못함"
grep -o 'LAUNCH com.android.settings .*' logcat-dex.txt | head -1 | cut -c1-200 | sed 's/^/INFO /' | tee -a selftest-result.txt
if grep -B2 -A40 "com.android.settings" activities.txt | grep -q "mWindowingMode=freeform\|windowingMode=freeform\|freeform"; then log "PASS 설정 앱이 창(자유 창)으로 열림"; else log "FAIL 설정 앱이 창으로 열리지 않음"; fi
NDISP=$(grep -c "mDisplayId=" displays.txt)
if grep -q "DisplayHomeActivity" activities.txt; then log "PASS 모니터(보조 화면)에 덱스 화면이 따로 뜸"; else log "WARN 모니터에 덱스 화면을 확인하지 못함 (에뮬레이터 가짜 모니터 한계일 수 있음)"; fi
grep -q "$PKG" crash.txt && { log "FAIL 앱이 멈춤"; grep -A12 "$PKG" crash.txt | head -30 | tee -a selftest-result.txt; }
grep -q "^FAIL" selftest-result.txt && exit 1
exit 0
