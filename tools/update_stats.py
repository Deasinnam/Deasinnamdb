"""방문자 수 · 내려받은 수 · 알림 신청 수를 카운터 서버(abacus)에서 받아 stats.json에 적는다.

카운터 서버가 한 번 답하는 데 20~30초씩 걸릴 때가 있어, 사이트는 이 파일(같은 사이트라 바로 열림)을 먼저 보여 주고
서버 답이 오면 바꾼다. 받지 못한 값은 예전 값을 그대로 두고, 숫자는 줄어들지 않게 큰 쪽을 남긴다.

사용: python3 tools/update_stats.py   (사이트 맨 위 폴더에서)
"""
import json, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://abacus.jasoncameron.dev/get/deolnureum/"
OUT = Path(__file__).resolve().parent.parent / "stats.json"
# 사이트가 쓰는 카운터 키: dl-<앱>(내려받기 버튼 누른 수), nt-<앱>(알림 신청 수)
KEYS = ["total", "dl-browser", "dl-desktop", "dl-work", "dl-sseum", "dl-amp", "dl-speed", "nt-amp", "nt-speed",
        "nt-work", "nt-desktop", "nt-browser"]


def get(key):
    try:
        req = urllib.request.Request(API + key, headers={"User-Agent": "deolnureum-site-stats"})
        with urllib.request.urlopen(req, timeout=90) as r:
            return int(json.load(r).get("value") or 0)
    except urllib.error.HTTPError as e:
        return 0 if e.code == 404 else None  # 404 = 아직 아무도 안 셈
    except Exception:
        return None


def main():
    kst = datetime.now(timezone.utc) + timedelta(hours=9)
    day = kst.strftime("%Y%m%d")
    old = {}
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        pass
    keys = KEYS + ["day-" + day]
    with ThreadPoolExecutor(len(keys)) as ex:
        got = dict(zip(keys, ex.map(get, keys)))
    c = dict(old.get("c") or {})
    for k in KEYS:
        if got[k] is not None:
            c[k] = max(got[k], c.get(k, 0))
    today = got["day-" + day]
    old_today = old.get("today", 0) if old.get("day") == day else 0
    out = {
        "t": kst.strftime("%Y-%m-%d %H:%M"),  # 한국 시각
        "day": day,
        "today": max(today, old_today) if today is not None else old_today,
        "c": c,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    missed = [k for k in keys if got[k] is None]
    print("stats.json", out["t"], "받지 못함:", ", ".join(missed) or "없음")


if __name__ == "__main__":
    main()
