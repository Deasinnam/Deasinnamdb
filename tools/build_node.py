#!/usr/bin/env python3
"""앱 안 Node가 돌릴 프로젝트를 묶어 app/src/main/assets/node.zip 으로 만듭니다.

사용법:
  python3 tools/build_node.py squashfs-root/resources

넣는 것
  node/host.js, codec.js, fake-electron.js, node_modules/ws   ← 우리 코드
  node/vendor/node_modules                                       ← 독립 실행용 메인 코드가 바깥에서 찾는 패키지
  resources/modules/<워드·엑셀·파워포인트·EPUB·마인드맵·다이어그램>/main  ← 데스크톱판 메인 코드 그대로
  resources/modules/diagram/{drawio,bridge}, resources/template-fonts
"""
import hashlib
import pathlib
import shutil
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
NODE_SRC = ROOT / "node"
OUT_ZIP = ROOT / "app/src/main/assets/node.zip"
MODULES = ["docs", "sheets", "slides", "epub", "mindmap", "diagram"]

# vendor 패키지에서 빼도 되는 것 (다른 빌드 형식·타입 정의·소스맵)
PRUNE_SUFFIXES = (".map", ".d.ts", ".d.mts", ".d.cts", ".ts.map", ".md", ".flow")
PRUNE_DIRS = {"es", "umd", "dist/es", "docs", "test", "tests", "__tests__", "example", "examples", "src"}


def keep_vendor(rel: pathlib.PurePosixPath) -> bool:
    name = rel.name
    if name.endswith(PRUNE_SUFFIXES) and not name.endswith(".js"):
        return False
    parts = rel.parts
    # pdf-lib: cjs 빌드만 씀
    if len(parts) > 2 and parts[0] == "pdf-lib" and parts[1] in ("es", "dist", "src", "ts3.4"):
        return False
    if len(parts) > 2 and parts[0] == "@pdf-lib" and len(parts) > 3 and parts[2] in ("es", "src"):
        return False
    if any(p in ("test", "tests", "__tests__", "docs", "example", "examples") for p in parts[:-1]):
        return False
    return True


def add_tree(z: zipfile.ZipFile, src: pathlib.Path, arc: str, keep=lambda rel: True) -> int:
    n = 0
    for f in sorted(src.rglob("*")):
        if not f.is_file():
            continue
        rel = pathlib.PurePosixPath(f.relative_to(src).as_posix())
        if not keep(rel):
            continue
        z.write(f, f"{arc}/{rel}")
        n += 1
    return n


# 엑셀 메인 코드 끝에 붙이는 "빈 새 통합 문서" 함수 (node/host.js가 새 엑셀 문서를 열 때 부름).
# 데스크톱판 껍데기 앱이 하던 일: 빈 .xlsx를 임시 폴더에 만들고 "저장 안 한 새 문서"로 등록 → 첫 저장 때 저장 위치를 물음
SHEETS_NEW_BLANK = """
// ---- 덜누름 워크 (tools/build_node.py): 새 엑셀 문서 ----
globalThis.__ieumSheetsNewBlank = async function (name) {
  const base = String(name || "").trim() || "새 통합 문서";
  const fileName = /\\.xlsx$/i.test(base) ? base : base + ".xlsx";
  const bytes = await sheetCsvToXlsxBuffer("", "Sheet1");
  const staged = await stageRecoveredCopy(bytes, fileName);
  unsavedNewWorkbooks.set(staged.openPath, {
    suggestSaveAs: node_path.join(configuredDefaultSaveDir(electron.app), fileName),
    tempDir: staged.importTempDir
  });
  return staged.openPath;
};
"""
SHEETS_NEEDS = [
    "async function sheetCsvToXlsxBuffer(", "async function stageRecoveredCopy(", "const unsavedNewWorkbooks =",
    "function configuredDefaultSaveDir(", 'const node_path = require("node:path");', 'const electron = require("electron");',
    "suggestSaveAs: unsavedNew.suggestSaveAs,",
]


def sheets_main_with_new_blank(index: pathlib.Path) -> str:
    text = index.read_text(encoding="utf-8")
    missing = [n for n in SHEETS_NEEDS if n not in text]
    if missing:
        sys.exit("엑셀 메인 코드에서 새 문서용으로 쓸 곳을 찾지 못했습니다 (원본이 바뀜): " + ", ".join(missing))
    return text + SHEETS_NEW_BLANK


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    res = pathlib.Path(sys.argv[1]).resolve()
    if not (res / "modules").is_dir():
        sys.exit(f"{res} 에 modules 폴더가 없습니다.")
    if not (NODE_SRC / "node_modules" / "ws").is_dir() or not (NODE_SRC / "vendor" / "node_modules").is_dir():
        sys.exit("node/ 와 node/vendor/ 에서 먼저 npm ci 를 실행해 주세요.")

    OUT_ZIP.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT_ZIP.with_suffix(".tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name in ["host.js", "codec.js", "fake-electron.js", "package.json"]:
            z.write(NODE_SRC / name, name)
        add_tree(z, NODE_SRC / "node_modules", "node_modules")
        add_tree(z, NODE_SRC / "vendor" / "node_modules", "vendor/node_modules", keep_vendor)
        add_tree(z, NODE_SRC / "vendor" / "local", "vendor/local")
        for m in MODULES:
            keep = (lambda rel: str(rel) != "index.js") if m == "sheets" else (lambda rel: True)
            n = add_tree(z, res / "modules" / m / "main", f"resources/modules/{m}/main", keep)
            if m == "sheets":
                z.writestr("resources/modules/sheets/main/index.js", sheets_main_with_new_blank(res / "modules/sheets/main/index.js"))
                n += 1
            print(f"  {m}: {n}개 파일")
        add_tree(z, res / "modules" / "diagram" / "drawio", "resources/modules/diagram/drawio")
        add_tree(z, res / "modules" / "diagram" / "bridge", "resources/modules/diagram/bridge")
        add_tree(z, res / "template-fonts", "resources/template-fonts")
    shutil.move(tmp, OUT_ZIP)
    digest = hashlib.sha256(OUT_ZIP.read_bytes()).hexdigest()[:16]
    (OUT_ZIP.parent / "node.zip.version").write_text(digest + "\n")
    print(f"node.zip {OUT_ZIP.stat().st_size / 1e6:.1f}MB (버전 {digest})")


if __name__ == "__main__":
    main()
