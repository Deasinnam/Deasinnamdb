"""하드웨어 페이지 상품 카드의 가격·매진 표시를 고친다.

사용: python3 tools/update_prices.py prices.json
prices.json 예:
{"date": "11.14",
 "items": {"fold7": {"price": 1185590},
           "fold8u": {"price": 2220740, "orig": 2577300, "pct": 13},
           "cupholder": {"soldout": true}}}
- price: 지금 판매가(원). orig·pct: 할인 전 가격과 할인율(없으면 생략).
- soldout: true 면 "매진"으로 표시(가격 줄에 매진, 사진 위에 매진 덮개).
- 목록에 없는 상품은 그대로 둔다. 상품 id: fold7, fold8u, monsterdeck, ulanzi-dial, cupholder, fanaue-mount, anmite-monitor, solar-cam, jooyon-v27q, flipbook13, flipbook14, tb4-cable, gclicker-set, hub8c
고친 뒤 python3 tools/build_pages.py 로 페이지를 다시 만든다.
"""
import json, re, sys
from pathlib import Path
SRC = Path(__file__).resolve().parent.parent / "src" / "index.html"
def won(n): return f"{int(n):,}원"
def main(path):
    data = json.loads(Path(path).read_text(encoding="utf-8")); date = data["date"]
    s = SRC.read_text(encoding="utf-8"); changed = []
    for pid, it in data["items"].items():
        m = re.search(r'<a class="pd( is-soldout)?" data-pid="%s".*?</a>' % re.escape(pid), s, re.S)
        if not m: print("없는 상품:", pid); continue
        card = m.group(0)
        if it.get("soldout"):
            price = '<span class="pd-price">매진</span>'
            card = card.replace('<a class="pd" data-pid', '<a class="pd is-soldout" data-pid', 1)
        else:
            card = card.replace('<a class="pd is-soldout" data-pid', '<a class="pd" data-pid', 1)
            if it.get("orig") and it.get("pct"):
                price = '<span class="pd-price"><s>%s</s> <em>%d%%</em> %s</span>' % (won(it["orig"]), int(it["pct"]), won(it["price"]))
            else:
                price = '<span class="pd-price">%s</span>' % won(it["price"])
        card = re.sub(r'<span class="pd-price">.*?</span>(?=\s*<span class="pd-foot">)', price, card, count=1, flags=re.S)
        card = re.sub(r'(<span class="pd-shop">[^<·]+ · )[^<]*( 기준</span>)', r'\g<1>%s\g<2>' % date, card, count=1)
        s = s[:m.start()] + card + s[m.end():]; changed.append(pid)
    SRC.write_text(s, encoding="utf-8"); print("고친 상품:", ", ".join(changed))
if __name__ == "__main__": main(sys.argv[1])
