# Синтез звуков серии 1 (всё создано этим скриптом: бесплатно, без чужих сэмплов, лицензия CC0)
import numpy as np, subprocess, wave, sys
sr = 44100; DUR = 90.0; N = int(DUR * sr)
rng = np.random.default_rng(7)
t = np.arange(N) / sr
def wn(n): return rng.standard_normal(n)
def bp(x, lo, hi, order=4):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi: m *= 1 / (1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * m, len(x))
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def lin(a, b, T, n=None):
    return np.interp(T, [a, b], [0, 1], left=0, right=1)
def ramp(T, pts):  # кусочно-линейная огибающая
    xs, ys = zip(*pts); return np.interp(T, xs, ys)
track = {k: np.zeros(N) for k in ['bed', 'rain', 'sfx']}
def place(name, sig, t0, g=1.0):
    i = int(t0 * sr); j = min(N, i + len(sig))
    if i < N and j > i: track[name][i:j] += sig[:j - i] * g
def tt(d): return np.arange(int(d * sr)) / sr
# ---------- фон: тихий ровный мрачный дрон ----------
bed = np.zeros(N)
for f, a, ph in [(55.0, 1.0, 0), (55.35, .8, 1.3), (82.41, .5, .7), (65.41, .35, 2.1), (110.2, .22, 3.0), (130.8, .12, 4.0)]:
    lfo = .75 + .25 * np.sin(2 * np.pi * (.045 + .01 * ph) * t + ph)
    bed += a * lfo * np.sin(2 * np.pi * f * t + ph)
air = bp(wn(N), 90, 600); air *= .25 * (.7 + .3 * np.sin(2 * np.pi * .06 * t))
bed += air
# к концу — лёгкое нарастание тревоги
bed *= ramp(t, [(0, .8), (70, 1.0), (85.3, 1.3), (88.2, .2), (90, 0)])
bed *= ramp(t, [(0, 0), (1.2, 1), (88, 1), (89.6, 0)])
track['bed'] = bed
# ---------- дождь ----------
rain = bp(wn(N), 1500, 9000) + .5 * bp(wn(N), 300, 1200)
rain *= (.75 + .25 * np.sin(2 * np.pi * .13 * t + 1))
rain *= ramp(t, [(0, 0), (.6, 1), (31.4, 1), (32.2, .22), (38.5, .22), (39.3, 1), (70.4, 1), (71.4, 0), (90, 0)])
track['rain'] = rain
# ---------- эффекты ----------
def S(*a):
    n = max(len(x) for x in a); o = np.zeros(n)
    for x in a: o[:len(x)] += x
    return o
def thump(f=80, d=.2, a=1.0, nz=.4):
    T = tt(d); return a * (np.sin(2 * np.pi * f * T * (1 - .25 * T / d)) * np.exp(-T * 18) + nz * norm(bp(wn(len(T)), 60, 600)) * np.exp(-T * 30))
def click(a=1.0, f0=2000, f1=9000):
    T = tt(.04); return a * norm(bp(wn(len(T)), f0, f1)) * np.exp(-T * 150)
def beep(f, d, a=1.0):
    T = tt(d); e = np.minimum(1, T / .004) * np.minimum(1, (d - T) / .006); return a * np.sin(2 * np.pi * f * T) * e
def hum(f, d, a=1.0, harm=6):
    T = tt(d); y = sum(np.sin(2 * np.pi * f * k * T + k) / k for k in range(1, harm + 1)); return a * y
def noisebp(d, lo, hi, a=1.0, dec=None):
    T = tt(d); y = norm(bp(wn(len(T)), lo, hi)) * a
    return y * (np.exp(-T * dec) if dec else np.minimum(1, T / .03) * np.minimum(1, (d - T) / .08))
def step_concrete(a=1.0): return S(thump(72, .16, a, .7), .5 * a * noisebp(.1, 400, 2200, 1, 45))
def step_tile(a=1.0): return S(.6 * a * noisebp(.1, 1200, 4500, 1, 55), .5 * a * thump(170, .1, 1, .1))
def step_soft(a=1.0): return S(.8 * a * thump(95, .14, 1, .3), .3 * a * noisebp(.08, 200, 1200, 1, 60))
def heartbeat(a=1.0):
    out = np.zeros(int(.45 * sr)); a1 = thump(50, .2, a, .1); out[:len(a1)] += a1
    a2 = thump(44, .22, .7 * a, .1); i = int(.19 * sr); m = min(len(a2), len(out) - i); out[i:i + m] += a2[:m]
    return out
# ритмы
for tb in np.arange(5.7, 11.5, 1.05): place('sfx', heartbeat(1.0), tb, 1.0 * np.interp(tb, [5.7, 8, 11.5], [.5, 1, .2]))   # сердце в тишине
for tb in [7.92, 8.42, 8.9]: place('sfx', heartbeat(1.2), tb)
place('sfx', S(thump(38, .5, 1.6, .2), noisebp(.3, 80, 400, .5, 14)), 5.56)                         # дом погас
mains = hum(50, 5.6, .5, 8) * np.minimum(1, tt(5.6) / .5) ; place('sfx', mains, 0, .35)         # сетевой гул до отключения
for tb in np.arange(9.4, 17.2, 2.3): place('sfx', noisebp(.5, 500, 2500, .5) * 0.0 + noisebp(.5, 250, 1400, .6, 7), tb, .45)   # аппарат дышит
for k, tb in enumerate([17.95, 18.1, 18.28]): place('sfx', S(beep([1209, 697, 1336][k], .08, .5), beep([697, 770, 852][k], .08, .5)), tb, .5)  # набор 103
for k, tb in enumerate([19.0, 19.25, 19.5]): place('sfx', beep([440, 370, 311][k], .2, .6), tb, .55)                                         # нет сети
place('sfx', noisebp(.6, 1000, 7000, .7, 6), 21.84, .6)                                            # вышки умерли: треск
for tb in [20.4, 20.8, 21.2]: place('sfx', beep(900, .05, .5), tb, .25)
# генератор у Петровича
g = hum(48, 8.6, .5, 10) * ramp(tt(8.6), [(0, 0), (1.2, 1), (3.6, 1), (4.2, .7), (8.6, .7)]); g = bp(g, 0, 600) * 1.2 if False else g
place('sfx', g * .6, 28.3)
place('sfx', 0 * g[:10], 0)
for tb, a in [(37.88, 1), (38.1, .8), (38.3, .6), (38.6, .35)]: place('sfx', thump(42, .25, a, .5), tb, 1.0)       # генератор глохнет
# скрип двери
d = tt(.9); f = 150 + 70 * np.sin(2 * np.pi * 2.4 * d) + 60 * d; ph = np.cumsum(2 * np.pi * f / sr)
cr = np.sign(np.sin(ph)) * .5 + np.sin(ph); cr = bp(cr * (.6 + .4 * norm(bp(wn(len(d)), 5, 40))), 250, 2200) * np.minimum(1, d / .1) * np.minimum(1, (.9 - d) / .2)
place('sfx', norm(cr), 31.95, .7)
place('sfx', noisebp(.4, 1500, 6500, .5), 34.55, .6)                                              # сумка шуршит
# лестница: шаги
for tb in np.arange(42.6, 46.9, np.pi / 9.5): place('sfx', step_concrete(1.0), tb, 1.0)
place('sfx', click(1.0, 1500, 6000), 43.6, .9)                                                     # фонарик щёлк
fb = np.interp(np.arange(int(2.6 * sr)) / sr, [0, .3, 2.6], [0, 1, 1]) * bp(hum(120, 2.6, 1, 3) * (np.sign(np.sin(2 * np.pi * 14 * tt(2.6))) * .5 + .5), 80, 3000)
place('sfx', fb, 45.6, .2)                                                                          # дрожащая лампа
place('sfx', click(1.2, 1200, 6000), 48.24, 1.0); place('sfx', beep(2300, .03, .3), 48.27, .5)    # погас
# топливо
T = tt(2.4); gl = norm(bp(wn(len(T)), 250, 1800)) * (.5 + .5 * np.sin(2 * np.pi * (8 + 6 * np.sin(2 * np.pi * .6 * T)) * T)) ** 2
place('sfx', gl * ramp(T, [(0, 0), (.3, 1), (2.0, 1), (2.4, 0)]), 49.4, .9)
for tb in [51.8, 52.0, 52.15]: place('sfx', S(thump(520, .05, .6, 0) * .5, noisebp(.05, 2000, 6000, .4, 80)), tb, .4)  # капли
# трасса: ветер и шаги
w = norm(bp(wn(int(7 * sr)), 120, 700)) * ramp(tt(7), [(0, 0), (1.2, 1), (5.5, 1), (7, 0)]) * (.7 + .3 * np.sin(2 * np.pi * .35 * tt(7)))
place('sfx', w, 52.2, .9)
for tb in np.arange(52.5, 56.4, .42): place('sfx', step_soft(1.0), tb, .8 * np.interp(tb, [52.5, 56.4], [1, .5]))
place('sfx', noisebp(.5, 300, 2500, .5), 54.8, .5)                                                # двое: шорох
place('sfx', S(beep(430, .5, .6) * np.exp(-tt(.5) * 9), beep(710, .4, .4) * np.exp(-tt(.4) * 11), noisebp(.35, 800, 5000, .6, 12)), 57.12, .9)  # канистра
for tb in np.arange(57.7, 58.5, .38): place('sfx', step_soft(.8), tb, .5 * np.interp(tb, [57.7, 58.5], [1, .3]))
for tb in np.arange(58.9, 61.7, 1.0): place('sfx', click(.9, 800, 3500), tb, .6); place('sfx', thump(100, .08, .5, 0), tb, .3)   # тик-так
place('sfx', click(1.0, 1500, 7000), 63.28, .8)                                                    # блок
for tb in [64.05, 64.35]: place('sfx', beep(210, .2, .8), tb, .6)                                  # пустой
sw = hum(58, 4.2, 1, 4) * ramp(tt(4.2), [(0, 0), (2.2, 1), (4.2, .6)]); place('sfx', sw, 64.9, .5)  # свет впереди
# больница
place('sfx', hum(41, 4.8, 1, 6) * ramp(tt(4.8), [(0, 0), (1, 1), (4.8, 1)]), 67.0, .55)
fl = hum(100, 17.5, 1, 4) * (.8 + .2 * np.sign(np.sin(2 * np.pi * 7 * tt(17.5)))) * ramp(tt(17.5), [(0, 0), (1, 1), (9.6, 1), (10.4, .3), (17.5, .2)])
place('sfx', fl, 71.0, .22)                                                                         # лампы коридора
for tb in np.arange(71.2, 80.6, .95): place('sfx', beep(1000, .09, .8), tb, .38)                    # монитор
for tb in np.arange(78.3, 80.35, np.pi / 8): place('sfx', step_tile(1.0), tb, .9)                   # шаги врача
place('sfx', S(click(1.3, 1000, 5000), noisebp(.3, 600, 3500, .5)), 80.54, 1.0)                       # вилка
place('sfx', beep(1000, 1.82, 1.0), 80.58, .3)                                                      # плоская линия
place('sfx', click(.9, 1000, 4500), 82.42, .6)
sw2 = hum(46, 5.2, 1, 5) * ramp(tt(5.2), [(0, 0), (1.8, 1), (3.6, .8), (5.2, 0)]); place('sfx', sw2, 83.4, .55)   # финальное напряжение
for tb in np.arange(85.7, 88.2, .9): place('sfx', heartbeat(1.0), tb, .8)
# ---------- запись стемов ----------
def save(name, x):
    x = np.clip(x, -1, 1)
    with wave.open(f'stem_{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype('<i2').tobytes())
for k, v in track.items():
    v = v[:N]; v = v / (np.max(np.abs(v)) + 1e-9) * .5; save(k, v)
print('stems ok')
