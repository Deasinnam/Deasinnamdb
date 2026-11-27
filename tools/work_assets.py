#!/usr/bin/env python3
"""덜누름 워크: 사진·동영상·사진 정리·녹음 편집기 웹 빌드를 에셋에 넣고, 보이는 이름을 바꾸고, 라이선스·정보 화면을 채웁니다.

사용법:
  python3 tools/work_assets.py --photo <PhotoCraft 웹 빌드 폴더> --film <FilmCraft 웹 빌드 폴더> \
      --office-res <IeumOffice resources> --photo-src <PhotoCraft 라이선스 폴더> --film-src <FilmCraft 소스> \
      --light <LightCraft 웹 빌드 폴더> --sound <SoundCraft 웹 빌드 폴더> --sound-src <같은 폴더> \
      --node-license <Node LICENSE 파일> --versions office=v0.12.12,photo=v0.22.0,film=v0.19.0,light=v0.21.1,sound=v0.20.1,node=22.x --build 12

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


def copy_site(src: pathlib.Path, name: str, drop=()) -> pathlib.Path:
    dst = ASSETS / name
    if dst.exists():
        shutil.rmtree(dst)
    # 미리 압축한 파일(.gz · .br)은 웹 서버용이라 앱(WebView 에셋)에서는 쓰지 않음 → 빼서 앱 크기를 줄임
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("*.gz", "*.br", *drop))
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


KOREAN_FONT_DIR = ROOT / "tools/fonts/korean"
KOREAN_FONT = "NotoSansCJKkr-Regular-subset.otf"


def add_photo_korean_font(photo: pathlib.Path) -> None:
    """사진 편집의 한국어 화면용 한글 글꼴.

    웹판 PhotoCraft는 브라우저에 시스템 글꼴이 없어서, 한국어로 바꾸면 한글이 네모로 나옵니다.
    웹판은 사이트의 fonts/manifest.txt에 적힌 글꼴을 받아 쓰고, 스크립트가 Kore인 글꼴을
    한국어 화면 글꼴로 씁니다. 그 자리에 한글 글꼴을 넣습니다 (공식 빌드에 manifest가 있으면 앞에 덧붙임)."""
    import hashlib
    rel = f"fonts/dn-korean/{KOREAN_FONT}"
    dst = photo / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(KOREAN_FONT_DIR / KOREAN_FONT, dst)
    shutil.copy(KOREAN_FONT_DIR / "OFL.txt", dst.parent / "OFL.txt")
    sha = hashlib.sha256(dst.read_bytes()).hexdigest()
    line = (f"Noto Sans CJK KR | Regular | {rel} | Kore,Hang,Latn | OFL-1.1 | fonts/dn-korean/OFL.txt | {sha}"
            " | https://github.com/notofonts/noto-cjk\n")
    manifest = photo / "fonts/manifest.txt"
    head = "# family | style | file (relative to the site root) | scripts | licence | licence file | sha256 | source\n"
    old = manifest.read_text(encoding="utf-8") if manifest.exists() else ""
    manifest.write_text(head + line + "".join(l + "\n" for l in old.splitlines() if l.strip() and not l.startswith("#")), encoding="utf-8")
    print("사진 편집 한글 글꼴:", rel)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--photo", required=True)
    ap.add_argument("--film", required=True)
    ap.add_argument("--office-res", required=True)
    ap.add_argument("--photo-src", required=True, help="LICENSE-MIT.txt 등이 있는 폴더")
    ap.add_argument("--film-src", required=True)
    ap.add_argument("--light", required=True, help="LightCraft 공식 웹 빌드 폴더")
    ap.add_argument("--sound", required=True, help="SoundCraft 공식 웹 빌드 폴더")
    ap.add_argument("--sound-src", required=True, help="라이선스 파일이 있는 폴더 (공식 웹 빌드 폴더)")
    ap.add_argument("--node-license", required=True)
    ap.add_argument("--versions", required=True)
    ap.add_argument("--build", default="dev")
    ap.add_argument("--app-version", default="1.0.3")
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
    add_photo_korean_font(photo)

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

    # ---------- 사진 정리 · 보정 (LightCraft) ----------
    # 중국어 전용 글꼴(lightcraft_zh_hans.otf, 약 16MB)은 뺌: 없으면 웹판이 빈 글꼴로 시작하고 중국어 글자만 네모가 됨(한글은 내장 글꼴로 나옴)
    light = copy_site(pathlib.Path(a.light), "light", drop=("lightcraft_zh_hans.otf", "README.md"))
    replace_all(light / "index.html", [
        ("<title>LightCraft</title>", "<title>덜누름 워크 사진 정리</title>", True),
        ("Loading LightCraft…", "사진 정리를 준비하는 중…", True),
        ('"LightCraft failed to load: "', '"사진 정리를 시작하지 못했습니다: "', False),
    ], "사진 정리 index.html")

    # ---------- 녹음 · 음성 편집 (SoundCraft) ----------
    sound = copy_site(pathlib.Path(a.sound), "sound", drop=("README.md",))
    replace_all(sound / "index.html", [
        ("<title>SoundCraft</title>", "<title>덜누름 워크 녹음</title>", True),
        ("Loading SoundCraft&hellip;", "녹음 편집을 준비하는 중&hellip;", True),
    ], "녹음 index.html")
    for fav in sound.glob("*.png"):
        shutil.copy(ICON, fav)
    # 웹판 오류 문구(wasm 안)는 그대로 — egui-bridge.js가 "failed to start"를 보고 WebGL2로 다시 시도

    # ---------- 라이선스 ----------
    lic = WORK / "licenses"
    if lic.exists():
        shutil.rmtree(lic)
    for sub, src, names in [
        ("office", pathlib.Path(a.office_res), ["LICENSE.txt", "NOTICE.txt", "THIRD-PARTY-NOTICES.txt", "LICENSE-UNICODE.txt"]),
        ("photo", pathlib.Path(a.photo_src), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt", "ATTRIBUTION.md"]),
        ("film", pathlib.Path(a.film_src), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt", "ATTRIBUTION.md"]),
        ("light", pathlib.Path(a.light), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt"]),
        ("sound", pathlib.Path(a.sound_src), ["LICENSE-MIT.txt", "LICENSE-APACHE.txt", "NOTICE.txt", "ATTRIBUTION.md"]),
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
    # 사진 정리 웹 빌드에 든 글꼴들의 OFL 전문을 한 파일로 (정보 화면에서 링크)
    ofl = sorted(pathlib.Path(a.light).glob("OFL-*.txt"))
    (lic / "light/FONTS-OFL.txt").write_text(
        "".join(f"===== {f.name[4:-4]} =====\n\n{f.read_text(encoding='utf-8', errors='replace')}\n\n" for f in ofl)
        or "(글꼴 라이선스 파일이 없습니다)\n", encoding="utf-8")
    for f in light.glob("OFL-*.txt"):
        f.unlink()
    for site in (light, sound):  # 라이선스는 정보 화면(work/licenses)에 모아 둠
        for n in ["LICENSE-MIT", "LICENSE-APACHE", "NOTICE", "ATTRIBUTION.md"]:
            (site / n).unlink(missing_ok=True)
    (lic / "node").mkdir()
    shutil.copy(a.node_license, lic / "node/LICENSE.txt")
    (lic / "fonts").mkdir()
    shutil.copy(KOREAN_FONT_DIR / "OFL.txt", lic / "fonts/OFL-NotoSansCJK.txt")
    # 문서 편집 글꼴(tools/fonts/dnr, 모두 SIL OFL 1.1)의 저작권 표시 · 라이선스 전문
    shutil.copytree(ROOT / "tools/fonts/dnr/licenses", lic / "fonts/dnr")
    shutil.copy(ROOT / "tools/fonts/dnr/README.md", lic / "fonts/dnr/README.md")

    about = WORK / "about.html"
    replace_all(about, [
        ("{{APP_VERSION}}", a.app_version, True), ("{{BUILD}}", a.build, True),
        ("{{OFFICE_VER}}", ver.get("office", "?"), True), ("{{PHOTO_VER}}", ver.get("photo", "?"), True),
        ("{{FILM_VER}}", ver.get("film", "?"), True), ("{{NODE_VER}}", ver.get("node", "?"), True),
        ("{{LIGHT_VER}}", ver.get("light", "?"), True), ("{{SOUND_VER}}", ver.get("sound", "?"), True),
    ], "about.html")
    # 문제 진단 화면에 보이는 빌드 번호
    (WORK.parent / "build.txt").write_text(f"{a.build} ({ver.get('office', '?')}, node {ver.get('node', '?')})\n", encoding="utf-8")
    print("덜누름 워크 에셋 완료:", ", ".join(f"{k} {v}" for k, v in ver.items()))


if __name__ == "__main__":
    main()
