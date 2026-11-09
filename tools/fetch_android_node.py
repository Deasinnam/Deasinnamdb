#!/usr/bin/env python3
"""Termux 저장소에서 안드로이드용 Node.js(LTS)와 필요한 공유 라이브러리를 받아 jniLibs 폴더에 넣습니다.

사용법 (빌드 서버, Ubuntu):
  python3 tools/fetch_android_node.py --arch aarch64 --out app/src/main/jniLibs/arm64-v8a
  python3 tools/fetch_android_node.py --arch x86_64  --out app/src/main/jniLibs/x86_64

왜 이렇게 하나
  - 안드로이드 10부터 앱 데이터 폴더의 파일은 실행할 수 없고, 앱에 같이 설치되는 lib/<abi>/lib*.so 만 실행됩니다.
    그래서 node 실행 파일을 libnode.so 라는 이름으로 넣습니다.
  - 설치기는 lib*.so 모양의 파일만 풀어 주므로 libz.so.1 같은 이름은 libz_1.so 로 바꿔 넣고,
    앱이 실행할 때 원래 이름의 심볼릭 링크를 만들어 줍니다(바이너리 자체는 손대지 않음).
    이름 대응표는 --map 파일(assets/nodelibs.txt)에 씁니다.
필요한 도구: dpkg-deb, readelf
"""
import argparse
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

REPO = "https://packages-cf.termux.dev/apt/termux-main"
PREFIX = "data/data/com.termux/files/usr"
# 안드로이드가 직접 주는 라이브러리 (NDK 공개 라이브러리)
SYSTEM_LIBS = {"libc.so", "libm.so", "libdl.so", "liblog.so", "libandroid.so", "libz.so", "libEGL.so", "libGLESv2.so", "libOpenSLES.so", "libjnigraphics.so", "libmediandk.so", "libvulkan.so"}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ieumoffice-android-build"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def parse_packages(text: str) -> dict:
    pkgs = {}
    for stanza in text.split("\n\n"):
        fields = {}
        key = None
        for line in stanza.splitlines():
            if line.startswith(" ") and key:
                fields[key] += "\n" + line.strip()
                continue
            if ":" in line:
                key, _, val = line.partition(":")
                fields[key.strip()] = val.strip()
        if "Package" in fields:
            pkgs[fields["Package"]] = fields
    return pkgs


def deps_of(fields: dict) -> list:
    out = []
    for part in (fields.get("Depends", "") + "," + fields.get("Pre-Depends", "")).split(","):
        part = part.strip()
        if not part:
            continue
        alt = part.split("|")[0].strip()
        out.append(re.sub(r"\s*\(.*\)", "", alt).strip())
    return out


def needed(path: pathlib.Path) -> list:
    out = subprocess.run(["readelf", "-d", str(path)], capture_output=True, text=True).stdout
    return re.findall(r"\(NEEDED\)\s+Shared library: \[([^\]]+)\]", out)


def android_name(lib: str) -> str:
    if lib.endswith(".so"):
        return lib
    base, _, ver = lib.partition(".so.")
    return f"{base}_{ver.replace('.', '_')}.so"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--arch", required=True, choices=["aarch64", "x86_64", "arm"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--package", default="nodejs-lts")
    ap.add_argument("--map", default="app/src/main/assets/nodelibs.txt")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    index = fetch(f"{REPO}/dists/stable/main/binary-{a.arch}/Packages").decode("utf-8", "replace")
    pkgs = parse_packages(index)
    if a.package not in pkgs:
        sys.exit(f"{a.package} 패키지를 찾지 못했습니다")
    print(f"{a.package} {pkgs[a.package].get('Version')} ({a.arch})")

    want, seen = [a.package], set()
    while want:
        p = want.pop()
        if p in seen or p not in pkgs:
            continue
        seen.add(p)
        want.extend(deps_of(pkgs[p]))

    stage = pathlib.Path(tempfile.mkdtemp(prefix="termux-"))
    for p in sorted(seen):
        deb = stage / f"{p}.deb"
        deb.write_bytes(fetch(f"{REPO}/{pkgs[p]['Filename']}"))
        subprocess.run(["dpkg-deb", "-x", str(deb), str(stage / "root")], check=True)
    usr = stage / "root" / PREFIX
    node = usr / "bin" / "node"
    if not node.is_file():
        sys.exit("node 실행 파일이 패키지에 없습니다")

    # node가 실제로 쓰는 라이브러리만 (NEEDED를 따라감)
    libdir = usr / "lib"
    todo, libs = list(needed(node)), {}
    while todo:
        n = todo.pop()
        if n in libs or n in SYSTEM_LIBS:
            continue
        src = libdir / n
        if not src.exists():
            print(f"  (시스템 라이브러리로 간주) {n}")
            continue
        libs[n] = src.resolve()
        todo.extend(needed(libs[n]))

    renames = {n: android_name(n) for n in libs}
    for n, src in libs.items():
        shutil.copyfile(src, out / renames[n])
        print(f"  {renames[n]} ← {n} ({src.stat().st_size / 1e6:.1f}MB)")
    node_dst = out / "libnode.so"
    shutil.copyfile(node, node_dst)
    node_dst.chmod(0o755)
    print(f"  libnode.so ({node_dst.stat().st_size / 1e6:.1f}MB)")

    # 원래 이름 → 설치된 이름 (여러 CPU 종류를 받으면 합칩니다)
    mp = pathlib.Path(a.map)
    mp.parent.mkdir(parents=True, exist_ok=True)
    lines = set(mp.read_text().splitlines()) if mp.exists() else set()
    lines |= {f"{old}={new}" for old, new in renames.items() if old != new}
    mp.write_text("\n".join(sorted(l for l in lines if l)) + "\n")
    shutil.rmtree(stage, ignore_errors=True)


if __name__ == "__main__":
    main()
