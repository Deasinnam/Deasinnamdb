# FilmCraft 안드로이드판 (비공식)

[FilmCraft](https://github.com/storytold/filmcraft)(ArtCraft 팀의 오픈소스 동영상 편집 프로그램, MIT/Apache-2.0)의
공식 웹(WebAssembly) 빌드를 안드로이드 앱으로 감싼 것입니다.

- 타임라인 편집, 색 보정, 효과·키프레임, 오디오 믹스, 자막·타이틀, H.264/HEVC/ProRes 내보내기 등 웹판 기능 그대로
- 편집은 모두 기기 안에서 (인터넷 권한 없음)
- 가져오기: 앱 안 Import(안드로이드 파일 고르기), 또는 갤러리·파일 관리자에서 "FilmCraft로 열기"/공유(여러 개 가능)
- 저장·내보내기: 안드로이드 "파일 만들기"로 원하는 폴더에 저장 (프로젝트 .fcproj, 동영상, 오디오, 자막 …)
- 갤럭시 폴드처럼 큰 화면에서 쓰기 좋습니다. 데스크톱용 화면 구성이라 접은 화면에서는 좁습니다.

웹판의 한계(공식 문서 기준): 한 스레드로 돌아가 데스크톱판보다 느리고, 렌더 미리보기·프록시·마스크 추적 등
데스크톱에서 별도 스레드가 필요한 기능은 아직 웹판에서 동작하지 않습니다.

APK: [Releases → filmcraft-latest](../../releases/tag/filmcraft-latest).
빌드 서버가 FilmCraft 최신 릴리스의 `filmcraft-web-*.zip`을 받아 넣습니다(`.github/workflows/build-apk.yml`).
