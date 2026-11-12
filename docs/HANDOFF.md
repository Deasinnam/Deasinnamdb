# 대신남 원 · 대신남 AMP — 작업 인수인계

> **새 대화에서는 이 문서를 먼저 읽고 이어서 작업합니다.** 작업을 하나 끝낼 때마다 이 문서를 고쳐서(맨 아래 "작업 기록"에 한 줄 + 바뀐 부분) 같이 커밋합니다.

마지막 갱신: **2026-11-12 · v1.58 (versionCode 86)**

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 저장소 | `Deasinnam/Deasinnamdb` (**공개**), 브랜치 **`daesinnam-one-v1`** |
| 최신 버전 | **1.58** (versionCode 86, versionName `1.58-one`) |
| 릴리스 태그 | `one-v1` (CI가 매번 지우고 다시 올림) |
| 빌드 | GitHub Actions `.github/workflows/build-apk.yml` → 화면 테스트(Playwright) → 서명(키는 GitHub Secrets, 저장소에 없음) → 릴리스 `one-v1` |
| 웹 미리보기 | 아티팩트 "대신남 원 Ver1" — https://claude.ai/artifact/VmcAkcQKBRp8ZsXLA3hZDx |
| 개인정보 처리방침 | https://github.com/Deasinnam/Deasinnamdb/blob/daesinnam-one-v1/docs/privacy.md |

### 앱 이름 정리 (사용자가 정한 호칭)
- **대신남원** = 개발 모델(기존 통합 앱, `com.daesinnam.one.v1`). 폴드7은 `DaesinnamOne-V1-full.apk`.
- **대신남2** = 시험판(배포용 테스트 `comm`, 안드로이드 등록 테스트 `play`).
- **대신남 AMP** / **대신남 원** = 1.55에서 나눈 독립 앱(따로 설치).

### 내려받기 직접 링크 (채팅 파일 받기가 자주 실패하므로 항상 함께 안내)
`https://github.com/Deasinnam/Deasinnamdb/releases/download/one-v1/<파일>`

| 파일 | 앱 | applicationId | 스킨 |
|---|---|---|---|
| `DaesinnamOne-V1-full.apk` | 대신남원 (폴드7) | com.daesinnam.one.v1 | 자동차 모드·에어라인 (1.56~) |
| `DaesinnamOne-V1.apk` | 대신남원 lite | com.daesinnam.one.v1 | 〃 |
| `DaesinnamFold8*.apk` | 대신남원 폴드8 | com.daesinnam.one.v1.fold8 | 〃 |
| `DaesinnamOne.apk` | 대신남 원 | com.daesinnam.oneapp | 자동차 모드·에어라인 |
| `DaesinnamAMP.apk` | 대신남 AMP | com.daesinnam.ampapp | 오디오 스킨 7종(블루~우드 하이파이) |
| `DaesinnamDist-Test.apk` | 대신남 배포용 테스트 | com.daesinnam.dist.test | 전부(PUB 제한) |
| `DaesinnamOne-AndroidTest.apk/.aab` | 대신남 원 안드로이드 테스트용 | com.daesinnam.one.androidtest | 전부(PLAY 제한) |

---

## 2. 반드시 지킬 것

- **모든 대화는 한글.**
- 사용자 개인정보(이메일 등)는 되풀이하거나 공개 저장소에 쓰지 않음.
- Joyhonest `.so` 재배포·JOY TRIP 브랜딩 복제 금지. 스타워즈 IP 금지. YT Music·Spotify 로고 금지.
- **`app/src/main/assets/pfd/pfd.js`는 수정 금지.** PFD 추가 기능은 `web/src/` 쪽(pfd-amp·pfd-flight 역할 코드, 51-pfd-minimap 등)에.
- 파일 받기가 안 될 때가 많으니 APK는 SendUserFile + 위 직접 링크 둘 다.

---

## 3. 릴리스 순서 (매번 똑같이)

1. `app/build.gradle` — versionCode +1, versionName `X-one`.
2. README 변경 기록: `sed -i '49i - X: 설명' README.md` (49번째 줄에 새 줄).
3. `node tools/build-web.cjs` → `npm run check` → `TEST_JOBS=1 timeout 590 node tests/run.cjs` (전부 통과해야 함).
4. **이 문서(docs/HANDOFF.md) 갱신.**
5. 커밋(트레일러 포함) →
   ```
   Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_012mxsbgcYRXZraKst5kx2SJ
   ```
   `git push origin HEAD:daesinnam-one-v1`
6. CI 지켜보기: `gh run list -R Deasinnam/Deasinnamdb -b daesinnam-one-v1 -L 1` → 백그라운드 until 루프로 `gh run view <id> --json status,conclusion`.
   - 실패가 우분투 패키지 서버(`Temporary failure resolving`)·Gradle 504 같은 일시 장애면 `gh run rerun <id>`. (Playwright 의존 패키지 재시도·Gradle 미러 대체는 이미 워크플로에 있음)
7. 릴리스 파일 받기: `gh api repos/Deasinnam/Deasinnamdb/releases/tags/one-v1 -q '.assets[]|...'` → `gh api -H "Accept: application/octet-stream" .../releases/assets/<id> > 파일` → `unzip -p X.apk assets/app.js | grep` 으로 새 코드 들어갔는지 확인.
8. SendUserFile(display attach) + 직접 링크 안내, 한글로 보고.
9. (웹 화면이 바뀐 경우) 아티팩트 다시 올리기: 스크래치패드 `one-art/`에서 CSP meta 빼고, 제목 "대신남 원 Ver1", jsmediatags는 CDN.

---

## 4. 구조

- **웹 화면**: `web/src/NN-*.js`를 `tools/build-web.cjs`가 이름순으로 이어 붙여 `app/src/main/assets/app.js`(한 IIFE) 생성. 직접 app.js 고치지 말 것.
  - 스타일: `app/src/main/assets/app.css`(뒤에 덧붙이는 방식), 화면 틀: `app/src/main/assets/index.html`.
  - 주요 파일: `00-core.js`(빌드 플래그·스킨·store), `02-build-notice.js`, `51-pfd-minimap.js`(원형 지도), `63-carlog.js`(차계부), `64-lyrics.js`(가사), `80-clock-windows.js`, `92-cockpit2-rail.js`(아래 바로가기·ckFocus), `97-brightness.js`(밝기·야간 20%), `98-cockpit-special.js`(관제탑 표시 atcMini), `99-power-boot.js`.
- **빌드 플래그(JS)** `00-core.js`:
  - `BUILD` = 네이티브 `NB.buildKind()`(= `BuildConfig.FLAVOR_device`) 또는 테스트용 `window.__build`.
  - `PUB`(comm·play), `PLAY`(play), `NATIVE_KIND`, **`APP`** = `amp` / `one`(one·std·fold8 네이티브) / `all`(웹 미리보기·테스트·시험판).
  - `document.documentElement.dataset.app` → CSS `:root[data-app="amp"]`로 AMP에서 차량 기능 숨김.
  - 스킨 제한: `AUDIO_SKINS`(blue·amber·base·neon·ice·red·wood) / `ONE_SKINS`(carnival·carnival7) / `RETIRED`(carnival5·4·6·tablet·tablet2, 테스트는 `window.__allSkins=true`).
- **flavor**: device(std·fold8·comm·play·amp·one) × edition(lite·full). 앱 이름은 `app/src/<flavor>/res/values/strings.xml`, AMP 아이콘은 `app/src/amp/res/`.
- **네이티브**(`app/src/main/java/com/daesinnam/amp/`): MainActivity(브리지 `AndroidBridge`, 뒤로가기 `window.__back`), AmpPlayerService(Media3), ExternalEq(외부 앱 EQ — 꺼짐/평탄이면 효과 없음, 세션 0은 선택), GpsTracker 등.
- **PFD**: `pfd.js`(DaesinnamPFD, 수정 금지) 위에 계기 스킨(에어라인/에어포스 `data-pfdlook`), 비행 단계·효과음, 관제탑(TWR) 문구, 원형 지도, 총 주행거리.
- **원형 지도**(`PfdMap`): Leaflet + OSM 타일. 모양 `gta` / `normal`(PFD 주간·야간 따라감) / `day`(항상 주간). 야간은 SVG 필터 `#pmNightFx`(바탕 반전 + 물색 골라 파랑 강줄기 + 강가 주황 불빛). Leaflet은 `app/src/main/assets/leaflet/`(gitignore, CI가 받아 옴).
- **테스트**: `tests/NN-*.test.cjs` 30개(Playwright, `tests/lib/harness.cjs`). 반응형 점검 도구 `tools/rwd-audit.cjs`, `tools/rwd-shots.cjs`.

---

## 5. 현재 동작 요약 (최근 주요 기능)

- **앱 나누기(1.55~1.56)**: AMP = 오디오 스킨만, 상단 날짜·날씨·밝기 계기 없음, 도구 버튼 아이콘 없이 한 줄. 대신남원·대신남 원 = 자동차 모드·에어라인만.
- **켤 때(대신남 원·대신남원)**: 스피드미터 화면(ckFocus `gps`)이 화면 한가득(`--fxH: calc(100dvh - 6px)`), 스피드미터 창이 맨 위로 스크롤(폴드7 기준 사용자가 고른 비율).
- **관제탑 문구**: 칸 폭 고정·한 줄, 길면 전광판처럼 흐름(`.atcmini span.mq`).
- **야간(1.57)**: PFD가 야간이 되면 화면 밝기 20%(주간 되면 이전 밝기 복원, `briDayPrev`). 원형 지도 야간에 강줄기·강가 불빛, "항상 주간" 선택 가능.
- **DASHCAM 보기(1.58)**: 아래 바로가기 DASHCAM에서 영상(`#camView`)이 창 가득, 버튼 한 줄(가로 스크롤), 연결 정보(`#camNet`)·와이파이 설정(`#camSetBox`)·호환 기종은 `[정보 ▾]`(`#camInfo`, `#wCam.more`)로 접힘. 문제(`.bad`/`.camwarn`)가 있으면 버튼 주황. 코드: `75-dashcam.js` 끝, CSS `1.58 DASHCAM`.
- 과속 카메라: 전방·같은 길·가까워지는 것만, 500m·100m 두 번 표지판 카드 + 음성.
- 차계부(접힘 기본), 가사(파일 → LRCLIB), 뒤로가기는 창만 닫기, 반응형(글자 크기 반영·48px 터치 영역).
- 시험판(PUB): 라디오는 방송사 공식 웹으로만, 가사는 파일만, 첫 실행 안내.

---

## 6. 남은 일 · 사용자 답을 기다리는 것

- 대신남2 라디오: 해외 공개 스트림은 재생 + 국내 방송사는 공식 앱 연결로 할지 — **답 없음**.
- 시험판 이름을 "대신남2"로 바꿀지 — **답 없음**.
- 안드로이드 오토(미디어 앱) 지원 — **답 없음**.
- 1.57 야간 원형 지도 강 색·불빛 세기는 실제 OSM 타일로 도로에서 확인 필요(가짜 그림으로만 확인함). 너무 진하거나 흐리면 `51-pfd-minimap.js`의 `pmNightFx` 행렬 값 조정.

---

## 7. 작업 기록 (최근이 위)

- 2026-11-12 · 1.58 — DASHCAM 보기 영상 최대화, 부가 정보 [정보 ▾]로 접기. 테스트 30 추가.
- 2026-11-12 · 인수인계 문서 새로 작성(작업마다 갱신하기로 함).
- 2026-11-12 · 1.57 — 야간 원형 지도 강줄기·강가 불빛, "항상 주간" 지도, 야간 화면 밝기 20%. 테스트 29 추가.
- 2026-11-12 · CI — Playwright 의존 패키지 설치 재시도(우분투 서버 장애 대비).
- 2026-11-11 · 1.56 — 대신남원도 자동차 모드·에어라인만, 켜면 스피드미터 꽉 차게, 관제탑 전광판식 표시.
- 2026-11-10 · 1.55.1 — AMP 상단 계기 삭제, 도구 버튼 한 줄.
- 2026-11-10 · 1.55 — 대신남 AMP / 대신남 원 독립 앱 분리.
- 1.41~1.54 — README 변경 기록 참고(HUD PFD, 차계부, 에어라인/에어포스, 과속 카메라 개선, 뒤로가기, 가사, 반응형, 외부 앱 소리, 원형 지도, 플레이 준비, 시험판 2종).
