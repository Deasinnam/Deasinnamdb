"""LightCraft(사진 정리 · 보정) 소스에 한국어를 넣습니다. 고칠 곳을 못 찾으면 실패합니다.

사용: python3 tools/lightcraft_patch.py <lightcraft 소스> <craft-fonts 소스>

1) 한국어 번역: tools/i18n/light/ko.json(화면 문구) · ko-formats.json(숫자 · 이름이 들어가는 문구)을
   crates/ui-egui/locales/에 넣고, 언어 표(language_table!)와 편집 › 언어 메뉴에 "한국어"를 더함.
   웹판은 "자동" 언어가 브라우저 언어(navigator.languages)를 따르므로, 한국어 휴대폰에서는 처음부터 한국어로 열림.
2) 한글 글꼴: 웹판(wasm)은 craft-fonts 중 일본어 · 태국어 · 조지아어 글꼴만 넣음 → 나눔고딕(Hang,Kore)도 넣게 함.
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
here = pathlib.Path(__file__).resolve().parent / "i18n/light"


def patch(path: pathlib.Path, old: str, new: str, what: str):
    s = path.read_text(encoding="utf-8")
    if old not in s:
        sys.exit(f"{path}: {what} 자리를 찾지 못했습니다 (업스트림이 바뀜)")
    path.write_text(s.replace(old, new, 1), encoding="utf-8")


# ---- 1) 번역 파일 ----
loc = root / "crates/ui-egui/locales"
ja = json.loads((loc / "ja.json").read_text(encoding="utf-8"))
jaf = json.loads((loc / "ja-formats.json").read_text(encoding="utf-8"))
ko = json.loads((here / "ko.json").read_text(encoding="utf-8"))
kof = json.loads((here / "ko-formats.json").read_text(encoding="utf-8"))

# 일본어 카탈로그에 없는 열쇠(업스트림이 지운 문구)는 버리고, 형식 문구는 자리 표시({}) 개수 · 순서를 검사:
# Rust format!은 쓰지 않은 인자가 있으면 컴파일이 안 되므로, 맞지 않는 번역은 빼고(→ 영어) 빌드를 지킴.
PH = re.compile(r"\{[^{}]*\}")


def positional(s):
    return [p for p in PH.findall(s.replace("{{", "").replace("}}", "")) if re.fullmatch(r"\{(:[^}]*)?\}", p)]


def named(s):
    return sorted(re.sub(r":.*", "}", p) for p in PH.findall(s.replace("{{", "").replace("}}", "")) if not re.fullmatch(r"\{(:[^}]*)?\}", p))


ko = {k: v for k, v in ko.items() if k in ja and v}
bad = []
for k in list(kof):
    ref = jaf.get(k, k)
    v = kof[k]
    if k not in jaf or len(positional(v)) != len(positional(ref)) or named(v) != named(ref):
        bad.append(k)
        del kof[k]
missing = len(ja) - len(ko)
print(f"한국어: 화면 문구 {len(ko)}/{len(ja)} (빠진 {missing}개는 영어), 형식 문구 {len(kof)}/{len(jaf)}, 자리 표시가 맞지 않아 뺀 것 {len(bad)}")
for k in bad[:20]:
    print("  뺌:", repr(k))
(loc / "ko.json").write_text(json.dumps(ko, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
(loc / "ko-formats.json").write_text(json.dumps(kof, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

i18n = root / "crates/ui-egui/src/i18n.rs"
patch(i18n, '    Ja, "ja", "日本語", "Jpan", include_str!("../locales/ja.json");\n',
      '    Ja, "ja", "日本語", "Jpan", include_str!("../locales/ja.json");\n'
      '    Ko, "ko", "한국어", "Kore", include_str!("../locales/ko.json");\n', "언어 표")

cmds = root / "crates/ui-egui/src/menus/ui_commands.rs"
patch(cmds, '    ("app.language.japanese", crate::i18n::Locale::Ja.name(), None, "Edit>Language"),\n',
      '    ("app.language.japanese", crate::i18n::Locale::Ja.name(), None, "Edit>Language"),\n'
      '    ("app.language.korean", crate::i18n::Locale::Ko.name(), None, "Edit>Language"),\n', "언어 메뉴")
patch(cmds, '        "app.language.japanese" => Some(crate::i18n::Locale::Ja),\n',
      '        "app.language.japanese" => Some(crate::i18n::Locale::Ja),\n'
      '        "app.language.korean" => Some(crate::i18n::Locale::Ko),\n', "언어 명령")

# ---- 2) 웹판에 나눔고딕 ----
build = root / "crates/engine/build.rs"
patch(build, 'if wasm && !matches!((*family, *style), ("BIZ UDPGothic" | "Noto Sans Thai" | "Noto Sans Georgian", "Regular")) {',
      'if wasm && !matches!((*family, *style), ("BIZ UDPGothic" | "Noto Sans Thai" | "Noto Sans Georgian" | "NanumGothic", "Regular")) {',
      "웹판 글꼴 고르기")
print("patched", root)
