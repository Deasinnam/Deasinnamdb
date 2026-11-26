# DNR AI 통로 · DNR 음성 엔진 (Chat DNR Ai 0.4.0)

덜누름 앱들이 기기 안 AI(Chat DNR Ai)를 함께 쓰는 길입니다. AI 모델(약 2.6~3.7GB)은 Chat DNR Ai 한 곳에만 있고,
다른 앱은 질문 창을 불러 결과만 돌려받습니다. 인터넷을 쓰지 않습니다.

## 부르는 법
- 동작: `com.daesinnam.ai.action.ASK` (패키지 `com.daesinnam.localai`, `AskActivity`)
- `startActivityForResult` / `registerForActivityResult(StartActivityForResult)` 로 부름
- 넣는 값(모두 선택)
  | 이름 | 뜻 |
  |---|---|
  | `text` | 함께 보낼 글(선택 부분 · 문서). 앞 7,000자 |
  | `task` | `summary` 요약 · `fix` 맞춤법·다듬기 · `easy` 쉽게 · `en` 영어로 · `ko` 한국어로 · `table` 표로 · `continue` 이어 쓰기, 또는 직접 쓴 지시 |
  | `title` | 창 제목 |
  | `insertLabel` | 결과를 돌려받는 단추 이름(예: 문서에 넣기). 없으면 보기만 |
  | `voice` | true면 열리자마자 말로 묻기 |
- 돌려받는 값(RESULT_OK): `result` 마크다운 답, `plain` 기호를 뺀 글, `html` 제목·목록·표가 살아 있는 HTML, `chat` Chat DNR Ai 대화 id
- 부르는 앱 매니페스트: `<queries><package android:name="com.daesinnam.localai" /></queries>`
- 복사해 쓰는 도우미: `client/DnrAi.java`

## 안전
- 창은 사람이 보는 화면이고, 사람이 "넣기"를 눌러야 결과가 돌아갑니다(몰래 AI를 쓰거나 대화를 읽을 수 없음).
- 질문과 답은 Chat DNR Ai 대화 목록에 남아 "앱에서 이어서"로 계속 물을 수 있습니다.

## DNR 음성 엔진
- 듣기: 16kHz 녹음 → 말이 끝나면(1.2초 조용) 자동으로 멈춤 → **기기 안 Gemma 4가 오디오를 직접 받아 적음**(`Ai.transcribe`).
  모델이 소리를 못 받으면 휴대폰 내장 기기 안 음성 인식(SpeechRecognizer, 오프라인 우선)으로 바꿈. 설정에서 자동/DNR/휴대폰 내장 선택.
- 읽기: 휴대폰 TTS(삼성 · 구글 한국어 음성)로 답을 읽음. 코드 · 표 · 링크는 읽기 좋게 다듬음. 속도 4단계.
- 앱: 입력창 🎤 → 말하기 → 받아 적어 바로 질문 → (설정 켜면) 답을 소리로. 답 아래 🔊로 다시 듣기.
- 통로 창에서도 🎤 · 🔊 그대로.

## 쓰는 곳
- 덜누름 워크 1.1.0: 편집 화면의 **AI** 떠 있는 단추 → 선택한 글(없으면 문서 글)을 보내 요약·번역·다듬기 → "문서에 넣기"로 선택 부분 바꾸기/커서 자리에 넣기(그림으로 그리는 편집기는 복사해 붙여 넣기)
- 덜누름 데스크탑앱: 앱 서랍 검색창에 "DNR AI에게 묻기" · 🎤 말로 묻기
