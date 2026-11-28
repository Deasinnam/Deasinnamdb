#!/usr/bin/env bash
# 덜누름 노트 에뮬레이터 점검: 실제 스타일러스 획 · 손가락 막기 · 지우개 · 되돌리기 · 쪽 · 저장 · 내보내기 · PDF 가져오기
set -u
APK="$1"
PKG=com.daesinnam.note
adb install -r -g "$APK" || exit 1
adb shell settings put global hide_error_dialogs 1 >/dev/null 2>&1
# 갤럭시 탭 S9을 세워 든 것과 비슷한 화면 (1600x2560, 2배 밀도)
adb shell wm size 1600x2560; adb shell wm density 320; sleep 3
adb logcat -c
adb shell am start -n "$PKG/.ListActivity" --ez note.selftest true
waitfor() { for _ in $(seq 1 "$2"); do adb logcat -d -s NOTE_SELFTEST:I | grep -q "$1" && return 0; sleep 1; done; return 1; }
waitfor READY-PEN 40 || echo "READY-PEN 없음"
sleep 1
adb exec-out screencap -p > note-screen-empty.png
# 실제 스타일러스(펜) 입력으로 한 획
adb shell input stylus swipe 300 900 1300 1150 700
if waitfor "READY-FINGER\|INFO stylus" 20; then
  if adb logcat -d -s NOTE_SELFTEST:I | grep -q READY-FINGER; then
    adb exec-out screencap -p > note-screen-ink.png
    # 펜을 쓴 뒤의 손가락 끌기: 쓰지 않고 화면만 옮겨야 함
    adb shell input touchscreen swipe 800 1700 820 1400 400
  fi
fi
waitfor DONE 60 || echo "DONE 없음"
adb shell input keyevent KEYCODE_BACK; sleep 3
adb exec-out screencap -p > note-screen-list.png
adb logcat -d -s NOTE_SELFTEST:I Note:* > selftest-result.txt
adb logcat -d -b crash > crash-1.txt 2>/dev/null
adb shell wm size reset; adb shell wm density reset
echo "===== 점검 결과 ====="
grep NOTE_SELFTEST selftest-result.txt | cut -c1-300
echo "===== crash ====="; head -40 crash-1.txt
pass=$(grep -c "NOTE_SELFTEST: PASS" selftest-result.txt || true)
failn=$(grep -c "NOTE_SELFTEST: FAIL" selftest-result.txt || true)
echo "PASS=$pass FAIL=$failn"
if grep -q "NOTE_SELFTEST: DONE" selftest-result.txt && [ "$pass" -ge 9 ] && [ "$failn" = 0 ] && ! grep -q "$PKG" crash-1.txt; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
adb logcat -d | grep -E "AndroidRuntime|FATAL" | tail -30
exit 1
