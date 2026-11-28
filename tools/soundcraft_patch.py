#!/usr/bin/env python3
"""SoundCraft 화면 문구를 한국어로 바꾸는 패치.

SoundCraft에는 다국어 체계가 없으므로, SoundCraft가 쓰는 egui(storytold 포크)를
vendor/egui 에 받아 두고 글자가 위젯으로 들어가는 자리(WidgetText·RichText 만들기,
Painter::text)에서 사전으로 바꿔 넣는다.

  python3 tools/soundcraft_patch.py <soundcraft 소스 폴더> [<egui 포크 폴더>]

egui 포크 폴더를 주지 않으면 Cargo.toml 의 [patch.crates-io] 에 적힌 rev 를
git 으로 받아 온다. 사전: tools/i18n/sound/ko.json (그대로 맞는 문구),
ko-patterns.json (Rust format! 문자열 모양 — {} 자리에 들어간 값은 그대로 옮긴다).
"""
import json, os, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
I18N = HERE / "i18n" / "sound"


def rust_unescape(s):
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c == "\\" and i + 1 < len(s):
            n = s[i + 1]
            if n == "n": out.append("\n"); i += 2; continue
            if n == "t": out.append("\t"); i += 2; continue
            if n in "\"'\\": out.append(n); i += 2; continue
            if n == "u" and s[i + 2:i + 3] == "{":
                j = s.index("}", i)
                out.append(chr(int(s[i + 3:j], 16))); i = j + 1; continue
        out.append(c); i += 1
    return "".join(out)


def rust_lit(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\t", "\\t") + '"'


def parse_fmt(s):
    """format! 문자열 → [('lit', text) | ('ph', name_or_None, index_or_None)]"""
    parts, buf, i = [], [], 0
    while i < len(s):
        c = s[i]
        if c == "{" and s[i + 1:i + 2] == "{": buf.append("{"); i += 2; continue
        if c == "}" and s[i + 1:i + 2] == "}": buf.append("}"); i += 2; continue
        if c == "{":
            j = s.index("}", i)
            inner = s[i + 1:j].split(":", 1)[0]
            if buf: parts.append(("lit", "".join(buf))); buf = []
            if inner == "": parts.append(("ph", None, None))
            elif inner.isdigit(): parts.append(("ph", None, int(inner)))
            else: parts.append(("ph", inner, None))
            i = j + 1; continue
        buf.append(c); i += 1
    if buf: parts.append(("lit", "".join(buf)))
    return parts


def build_patterns(pat):
    """영어 모양 → (조각들, 한국어 조립 순서). 자리 번호는 영어 모양의 자리 순서."""
    rows, dropped = [], []
    for en, ko in pat.items():
        en, ko = rust_unescape(en), rust_unescape(ko)
        ep, kp = parse_fmt(en), parse_fmt(ko)
        slots = [p for p in ep if p[0] == "ph"]
        unnamed = [k for k, p in enumerate(slots) if p[1] is None]
        named = {p[1]: k for k, p in enumerate(slots) if p[1]}
        # 자리 두 개가 붙어 있으면 어디서 나눌지 알 수 없다
        if any(a[0] == "ph" and b[0] == "ph" for a, b in zip(ep, ep[1:])) or not any(p[0] == "lit" and p[1].strip() for p in ep):
            dropped.append(en); continue
        seq, nxt, ok = [], 0, True
        for p in kp:
            if p[0] == "lit": seq.append(("lit", p[1])); continue
            if p[1]:
                if p[1] not in named: ok = False; break
                seq.append(("slot", named[p[1]]))
            elif p[2] is not None:
                if p[2] >= len(unnamed): ok = False; break
                seq.append(("slot", unnamed[p[2]]))
            else:
                if nxt >= len(unnamed): ok = False; break
                seq.append(("slot", unnamed[nxt])); nxt += 1
        if not ok: dropped.append(en); continue
        enp = [("lit", p[1]) if p[0] == "lit" else ("slot", None) for p in ep]
        rows.append((enp, seq))
    return rows, dropped


def gen_rust(plain, rows):
    o = ["// 덜누름 워크가 만든 파일 — tools/soundcraft_patch.py", "#[rustfmt::skip]",
         "pub(crate) static PLAIN: &[(&str, &str)] = &["]
    for en, ko in sorted(plain.items()):
        o.append(f"    ({rust_lit(en)}, {rust_lit(ko)}),")
    o.append("];")
    o.append("#[rustfmt::skip]")
    o.append("pub(crate) static PATTERNS: &[(&[Piece], &[Piece])] = &[")
    for enp, seq in rows:
        def pc(p):
            return f"Piece::Lit({rust_lit(p[1])})" if p[0] == "lit" else f"Piece::Slot({p[1] or 0})"
        o.append(f"    (&[{', '.join(pc(p) for p in enp)}], &[{', '.join(pc(p) for p in seq)}]),")
    o.append("];")
    return "\n".join(o) + "\n"


DN_TR = r'''//! 덜누름 워크: 화면 문구 한국어 사전 (tools/soundcraft_patch.py 가 넣음)
use std::collections::HashMap;
use std::sync::OnceLock;

#[derive(Clone, Copy)]
pub(crate) enum Piece {
    Lit(&'static str),
    Slot(usize),
}

mod data {
    use super::Piece;
    include!("dn_tr_data.rs");
}

fn plain() -> &'static HashMap<&'static str, &'static str> {
    static MAP: OnceLock<HashMap<&'static str, &'static str>> = OnceLock::new();
    MAP.get_or_init(|| data::PLAIN.iter().copied().collect())
}

fn match_pieces<'a>(pieces: &[Piece], s: &'a str, caps: &mut Vec<&'a str>) -> bool {
    match pieces.split_first() {
        None => s.is_empty(),
        Some((Piece::Lit(l), rest)) => match s.strip_prefix(l) {
            Some(r) => match_pieces(rest, r, caps),
            None => false,
        },
        Some((Piece::Slot(_), rest)) => {
            if rest.is_empty() {
                caps.push(s);
                return !s.is_empty();
            }
            let Some(Piece::Lit(next)) = rest.first() else { return false };
            let mut from = 0;
            while let Some(off) = s[from..].find(next) {
                let at = from + off;
                if at > 0 {
                    let n = caps.len();
                    caps.push(&s[..at]);
                    if match_pieces(rest, &s[at..], caps) {
                        return true;
                    }
                    caps.truncate(n);
                }
                from = at + s[at..].chars().next().map_or(1, char::len_utf8);
            }
            false
        }
    }
}

fn plain_or(s: &str) -> &str {
    plain().get(s).copied().unwrap_or(s)
}

fn by_pattern(s: &str) -> Option<String> {
    for (en, ko) in data::PATTERNS {
        let mut caps = Vec::new();
        if match_pieces(en, s, &mut caps) {
            let mut out = String::with_capacity(s.len() + 8);
            for p in *ko {
                match p {
                    Piece::Lit(l) => out.push_str(l),
                    Piece::Slot(i) => out.push_str(plain_or(caps.get(*i).copied().unwrap_or(""))),
                }
            }
            return Some(out);
        }
    }
    None
}

thread_local! {
    static CACHE: std::cell::RefCell<HashMap<String, Option<String>>> = Default::default();
}

/// 사전에 있으면 한국어, 없으면 그대로.
pub fn tr(s: String) -> String {
    if s.is_empty() || s.len() > 400 {
        return s;
    }
    if let Some(k) = plain().get(s.as_str()) {
        return (*k).to_owned();
    }
    if let Some(hit) = CACHE.with(|c| c.borrow().get(&s).cloned()) {
        return hit.unwrap_or(s);
    }
    let v = by_pattern(&s);
    CACHE.with(|c| {
        let mut c = c.borrow_mut();
        if c.len() > 4096 {
            c.clear();
        }
        c.insert(s.clone(), v.clone());
    });
    v.unwrap_or(s)
}
'''


def sub_once(text, old, new, what):
    if new in text:
        return text
    if old not in text:
        sys.exit(f"패치 자리를 찾지 못함: {what}")
    return text.replace(old, new, 1)


def patch_egui(egui):
    src = egui / "crates" / "egui" / "src"
    (src / "dn_tr.rs").write_text(DN_TR, encoding="utf-8")
    lib = (src / "lib.rs").read_text(encoding="utf-8")
    lib = sub_once(lib, "pub mod widget_text;\n", "pub mod widget_text;\n#[doc(hidden)]\npub mod dn_tr;\n", "lib.rs")
    (src / "lib.rs").write_text(lib, encoding="utf-8")

    wt = (src / "widget_text.rs").read_text(encoding="utf-8")
    wt = sub_once(wt, "        Self {\n            text: text.into(),\n            ..Default::default()\n        }",
                  "        Self {\n            text: crate::dn_tr::tr(text.into()),\n            ..Default::default()\n        }", "RichText::new")
    for ty, body in [("&str", "text.to_owned()"), ("&String", "text.clone()"), ("String", "text"),
                     ("&Box<str>", "text.to_string()"), ("Box<str>", "text.into()"), ("Cow<'_, str>", "text.into_owned()")]:
        old = f"impl From<{ty}> for WidgetText {{\n    #[inline]\n    fn from(text: {ty}) -> Self {{\n        Self::Text({body})\n    }}"
        new = f"impl From<{ty}> for WidgetText {{\n    #[inline]\n    fn from(text: {ty}) -> Self {{\n        Self::Text(crate::dn_tr::tr({body}))\n    }}"
        wt = sub_once(wt, old, new, f"WidgetText From<{ty}>")
    (src / "widget_text.rs").write_text(wt, encoding="utf-8")

    pt = (src / "painter.rs").read_text(encoding="utf-8")
    pt = sub_once(pt, "let galley = self.layout_no_wrap(text.to_string(), font_id, text_color);\n        let rect = anchor",
                  "let galley = self.layout_no_wrap(crate::dn_tr::tr(text.to_string()), font_id, text_color);\n        let rect = anchor",
                  "Painter::text")
    (src / "painter.rs").write_text(pt, encoding="utf-8")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sc = Path(sys.argv[1]).resolve()
    cargo = (sc / "Cargo.toml").read_text(encoding="utf-8")
    m = re.search(r'egui = \{ git = "(https://github.com/[^"]+/egui\.git)", rev = "([0-9a-f]+)" \}', cargo)
    vendor = sc / "vendor" / "egui"
    if len(sys.argv) > 2:
        egui = Path(sys.argv[2]).resolve()
    elif m:
        egui = vendor
        if not (egui / "crates").is_dir():
            egui.mkdir(parents=True, exist_ok=True)
            run = lambda *a: subprocess.run(a, cwd=egui, check=True)
            run("git", "init", "-q"); run("git", "remote", "add", "o", m.group(1))
            run("git", "fetch", "-q", "--depth", "1", "o", m.group(2)); run("git", "checkout", "-q", "FETCH_HEAD")
    else:
        sys.exit("Cargo.toml 에서 egui 포크 rev 를 찾지 못함")

    plain = {rust_unescape(k): rust_unescape(v) for k, v in json.load(open(I18N / "ko.json", encoding="utf-8")).items() if v and v != k}
    rows, dropped = build_patterns(json.load(open(I18N / "ko-patterns.json", encoding="utf-8")))
    patch_egui(egui)
    (egui / "crates" / "egui" / "src" / "dn_tr_data.rs").write_text(gen_rust(plain, rows), encoding="utf-8")

    # egui 가족 전체를 같은 폴더에서 쓰게 바꾼다 (한 가지만 바꾸면 같은 크레이트가 두 벌 생긴다)
    rel = os.path.relpath(egui, sc)
    def repl(mm):
        name = mm.group(1)
        if (egui / "crates" / name / "Cargo.toml").is_file():
            return f'{name} = {{ path = "{rel}/crates/{name}" }}'
        return mm.group(0)
    if m:
        cargo = re.sub(r'^([A-Za-z0-9_-]+) = \{ git = "' + re.escape(m.group(1)) + r'", rev = "[0-9a-f]+" \}', repl, cargo, flags=re.M)
        (sc / "Cargo.toml").write_text(cargo, encoding="utf-8")
    print(f"녹음 편집 한국어: 문구 {len(plain)}, 모양 {len(rows)} (뺀 모양 {len(dropped)}: {dropped[:5]})")


if __name__ == "__main__":
    main()
