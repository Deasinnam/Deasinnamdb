# 이음오피스 안드로이드판 — 인수인계

[IeumOffice](https://github.com/pblsketch/ieumoffice) v0.12.12(Apache-2.0, Electron 데스크톱 앱)를
안드로이드로 옮긴 브랜치입니다. 브랜치 `ieumoffice-android`에 올리면 GitHub Actions가

1. 원본 릴리스에서 AppImage와 소스(v0.12.12 태그)를 받고
2. 편집기 화면(`tools/build_web.py`)과 문서 엔진 묶음(`tools/build_node.py`)을 만들고
3. 안드로이드용 Node.js(Termux `nodejs-lts`)를 받고(`tools/fetch_android_node.py`)
4. 엑셀 엔진(Rust `xlsx-sidecar`)을 안드로이드용으로 컴파일하고
5. 에뮬레이터에서 6개 편집기를 자동 점검(`tools/emulator_selftest.sh`)한 뒤
6. 휴대폰용(arm64) APK를 Releases의 `ieumoffice-latest`에 올립니다.

원본 AppImage·생성물(`app/src/main/assets/www`, `node.zip`, `jniLibs`)은 저장소에 두지 않습니다.

## 구조

```
web/shim/electron-shim.js   화면 쪽 가짜 electron (preload를 그대로 쓰게 함)
web/home/                   첫 화면: 파일 열기, 새 문서, 최근 문서, 자동 점검
node/host.js                문서 엔진: 데스크톱 메인 코드를 문서마다 불러 돌리는 Node 호스트
node/fake-electron.js       메인 쪽 가짜 electron (ipcMain·app·BrowserWindow·dialog·protocol·Menu …)
node/codec.js               IPC 값(바이트 배열·Map 등)을 JSON으로 오가게 하는 규칙
node/vendor/                독립 실행용 메인 코드가 바깥에서 찾는 패키지 (ajv, zod, jszip, pdf-lib …)
tools/                      위 생성 스크립트들
app/src/main/java/...       MainActivity(WebView·중계), NodeRuntime(Node 실행), DocStore(문서 번호·복사·옮겨 쓰기)
```

### 편집기 두 종류

| 종류 | 편집기 | 동작 |
|---|---|---|
| 셈만으로 | PDF(보기), 한글, 마크다운, HTML | 화면 코드가 파일을 직접 다룸. 셈이 메인 프로세스 응답을 흉내 냄 |
| 문서 엔진 | 워드, 엑셀, 파워포인트, EPUB, 마인드맵, 다이어그램 | 데스크톱 메인 코드(`modules/<m>/main`)를 앱 안 Node에서 그대로 실행 |

### 문서 엔진 흐름

```
화면(WebView) ──IeumAndroid 메시지──▶ 앱(Java) ──웹소켓(127.0.0.1, 비밀값)──▶ Node 호스트 ──▶ 데스크톱 메인 코드
화면이 읽는 자체 프로토콜 주소: https://appassets.androidplatform.net/proto/m/<모듈>/<프로토콜>/...
   └ 앱이 Node의 HTTP로 넘김 → 메인 코드의 protocol.handle 처리기가 응답
```

- 화면은 Node에 직접 붙지 않습니다(크롬의 로컬 네트워크 접근 차단 회피, 비밀값을 화면에 두지 않음).
- 문서를 열면 앱이 원본(content://)을 `files/docs/<번호>/<이름>`에 복사하고 그 경로로 세션을 엽니다.
  메인 코드가 그 파일을 고쳐 쓰면 호스트가 알아채고 앱에 "원래 위치로 옮겨 써라"(`android.syncFile`)를 보냅니다.
- 저장 대화상자(`dialog.showSaveDialog`)는 안드로이드 "파일 만들기"로, 확인 창(`showMessageBox`)은 화면 안 모달로 바뀝니다.
- 데스크톱 메뉴 막대(Menu.setApplicationMenu)는 화면 오른쪽 아래 ⋯ → "메뉴 전체"로 그대로 펼쳐집니다.
  "저장"은 메뉴의 Ctrl+S 항목을 누르는 것과 같습니다.
- 모듈마다 열린 문서는 하나입니다(새 문서를 열면 이전 세션을 닫음).

### 원본 코드에 손댄 곳 (빌드 때 자동, `tools/build_web.py`)

- 화면 코드가 직접 만드는 자체 프로토콜 주소(`${LAZY_MEDIA_SCHEME}://` 등) → `/proto/m/<모듈>/...`
- CSP 안의 자체 프로토콜 출처 → `'self'`/앱 출처
- 다이어그램의 draw.io 메시지 출처 확인, 슬라이드의 메타파일 주소 판별, EPUB 본문 iframe의 CSP
- 원본이 바뀌어 고칠 곳을 못 찾으면 빌드가 멈추며 알려 줍니다.

### 호스트가 대신 해 주는 것 (`node/host.js`)

- 엑셀: 독립 실행판은 명령줄 파일을 안 받으므로 첫 `workbook:select`를 `workbook:reopen <경로>`로 돌림(`OPEN_HOOKS`)
- 데스크톱 껍데기 앱이 답하던 공통 채널(`app:` 등)은 셈의 기본값으로 대답(AI 패널 기본 숨김 포함)

## 안드로이드 쪽 요점

- Node 실행 파일은 `lib/<abi>/libnode.so`(안드로이드 10+는 앱 설치 폴더의 파일만 실행 허용). `useLegacyPackaging=true`.
- Termux 라이브러리는 `libz_1.so`처럼 이름을 바꿔 넣고, 실행 때 `files/nodelib/libz.so.1 → …/libz_1.so` 링크를 만듦(`assets/nodelibs.txt`).
- 엑셀 엔진은 `lib/<abi>/libxlsxsidecar.so`, 메인 코드에는 `XLSX_SIDECAR_PATH`로 알려 줌.
- `node.zip`(약 60MB)은 첫 실행 때 `files/node/app-<버전>`에 풂.
- 127.0.0.1 평문 통신만 허용(`res/xml/network_security_config.xml`). 문서를 바깥으로 보내지 않습니다.

## PC에서 시험하기

```bash
./IeumOffice-0_12_12.AppImage --appimage-extract
python3 tools/build_web.py squashfs-root/resources
(cd node && npm ci) && (cd node/vendor && npm ci --ignore-scripts)
IEUM_PORT=8790 IEUM_TOKEN=tok IEUM_DATA=/tmp/ieum IEUM_RESOURCES=$PWD/squashfs-root/resources \
  IEUM_SIDECAR=$PWD/squashfs-root/resources/native/xlsx-sidecar node node/host.js
```

Playwright로 `https://appassets.androidplatform.net/**`를 `app/src/main/assets/www`로, `/proto/`를 호스트로
가로채고 `window.IeumAndroid`를 흉내 내면(웹소켓 중계 포함) 안드로이드와 같은 경로로 시험할 수 있습니다.
홈 화면에 `?selftest=0`을 붙이면 6개 편집기를 차례로 열어 결과를 `selftestReport`로 보고합니다.

## 아직 안 되는 것

- PDF 주석 저장, 인쇄·PDF로 내보내기(`webContents.printToPDF`)
- AI 도우미(구독 프로그램 실행·API 호출은 데스크톱 전용)
- 휴대폰 화면용 툴바 정리(지금은 데스크톱 화면 그대로)
- 32비트 ARM 기기(armeabi-v7a)용 빌드
