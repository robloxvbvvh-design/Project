import math, sys, subprocess, os
import numpy as np
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
    if k not in _fc: _fc[k] = ImageFont.truetype(FB, k)
    return _fc[k]

# (a0, a1, speech0, speech1, text, hud name)
SC = [
 (0.0, 2.0, 0.06, 1.85, "СЕГОДНЯ В ШКОЛЕ ПОСТАВИЛИ СКАНЕР АУРЫ.", "ВХОД"),
 (2.0, 4.8, 2.14, 4.49, "ОТЛИЧНИК ПРОШЁЛ ПЕРВЫМ. АУРА — НОЛЬ.", "ОТЛИЧНИК"),
 (4.8, 7.8, 5.08, 7.51, "ФИЗРУК РЯВКНУЛ НА ВСЮ ШКОЛУ. АУРА — НОЛЬ.", "ФИЗРУК"),
 (7.8, 11.4, 8.08, 11.13, "ДИРЕКТОР НАДЕЛ ЛУЧШИЙ КОСТЮМ. АУРА — МИНУС СТО.", "ДИРЕКТОР"),
 (11.4, 14.0, 11.66, 13.68, "ДАЖЕ ШКОЛЬНЫЙ КОТ СКАЗАЛ «МЯУ». НОЛЬ.", "КОТ"),
 (14.0, 17.9, 14.25, 17.62, "ВСЕ НАЧАЛИ ДЕЛАТЬ КРУТЫЕ ПОЗЫ. НОЛЬ, НОЛЬ, НОЛЬ.", "ВСЯ ШКОЛА"),
 (17.9, 20.4, 18.11, 20.33, "ТОГДА ВЫШЕЛ ВАНЯ С БУЛКОЙ. СКАНЕР ЗАВИС.", "ВАНЯ"),
 (20.4, 23.1, 20.56, 22.88, "И ПОКАЗАЛ: ОШИБКА. ПРОВЕРЬТЕ РОЗЕТКУ.", "СКАНЕР"),
 (23.1, 27.9, 23.42, 27.67, "ОКАЗАЛОСЬ, СКАНЕР ПРОСТО НЕ БЫЛ ВКЛЮЧЁН. ЗАТО ВАЙФАЙ В ШКОЛЕ — ВСЁ РАВНО НОЛЬ.", "ШКОЛА"),
]
HL = [(255, 214, 64), (255, 110, 170), (110, 230, 130), (100, 200, 255)]

def words_timing(si):
    a0, a1, s0, s1, txt, _ = SC[si]
    ws = txt.split()
    wt = [len(w) + (3 if w[-1] in ".:," else 0) for w in ws]
    tot = sum(wt); out = []; t = s0
    for w, k in zip(ws, wt):
        dd = (s1 - s0) * k / tot
        out.append((w, t, t + dd)); t += dd
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

# ---------- helpers ----------
def P(v): return v * S
def mix(a, b, k): return tuple(int(a[i] * (1 - k) + b[i] * k) for i in range(3))
def dk(c, k=0.2): return mix(c, (0, 0, 20), k)
def lt_(c, k=0.25): return mix(c, (255, 255, 255), k)
def rect(d, x0, y0, x1, y1, fill, r=0, outline=None, ow=0):
    d.rounded_rectangle([P(x0), P(y0), P(x1), P(y1)], radius=max(0, P(r)), fill=fill, outline=outline, width=int(P(ow)))
def ell(d, cx, cy, rx, ry, fill, outline=None, ow=0):
    d.ellipse([P(cx - rx), P(cy - ry), P(cx + rx), P(cy + ry)], fill=fill, outline=outline, width=int(P(ow)))
def poly(d, pts, fill):
    d.polygon([(P(x), P(y)) for x, y in pts], fill=fill)
def line(d, x0, y0, x1, y1, fill, w):
    d.line([(P(x0), P(y0)), (P(x1), P(y1))], fill=fill, width=max(1, int(P(w))))
    ell(d, x0, y0, w / 2, w / 2, fill); ell(d, x1, y1, w / 2, w / 2, fill)
def text(d, x, y, s, sz, fill, anchor="mm", shadow=False):
    if shadow:
        d.text((P(x), P(y + sz * 0.07)), s, font=font(sz), fill=(10, 10, 30), anchor=anchor)
    d.text((P(x), P(y)), s, font=font(sz), fill=fill, anchor=anchor)
def ease(x):
    x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def pop(lt, d0=0.0, dur=0.3):
    x = (lt - d0) / dur
    if x <= 0: return 0
    if x >= 1: return 1
    return 1 + 0.22 * math.sin(x * math.pi) if x > 0.5 else ease(x / 0.5) * 1.0 + 0.0 * x

_gc = {}
def gradient(top, bot):
    k = (top, bot)
    if k not in _gc:
        a = np.linspace(0, 1, H * S)[:, None]
        arr = (np.array(top)[None, None, :] * (1 - a[:, :, None]) + np.array(bot)[None, None, :] * a[:, :, None])
        arr = np.repeat(arr, W * S, axis=1).astype(np.uint8)
        _gc[k] = Image.fromarray(arr)
    return _gc[k]
def bg(img, top, bot):
    img.paste(gradient(top, bot), (0, 0))

def glow(d, cx, cy, r, col, steps=8):
    for i in range(steps, 0, -1):
        k = i / steps
        ell(d, cx, cy, r * k, r * k, mix(col, (255, 255, 255), 0.12 * (1 - k)) if False else col) if False else None

# ---------- character ----------
def eye(d, ex, ey, u, look=(0.0, 0.0), lid=0.0):
    ell(d, ex, ey, 0.62 * u, 0.7 * u, (255, 255, 255), (60, 40, 40), 0.05 * u)
    px, py = ex + look[0] * 0.22 * u, ey + look[1] * 0.22 * u
    ell(d, px, py, 0.27 * u, 0.3 * u, (35, 25, 25))
    ell(d, px - 0.08 * u, py - 0.1 * u, 0.09 * u, 0.09 * u, (255, 255, 255))
    if lid > 0:
        rect(d, ex - 0.66 * u, ey - 0.75 * u, ex + 0.66 * u, ey - 0.75 * u + 1.4 * u * lid, (0, 0, 0, 0), 0) if False else None

def person(d, x, fy, h, t, skin=(244, 192, 150), hair=(112, 62, 40), shirt=(60, 120, 220), pants=(34, 42, 84),
           style="spiky", glasses=False, shades=False, tie=None, mood="smile", arm_l="down", arm_r="down",
           bounce=1.0, whistle=False, tracksuit=False, phase=0.0, look=(0.0, 0.0), paw=False, shadow=True):
    u = h / 10.0
    bob = math.sin(t * 6 + phase) * 0.10 * u * bounce
    fy2 = fy + bob
    sd = dk(shirt, 0.18)
    # legs (thin) + sneakers
    for sx in (-1, 1):
        lx = x + sx * 0.8 * u
        rect(d, lx - 0.42 * u, fy2 - 3.5 * u, lx + 0.42 * u, fy2 - 0.4 * u, pants, 0.25 * u)
        rect(d, lx - 0.75 * u, fy2 - 0.55 * u, lx + 0.75 * u, fy2 + 0.1 * u, (240, 240, 245), 0.3 * u)
        rect(d, lx - 0.75 * u, fy2 - 0.12 * u, lx + 0.75 * u, fy2 + 0.1 * u, (150, 220, 90), 0.1 * u)
    ty0, ty1 = fy2 - 6.5 * u, fy2 - 3.1 * u
    def arm(side, mode):
        sx = x + side * 1.85 * u; sy = ty0 + 0.8 * u
        if mode == "down": ex, ey = sx + side * 0.35 * u, sy + 2.8 * u
        elif mode == "up": ex, ey = sx + side * 1.0 * u, sy - 2.2 * u + math.sin(t * 9) * 0.3 * u
        elif mode == "hip": ex, ey = sx + side * 1.4 * u, sy + 1.6 * u
        elif mode == "hold": ex, ey = x + side * 0.7 * u, sy + 1.9 * u
        elif mode == "point": ex, ey = sx + side * 3.2 * u, sy + 0.4 * u
        elif mode == "shrug": ex, ey = sx + side * 1.7 * u, sy + 1.0 * u + math.sin(t * 7) * 0.2 * u
        else: ex, ey = sx, sy + 2.8 * u
        line(d, sx, sy, ex, ey, shirt, 0.72 * u)
        ell(d, ex, ey, 0.5 * u, 0.5 * u, skin)
    arm(-1, arm_l); arm(1, arm_r)
    # torso: wide, rounded, hem band
    rect(d, x - 2.05 * u, ty0, x + 2.05 * u, ty1, shirt, 1.0 * u)
    rect(d, x + 0.9 * u, ty0 + 0.3 * u, x + 2.05 * u, ty1, sd, 1.0 * u)
    rect(d, x - 2.05 * u, ty0 + 0.3 * u, x + 1.2 * u, ty1, shirt, 1.0 * u)
    rect(d, x - 1.7 * u, ty1 - 0.45 * u, x + 1.7 * u, ty1, dk(pants, 0.0), 0.2 * u)
    d.arc([P(x - 0.95 * u), P(ty0 - 0.5 * u), P(x + 0.95 * u), P(ty0 + 0.9 * u)], 20, 160, fill=lt_(shirt, 0.55), width=int(P(0.14 * u)))
    if paw:
        cx, cy = x, ty0 + 2.0 * u
        ell(d, cx, cy + 0.25 * u, 0.85 * u, 0.7 * u, (250, 250, 250))
        for ox, oy, r in ((-1.0, -0.55, 0.3), (-0.35, -0.95, 0.32), (0.35, -0.95, 0.32), (1.0, -0.55, 0.3)):
            ell(d, cx + ox * u, cy + oy * u, r * u, r * 1.2 * u, (250, 250, 250))
    if tracksuit:
        rect(d, x - 0.1 * u, ty0 + 0.4 * u, x + 0.1 * u, ty1 - 0.4 * u, (255, 255, 255), 0.05 * u)
    if tie:
        poly(d, [(x - 0.3 * u, ty0 + 0.1 * u), (x + 0.3 * u, ty0 + 0.1 * u), (x + 0.45 * u, ty0 + 2.2 * u), (x, ty0 + 2.6 * u), (x - 0.45 * u, ty0 + 2.2 * u)], tie)
        poly(d, [(x - 0.9 * u, ty0), (x, ty0 + 0.9 * u), (x + 0.9 * u, ty0), (x + 0.5 * u, ty0 - 0.1 * u), (x - 0.5 * u, ty0 - 0.1 * u)], (245, 245, 250))
    if whistle:
        line(d, x - 0.6 * u, ty0 + 0.1 * u, x, ty0 + 1.6 * u, (230, 230, 230), 0.14 * u)
        line(d, x + 0.6 * u, ty0 + 0.1 * u, x, ty0 + 1.6 * u, (230, 230, 230), 0.14 * u)
        ell(d, x, ty0 + 1.8 * u, 0.4 * u, 0.3 * u, (240, 200, 60))
    hy = fy2 - 8.25 * u
    hr = 1.95 * u
    # hair behind (spikes)
    if style == "spiky":
        for i, (dx, hh, lean) in enumerate(((-1.5, 1.6, -0.5), (-0.9, 2.3, -0.3), (-0.2, 2.6, 0.1), (0.5, 2.4, 0.4), (1.1, 2.0, 0.6), (1.6, 1.3, 0.5))):
            bx = x + dx * u
            poly(d, [(bx - 0.5 * u, hy - 1.0 * u), (bx + lean * u, hy - (1.0 + hh) * u), (bx + 0.5 * u, hy - 1.0 * u)], hair)
    # ears
    for sx in (-1, 1):
        ell(d, x + sx * hr * 0.98, hy + 0.25 * u, 0.42 * u, 0.5 * u, dk(skin, 0.08))
    ell(d, x, hy, hr, hr * 1.02, skin)
    if style in ("spiky", "side"):
        ell(d, x, hy - 1.0 * u, hr * 1.0, 0.95 * u, hair)
        ell(d, x, hy - 0.6 * u, hr * 0.92, 0.5 * u, skin)
        poly(d, [(x - hr, hy - 0.8 * u), (x - 0.3 * u, hy - 1.4 * u), (x + hr, hy - 0.6 * u), (x + hr, hy - 1.2 * u), (x, hy - 2.0 * u), (x - hr, hy - 1.2 * u)], hair)
        if style == "spiky":
            line(d, x - 0.9 * u, hy - 2.7 * u, x - 0.7 * u, hy - 3.1 * u, (200, 150, 100), 0.12 * u)
            line(d, x + 0.1 * u, hy - 3.2 * u, x + 0.2 * u, hy - 3.5 * u, (200, 150, 100), 0.12 * u)
    elif style == "bald":
        ell(d, x - hr * 0.9, hy - 0.3 * u, 0.35 * u, 0.7 * u, (215, 215, 220))
        ell(d, x + hr * 0.9, hy - 0.3 * u, 0.35 * u, 0.7 * u, (215, 215, 220))
    elif style == "cap":
        ell(d, x, hy - 0.9 * u, hr * 1.02, 1.0 * u, hair)
        rect(d, x - hr, hy - 1.0 * u, x + hr * 1.5, hy - 0.5 * u, dk(hair, 0.2), 0.2 * u)
    elif style == "bun":
        ell(d, x, hy - 2.1 * u, 0.7 * u, 0.7 * u, hair)
        ell(d, x, hy - 0.9 * u, hr * 1.02, 1.0 * u, hair)
    elif style == "mohawk":
        for i in range(-2, 3):
            poly(d, [(x + i * 0.4 * u - 0.3 * u, hy - 1.7 * u), (x + i * 0.4 * u, hy - 2.9 * u), (x + i * 0.4 * u + 0.3 * u, hy - 1.7 * u)], hair)
        ell(d, x, hy - 1.2 * u, hr * 0.7, 0.5 * u, hair)
    ey = hy + 0.05 * u
    if shades:
        rect(d, x - 1.3 * u, ey - 0.4 * u, x - 0.08 * u, ey + 0.45 * u, (20, 20, 30), 0.3 * u)
        rect(d, x + 0.08 * u, ey - 0.4 * u, x + 1.3 * u, ey + 0.45 * u, (20, 20, 30), 0.3 * u)
        line(d, x - 0.1 * u, ey - 0.2 * u, x + 0.1 * u, ey - 0.2 * u, (20, 20, 30), 0.15 * u)
    else:
        for sx in (-0.55, 0.55):
            ell(d, x + sx * u, ey, 0.5 * u, 0.55 * u, (255, 255, 255))
            ell(d, x + sx * u + look[0] * 0.22 * u, ey + look[1] * 0.2 * u, 0.17 * u, 0.19 * u, (25, 20, 20))
        if glasses:
            for sx in (-0.55, 0.55):
                d.ellipse([P(x + sx * u - 0.62 * u), P(ey - 0.66 * u), P(x + sx * u + 0.62 * u), P(ey + 0.66 * u)], outline=(40, 40, 70), width=int(P(0.1 * u)))
            line(d, x - 0.02 * u, ey, x + 0.02 * u, ey, (40, 40, 70), 0.1 * u)
    my = hy + 1.15 * u
    mc = (140, 70, 60)
    if mood == "smile":
        d.arc([P(x - 0.65 * u), P(my - 0.55 * u), P(x + 0.65 * u), P(my + 0.3 * u)], 20, 160, fill=mc, width=int(P(0.1 * u)))
    elif mood == "shout":
        mo = 0.4 + 0.22 * abs(math.sin(t * 12))
        ell(d, x, my, 0.65 * u, mo * u, (120, 40, 50)); ell(d, x, my + mo * 0.55 * u, 0.4 * u, mo * 0.35 * u, (235, 110, 120))
    elif mood == "flat":
        line(d, x - 0.5 * u, my, x + 0.5 * u, my, mc, 0.12 * u)
    elif mood == "wow":
        ell(d, x, my, 0.2 * u, 0.3 * u, (120, 40, 50))
    elif mood == "sad":
        d.arc([P(x - 0.6 * u), P(my - 0.1 * u), P(x + 0.6 * u), P(my + 0.7 * u)], 200, 340, fill=mc, width=int(P(0.12 * u)))
        line(d, x - 1.1 * u, ey - 0.85 * u, x - 0.3 * u, ey - 0.7 * u, (70, 45, 35), 0.12 * u)
        line(d, x + 0.3 * u, ey - 0.7 * u, x + 1.1 * u, ey - 0.85 * u, (70, 45, 35), 0.12 * u)
    elif mood == "eat":
        ell(d, x, my, 0.4 * u, 0.25 * u + 0.14 * u * abs(math.sin(t * 8)), (120, 40, 50))
    if mood in ("shout", "flat"):
        line(d, x - 1.2 * u, ey - 0.95 * u, x - 0.25 * u, ey - 0.75 * u, (70, 45, 35), 0.14 * u)
        line(d, x + 0.25 * u, ey - 0.75 * u, x + 1.2 * u, ey - 0.95 * u, (70, 45, 35), 0.14 * u)

def cat(d, x, y, s, t, mouth=False):
    c = (255, 168, 75); dkc = (226, 124, 45)
    tail = math.sin(t * 5) * 0.4
    line(d, x + 1.6 * s, y - 0.4 * s, x + 2.6 * s, y - 1.2 * s + tail * s, c, 0.7 * s)
    line(d, x + 2.6 * s, y - 1.2 * s + tail * s, x + 2.4 * s, y - 2.3 * s + tail * s, c, 0.7 * s)
    ell(d, x, y - 0.4 * s, 2.0 * s, 1.5 * s, c)
    ell(d, x + 0.4 * s, y - 0.1 * s, 1.5 * s, 1.1 * s, lt_(c, 0.45))
    ell(d, x - 1.0 * s, y + 0.9 * s, 0.6 * s, 0.35 * s, c); ell(d, x + 1.0 * s, y + 0.9 * s, 0.6 * s, 0.35 * s, c)
    hy = y - 2.1 * s
    poly(d, [(x - 1.5 * s, hy - 0.4 * s), (x - 1.35 * s, hy - 2.0 * s), (x - 0.3 * s, hy - 1.2 * s)], c)
    poly(d, [(x + 1.5 * s, hy - 0.4 * s), (x + 1.35 * s, hy - 2.0 * s), (x + 0.3 * s, hy - 1.2 * s)], c)
    poly(d, [(x - 1.35 * s, hy - 0.7 * s), (x - 1.28 * s, hy - 1.6 * s), (x - 0.7 * s, hy - 1.1 * s)], (255, 150, 160))
    poly(d, [(x + 1.35 * s, hy - 0.7 * s), (x + 1.28 * s, hy - 1.6 * s), (x + 0.7 * s, hy - 1.1 * s)], (255, 150, 160))
    ell(d, x, hy, 1.7 * s, 1.35 * s, c)
    for i in (-1, 1):
        line(d, x + i * 0.5 * s, hy - 1.1 * s, x + i * 0.4 * s, hy - 0.6 * s, dkc, 0.2 * s)
        ell(d, x + i * 0.75 * s, hy - 0.1 * s, 0.4 * s, 0.48 * s, (205, 245, 120), (30, 30, 30), 0.06 * s)
        ell(d, x + i * 0.75 * s, hy - 0.1 * s, 0.1 * s, 0.42 * s, (20, 20, 20))
    poly(d, [(x - 0.2 * s, hy + 0.35 * s), (x + 0.2 * s, hy + 0.35 * s), (x, hy + 0.6 * s)], (240, 120, 130))
    if mouth:
        ell(d, x, hy + 0.95 * s, 0.45 * s, 0.38 * s, (120, 30, 45))
    for i in (-1, 1):
        for k in (-0.1, 0.25):
            line(d, x + i * 0.8 * s, hy + 0.55 * s + k * s, x + i * 2.1 * s, hy + 0.35 * s + k * 2 * s, (255, 255, 255), 0.06 * s)

# ---------- scanner ----------
def scanner(d, x, y, t, label, val, col, state="ok", size=1.0):
    k = size
    rect(d, x - 18 * k, y + 170 * k, x + 18 * k, y + 520 * k, (120, 130, 155), 8 * k)
    rect(d, x - 90 * k, y + 500 * k, x + 90 * k, y + 540 * k, (90, 100, 125), 14 * k)
    rect(d, x - 135 * k, y - 20 * k, x + 135 * k, y + 220 * k, (62, 70, 98), 26 * k, (200, 210, 235), 5 * k)
    rect(d, x - 135 * k, y + 150 * k, x + 135 * k, y + 220 * k, (50, 58, 84), 26 * k)
    rect(d, x - 112 * k, y + 4 * k, x + 112 * k, y + 196 * k, (10, 24, 30), 16 * k)
    for i in range(0, 190, 8):
        line(d, x - 108 * k, y + (6 + i) * k, x + 108 * k, y + (6 + i) * k, (14, 32, 40), 1 * k)
    text(d, x, y + 28 * k, label, 17 * k, (120, 255, 190))
    if state == "busy":
        for i in range(8):
            a = t * 8 + i * math.pi / 4
            r = 6 + 5 * ((i - t * 8) % 8) / 8
            ell(d, x + math.cos(a) * 34 * k, y + 120 * k + math.sin(a) * 34 * k, r * k * 0.8, r * k * 0.8, (120, 255, 190))
    elif state == "err":
        text(d, x, y + 100 * k, "ERROR", 46 * k, (255, 80, 80))
        text(d, x, y + 158 * k, val, 17 * k, (255, 170, 170))
    else:
        text(d, x, y + 112 * k, val, 74 * k if len(val) < 4 else 54 * k, col)
    for i, c in enumerate([(255, 90, 90), (255, 210, 70), (110, 230, 120)]):
        on = (state == "err" and i == 0) or (state == "busy" and i == 1) or (state == "ok" and i == 2)
        ell(d, x - 40 * k + i * 40 * k, y - 38 * k, 11 * k, 11 * k, c if on else (60, 60, 75))
        if on: ell(d, x - 40 * k + i * 40 * k, y - 38 * k, 17 * k, 17 * k, None, mix(c, (255, 255, 255), 0.2), 2)

def badge(d, x, y, val, lt, col=(255, 90, 90), size=1.0):
    s = pop(lt) * size
    if s <= 0.05: return
    w = 78 * s
    rect(d, x - w, y - 40 * s, x + w, y + 40 * s, (18, 22, 48), 20 * s, (255, 210, 70), 5 * s)
    text(d, x, y, val, 44 * s, col)

def beam(d, x0, x1, ya, yb, t):
    y = ya + (yb - ya) * ((t * 1.4) % 1)
    rect(d, x0, y - 5, x1, y + 5, (140, 255, 200), 5)
    for i in range(1, 6):
        rect(d, x0, y - 5 - i * 9, x1, y - i * 9 + 4, mix((140, 255, 200), (255, 255, 255), 0.0) if False else (130 - i * 8, 235 - i * 10, 190 - i * 8))

# ---------- backgrounds ----------
def bg_hall(img, d, t, top=(255, 232, 168), bot=(196, 140, 92), lock=(70, 120, 195)):
    bg(img, top, mix(top, (255, 200, 120), 0.4))
    for i in range(9):
        c = mix(lock, (255, 255, 255), 0.06 * (i % 2))
        rect(d, i * 82 + 6, 300, i * 82 + 76, 880, c, 6)
        rect(d, i * 82 + 6, 300, i * 82 + 24, 880, lt_(c, 0.18), 6)
        rect(d, i * 82 + 24, 345, i * 82 + 62, 380, dk(c, 0.3), 3)
        rect(d, i * 82 + 24, 660, i * 82 + 62, 695, dk(c, 0.3), 3)
    rect(d, 0, 880, W, 1000, mix(top, (255, 255, 255), 0.2))
    rect(d, 0, 1000, W, H, bot)
    for i in range(-2, 12):
        poly(d, [(i * 90, 1000), (i * 90 + 30, 1000), (i * 90 - 130 + 30, H), (i * 90 - 130, H)], dk(bot, 0.1))
    rect(d, 0, 994, W, 1010, dk(bot, 0.3))
    # light shafts

def bg_room(img, d, top, bot, accent):
    bg(img, top, bot)
    rect(d, 0, 140, W, 150, accent)
    rect(d, 0, 1060, W, H, dk(bot, 0.35))
    for x in (60, 480):
        rect(d, x, 280, x + 180, 520, dk(top, 0.3), 10, (230, 190, 90), 6)
    for i, c in enumerate([(255, 180, 50), (50, 200, 255), (255, 90, 160), (60, 200, 110)]):
        rect(d, 420 + i * 52, 300, 460 + i * 52, 390, c, 4)

# ---------- shots ----------
def cu_person(d, t, lt, **kw):
    person(d, 360, 1520 + kw.pop("dy", 0), 1250, t, **kw)

def sh_ext(img, d, t, lt):
    bg(img, (140, 205, 255), (205, 235, 255))
    ell(d, 590, 170, 70, 70, (255, 240, 150)); ell(d, 590, 170, 100, 100, None, (255, 245, 190), 3)
    for cx, cy in ((130, 190), (420, 130)):
        ell(d, cx, cy, 70, 30, (255, 255, 255)); ell(d, cx + 50, cy + 8, 50, 24, (255, 255, 255))
    rect(d, 40, 290, 680, 1010, (200, 96, 78))
    rect(d, 40, 290, 360, 1010, (190, 88, 72))
    for r in range(2):
        for c in range(5):
            rect(d, 80 + c * 120, 440 + r * 150, 160 + c * 120, 540 + r * 150, (175, 225, 250), 6, (245, 245, 245), 5)
            rect(d, 80 + c * 120, 440 + r * 150, 160 + c * 120, 470 + r * 150, (205, 240, 255), 6)
    rect(d, 40, 280, 680, 310, (150, 60, 52))
    rect(d, 140, 330, 580, 405, (40, 70, 135), 14, (255, 255, 255), 5)
    text(d, 360, 368, "ШКОЛА №7", 46, (255, 255, 255))
    rect(d, 0, 1000, W, H, (112, 192, 122)); rect(d, 0, 1050, W, H, (186, 186, 198))
    rect(d, 270, 640, 450, 1010, (115, 72, 52), 10); rect(d, 285, 660, 435, 1010, (62, 42, 38), 8)
    scanner(d, 175, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy" if lt >= 0.8 else "ok", 0.8)
    if lt < 0.8:
        pass
    person(d, 540, 1185, 480, t, shirt=(228, 160, 30), style="spiky", hair=(112, 62, 40), paw=True, mood="smile", arm_r="up", phase=0.5, look=(-1, 0))

def sh_nerd_wide(img, d, t, lt):
    bg_hall(img, d, t)
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy", 0.85)
    person(d, 450 + 250 * (1 - ease(lt / 0.9)), 1190, 500, t, shirt=(120, 190, 130), pants=(70, 70, 105), hair=(40, 30, 25), style="side",
           glasses=True, mood="smile", arm_l="hold", arm_r="hold", phase=1.0, look=(-1, 0))

def sh_nerd_cu(img, d, t, lt):
    bg_room(img, d, (96, 70, 170), (60, 40, 120), (255, 105, 180))
    cu_person(d, t, lt, shirt=(120, 190, 130), hair=(40, 30, 25), style="side", glasses=True, mood="smile" if lt < 0.8 else "flat", phase=1.0, look=(1, -0.3))
    if lt < 0.8: beam(d, 100, 620, 250, 800, t * 2)
    badge(d, 360, 190, "АУРА 0", max(0, lt - 0.7), (255, 90, 90), 1.5)

def sh_pe_wide(img, d, t, lt):
    bg_hall(img, d, t, (255, 214, 200), (170, 120, 90), (200, 70, 80))
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy", 0.85)
    shake = math.sin(t * 40) * 5 if lt > 0.2 else 0
    person(d, 470 + shake, 1190, 520, t, shirt=(220, 60, 60), pants=(200, 50, 55), hair=(60, 40, 30), style="side", mood="shout",
           whistle=True, tracksuit=True, arm_l="hip", arm_r="up", bounce=1.6, phase=2.0)
    if lt > 0.2:
        for i in range(5):
            a = -0.7 + i * 0.35
            line(d, 470 + math.cos(a) * 200, 790 + math.sin(a) * 90 - 60, 470 + math.cos(a) * 270, 790 + math.sin(a) * 120 - 60, (255, 120, 60), 8)
        text(d, 600, 520, "ЭЭЭЭЙ!", 44, (255, 90, 60), shadow=True)

def sh_pe_cu(img, d, t, lt):
    bg_room(img, d, (210, 60, 70), (140, 30, 50), (255, 190, 70))
    shake = math.sin(t * 45) * 7 if lt < 1.0 else 0
    cu_person(d, t, lt, shirt=(220, 60, 60), pants=(200, 50, 55), hair=(60, 40, 30), style="side", mood="shout", whistle=True,
              tracksuit=True, bounce=2.0, phase=2.0, look=(0, 0))
    if lt < 1.0:
        for i in range(7):
            a = math.pi + (i - 3) * 0.25
            line(d, 360 + math.cos(a) * 330 + 0, 520 + math.sin(a) * 300 + 40, 360 + math.cos(a) * 420, 520 + math.sin(a) * 380 + 40, (255, 210, 90), 10)
    badge(d, 360, 150, "0", max(0, lt - 1.0), (255, 90, 90), 1.6)

def sh_dir_wide(img, d, t, lt):
    bg_hall(img, d, t, (214, 230, 245), (150, 120, 100), (60, 90, 150))
    scanner(d, 150, 640, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy", 0.85)
    person(d, 470, 1190, 520, t, shirt=(40, 44, 66), pants=(40, 44, 66), skin=(245, 200, 160), style="bald", tie=(205, 40, 52),
           mood="flat", arm_l="hip", arm_r="hip", bounce=0.4, phase=3.0, look=(-1, 0))

def sh_scanner_cu(img, d, t, lt):
    flash = 0.5 + 0.5 * math.sin(t * 10)
    bg_room(img, d, mix((60, 10, 20), (150, 20, 40), flash), (40, 6, 16), (255, 60, 70))
    shake = math.sin(t * 50) * 5
    scanner(d, 360 + shake, 200, t, "АУРА-СКАНЕР", "-100", (255, 60, 60), "ok", 2.2)
    text(d, 360, 1000, "АУРА ПАДАЕТ!", 54, (255, 120, 120), shadow=True) if int(t * 4) % 2 == 0 else None

def sh_cat_cu(img, d, t, lt):
    bg(img, (150, 205, 250), (210, 235, 255))
    rect(d, 70, 130, 650, 800, (255, 255, 255), 20, (206, 164, 112), 20)
    rect(d, 92, 152, 355, 778, (135, 195, 250), 8); rect(d, 365, 152, 628, 778, (135, 195, 250), 8)
    rect(d, 120, 560, 190, 778, (190, 205, 225)); rect(d, 520, 480, 590, 778, (170, 190, 215))
    rect(d, 0, 760, W, 840, (200, 140, 92)); rect(d, 0, 840, W, H, (176, 120, 80))
    cat(d, 360, 860, 105, t, mouth=0.35 < lt < 1.2)
    if 0.35 < lt < 1.4:
        s = pop(lt, 0.35)
        rect(d, 360 - 130 * s, 330 - 60 * s, 360 + 130 * s, 330 + 60 * s, (255, 255, 255), 28 * s, (40, 40, 60), 5)
        poly(d, [(330, 385), (375, 385), (350, 440)], (255, 255, 255))
        text(d, 360, 330, "МЯУ", 62 * s, (40, 40, 60))

def sh_cat_scan(img, d, t, lt):
    bg(img, (150, 205, 250), (210, 235, 255))
    rect(d, 0, 760, W, 840, (200, 140, 92)); rect(d, 0, 840, W, H, (176, 120, 80))
    scanner(d, 170, 330, t, "АУРА-СКАНЕР", "0", (255, 90, 90), "ok", 1.0)
    cat(d, 500, 900, 85, t)
    badge(d, 500, 520, "0", lt, (255, 90, 90), 1.5)

def sh_group(img, d, t, lt):
    bg_hall(img, d, t, (232, 216, 255), (150, 110, 140), (110, 80, 190))
    poses = [(110, (232, 80, 142), "mohawk", "up", "hip"), (270, (70, 182, 122), "cap", "hip", "hip"), (430, (250, 172, 52), "bun", "up", "down"), (590, (92, 92, 222), "spiky", "hip", "up")]
    for i, (x, sh, hs, al, ar) in enumerate(poses):
        k = ease((lt - i * 0.3) / 0.35)
        person(d, x, 1230 + 60 * (1 - k), 400, t, shirt=sh, pants=(50, 50, 82), hair=(40, 30, 30) if hs != "bun" else (205, 125, 62), style=hs, shades=True,
               mood="flat", arm_l=al, arm_r=ar, bounce=0.7, phase=i)
        badge(d, x, 760 - 20 * (1 - k), "0", max(0, lt - 0.4 - i * 0.4), (255, 90, 90), 0.9)

def sh_shades_cu(img, d, t, lt):
    bg_room(img, d, (90, 60, 170), (55, 35, 120), (110, 230, 255))
    cu_person(d, t, lt, shirt=(92, 92, 222), hair=(40, 30, 30), style="spiky", shades=True, mood="flat", arm_r="up", phase=1.0)
    for i in range(3):
        badge(d, 130 + i * 230, 230 + (i % 2) * 70, "0", max(0, lt - 0.1 - i * 0.35), (255, 90, 90), 1.15)

def sh_bun_cu(img, d, t, lt):
    bg_room(img, d, (60, 120, 210), (36, 70, 150), (255, 210, 70))
    cu_person(d, t, lt, shirt=(228, 160, 30), hair=(112, 62, 40), style="spiky", paw=True, mood="eat", arm_l="hold", arm_r="hold", phase=0.5, look=(0, 1))
    bx, by = 360, 1520 - 1250 * 0.52
    ell(d, bx, by, 150, 100, (232, 174, 96)); ell(d, bx, by - 30, 130, 55, (250, 206, 142))
    for i in range(4):
        ell(d, bx - 60 + i * 40, by - 40 + (i % 2) * 10, 6, 4, (255, 245, 220))

def sh_scan_freeze(img, d, t, lt):
    bg_room(img, d, (30, 40, 70), (15, 20, 40), (255, 210, 70))
    scanner(d, 360, 200, t, "АУРА-СКАНЕР", "...", (120, 255, 190), "busy", 2.2)
    for i in range(3):
        text(d, 150 + i * 210, 920 - ((lt * 80 + i * 40) % 120), "?", 90, (255, 214, 64))

def sh_error_cu(img, d, t, lt):
    flash = 0.5 + 0.5 * math.sin(t * 12)
    bg_room(img, d, mix((70, 8, 14), (160, 18, 34), flash), (35, 5, 12), (255, 60, 70))
    shake = math.sin(t * 55) * 6 if lt < 0.7 else 0
    scanner(d, 360 + shake, 200, t, "АУРА-СКАНЕР", "ПРОВЕРЬТЕ РОЗЕТКУ", (255, 120, 120), "err", 2.2)
    text(d, 360, 1000, "!", 120, (255, 90, 90)) if int(t * 5) % 2 == 0 else None

def sh_cable(img, d, t, lt):
    bg_hall(img, d, t, (250, 226, 226), (170, 120, 90), (80, 110, 180))
    rect(d, 520, 760, 650, 900, (255, 255, 255), 16, (190, 190, 200), 5)
    ell(d, 568, 825, 9, 9, (50, 50, 50)); ell(d, 602, 825, 9, 9, (50, 50, 50))
    scanner(d, 200, 520, t, "АУРА-СКАНЕР", "OFF", (130, 130, 140), "err" if False else "ok", 0.95)
    line(d, 215, 1060, 430, 1070, (30, 30, 30), 9)
    rect(d, 430, 1050, 485, 1090, (30, 30, 30), 8)
    person(d, 420, 1190, 460, t, shirt=(228, 160, 30), hair=(112, 62, 40), style="spiky", paw=True, mood="wow", arm_r="point", arm_l="down", phase=0.5, look=(1, 1))
    text(d, 530, 960, "ЗДЕСЬ!", 40, (255, 100, 100), shadow=True) if int(t * 4) % 2 == 0 else None

def sh_plug(img, d, t, lt):
    bg_hall(img, d, t, (250, 226, 226), (170, 120, 90), (80, 110, 180))
    rect(d, 520, 760, 650, 900, (255, 255, 255), 16, (190, 190, 200), 5)
    ell(d, 568, 825, 9, 9, (50, 50, 50)); ell(d, 602, 825, 9, 9, (50, 50, 50))
    k = ease((lt - 0.2) / 0.9)
    on = lt > 1.1
    scanner(d, 200, 520, t, "АУРА-СКАНЕР", "100" if on else "OFF", (120, 255, 190) if on else (130, 130, 140), "ok", 0.95)
    px = 430 + (500 - 430) * k
    py = 1070 + (830 - 1070) * k
    line(d, 215, 1060, px - 10, py + 6, (30, 30, 30), 9)
    rect(d, px - 20, py - 20, px + 25, py + 20, (30, 30, 30), 8)
    person(d, 420, 1190, 460, t, shirt=(228, 160, 30), hair=(112, 62, 40), style="spiky", paw=True, mood="smile" if on else "flat", arm_r="up" if k < 1 else "down", arm_l="down", phase=0.5, look=(1, -0.5))
    if on:
        for i in range(8):
            a = i * math.pi / 4 + t * 2
            ell(d, 200 + math.cos(a) * 200, 520 + math.sin(a) * 140, 7, 7, (255, 230, 100))

def sh_wifi(img, d, t, lt):
    bg(img, (30, 50, 100), (18, 28, 64))
    rect(d, 0, 140, W, 150, (110, 230, 255))
    cx, cy = 360, 300
    for r, c in ((250, (95, 105, 130)), (170, (95, 105, 130)), (90, (95, 105, 130))):
        d.arc([P(cx - r), P(cy - r + 80), P(cx + r), P(cy + r + 80)], 225, 315, fill=c, width=int(P(34)))
    ell(d, cx, cy + 90, 22, 22, (95, 105, 130))
    s = pop(lt, 0.2)
    if s > 0.05:
        line(d, cx - 190 * s, cy - 130 * s, cx + 190 * s, cy + 170 * s, (240, 70, 80), 30)
    text(d, 360, 560, "Wi-Fi: 0", 80, (255, 100, 110), shadow=True)
    person(d, 360, 1400, 520, t, shirt=(228, 160, 30), hair=(112, 62, 40), style="spiky", paw=True, mood="sad", arm_l="shrug", arm_r="shrug", phase=0.5)

SHOTS = [
 (0.0, 2.0, sh_ext), (2.0, 3.4, sh_nerd_wide), (3.4, 4.8, sh_nerd_cu),
 (4.8, 6.4, sh_pe_wide), (6.4, 7.8, sh_pe_cu),
 (7.8, 9.6, sh_dir_wide), (9.6, 11.4, sh_scanner_cu),
 (11.4, 13.0, sh_cat_cu), (13.0, 14.0, sh_cat_scan),
 (14.0, 16.2, sh_group), (16.2, 17.9, sh_shades_cu),
 (17.9, 19.2, sh_bun_cu), (19.2, 20.4, sh_scan_freeze),
 (20.4, 21.8, sh_error_cu), (21.8, 23.1, sh_cable),
 (23.1, 25.3, sh_plug), (25.3, 27.9, sh_wifi),
]

# ---------- HUD & subtitles ----------
def hud(d, t, si):
    rect(d, 100, 38, 620, 136, (22, 28, 52), 24, (255, 205, 70), 4)
    rect(d, 120, 56, 186, 118, (255, 205, 70), 16)
    # icon: scanner glyph
    rect(d, 140, 66, 166, 92, (22, 28, 52), 6)
    ell(d, 153, 79, 6, 6, (120, 255, 190))
    rect(d, 150, 92, 156, 106, (22, 28, 52))
    rect(d, 142, 106, 164, 110, (22, 28, 52), 2)
    cx_ = 206
    for ch_ in "АУРА-СКАНЕР":
        text(d, cx_, 64, ch_, 14, (255, 205, 70), "lm"); cx_ += font(14).getlength(ch_) / S + 3.2
    text(d, 206, 102, SC[si][5], 36, (255, 255, 255), "lm")
    speaking = SC[si][2] <= t <= SC[si][3]
    for i in range(9):
        if speaking:
            hgt = 8 + 44 * abs(math.sin(t * 13 + i * 1.7)) * (0.5 + 0.5 * math.sin(i * 0.9 + 1))
            rect(d, 508 + i * 11, 87 - hgt / 2, 514 + i * 11, 87 + hgt / 2, (60, 235, 130), 2)
        else:
            rect(d, 508 + i * 11, 84, 514 + i * 11, 90, (60, 235, 130), 1)

def subs(d, t, si):
    ws = words_timing(si)
    gs = groups([w for w, _, _ in ws])
    gi_of = []
    for gi, g in enumerate(gs):
        for _ in g: gi_of.append(gi)
    cur = None
    for i, (w, a, b) in enumerate(ws):
        if t >= a - 0.02: cur = i
    if cur is None: return
    gi = gi_of[cur]; g = gs[gi]; first = gi_of.index(gi)
    f = font(64); sp = 18 * S
    total = sum(f.getlength(w) for w in g) + sp * (len(g) - 1)
    maxw = (W - 50) * S
    lines_ = [[(w, first + j) for j, w in enumerate(g)]]
    if total > maxw:
        half = (len(g) + 1) // 2
        lines_ = [[(w, first + j) for j, w in enumerate(g[:half])], [(w, first + half + j) for j, w in enumerate(g[half:])]]
    yy = 770
    for ln in lines_:
        tw = sum(f.getlength(w) for w, _ in ln) + sp * (len(ln) - 1)
        x = W * S / 2 - tw / 2
        for w, wi in ln:
            col = HL[wi % len(HL)] if wi == cur else (255, 255, 255)
            for off in ((0, 4), (0, 8), (3, 6), (-3, 6), (0, 11)):
                d.text((x + off[0] * S / 2, yy * S + off[1] * S / 2), w, font=f, fill=(8, 10, 30, 70), anchor="lm")
            d.text((x, yy * S), w, font=f, fill=col + (255,), anchor="lm")
            x += f.getlength(w) + sp
        yy += 84

_vig = None
def vignette():
    global _vig
    if _vig is None:
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
        _vig = (1 - 0.12 * np.clip((r - 0.55) / 0.9, 0, 1) ** 1.5)[:, :, None]
    return _vig

def frame(n):
    t = n / FPS
    si = 0
    for i, s in enumerate(SC):
        if s[0] <= t < s[1]: si = i
    shot = SHOTS[0]
    for sh in SHOTS:
        if sh[0] <= t < sh[1]: shot = sh
    lt = t - shot[0]
    img = Image.new("RGB", (W * S, H * S), (255, 255, 255))
    d = ImageDraw.Draw(img)
    shot[2](img, d, t, lt)
    z = 1.0 + 0.05 * min(1, lt / (shot[1] - shot[0]))
    cw, ch = W * S / z, H * S / z
    x0, y0 = (W * S - cw) / 2 + math.sin(t * 1.3) * 5, (H * S - ch) / 2 + math.cos(t * 1.1) * 5
    img = img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W * S, H * S), Image.BICUBIC)
    ov = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    hud(od, t, si)
    subs(od, t, si)
    img = img.convert("RGBA"); img.alpha_composite(ov)
    img = img.convert("RGB").resize((W, H), Image.LANCZOS)
    arr = np.asarray(img).astype(np.float32) * vignette()
    return arr.astype(np.uint8).tobytes()

if __name__ == "__main__":
    out = sys.argv[1]
    total = int(DUR * FPS)
    if len(sys.argv) > 2:
        for k in sys.argv[2:]:
            Image.frombytes("RGB", (W, H), frame(int(float(k) * FPS))).save(f"/home/user/Project/video/work/g_{k}.png")
        sys.exit()
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for b in pool.imap(frame, range(total), chunksize=4):
            p.stdin.write(b)
    p.stdin.close(); p.wait()
