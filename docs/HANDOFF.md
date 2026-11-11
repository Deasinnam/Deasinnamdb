# 덜누름 워크 인수인계

문서·사진·동영상 편집을 한 앱에 담은 안드로이드 앱 "덜누름 워크"(옛 이름: 대신남 워크)의 현재 상태와 이어서 작업하는 방법입니다. (2026-11-11 기준, "대신남 앱 개발 센터" 프로젝트에서 작성)

## 한눈에

| 항목 | 내용 |
|---|---|
| 앱 이름 | 덜누름 워크 |
| 패키지 | `com.daesinnam.work` (이름을 바꿔도 패키지는 그대로 — 덮어 설치 유지) |
| 현재 버전 | **1.0.2** (versionCode 3, 빌드 176) |
| 내려받기 | 저장소 Releases `work-latest` → `DeolnureumWork.apk` (187MB, 휴대폰용 arm64) |
| 저장소 · 브랜치 | `Deasinnam/Deasinnamdb` · `daesinnam-work` |
| 최소 안드로이드 | 8.0 (minSdk 26), targetSdk 35, 64비트 ARM 전용 |
| 사용 기기 | 갤럭시 Z 폴드7 (SM-F966N, 안드로이드 17). **DeX에 연결해 키보드·마우스로** 씀 |

`work-latest`에는 같은 파일이 `DaesinnamWork.apk` 이름으로도 올라갑니다. 덜누름 사이트(deolnureum.com)의 예전 내려받기 주소가 끊기지 않게 하려는 것입니다.

## 요청 이력

1. 이음오피스(IeumOffice)를 안드로이드로 이식 → 단독 앱(브랜치 `ieumoffice-android`, 지금은 이 앱에 흡수)
2. ArtCraft의 동영상 편집기(FilmCraft) 안드로이드판 → 단독 앱(브랜치 `filmcraft-android`)
3. 사진(PhotoCraft)·동영상·문서를 한 앱으로 합치고 이름을 바꿔 달라는 요청 → "대신남 워크"
4. 이름을 **덜누름 워크**로 변경, 편집 화면에서 첫 화면으로 돌아가는 **홈 버튼** 추가
5. 키캡 모양 아이콘·흑백 첫 화면으로 바꿨다가 **취소** ("전에 것이 좋다") → 지금 디자인은 보라 바탕에 흰 "덜" 아이콘, 색 카드 첫 화면
6. "워드·엑셀·파워포인트·마인드맵이 대부분 작동을 안 해" (DeX) → 1.0.1에 문제 진단 추가 → 진단 결과로 원인 확정 → **1.0.2에서 수정**

## 법적 원칙 (지켜야 할 것)

사용자 요청은 "법적 분쟁을 피할 수 있는 한에서 기능은 똑같이"입니다.

- 세 편집기 모두 공개 라이선스(IeumOffice: Apache-2.0, PhotoCraft·FilmCraft: MIT 또는 Apache-2.0)라 코드를 쓸 수 있습니다. 대신:
  - 원작의 저작권 표시·라이선스 전문·NOTICE를 앱의 **정보 · 오픈소스 라이선스** 화면(`assets/work/about.html`, `work/licenses/`)에 그대로 넣습니다.
  - 원작에서 **바꾼 내용을 밝힙니다** (Apache-2.0 제4조, 같은 화면).
  - 원작의 **이름·로고는 제품 이름으로 쓰지 않습니다.** 출처 표시에만 씁니다. 편집기 안의 제품 이름은 빌드 때 "덜누름 워크"로 바꿉니다(`tools/build_web.py`의 `rebrand()`, `tools/work_assets.py`).
- 이 때문에 PhotoCraft·FilmCraft·이음오피스 단독판은 덜누름 사이트에 싣지 않기로 했습니다.

## 구조

```
HomeActivity     첫 화면 (assets/work/) — 문서·사진·동영상 고르기, 파일 열기 → 형식별 편집기
OfficeActivity   문서 편집 — IeumOffice 화면 + 앱 안 Node.js 문서 엔진
PhotoActivity    사진 편집 — 별도 프로세스(:photo), assets/photo/ + photo-bridge.js
FilmActivity     동영상 편집 — 별도 프로세스(:film), assets/film/ + film-bridge.js
CraftActivity    사진·동영상 공통: WebView, 저장 가로채기 → 안드로이드 파일 만들기, 열기·공유 넣기
HomeButton       편집 화면에 떠 있는 "홈" 단추 (끌어 옮길 수 있고 자리를 기억)
NodeRuntime      문서 엔진(Node) 실행·감시·진단
DocStore         문서 번호·복사·원래 위치로 옮겨 쓰기
WorkApp          프로세스별 WebView 데이터 폴더 분리
```

- 첫 화면과 편집기들은 각자 다른 작업(task)입니다(`singleTask` + 서로 다른 `taskAffinity`). DeX에서는 창이 따로 뜹니다.
- 문서 첫 화면에서 뒤로 → 워크 첫 화면. 사진·동영상에서 뒤로 → "닫기 / 홈으로(열어 두기) / 계속 작업".

```
web/shim/electron-shim.js   화면 쪽 가짜 electron (원작 preload를 그대로 쓰게 함) + 화면 상태 알림·연결 감시
web/home/                   문서 첫 화면: 파일 열기, 새 문서, 최근 문서, 문제 진단, 자동 점검
node/host.js                문서 엔진: 데스크톱 메인 코드를 문서마다 불러 돌리는 Node 호스트
node/fake-electron.js       메인 쪽 가짜 electron (ipcMain·app·BrowserWindow·dialog·protocol·Menu …)
node/codec.js               IPC 값(바이트 배열·Map 등)을 JSON으로 오가게 하는 규칙
node/vendor/                메인 코드가 바깥에서 찾는 패키지
tools/                      빌드·점검 스크립트 (아래)
```

원본 AppImage와 생성물(`assets/www`, `assets/photo`, `assets/film`, `node.zip`, `jniLibs`)은 저장소에 두지 않고 빌드 때 만듭니다.

## 문서 편집 (가장 복잡한 부분)

### 편집기 두 종류

| 종류 | 편집기 | 동작 |
|---|---|---|
| 화면만으로 | PDF(보기), 한글, 마크다운, HTML | 화면 코드가 파일을 직접 다룸 |
| **문서 엔진** | 워드, 엑셀, 파워포인트, EPUB, 마인드맵, 다이어그램 | 데스크톱 메인 코드(`modules/<m>/main`)를 앱 안 Node에서 그대로 실행 |

"워드·엑셀·파워포인트·마인드맵만 안 된다"면 문서 엔진 쪽 문제입니다.

### 흐름

```
화면(WebView) ──IeumAndroid 메시지──▶ 앱(Java) ──웹소켓(127.0.0.1, 비밀값)──▶ Node 호스트 ──▶ 데스크톱 메인 코드
화면이 읽는 자체 프로토콜 주소: https://appassets.androidplatform.net/proto/m/<모듈>/<프로토콜>/...
   └ 앱이 Node의 HTTP로 넘김 → 메인 코드의 protocol.handle 처리기가 응답
```

- 화면은 Node에 직접 붙지 않습니다(브라우저의 로컬 네트워크 차단 회피, 비밀값을 화면에 두지 않음).
- 문서를 열면 앱이 원본(content://)을 `files/docs/<번호>/<이름>`에 복사하고 그 경로로 세션을 엽니다. 메인 코드가 그 파일을 고쳐 쓰면 호스트가 앱에 "원래 위치로 옮겨 써라"(`android.syncFile`)를 보냅니다.
- 저장 대화상자는 안드로이드 "파일 만들기"로, 확인 창은 화면 안 모달로 바뀝니다. 데스크톱 메뉴 막대는 화면 오른쪽 아래 ⋯ → "메뉴 전체".
- 모듈마다 열린 문서는 하나입니다(같은 종류의 새 문서를 열면 이전 세션을 닫음).

### 문서 엔진 실행 (`NodeRuntime.java`)

- Node 실행 파일은 `lib/arm64-v8a/libnode.so`(Termux `nodejs-lts` 24.x). 안드로이드는 앱 설치 폴더의 파일만 실행을 허용하므로 라이브러리처럼 넣습니다(`useLegacyPackaging=true`, `extractNativeLibs=true`).
- Termux 라이브러리는 `libz_1.so`처럼 이름을 바꿔 넣고, 실행 때 원래 이름의 **심볼릭 링크**를 만듭니다(`assets/nodelibs.txt`). 링크 폴더는 `files/nodelib/<설치 위치별 이름>/`.
- `node.zip`은 첫 실행(또는 버전이 바뀐 뒤 첫 실행) 때 `files/node/app-<버전>`에 풉니다.
- 엔진은 **앱에 하나**입니다(싱글턴). 문서 화면이 열리면 `acquire`, 닫히면 `release` → 20초 뒤 종료.
- 시작 방법을 차례로 시도합니다: `direct`(링크 + 직접 실행) → `copy`(라이브러리 복사) → `linker`(시스템 로더로 실행). 통한 방법을 기억합니다. 시작 뒤 `/health`에 실제로 붙어 본 다음에 "준비됨"으로 칩니다.
- 끌 때는 **강제 종료(SIGKILL)** 를 씁니다. 편집기 코드가 SIGTERM을 가로채 `app.quit()`만 부르기 때문에 보통의 종료로는 꺼지지 않습니다. `host.js`도 SIGTERM을 받으면 바로 끝내고, 앱이 사라지면(입력 통로가 닫히면) 스스로 끝납니다(`IEUM_PARENT_WATCH`).
- 엔진과의 연결은 프록시를 거치지 않습니다. 연결에 실패하면 엔진을 다시 시작해 한 번 더 붙습니다.

### 안 열릴 때 (1.0.1부터)

- 열지 못하면 이유와 **다시 시도 · 문제 진단** 단추가 화면에 남습니다.
- 문서 첫 화면 아래 **문제 진단**: 기기·웹뷰·창 상태, 엔진 파일, 엔진 시작·연결, 워드·엑셀·파워포인트·마인드맵의 새 문서·견본 문서 열기, 엔진 기록과 출력. **결과 복사 / 보내기**. 문서 내용과 파일 이름은 담지 않습니다.
- 편집기가 엔진에 붙지 못하면(12초) 빈 화면 대신 안내가 뜨고, 엔진이 다시 시작돼 세션이 사라지면 "편집기 연결이 끝났습니다" 안내가 뜹니다.
- 편집 화면은 상태를 앱 기록에 남깁니다(`pageReport`: state / settled / stuck / session-lost / error) → 진단 결과의 "기록"에 나옵니다.

### 원본 코드에 손대는 곳 (빌드 때 자동, `tools/build_web.py`)

- 화면 코드가 직접 만드는 자체 프로토콜 주소 → `/proto/m/<모듈>/...`, CSP 안의 자체 프로토콜 출처 → 앱 출처
- 다이어그램의 draw.io 메시지 출처 확인, 슬라이드의 메타파일 주소 판별, EPUB 본문 iframe의 CSP
- 제품 이름 바꾸기(`rebrand()`)
- 원본이 바뀌어 고칠 곳을 못 찾으면 빌드가 멈추며 알려 줍니다. **IeumOffice 버전을 올릴 때 가장 먼저 깨지는 곳**입니다(지금은 `v0.12.12` 고정, 워크플로의 `IEUM_VERSION`).

## 사진·동영상 편집

- **사진**: PhotoCraft 공식 웹 빌드(지금 v0.22.0)를 그대로 넣고 로딩 문구만 바꿉니다. 빌드 때마다 최신 릴리스를 받습니다.
- **동영상**: FilmCraft 최신 릴리스(지금 v0.19.0) 소스를 받아 직접 빌드합니다(`cargo xtask web`, wasm-bindgen, wasm-opt). 공식 웹 빌드는 H.264 내보내기가 실패해서(웹에서 스레드 풀을 못 만듦) `tools/filmcraft_patch.py`로 고칩니다.
- 둘 다 `CraftActivity`가 내려받기를 가로채 안드로이드 "파일 만들기"로 저장하고, 다른 앱에서 연 파일·공유받은 파일을 편집기에 넣어 줍니다.
- 각자 별도 프로세스라 한쪽이 메모리 문제로 꺼져도 다른 쪽은 살아 있습니다.
- 두 원작 모두 "최신"을 받으므로 **원작이 바뀌면 빌드가 달라질 수 있습니다.**

## 빌드·점검·배포

`daesinnam-work` 브랜치에 올리면 GitHub Actions가 돕니다(**약 28분**). 문서만 고칠 때는 커밋 메시지에 `[skip ci]`.

1. 앱 코드 컴파일 확인 (오래 걸리는 준비 전에 먼저)
2. IeumOffice AppImage·소스 받기 → 화면·엔진 묶기 → 안드로이드용 Node 받기 → 엑셀 엔진(Rust `xlsx-sidecar`) 컴파일
3. PhotoCraft 받기, FilmCraft 소스 빌드 → `tools/work_assets.py`(에셋·이름·라이선스·정보 화면·`build.txt`)
4. 크롬에서 동영상 편집 점검(`tools/web_selftest.mjs`: 시작·가져오기·열기·MP4 내보내기·저장)
5. **에뮬레이터 안드로이드 14** (통과해야 배포): 첫 화면, 견본 문서 6종, 첫 화면을 거쳐 새 워드·엑셀·파워포인트·마인드맵, 문서 화면 닫으면 엔진 꺼짐, 닫았다 다시 열기, 문제 진단, 엔진이 하나만 떠 있는지, **덮어 설치 뒤 열기**, 사진, 동영상
6. **에뮬레이터 안드로이드 16** (문서 편집만, 실패해도 배포는 진행 — 결과는 `work-ci` 설명에 표시)
7. 서명한 arm64 APK를 `work-latest`에 올림. 점검 화면·기록은 `work-ci`

- 서명: 저장소 비밀값 `AMP_KEYSTORE_*`. 키 파일은 저장소에 없습니다.
- 에뮬레이터용 시험 빌드는 x86_64도 넣습니다(`-PworkAbis=arm64-v8a,x86_64`). 배포용은 arm64만.
- 에뮬레이터는 GPU 텍스처 한계(4096) 때문에 동영상 편집기를 끝까지 못 띄웁니다. 그래서 동영상의 실제 편집 동작은 크롬 점검이, 에뮬레이터는 앱 연결만 확인합니다.
- 시험용 빌드에서만 `am start … OfficeActivity --es ieum.flow docs|sheets|slides|mindmap|diag|none`으로 사람이 누르는 길을 따라 열 수 있습니다.

### arm64 엔진 따로 확인하기 (`arm64-check` 브랜치)

실기기가 없어서 만든 임시 브랜치입니다. arm64 러너에서 `termux-docker`(안드로이드 bionic)로 **배포된 APK의** Node 엔진을 돌립니다: Termux 라이브러리를 숨긴 채(휴대폰과 같은 조건) 시작, 6개 모듈 열기, 부모가 사라지면 종료, SIGTERM 종료. 1.0.1 기준 모두 통과. 브랜치에 올리면 2~3분 만에 돕니다. 더 필요 없으면 지워도 됩니다.

## 사고 기록: 문서가 열리지 않던 문제 (1.0.2에서 수정)

- **증상**: DeX에서 워드·엑셀·파워포인트·마인드맵이 열리지 않음. 한글·마크다운 등은 열림.
- **원인**: 앱을 **덮어 설치(업데이트)** 하면 설치 위치가 바뀌어 라이브러리 심볼릭 링크가 끊어집니다. `File.exists()`는 끊어진 링크를 "없다"고 답해서 링크를 지우지 못했고, 폴더가 비워지지 않아 "라이브러리 폴더를 만들 수 없습니다"로 엔진 시작이 멈췄습니다. DeX·안드로이드 버전과는 무관했습니다.
- **왜 못 잡았나**: 자동 점검이 늘 새로 설치한 상태에서만 돌았습니다.
- **고친 것**: 링크 자체를 보고 지움(`NOFOLLOW_LINKS`), 설치 위치별로 링크 폴더를 따로 둠, 못 만들면 임시 폴더로. 점검에 "덮어 설치 뒤 열기" 추가.
- **교훈**: 실기기에서만 나는 문제는 추측보다 **앱 안 진단 결과를 받는 것**이 빨랐습니다. 사용자가 보낸 진단 한 번으로 원인이 확정됐습니다.

## 확인된 것과 안 된 것

| | 상태 |
|---|---|
| 에뮬레이터 안드로이드 14·16 자동 점검 | 1.0.2 통과 (덮어 설치 뒤 열기 포함) |
| arm64 엔진(휴대폰 유사 환경) | 1.0.1 기준 통과 |
| 실기기(폴드7·DeX)에서 1.0.2 | **사용자 확인을 아직 못 받음.** 1.0.1에서는 실패했고 그 진단으로 원인을 고침 |
| 사진·동영상 편집의 실기기 동작 | 직접 확인 못 함(불만 접수는 없었음) |

## 알아 둘 한계

- 편집 화면은 **데스크톱 화면 그대로**입니다. 휴대폰 세로 화면에서는 좁고, DeX·펼친 화면에 맞습니다.
- PDF 주석 저장, 인쇄·PDF로 내보내기(`webContents.printToPDF`)는 안 됩니다.
- 원작의 AI 도우미(구독 프로그램 실행·API 호출)는 데스크톱 전용이라 숨겨 둡니다.
- 64비트 ARM 기기만 지원합니다. APK가 187MB로 큽니다(Node·ICU·세 편집기).
- 앱 데이터를 지우면 문서 쪽 최근 목록뿐 아니라 **사진·동영상 편집기 안에 저장된 작업도 지워집니다.**
- 편집기 안의 일부 메뉴·안내 문구에는 원작 이름이 남아 있을 수 있습니다(정보 화면에 밝혀 둠).

## 이어서 할 만한 일

1. 1.0.2가 DeX에서 워드·엑셀·파워포인트·마인드맵을 여는지 사용자 확인 받기. 또 안 되면 **문제 진단 → 결과 복사**를 받아 보기
2. 덜누름 사이트의 앱 표기 갱신(이름 "덜누름 워크", 버전 1.0.2, 파일 `DeolnureumWork.apk`) — 사이트는 "덜누름 앱 개발팀" 프로젝트 담당
3. 휴대폰 화면용 툴바 정리(요청이 오면)
4. IeumOffice·PhotoCraft·FilmCraft 새 버전 따라가기(위 "원본 코드에 손대는 곳" 주의)
5. `arm64-check` 브랜치 정리

## PC에서 문서 편집 시험하기

```bash
./IeumOffice-0_12_12.AppImage --appimage-extract
python3 tools/build_web.py squashfs-root/resources
(cd node && npm ci) && (cd node/vendor && npm ci --ignore-scripts)
IEUM_PORT=8790 IEUM_TOKEN=tok IEUM_DATA=/tmp/ieum IEUM_RESOURCES=$PWD/squashfs-root/resources \
  IEUM_SIDECAR=$PWD/squashfs-root/resources/native/xlsx-sidecar node node/host.js
```

- Playwright로 `https://appassets.androidplatform.net/**`를 `app/src/main/assets/www`로, `/proto/`를 호스트로 가로채고 `window.IeumAndroid`를 흉내 내면(웹소켓 중계 포함) 안드로이드와 같은 길로 시험할 수 있습니다. 홈 화면 CSP 때문에 `bypass_csp`가 필요합니다.
- 배포된 APK를 풀어 `assets/www`와 `assets/node.zip`으로 같은 시험을 할 수도 있습니다(이번 원인 조사에서 그렇게 했습니다).
- 홈 화면에 `?selftest=0`을 붙이면 6개 편집기를 차례로 열어 결과를 보고합니다.
- **주의**: 호스트를 끌 때는 `kill -9`를 쓰거나 최신 `host.js`를 쓰세요. 예전 `host.js`는 편집기를 한 번 연 뒤에는 보통의 `kill`로 꺼지지 않아, 꺼진 줄 알고 예전 프로세스에 계속 붙어 시험하게 됩니다.

## 작업할 때의 약속

- 사용자와의 대화·화면 글귀·커밋 메시지는 한국어.
- 커밋 메시지 끝에 붙이는 줄:
  ```
  Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
  Claude-Session: <세션 주소>
  ```
- 고칠 때마다 `versionCode`/`versionName`(app/build.gradle)과 `tools/work_assets.py`의 기본 버전을 함께 올립니다.
- 문제를 고치면 자동 점검에 그 문제를 잡는 항목을 추가합니다.
- 배포 파일은 Releases에서 내려받아 `덜누름워크-<버전>.apk` 이름으로 사용자에게 전달했습니다. 같은 서명이라 기존 앱 위에 덮어 설치됩니다.

## 같은 저장소의 관련 앱 (참고)

| 앱 | 브랜치 | 배포 |
|---|---|---|
| 덜누름 데스크 (데스크톱 방식 런처) | `deolnureum-desk` | `desk-latest` · 1.2.1 |
| 덜누름 브라우저 (PC 모드 브라우저) | `deolnureum-browser` | `browser-latest` · 2.0 |
| 회의비서 | `meeting-assistant` | `meeting-latest` |
| FilmCraft 안드로이드 단독판 | `filmcraft-android` | `filmcraft-latest` |
