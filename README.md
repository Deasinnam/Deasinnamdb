# 대신남 워크 (안드로이드)

문서 · 사진 · 동영상 편집을 한 앱에 담은 안드로이드 앱입니다. 첫 화면에서 편집기를 고르거나, 파일을 열면 형식에 맞는 편집기로 바로 들어갑니다.

| 기능 | 바탕이 된 오픈소스 | 라이선스 |
|---|---|---|
| 문서 편집 (워드·엑셀·파워포인트·한글·PDF 보기·EPUB·마인드맵·다이어그램·마크다운·HTML) | [IeumOffice](https://github.com/pblsketch/ieumoffice) v0.12.12 | Apache-2.0 |
| 사진 편집 (레이어·마스크·보정·PSD) | [PhotoCraft](https://github.com/storytold/photocraft) 최신 웹 빌드 | MIT 또는 Apache-2.0 |
| 동영상 편집 (컷·색·효과·오디오·자막·MP4) | [FilmCraft](https://github.com/storytold/filmcraft) 최신 릴리스 소스 | MIT 또는 Apache-2.0 |

원작의 저작권 표시·라이선스·NOTICE는 앱의 **정보 · 오픈소스 라이선스** 화면(`assets/work/about.html`)에 그대로 넣습니다.
제품 이름·아이콘·시작 화면 문구는 대신남 워크 것으로 바꿨습니다(원작 이름·로고 권리는 라이선스에 포함되지 않음).

## 구조

```
HomeActivity     첫 화면 (assets/work/) — 편집기 고르기, 파일 열기 → 형식별 편집기
OfficeActivity   문서 편집 — IeumOffice 화면 + 앱 안 Node.js 문서 엔진 (docs/HANDOFF.md)
PhotoActivity    사진 편집 — 별도 프로세스(:photo), assets/photo/ + photo-bridge.js
FilmActivity     동영상 편집 — 별도 프로세스(:film), assets/film/ + film-bridge.js
CraftActivity    사진·동영상 공통: WebView, 저장 가로채기 → 안드로이드 파일 만들기, 열기·공유 넣기
```

## 빌드 (GitHub Actions, 브랜치 `daesinnam-work`)

1. IeumOffice AppImage에서 편집기 화면·문서 엔진을 만들고 이름을 바꿈 (`tools/build_web.py`, `build_node.py`)
2. 안드로이드용 Node.js(Termux)와 엑셀 엔진(xlsx-sidecar)을 넣음
3. PhotoCraft 최신 웹 빌드를 받고, FilmCraft를 소스에서 빌드(웹 H.264 내보내기 수정: `tools/filmcraft_patch.py`)
4. `tools/work_assets.py`: 에셋 넣기, 로딩 문구·아이콘 바꾸기, 라이선스·정보 화면 채우기
5. 크롬에서 동영상 편집 점검(`tools/web_selftest.mjs`), 에뮬레이터에서 첫 화면·문서 6종·사진·동영상 점검(`tools/emulator_selftest.sh`)
6. 휴대폰용(arm64) APK를 Releases `work-latest`에 올림

## 대신남 워크가 원작에서 바꾼 것

정보 화면의 "원작에서 바꾼 것"에 정리해 두었습니다 (Apache-2.0 제4조).
