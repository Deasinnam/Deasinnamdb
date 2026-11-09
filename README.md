# PhotoCraft 안드로이드판 (비공식)

[PhotoCraft](https://github.com/storytold/photocraft)(ArtCraft 팀의 오픈소스 포토샵 대체 프로그램, MIT/Apache-2.0)의
공식 웹(WebAssembly) 빌드를 안드로이드 앱으로 감싼 것입니다.

- 레이어·마스크·조정 레이어·글자·PSD 등 웹판 기능 그대로, 편집은 기기 안에서만
- 저장·내보내기: 안드로이드 "파일 만들기"로 원하는 폴더에 저장
- 열기: 앱 안 열기 메뉴, 또는 갤러리·파일 관리자에서 "PhotoCraft로 열기"/공유
- S펜 등 스타일러스 입력은 웹판이 지원하는 만큼

APK: [Releases → photocraft-latest](../../releases/tag/photocraft-latest).
빌드 서버가 PhotoCraft 최신 릴리스의 `photocraft-web-*.zip`을 받아 넣습니다(`.github/workflows/build-apk.yml`).
