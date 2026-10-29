# 대신남 AMP — 작업 인수인계 (2026-10-29 기준)

새 대화에서 이 문서를 먼저 읽고 이어서 작업합니다.

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 앱 | **Daesinnam Amp** — 윈앰프 스타일 안드로이드 MP3 플레이어 (태블릿·폰·DeX·차량) |
| 저장소 | `Deasinnam/Deasinnamdb` (공개), 브랜치 **`daesinnam-amp`** |
| 최신 버전 | **v4.8** (versionCode 28) |
| APK (권장) | https://github.com/Deasinnam/Deasinnamdb/releases/download/latest/DaesinnamAmp.apk |
| APK (full) | https://github.com/Deasinnam/Deasinnamdb/releases/download/latest/DaesinnamAmp-full.apk (알림 접근 권한 포함, Play 프로텍트가 막을 수 있음) |
| 웹 미리보기 | 아티팩트 "Daesinnam Amp" — https://claude.ai/artifact/3HBdDNuM5iMgqBM6hy6HhJ |
| 빌드 | GitHub Actions `.github/workflows/build-apk.yml` → Playwright UI 테스트 → 서명(고정 키스토어, 저장소에 커밋됨) → Releases `latest`에 업로드 |

## 2. 구조

- **화면**: `app/src/main/assets/index.html` 하나에 UI 전체(HTML/CSS/JS). WebView + `WebViewAssetLoader`(origin `https://appassets.androidplatform.net`), JS 브리지 이름 `AndroidBridge`.
  - 아티팩트 버전은 같은 파일에서 `<!doctype>/<head>/<body>` 래퍼와 로컬 jsmediatags 경로만 다름.
  - `map.html`: 지도 제공자 페이지 (OSM 기본, 네이버 ncpKeyId, 카카오 appkey, TMAP jsv2).
- **네이티브** (`app/src/main/java/com/daesinnam/amp/`)
  - `MainActivity` — 브리지 메서드 (재생 상태, 외부 앱, 파일 선택, 차량 연결, GPS, 앱 열기/옆 창, 네이티브 플레이어 `np*`)
  - `AmpPlayerService` — **Media3 ExoPlayer + MediaSessionService** (v4.0~). 핸들 버튼·잠금화면·재생 재개. `SpectrumTap`(TeeAudioProcessor FFT)으로 시각화, `ExternalEq.setLocalSession`으로 EQ.
  - `PlaybackService` — 외부 앱 모드 포그라운드 서비스, 웹 데모 세션
  - `ExternalEq` (DynamicsProcessing/Equalizer), `MediaLibrary` (SAF 영구 URI, 폴더 스캔, `/media` Range 스트리밍, `/art`), `CarConnect`, `GpsTracker`, `NowPlaying`, `SpotifyInfo`, `ArtLookup`, `MediaListener`(full 판만)
- **판(flavor)**: `lite`(권장) / `full`(NotificationListener 추가)
- **테스트**: `tests/speedometer-skins.cjs` (Playwright) — 스킨, GPS, 지도, 드라이브 스킨, 권한 패널 접기, 플레이리스트 저장, 설정, 간편 모드, 차량 연결, 네이티브 인계, EQ 터치 드래그

## 3. 지금까지 구현된 기능

- 화면 크기별 자동 배치(1열/2열/가로 한 줄), 스킨: blue(기본)·amber·base·neon·ice·red·wood·**사이버 카니발**(건메탈/구리, KIA 로고)·**사이버 카니발 2 · 콕핏**(`carnival2`, 비행기 조종석 계기판, 속도계 기본 `cockpit` PFD)·**대신남 드라이브**(블루, 대신남 로고)
- 대신남 로고·앱 아이콘·스플래시
- 외부 앱(YouTube Music/Spotify) 곡 정보·앨범 아트·조작·시각화·EQ
- 자동차 스킨: GPS 속도계(디자인 5종, 메인 창 위), HUD, 창 높이 조절
- NAVIGATION 지도 창(선택 사용, OSM/네이버/카카오/TMAP, TMAP 열기·옆 창, 미사용 시 접혀서 맨 아래). TMAP 키 저장 후 자동 접기
- 권한 패널: 모두 허용되면 자동 접기
- 플레이리스트 저장(파일/폴더), 이어 듣기
- 차 연결 시 자동 재생, 주행 중 간편 모드, 설정 패널
- v4.0: Media3 네이티브 재생 (핸들 버튼 선곡 목적)
- v4.1: EQ 슬라이더가 페이지 스크롤에 밀리지 않음 (pointer capture, `touch-action:none`)
- v4.2: 사이버 카니발 2 · 콕핏 스킨 + 속도계 디자인 6번째 "콕핏 PFD" (`drawPFD`)
- v4.2.1: 콕핏 스킨에서 주행 정보를 속도계 위 한 줄로, 속도계를 창 너비 가득 크게
- v4.3: 콕핏 창 크기 조절 시 PFD 비율 대응, COCKPIT CONTROL 창(`#wCtl`, 브리지 `cockpitState/setMuted/setWifi/setBluetooth`), TOWER 창(`#wAtc`, 출발 전 점검 + WebAudio 효과음 + 브리지 `speak` TTS). 레이아웃 클래스 `.app.K`. 실기기에서 와이파이 패널·블루투스 요청 창·TTS 확인 필요
- v4.4: 조종 패널 가운데 SOS(보호 덮개 → 두 번째 누름에 `sosCall`, CALL_PHONE 권한, 설정 `#secSos`, 연락처 고르기 `pickContact` → `__sosPicked`, 저장 키 `sos`), TOWER 창 두 줄 높이로 줄이고 두 줄씩 교체, 끝나면 이륙 허가만 남김
- v4.5: 콕핏 스킨 상단을 KIA 로고 대신 "대신남 원 에어포스" 휘장(`.brand .af`, 인라인 SVG)으로, 콕핏 스킨에서는 `#wGps`만 높이 조절(`applySizes`가 나머지 저장 높이를 무시)
- v4.6: PFD에 나침반·기울기 센서(`GpsTracker.attStart/attStop/attitude` → 회전 행렬, JS `attPoll`, 기준 자세 `attRef`, "수평 맞춤"), 구름(진행 방향 앞에서 다가옴, 속도 비례, 선회 시 옆으로), 하늘 주간/야간/자동(`gSky`, 달·별·어두운 구름). 진행 방향은 센서 우선. 실기기에서 거치 방향별 기울기 부호·나침반 방향 확인 필요
- v4.7: COCKPIT CONTROL을 사용자가 준 `Daesinnam_Cockpit_Claude_Package`(cockpit.html)로 교체. CSS는 `.dsn` 범위·컨테이너 쿼리로 이식, id는 `dk` 접두사, 패키지의 `CockpitNative` 계약은 기존 `AndroidBridge`(cockpitState에 volume·wifiSupported 추가, setSystemVolume, setWifi, setBluetooth, sosCall)로 어댑터 연결. 내장 한글 글꼴(3.6MB)은 넣지 않고 앱의 Noto Sans KR 사용. SOS는 패키지의 "전화 화면 열기" 대신 이전 요청대로 바로 전화. `window.Cockpit`·`cockpit:command` 이벤트 제공
- v4.8: 조종 콘솔 압축(레버·덮개·노브 `zoom:.66`, 데스크톱 높이 약 395px), LIFT TO ARM 덮개 노란 경고 커버, 폰에서 EMERGENCY 가운데 줄. 콕핏 스킨 상단 로고를 사용자 제공 이미지(`.brand .af-img`, WebP 1200px 인라인)로 교체

## 4. 확인 대기 중

- **v4.0 핸들 버튼 선곡**: 이전 두 번의 수정(MediaSession, 오디오 포커스)은 실패. Media3로 바꾼 v4.0이 실제 차량에서 되는지 사용자 확인 필요.
- **v4.1 EQ 드래그**: 실기기 확인 필요.
- TMAP 지도 타일이 회색으로 나오던 문제: 미해결. 대안으로 네이버/카카오 선택 기능 제공함 (키 발급 시 웹 주소 `https://appassets.androidplatform.net` 등록 필요).

## 5. 진행 중: JOY TRIP 블랙박스 카메라 "대신남 버전"

**요청**: JOY TRIP 앱은 카메라 와이파이에 붙으면 폰 인터넷이 막힘 → 카메라만 와이파이, 나머지는 모바일 데이터. JOY TRIP을 대신남 버전으로.

**분석 결과 (JoyTrip 2.93 XAPK)**
- Joyhonest 공용 라이브러리 `libJoyWifiCamera.so` (JNI `com.joyhonest.wifination.wifination`) 사용.
- 지원 프로토콜: JHCMD, FDWN, GPSOCKET, GPRTP_UDP_SOCKET, GP_tcp_VideoSocket, **GP4225**(GeneralPlus 블랙박스 TCP 계열: 파일 목록, 녹화 시간, OSD, SD 포맷 등), RTSP(ffmpeg).
- 카메라 IP 후보: 192.168.25.1~192.168.35.1, 175.16.10.2, 192.168.123.1, 192.168.254.1. UDP 20001 (MyUdp20001Data).
- 블랙박스는 **GP4225** 계열일 가능성이 큼 → 공개 문서 없음.
- 참고용 공개 구현(MIT): HeikoGr/wifi-cam-proxy `firmware/src/cam_jhcmd.cpp` — JHCMD: 카메라 192.168.29.1, 명령 UDP 20000, 영상은 클라이언트 UDP 10900. INIT1 `"JHCMD"+10 00`, INIT2 `"JHCMD"+20 00`, START(3초 하트비트) `"JHCMD"+D0 01`, STOP `"JHCMD"+D0 02`. 8바이트 헤더(프레임 번호 LE 2B, 패킷 수, 패킷 인덱스), FF D8 FF ~ FF D9로 JPEG 재조립.
- **하지 말 것**: Joyhonest `.so` 재배포(비공개 라이브러리, 저장소 공개), JOY TRIP 이름/디자인 복제.

**구현 계획**
1. 네트워크 분리: `WifiNetworkSpecifier`(ConnectivityManager.requestNetwork)로 카메라 와이파이에 앱 전용 연결 → 카메라 소켓만 `Network.bindSocket()` / `network.openConnection()`. 기본 네트워크는 모바일 데이터 그대로.
2. 자동차 스킨에 **CAMERA** 창: 라이브 보기, 녹화 파일 목록, 충격 영상 재생.
3. 프로토콜 프로브: JHCMD(UDP 20000/10900), RTSP, GP4225/GPSOCKET.

**사용자에게 요청해 둔 것 (아직 안 받음)**
- PCAPdroid로 JoyTrip 트래픽 캡처(라이브 10초 → 파일 목록 → 파일 하나 재생) 후 PCAP 파일
- 카메라 와이파이 이름(SSID)
- XAPK는 이전 대화에만 첨부되어 있으므로, 다시 분석이 필요하면 재첨부 필요

**당장 쓸 수 있는 우회(설정)**: Wi-Fi → ⋮ → 인텔리전트 Wi-Fi → "모바일 데이터로 전환" 켜기, 개발자 옵션 → "모바일 데이터 항상 사용" 켜기, 카메라 와이파이 다시 연결 후 "인터넷 없음"에서 연결 유지.

## 6. 주의 사항

- 저장소는 공개이고 서명 키스토어와 KIA 로고 이미지가 들어 있음.
- 사용자 개인정보(이름·이메일·전화번호)는 문서/커밋에 넣지 않음.
- `ci-check` 브랜치는 삭제 권한(403)이 없어 남아 있음.
- 버전 올릴 때: `app/build.gradle`의 versionCode/versionName, README 갱신, 테스트 추가 후 푸시하면 CI가 Releases `latest`를 갱신.
