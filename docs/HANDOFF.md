# 이음오피스 안드로이드판 — 인수인계

[IeumOffice](https://github.com/pblsketch/ieumoffice) 0.12.12(Apache-2.0, Electron 데스크톱 앱)를
안드로이드로 옮긴 브랜치입니다. 브랜치 `ieumoffice-android`에 올리면 GitHub Actions가 APK를 만들어
Releases의 `ieumoffice-latest`에 올립니다.

## 구조

```
web/shim/electron-shim.js   가짜 electron 모듈 + 메인 프로세스 대신 응답하는 핸들러
web/home/                   앱 첫 화면(파일 열기, 새 문서, 최근 문서)
tools/build_web.py          AppImage에서 편집기 화면을 뽑아 app/src/main/assets/www 로 만드는 스크립트
app/src/main/assets/www/    생성물 (커밋해 둠: CI가 AppImage 없이 빌드하도록)
app/src/main/java/...       WebView 셸 (MainActivity), 문서 번호↔content:// 대응 (DocStore)
```

### 동작 방식

1. 데스크톱판 편집기는 모듈마다 `renderer/`(웹 화면)와 `preload/index.js`(Electron 연결)로 나뉩니다.
2. `build_web.py`가 preload를 `(function(require){...})(window.__ieumRequire)`로 감싸 브라우저에서 돌게 하고,
   `index.html` 앞에 셈을 끼워 넣습니다. 그래서 `window.hwpApi` 같은 API 모양이 데스크톱과 똑같습니다.
3. preload가 부르는 `ipcRenderer.invoke("채널")`은 셈의 `HANDLERS`가 받습니다. 없는 채널은 `undefined`
   (목록 채널은 `[]`)를 돌려주고 콘솔에 `[ieum-shim] ... (미구현)`으로 남깁니다.
4. 파일 읽기는 `https://appassets.androidplatform.net/doc/<id>`, 쓰기·파일 고르기는 `IeumAndroid` 메시지
   (`addWebMessageListener`, 앱 출처에서만 보임)로 합니다.
5. HTML 미리보기는 데스크톱의 `html-preview:` 대신 `https://ieum-preview.local/view/`(다른 출처)로 내보냅니다.
   문서 속 스크립트가 앱 브리지에 닿지 않게 하려는 것입니다.

## 1차 버전 범위

| 편집기 | 상태 |
|---|---|
| 한글 HWP/HWPX | 열기·편집·저장 (저장은 HWPX 권장, 확장자를 .hwp로 고르면 HWP로) |
| 마크다운 | 열기·편집·저장 |
| HTML | 열기·편집·미리보기·저장 |
| PDF | 보기 (주석 저장은 데스크톱 메인 프로세스가 pdf-lib로 하던 일이라 미구현) |
| 워드·엑셀·파워포인트·EPUB·마인드맵·다이어그램 | 미이식 (파일 해석을 메인 프로세스가 함) |

AI 도우미·프로젝트·스킬·드라이브 연동은 데스크톱 메인 프로세스 기능이라 꺼져 있습니다(버튼은 보임).

## 새 버전 IeumOffice로 올리기

```bash
./IeumOffice-x.y.z.AppImage --appimage-extract
python3 tools/build_web.py squashfs-root/resources
```

그 뒤 브라우저 검사(아래)로 각 편집기가 뜨는지 확인하고, 새로 깨지는 채널은 셈 `HANDLERS`에 추가합니다.
원래 반환 모양은 `resources/app.asar`(npx @electron/asar extract)의 `out/main/index.js`와
`modules/<모듈>/main/*.js`에서 `ipcMain.handle(` 로 찾으면 됩니다.

## 확인 방법 (PC 브라우저)

Playwright로 `https://appassets.androidplatform.net/**`를 `app/src/main/assets/www`와 테스트 문서로
가로채 띄우고, `window.IeumAndroid`를 흉내 내면 안드로이드와 같은 출처·같은 경로로 시험할 수 있습니다.
0.12.12 기준으로 네 편집기 모두 열기 확인, 마크다운·HTML·HWP 저장 확인을 했습니다.

## 다음 단계 후보

- PDF 주석 저장 (pdf-lib을 웹 쪽에서 돌리기)
- 워드(docs)·시트·슬라이드: 메인 프로세스의 docx/xlsx 처리(`xlsx-sidecar` 네이티브 포함)를 웹으로 옮겨야 함
- 휴대폰 화면용 툴바 정리 (현재는 데스크톱 화면 그대로)
