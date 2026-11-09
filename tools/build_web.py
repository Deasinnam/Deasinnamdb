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

MODULES = ["pdf", "hwp", "markdown", "html"]
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "app/src/main/assets/www"


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
            "(function (require, module, exports) {\n" + preload + "\n})(window.__ieumRequire, { exports: {} }, {});\n"
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
        index.write_text(html, encoding="utf-8")
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
