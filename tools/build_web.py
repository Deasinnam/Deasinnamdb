#!/usr/bin/env python3
"""IeumOffice 데스크톱판(AppImage를 푼 resources 폴더)에서 안드로이드 앱 에셋을 만듭니다.

사용법:
  ./IeumOffice-x.y.z.AppImage --appimage-extract
  python3 tools/build_web.py squashfs-root/resources

하는 일:
  - 편집기 모듈(pdf, hwp, markdown, html)의 렌더러를 app/src/main/assets/www/modules/<모듈>/ 로 복사
  - 각 모듈의 Electron preload를 브라우저에서 돌 수 있게 감싸서 preload-web.js로 저장
  - index.html에 web/shim/electron-shim.js(가짜 electron)와 preload-web.js를 먼저 불러오도록 끼워 넣음
  - web/home(홈 화면)과 라이선스 고지를 함께 복사
"""
import pathlib
import re
import shutil
import sys

MODULES = ["pdf", "hwp", "markdown", "html", "docs", "sheets", "slides", "epub", "mindmap", "diagram"]
# 메인 코드를 앱 안 Node에서 돌리는 모듈 (나머지는 셈만으로 동작)
NODE_MODULES = ["docs", "sheets", "slides", "epub", "mindmap", "diagram"]
CUSTOM_SCHEMES = ["genoffice-docx-media", "genoffice-slide-media", "epub-asset", "drawio-app", "genoffice-app"]
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "app/src/main/assets/www"


# 화면 코드 안에 박힌 자체 프로토콜 주소 고치기 (모듈별)
APP_ORIGIN = "https://appassets.androidplatform.net"
# 화면 코드가 직접 만드는 자체 프로토콜 주소의 변수 이름 → 프로토콜
SCHEME_VARS = {"LAZY_MEDIA_SCHEME": "genoffice-docx-media", "TEMPLATE_FONT_SCHEME": "genoffice-docx-media", "DRAWIO_SCHEME": "drawio-app"}


def proto_prefix(m: str, scheme: str) -> str:
    """Node 호스트가 그 모듈의 열린 문서 세션으로 넘겨 주는 앱 내부 주소"""
    return f"{APP_ORIGIN}/proto/m/{m}/{scheme}/"


def generic_scheme_patch(m: str, text: str) -> str:
    for var, sc in SCHEME_VARS.items():
        text = text.replace("${" + var + "}://", proto_prefix(m, sc))
    for sc in ["genoffice-docx-media", "genoffice-slide-media", "epub-asset", "drawio-app"]:
        text = text.replace('"' + sc + '://', '"' + proto_prefix(m, sc))
    return text


def module_patches(m: str):
    if m == "epub":
        return [
            # 책 본문 iframe(srcdoc)의 CSP: epub-asset: 출처 → 앱 출처
            ('"img-src epub-asset: data:"', f'"img-src {APP_ORIGIN} data:"'),
            ('"style-src epub-asset: \'unsafe-inline\'"', f'"style-src {APP_ORIGIN} \'unsafe-inline\'"'),
            ('"font-src epub-asset: data:"', f'"font-src {APP_ORIGIN} data:"'),
            ('"base-uri epub-asset:"', f'"base-uri {APP_ORIGIN}"'),
        ]
    if m == "slides":
        pre = re.escape(proto_prefix(m, "genoffice-slide-media")).replace("/", "\\/")
        return [
            ('url.startsWith("genoffice-slide-media:")', f'url.startsWith("{proto_prefix(m, "genoffice-slide-media")}")'),
            ("const LAZY_METAFILE_RE = /^genoffice-slide-media:.*", "const LAZY_METAFILE_RE = /^" + pre + ".*"),
        ]
    if m == "diagram":
        # draw.io 화면은 같은 출처의 앱 내부 주소에서 열리므로, 메시지 출처 확인도 앱 출처로
        return [("event.origin === DRAWIO_ORIGIN", "event.origin === new URL(DRAWIO_ORIGIN).origin")]
    return []


def patch_bundles(m: str, dst: pathlib.Path) -> None:
    if m not in NODE_MODULES:
        return
    patches = module_patches(m)
    hits = {old: 0 for old, _ in patches}
    for js in list((dst / "assets").rglob("*.js")) + list((dst / "assets").rglob("*.css")):
        text = js.read_text(encoding="utf-8")
        changed = generic_scheme_patch(m, text)
        for old, new in patches:
            hits[old] += changed.count(old)
            changed = changed.replace(old, new)
        if changed != text:
            js.write_text(changed, encoding="utf-8")
    for old, n in hits.items():
        if n == 0:
            sys.exit(f"{m}: 고칠 코드를 찾지 못했습니다 (원본이 바뀌었나요?): {old[:60]}")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    res = pathlib.Path(sys.argv[1]).resolve()
    if not (res / "modules").is_dir():
        sys.exit(f"{res} 에 modules 폴더가 없습니다. AppImage를 푼 squashfs-root/resources 를 넘겨 주세요.")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    shim = (ROOT / "web/shim/electron-shim.js").read_text(encoding="utf-8")
    for m in MODULES:
        src = res / "modules" / m
        dst = OUT / "modules" / m
        shutil.copytree(src / "renderer", dst)

        preload = (src / "preload" / "index.js").read_text(encoding="utf-8")
        if "require(" in re.sub(r'require\("electron"\)', "", preload):
            sys.exit(f"{m}: preload가 electron 말고 다른 모듈을 require합니다. 셈을 확장해야 합니다.")
        wrapped = (
            "/* 자동 생성: tools/build_web.py — 원본은 IeumOffice modules/" + m + "/preload/index.js */\n"
            "(function (require, module, exports, process) {\n" + preload + "\n})(window.__ieumRequire, { exports: {} }, {}, "
            "{ env: {}, platform: \"linux\", versions: {}, argv: [], type: \"renderer\" });\n"
        )
        (dst / "preload-web.js").write_text(wrapped, encoding="utf-8")
        (dst / "ieum-shim.js").write_text(shim, encoding="utf-8")

        index = dst / "index.html"
        html = index.read_text(encoding="utf-8")
        inject = (
            f'<script src="./ieum-shim.js" data-module="{m}"></script>\n'
            '    <script src="./preload-web.js"></script>\n    '
        )
        html, n = re.subn(r'(<script type="module")', inject + r"\1", html, count=1)
        if n != 1:
            sys.exit(f"{m}: index.html에서 모듈 스크립트를 찾지 못했습니다.")
        html = html.replace('<html lang="zh-CN">', '<html lang="ko">')
        # HTML 미리보기: 데스크톱의 html-preview: 프로토콜 대신 앱이 내보내는 별도 출처 주소
        html = html.replace("frame-src html-preview:", "frame-src https://ieum-preview.local")
        if m in NODE_MODULES:
            # 자체 프로토콜 자원은 같은 출처의 /proto/... 로 오므로 CSP에서는 'self'로 충분
            for sc in CUSTOM_SCHEMES:
                html = re.sub(r"(?<![\w-])" + re.escape(sc) + r":(?![/\w])", "'self'", html)
        index.write_text(html, encoding="utf-8")
        patch_bundles(m, dst)
        print(f"  {m}: 완료")

    shutil.copytree(ROOT / "web/home", OUT / "home")
    lic = OUT / "licenses"
    lic.mkdir()
    for name in ["LICENSE.txt", "NOTICE.txt", "LICENSE-UNICODE.txt", "THIRD-PARTY-NOTICES.txt"]:
        if (res / name).exists():
            shutil.copy(res / name, lic / name)
    print(f"에셋 생성 완료: {OUT}")


if __name__ == "__main__":
    main()
