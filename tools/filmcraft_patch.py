"""FilmCraft 소스에 안드로이드(웹) 판용 수정을 넣습니다. 고칠 곳을 못 찾으면 실패합니다."""
import sys, pathlib

root = pathlib.Path(sys.argv[1])

# 1) H.264 인코더: 웹(wasm32)에는 스레드가 없어 rayon 스레드 풀을 만들 수 없음
#    ("cannot build the 1-thread pool: operation not supported on this platform") → 웹에서는 풀 없이 인코딩
p = root / "crates/h264enc/src/lib.rs"
s = p.read_text()
old = """            pool: Some(
                rayon::ThreadPoolBuilder::new()
                    .num_threads(threads)
                    .build()
                    .map_err(|e| Error::InvalidConfig(format!("cannot build the {threads}-thread pool: {e}")))?,
            ),"""
new = """            pool: if cfg!(target_arch = "wasm32") {
                None
            } else {
                Some(
                    rayon::ThreadPoolBuilder::new()
                        .num_threads(threads)
                        .build()
                        .map_err(|e| Error::InvalidConfig(format!("cannot build the {threads}-thread pool: {e}")))?,
                )
            },"""
if old not in s:
    sys.exit("h264enc 스레드 풀 코드를 찾지 못했습니다 (업스트림이 바뀜)")
p.write_text(s.replace(old, new))
print("patched", p)

# 2) 한국어 화면: 웹(wasm32)에는 시스템 글꼴이 없어 cjk.rs가 한글 글꼴을 찾지 못하고
#    "no Korean font is installed … the interface stays in English"로 한국어 전환을 거부함
#    → 웹에서는 함께 넣은 한글 글꼴(tools/fonts/korean, SIL OFL 1.1)을 씀. 화면 글꼴 묶음 끝에 붙어 한글을 그림
font_src = pathlib.Path(__file__).resolve().parent / "fonts/korean/NotoSansCJKkr-Regular-subset.otf"
font_dst = root / "crates/ui-egui/assets/dn-korean.otf"
font_dst.parent.mkdir(parents=True, exist_ok=True)
font_dst.write_bytes(font_src.read_bytes())
p = root / "crates/ui-egui/src/cjk.rs"
s = p.read_text()
old = """fn korean_font() -> Option<Arc<FontData>> {
    static FONT: OnceLock<Option<Arc<FontData>>> = OnceLock::new();
    FONT.get_or_init(|| find_system_font(KOREAN_SAMPLE, KOREAN_PREFERRED)).clone()
}"""
new = """fn korean_font() -> Option<Arc<FontData>> {
    static FONT: OnceLock<Option<Arc<FontData>>> = OnceLock::new();
    FONT.get_or_init(|| {
        // 덜누름 워크: 웹(안드로이드 WebView)에는 시스템 글꼴이 없으므로 함께 넣은 한글 글꼴을 씀
        if cfg!(target_arch = "wasm32") {
            return Some(Arc::new(FontData::from_static(include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/dn-korean.otf")))));
        }
        find_system_font(KOREAN_SAMPLE, KOREAN_PREFERRED)
    })
    .clone()
}"""
if old not in s:
    sys.exit("cjk.rs 한글 글꼴 코드를 찾지 못했습니다 (업스트림이 바뀜)")
p.write_text(s.replace(old, new))
print("patched", p)
