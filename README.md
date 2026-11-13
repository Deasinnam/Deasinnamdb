# 덜누름 사이트

GitHub Pages로 공개되는 덜누름(https://deolnureum.com) 사이트입니다.

- `src/index.html` — 원본. 모든 화면이 이 한 파일에 있습니다. 고칠 때는 이 파일만 고칩니다.
- `tools/build_pages.py` — 원본에서 화면별 페이지(`/`, `/apps/`, `/speedometer/` …)와 `sitemap.xml`, `robots.txt`를 만듭니다.
  원본을 고친 뒤 `python3 tools/build_pages.py`를 실행하고, 만들어진 파일까지 함께 올립니다.
- `index.html`과 `apps/ about/ feedback/ amp/ speedometer/ work/ desktop/ browser/`의 `index.html` — 만들어진 파일. 직접 고치지 않습니다.
