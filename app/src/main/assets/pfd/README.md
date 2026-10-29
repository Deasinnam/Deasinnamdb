# 대신남 PFD 패키지 (원본 그대로)

이 폴더의 `pfd.js`, `pfd.css`, `pfd.d.ts`, `FONT_LICENSE.txt`는 받은 "대신남 PFD" 패키지 파일을 **고치지 않고** 그대로 둔 것입니다. 현재 v1.2입니다.

## 새 패키지를 받으면

1. 패키지의 `pfd.js`, `pfd.css`, `pfd.d.ts`를 이 폴더에 그대로 덮어씁니다.
2. 패키지의 `assets/font.css`(내장 한글 글꼴 3.6MB)와 `index.html`·이미지는 넣지 않습니다. 앱은 Noto Sans KR을 씁니다.
3. 패키지 문서(CLAUDE_APPLY.md 등)에서 새 설정·이벤트가 생겼는지 보고, 필요하면 `../pfd-amp.js`만 고칩니다.
4. `npm test`로 확인합니다.

앱에 맞춘 연결과 추가 효과(선회 효과, 주야간 자동 기준, 설정 저장, GPS·센서 연결)는 모두 `../pfd-amp.js`, `../pfd-amp.css`에 있습니다. 선회 효과는 패키지의 장면 값(구름·도심 좌표 범위, 달 위치)에 기대므로, 패키지가 장면 구조를 바꾸면 `pfd-amp.js`의 `patchScene`을 함께 확인하세요.
