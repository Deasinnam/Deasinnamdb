# 한글 글꼴 (사진·동영상 편집용)

웹판 사진·동영상 편집기는 안드로이드 WebView 안에서 돌기 때문에 시스템 글꼴을 쓸 수 없습니다.
그래서 화면 언어를 한국어로 바꾸면 "한국어 글꼴이 없다"며 거부하거나 글자가 네모로 나왔습니다.
이 폴더의 한글 글꼴을 함께 넣어 해결합니다.

- `NotoSansCJKkr-Regular-subset.otf`: Noto Sans CJK KR Regular(SIL OFL 1.1)에서 한글 음절 11,172자,
  한글 자모·호환 자모, CJK 기호·문장 부호, 전각 ASCII, 자주 쓰는 기호만 남긴 것 (약 1.1MB)
- 동영상 편집(FilmCraft): `tools/filmcraft_patch.py`가 빌드 때 편집기 안에 넣습니다(웹판 한국어 화면용).
- 사진 편집(PhotoCraft): `tools/work_assets.py`가 `assets/photo/fonts/`에 넣고 `fonts/manifest.txt`에 올립니다
  (PhotoCraft 웹판의 "서버가 주는 글꼴" 기능, 스크립트 `Kore`).

다시 만들 때:

```bash
pyftsubset NotoSansCJKkr-Regular.otf --output-file=NotoSansCJKkr-Regular-subset.otf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+1100-11FF,U+3000-303F,U+3131-318E,U+AC00-D7A3,U+FF01-FF5E,U+2010-2027,U+2030-205E,U+2190-2193,U+2460-24FF,U+25A0-25FF,U+2600-26FF" \
  --layout-features='' --no-hinting
```
