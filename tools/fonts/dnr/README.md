# 덜누름 워크 문서 편집 글꼴 (모두 무료 공개 글꼴)

안드로이드 WebView 안의 문서 편집기는 PC처럼 설치된 글꼴을 쓸 수 없어, 고를 수 있는 글꼴이 적고
워드·한글 문서의 바탕·굴림·궁서 같은 글꼴이 모두 기본 고딕으로 보였습니다.
이 폴더의 글꼴을 앱에 넣어 해결합니다(`tools/dnr_fonts.py`가 빌드 때 `assets/www/fonts/dnr/`에 넣음).

**모든 글꼴은 SIL Open Font License 1.1(OFL)** 입니다. 상업적 사용 · 문서에 넣기 · 앱에 함께 배포가 무료로 허용되고,
글꼴 파일만 따로 파는 것만 금지됩니다. 각 글꼴의 저작권 표시와 라이선스 전문은 `licenses/`에 있고
앱의 **정보 · 오픈소스 라이선스** 화면에서 볼 수 있습니다. 상용 글꼴(맑은 고딕 · 바탕 · 함초롬 · Calibri 등)은
**하나도 넣지 않았습니다**. 그런 이름은 같은 성격의 무료 글꼴로 대신 보여 줄 뿐입니다(파일은 원래 글꼴 이름을 그대로 간직).

## 출처

1. `files/`의 한글 본문 글꼴 WOFF2(나눔 · Noto · 고운 · Pretendard · D2Coding · 스포카 · RHWP 공개 바탕/옛한글 · 기호)는
   한글 편집기 원작 rhwp가 라이선스를 확인해 배포하는 파일을 바이트 그대로 가져왔습니다.
   - https://github.com/edwardkim/rhwp/tree/c9095c5f67632e6721e800ccc7fb43ea49d26682/assets/fonts (v0.9.0)
   - 한글(HWP) 편집기는 이 파일들을 원래 이름(`fonts/<파일>`)으로 찾으므로 이름을 바꾸지 않습니다.
2. 나머지(손글씨 · 제목 글꼴, Gothic A1, IBM Plex Sans KR, 함렡, 영문 호환 글꼴 Carlito · Caladea · Arimo · Tinos · Cousine)는
   Google Fonts 저장소의 TTF를 WOFF2로 무손실 변환했습니다(fontTools, 글리프 · 이름 · 메트릭 그대로).
   - https://github.com/google/fonts/tree/6ebe737e44fd64ee736bbc6feed6136a6dbfd222/ofl/<글꼴>
   - 라이선스: `licenses/google-<글꼴>-OFL.txt`

## 대신 보여 주는 이름 (워드 · 엑셀 · 파워포인트)

| 문서의 글꼴 | 화면에 쓰는 무료 글꼴 |
|---|---|
| Calibri / Cambria | Carlito / Caladea (글자 폭이 같게 만든 호환 글꼴) |
| Arial · Helvetica / Times New Roman / Courier New | Arimo / Tinos / Cousine (글자 폭 호환) |
| 바탕 · 바탕체 · 함초롬바탕 · 한컴바탕 · HY신명조 | Noto Serif KR |
| 휴먼명조 · HY명조 | 나눔명조 |
| 궁서 · 궁서체 | 고운바탕 |
| 굴림 · 돋움 · 함초롬돋움 · 한컴돋움 · 새굴림 · 새돋움 | Noto Sans KR |
| 굴림체 · 돋움체 | D2Coding |
| HY헤드라인M · HY견고딕 | Noto Sans KR Bold |

한글(HWP) 편집기는 rhwp 원작의 대체 규칙을 그대로 씁니다.
