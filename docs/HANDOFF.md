# 대신남 원 · 대신남 AMP — 작업 인수인계

> **새 대화에서는 이 문서를 먼저 읽고 이어서 작업합니다.** 작업을 하나 끝낼 때마다 이 문서를 고쳐서(맨 아래 "작업 기록"에 한 줄 + 바뀐 부분) 같이 커밋합니다.

마지막 갱신: **2026-11-14 · v1.67 (versionCode 101)**

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 저장소 | `Deasinnam/Deasinnamdb` (**공개**), 브랜치 **`daesinnam-one-v1`** |
| 최신 버전 | **1.67** (versionCode 101, versionName `1.67-one`) |
| 릴리스 태그 | `one-v1` (CI가 매번 지우고 다시 올림) |
| 빌드 | GitHub Actions `.github/workflows/build-apk.yml` → 화면 테스트(Playwright) → 서명(키는 GitHub Secrets, 저장소에 없음) → 릴리스 `one-v1` |
| 웹 미리보기 | 아티팩트 "대신남 원 Ver1" — https://claude.ai/artifact/VmcAkcQKBRp8ZsXLA3hZDx |
| 스페셜 미리보기 | 아티팩트 "대신남 원 스페셜 — PFD 풍경 미리보기" — https://claude.ai/artifact/N94tEzYFMX5GN1wTWVaVeV (PFD만 화면 가득 + 시각 버튼. 파일: index.html(AmpHost 흉내) + pfd/·pfd-amp·pfd-flight·pfd-special, 다시 올릴 때 앱 assets에서 복사) |
| 개인정보 처리방침 | https://github.com/Deasinnam/Deasinnamdb/blob/daesinnam-one-v1/docs/privacy.md |

### 앱 이름 정리 (사용자가 정한 호칭)
- **대신남원** = 개발 모델(기존 통합 앱, `com.daesinnam.one.v1`). 폴드7은 `DaesinnamOne-V1-full.apk`.
- **대신남2** = 시험판(배포용 테스트 `comm`, 안드로이드 등록 테스트 `play`).
- **대신남 AMP** / **대신남 원** = 1.55에서 나눈 독립 앱(따로 설치).
- **대신남 원 스페셜** = 1.62 새 앱(따로 설치, flavor `special`). 대신남 원과 같은 구성 + 지브리풍 PFD 풍경. 기존 앱 업데이트가 아니라 신규. **1.62.1부터 표시 이름은 "에어포스원"**(앱 이름 strings.xml, 화면 글자는 `pfd-special.js` rename 관찰자가 '대신남…'→'에어포스원'·'DAESINNAM ONE'→'AIR FORCE ONE', 관제탑 호출부호 `CALLSIGN`/`window.AmpCallsign`). 사용자가 "대신남 원 스페셜"이라 부르면 이 앱.

### 내려받기 직접 링크 (채팅 파일 받기가 자주 실패하므로 항상 함께 안내)
`https://github.com/Deasinnam/Deasinnamdb/releases/download/one-v1/<파일>`

| 파일 | 앱 | applicationId | 스킨 |
|---|---|---|---|
| `DaesinnamOne-V1-full.apk` | 대신남원 (폴드7) | com.daesinnam.one.v1 | 자동차 모드·에어라인 (1.56~) |
| `DaesinnamOne-V1.apk` | 대신남원 lite | com.daesinnam.one.v1 | 〃 |
| `DaesinnamFold8*.apk` | 대신남원 폴드8 | com.daesinnam.one.v1.fold8 | 〃 |
| `DaesinnamOne.apk` | 대신남 원 | com.daesinnam.oneapp | 자동차 모드·에어라인 |
| `DaesinnamSpecial.apk` | 에어포스원(대신남 원 스페셜) | com.daesinnam.specialapp | 자동차 모드·에어라인 + 지브리풍 PFD |
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
3. `node tools/build-web.cjs` → `npm run check` → `TEST_JOBS=2 timeout 595 node tests/run.cjs` (31개라 1개씩은 10분을 넘김. 동시 2개에서 14·16번이 가끔 시간 탓에 실패 → 따로 `node tests/14-*.cjs`로 다시 확인).
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
  - 주요 파일: `92-z-fx-lock.js`(1.62.3 전용 보기 고정·스프링 — 빌드는 `^\d\d-[a-z0-9-]+\.js$` 파일만 묶음, `92b-`처럼 쓰면 빠짐), `00-core.js`(빌드 플래그·스킨·store), `02-build-notice.js`, `51-pfd-minimap.js`(원형 지도), `63-carlog.js`(차계부), `64-lyrics.js`(가사), `80-clock-windows.js`, `92-cockpit2-rail.js`(아래 바로가기·ckFocus), `97-brightness.js`(밝기·야간 20%), `98-cockpit-special.js`(관제탑 표시 atcMini), `99-power-boot.js`.
- **빌드 플래그(JS)** `00-core.js`:
  - `BUILD` = 네이티브 `NB.buildKind()`(= `BuildConfig.FLAVOR_device`) 또는 테스트용 `window.__build`.
  - `PUB`(comm·play), `PLAY`(play), `NATIVE_KIND`, **`APP`** = `amp` / `one`(one·special·std·fold8 네이티브) / `all`(웹 미리보기·테스트·시험판).
  - `document.documentElement.dataset.app` → CSS `:root[data-app="amp"]`로 AMP에서 차량 기능 숨김.
  - 스킨 제한: `AUDIO_SKINS`(blue·amber·base·neon·ice·red·wood) / `ONE_SKINS`(carnival·carnival7) / `RETIRED`(carnival5·4·6·tablet·tablet2, 테스트는 `window.__allSkins=true`).
- **flavor**: device(std·fold8·comm·play·amp·one·special) × edition(lite·full). 앱 이름은 `app/src/<flavor>/res/values/strings.xml`, AMP 아이콘은 `app/src/amp/res/`.
- **네이티브**(`app/src/main/java/com/daesinnam/amp/`): MainActivity(브리지 `AndroidBridge`, 뒤로가기 `window.__back`), AmpPlayerService(Media3), ExternalEq(외부 앱 EQ — 꺼짐/평탄이면 효과 없음, 세션 0은 선택), GpsTracker 등.
- **스페셜 풍경**(`app/src/main/assets/pfd-special.js`, 1.62): `data-build=special`(미리보기는 주소 `?special`)일 때만 켜짐. `pfd-flight.js`가 연 자리 `AmpFlight.ext`(`horizon`·`river`·`afterCountry`)와 `scene.drawSky/drawGround`를 덧씌움. 해 위치는 `solar()`(날짜·시각·`dna_wxLoc`, 없으면 서울) → `mood()`가 낮/노을/푸른 시간/밤 색을 섞음(키가 바뀔 때만 하늘·구름 색 다시 입힘, 구름은 해 좌우 두 벌 캐시). 자동 낮·밤은 `window.AmpAutoNight`(해 높이 < −5°)를 `pfd-amp.js` `applyTheme`이 씀. 밤 땅은 `nightGround()`가 장면 앞단에 먼저 깜. 시험·미리보기 시각: `window.__spTime`(ms)·`__spHour`, 방향 고정 `window.__spHdg`, 해 위치 계산 `AmpSpecial.solarAt(ms)`. 디버그로 층 끄기: `window.__spOff={glow,cirrus,bank}`.
- **PFD**: `pfd.js`(DaesinnamPFD, 수정 금지) 위에 계기 스킨(에어라인/에어포스 `data-pfdlook`), 비행 단계·효과음, 관제탑(TWR) 문구, 원형 지도, 총 주행거리.
- **원형 지도**(`PfdMap`): Leaflet + OSM 타일. 모양 `gta` / `normal`(PFD 주간·야간 따라감) / `day`(항상 주간). 야간은 SVG 필터 `#pmNightFx`(바탕 반전 + 물색 골라 파랑 강줄기 + 강가 주황 불빛). Leaflet은 `app/src/main/assets/leaflet/`(gitignore, CI가 받아 옴).
- **테스트**: `tests/NN-*.test.cjs` 33개(Playwright, `tests/lib/harness.cjs`). 반응형 점검 도구 `tools/rwd-audit.cjs`, `tools/rwd-shots.cjs`.

---

## 5. 현재 동작 요약 (최근 주요 기능)

- **스페셜 1.62.1**: 새벽(해 방위 < 180°이고 노을·푸른 시간)에는 떠 있는 구름 셋 중 하나만·62% 크기, 지평선 적운도 줄임. 육지에는 화면에 붙은 질감을 깔지 않음(땅과 다른 빠르기로 미끄러져 어지러웠음) — 들판 아래 불투명 바탕(패키지 원근 격자선 가림) + 땅에 붙은 고랑만, 물결은 바다·강만. 전신주(`drawPoles`: 세로 도로 3줄 + 가까운 가로 도로 2줄, 높이 22m로 크게, 처진 전선 두 줄, 밤엔 실루엣). **마일리지**: GPS(또는 external) 주행 거리 ÷ 1.609344를 `AmpHost.save('spMiles')`에 누적(시연 제외, 미리보기는 `__spMilesDemo`·`__spMilesRate`), 칩 `.sp-miles`(PFD 왼쪽 위 비행 배지 아래), 1마일마다 "+1 마일", 등급 블루 0/실버 1천/골드 5천/플래티넘 2만/다이아몬드 5만. **누적 주행거리 칩** `.sp-odo`(마일리지 칩 아래): 누르면 계기판 km 입력 → `AmpLog.setOdo`(차계부 누적 주행거리와 같은 값, GPS 거리는 차계부가 더함, 차계부 없으면 `spOdo`로 직접 더함). 밤에는 패키지 도심 불빛(`scene.city`)을 그리는 동안 비워 둠 — 비행 높이에서 땅과 따로 떠다녀 보였음. **바다·육지 번갈아**(`SEA_P` 16000·`SEA_LAND` 8000, 세상 거리 `F.wz`에 고정): `nearEdge/farEdge`(X에 따라 굽은 해안), `seaAt(X, Zw)`, `seaPath`가 화면 열마다 해안점을 찾아 바다 다각형 → `drawSea`(모래톱·거품·잔물결·배·윤슬). 예전 "늘 보이던 먼 바다"는 이걸로 바뀜. 전신주·밤 불빛은 바다 위에 안 그림. **전화 표시**: `MediaListener`(알림 접근 서비스)가 스페셜에서만 통화 분류 알림의 제목(이름)·`android.callType`(1 걸려 옴)을 메모리에 둠 → 브리지 `callInfo()` → `pfd-special.js` `.sp-call`(1.62.2: 계기 안 아래 가운데, `--pfd-cmp` 위, 비행 배지 모양 INCOMING/ON CALL, 700ms 확인, 시험은 `window.__spCall`). 개인정보 처리방침에 적음. **원형 지도**: 스페셜은 GPS 전에도 지도를 만들고 마지막 위치(lastFix → wxLoc → 서울)를 보여 줌(`51-pfd-minimap.js`, CSS로 GPS 표시는 아래 작게). 밤에는 패키지 지평선 건물 블록·창문 점(`#030a12`·`#edc18b`·`#a9c4da` 사각형)도 걸러 냄. 미리보기 시각 버튼에서 "푸른 시간" 뺌(장면의 해 진 뒤 단계는 그대로). **여는 화면** `special-intro.js`(스페셜만, index.html에서 pfd-special 다음): 캔버스 모션그래픽 8초 — 0.4s 늑대 면 조각 스프링 조립(틱), 2.3s 충격파(쿵), 2.6s "대신남" "AirLine" 글자 낙하·날개 밑줄(딩), 4.4s 알약 3개(GPS 스피드미터·PFD 비행 화면·마일리지 적립), 3.8s 항로 점선, 5.4s 활주로 등 돌진 + 엔진 스풀업, 7.0s 빛 번짐 → 걷힘. 소리는 Web Audio 합성, `dna_atcSound` 따름. 누르면 건너뜀. `navigator.webdriver`(자동 시험)에서는 안 뜸 — 강제는 `window.__forceIntro`. 늑대는 **사용자가 준 로고**(`special-logo.png`: 원본에서 늑대만 잘라 흰색 알파 마스크 360px, 글자 "AIR FORCE ONE"은 코드로 그림)를 66칸 격자 점으로 — 가운데부터 점이 켜지고 5.25~6.2s에 점마다 위로 흩어지며 꺼짐. 제목은 "AIR FORCE ONE" + "에어포스원". 그 밖: 구름 공을 그림 테두리 안으로(잘림 방지)·테두리 페더, 하늘 다음 패키지 장식 선(원근 격자·가는 선 능선) 긋기를 땅 그리기 전까지 막음(`c.__spStroke`).
- **대신남 원 스페셜(1.62)**: PFD 하늘(칠한 색 띠·붓결 새털구름·해와 햇무리), 뭉게구름(공을 부드럽게 이은 모양, 해 쪽 밝음·보랏빛 그늘·역광 테두리·대기 원근), 지평선 적운 무리, 겹겹 먼 산(해 쪽은 수평선이 트임), 들판 붓 터치 질감, 강(하늘 반사·잔물결), 먼 바다(굽은 해안선·모래톱·윤슬 길). 해는 실제 방위·높이(1° = 화면 높이/58)라 서쪽으로 달릴 때 노을 해가 보이고 수평선 아래로 짐. 밤: 남색이지만 너무 어둡지 않게, 달빛 들판, 불규칙한 마을(크기·밀도 제각각, 구불구불한 거리)·외딴집·켜진 도로 구간(꺼진 구간 있음)·오가는 차 불빛, 색은 나트륨 주황·따뜻한 흰빛·LED 흰빛 섞임, 먼 불빛은 살짝 일렁임. 밤 화면 밝기는 스페셜만 35%(다른 앱 20%). 아이콘 바탕은 노을색.

- **앱 나누기(1.55~1.56)**: AMP = 오디오 스킨만, 상단 날짜·날씨·밝기 계기 없음, 도구 버튼 아이콘 없이 한 줄. 대신남원·대신남 원 = 자동차 모드·에어라인만.
- **켤 때(대신남 원·대신남원)**: 스피드미터 화면(ckFocus `gps`)이 화면 한가득(`--fxH: calc(100dvh - 6px)`), 스피드미터 창이 맨 위로 스크롤(폴드7 기준 사용자가 고른 비율).
- **관제탑 문구**: 칸 폭 고정·한 줄, 길면 전광판처럼 흐름(`.atcmini span.mq`).
- **앞길 예측(1.61)**: `roadFetch`가 지금 길을 찾으면 `waysFetch`로 같은 이름(`name`)·노선번호(`ref`) 길 조각을 1.6km 안에서 받아 `road.ways`에 둠(길이 바뀌거나 700m 움직이면 다시). `buildPath()`가 진행 방향(±60°)으로 시작 조각을 고르고, 끝점 12m 안에 이어지는 조각(꺾임 110°까지, 일방통행 반대 제외)을 따라 1.3km까지 이음. 앞길이 250m 이상이면 `onPath()`로 카메라를 길 위에 내려 `cross`(보호구역 20m, 그 밖 30~45m) 안이고 `along` 3~1200m일 때만, 안내 거리도 `along`. 앞길을 못 만들면 1.59/1.60 직선 규칙. `AmpCam.view {path, cams, t}` → 원형 지도에 점선(노랑)과 `.pm-cam` 표지, 800m 안 카메라가 있으면 줌 14~15. 지도 색 필터는 `.leaflet-tile-pane`에만(겹쳐 그린 표시 색 유지).
- **야간 풍경(1.59)**: PFD 순항 풍경의 강(`pfd-flight.js` `drawCountry`)을 밤에도 달빛 파랑으로 또렷하게 + 강가 주황 가로등·물에 비친 불빛. (사용자가 말한 "야간 지도 강줄기"는 이것. 1.57에서는 원형 지도로 잘못 이해해 원형 지도에도 강 필터를 넣었음 — 그대로 둠)
- **원형 지도(1.59)**: 크기가 바뀌면 `invalidateSize`(잘림 수정), 지도 판 150%, 야간 계기면 왼쪽 위 `[☀ 주간 지도]`(`.pm-sun`) 버튼.
- **과속 카메라(1.59)**: 30 이하 카메라는 옆 허용 18~28m, 시속 55↑에서 12m 넘게 옆이면 제외, 같은 지점(앞뒤 60m) 여러 대면 `cross + |제한-속도|×0.5` 점수가 낮은 것. 같은 지점 80m 안은 한 번만 안내. 
- **과속 카메라 자료(1.60)**: 사용자가 올린 공공데이터 원본 CSV(cp949, 44,650줄, 2026-10 기준)로 `data/kr-speedcams.txt` 재생성 — 제한속도 있는 32,639곳, 형식 `위도,경도,제한속도,보호구역,도로순번` + `#roads:` JSON 목록(`도로노선명|노선번호`, 10,901개). 보호구역 2=어린이(30의 대부분), 99/빈칸=없음(0으로 저장). 도로노선방향(1·2·3)은 실제 진행 방향과 연결할 방법이 없어 안 씀. **길 이름 맞추기**: 카메라 후보가 있으면 Overpass로 지금 위치 30m 안의 도로(진행 방향 ±40°) 이름·ref를 받아(150m/15초마다) `sameRoad()`로 비교 — 다르면 30 이하 또는 15m 넘게 옆인 카메라 제외, 같으면 보호구역도 넓은 허용·점수 우대. 모르면(인터넷 없음·이름 없음) 1.59 기하 규칙. 원본 CSV는 저장소에 넣지 않음(다시 필요하면 data.go.kr/data/15028200/standard.do).
- **야간(1.57)**: PFD가 야간이 되면(자동차 스킨이면 어느 화면에서든, 1.59) 화면 밝기 20%(주간 되면 이전 밝기 복원, `briDayPrev`). 원형 지도 야간에 강줄기·강가 불빛, "항상 주간" 선택 가능.
- **DASHCAM 보기(1.58)**: 아래 바로가기 DASHCAM에서 영상(`#camView`)이 창 가득, 버튼 한 줄(가로 스크롤), 연결 정보(`#camNet`)·와이파이 설정(`#camSetBox`)·호환 기종은 `[정보 ▾]`(`#camInfo`, `#wCam.more`)로 접힘. 문제(`.bad`/`.camwarn`)가 있으면 버튼 주황. 코드: `75-dashcam.js` 끝, CSS `1.58 DASHCAM`.
- 과속 카메라: 전방·같은 길·가까워지는 것만, 500m·100m 두 번 표지판 카드 + 음성.
- 차계부(접힘 기본), 가사(파일 → LRCLIB), 뒤로가기는 창만 닫기, 반응형(글자 크기 반영·48px 터치 영역).
- 시험판(PUB): 라디오는 방송사 공식 웹으로만, 가사는 파일만, 첫 실행 안내.

---

## 6. 남은 일 · 사용자 답을 기다리는 것

- 에어포스원 전화 표시: 사용자 폰에서 표시 안 됨 보고(1.62.1) — 새 앱이라 알림 접근을 따로 허용해야 함 → 1.62.2에 켤 때 안내 추가. 허용 뒤에도 안 뜨면 삼성 전화 앱 알림의 category/extras 확인 필요(통화 분류 아님일 수 있음).
- 스페셜(1.62): 실제 폰(폴드7)에서 프레임·발열 확인 필요(PC 크롬에서는 한 번 그리기 약 2ms, 구름 색 다시 입히기는 시각 단계가 바뀔 때 0.1초 안팎). 색·밝기 취향은 사용자 확인.

- 과속 카메라 1.60~1.61: 길 이름 맞추기·앞길 예측은 실제 도로 주행으로 확인 필요(OSM 이름과 공공데이터 도로노선명이 다르게 적힌 곳, 복잡한 교차로·고가도로에서 앞길이 엉뚱하게 이어지는지).
- 대신남2 라디오: 해외 공개 스트림은 재생 + 국내 방송사는 공식 앱 연결로 할지 — **답 없음**.
- 시험판 이름을 "대신남2"로 바꿀지 — **답 없음**.
- 안드로이드 오토(미디어 앱) 지원 — **답 없음**.
- 1.57 야간 원형 지도 강 색·불빛 세기는 실제 OSM 타일로 도로에서 확인 필요(가짜 그림으로만 확인함). 너무 진하거나 흐리면 `51-pfd-minimap.js`의 `pmNightFx` 행렬 값 조정.

---

## 7. 작업 기록 (최근이 위)

- 2026-11-14 · 1.67 — **AI 기능 제거**(사용자 요청): `93-ai.js`·테스트 35(AI)·레일 버튼·`#aiPick`·CSS·시각화 AI 장면·네이티브 aiInfo/aiViz/aiLevel·MediaListener AI 알림·manifest queries·privacy 항목 모두 뺌(1.64–1.66 항목은 기록으로만 남김). 아래 버튼 줄: app.css 끝 `:root .win.hasrail #ckRail.ckrail` 규칙으로 아이콘만(span 숨김, svg 24px)·flex 한 줄, 위·아래 분할(`data-split=ck`)은 30px 높이, 이름은 `92-zz-rail-liquid.js`에서 aria-label·title로. 좁은 화면 `94-narrow.js`(`AmpNarrow`, innerWidth ≤ 520 → `:root[data-narrow]`): `.pfd-metrics` 접힘(`data-metrics-open`, 저장 `narrowMetrics`, `.pfd-flight-meta` 누르면 토글 — LIM 버튼 제외), `.pfd-status-line`·`#gMsg` 숨김, 창 `.bar` nowrap·groove 숨김·wbtn 44×36, 라디오 `.rd-band/.rd-mhz/.rd-lbl/.rd-com` 숨김, `#wMain#wMain`(특이성 올림) transport 6칸 한 줄 48px·lcd 높이 자동·timebox 26px·`.vmode`를 그림 위 한 줄로, `.mapctl` 줄바꿈, 에어포스원 칩 small 숨김·14px. 즐겨찾기 `#rdPresets` 4열·46px, `rdRenderFavs` n=max(열×2, …). 테스트 35(좁은 화면) 새로, 14·18·33 갱신. 폴드7 좌우 분할은 네이티브 splitState가 높이 비율만 봐서 `data-split`이 안 켜짐 — 그래서 폭 기준 data-narrow로 처리.
- 2026-11-14 · 1.66 — 실제 목소리 반영: 네이티브 `aiViz(on)`(외부 앱 모드가 아니어도 Visualizer(0) 켬, 반환=마이크 권한), `aiLevel()`(파형 RMS×3, 0.6초 넘으면 -1). `startViz` 조건 `extMode||aiViz`, 외부 모드 끌 때·onResume도 aiViz 고려. 웹: `AmpAiTalk.level()`(부드럽게, 시험 `__aiLevel`)·`phase()`(소리 >0.05 말하는 중, 아니면 듣는 중 — 통화 모드처럼 rec·voice 둘 다여도), 대화 시작 시 `NB.aiViz(true)`·권한 없으면 한 번 안내+`requestMic`. NOW PLAYING은 `NB.extWave()`(시험 `__aiWave`) 실제 파형을 주 띠로. 자막에서 상태 문구 정규식으로 제외. **주의: AI 앱이 통화용 소리 경로(VOICE_COMMUNICATION)로 내보내면 Visualizer(0)에 안 잡히는 기기가 있음 — 그땐 -1이라 이전처럼 상태 효과로 돌아감.**
- 2026-11-14 · 1.65 — NOW PLAYING 시각화(`30-eq-visual.js` drawVis 맨 앞): `aiVisOn()`(= `AmpAiTalk.live.on`, 0.5초마다 판정한 값)이면 `drawAiVoice`가 그림 — 목소리 띠 3줄(상태별 진폭·색), 듣는 중 고리, 이름·상태(위 [가사]·모드 줄 아래), 답 말풍선 타자 효과(초당 22자, 마지막 3줄). 대화 중엔 frame 루프를 busy로 봄(60fps). 가사 켜져 있으면 가사가 우선. 테스트 35에 `__aiVisN` 검사.
- 2026-11-14 · 1.64 — [AI] 버튼(`93-ai.js`, `AmpAiTalk`, 레일 `button[data-ai]`, 고르기 창 `#aiPick`, 저장 `aiApp`·`aiAt`): 방식 1(앱 불러오기)만 — `NB.openAppSplit(pkg, top)`로 ChatGPT(`com.openai.chatgpt`)·Claude(`com.anthropic.claude`) 엶, manifest queries 추가. 네이티브 `aiInfo()`: MediaListener가 **그 두 앱 알림만** 읽어 aiKey/pkg/title/text(BIG_TEXT 우선, 400자)/ongoing 보관(모든 빌드), 그리고 AudioManager 통화 모드(comm)·녹음 중(rec, getActiveRecordingConfigurations)·음성 재생(voice, 사용 용도 VOICE_COMMUNICATION/ASSISTANT) — 어느 앱인지는 모름. 판정: (AI 알림 && (ongoing||신호||최근 [AI]로 엶)) || (최근 엶 && 신호). voice만=말하는 중, rec만=듣는 중, 둘 다/없음=대화 중. 아일랜드 `.ai-isl`은 PFD canvasWrap 안, 원형 지도 오른쪽~오른쪽 띠 안쪽 사이 가운데(JS place, 띠 폭 12.2%), 막대 7개 span(캔버스 아님 — 다른 테스트가 `#pfdHost canvas` 하나를 기대). **실기기에서 ChatGPT·Claude가 실제로 어떤 알림·오디오 모드를 쓰는지 미확인** — 안 뜨면 aiInfo 값을 보고 판정 조정. 레일 9칸: 541–899px에서 AI 버튼 32px·라벨 10px, ≤540px는 5칸×2줄(테스트 14·18 갱신). 테스트 35. privacy.md에 AI 항목.
- 2026-11-14 · 1.63 — 아래 버튼 줄 액체 탭(`92-zz-rail-liquid.js`, `AmpRailLiquid`): `#ckRail` 안에 `.ck-liq` 틀 하나, `button[data-f].on`이 바뀌면(MutationObserver) 변경 목록에 {t, 버튼}을 쌓고 그릴 때마다 지금 배치에서 버튼 자리를 재서 두 끝에 스프링 합(오른쪽으로 갈 때 왼끝 2.0 Hz·오른끝 3.4 Hz, 반대는 반대, ζ .86) — 줄이 전용 보기마다 다른 창으로 옮겨 가도 어긋나지 않음. 켜진 버튼 자체 강조는 `.ckrail.liq button[data-f].on`에서 꺼진 버튼과 같은 바탕·그림자·테두리(변수 --liq-bg/bs/bc, 스킨이 바뀌면 다시 읽음), 틀 색 --liq-acc = 켜진 버튼 글자색. `window.__liqNow`로 시각 고정 가능(테스트·미리보기). 테스트 34 추가, 32의 해 위치 검사는 표시 방위가 자리 잡을 때까지 기다림(흔들림). 디자인 시안 캔버스: https://claude.ai/artifact/EgGDuyHE2KNcYKiGnsSGBS (시안 1 적용 자리, 2 한 도형 모핑 루프, 3 액체 탭 = 이번 반영, 4 늘어나는 볼륨).
- 2026-11-14 · 1.62.6 — 몬스타덱 무반응(스페셜): 웹 쪽은 스페셜도 APP='one'이라 기존과 같음(테스트 19를 `TEST_BUILD=special`로도 통과). 원인은 네이티브 — 형제 앱(대신남 원 V1 등)이 USB 인터페이스를 붙잡고 있어 claimInterface 실패. `UsbDeck`: 연결 전에 형제 패키지들(SIBLINGS)에 `com.daesinnam.action.DECK_RELEASE`(extra from=내 패키지) 보냄 → 받은 앱은 close(); claim 실패 시 500ms×8 재시도; `resumeIfAllowed()`를 onResume에서(허용된 경우만, 허용 창 다시 안 띄움). 받는 쪽 리시버는 exported(권한 없음 — 서명이 다른 옛 빌드와 permission 충돌 피하려고). **두 앱 모두 1.62.6 이상이어야 서로 놓아 줌.** 스페셜 하늘 창에 `[data-more]` [계기 설정 · 테마 …] → 원래 계기 설정 창(pass 플래그로 가로채기 건너뜀). `tests/lib/harness.cjs`에 `TEST_BUILD` 환경 변수(모든 페이지를 그 빌드로) — 단 기존 테스트 다수가 APP='all' 기준이라 one/special 전체 실행은 실패가 많음(비교용으로만).
- 2026-11-14 · 1.62.5 — 아래 버튼 줄 가려짐: `html,body{height:100%}`+`overflow-x:hidden` 때문에 페이지가 **body 안에서** 스크롤되는 경우가 있음(window.scrollY=0) → `FxLock`은 `sc()`로 실제 스크롤러(body 또는 scrollingElement)를 골라 고정·되돌림(scroll은 document capture로 받음, `AmpFxLock.scroller`), `fitY`는 창 아래와 `#ckRail` 아래 중 큰 쪽 기준, ResizeObserver(appEl·html)로 높이 바뀌면 다시 맞춤. app.css 끝 `.app.FX #ckRail{position:sticky;bottom:0}`(스피드미터는 PFD 안쪽이라 sticky가 안 먹고 fitY로 보장). 라디오 FX 꽉 채우기 규칙(`.rd-body:has(#rdListBox[hidden])`)은 즐겨찾기가 펼쳐져 있으면 빠짐(`:not(:has(#rdPresetBox:not([hidden])))`). 테스트 33에 다섯 보기 버튼 줄 화면 안 검사. 전체 테스트를 TEST_JOBS=2로 돌리면 01·14·32가 가끔 시간 초과 — 하나씩은 통과.
- 2026-11-14 · 1.62.4 — 라디오 즐겨찾기 칸 수: `90-radio.js` `rdRenderFavs` n=max(6, ceil(개수/열수)*열수), 열 수는 `#rdPresets` gridTemplateColumns에서 읽음(보통 3 → 6·9·12…). 풀화면: `MainActivity.enterFullScreen()`(API30+ `WindowInsetsController.hide(statusBars|navigationBars)` + `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`, 그 아래는 IMMERSIVE_STICKY), onCreate·`onWindowFocusChanged(true)`에서 다시 적용 — 모든 빌드 공통. 테스트 33에 칸 수 검사 추가.
- 2026-11-14 · 1.62.3 — 전용 보기 고정+스프링(`AmpFxLock`: FX면 `fitY()`=고른 창 아래 끝이 화면 아래에 닿는 스크롤로 고정, 터치는 세로 끌기만 고무줄(`#app` transform)→놓으면 스프링 k240 c17, 휠·스크롤은 되돌리고 살짝 튕김, 스스로 스크롤되는 곳·`.leaflet-container`·input·`.rd-knob`·`.grip`·`.rzbtn`·`[data-nolock]`은 제외, `html.fxlock` overscroll 끔). 폴드7 라디오 드럼 겹침(app.css 끝 `.rd-disp .rd-seg{height:auto!important}`). 테스트 33 추가.

- 2026-11-13 · 1.62.2 — 에어포스원: 폴드7 칩 겹침(배지 아래로 동적 쌓기), 원형 지도 주간·야간 버튼 없앰, 하늘 고르기(`spSky`: auto·dawn·noon·gold·set·night, 테마 버튼을 가로채 창을 띄움, 고정이면 `__spTime`+`__spSunAhead`, 시각은 기기 시각대 0~24시를 해 높이로 훑어 찾음 — CI(UTC)에서 11~21시만 보다 실패했었음), 전화 표시용 알림 접근 안내. 테스트 32 보강.

- 2026-11-13 · 1.62.1 — 스페셜: 새벽 구름 줄임, 육지 움직이는 질감 없앰, 전신주, 마일리지 적립. 테스트 32 보강.

- 2026-11-13 · 스페셜 미리보기 아티팩트 공개(시각 버튼: 새벽·한낮·노을·해 질 녘·푸른 시간·밤·지금). `pfd-special.js`에 `__spHdg`·`solarAt` 추가.

- 2026-11-13 · 1.62 — 새 앱 "대신남 원 스페셜"(flavor special, DaesinnamSpecial.apk): 지브리풍 PFD 풍경, 실제 해 위치로 하루 흐름, 밤 땅 불빛·밝기 35%. 테스트 32 추가. `pfd-flight.js`에 확장 자리(ext·geo), `pfd-amp.js` 자동 낮·밤 훅.

- 2026-11-13 · 1.61 — 원형 지도 기반 앞길 예측으로 과속 카메라 판단·거리, 원형 지도에 앞길·카메라 표시. 테스트 31에 앞길 시험 추가, 29 갱신.
- 2026-11-13 · 1.60 — 과속 카메라 자료 재생성(보호구역·도로 이름) + 지금 길 이름과 맞추기. 테스트 31에 길 이름 시험 추가, 18 갱신. 16번은 계기 테마 주간 고정(CI가 새벽 시각이면 야간 20%가 끼어듦 — 밝기 시험은 모두 이렇게). 1.62.1: 16번 덱 야간 스위치는 "누른 뒤 기록에 50%가 있는지"로 봄(1초 주기 야간 20% 규칙과 겹쳐 마지막 값이 흔들림).
- 2026-11-13 · 1.59 — 원형 지도 잘림, 야간 [☀ 주간 지도] 버튼, 야간 밝기 20% 범위 넓힘, 야간 풍경 강줄기·불빛, 과속 카메라 30 오인 줄이기. 테스트 31 추가, 03·29 보강.
- 2026-11-12 · 1.58 — DASHCAM 보기 영상 최대화, 부가 정보 [정보 ▾]로 접기. 테스트 30 추가.
- 2026-11-12 · 인수인계 문서 새로 작성(작업마다 갱신하기로 함).
- 2026-11-12 · 1.57 — 야간 원형 지도 강줄기·강가 불빛, "항상 주간" 지도, 야간 화면 밝기 20%. 테스트 29 추가.
- 2026-11-12 · CI — Playwright 의존 패키지 설치 재시도(우분투 서버 장애 대비).
- 2026-11-11 · 1.56 — 대신남원도 자동차 모드·에어라인만, 켜면 스피드미터 꽉 차게, 관제탑 전광판식 표시.
- 2026-11-10 · 1.55.1 — AMP 상단 계기 삭제, 도구 버튼 한 줄.
- 2026-11-10 · 1.55 — 대신남 AMP / 대신남 원 독립 앱 분리.
- 1.41~1.54 — README 변경 기록 참고(HUD PFD, 차계부, 에어라인/에어포스, 과속 카메라 개선, 뒤로가기, 가사, 반응형, 외부 앱 소리, 원형 지도, 플레이 준비, 시험판 2종).
