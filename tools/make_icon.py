#!/usr/bin/env python3
"""덜누름 브라우저 아이콘: 덜누름 데스크와 같은 계열(남보라 바탕 + 흰 창 + '덜'), 창 위에 주소 줄."""
import sys
from PIL import Image, ImageDraw, ImageFont

S = 1024
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc"

def gradient(size, c0, c1):
    im = Image.new("RGB", (size, size))
    px = im.load()
    for y in range(size):
        for x in range(size):
            t = (x * 0.35 + y * 0.65) / size
            px[x, y] = tuple(round(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))
    return im

def make():
    bg = gradient(S, (46, 58, 140), (16, 24, 60))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=230, fill=255)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(icon)
    # 창
    x0, y0, x1, y1 = 150, 210, 874, 800
    d.rounded_rectangle([x0, y0 + 14, x1, y1 + 14], radius=64, fill=(8, 12, 34, 255))       # 그림자
    d.rounded_rectangle([x0, y0, x1, y1], radius=64, fill=(245, 246, 252, 255))
    # 위쪽 줄(보라) + 주소 칸
    d.rounded_rectangle([x0, y0, x1, y0 + 150], radius=64, fill=(124, 108, 246, 255))
    d.rectangle([x0, y0 + 90, x1, y0 + 150], fill=(124, 108, 246, 255))
    d.rounded_rectangle([x0 + 150, y0 + 40, x1 - 60, y0 + 110], radius=35, fill=(255, 255, 255, 255))
    for i, c in enumerate([(255, 255, 255, 235)] * 2):
        d.ellipse([x0 + 46 + i * 50, y0 + 58, x0 + 80 + i * 50, y0 + 92], fill=c)
    d.ellipse([x0 + 178, y0 + 62, x0 + 204, y0 + 88], fill=(80, 230, 170, 255))            # 연결 표시
    # '덜'
    f = ImageFont.truetype(FONT, 330, index=1)  # index 1: KR
    box = d.textbbox((0, 0), "덜", font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((x0 + x1 - tw) / 2 - box[0], (y0 + 150 + y1 - th) / 2 - box[1] - 6), "덜", font=f, fill=(23, 24, 44, 255))
    return icon

if __name__ == "__main__":
    out = sys.argv[1]
    icon = make()
    for name, px in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]:
        import os
        os.makedirs(f"{out}/mipmap-{name}", exist_ok=True)
        icon.resize((px, px), Image.LANCZOS).save(f"{out}/mipmap-{name}/ic_launcher.png")
    icon.resize((512, 512), Image.LANCZOS).save("/tmp/browser-icon-512.png")
