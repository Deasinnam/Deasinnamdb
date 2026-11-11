#!/usr/bin/env python3
"""덜누름 워크: 사진·동영상 편집기 웹 빌드를 에셋에 넣고, 보이는 이름을 바꾸고, 라이선스·정보 화면을 채웁니다.

사용법:
  python3 tools/work_assets.py --photo <PhotoCraft 웹 빌드 폴더> --film <FilmCraft 웹 빌드 폴더> \
      --office-res <IeumOffice resources> --photo-src <PhotoCraft 라이선스 폴더> --film-src <FilmCraft 소스> \
      --node-license <Node LICENSE 파일> --versions office=v0.12.12,photo=v0.22.0,film=v0.19.0,node=22.x --build 12

원본이 바뀌어 고칠 문구를 못 찾으면 멈추며 알려 줍니다.
"""
import argparse
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "app/src/main/assets"
WORK = ASSETS / "work"
ICON = WORK / "icon.png"


def copy_site(src: pathlib.Path, name: str) -> pathlib.Path:
    dst = ASSETS / name
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for junk in ["_headers", ".htaccess", "HOSTING.md"]:
        (dst / junk).unlink(missing_ok=True)
    return dst


def replace_all(path: pathlib.Path, pairs, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new, required in pairs:
        if old not in text:
            if required:
                sys.exit(f"{label}: 바꿀 문구를 찾지 못했습니다 (원본이 바뀌었나요?): {old}")
            continue
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--photo", required=True)
    ap.add_argument("--film", required=True)
    ap.add_argument("--office-res", required=True)
    ap.add_argument("--photo-src", required=True, help="LICENSE-MIT.txt 등이 있는 폴더")
    ap.add_argument("--film-src", required=True)
    ap.add_argument("--node-license", required=True)
    ap.add_argument("--versions", required=True)
    ap.add_argument("--build", default="dev")
    ap.add_argument("--app-version", default="1.0.1")
    a = ap.parse_args()
    ver = dict(kv.split("=", 1) for kv in a.versions.split(","))

    # ---------- 사진 편집 ----------
    photo = copy_site(pathlib.Path(a.photo), "photo")
    replace_all(photo / "index.html", [
        ("<title>PhotoCraft</title>", "<title>덜누름 워크 사진</title>", True),
        ("Loading PhotoCraft&hellip;", "사진 편집을 준비하는 중&hellip;", True),
        ("This is taking longer than usual. If PhotoCraft doesn't start, its files may have failed to",
         "평소보다 오래 걸립니다. 시작하지 않으면 앱을 닫았다가 다시 열어 주세요. If the editor doesn't start, its files may have failed to", False),
        ("<strong>PhotoCraft stopped.</strong>", "<strong>사진 편집이 멈췄습니다.</strong>", False),
    ], "사진 index.html")
    for fav in photo.glob("favicon*.png"):
        shutil.copy(ICON, fav)

    # ---------- 동영상 편집 ----------
    film = copy_site(pathlib.Path(a.film), "film")
    replace_all(film / "index.html", [
        ("<title>FilmCraft</title>", "<title>덜누름 워크 동영상</title>", True),
        ("Loading FilmCraft…", "동영상 편집을 준비하는 중…", True),
        ("FilmCraft stopped working", "동영상 편집이 멈췄습니다", False),
        ('"FilmCraft failed to start:\\n"', '"동영상 편집을 시작하지 못했습니다:\\n"', False),
    ], "동영상 index.html")
    for fav in film.glob("favicon*.png"):
        shutil.copy(ICON, fav)
    (film / "favicon.png.attribution").unlink(missing_ok=True)

    # ---------- 라이선스 ----------
    lic = WORK / "licenses"
    if lic.exists():
        shutil.rmtree(lic)
    for sub, src, names in [
        ("office", pathlib.Path(a.office_res), ["LICENSE.txt", "NOTICE.txt", "THIRD-PARTY-NOTICES.txt", "LICENSE-UNICODE.txt"]),
        ("photo", pathlib.Path(a.photo_src), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt", "ATTRIBUTION.md"]),
        ("film", pathlib.Path(a.film_src), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt", "ATTRIBUTION.md"]),
    ]:
        d = lic / sub
        d.mkdir(parents=True)
        for n in names:
            cands = [src / n, src / n.replace(".txt", "")] if n.endswith(".txt") else [src / n]
            f = next((c for c in cands if c.exists()), None)
            if f is None:
                if n in ("LICENSE.txt", "LICENSE-MIT.txt", "LICENSE-APACHE.txt"):
                    sys.exit(f"{sub}: 라이선스 파일이 없습니다: {n} ({src})")
                continue
            shutil.copy(f, d / n)
    (lic / "node").mkdir()
    shutil.copy(a.node_license, lic / "node/LICENSE.txt")

    about = WORK / "about.html"
    replace_all(about, [
        ("{{APP_VERSION}}", a.app_version, True), ("{{BUILD}}", a.build, True),
        ("{{OFFICE_VER}}", ver.get("office", "?"), True), ("{{PHOTO_VER}}", ver.get("photo", "?"), True),
        ("{{FILM_VER}}", ver.get("film", "?"), True), ("{{NODE_VER}}", ver.get("node", "?"), True),
    ], "about.html")
    # 문제 진단 화면에 보이는 빌드 번호
    (WORK.parent / "build.txt").write_text(f"{a.build} ({ver.get('office', '?')}, node {ver.get('node', '?')})\n", encoding="utf-8")
    print("덜누름 워크 에셋 완료:", ", ".join(f"{k} {v}" for k, v in ver.items()))


if __name__ == "__main__":
    main()
