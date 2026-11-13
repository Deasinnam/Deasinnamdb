#!/usr/bin/env python3
"""덜누름 사이트 빌드: src/index.html(원본, 시안과 같은 파일) → 실제 사이트의 화면별 페이지.

원본은 한 파일에 모든 화면이 들어 있고 # 주소(#app-speed 등)로 화면을 바꾼다.
검색엔진은 # 뒤를 보지 않으므로, 화면마다 진짜 주소의 페이지를 만들어 준다.
  /            홈            /apps/     앱센터       /about/    소개      /feedback/  의견 보내기
  /amp/  /speedometer/  /work/  /desktop/  /browser/    앱별 소개
페이지마다: 제목·설명·대표 주소(canonical)·공유 이미지·구조화 데이터를 넣고, 그 화면이 처음부터 보이게 한다.
sitemap.xml 과 robots.txt 도 함께 만든다.

쓰는 법(저장소 맨 위에서):  python3 tools/build_pages.py
원본을 고친 뒤에는 반드시 다시 실행하고, 만들어진 파일까지 함께 올린다.
"""
import json, re, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://deolnureum.com"
SUFFIX = " | 덜누름"
# 검색엔진 소유 확인 값(구글 서치 콘솔, 네이버 서치어드바이저). 비어 있으면 넣지 않는다.
VERIFY = {"google-site-verification": "", "naver-site-verification": ""}

APPS = [
    # (원본의 # 주소, 실제 주소, 섹션 id, 제목, 설명, 앱 이름, 앱 분류, 대표 그림)
    ("#app-speed", "/speedometer/", "대신남 스피드미터 — 차 안에서 이륙하는 GPS 조종석 계기판",
     "차가 달리면 조종석 계기판이 움직입니다. GPS 속도·고도, 주야간 비행 화면, 디지털 라디오와 이퀄라이저, 대시캠, T맵 화면 나누기, 물리 버튼까지. 갤럭시 Z 폴드에 최적화했습니다.",
     "대신남 스피드미터", "NavigationApplication", "/media/speedometer-poster.jpg"),
    ("#app-amp", "/amp/", "Daesinnam Amp(대신남 앰프) — 레트로 스킨 MP3 플레이어",
     "펼쳐도, 접어도 듣기 좋은 음악 플레이어. LED 스펙트럼, 10밴드 EQ, 레트로 스킨, 차에 타면 이어서 재생. 갤럭시 Z 폴드의 바깥 화면에서도 그대로 씁니다.",
     "Daesinnam Amp", "MultimediaApplication", "/media/amp-open-poster.jpg"),
    ("#app-work", "/work/", "덜누름 워크 — 안드로이드를 윈도우 PC처럼",
     "이음오피스와 아트크래프트를 안드로이드용으로 하나로 합친 앱. 워드·엑셀·파워포인트·한글 문서와 사진·동영상 편집을 스마트폰 한 대에서 끝냅니다.",
     "덜누름 워크", "BusinessApplication", "/media/app-work-poster.jpg"),
    ("#app-desktop", "/desktop/", "덜누름 데스크탑앱 — 펼친 폴드를 PC 바탕화면처럼",
     "시작 메뉴, 작업 표시줄, 바탕화면 아이콘과 위젯, 창으로 뜨는 앱. 갤럭시 Z 폴드를 PC처럼 쓰는 홈 화면 앱입니다.",
     "덜누름 데스크탑앱", "UtilitiesApplication", "/media/app-desk-poster.jpg"),
    ("#app-browser", "/browser/", "덜누름 브라우저 — 창으로 여는 PC형 브라우저",
     "바탕화면 위에 창으로 열고, 한 번에 전체 화면으로. 넓은 폴드 화면에서 PC 화면 그대로 웹을 보는 브라우저입니다.",
     "덜누름 브라우저", "BrowserApplication", "/media/app-browser-poster.jpg"),
]
APP_NAMES = ", ".join(a[4] for a in APPS)
PAGES = [
    # (원본의 # 주소, 실제 주소, 화면 이름, 제목(전체), 설명)
    ("#top", "/", "home", "덜누름 Software — 덜 누르고, 더 편하게",
     "덜누름은 누를 일을 줄이는 앱을 개발합니다. " + APP_NAMES + "를 갤럭시 Z 폴드에 맞춰 만들고 있습니다."),
    ("#app-center", "/apps/", "apps", "앱센터 — 덜누름이 개발 중인 앱" + SUFFIX,
     "덜누름이 개발 중인 앱을 한곳에서 둘러보세요. " + APP_NAMES + "의 실제 화면을 볼 수 있습니다."),
    ("#about", "/about/", "about", "덜누름 소개 — 누를 일을 줄이는 앱을 개발합니다" + SUFFIX,
     "덜누름의 이름과 세 가지 원칙, 로고 내려받기. 덜 누르고, 더 편하게."),
    ("#feedback", "/feedback/", "feedback", "의견 보내기 · 공개 알림 신청" + SUFFIX,
     "개발 중인 덜누름 앱에 바라는 기능과 불편한 점을 알려 주세요. 이메일을 남기면 앱이 공개되는 날 알려 드립니다."),
] + [(h, p, "app", t + SUFFIX, d) for h, p, t, d, _, _, _ in APPS]

ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "덜누름", "alternateName": ["덜누름 Software", "deolnureum"],
       "url": SITE + "/", "logo": SITE + "/brand/deolnureum-logo-black.png", "slogan": "덜 누르고, 더 편하게"}


def sub1(pattern, repl, text, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    assert n == 1, "원본에서 찾지 못함: " + pattern
    return out


def jsonld(h, path, title, desc):
    url = SITE + path
    graph = [ORG]
    if h == "#top":
        graph.append({"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "덜누름 Software", "inLanguage": "ko", "publisher": {"@id": SITE + "/#org"}})
    crumbs = [("홈", SITE + "/")]
    app = next((a for a in APPS if a[0] == h), None)
    if app:
        crumbs += [("앱센터", SITE + "/apps/"), (app[4], url)]
        graph.append({"@type": "SoftwareApplication", "name": app[4], "url": url, "description": desc, "operatingSystem": "Android",
                      "applicationCategory": app[5], "image": SITE + app[6], "inLanguage": "ko", "publisher": {"@id": SITE + "/#org"}})
    elif h != "#top":
        crumbs.append((title.split(" — ")[0].split(" · ")[0], url))
    if len(crumbs) > 1:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def build():
    src = (ROOT / "src" / "index.html").read_text(encoding="utf-8")
    meta = {h: {"t": t, "d": d, "u": SITE + p} for h, p, _, t, d in PAGES}
    # 모든 페이지 공통: 진짜 주소 방식 켜기, 파일 주소를 맨 위 기준으로, # 링크를 진짜 주소로
    base = sub1(r'<html lang="ko">', '<html lang="ko" data-paths>', src)
    base = re.sub(r'\b(src|href|poster)="(media|brand|amp|vendor)/', r'\1="/\2/', base)
    base = base.replace('href="favicon.svg"', 'href="/favicon.svg"')
    for h, p, _, _, _ in PAGES:
        base = base.replace('href="%s"' % h, 'href="%s"' % p)
    written = []
    for h, path, view, title, desc in PAGES:
        url = SITE + path
        out = sub1(r"<title>.*?</title>", "<title>%s</title>" % esc(title), base)
        out = sub1(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(desc), out)
        out = sub1(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(title), out)
        out = sub1(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(desc), out)
        head = ['<link rel="canonical" href="%s">' % url,
                '<meta property="og:url" content="%s">' % url,
                '<meta property="og:site_name" content="덜누름 Software">',
                '<meta property="og:image" content="%s/brand/og.jpg">' % SITE,
                '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
                '<meta name="twitter:card" content="summary_large_image">',
                '<meta name="robots" content="index,follow,max-image-preview:large">']
        head += ['<meta name="%s" content="%s">' % (k, v) for k, v in VERIFY.items() if v]
        head += ['<script type="application/ld+json">%s</script>' % jsonld(h, path, title, desc),
                 "<script>window.__PAGES=%s;</script>" % json.dumps(meta, ensure_ascii=False)]
        out = sub1(r"</head>", "\n".join(head) + "\n</head>", out)
        # 스크립트가 돌기 전에도(스크립트를 안 돌리는 검색 로봇에게도) 그 화면이 보이게
        out = sub1(r"<body>", '<body data-view="%s">' % view, out)
        if view != "home":
            out = sub1(r'<div class="view" id="view-home">', '<div class="view" id="view-home" hidden>', out)
            vid = {"apps": "view-apps", "app": "view-app", "about": "view-about", "feedback": "view-feedback"}[view]
            out = sub1(r'(<div class="view[^"]*" id="%s") hidden>' % vid, r"\1>", out)
            if view == "app":
                out = sub1(r'(<section class="amp-stage ap" id="%s"[^>]*?) hidden>' % h[1:], r"\1>", out)
        target = ROOT / path.strip("/") / "index.html" if path != "/" else ROOT / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(out, encoding="utf-8")
        written.append(str(target.relative_to(ROOT)))
    today = datetime.date.today().isoformat()
    urls = "".join("  <url><loc>%s%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n" % (SITE, p, today, "1.0" if p == "/" else "0.8") for _, p, _, _, _ in PAGES)
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls, encoding="utf-8")
    (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\nDisallow: /src/\nDisallow: /tools/\n\nSitemap: %s/sitemap.xml\n" % SITE, encoding="utf-8")
    print("만든 파일:", ", ".join(written), "+ sitemap.xml, robots.txt")


if __name__ == "__main__":
    build()
