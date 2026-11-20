import math, sys, subprocess, os
from PIL import Image, ImageDraw, ImageFont
from multiprocessing import Pool

W, H = 720, 1280
S = 2
FPS = 30
DUR = 27.9
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fc = {}
def font(sz):
    k = max(2, int(sz * S))
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FB, k)
    return _fc[k]

# scene windows (start, end), speech spans, texts
SC = [
 (0.0, 2.0, 0.06, 1.85, "СЕГОДНЯ В ШКОЛЕ ПОСТАВИЛИ СКАНЕР АУРЫ.", "ВХОД"),
 (2.0, 4.8, 2.14, 4.49, "ОТЛИЧНИК ПРОШЁЛ ПЕРВЫМ. АУРА — НОЛЬ.", "ОТЛИЧНИК"),
 (4.8, 7.8, 5.08, 7.51, "ФИЗРУК РЯВКНУЛ НА ВСЮ ШКОЛУ. АУРА — НОЛЬ.", "ФИЗРУК"),
 (7.8, 11.4, 8.08, 11.13, "ДИРЕКТОР НАДЕЛ ЛУЧШИЙ КОСТЮМ. АУРА — МИНУС СТО.", "ДИРЕКТОР"),
 (11.4, 14.0, 11.66, 13.68, "ДАЖЕ ШКОЛЬНЫЙ КОТ СКАЗАЛ «МЯУ». НОЛЬ.", "КОТ"),
 (14.0, 17.9, 14.25, 17.62, "ВСЕ НАЧАЛИ ДЕЛАТЬ КРУТЫЕ ПОЗЫ. НОЛЬ, НОЛЬ, НОЛЬ.", "ВСЯ ШКОЛА"),
 (17.9, 20.4, 18.11, 20.33, "ТОГДА ВЫШЕЛ ВАНЯ С БУЛКОЙ. СКАНЕР ЗАВИС.", "ВАНЯ"),
 (20.4, 23.1, 20.56, 22.88, "И ПОКАЗАЛ: ОШИБКА. ПРОВЕРЬТЕ РОЗЕТКУ.", "ОШИБКА"),
 (23.1, 27.9, 23.42, 27.67, "ОКАЗАЛОСЬ, СКАНЕР ПРОСТО НЕ БЫЛ ВКЛЮЧЁН. ЗАТО ВАЙФАЙ В ШКОЛЕ — ВСЁ РАВНО НОЛЬ.", "ШКОЛА"),
]
HL = [(255, 214, 64), (255, 110, 160), (120, 230, 130), (110, 200, 255)]

def words_timing(si):
    a0, a1, s0, s1, txt, _ = SC[si]
    ws = txt.split()
    wt = [len(w) + (3 if w[-1] in ".:," else 0) for w in ws]
    tot = sum(wt)
    out = []
    t = s0
    for w, k in zip(ws, wt):
        d = (s1 - s0) * k / tot
        out.append((w, t, t + d))
        t += d
    return out

def groups(ws):
    gs, cur, n = [], [], 0
    for w in ws:
        if cur and (n + len(w) > 17 or len(cur) >= 3):
            gs.append(cur); cur, n = [], 0
        cur.append(w); n += len(w) + 1
        if w[-1] in ".:":
            gs.append(cur); cur, n = [], 0
    if cur: gs.append(cur)
    return gs

# ---------- drawing helpers (logical coords) ----------
def P(v): return v * S
def rect(d, x0, y0, x1, y1, fill, r=0, outline=None, ow=0):
    d.rounded_rectangle([P(x0), P(y0), P(x1), P(y1)], radius=P(r), fill=fill, outline=outline, width=int(P(ow)))
def ell(d, cx, cy, rx, ry, fill, outline=None, ow=0):
    d.ellipse([P(cx - rx), P(cy - ry), P(cx + rx), P(cy + ry)], fill=fill, outline=outline, width=int(P(ow)))
def poly(d, pts, fill):
    d.polygon([(P(x), P(y)) for x, y in pts], fill=fill)
def line(d, x0, y0, x1, y1, fill, w):
    d.line([(P(x0), P(y0)), (P(x1), P(y1))], fill=fill, width=int(P(w)))
    ell(d, x0, y0, w / 2, w / 2, fill); ell(d, x1, y1, w / 2, w / 2, fill)
def text(d, x, y, s, sz, fill, anchor="mm", stroke=0, sf=(0, 0, 0)):
    d.text((P(x), P(y)), s, font=font(sz), fill=fill, anchor=anchor, stroke_width=int(P(stroke)), stroke_fill=sf)

def ease(x):
    x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def pop(lt, d0=0.0, dur=0.25):
    x = (lt - d0) / dur
    if x <= 0: return 0
    if x >= 1: return 1
    return 1 + math.sin(x * math.pi) * 0.25 * (1 - x) if x > 0.7 else ease(x / 0.7) * 1.15

# ---------- character ----------
def person(d, x, fy, h, t, skin=(255, 214, 170), hair=(70, 45, 30), shirt=(60, 120, 220), pants=(40, 50, 90),
           style="spiky", glasses=False, shades=False, tie=None, mood="smile", arm_l="down", arm_r="down",
           bounce=1.0, whistle=False, bun=False, tracksuit=False, phase=0.0):
    u = h / 10.0
    bob = math.sin(t * 6 + phase) * 0.12 * u * bounce
    fy2 = fy + bob
    # legs
    rect(d, x - 1.5 * u, fy2 - 3.2 * u, x - 0.1 * u, fy2, pants, 0.4 * u)
    rect(d, x + 0.1 * u, fy2 - 3.2 * u, x + 1.5 * u, fy2, pants, 0.4 * u)
    rect(d, x - 1.8 * u, fy2 - 0.5 * u, x - 0.05 * u, fy2 + 0.15 * u, (30, 30, 40), 0.3 * u)
    rect(d, x + 0.05 * u, fy2 - 0.5 * u, x + 1.8 * u, fy2 + 0.15 * u, (30, 30, 40), 0.3 * u)
    # torso
    ty0, ty1 = fy2 - 6.4 * u, fy2 - 2.9 * u
    # arms
    def arm(side, mode):
        sx = x + side * 1.75 * u
        sy = ty0 + 0.7 * u
        if mode == "down": ex, ey = sx + side * 0.5 * u, sy + 2.6 * u
        elif mode == "up": ex, ey = sx + side * 1.1 * u, sy - 2.2 * u + math.sin(t * 9) * 0.3 * u
        elif mode == "hip": ex, ey = sx + side * 1.5 * u, sy + 1.4 * u
        elif mode == "hold": ex, ey = x + side * 0.6 * u, sy + 1.8 * u
        elif mode == "point": ex, ey = sx + side * 2.8 * u, sy + 0.3 * u
        elif mode == "shrug": ex, ey = sx + side * 1.6 * u, sy + 0.9 * u + math.sin(t * 7) * 0.2 * u
        else: ex, ey = sx, sy + 2.6 * u
        line(d, sx, sy, ex, ey, shirt, 1.05 * u)
        ell(d, ex, ey, 0.55 * u, 0.55 * u, skin)
    arm(-1, arm_l); arm(1, arm_r)
    rect(d, x - 1.9 * u, ty0, x + 1.9 * u, ty1, shirt, 0.9 * u)
    if tracksuit:
        rect(d, x - 0.12 * u, ty0 + 0.3 * u, x + 0.12 * u, ty1, (255, 255, 255), 0.05 * u)
    if tie:
        poly(d, [(x - 0.3 * u, ty0 + 0.1 * u), (x + 0.3 * u, ty0 + 0.1 * u), (x + 0.45 * u, ty0 + 2.2 * u), (x, ty0 + 2.6 * u), (x - 0.45 * u, ty0 + 2.2 * u)], tie)
        poly(d, [(x - 0.9 * u, ty0), (x, ty0 + 0.9 * u), (x + 0.9 * u, ty0), (x + 0.5 * u, ty0 - 0.1 * u), (x - 0.5 * u, ty0 - 0.1 * u)], (245, 245, 245))
    if whistle:
        line(d, x - 0.6 * u, ty0 + 0.1 * u, x, ty0 + 1.6 * u, (230, 230, 230), 0.14 * u)
        line(d, x + 0.6 * u, ty0 + 0.1 * u, x, ty0 + 1.6 * u, (230, 230, 230), 0.14 * u)
        ell(d, x, ty0 + 1.8 * u, 0.4 * u, 0.3 * u, (240, 200, 60))
    # neck + head
    hy = fy2 - 8.1 * u
    rect(d, x - 0.5 * u, ty0 - 0.6 * u, x + 0.5 * u, ty0 + 0.3 * u, skin)
    hr = 2.0 * u
    # hair behind
    if style == "spiky":
        for i in range(-3, 4):
            ax = x + i * 0.55 * u
            poly(d, [(ax - 0.45 * u, hy - 1.2 * u), (ax + i * 0.25 * u, hy - 3.1 * u + abs(i) * 0.25 * u), (ax + 0.45 * u, hy - 1.2 * u)], hair)
    ell(d, x - hr * 0.97, hy + 0.1 * u, 0.4 * u, 0.55 * u, skin)
    ell(d, x + hr * 0.97, hy + 0.1 * u, 0.4 * u, 0.55 * u, skin)
    ell(d, x, hy, hr, hr * 1.02, skin)
    if style == "spiky" or style == "side":
        ell(d, x, hy - 1.0 * u, hr * 1.0, 0.95 * u, hair)
        ell(d, x, hy - 0.7 * u, hr * 0.95, 0.5 * u, skin)
        poly(d, [(x - hr, hy - 0.8 * u), (x - 0.2 * u, hy - 1.4 * u), (x + hr, hy - 0.6 * u), (x + hr, hy - 1.2 * u), (x, hy - 2.0 * u), (x - hr, hy - 1.2 * u)], hair)
    elif style == "cap":
        ell(d, x, hy - 0.9 * u, hr * 1.02, 1.0 * u, hair)
        rect(d, x - hr * 1.0, hy - 1.0 * u, x + hr * 1.5, hy - 0.5 * u, hair, 0.2 * u)
    elif style == "bun":
        ell(d, x, hy - 2.1 * u, 0.7 * u, 0.7 * u, hair)
        ell(d, x, hy - 0.9 * u, hr * 1.02, 1.0 * u, hair)
    elif style == "bald":
        ell(d, x - hr * 0.9, hy - 0.2 * u, 0.35 * u, 0.7 * u, (200, 200, 200))
        ell(d, x + hr * 0.9, hy - 0.2 * u, 0.35 * u, 0.7 * u, (200, 200, 200))
    elif style == "mohawk":
        for i in range(-2, 3):
            poly(d, [(x + i * 0.4 * u - 0.3 * u, hy - 1.7 * u), (x + i * 0.4 * u, hy - 2.9 * u), (x + i * 0.4 * u + 0.3 * u, hy - 1.7 * u)], hair)
        ell(d, x, hy - 1.2 * u, hr * 0.7, 0.5 * u, hair)
    # face
    ey = hy + 0.15 * u
    if shades:
        rect(d, x - 1.3 * u, ey - 0.4 * u, x - 0.1 * u, ey + 0.4 * u, (20, 20, 25), 0.25 * u)
        rect(d, x + 0.1 * u, ey - 0.4 * u, x + 1.3 * u, ey + 0.4 * u, (20, 20, 25), 0.25 * u)
        line(d, x - 0.1 * u, ey - 0.2 * u, x + 0.1 * u, ey - 0.2 * u, (20, 20, 25), 0.15 * u)
    else:
        blink = (int(t * 1.7 + phase * 3) % 9 == 0) and (t * 1.7 + phase * 3) % 1 < 0.12
        for sx in (-0.65, 0.65):
            if blink:
                line(d, x + sx * u - 0.3 * u, ey, x + sx * u + 0.3 * u, ey, (30, 20, 20), 0.14 * u)
            else:
                ell(d, x + sx * u, ey, 0.38 * u, 0.45 * u, (255, 255, 255), (30, 20, 20), 0.07 * u)
                ell(d, x + sx * u + 0.08 * u, ey + 0.03 * u, 0.2 * u, 0.24 * u, (30, 20, 20))
        if glasses:
            for sx in (-0.65, 0.65):
                ell(d, x + sx * u, ey, 0.55 * u, 0.55 * u, None, (40, 40, 60), 0.12 * u) if False else d.ellipse([P(x + sx * u - 0.55 * u), P(ey - 0.55 * u), P(x + sx * u + 0.55 * u), P(ey + 0.55 * u)], outline=(40, 40, 60), width=int(P(0.12 * u)))
            line(d, x - 0.1 * u, ey, x + 0.1 * u, ey, (40, 40, 60), 0.1 * u)
    my = hy + 1.15 * u
    if mood == "smile":
        d.arc([P(x - 0.7 * u), P(my - 0.6 * u), P(x + 0.7 * u), P(my + 0.35 * u)], 15, 165, fill=(120, 40, 40), width=int(P(0.14 * u)))
    elif mood == "shout":
        mo = 0.35 + 0.25 * abs(math.sin(t * 12))
        ell(d, x, my, 0.6 * u, mo * u, (110, 30, 40)); ell(d, x, my + mo * 0.5 * u, 0.35 * u, mo * 0.4 * u, (230, 100, 110))
    elif mood == "flat":
        line(d, x - 0.5 * u, my, x + 0.5 * u, my, (120, 40, 40), 0.14 * u)
    elif mood == "wow":
        ell(d, x, my, 0.35 * u, 0.45 * u, (110, 30, 40))
    elif mood == "sad":
        d.arc([P(x - 0.6 * u), P(my - 0.1 * u), P(x + 0.6 * u), P(my + 0.7 * u)], 195, 345, fill=(120, 40, 40), width=int(P(0.14 * u)))
    elif mood == "eat":
        ell(d, x, my, 0.45 * u, 0.3 * u + 0.15 * u * abs(math.sin(t * 8)), (110, 30, 40))
    if mood in ("wow", "shout", "flat"):
        line(d, x - 1.15 * u, ey - 0.9 * u, x - 0.3 * u, ey - 0.8 * u, (60, 40, 30), 0.16 * u)
        line(d, x + 0.3 * u, ey - 0.8 * u, x + 1.15 * u, ey - 0.9 * u, (60, 40, 30), 0.16 * u)

def cat(d, x, y, s, t, mouth=False):
    c = (255, 170, 80); dk = (230, 130, 50)
    tail = math.sin(t * 5) * 0.4
    line(d, x + 1.6 * s, y - 0.4 * s, x + 2.6 * s, y - 1.2 * s + tail * s, c, 0.7 * s)
    line(d, x + 2.6 * s, y - 1.2 * s + tail * s, x + 2.4 * s, y - 2.3 * s + tail * s, c, 0.7 * s)
    ell(d, x, y - 0.4 * s, 2.0 * s, 1.5 * s, c)
    ell(d, x - 1.0 * s, y + 0.9 * s, 0.6 * s, 0.35 * s, c); ell(d, x + 1.0 * s, y + 0.9 * s, 0.6 * s, 0.35 * s, c)
    hy = y - 2.1 * s
    poly(d, [(x - 1.5 * s, hy - 0.4 * s), (x - 1.35 * s, hy - 2.0 * s), (x - 0.3 * s, hy - 1.2 * s)], c)
    poly(d, [(x + 1.5 * s, hy - 0.4 * s), (x + 1.35 * s, hy - 2.0 * s), (x + 0.3 * s, hy - 1.2 * s)], c)
    ell(d, x, hy, 1.7 * s, 1.35 * s, c)
    for i in (-1, 1):
        line(d, x + i * 0.5 * s, hy - 1.1 * s, x + i * 0.4 * s, hy - 0.6 * s, dk, 0.2 * s)
        ell(d, x + i * 0.75 * s, hy - 0.1 * s, 0.38 * s, 0.45 * s, (200, 240, 120), (30, 30, 30), 0.06 * s)
        ell(d, x + i * 0.75 * s, hy - 0.1 * s, 0.1 * s, 0.4 * s, (20, 20, 20))
    poly(d, [(x - 0.2 * s, hy + 0.35 * s), (x + 0.2 * s, hy + 0.35 * s), (x, hy + 0.6 * s)], (240, 120, 130))
    if mouth:
        ell(d, x, hy + 0.9 * s, 0.4 * s, 0.35 * s, (120, 30, 40))
    for i in (-1, 1):
        for k in (-0.1, 0.25):
            line(d, x + i * 0.8 * s, hy + 0.55 * s + k * s, x + i * 2.1 * s, hy + 0.35 * s + k * 2 * s, (255, 255, 255), 0.05 * s)

# ---------- scanner ----------
def scanner(d, x, y, t, label, val, col, state="ok", size=1.0, lt=0.0):
    k = size
    # pole & base
    rect(d, x - 18 * k, y + 170 * k, x + 18 * k, y + 520 * k, (120, 130, 150), 8 * k)
    rect(d, x - 90 * k, y + 500 * k, x + 90 * k, y + 540 * k, (90, 100, 120), 14 * k)
    # body
    rect(d, x - 135 * k, y - 20 * k, x + 135 * k, y + 220 * k, (70, 78, 100), 26 * k, (190, 200, 220), 5 * k)
    rect(d, x - 112 * k, y + 4 * k, x + 112 * k, y + 196 * k, (12, 24, 28), 16 * k)
    text(d, x, y + 28 * k, label, 17 * k, (120, 255, 190))
    if state == "busy":
        for i in range(8):
            a = t * 8 + i * math.pi / 4
            r = 6 + 5 * ((i - t * 8) % 8) / 8
            ell(d, x + math.cos(a) * 34 * k, y + 120 * k + math.sin(a) * 34 * k, r * k * 0.8, r * k * 0.8, (120, 255, 190))
    elif state == "err":
        text(d, x, y + 105 * k, "ERROR", 46 * k, (255, 80, 80))
        text(d, x, y + 160 * k, val, 17 * k, (255, 170, 170))
    else:
        text(d, x, y + 112 * k, val, 74 * k if len(val) < 4 else 56 * k, col)
    # lights
    for i, c in enumerate([(255, 90, 90), (255, 210, 70), (110, 230, 120)]):
        on = (state == "err" and i == 0) or (state == "busy" and i == 1) or (state == "ok" and i == 2)
        ell(d, x - 40 * k + i * 40 * k, y - 38 * k, 11 * k, 11 * k, c if on else (60, 60, 70))

# ---------- scenes ----------
def bg_corridor(d, t, wall=(247, 224, 168)):
    rect(d, 0, 0, W, H, wall)
    rect(d, 0, 0, W, 210, (232, 205, 140))
    for i in range(9):
        c = (70 + (i % 2) * 14, 120 + (i % 2) * 10, 190)
        rect(d, i * 82 + 6, 300, i * 82 + 76, 880, c, 6)
        rect(d, i * 82 + 20, 340, i * 82 + 62, 380, (40, 80, 140), 3)
        rect(d, i * 82 + 20, 660, i * 82 + 62, 700, (40, 80, 140), 3)
    rect(d, 0, 880, W, 1000, (236, 210, 150))
    rect(d, 0, 1000, W, H, (172, 118, 78))
    for i in range(-2, 12):
        poly(d, [(i * 90, 1000), (i * 90 + 30, 1000), (i * 90 - 120 + 30, H), (i * 90 - 120, H)], (150, 100, 66))
    rect(d, 0, 996, W, 1010, (120, 80, 52))

def aura_badge(d, x, y, val, lt, col=(255, 90, 90)):
    s = pop(lt)
    if s <= 0.05: return
    w = 70 * s
    rect(d, x - w, y - 34 * s, x + w, y + 34 * s, (20, 24, 40), 16 * s, (255, 214, 64), 4)
    text(d, x, y, val, 38 * s, col)

def scene0(d, t, lt):
    # exterior
    rect(d, 0, 0, W, 760, (150, 210, 255))
    ell(d, 590, 150, 60, 60, (255, 235, 130))
    for cx, cy in ((130, 160), (420, 110)):
        ell(d, cx, cy, 60, 28, (255, 255, 255)); ell(d, cx + 45, cy + 6, 45, 22, (255, 255, 255))
    rect(d, 40, 280, 680, 1010, (196, 92, 74))
    for r in range(2):
        for c in range(5):
            rect(d, 80 + c * 120, 430 + r * 150, 160 + c * 120, 530 + r * 150, (170, 220, 245), 6, (240, 240, 240), 5)
    rect(d, 40, 280, 680, 300, (150, 60, 50))
    rect(d, 140, 320, 580, 395, (40, 70, 130), 14, (255, 255, 255), 5)
    text(d, 360, 357, "ШКОЛА №7", 46, (255, 255, 255))
    rect(d, 1, 1000, W, H, (110, 190, 120))
    rect(d, 0, 1040, W, H, (180, 180, 190))
    rect(d, 270, 640, 450, 1010, (110, 70, 50), 10)
    rect(d, 285, 660, 435, 1010, (60, 40, 35), 8)
    scanner(d, 175, 640, t, "АУРА-СКАНЕР", "100" if lt < 0.9 else "...", (120, 255, 190), "busy" if lt >= 0.9 else "ok", 0.8, lt)
    scanner(d, 175, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy", 0.8, lt) if False else None
    person(d, 540, 1180, 470, t, shirt=(60, 120, 220), style="spiky", hair=(90, 55, 35), mood="smile", arm_r="up", phase=0.5)

def scene1(d, t, lt):
    bg_corridor(d, t)
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "0", (255, 90, 90), "ok", 0.85, lt)
    x = 560 - 210 * ease(lt / 0.7) + 210 * (0)
    person(d, 450 + 250 * (1 - ease(lt / 0.7)), 1190, 500, t, shirt=(120, 180, 120), pants=(70, 70, 100), hair=(40, 30, 25), style="side",
           glasses=True, mood="smile", arm_l="hold", arm_r="hold", phase=1.0)
    aura_badge(d, 450, 590, "АУРА 0", max(0, lt - 0.7), (255, 90, 90))

def scene2(d, t, lt):
    bg_corridor(d, t, (250, 206, 190))
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "0", (255, 90, 90), "ok", 0.85, lt)
    shake = math.sin(t * 40) * 6 if 0.3 < lt < 1.8 else 0
    person(d, 470 + shake, 1190, 520, t, shirt=(220, 60, 60), pants=(220, 60, 60), hair=(60, 40, 30), style="side", mood="shout",
           whistle=True, tracksuit=True, arm_l="hip", arm_r="up", bounce=1.6, phase=2.0)
    if 0.3 < lt < 1.9:
        for i in range(5):
            a = -0.6 + i * 0.3
            line(d, 470 + math.cos(a) * 190, 780 + math.sin(a) * 80 - 40, 470 + math.cos(a) * 250, 780 + math.sin(a) * 110 - 40, (255, 120, 60), 8)
        text(d, 600, 560, "ЭЭЭЭЭЭЙ!", 40, (255, 90, 60), stroke=3, sf=(255, 255, 255))
    aura_badge(d, 470, 580, "АУРА 0", max(0, lt - 1.4), (255, 90, 90))

def scene3(d, t, lt):
    bg_corridor(d, t, (210, 226, 240))
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "-100", (255, 60, 60), "ok", 0.85, lt)
    person(d, 470, 1190, 520, t, shirt=(40, 42, 60), pants=(40, 42, 60), skin=(245, 200, 160), style="bald", tie=(200, 40, 50),
           mood="flat", arm_l="hip", arm_r="hip", bounce=0.4, phase=3.0)
    aura_badge(d, 470, 600, "-100", max(0, lt - 1.6), (255, 60, 60))
    if lt > 1.6:
        for i in range(3):
            ang = i * 0.7 + t * 2
            text(d, 470 + math.cos(ang) * 130, 700 + math.sin(ang) * 20 - 60, "💀" if False else "×", 36, (255, 60, 60))

def scene4(d, t, lt):
    rect(d, 0, 0, W, H, (170, 210, 245))
    rect(d, 80, 140, 640, 760, (255, 255, 255), 20, (200, 160, 110), 18)
    rect(d, 100, 160, 360, 740, (140, 200, 250), 8); rect(d, 380, 160, 620, 740, (140, 200, 250), 8)
    rect(d, 0, 700, W, 790, (190, 130, 85))
    rect(d, 0, 790, W, H, (170, 118, 78))
    scanner(d, 130, 640, t, "АУРА-СКАНЕР", "0", (255, 90, 90), "ok", 0.75, lt)
    cat(d, 470, 700, 62, t, mouth=lt > 0.5 and lt < 1.4)
    if 0.5 < lt < 1.5:
        s = pop(lt, 0.5)
        rect(d, 470 - 110 * s, 300 - 50 * s, 470 + 110 * s, 300 + 50 * s, (255, 255, 255), 24, (40, 40, 40), 4)
        poly(d, [(450, 345), (480, 345), (470, 395)], (255, 255, 255))
        text(d, 470, 300, "МЯУ", 52 * s, (40, 40, 40))
    aura_badge(d, 470, 560, "0", max(0, lt - 1.7), (255, 90, 90))

def scene5(d, t, lt):
    bg_corridor(d, t, (230, 215, 250))
    poses = [(110, (230, 80, 140), "mohawk", "up", "hip"), (270, (70, 180, 120), "cap", "hip", "hip"), (430, (250, 170, 50), "bun", "up", "down"), (590, (90, 90, 220), "spiky", "hip", "up")]
    for i, (x, sh, hs, al, ar) in enumerate(poses):
        k = ease((lt - i * 0.35) / 0.4)
        person(d, x, 1210, 400, t, shirt=sh, pants=(50, 50, 80), hair=(40, 30, 30) if hs != "bun" else (200, 120, 60), style=hs, shades=True,
               mood="flat", arm_l=al, arm_r=ar, bounce=0.6, phase=i)
        aura_badge(d, x, 780 - 30 * (1 - k), "0", max(0, lt - 0.4 - i * 0.55), (255, 90, 90))

def scene6(d, t, lt):
    bg_corridor(d, t)
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy" if lt > 0.6 else "ok", 0.85, lt)
    person(d, 470, 1190, 520, t, shirt=(60, 120, 220), hair=(90, 55, 35), style="spiky", mood="eat", arm_l="hold", arm_r="hold", phase=0.5)
    # bun
    ell(d, 470, 1190 - 520 * 0.45, 48, 34, (235, 180, 100)); ell(d, 470, 1190 - 520 * 0.45 - 12, 40, 18, (250, 205, 140))
    for i in range(3):
        ex = 330 + i * 60 + math.sin(t * 3 + i) * 6
        text(d, ex, 560 - (lt * 40 + i * 25) % 90, "?", 40, (255, 100, 100)) if lt > 0.6 else None

def scene7(d, t, lt):
    bg_corridor(d, t, (250, 215, 215))
    scanner(d, 360, 330, t, "АУРА-СКАНЕР", "ПРОВЕРЬТЕ РОЗЕТКУ", (255, 120, 120), "err", 1.25, lt)
    for i in range(4):
        a = t * 14 + i
        ell(d, 360 + math.sin(a) * 6, 250, 0, 0, (0, 0, 0))
    person(d, 160, 1200, 430, t, shirt=(60, 120, 220), hair=(90, 55, 35), style="spiky", mood="wow", arm_r="point", arm_l="down", phase=0.5)
    # cable
    line(d, 360, 880, 450, 1000, (30, 30, 30), 8)
    poly(d, [(450, 990), (520, 1010), (500, 1040), (440, 1020)], (30, 30, 30))
    text(d, 360, 1100, "!", 60, (255, 90, 90)) if int(t * 4) % 2 else None

def scene8(d, t, lt):
    rect(d, 0, 0, W, H, (214, 236, 245))
    rect(d, 0, 900, W, H, (172, 118, 78))
    # socket
    rect(d, 530, 760, 640, 880, (255, 255, 255), 14, (180, 180, 180), 5)
    for dy in (800, 840):
        pass
    ell(d, 568, 820, 8, 8, (50, 50, 50)); ell(d, 602, 820, 8, 8, (50, 50, 50))
    # unplugged cable animation
    plugx = 480 - 20 * math.sin(lt * 2) if lt > 1.0 else 480
    line(d, 360, 1000, plugx - 20, 960, (30, 30, 30), 8)
    rect(d, plugx - 30, 940, plugx + 10, 980, (30, 30, 30), 6)
    scanner(d, 200, 500, t, "АУРА-СКАНЕР", "OFF", (120, 120, 120), "ok", 0.9, lt)
    # wifi on wall
    cx, cy = 570, 430
    for r in (110, 70, 30):
        d.arc([P(cx - r), P(cy - r), P(cx + r), P(cy + r)], 225, 315, fill=(180, 180, 190), width=int(P(14)))
    ell(d, cx, cy + 6, 10, 10, (180, 180, 190))
    text(d, cx, cy + 90, "Wi-Fi: 0", 36, (230, 70, 70)) if True else None
    # cross
    line(d, cx - 60, cy - 90, cx + 60, cy + 30, (230, 70, 70), 12) if lt > 1.5 else None
    person(d, 360, 1200, 430, t, shirt=(60, 120, 220), hair=(90, 55, 35), style="spiky", mood="sad" if lt > 0.8 else "wow", arm_l="shrug", arm_r="shrug", phase=0.5)

SCENES = [scene0, scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8]

# ---------- HUD & subtitles ----------
def hud(d, t, si):
    rect(d, 90, 36, 630, 140, (18, 24, 48), 26, (255, 205, 70), 4)
    rect(d, 106, 52, 168, 124, (255, 205, 70), 14)
    text(d, 137, 88, "АУРА", 15, (18, 24, 48))
    text(d, 320, 62, "АУРА-СКАНЕР · ШКОЛА №7", 14, (150, 170, 220), "mm")
    text(d, 320, 98, SC[si][5], 34, (255, 255, 255))
    speaking = SC[si][2] <= t <= SC[si][3]
    for i in range(9):
        hgt = 10 + (22 * abs(math.sin(t * 14 + i * 1.3)) if speaking else 0)
        rect(d, 540 + i * 9, 88 - hgt / 2, 546 + i * 9, 88 + hgt / 2, (120, 255, 190), 2)

def subs(d, t, si):
    ws = words_timing(si)
    gs = groups([w for w, _, _ in ws])
    idx = 0; gi_of = []
    for gi, g in enumerate(gs):
        for _ in g: gi_of.append(gi)
    cur = None
    for i, (w, a, b) in enumerate(ws):
        if t >= a - 0.02: cur = i
    if cur is None: return
    gi = gi_of[cur]
    g = gs[gi]
    first = gi_of.index(gi)
    sz = 56
    f = font(sz)
    sp = 16 * S
    widths = [f.getlength(w) for w in g]
    total = sum(widths) + sp * (len(g) - 1)
    # wrap into one line if fits else two lines
    maxw = (W - 60) * S
    lines_ = [[(w, first + j) for j, w in enumerate(g)]]
    if total > maxw:
        half = (len(g) + 1) // 2
        lines_ = [[(w, first + j) for j, w in enumerate(g[:half])], [(w, first + half + j) for j, w in enumerate(g[half:])]]
    yy = 215 - (len(lines_) - 1) * 0
    for ln in lines_:
        tw = sum(f.getlength(w) for w, _ in ln) + sp * (len(ln) - 1)
        x = W * S / 2 - tw / 2
        for w, wi in ln:
            col = HL[wi % len(HL)] if wi == cur else (255, 255, 255)
            lt = t - ws[wi][1]
            sc = 1.0
            d.text((x, yy * S), w, font=f, fill=col, anchor="lm", stroke_width=int(7 * S / 2), stroke_fill=(15, 15, 30))
            x += f.getlength(w) + sp
        yy += 76

def frame(n):
    t = n / FPS
    si = 0
    for i, s in enumerate(SC):
        if s[0] <= t < s[1]: si = i
    lt = t - SC[si][0]
    img = Image.new("RGB", (W * S, H * S), (255, 255, 255))
    d = ImageDraw.Draw(img)
    SCENES[si](d, t, lt)
    hud(d, t, si)
    subs(d, t, si)
    # Ken Burns zoom
    z = 1.0 + 0.05 * min(1, lt / (SC[si][1] - SC[si][0]))
    cw, ch = W * S / z, H * S / z
    x0, y0 = (W * S - cw) / 2, (H * S - ch) / 2
    img = img.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)) if False else img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.LANCZOS)
    return img.tobytes()

if __name__ == "__main__":
    out = sys.argv[1]
    total = int(DUR * FPS)
    if len(sys.argv) > 2:
        for k in sys.argv[2:]:
            n = int(float(k) * FPS)
            Image.frombytes("RGB", (W, H), frame(n)).save(f"/home/user/Project/video/work/f_{k}.png")
        sys.exit()
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for b in pool.imap(frame, range(total), chunksize=4):
            p.stdin.write(b)
    p.stdin.close(); p.wait()
