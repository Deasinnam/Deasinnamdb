# 대신남 원 · 대신남 AMP — 작업 인수인계

> **새 대화에서는 이 문서를 먼저 읽고 이어서 작업합니다.** 작업을 하나 끝낼 때마다 이 문서를 고쳐서(맨 아래 "작업 기록"에 한 줄 + 바뀐 부분) 같이 커밋합니다.

마지막 갱신: **2026-11-26 · v1.95 (versionCode 129)**

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 저장소 | `Deasinnam/Deasinnamdb` (**공개**), 브랜치 **`daesinnam-one-v1`** |
| 최신 버전 | **1.95** (versionCode 129, versionName `1.95-one`) |
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
| `DaesinnamSpeedometer.apk` (릴리스 `speedometer-v<버전>` 초안 → 예약 공개, 풀버전만) | **출시판 대신남 스피드미터**(1.86~, flavor airdist, 라디오 없음·에어라인 스킨만) | com.daesinnam.speedometer |

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

- 2026-11-25 · 1.87 — 의견(스피드미터): 아무 블루투스에나 "차량 연결됨 · Amp로 재생" 알림. `CarConnect.matches(ctx, name, dev)`: 차를 지정하지 않았으면 `carLike()` — BluetoothClass가 `AUDIO_VIDEO_CAR_AUDIO`·`AUDIO_VIDEO_HANDSFREE`인 기기만(ACL 연결은 EXTRA_DEVICE, A2DP 출력 콜백은 이름으로 짝지은 기기 `bondedByName`). 권한 없거나 종류를 모르면 차가 아님. 설정 첫 항목 "차량 오디오 자동 인식 (이어폰·스피커 제외)"(web/src/80-clock-windows.js, index.html 설명). 로컬 테스트: 25-pfd-minimap은 지도 타일(네트워크) 탓에 수정 전에도 실패, 나머지 통과. 공개: 초안 확인 뒤 `[publish-speedometer]` 커밋 + 사이트 DL 표.
- 2026-11-26 · 1.95 — (사용자: 스피드미터 화면 오른쪽 아래 노래 제목 위에 제목과 같은 색 음악 효과, 누르면 효과 바뀜, 배경 없이 / 바깥 화면에서 '대신남 운수' 글자가 잘림.) 새 `web/src/97-pfd-songfx.js` `PfdSongFx`: `#pfdHost .pfd-canvas-wrap`에 `svg.pfd-songfx`(canvas를 쓰면 '#pfdHost canvas'로 PFD를 찾는 시험·코드와 겹쳐서 svg 경로로 그림, pfd.js는 안 건드림), 노래 제목(`.pfd-song`)이 보일 때만 30fps로 그림, 색은 제목의 computed color, 소리 값은 30-eq-visual의 `bars`·`W`, 효과 5가지(막대·거울 막대·파형·점·원) 누르면 순서대로·`store 'pfdFx'`, 시험용 `_feed()`. 간판 글자는 `fitSign()`이 실제 위치를 재서(사진과 같은 줄이면 사진 왼쪽까지, 아니면 간판 안) 넘으면 0.93배씩 줄임 — 폰 글자 크기 설정(웹뷰 글자 확대) 때문에 잘리던 것, `.tx-88` ResizeObserver. 테스트 41에 음악 효과 추가. 초안만, 출시 안 함.
- 2026-11-26 · 1.94 — 택시 미터기 간판·사진(사용자: 사진을 확대·축소해 원하는 곳을 넣게, 레트로는 '대신남 운수' 대신 보내 준 1988 그림의 '세계는 서울로 서울은 세계로', 다른 스킨은 두 간판을 바꿀 수 있게). 사진 고르면 `cropEditor()` 창(`.tx-crop`): 원 안에서 끌어 옮기기, 두 손가락·휠·막대로 1~5배, '넣기'면 원 부분을 360px jpeg로 저장(1600px 넘는 사진은 먼저 줄임). 간판: `W.dataset.txsign` = 레트로는 늘 's88', 실물 전자식·LCD는 `store 'taxiSign'`('dsn' 기본) — 간판 왼쪽 위 `⇄ 간판` 단추로 바꿈. 's88' 그림은 사용자가 보낸 목업 아래 띠를 잘라 `assets/taxi/seoul88.jpg`(넓을 때 한 장)·`seoul88-text.jpg`·`seoul88-city.jpg`(좁을 때 글자 위·도시 아래, 가장자리를 종이색 #f5cf9f로 번지게) — 글자 잘림 없게 contain. 테스트 50에 편집 창·간판 바꾸기·그림 로드 추가. 초안만, 출시 안 함.
- 2026-11-26 · 1.93 — 택시 미터기(사용자: 실물 전자식에서 주행 누르면 화면이 사라짐, '전자택시미터' 키패드 필요 없음, '세계는 서울로' 빼고 노란 '대신남 운수' 간판 + 사람 모양을 누르면 본인 사진이 원 안에, 모든 스킨, 글자 잘림 금지). 실물 전자식 `.tx-pad2`·LCD `.tx-pad` 키패드와 키패드 기능 처리 삭제, 실물 전자식은 늘 한 덩어리(lay tall). 아래 `.tx-88` 안을 `DSN_SIGN`으로: 노란 간판·TAXI 지붕등 svg·'대신남 운수'·체크 띠·둥근 사진(`.ds-photo` 누르면 숨은 `<input type=file accept=image/*>` → 가운데 정사각형 360px jpeg로 `store 'taxiPhoto'`, `.ds-img` 위에 테두리 `.ds-ring`), container query로 넓으면 글자|사진, 좁으면 사진 위·글자 아래, 레트로는 바랜 법랑 간판. 안드로이드 `onShowFileChooser`가 accept에 image가 있으면 image/* 한 장을 고르게(전엔 늘 audio/*). '주행 누르면 사라짐'은 브라우저에선 재현 안 됨 — 미터기가 무너지면(폭<50% 또는 높이<60) 0.35초 뒤 다시 맞춤, 앱으로 돌아오거나 포커스가 오면 다시 맞춤, `.tx-dev`·`.rt-dev`에 최소 폭. 13가지 화면 크기×3스킨에서 글자 잘림·겹침 0건 확인. 말(실물 전자식 도트 말·레트로 크림색 말): 사용자 요청으로 주행 중이면 서 있어도 제자리에서 달림(보폭 0.55부터 천천히 커지고 속도가 붙으면 최대, 빈차·지불이면 네 발로 섬 — 1.89의 'GPS 흔들림엔 서 있기' 규칙은 없앰). 바깥 화면 가로처럼 아주 낮고 넓은 칸(pw/H>2.2)은 실물 전자식 글자를 덜 키움(CI에서 미터기가 너무 작다고 실패했던 것). 테스트 49·50 고침(키패드 없음, 사진 넣기, 제자리 달리기). 초안만, 출시 안 함.
- 2026-11-25 · 1.92 — 택시 미터기 화면 채우기(사용자 폴드7 실기 사진: 바깥 화면은 빈 공간이 많고 하나되는 느낌 없음, 펼치면 그림이 LCD에서만·잘려서 나오고 실물 전자식은 안 나옴, 펼친 세로에서 미터기가 가는 세로줄로 무너짐, 전체 모드에서 실물 전자식·레트로가 안 보임). `fit()` 다시 씀: 창이 화면을 채우면 [미터기][오디오(길쭉한 화면 ah>pw*1.45일 때)][세계는 서울로(남는 칸 전부, 최소 max(130, ah*0.24))] 순서로 위아래를 꽉 채움, 미터기는 `fitMeter()`가 실제 크기를 재서 맞추되 --u가 처음 값의 30% 밑으로는 안 내려감(최소 글자 크기 웹뷰에서 무너지던 것), 칸 높이가 200 미만이면 0.3초 뒤 다시. 창이 여러 개인 전체 모드에선 `.tx-stage` 높이를 미터기 높이로 정해 줌(전엔 0이라 안 보였음). `.tx-dock` = 원래 플레이어(#wMain)의 리모컨(제목·시간·재생 위치·이전/재생/일시정지/정지/다음·셔플·반복·VOL·BAL — 누르면 원래 단추를 누르고, 0.5초마다 상태를 가져옴). 레트로에선 은색 판 + 카세트 데크 피아노 키 + 금속 페이더. '세계는 서울로' 그림은 HTML로(하늘 그라데이션이 칸 전체, 도시 svg는 아래에 slice, 글자는 container query cqw/cqh, 가로로 넓으면 글자 오른쪽). 테스트 50에 오디오·그림·전체 모드 확인 추가. 초안만, 출시 안 함.
- 2026-11-25 · 1.91 — 택시 미터기 손봄(사용자: 폴드7 실기 화면에서 위아래 잘림, "하단에 불필요한게 너무 많아, 스킨 버튼만 따로 빼고 하단에 서울88올림픽 그림과 '세계는 서울로 서울은 세계로'", "레트로에서 빈차 누르면 동그란 빈차가 승차요금을 가리게", "레트로는 요금 오를 때 동전 소리"). `fit()`이 어림 비율 대신 실제로 그려진 미터기 크기를 재서 --u를 다시 맞춤(최대 3번), 패널을 ResizeObserver로 봄, `.tx-stage` align-items `safe center`. 실물 전자식 세로(tall)에선 키패드 숨김(스킨은 위 단추 줄로). 세로로 남는 자리가 있으면 미터기 아래에 `.tx-88`(SEOUL88 svg — 직접 그린 해 지는 한강·남산타워·63빌딩 + 문구 + SEOUL · 1988; **호돌이·서울올림픽 엠블럼·오륜은 상표·캐릭터라 넣지 않음**), 안내는 한 줄(`.tx-wmore` 숨김). 레트로 `.rt-vac`: 빈차(요금 0·정지·미지불)이면 빨간 '빈차' 원판이 팔과 함께 오른쪽 위 축에서 휘둘러 내려와 승차요금을 가리고, 주행하면 올라감(`data-txvac`). 레트로에서 요금이 오를 때 `coin()`(웹오디오 합성, 금속성 두 번). 테스트 50에 빈차판·동전 추가. 초안만, 출시 안 함.
- 2026-11-25 · 1.90 — 택시 미터기 폴드7 맞춤 + '레트로' 스킨 + 스킨 단추 줄(사용자: "폴드7에 최적화가 안되어 있어, 레트로 미터기 적용, 스킨 변환 버튼"). 창 구조 `.tx-panel > .tx-skinbar(실물 전자식|레트로|LCD 클래식|⇄) + .tx-stage(.tx-dev, .rt-dev) + .tx-warn(한 줄, 낮은 화면은 뒷문장 숨김)`. JS `fit()`(ResizeObserver)가 칸 폭·높이로 `--u`(설계 폭 1000의 1칸)·`--ah`·`data-txlay`를 정함: 실물 전자식 wide(2.55)/tall(1.12, 키패드 아래 가로·액정 글자 1.42배), 레트로 sq(0.92)/rwide(위판|아래판 나란히, 폭 1800칸), LCD short(높이<300: 단추를 액정 오른쪽 세로로). 실물 전자식 CSS는 vw→`calc(var(--u)*n)`. 레트로 `.rt-dev`: 은색 틀·나사 4·크림 위판 '승 차 요 금'·숫자 드럼 6(띠 translateY)·빨강 깃발(빈차 초록/지불 황토)·초록 아래판 거리(x.x km)·시간(분) 드럼·크림색 실루엣 말(`TaxiHorse(...,{style:'fill'})`, 먼지 줄)·크림 단추 5·걸쇠·유리 반사. 단추·표시는 querySelectorAll로 두 벌 모두 연결(같은 상태 S). 테스트 50 추가(스킨 줄·레트로 드럼·지불·⇄·폴드7 4화면×3스킨 넘침 없음), 49·45 선택자 정리. 초안만, 출시 안 함.
- 2026-11-25 · 1.89 — 택시 미터기 '실물 전자식' 스킨(사용자: 검은 실물 미터기 사진=외형, 하늘색 7,500원 시안=배치). `#wRadio[data-txskin="pro"|"lcd"]`, store `taxiSkin`(기본 pro), 창 제목줄 `select.tx-skinsel` + 키패드 [스킨]. 같은 DOM·상태(S)를 CSS로 다르게 보여 줘서 운행 중 바꿔도 금액·거리·시간·단추가 이어짐. pro: 2fr|1fr 그리드(왼쪽 액정+운행 키캡, 오른쪽 `.tx-pad2` 키패드 — 기능키 GPS·수평·하늘·안내·스킨·영수, 숫자 1~9·0 장식, 설정/변경=설정 창, 취소=할증 끔), 620px 이하는 키패드 숨김. 시안의 상표·'확률/인환' 등 글자는 쓰지 않음(맨 위는 '서울 · 중형'). 요금은 `fitFare()`로 넘치면 글자 줄임(여섯 자리 확인), `.tx-fare` 오른쪽 정렬·'원' 기준선. 키캡: :active 눌림, `.on` 선택은 눌린 채+위 빨간 표시등. 말: `web/src/99-zz-taxh.js` `TaxiHorse(canvas)` — 말 좌표 100×66, 몸·목·머리·갈기·꼬리·가까운 다리는 밝은 마스크, 먼 다리는 어두운 마스크에 칠해 가장자리만 초록 도트(격자 가로 56~96점). 갤럽 위상차 먼뒷 0·가까운뒷 .08·먼앞 .30·가까운앞 .40, 디딤 .30 → .70~1.0 공중(네 다리 모임). 두 마디 IK(앞다리 무릎 앞, 뒷다리 뒤), 몸 오르내림·머리·꼬리는 위상 늦춤, 모두 주기 함수라 이음매 없음. 속도 보정(애니메이션만): 평균(τ0.8s), 출발=5km/h 넘게 1초, 정차=2.5km/h 밑 1초, 보폭 amp 목표 0.3+속도/75(출발 τ1.6s, 정차 τ0.55s), 주기 0.55+속도/55 Hz, 정차 시 네 발 디딤. 미리보기 `AmpTaxi._preview({fare,spd,km,time,next})`(시안 값 7,500원·32.0은 여기서만), `AmpTaxi.horse.pose(위상,보폭)`. 테스트 49.
- 2026-11-25 · 1.88 — 재미용 안내(사용자: 실제 금전 거래는 위반이라고 명시): 미터기 아래 `.tx-warn` 상시 안내 + 처음 [주행] 때 `.tx-ack` 확인 창(store `taxiAck`), 문구에 「여객자동차 운수사업법」 제81조(자가용 자동차의 유상운송 금지). 설명서 taxi 단계 마지막 줄도 같은 안내.
- 2026-11-25 · 1.88 — 택시 미터기(사용자: 라디오 빠진 자리에, 누르면 말이 뛰고 실제 주행 거리만큼 금액). 생김새는 사용자가 보낸 실제 미터기 사진처럼: 검은 테·연두 LCD(모드·속도·할증%·요금·말·거리/시간/다음)·색 단추(빈차 흰·주행 분홍·할증 분홍(시계외 20%)·복합 노랑(40%)·지불 초록)·오른쪽 숫자 키(장식, 좁은 화면에서 숨김). 1.87은 다른 세션이 차량 연결 수정으로 먼저 공개해서 이 버전은 1.88(speedometer-v1.88 초안, 공개는 [publish-speedometer]). `web/src/99-zz-taxi.js`(DISTF에 noradio일 때만, `window.AmpTaxi`): #wRadio 안에 `.tx-body`를 넣고 `.rd-body`는 CSS로 숨김(`data-taxi`), 창 제목 Taxi Meter·상태 #rdSt·COM→SEOUL, 위 #radioBtn·레일 radio 버튼은 택시 아이콘/글자로 되살림, openRadio=택시 창 열기, rdEnsure·rdSigRun 비움, 버튼 배치 고르기의 'radio' 항목 이름은 '택시 미터기'. 99-zz-dist에서 radio→vis 돌리기·openRadio 막기·radio 옵션 지우기는 뺌(#bSwap만 숨김). 요금(서울시 교통 누리집 신고요금): 주간 4,800원/1.6km·131m당 100원·30초당 100원, 22~23·02~04시 5,800/120, 23~02시 6,700/140, 15.72km/h 미만이면 시간을 131m/30초로 환산(기본거리부터), 지불=100원 단위 반올림. 거리=40-gps-speedo의 trip.dist 증가분(0.5초 폴링), 상태 store 'taxi'. 말은 직접 그린 SVG(다리 4개 따로 흔듦, 속도 따라 --gait), 진행 막대=다음 요금까지. 설명서 단계 'taxi'(noradio만, 그림 g-taxi.jpg). 테스트 48, 45 수정.
- 2026-11-22 · 재배포 금지 — 사이트 스피드미터 페이지 내려받기 아래 `.ap-nodist` 안내, `docs/speedometer-release.md`에 '재배포 금지' 절. 공개된 릴리스 설명 바꾸기: 커밋 메시지에 `[speedometer-notes]` → publish-speedometer.yml의 notes job이 문서로 PATCH.
- 2026-11-22 · 출시 — 16:01 예약 작업이 `[publish-speedometer]` 빈 커밋 → publish-speedometer 워크플로로 `speedometer-v1.86` 공개(DaesinnamSpeedometer.apk 하나). 사이트(gh-pages `src/index.html` DL 표) `app-speed` open:true, tag speedometer-v1.86, versions 첫 줄 추가, '오후 4시 출시' 문구를 '출시'로. 다음 버전 공개: 버전 올려 push → 초안 생김 → 확인 뒤 `[publish-speedometer]` 커밋, 사이트 DL 표 tag·versions에 한 줄 추가.
- 2026-11-21 · 1.86 — 사용자: 출시 이름은 **대신남 스피드미터**, 풀버전 하나만, 자동차 모드 스킨 삭제·3D 맵은 정식판에서. airdist: applicationId `com.daesinnam.speedometer`, app_name '대신남 스피드미터', 네이티브 distFlags `noradio,airline,dsp`(lite면 `,lite` 추가). `00-core` 맨 앞에서 `DISTF`(=window.__distFlags) 계산 → `airline`이면 ONE_SKINS=['carnival7'](저장된 다른 스킨은 에어라인으로), `dsp`면 pfd-special의 '대신남→에어포스원' 바꿔 부르기 안 함(화면은 '대신남 에어라인' 등). 99-zz-dist는 DISTF 사용, AmpDist에 airline·dsp. 설명서(98-guide): airline이면 스킨 단계 문구·그림 `g-skin-d.jpg`, 과속 카메라 단계에서 3D 맵 문장·영상 뺌, dsp면 외부 앱 단계 그림 `g-ext-d.jpg`(알림 접근 줄 이름을 '대신남 스피드미터'로 고친 그림). CI: 태그 `speedometer-v$VN`, 파일 `DaesinnamSpeedometer.apk`, 노트 `docs/speedometer-release.md`. 예전 airforceone 초안(1.84·1.85)은 지움. 예약 작업은 speedometer 초안을 공개. 테스트 47 추가.
- 2026-11-21 · 1.85 (같은 버전, 배포·사이트) — 사용자: 배포는 에어포스원 **풀버전만** 예약 시각에. CI 초안 릴리스에 `AirForceOne-full.apk`만 올림(라이트는 빌드만), `docs/airforceone-release.md`도 풀버전만 + 📖 초기 세팅 방법 안내. 예약 작업 `trig_01M7sX7xEQeNtxSH7tX2h6S4`(2026-11-22 16:00 KST) 프롬프트: 가장 높은 airforceone 초안에서 lite apk가 있으면 지우고 풀버전만 공개. 사이트(deolnureum.com, 브랜치 `gh-pages`, 원본 `src/index.html` → `python3 tools/build_pages.py`)의 /speedometer/에 `#spd-guide` "사용 방법 · 초기 세팅" 8단계 그림(`media/guide/g-*.jpg`, 앱과 같은 그림) + 09 이륙 안내, 위쪽에 [📖 사용 방법 · 초기 세팅 보기] 버튼(`data-scroll`, 사이트 라우터가 #링크를 가로채서 버튼+스크립트로 스크롤), 05 소개 줄을 활주로 스킨 3종으로.
- 2026-11-21 · 1.85 — 스킨 하나로 + 초기 세팅 방법(사용자: 스킨은 스피드미터 고르기로 통합, 위 스킨 버튼 삭제, 버튼 설명이 없으니 그림 설명서). `web/src/97-skin-unify.js`: APP==='one'일 때 `data-skuni`, #gStyleBar·#gStyle 옵션을 optgroup '활주로 스킨'(값 `sk:carnival|carnival7|carnival8`) + '계기판 디자인'(cockpit 항목 없음)으로 다시 만듦. 보이는 값 = 콕핏 PFD 중이면 `sk:<스킨>`, 아니면 계기판 값(`skuSync`, setGStyle·setSkin0 감쌈). 자동차 모드에서는 제목줄 고르기가 숨어 콕핏 컨트롤 #gStyle로 되돌아감. #skinBtn·#skinPick CSS로 숨김, 설정의 스킨 줄 숨김. `window.AmpSkinUni`. 콕핏 컨트롤의 `select.pfd-mode`(콕핏 PFD/에어포스/심플 HUD)는 PFD 표시 방식이라 그대로. `web/src/98-guide.js`(`window.AmpGuide.open(n|key)`): 도구 줄 #guideBtn(처음엔 금빛 깜빡임 `gd-new`, 처음 설치 때 토스트 한 번) + 설정 맨 위 #sGuide. 단계 9개(라이트판은 외부 앱 단계 빼고 8개), 그림 `assets/guide/g-*.jpg`(웹 화면을 Playwright로 찍어 PIL로 번호·금테; 외부 앱·알림 접근은 사용자 스크린샷 잘라 씀), 영상 `guide/v-flight|cam|3d.mp4`(사용자 주행 영상 22-40-31·22-39-17·22-38-58에서 잘라 540×600, 소리 없음, 포스터 .jpg) — fetch→blob 재생(앱 파일 응답은 구간 요청 없음). 테스트 46 추가, 28은 one/std에서 스킨 버튼 대신 고르기 확인.
- 2026-11-21 · 1.84 — 배포용 에어포스원: flavor `airdist`(device, applicationId com.daesinnam.airforceone, 리소스는 app/src/airdist = special 복사). 네이티브 `buildKind()`는 airdist면 "special"(화면·기능 그대로), `distFlags()` = "noradio"(full) / "noradio,lite"(lite), MediaListener ON도 airdist 포함. `web/src/99-zz-dist.js`(`AmpDist`): noradio면 :root[data-noradio](CSS로 #radioBtn·레일 radio·#wRadio·#bSwap 숨김), rdPlay·openRadio·AmpRadio 무력화, ckFocus('radio')→vis, lastSrc/ckFocus/carSrc의 radio 되돌림, 모든 select의 radio 옵션 제거; lite면 :root[data-noext](#bInput·#xinPick·#wExt·#secExtSnd·#srcSeg 숨김), AmpExt.start 무력화, 차 연결 음원 ytm·spotify 빼기. 시험은 window.__dist. CI는 airdist 두 개를 workflow 산출물로만(one-v1 릴리스 목록에 없음). 테스트 45.
- 2026-11-20 · 1.83 — 3D 맵 이착륙(사용자: 활주로가 사라지거나 하늘·땅이 엉킴, 이륙 때 활주로가 같이 날아감). 원인: 활주로를 매 프레임 2D 흐름값 rwS(활주 중 시각 가속·이륙 뒤 950/초로 줄어듦)로 카메라 앞에 다시 놓았고, 높이는 그 자리 지도 고도·카메라는 내 자리 고도라 서로 어긋남. 이제 `placeRunway`: hold·landed(및 처음)엔 내 자리(60m 뒤에서 진행 방향), roll부터 고정, approach 땐 rwS 앞에 놓고(들어올 때 접지점 고도로 rwY) rollout부터 고정. 땅 셰이더가 공항 구역(SH.uRw 중심·방향, uRwS 반폭 230·반길이 900 + 가장자리 260/320 부드럽게)을 uRwY로 평평하게, JS `flatAt`이 같은 식으로 카메라 바닥 계산. 하늘(F.alt>2)에선 카메라 ≥ 실제 땅+12m. 활주로 depthTest는 지상·접근 단계에만 끔. 지도 단계 틈 아래에 90km 바닥판(안개색). 공항 구역 건물·나무 discard(나무도 buildingMaterial(true)).
- 2026-11-20 · 1.82 — CARTO basemaps가 API 키 없이 "API KEY REQUIRED" 그림을 돌려줘(실패가 아니라 그림이라 대체도 안 됨) 땅이 하얗게 덮였음 → TILE_URLS는 OSM 하나. `cleanTile`은 사용자 요청대로 글자(산 높이·도로 번호·지명)는 남기고 숲·풀밭 기호만 지움: 5×5 닫힘 결과가 초록 바탕(G>R+10, G>B+4)이고 원래 점이 초록 기운(g≥r+4)이면서 30 넘게 어두울 때만 닫힘 색으로. 출처 "© OpenStreetMap". 키 없는 다른 타일 서버를 쓸 땐 실제 그림이 오는지 꼭 확인.
- 2026-11-20 · 1.81 — 3D 맵: 활주로 rwMesh·유도등 lights는 depthTest·depthWrite 끔, transparent, renderOrder 1000/1001(맨 마지막). 지도 TILE_URLS[0]=CARTO voyager_nolabels({s}=a~d), 실패한 요청은 그 타일만 OSM으로 다시(`first`로 출처 기억 — 동시 실패를 fails로 세어 net=false 되던 버그 피함). `cleanTile`: 무채색 최빈값으로 바탕 밝기(uBg) 추정 + OSM이면 5×5 닫힘(최댓값→최솟값)으로 글자·기호 지움. 물=파란 기운, 건물=바탕보다 .025~.17 어두운 무채색, 숲=초록 기운으로 색 이름 없이 분류(셰이더·건물 세우기 둘 다). 출처 표시 "© OpenStreetMap · © CARTO". 테스트 44: CARTO 막고 OSM 대체·활주로 맨 위 확인.
- 2026-11-20 · 1.80 — 대신남 3D 맵 스킨(`carnival8`, 00-core SKINS·CAR_SKINS·ONE_SKINS). setSkin0에서 안으로는 carnival7로 바꾸고 `:root[data-sk3d]`만 더함(그래서 모든 기능이 에어라인과 같음, 고른 값·버튼 표시는 skinPref). 엔진: `web3d/scene3d.js`(three 0.187 + Sky·EffectComposer·UnrealBloom·OutputPass) → `node tools/build-3d.cjs`(esbuild, devDeps three·esbuild)로 `assets/pfd3d.js` 한 파일(약 600KB, 커밋함). 연결: `assets/pfd-3d.js`(index.html에서 pfd-special 다음) — data-sk3d면 drawSky를 건너뛰고 drawGround에서 엔진 그림을 피치·롤을 되돌린 좌표에 drawImage(카메라는 같은 피치·롤, 수평선 0.53·h/58°로 맞춤). 지도: OSM 타일 z15/z13/z11 각 5×5(가까운 단계가 덮는 곳은 먼 단계에서 discard), 고도 AWS terrarium, 가까운 3×3 타일의 건물색(#d9d0c9)·숲색 칸을 InstancedMesh 상자·원뿔로. 위치는 GPS(1초 위치를 속도·방향으로 이어 붙임), GPS 없으면 서울 시청에서 F.wz만큼. 활주로·관제탑·격납고는 지상·접근 단계에 내 앞, 이륙 뒤엔 그 자리. 가볍게 모드: 그림자 끔·해상도 1.25배 이하·초당 30번. (2) pfd-flight P.drawHorizon이 d/dp 자세 값을 0/비행 기울기로 바꾸고 되돌리지 않아 추가 그리기마다 피치가 쌓였음 → finally에서 `save` 되돌림. 테스트 44(가짜 지도·고도 타일 tests/fixtures), 01·26·28 스킨 목록.
- 2026-11-20 · 1.79 — 무료 공개 자료(Poly Haven·Kenney)는 작업 공간에서 내려받을 수 없어 코드로 만듦: pfd-special.js `FTEX`(256px, 8×8 값 노이즈 얼룩 + 64px 구획마다 방향·간격이 다른 이랑 + 잔 알갱이, 128 회색 바탕) → `drawFieldDetail`이 X.river 맨 앞(강·마을·바다보다 먼저)에서 `slices`로 soft-light, 고화질 4200·1.28 / 가볍게 2200·1.6. `slices` 패턴 변환에 F.lo 가로 이동 추가(바다 물결도 함께). 데스크톱 측정 draw ≈4.5ms. 사용자가 자료 파일을 올려 주면 FTEX·RTEX를 그 이미지로 바꾸면 됨.
- 2026-11-20 · 1.78 — (1) 수평: 40-gps-speedo attPoll에서 r0(기준 오른쪽)를 화면 x축 투영 대신 `nrm([u0y,-u0x,0])`(화면 평면에서 기준 위쪽에 직각)로 — 세워 거치하면 화면 축이 90°·180° 어긋나도(폴드 세로 srot) 같은 기울기. 예전 식은 위쪽이 x축과 겹치면 0벡터가 돼 뒤집히듯 튐. 눕혀 거치(pl≤.45)는 예전 식. srot가 바뀌면 ref를 비우고 다시 잡음. (2) 운전 기록: pfd-flight `F.trip`(roll 시작~착륙: 시간·거리·1초 가속 >11 급가속/<-13 급감속(3초 간격, |a|<38만)·110km/h 넘은 초), 착륙 때 `tripEnd()`→`F.lastTrip`{avg,score=100-4·급가속-5·급감속-과속10초당1,grade,km,min}, `AmpFlight.state.trip`. `web/src/97-pfd-trip.js`가 landed일 때 `.pfd-trip` 녹색 글자(40초, 다음 출발 시 숨김). 테스트 43.
- 2026-11-19 · 1.77 — 땅이 방향 따라 옆으로: pfd-flight.js update()에서 `F.lo -= angleDelta(prev,hd)*LO_K`(LO_K=.92/72.5*800/.79 ≈ 하늘과 같은 화면 이동, ±2400), 앞으로 달린 거리만큼 `F.lo*=exp(-moved/3000)`로 가운데 복귀. drawAirport에 `pxL=(X+LO)*f/Z`·`quadL`(들판·길·나무·drawCountry·afterCountry, 공항 잔디·활주로는 px 그대로), 반복 범위는 -LO 중심. pfd-special: edgePts 역변환에 -g.lo, 전신주·고랑·nightGround(px에 LO, 들판·가로 길·마을·외딴집·가로 불빛 범위 C0=-LO 중심). 테스트 42.
- 2026-11-17 · 1.76 — `web/src/97-pfd-song.js`(`PfdSong`): 1초마다 `#npTitle`을 읽어 `#bPlay.hot`(재생 중)일 때만 PFD canvasWrap에 `.pfd-song`("♪ 제목") — CSS는 right=띠+14px, bottom=나침반+34px, 녹색 #6dff7a·검은 그림자, 배경·테두리 없음, 좁은 화면은 --nar-tape 기준. 스페셜 누적 주행거리 칩(pfd-special.js odoUi): `view` odo↔oil 토글(탭), 길게 누르기(650ms)=km 입력, km가 0이거나 `AmpLog.oil()`이 null(전기차·미리보기)이면 탭=입력. `AmpLog.oil()`={has,left,ikm} 추가(63-carlog.js). 테스트 41.
- 2026-11-17 · 1.75 — (1) 하늘 자동이 안 먹던 원인: 계기 테마(pfdSet.theme)가 주간·야간으로 고정돼 있으면 하늘과 무관하게 그 값이 이김. 스페셜판(pfd-special.js skyUi)에서 테마는 늘 auto: 시작 때 고정 해제, `A.setTheme`를 하늘로 바꿔 끼움(day→noon, night→night, auto→auto), 설정 창 `els.theme` 옵션을 SKY 목록으로 바꾸고 라벨 "하늘 (주간·야간)", openSettings는 skyMode를 보여 주며 submit(capture)에서 값을 auto로 바꿔 패키지에 넘기고 setTimeout으로 skyApply. 98-cockpit-special 스위치는 지금 낮·밤 기준으로 토글. (2) 원형 지도가 차 방향과 안 맞던 원인: hdgNow가 달리는 중에도 att.hdg(휴대폰 기울기·나침반)로 덮어써짐. 40-gps-speedo에 `gpsTrk`(GPS bearing, 없으면 연속 위치로 계산, 9km/h 이상에서만 갱신) 추가, 달리는 동안은 hdgNow도 gpsTrk 우선; 원형 지도 회전·과속 카메라 앞쪽 판단은 gpsTrk 사용. 테스트 16·25 수정, 39 재작성.
- 2026-11-16 · 1.74 — 진짜 원인: 스페셜 하늘 고르기(pfd-special.js `skyApply`)가 `window.__spTime`을 고른 시각으로 고정하고 `spSky`에 저장 → 다시 켜도 복원돼 `AmpAutoNight`(해 높이)가 영원히 그 시각 기준. 이제 시작할 때 spSky를 auto로 되돌리고, 고를 때 실제 낮·밤(`realNight()`, 실제 Date로 해 높이)을 `pickNight`에 기억, 60초마다 바뀌면 `skyApply('auto',true)`. 야간 밝기 `NBRI=10`(97-brightness.js, 판 구분 없음), 콕핏 스페셜 야간 스위치 10%, 스위치 표시는 계기 테마가 auto로 돌아가면 cksDay=null로 실제 낮·밤 표시(5초마다). 테스트 16·29·32 기대값 10%, 40 추가.
- 2026-11-15 · 1.73 — 낮·밤 자동(pfd-amp.js): 주간·야간을 직접 고르면 `pinAt`에 그때의 autoNight를 기억, applyTheme(60초마다)에서 해 뜸·해 짐으로 autoNight가 바뀌면 theme=auto로 되돌리고 pfdSet에 저장(setTheme·설정 대화상자는 pinAt 초기화) — "시간대 자동 변경 안 됨"의 원인은 고정된 수동 테마. 과속 카메라(89-speedcam.js): 앞쪽 가장 가까운 카메라가 FAR_M(500m) 안일 때만 표시, 500m 첫 알림(삐+음성 "과속 카메라"), NEAR_M에서 두 번째, 지날 때까지 남은 거리 유지; 원형 지도(51-pfd-minimap.js)는 경고 중인 카메라 하나만 `.pm-cam.pm-camera`(카메라 아이콘+제한속도)로. 일반 속도 표지는 안 그림. 테스트 18 수정, 39(테마 자동 복귀) 추가.
- 2026-11-14 · 1.72 — 좁은 화면 PFD 띠 감추기(pfd.js는 그대로): 패키지 띠 폭 = clamp(그림 폭×0.12, 67, 175)이므로 `94-narrow.js`가 `--nar-tape`를 계산(보이는 폭 V → 띠 t, 그림 폭 V+2t)하고 CSS가 `.pfd-canvas-wrap`을 그만큼 넓혀 `margin-left:-t`, `.pfd-glass{overflow:hidden}` — 띠는 유리 밖. `.flt-btns` right도 t만큼 안으로. 가운데 속도 `.nar-spd`(canvasWrap 안, 0.2초마다 `AmpPfd.panel.display.speedKmh`, valid일 때만), 자리는 조준 기호((H−나침반)×0.53) 아래 28px, 원형 지도와 겹치면 지도 오른쪽 빈자리 가운데. 테스트 38.
- 2026-11-14 · 1.71 — `#bInput`(.tb.xin, 꺼내기 ⏏ 아이콘, bSwap 바로 뒤) + `#xinPick`(YouTube Music·Spotify, 글자 버튼 — 로고 없음) — `96-ext-input.js`(`AmpExtInput`)가 열고 고르면 `AmpExt.start(pkg)`. `#bEject`(내 음악 파일 열기)는 폴더+ 아이콘으로 바꿈. 좁은 화면 transport는 칸 수 상관없이 한 줄(grid-auto-flow column). 테스트 37.
- 2026-11-14 · 1.70 — 가볍게: `pfd-flight.js` drawWeather 비 빗줄기 끔(`k==='rain' && false`), animGap 비 60ms 없앰(눈만 80ms), 평소 100→200ms(절전 250→400). `pfd-special.js` 바다·강 잔물결 패턴의 `t*5`/`t*6` 시간항과 윤슬 sin(t…) 깜빡임 제거(거리 wz로만 움직임). `51-pfd-minimap.js` `.pfd-odo`(총 주행) 항상 숨김 — 테스트 25 갱신.
- 2026-11-14 · 1.69 — `95-iconbar.js`(`AmpIconBar`): 콕핏(:root[data-ck2]) 도구 줄 글자를 span.tl로 감싸 숨기고 aria-label·title, 없는 아이콘(내 음악·외부 앱·화면·간편 모드·음악 추가) 넣음; `.brand`를 `.brandwrap`으로 감싸 아래에 `#dStrip .dsi`(날짜·요일, 30초마다) — 띠가 줄을 깨지 않게 한 덩어리. app.css 끝: 계기 `#clkDate`·`#clkNow em`·`::after`(날씨·나침반·밝기) 숨김, 도구 버튼 48px, ≤620px는 5열 그리드(`.seg` display:contents, 화면 고르기 2칸). 라디오: 즐겨찾기 0개면 4칸·`rdPresetOpen` 기본 접힘(방송 목록이 보이게), `rdPresetCols`는 접혀 있을 때 `repeat(N` 지정값도 읽음. 몬스타덱: `resumeIfAllowed`가 허용 없으면 실행 중 한 번 `connect()`(허용 창), claim 재시도 16회(2초마다 형제 앱에 다시 RELEASE), `sendImages`는 finally로 STP(그림 실패 시 키 신호 끊김 방지), 웹 `__deckState`에서 연결됨/이유 토스트. **덱 무반응의 정확한 원인은 실기기 상태 문구로 확인 필요**(설정 › 몬스타덱의 상태·USB 장치 목록). 테스트 36(위쪽) 새로, 15·33·35 갱신.
- 2026-11-14 · 1.68 — `#wGps.hasrail` 안 `.pfd-status-line`·`#gMsg` 숨김(app.css 끝). `ckRailPlace`: 콕핏 스페셜(isCks)이면 wGps도 계기 유리 뒤가 아니라 다른 창처럼 grip 앞(창 맨 아래) — 보기마다 버튼 줄 위치 같음(테스트 35에 검사).
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
