"""몬스타덱 키 아이콘 · 오른쪽 세로 화면 로고 만들기 (앱 assets/deck/*.jpg)

실측(TS115, 펌웨어 V2.293S):
  - 키 화면은 약 95×95가 보이고, 보낸 그림은 '보이는 화면의 오른쪽 위'에 붙음 → 100×100으로 만들고 내용은 (5..100, 0..95) 안에
  - 오른쪽 세로 화면은 위·가운데·아래 3칸(장치 번호 16·17·18), 칸마다 약 72×85가 보임(역시 오른쪽 위 기준)
  - 장치는 그림을 시계 방향 90° 돌려 보여 주므로, 저장할 때 반시계 90° 돌려 둠
실행: python3 tools/deck/make_icons.py  (미리보기 tools/deck/preview.png 도 만듦)
"""
import io, math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'app', 'src', 'main', 'assets', 'deck')
KR = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
def kr(s): return ImageFont.truetype(KR, s, index=1)

S = 3                       # 3배로 그린 뒤 줄여서 매끈하게
W = H = 112                 # 키 그림(보이는 곳 약 108×108, 오른쪽 위 기준)
CX, CY = 58, 50           # 보이는 영역(5..100, 0..95)의 가운데
IVORY = (246, 236, 210); BRASS = (214, 174, 98); BRASS_D = (120, 88, 40); RED = (230, 70, 50); GREEN = (120, 220, 120)

def base():
    im = Image.new('RGB', (W * S, H * S), (30, 32, 22))   # 디자인 시안과 같은 짙은 올리브 판 + 황동 테
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([4 * S, 1 * S, (W - 1) * S, (H - 5) * S], radius=6 * S, outline=(150, 112, 52), width=3 * S)
    R = 34   # 황동 링
    d.ellipse([(CX - R) * S, (CY - 4 - R) * S, (CX + R) * S, (CY - 4 + R) * S], outline=BRASS_D, width=6 * S // 2)
    d.ellipse([(CX - R + 2) * S, (CY - 4 - R + 2) * S, (CX + R - 2) * S, (CY - 4 + R - 2) * S], outline=BRASS, width=S * 2)
    return im, d

def P(pts, dx=0, dy=0): return [((CX + x + dx) * S, (CY - 4 + y + dy) * S) for x, y in pts]

def label(d, t):
    f = kr(14 * S); w = d.textlength(t, font=f)
    d.text(((CX * S) - w / 2, (CY + 32) * S), t, font=f, fill=IVORY)

# 그림 그리는 함수들(가운데 기준 좌표, 반지름 약 20 안)
def g_prev(d): d.rectangle(P([(-16, -12), (-12, 12)])[0] + P([(-12, 12)])[0], fill=IVORY); d.polygon(P([(14, -13), (14, 13), (-10, 0)]), fill=IVORY)
def g_next(d): d.rectangle(P([(12, -12)])[0] + P([(16, 12)])[0], fill=IVORY); d.polygon(P([(-14, -13), (-14, 13), (10, 0)]), fill=IVORY)
def g_play(d):
    d.polygon(P([(-15, -13), (-15, 13), (3, 0)]), fill=IVORY)
    d.rectangle(P([(6, -12)])[0] + P([(10, 12)])[0], fill=BRASS); d.rectangle(P([(13, -12)])[0] + P([(17, 12)])[0], fill=BRASS)
def g_swap(d):
    w = 3 * S
    d.line(P([(-14, -6), (12, -6)]), fill=IVORY, width=w); d.polygon(P([(16, -6), (8, -12), (8, 0)]), fill=IVORY)
    d.line(P([(14, 7), (-12, 7)]), fill=BRASS, width=w); d.polygon(P([(-16, 7), (-8, 1), (-8, 13)]), fill=BRASS)
def g_mute(d):
    d.polygon(P([(-16, -5), (-9, -5), (-1, -13), (-1, 13), (-9, 5), (-16, 5)]), fill=IVORY)
    d.line(P([(4, -7), (16, 7)]), fill=RED, width=3 * S); d.line(P([(16, -7), (4, 7)]), fill=RED, width=3 * S)
def g_gps(d):
    d.arc([(CX - 17) * S, (CY - 4 - 17) * S, (CX + 17) * S, (CY - 4 + 17) * S], 150, 390, fill=IVORY, width=3 * S)
    a = math.radians(-50); d.line(P([(0, 0), (14 * math.cos(a), 14 * math.sin(a))]), fill=RED, width=3 * S)
    d.ellipse(P([(-3, -3)])[0] + P([(3, 3)])[0], fill=BRASS)
def g_map(d):
    d.polygon(P([(-17, -10), (-6, -14), (6, -10), (17, -14), (17, 12), (6, 16), (-6, 12), (-17, 16)]), outline=IVORY, width=2 * S)
    d.line(P([(-6, -14), (-6, 12)]), fill=IVORY, width=2 * S); d.line(P([(6, -10), (6, 16)]), fill=IVORY, width=2 * S)
    d.ellipse(P([(-2, -6)])[0] + P([(6, 2)])[0], fill=RED)
def g_radio(d):
    d.rounded_rectangle(P([(-18, -9)])[0] + P([(18, 15)])[0], radius=3 * S, outline=IVORY, width=2 * S)
    d.line(P([(-12, -9), (10, -18)]), fill=IVORY, width=2 * S)
    d.ellipse(P([(-13, -3)])[0] + P([(-1, 9)])[0], outline=BRASS, width=2 * S)
    for y in (-2, 3, 8): d.line(P([(4, y), (14, y)]), fill=IVORY, width=S + 1)
def g_vis(d):
    for i, hgt in enumerate((10, 22, 15, 28, 12, 18)):
        x = -17 + i * 6.5; d.rectangle(P([(x, 14 - hgt)])[0] + P([(x + 4, 14)])[0], fill=BRASS if i % 2 else IVORY)
def g_all(d):
    for x in (-15, 2):
        for y in (-15, 2): d.rounded_rectangle(P([(x, y)])[0] + P([(x + 13, y + 13)])[0], radius=2 * S, fill=IVORY if (x + y) % 2 == 0 else BRASS)
def g_cam(d):
    d.rounded_rectangle(P([(-17, -9)])[0] + P([(7, 11)])[0], radius=3 * S, fill=IVORY); d.polygon(P([(9, -2), (18, -8), (18, 10), (9, 4)]), fill=IVORY)
    d.ellipse(P([(-10, -5)])[0] + P([(0, 5)])[0], fill=(30, 26, 20))
def g_rec(d):
    d.ellipse(P([(-14, -14)])[0] + P([(14, 14)])[0], outline=IVORY, width=2 * S); d.ellipse(P([(-8, -8)])[0] + P([(8, 8)])[0], fill=RED)
def g_day(d):
    d.ellipse(P([(-15, -9)])[0] + P([(3, 9)])[0], fill=(255, 205, 90))
    for k in range(8):
        a = k * math.pi / 4; d.line(P([(-6 + 11 * math.cos(a), 13 * math.sin(a)), (-6 + 15 * math.cos(a), 17 * math.sin(a))]), fill=(255, 205, 90), width=2 * S)
    d.ellipse(P([(4, -6)])[0] + P([(18, 8)])[0], fill=IVORY); d.ellipse(P([(9, -9)])[0] + P([(21, 4)])[0], fill=(24, 22, 16))
def g_nav(d, letter):
    d.polygon(P([(0, -17), (14, 15), (0, 8), (-14, 15)]), fill=IVORY)
    f = kr(11 * S); w = d.textlength(letter, font=f); d.text(((CX * S) - w / 2, (CY - 4 - 3) * S), letter, font=f, fill=(30, 26, 20))
def g_land(d):
    d.polygon(P([(-18, 2), (6, 2), (14, -6), (18, -6), (13, 4), (13, 8), (-14, 8)]), fill=IVORY)
    d.polygon(P([(-6, 2), (2, 2), (-6, -10), (-10, -10)]), fill=BRASS)
    d.line(P([(-18, 15), (18, 15)]), fill=BRASS, width=2 * S)
    for x in (-12, -2, 8): d.line(P([(x, 15), (x + 5, 15)]), fill=IVORY, width=2 * S)
def g_sun(d, up):
    d.ellipse(P([(-8, -8)])[0] + P([(8, 8)])[0], fill=IVORY if up else BRASS_D, outline=IVORY, width=S * 2)
    for k in range(8):
        a = k * math.pi / 4; d.line(P([(11 * math.cos(a), 11 * math.sin(a)), (16 * math.cos(a), 16 * math.sin(a))]), fill=IVORY if up else BRASS, width=2 * S)
def g_cdemo(d):
    d.ellipse(P([(-17, -17)])[0] + P([(17, 17)])[0], fill=(250, 250, 250), outline=RED, width=5 * S)
    f = kr(17 * S); w = d.textlength('50', font=f); d.text(((CX * S) - w / 2, (CY - 4 - 14) * S), '50', font=f, fill=(20, 20, 20))
def g_set(d):
    d.ellipse(P([(-12, -12)])[0] + P([(12, 12)])[0], outline=IVORY, width=5 * S)
    for k in range(8):
        a = k * math.pi / 4; d.line(P([(12 * math.cos(a), 12 * math.sin(a)), (17 * math.cos(a), 17 * math.sin(a))]), fill=IVORY, width=4 * S)
    d.ellipse(P([(-4, -4)])[0] + P([(4, 4)])[0], fill=BRASS)
def g_none(d): pass

ACTS = {  # 앱의 기능 이름(web/src/95-deck.js ACTS)과 같게
    'prev': (g_prev, '이전'), 'play': (g_play, '재생'), 'next': (g_next, '다음'), 'swap': (g_swap, '전환'), 'mute': (g_mute, '음소거'),
    'gps': (g_gps, '속도계'), 'map': (g_map, '지도'), 'radio': (g_radio, '라디오'), 'vis': (g_vis, 'NOW'), 'all': (g_all, '전체'),
    'cam': (g_cam, '대쉬캠'), 'rec': (g_rec, '녹화'), 'day': (g_day, '주야간'), 'tmap': (lambda d: g_nav(d, 'T'), 'T맵'),
    'nmap': (lambda d: g_nav(d, 'N'), '네이버'), 'land': (g_land, '착륙'), 'briUp': (lambda d: g_sun(d, True), '밝게'),
    'briDn': (lambda d: g_sun(d, False), '어둡게'), 'camDemo': (g_cdemo, '카메라'), 'set': (g_set, '설정'), 'none': (g_none, ''),
}

def key_image(act):
    im, d = base(); g, t = ACTS[act]; g(d)
    if t: label(d, t)
    return im.resize((W, H), Image.LANCZOS)

def side_images():
    """오른쪽 세로 화면 3칸: 위 D1 마크 · 가운데 DAESINNAM ONE · 아래 AIR FORCE + 대신남 원"""
    logo = Image.open(os.path.join(HERE, 'logo.png')).convert('RGBA')
    SW, SH = 80, 90           # 보내는 크기(보이는 곳: 오른쪽 위 기준 약 72×85 → 내용은 x 8..80, y 0..85)
    ox, ow, oh = 8, 72, 85
    def plate():
        im = Image.new('RGB', (SW * S, SH * S), (10, 16, 26)); d = ImageDraw.Draw(im)
        for y in range(SH * S):  # 금속판 느낌: 위가 밝은 남색
            c = int(30 - y / (SH * S) * 18); d.line([(0, y), (SW * S, y)], fill=(c // 2 + 6, c // 2 + 12, c + 14))
        d.rectangle([(ox + 2) * S, 2 * S, (SW - 2) * S, (oh - 2) * S], outline=(70, 140, 220), width=S * 2)
        return im, d
    out = []
    # 1) D1 마크: 로고 왼쪽에서 잘라 냄
    im, d = plate(); em = logo.crop((6, 8, 96, 102)).resize((62 * S, 62 * S), Image.LANCZOS)
    im.paste(em, ((ox + (ow - 62) // 2) * S, ((oh - 62) // 2) * S), em); out.append(im)
    # 2) DAESINNAM / ONE
    im, d = plate()
    for txt, y, sz, col in (('DAESIN', 14, 15, (245, 245, 250)), ('NAM', 34, 19, (245, 245, 250)), ('ONE', 58, 19, (120, 190, 255))):
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', sz * S) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') else kr(sz * S)
        w = d.textlength(txt, font=f); d.text(((ox + ow / 2) * S - w / 2, y * S), txt, font=f, fill=col)
    out.append(im)
    # 3) AIR FORCE / 대신남 원 / 에어포스
    im, d = plate()
    for txt, y, f, col in (('AIR', 10, ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15 * S), (120, 190, 255)),
                           ('FORCE', 28, ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15 * S), (120, 190, 255)),
                           ('대신남 원', 50, kr(12 * S), (240, 240, 245)), ('에어포스', 66, kr(11 * S), (200, 210, 225))):
        w = d.textlength(txt, font=f); d.text(((ox + ow / 2) * S - w / 2, y * S), txt, font=f, fill=col)
    out.append(im)
    return [o.resize((SW, SH), Image.LANCZOS) for o in out]

# 사용자 디자인 시안(design.png)의 타일: 바깥 배경 없이 타일만 잘라 키에 꽉 차게
DESIGN = os.path.join(HERE, 'design.png')
D_COLS = [(42, 292), (312, 562), (582, 832), (852, 1102), (1121, 1371)]; D_ROWS = [(81, 337), (359, 615), (639, 895)]
D_ORDER = ['prev', 'play', 'next', 'swap', 'mute', 'gps', 'map', 'radio', 'vis', 'all', 'rec', 'day', 'tmap', 'nmap', 'land']
D_SIDE = [(83, 308), (347, 594), (632, 890)]
def design_tiles():
    if not os.path.exists(DESIGN): return {}, None
    src = Image.open(DESIGN).convert('RGB'); out = {}
    for i, a in enumerate(D_ORDER):
        r, c = divmod(i, 5); (x0, x1), (y0, y1) = D_COLS[c], D_ROWS[r]
        t = src.crop((x0, y0, x1, y1)).resize((108, 108), Image.LANCZOS)
        im = Image.new('RGB', (W, H), (30, 32, 22)); im.paste(t, (W - 108, 0)); out[a] = im   # 보이는 곳(오른쪽 위 108×108)에 맞춤
    sides = []
    for y0, y1 in D_SIDE:
        t = src.crop((1396, y0, 1583, y1)).resize((80, 96), Image.LANCZOS)
        im = Image.new('RGB', (88, 104), (30, 32, 22)); im.paste(t, (88 - 80, 0)); sides.append(im)
    return out, sides

def save_jpg(im, path):
    im = im.rotate(90, expand=True)  # 장치가 시계 방향 90°로 보여 주므로 미리 반대로
    im.save(path, 'JPEG', quality=90, optimize=True)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    keys = {}
    dk, dside = design_tiles()
    for a in ACTS:
        keys[a] = dk.get(a) or key_image(a); save_jpg(keys[a], os.path.join(OUT, 'act_%s.jpg' % a))
    sides = dside or side_images()
    for i, im in enumerate(sides): save_jpg(im, os.path.join(OUT, 'side%d.jpg' % (i + 1)))
    # 미리보기: 기본 배치 15키 + 오른쪽 3칸(실제 보이는 부분만)
    order = ['prev', 'play', 'next', 'swap', 'mute', 'gps', 'map', 'radio', 'vis', 'all', 'rec', 'day', 'tmap', 'nmap', 'land']
    pv = Image.new('RGB', (5 * 110 + 110, 3 * 110 + 20), (236, 236, 236))
    for i, a in enumerate(order):
        r, c = divmod(i, 5); pv.paste(keys[a].crop((4, 0, 112, 108)).resize((100, 100)), (15 + c * 110, 15 + r * 110))
    for i, im in enumerate(sides): pv.paste(im.crop((8, 0, 88, 96)), (15 + 5 * 110 + 5, 15 + i * 110))
    pv.save(os.path.join(HERE, 'preview.png'))
    print('ok', len(keys), 'keys +', len(sides), 'side')
