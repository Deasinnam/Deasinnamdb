#!/usr/bin/env bash
# 덜누름 워크 에뮬레이터 자동 점검: 첫 화면 → 문서 편집 6종 → 사진 편집 → 동영상 편집.
# 결과는 selftest-*.txt, 화면은 work-screen-*.png 로 남깁니다.
set -u
APK="$1"
MODE="${2:-all}"   # all | office (문서 편집만)
SUF="${3:-}"       # 기록 파일 이름 뒤에 붙일 표시 (예: -api36)
PKG=com.daesinnam.work
adb install -r -g "$APK" || exit 1
fail=0

# ---------- 첫 화면 ----------
adb logcat -c
adb shell am start -n "$PKG/.HomeActivity"
sleep 10
adb exec-out screencap -p > work-screen-home${SUF}.png
adb shell am force-stop "$PKG"

# ---------- 문서 편집 (6개 편집기 + 문서 엔진 + 엑셀 엔진) ----------
adb logcat -c
adb shell am start -n "$PKG/.OfficeActivity" --ez ieum.selftest true
for i in $(seq 1 60); do
  sleep 5
  if adb logcat -d -s IEUM_SELFTEST:I | grep -q "DONE all"; then break; fi
done
adb exec-out screencap -p > work-screen-office${SUF}.png
# 떠 있는 "홈" 버튼이 있는지, 누르면 첫 화면으로 가는지
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb shell cat /sdcard/ui.xml > ui-office.xml 2>/dev/null
if grep -q '덜누름 워크 첫 화면으로' ui-office.xml; then
  B=$(grep -o 'content-desc="덜누름 워크 첫 화면으로"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' ui-office.xml | grep -o '\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]' | tr '[],' '   ')
  set -- $B; adb shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 )); sleep 3
  if adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity" | grep -q HomeActivity; then echo "홈 버튼 통과"; else echo "홈 버튼 실패 (첫 화면으로 가지 않음)"; fail=1; fi
  adb exec-out screencap -p > work-screen-home-after${SUF}.png
else
  echo "홈 버튼 실패 (버튼 없음)"; fail=1
fi
adb logcat -d -s IEUM_SELFTEST:I IeumNode:* > selftest-office${SUF}.txt
echo "===== 문서 편집 ====="
grep -E "IEUM_SELFTEST" selftest-office${SUF}.txt || true
ok=$(grep -c "IEUM_SELFTEST.* ok " selftest-office${SUF}.txt || true)
if grep -q "DONE all" selftest-office${SUF}.txt && [ "$ok" -ge 6 ]; then echo "문서 편집 통과 ($ok/6)"; else
  echo "문서 편집 실패 ($ok/6)"; fail=1
  grep IeumNode selftest-office${SUF}.txt | tail -40
  adb logcat -d -b crash | tail -40
fi
adb shell am force-stop "$PKG"

# ---------- 사람이 누르는 길 그대로: 첫 화면 → 문서 → 새 워드·엑셀·파워포인트·마인드맵 ----------
# (위의 점검은 견본 문서를 바로 여는 길이라, 첫 화면을 거쳐 "새로 만들기"를 누르는 길은 따로 확인합니다)
page_wait() {  # $1 모듈, $2 최대 횟수(3초 단위)
  for i in $(seq 1 "$2"); do
    sleep 3
    if adb logcat -d -s IEUM_PAGE:I | grep -q "IEUM_PAGE: $1 settled"; then return 0; fi
    if adb logcat -d -s IEUM_PAGE:I | grep -qE "IEUM_PAGE: (home open-fail|$1 (stuck|session-lost))"; then return 1; fi
  done
  return 1
}
page_check() {  # $1 모듈, $2 설명
  local line n
  line=$(adb logcat -d -s IEUM_PAGE:I | grep "IEUM_PAGE: $1 settled" | tail -1)
  n=$(echo "$line" | grep -o "text=[0-9]*" | cut -d= -f2)
  if echo "$line" | grep -q "settled node=true" && [ "${n:-0}" -gt 40 ]; then echo "$2 통과: ${line##*IEUM_PAGE: }"; return 0; fi
  echo "$2 실패: ${line##*IEUM_PAGE: }"
  adb logcat -d -s IEUM_PAGE:I IeumNode:I | tail -25
  return 1
}
adb logcat -c
adb shell am start -n "$PKG/.HomeActivity" >/dev/null
sleep 6
echo "===== 새 문서 (첫 화면을 거쳐 누르는 길) ====="
for m in docs sheets slides mindmap; do
  adb logcat -c
  adb shell am start -n "$PKG/.OfficeActivity" --es ieum.flow "$m" >/dev/null
  page_wait "$m" 40
  adb exec-out screencap -p > "work-screen-new-$m${SUF}.png"
  adb logcat -d -s IEUM_PAGE:I IeumNode:I >> "selftest-flow${SUF}.txt"
  page_check "$m" "새 문서 $m" || fail=1
done
# 문서 화면을 닫았다가(문서 엔진이 멈춘 뒤) 다시 들어가서 열기
adb shell am start -n "$PKG/.OfficeActivity" --es ieum.flow none >/dev/null; sleep 5   # 문서 첫 화면으로
adb shell input keyevent BACK; sleep 28                                              # 문서 화면 닫기 → 20초 뒤 엔진 멈춤
left=$(adb shell ps -A 2>/dev/null | grep -c "libnode.so" || true)
if [ "${left:-0}" -gt 0 ]; then echo "문서 화면을 닫아도 문서 엔진이 꺼지지 않음 ($left)"; fail=1; else echo "문서 화면 닫으면 엔진 꺼짐 통과"; fi
adb logcat -c
adb shell am start -n "$PKG/.OfficeActivity" --es ieum.flow docs >/dev/null
page_wait docs 40
adb logcat -d -s IEUM_PAGE:I IeumNode:I >> "selftest-flow${SUF}.txt"
page_check docs "닫았다 다시 열기" || fail=1
# 앱 안 "문제 진단"이 끝까지 돌고 모두 통과하는지
adb logcat -c
adb shell am start -n "$PKG/.OfficeActivity" --es ieum.flow diag >/dev/null
for i in $(seq 1 50); do sleep 3; if adb logcat -d -s IEUM_DIAG:I | grep -q "결과:"; then break; fi; done
adb exec-out screencap -p > "work-screen-diag${SUF}.png"
adb logcat -d -s IEUM_DIAG:I | sed 's/^.*IEUM_DIAG: //' > "selftest-diag${SUF}.txt"
echo "===== 문제 진단 ====="
cat "selftest-diag${SUF}.txt"
if grep -q "결과: 모두 통과" "selftest-diag${SUF}.txt"; then echo "문제 진단 통과"; else echo "문제 진단 실패"; fail=1; fi
# 문서 엔진이 하나만 떠 있는지 (꺼지지 않고 남는 것이 없어야 함)
engines=$(adb shell ps -A 2>/dev/null | grep -c "libnode.so" || true)
echo "떠 있는 문서 엔진: $engines"
if [ "${engines:-0}" -gt 1 ]; then echo "문서 엔진이 여러 개 남아 있음"; fail=1; fi
# 덮어 설치(업데이트) 뒤에도 열리는지: 설치 위치가 바뀌면 예전 라이브러리 링크가 끊어집니다
# (실제 휴대폰에서 "라이브러리 폴더를 만들 수 없습니다"로 문서 엔진이 뜨지 않던 경우)
before=$(adb shell pm path "$PKG" | head -1)
adb install -r -g "$APK" >/dev/null || fail=1
after=$(adb shell pm path "$PKG" | head -1)
if [ "$before" = "$after" ]; then echo "참고: 덮어 설치해도 설치 위치가 그대로임"; else echo "설치 위치 바뀜 (업데이트 상황)"; fi
adb logcat -c
adb shell am start -n "$PKG/.HomeActivity" >/dev/null; sleep 5
adb shell am start -n "$PKG/.OfficeActivity" --es ieum.flow docs >/dev/null
page_wait docs 40
adb logcat -d -s IEUM_PAGE:I IeumNode:I >> "selftest-flow${SUF}.txt"
page_check docs "덮어 설치 뒤 열기" || fail=1
adb shell am force-stop "$PKG"

if [ "$MODE" = office ]; then
  adb logcat -d > "selftest-full${SUF}.txt"
  if [ "$fail" = 0 ]; then echo "자동 점검 통과 (문서 편집)"; exit 0; fi
  echo "자동 점검 실패 (문서 편집)"; exit 1
fi

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

adb logcat -d > selftest-full${SUF}.txt
if [ "$fail" = 0 ]; then echo "자동 점검 통과"; exit 0; fi
echo "자동 점검 실패"
grep -E "AndroidRuntime|FATAL" selftest-full${SUF}.txt | tail -40 || true
exit 1
