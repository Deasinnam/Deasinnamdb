#!/usr/bin/env python3
"""덜누름 워크: 문서 편집기에 무료 글꼴(SIL OFL 1.1)을 넣습니다. build_web.py 다음에 실행합니다.

사용법:  python3 tools/dnr_fonts.py

하는 일:
  1. tools/fonts/dnr/files/ 의 글꼴을 app/src/main/assets/www/fonts/dnr/ 로 복사
  2. dnr-fonts.css(글꼴 등록), dnr-alias.css(상용 글꼴 이름 → 비슷한 무료 글꼴), dnr-fonts.js(미리 불러오기)를 만듦
  3. 워드 · 엑셀 · 파워포인트 · 마인드맵 · 마크다운 · HTML 편집기 화면에 위 파일을 넣음
  4. 그 편집기들의 글꼴 목록(한국어 글꼴 묶음)에 새 글꼴 이름과 한글 읽기를 더함
  5. 한글(HWP) 편집기(rhwp-studio)의 기본 글꼴 목록에 rhwp가 스스로 불러오는 무료 글꼴 이름을 더함
     (글꼴 파일은 OfficeActivity가 studio/fonts/<파일> 요청을 www/fonts/dnr/<파일>로 이어 줌)
원본 코드가 바뀌어 고칠 곳을 못 찾으면 멈추며 알려 줍니다.
"""
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools/fonts/dnr"
WWW = ROOT / "app/src/main/assets/www"
OUT = WWW / "fonts/dnr"
URL = "/assets/www/fonts/dnr/"

# (목록에 보일 이름, 함께 받는 다른 이름들, [(파일, 굵기, 기울임)], 한글 읽기, 목록에 넣을지)
R, B = 400, 700
FAMILIES = [
    # ---- 본문 고딕 · 명조 ----
    ("Nanum Gothic", ["NanumGothic", "나눔고딕"], [("NanumGothic-Regular", R), ("NanumGothic-Bold", B), ("NanumGothic-ExtraBold", 800)], ["나눔고딕"], True),
    ("Nanum Myeongjo", ["NanumMyeongjo", "나눔명조"], [("NanumMyeongjo-Regular", R), ("NanumMyeongjo-Bold", B), ("NanumMyeongjo-ExtraBold", 800)], ["나눔명조"], True),
    ("Nanum Gothic Coding", ["NanumGothicCoding", "나눔고딕코딩"], [("NanumGothicCoding-Regular", R), ("NanumGothicCoding-Bold", B)], ["나눔고딕코딩"], True),
    ("Noto Sans KR", ["본고딕"], [("NotoSansKR-Regular", R), ("NotoSansKR-Bold", B)], [], False),
    ("Noto Serif KR", ["본명조"], [("NotoSerifKR-Regular", R), ("NotoSerifKR-Bold", B)], [], False),
    ("Pretendard", ["프리텐다드"], [("Pretendard-Thin", 100), ("Pretendard-ExtraLight", 200), ("Pretendard-Light", 300), ("Pretendard-Regular", R),
                                     ("Pretendard-Medium", 500), ("Pretendard-SemiBold", 600), ("Pretendard-Bold", B), ("Pretendard-ExtraBold", 800), ("Pretendard-Black", 900)], [], False),
    ("Gowun Batang", ["고운바탕"], [("GowunBatang-Regular", R), ("GowunBatang-Bold", B)], [], False),
    ("Gowun Dodum", ["고운돋움"], [("GowunDodum-Regular", R)], [], False),
    ("Gothic A1", ["고딕 A1"], [("GothicA1-Regular", R), ("GothicA1-Bold", B)], ["고딕 A1", "고딕에이원"], True),
    ("IBM Plex Sans KR", ["IBM 플렉스 산스"], [("IBMPlexSansKR-Regular", R), ("IBMPlexSansKR-Bold", B)], ["IBM 플렉스 산스", "플렉스"], True),
    ("Spoqa Han Sans", ["SpoqaHanSans", "스포카 한 산스"], [("SpoqaHanSans-Regular", R)], [], True),
    ("Hahmlet", ["함렡"], [("Hahmlet-VF", "100 900")], ["함렡", "함렛"], True),
    ("Song Myung", ["송명"], [("SongMyung-Regular", R)], ["송명"], True),
    ("D2Coding", ["D2 Coding"], [("D2Coding-Regular", R), ("D2Coding-Bold", B)], ["디투코딩"], True),
    # ---- 손글씨 · 제목 ----
    ("Nanum Pen Script", ["Nanum Pen", "나눔손글씨 펜"], [("NanumPenScript-Regular", R)], ["나눔손글씨 펜", "나눔펜"], True),
    ("Nanum Brush Script", ["나눔손글씨 붓"], [("NanumBrushScript-Regular", R)], ["나눔손글씨 붓", "나눔붓"], True),
    ("Jua", ["주아"], [("Jua-Regular", R)], ["주아"], True),
    ("Gaegu", ["개구쟁이"], [("Gaegu-Regular", R), ("Gaegu-Bold", B)], ["개구쟁이", "개구"], True),
    ("Gamja Flower", ["감자꽃마을"], [("GamjaFlower-Regular", R)], ["감자꽃마을", "감자꽃"], True),
    ("Hi Melody", ["하이멜로디"], [("HiMelody-Regular", R)], ["하이멜로디"], True),
    ("Sunflower", ["해바라기"], [("Sunflower-Medium", 500), ("Sunflower-Bold", B)], ["해바라기"], True),
    ("Dongle", ["동글"], [("Dongle-Regular", R)], ["동글"], True),
    ("East Sea Dokdo", ["대한민국독도"], [("EastSeaDokdo-Regular", R)], ["대한민국독도", "독도"], True),
    ("Yeon Sung", ["연성"], [("YeonSung-Regular", R)], ["연성"], True),
    ("Gugi", ["구기"], [("Gugi-Regular", R)], ["구기"], True),
    ("Stylish", ["스타일리쉬"], [("Stylish-Regular", R)], ["스타일리쉬", "스타일리시"], True),
    ("Poor Story", ["서툰이야기"], [("PoorStory-Regular", R)], ["서툰이야기"], True),
    ("Single Day", ["싱글데이"], [("SingleDay-Regular", R)], ["싱글데이"], True),
    ("Cute Font", ["귀여운 폰트"], [("CuteFont-Regular", R)], ["귀여운 폰트"], True),
    ("Orbit", ["오르빗"], [("Orbit-Regular", R)], ["오르빗"], True),
    # ---- 영문: 오피스 글꼴과 글자 폭이 같은 무료 글꼴 ----
    ("Carlito", [], [("Carlito-Regular", R), ("Carlito-Bold", B), ("Carlito-Italic", R, "italic"), ("Carlito-BoldItalic", B, "italic")], [], True),
    ("Caladea", [], [("Caladea-Regular", R), ("Caladea-Bold", B), ("Caladea-Italic", R, "italic"), ("Caladea-BoldItalic", B, "italic")], [], True),
    ("Arimo", [], [("Arimo-VF", "400 700"), ("Arimo-Italic-VF", "400 700", "italic")], [], True),
    ("Tinos", [], [("Tinos-Regular", R), ("Tinos-Bold", B), ("Tinos-Italic", R, "italic"), ("Tinos-BoldItalic", B, "italic")], [], True),
    ("Cousine", [], [("Cousine-Regular", R), ("Cousine-Bold", B), ("Cousine-Italic", R, "italic"), ("Cousine-BoldItalic", B, "italic")], [], True),
]

# 문서가 상용 글꼴 이름을 쓸 때 화면에서 대신 쓰는 무료 글꼴 (파일의 글꼴 이름은 그대로 둠)
ALIASES = [
    (["Calibri", "Calibri Light"], "Carlito"),
    (["Cambria"], "Caladea"),
    (["Arial", "Helvetica"], "Arimo"),
    (["Times New Roman", "Times"], "Tinos"),
    (["Courier New", "Courier"], "Cousine"),
    (["Batang", "바탕", "BatangChe", "바탕체", "함초롬바탕", "HCR Batang", "한컴바탕", "HY신명조", "새바탕"], "Noto Serif KR"),
    (["휴먼명조", "HY명조", "HYMyeongJo"], "Nanum Myeongjo"),
    (["Gungsuh", "궁서", "GungsuhChe", "궁서체"], "Gowun Batang"),
    (["Gulim", "굴림", "Dotum", "돋움", "함초롬돋움", "HCR Dotum", "한컴돋움", "새굴림", "새돋움"], "Noto Sans KR"),
    (["GulimChe", "굴림체", "DotumChe", "돋움체"], "D2Coding"),
]
HEADLINE = ["HY헤드라인M", "HYHeadLine M", "HY견고딕"]  # 굵은 제목 고딕 → Noto Sans KR Bold

# 글꼴을 넣을 편집기 (한글 · PDF · 전자책 · 다이어그램은 제외: 각자 글꼴을 다룸)
MODULES = ["docs", "sheets", "slides", "mindmap", "markdown", "html"]
HWP_BASE_EXTRA = ["나눔명조", "나눔고딕코딩", "고운바탕", "고운돋움", "Noto Sans KR", "Noto Serif KR", "Pretendard", "D2Coding", "SpoqaHanSans"]


def faces(fam):
    for f in fam[2]:
        yield f[0], f[1], (f[2] if len(f) > 2 else "normal")


def face_css(family, file, weight, style, display="swap"):
    fmt = "truetype" if file.endswith(".ttf") else "woff2"
    return (f'@font-face{{font-family:"{family}";src:url("{URL}{file}") format("{fmt}");'
            f"font-weight:{weight};font-style:{style};font-display:{display}}}\n")


def file_of(stem):
    for ext in (".woff2", ".ttf"):
        if (SRC / "files" / (stem + ext)).exists():
            return stem + ext
    sys.exit(f"글꼴 파일이 없습니다: {stem}")


def js_str(s):
    """번들 안의 문자열 표기: 한글은 \\uXXXX로 (ASCII 번들 · UTF-8 번들 모두에서 같은 뜻)"""
    return '"' + "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in s) + '"'


def str_pattern(s):
    """번들에서 문자열 s를 찾는 정규식 — 한글이 그대로든 \\uXXXX든"""
    out = ""
    for c in s:
        out += re.escape(c) if ord(c) < 128 else "(?:%s|\\\\u%04x|\\\\u%04X)" % (re.escape(c), ord(c), ord(c))
    return "[\"']" + out + "[\"']"


def main():
    if not (WWW / "modules").is_dir():
        sys.exit("먼저 tools/build_web.py 를 실행해 주세요 (assets/www/modules 없음)")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for f in (SRC / "files").iterdir():
        shutil.copy(f, OUT / f.name)

    css = "/* 덜누름 워크: 무료 글꼴(SIL OFL 1.1) — tools/dnr_fonts.py가 만듦. 라이선스: 정보 화면 */\n"
    preload = []
    for fam in FAMILIES:
        name, others = fam[0], fam[1]
        for stem, w, st in faces(fam):
            fn = file_of(stem)
            for n in [name] + others:
                css += face_css(n, fn, w, st)
        if fam[4]:
            preload.append(name)
    (OUT / "dnr-fonts.css").write_text(css, encoding="utf-8")

    by_name = {f[0]: f for f in FAMILIES}
    alias = "/* 덜누름 워크: 문서의 상용 글꼴 이름을 비슷한 무료 글꼴로 보여 줌(문서에는 원래 이름이 남음) */\n"
    for names, target in ALIASES:
        for stem, w, st in faces(by_name[target]):
            for n in names:
                alias += face_css(n, file_of(stem), w, st)
    for n in HEADLINE:
        alias += face_css(n, file_of("NotoSansKR-Bold"), "100 900", "normal")
    (OUT / "dnr-alias.css").write_text(alias, encoding="utf-8")

    # 캔버스로 그리는 편집기(엑셀 · 파워포인트)는 글꼴이 이미 불려 있어야 바로 그 글꼴로 그림:
    # 화면이 다 뜬 뒤 쉬는 틈에 하나씩 불러 둠 (앱 안 파일이라 인터넷을 쓰지 않음)
    js = ("/* 덜누름 워크: 함께 넣은 글꼴을 쉬는 틈에 하나씩 불러 둠 */\n(function(){var L=" + json.dumps(preload, ensure_ascii=False) +
          ";function go(i){if(i>=L.length||!document.fonts)return;var f=L[i];Promise.all([document.fonts.load('400 16px \"'+f+'\"'),document.fonts.load('700 16px \"'+f+'\"')])"
          ".catch(function(){}).then(function(){setTimeout(function(){go(i+1)},120)})}"
          "function start(){setTimeout(function(){(window.requestIdleCallback||function(c){setTimeout(c,0)})(function(){go(0)})},4000)}"
          "if(document.readyState==='complete')start();else window.addEventListener('load',start)})();\n")
    (OUT / "dnr-fonts.js").write_text(js, encoding="utf-8")

    # ---- 편집기 화면에 넣기 ----
    tag = (f'<link rel="stylesheet" href="{URL}dnr-fonts.css">\n    <link rel="stylesheet" href="{URL}dnr-alias.css">\n'
           f'    <script src="{URL}dnr-fonts.js" defer></script>\n    ')
    for m in MODULES:
        index = WWW / "modules" / m / "index.html"
        if not index.exists():
            sys.exit(f"{m}: index.html이 없습니다")
        html = index.read_text(encoding="utf-8")
        html, n = re.subn(r"(</head>)", tag + r"\1", html, count=1)
        if n != 1:
            sys.exit(f"{m}: index.html에서 </head>를 찾지 못했습니다")
        if "script-src" in html and "script-src 'self'" not in html:
            sys.exit(f"{m}: CSP가 같은 출처 스크립트를 막습니다")
        index.write_text(html, encoding="utf-8")

    # ---- 워드 · 엑셀 · 파워포인트 글꼴 목록: 한국어 글꼴 묶음 끝에 더하기 ----
    added = [f[0] for f in FAMILIES if f[4]]
    list_re = re.compile(str_pattern("Gowun Dodum") + r"\s*,\s*" + str_pattern("Gowun Batang") + r"\s*\]")
    read_re = re.compile(r"(" + str_pattern("Gowun Batang") + r"\s*:\s*\[\s*" + str_pattern("고운바탕") + r"\s*\])")
    readings = "".join("," + js_str(f[0]) + ":[" + ",".join(js_str(r) for r in f[3]) + "]" for f in FAMILIES if f[4] and f[3])
    lists = reads = 0
    for m in MODULES + ["hwp"]:
        for js_file in (WWW / "modules" / m).rglob("*.js"):
            text = js_file.read_text(encoding="utf-8", errors="surrogateescape")
            new, n1 = list_re.subn(lambda mt: mt.group(0)[:-1].rstrip() + "," + ",".join(js_str(a) for a in added) + "]", text)
            new, n2 = read_re.subn(lambda mt: mt.group(1) + readings, new)
            if n1 or n2:
                js_file.write_text(new, encoding="utf-8", errors="surrogateescape")
                lists += n1
                reads += n2
    if lists == 0:
        sys.exit("워드 · 엑셀 · 파워포인트 글꼴 목록(한국어 묶음)을 찾지 못했습니다 (원본이 바뀌었나요?)")
    print(f"  글꼴 목록 {lists}곳 · 한글 읽기 {reads}곳에 {len(added)}개 글꼴을 더함")

    # ---- 한글(HWP) 편집기 기본 글꼴 목록 ----
    base = ["함초롬바탕", "함초롬돋움", "맑은 고딕", "나눔고딕", "바탕", "돋움", "궁서"]
    base_re = re.compile(r"\[\s*" + r"\s*,\s*".join(str_pattern(b) for b in base) + r"\s*\]")
    hits = 0
    for js_file in (WWW / "modules" / "hwp").rglob("*.js"):
        text = js_file.read_text(encoding="utf-8", errors="surrogateescape")
        new, n = base_re.subn(lambda mt: mt.group(0)[:-1].rstrip() + "," + ",".join(js_str(a) for a in HWP_BASE_EXTRA) + "]", text)
        if n:
            js_file.write_text(new, encoding="utf-8", errors="surrogateescape")
            hits += n
    if hits == 0:
        sys.exit("한글 편집기 기본 글꼴 목록을 찾지 못했습니다 (원본이 바뀌었나요?)")
    studio = [p for p in (WWW / "modules" / "hwp").rglob("index.html") if "studio" in p.parts]
    print(f"  한글 편집기 기본 글꼴 {hits}곳에 {len(HWP_BASE_EXTRA)}개를 더함 · studio 화면: {[str(p.relative_to(WWW)) for p in studio]}")

    size = sum(p.stat().st_size for p in OUT.iterdir())
    print(f"글꼴 넣기 완료: {len(list((SRC / 'files').iterdir()))}개 파일, {size / 1e6:.1f}MB → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
