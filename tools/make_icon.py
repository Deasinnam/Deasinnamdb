#!/usr/bin/env python3
"""덜누름 테이블오더 아이콘: 주황 바탕 + 흰 태블릿(메뉴 칸) + 주문 종."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
S = 1024
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc"
def make():
    bg = Image.new("RGB", (S, S))
    px = bg.load()
    for y in range(S):
        for x in range(S):
            t = (x * 0.35 + y * 0.65) / S
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip((250, 112, 40), (214, 66, 8)))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=230, fill=255)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0)); icon.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(icon)
    x0, y0, x1, y1 = 150, 230, 874, 780
    d.rounded_rectangle([x0, y0 + 16, x1, y1 + 16], radius=60, fill=(120, 40, 0, 255))
    d.rounded_rectangle([x0, y0, x1, y1], radius=60, fill=(255, 250, 244, 255))
    # 메뉴 칸 4개
    for i in range(2):
        for j in range(2):
            cx, cy = x0 + 60 + i * 210, y0 + 60 + j * 220
            d.rounded_rectangle([cx, cy, cx + 180, cy + 190], radius=30, fill=(253, 225, 205, 255))
    # 오른쪽: '덜' 주문 버튼
    d.rounded_rectangle([x0 + 490, y0 + 60, x1 - 60, y1 - 60], radius=40, fill=(29, 27, 24, 255))
    f = ImageFont.truetype(FONT, 150, index=1)
    b = d.textbbox((0, 0), "덜", font=f)
    d.text(((x0 + 490 + x1 - 60 - (b[2] - b[0])) / 2 - b[0], (y0 + y1 - (b[3] - b[1])) / 2 - b[1]), "덜", font=f, fill=(255, 255, 255, 255))
    return icon
if __name__ == "__main__":
    out = sys.argv[1]; icon = make()
    for name, px in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]:
        os.makedirs(f"{out}/mipmap-{name}", exist_ok=True)
        icon.resize((px, px), Image.LANCZOS).save(f"{out}/mipmap-{name}/ic_launcher.png")
    icon.resize((512, 512), Image.LANCZOS).save("/tmp/tableorder-icon-512.png")
