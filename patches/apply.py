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
