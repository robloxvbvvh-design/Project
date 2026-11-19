// ===== БЛЭКАУТ, серия 1 — анимация. renderFrame(t) рисует кадр на момент t (секунды) =====
const TOTAL = 89.6;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const E = (t, a, b) => ease(seg(t, a, b));

// ---- кэш статичных кусков ----
const BG = {}; for (const k in bgs) BG[k] = bgs[k]();
const CHR = {}; for (const k in chars) CHR[k] = chars[k]();
const CX = { denis: 130, miha: 100, petrovich: 110, thugs: 120, doctor: 110, oldman: 130 };

// ---- помощники рисования (координаты панели 270x480) ----
const D = a => `<rect width="270" height="480" fill="#02030a" opacity="${a.toFixed(3)}"/>`;
function R(t, n, seed, op = .32, sp = 360, slant = .22, clip = false) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x0 = r() * 300 - 20, y0 = r() * 520, l = 9 + r() * 12;
    const y = ((y0 + t * sp * (0.8 + r() * .4)) % 520) - 20, x = x0 - y * slant * .0 - (t * sp * slant * .5) % 320;
    o += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - l * slant).toFixed(1)}" y2="${(y + l).toFixed(1)}" stroke="#a9bfd8" stroke-opacity="${op}" stroke-width="1.1"/>`;
  }
  return clip ? `<g clip-path="url(#winclip)">${o}</g>` : o;
}
function CH(n, x, y, s, o = {}) {
  const fl = o.flip ? -1 : 1, br = o.breath != null ? 1 + 0.012 * Math.sin(o.breath) : 1;
  let str = CHR[n];
  if (n === 'denis' && o.light != null) str = str.replace('opacity=".18"', `opacity="${(.18 * o.light).toFixed(3)}"`).replace('opacity=".7"', `opacity="${(.7 * o.light).toFixed(3)}"`);
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${o.rot || 0}) scale(${fl * s} ${(s * br).toFixed(4)}) translate(${-CX[n]} -403)" ${o.op != null ? `opacity="${o.op}"` : ''}>${str}${o.extra || ''}</g>`;
}
function reachPose(kind, x, y, s, o, side, T, e, bend) {
  const base = { ...o }; delete base.armR; delete base.armL;
  const rest = handW(kind, x, y, s, base, side);
  return { to: [lerp(rest[0], T[0], e), lerp(rest[1], T[1], e)], bend: bend || 1 };
}
const pct = t => t < 9.2 ? 31 : t < 61.7 ? lerp(31, 10, (t - 9.2) / 52.5) : lerp(10, 6, seg(t, 61.7, 88.8));
const P3 = t => Math.round(pct(t));
const txt = (s, x, y, size, fill, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="bold" fill="${fill}" text-anchor="${o.anchor || 'middle'}" ${o.op != null ? `opacity="${o.op.toFixed(3)}"` : ''} ${o.tr ? `transform="${o.tr}"` : ''}>${s}</text>`;
const mihaBed = t => `<g><circle cx="46" cy="333" r="13" fill="${P.skinPale}"/><path d="M33 331 q2 -14 14 -13 q11 1 13 11 q-9 -6 -27 2z" fill="#1b1612"/>
 <path d="M40 334 h5 M50 334 h5" stroke="#2a1d17" stroke-width="1.6"/>
 <g transform="translate(0 ${(-0.7 * Math.sin(t * 2.2)).toFixed(2)})"><path d="M58 346 q40 -16 112 -4 v30 h-112z" fill="#5a6b86"/></g>
 <path d="M46 340 q40 24 100 4 t52 6" stroke="#9fd6e8" stroke-width="1.4" fill="none"/></g>`;
function crit(t, a, b) { return t >= a && t < b; }
function light(t, a, b, seed) { // мигающий свет 0..1
  const k = Math.sin(t * 37 + seed) * Math.sin(t * 23.7 + seed * 2);
  return clamp(.55 + .6 * k, 0, 1) * (t > a && t < b ? 1 : 1);
}

// ---- сцены ----
// каждая возвращает {g, cam, top?}. u — прогресс сцены 0..1
const S = [];
function add(t0, t1, fn) { S.push({ t0, t1, fn }); }

// 0. Крючок
add(0, 3.55, (t, u) => ({
  g: BG.flat + D(.42) + R(t, 34, 3, .3, 340, .22, true),
  cam: { z: lerp(1.0, 1.8, E(t, 0, 3.55)), cx: lerp(135, 190, u), cy: lerp(240, 330, u) },
  top: `<g opacity="${(E(t, .1, .7) * (1 - E(t, 2.9, 3.5))).toFixed(3)}"><text x="540" y="1010" font-size="380" font-weight="bold" fill="${P.green}" text-anchor="middle" filter="url(#glow)" opacity=".7" transform="translate(0 0)">31%</text>
  <text x="540" y="1010" font-size="380" font-weight="bold" fill="${P.green}" text-anchor="middle" transform="translate(540 0) scale(${(1 + .02 * Math.sin(t * 5)).toFixed(3)}) translate(-540 0)">31%</text></g>`
}));
// 1. 02:40 — дом гаснет
add(3.55, 9.2, (t, u) => {
  const off = t >= 5.6;
  let amb = off ? 0 : 1; if (t > 4.9 && t < 5.6) amb = Math.sin(t * 60) > 0 ? 1 : .3;
  const pun = [7.92, 8.42, 8.9].reduce((s, b) => s + (t > b ? Math.exp(-(t - b) * 8) * .05 : 0), 0);
  return {
    g: BG.flat + mihaBed(t) + RG('denis', 70, 402, .62, { breath: t * 2, headRot: 6 * Math.sin(t * .9) }) +
      `<ellipse cx="135" cy="90" rx="150" ry="170" fill="url(#warm)" opacity="${(.28 * amb).toFixed(3)}"/>` +
      D(off ? .5 + .04 * Math.sin(t * 3) : .18) + R(t, 40, 5, .3, 340, .22, true),
    cam: { z: 1.05 + .3 * E(t, 3.55, 9.2) + pun, cx: lerp(135, 120, u), cy: lerp(240, 190, u) }
  };
});
// 2. Девятый этаж, Миха, заряд
add(9.2, 17.35, (t, u) => {
  const o2 = { breath: t * 2.2, headRot: 5 * Math.sin(t * .8) }; o2.armR = reachPose('denis', 150, 402, .62, o2, 'R', [221, 338], E(t, 12.6, 13.2) * (1 - E(t, 15.0, 15.6)));
  const a3 = E(t, 14.4, 14.8) * (1 - E(t, 16.4, 16.8)), a5 = E(t, 16.0, 16.4);
  return {
    g: BG.flat + mihaBed(t) + RG('denis', 150, 402, .62, o2) + D(.5) + R(t, 40, 6, .3, 340, .22, true) +
      `<g opacity="${a3.toFixed(3)}">${txt('3 ч', 221, 318 - 10 * E(t, 14.4, 15), 26, P.amber)}</g>` +
      `<g opacity="${a5.toFixed(3)}">${txt('5 ч', 221, 318 - 10 * E(t, 16.0, 16.6), 28, '#ff5a4a')}</g>` +
      `<circle cx="221" cy="347" r="${(26 + 3 * Math.sin(t * 6)).toFixed(1)}" fill="${P.green}" opacity=".08"/>`,
    cam: { z: lerp(1.0, 1.75, E(t, 9.2, 17.2)), cx: lerp(95, 200, u), cy: lerp(300, 345, u) }
  };
});
// 3. Я набрал 103 — нет сети
add(17.35, 20.3, (t, u) => {
  const dig = t < 17.92 ? '' : t < 18.1 ? '1' : t < 18.3 ? '10' : '103';
  const no = t > 19.0;
  const o3 = { breath: t * 2, headRot: -4 * Math.sin(t * 1.2) }; o3.armR = reachPose('denis', 135, 470, 1.1, o3, 'R', [186, 178], E(t, 17.4, 17.95)); o3.holdR = { svg: P_phone(dig, no) };
  return {
    g: BG.flat + D(.62) + RG('denis', 135, 470, 1.1, o3) + R(t, 26, 8, .3, 340, .22, true),
    cam: { z: 1.0 + .08 * u, cx: 150, cy: 240 }
  };
});
// 4. Вышки умерли
add(20.3, 23.0, (t, u) => {
  const alive = t < 21.84;
  const blink = alive ? (Math.sin(t * 9) > 0 ? 1 : .25) : 0;
  return {
    g: BG.flat + D(.3 + (alive ? 0 : .22 * E(t, 21.84, 22.2))) +
      `<g clip-path="url(#winclip)"><path d="M90 272 L100 96 L110 272" stroke="#3a4766" stroke-width="2" fill="none"/><path d="M93 220 L107 220 M95 170 L105 170 M97 130 L103 130 M93 220 L105 170 M107 220 L95 170" stroke="#3a4766" stroke-width="1.4"/>
       ${[96, 150, 205].map(y => `<circle cx="100" cy="${y}" r="3.2" fill="#ff3a2a" opacity="${blink}"/><circle cx="100" cy="${y}" r="14" fill="url(#redh)" opacity="${(blink * .7).toFixed(2)}"/>`).join('')}</g>` +
      R(t, 40, 9, .35, 340, .22, true),
    cam: { z: lerp(1.5, 1.9, u), cx: lerp(125, 110, u), cy: lerp(185, 160, u) }
  };
});
// 5. Миха шутит
add(23.0, 28.2, (t, u) => ({
  g: BG.flat + D(.5) + `<rect width="270" height="480" fill="#000" opacity=".25"/>` +
    RG('miha', 130 + 3 * Math.sin(t * 1.3), 520, 1.28, { breath: t * 2, lean: 1.2 * Math.sin(t * 1.1), headRot: 4 * Math.sin(t * 1.7), armR: { a: [38 + 14 * Math.sin(t * 2.6), 85 + 30 * Math.sin(t * 2.6 + 1)] } }) + R(t, 30, 10, .22, 340, .22, true),
  cam: { z: 1.0 + .06 * u, cx: 135, cy: 235 }
}));
// 6. Генератор гудит на седьмом
add(28.2, 31.9, (t, u) => {
  let rings = ''; for (let k = 0; k < 3; k++) { const r = ((t * 30 + k * 22) % 66); rings += `<circle cx="219" cy="60" r="${r.toFixed(1)}" fill="none" stroke="${P.amber}" stroke-width="2" opacity="${(.6 * (1 - r / 66)).toFixed(3)}"/>`; }
  return {
    g: BG.stairs.replace('>7<', '>7<') + D(.35) + `<circle cx="219" cy="59" r="40" fill="url(#halo)" opacity="${(.35 + .15 * Math.sin(t * 14)).toFixed(3)}"/>` + rings +
      txt('7', 219, 74, 46, P.amber, { op: .9 }) + R(t, 14, 11, .15, 340, .22),
    cam: { z: lerp(1.0, 1.7, E(t, 28.2, 31.9)), cx: lerp(135, 215, u), cy: lerp(240, 80, u) }
  };
});
// 7. Петрович, дверь, сумка
const doorBg = (t) => `<rect width="270" height="480" fill="#0e1322"/><rect y="400" width="270" height="80" fill="#090c15"/>
 <rect x="112" y="96" width="150" height="306" fill="#2a1d12"/><ellipse cx="190" cy="250" rx="110" ry="170" fill="url(#warm)" opacity="${(.55 + .12 * Math.sin(t * 17) * Math.sin(t * 5)).toFixed(3)}"/>
 <rect x="112" y="96" width="150" height="306" fill="none" stroke="#2a3350" stroke-width="9"/><rect x="20" y="120" width="60" height="150" fill="#101626"/>`;
add(31.9, 36.8, (t, u) => {
  const M = [150, 262], e = E(t, 34.3, 34.85) * (1 - E(t, 35.1, 35.7));
  const dO = { flip: true, breath: t * 2.1, headRot: 4 * Math.sin(t * 1.3) }, pO = { breath: t * 2, headRot: 5 * Math.sin(t * 2.3) };
  dO.armL = reachPose('denis', 62, 400, .78, dO, 'L', M, e);
  pO.armL = reachPose('petrovich', 192, 400, .78, pO, 'L', M, e);
  pO.armR = { a: [14, 8] }; pO.holdR = { svg: P_lantern };
  if (t < 34.92) dO.holdL = { svg: P_bag }; else pO.holdL = { svg: P_bag };
  return {
    g: doorBg(t) + RG('petrovich', 192, 400, .78, pO) + RG('denis', 62, 400, .78, dO) + R(t, 6, 12, .1),
    cam: { z: 1.0 + .22 * u, cx: lerp(135, 150, u), cy: 250 }
  };
});
// 8a. Генератор пуст
add(36.8, 39.0, (t, u) => {
  const ang = lerp(40, -62, E(t, 37.5, 38.0)) + (t > 38.0 ? Math.sin(t * 30) * 1.2 : 0);
  const led = t > 37.9 ? (Math.sin(t * 12) > 0 ? 1 : .15) : .0;
  return {
    g: `<rect width="270" height="480" fill="#0b0f1b"/><rect y="320" width="270" height="160" fill="#080b14"/>
      <rect x="45" y="170" width="180" height="150" rx="14" fill="#2a3040"/><rect x="45" y="170" width="180" height="22" rx="10" fill="${P.amber}" opacity=".7"/>
      <rect x="60" y="205" width="150" height="90" rx="8" fill="#1a2030"/>
      <circle cx="135" cy="250" r="38" fill="#0a0d16" stroke="#3a4766" stroke-width="4"/>
      <path d="M103 262 A34 34 0 0 1 167 262" stroke="#3a4766" stroke-width="3" fill="none"/>
      ${txt('E', 108, 280, 12, '#ff5a4a')}${txt('F', 162, 280, 12, P.green)}
      <g transform="translate(135 256) rotate(${ang.toFixed(1)})"><rect x="-1.6" y="-32" width="3.2" height="34" fill="#e9edf5"/></g><circle cx="135" cy="256" r="5" fill="#e9edf5"/>
      <circle cx="195" cy="230" r="6" fill="#ff3a2a" opacity="${led}"/><circle cx="195" cy="230" r="22" fill="url(#redh)" opacity="${(led * .8).toFixed(2)}"/>
      <ellipse cx="135" cy="250" rx="160" ry="200" fill="url(#warm)" opacity="${(.35 * (1 - E(t, 37.8, 38.6))).toFixed(3)}"/>`,
    cam: { z: lerp(1.0, 1.6, E(t, 36.8, 38.6)), cx: 135, cy: lerp(240, 250, u) }
  };
});
// 8b. Солярка в фуре
add(39.0, 42.5, (t, u) => {
  const p = .5 + .5 * Math.sin(t * 7);
  return {
    g: BG.lot + D(.32) + `<circle cx="127" cy="297" r="${(16 + 8 * p).toFixed(1)}" fill="none" stroke="#ff5a4a" stroke-width="2" opacity="${(.9 - .5 * p).toFixed(2)}"/><circle cx="127" cy="297" r="26" fill="url(#redh)" opacity=".35"/>` +
      `<rect y="170" width="270" height="140" fill="#9db4d0" opacity="${(.03 + .02 * Math.sin(t * 2)).toFixed(3)}"/>` + R(t, 46, 13, .3, 360, .22),
    cam: { z: lerp(1.0, 1.9, E(t, 39.0, 42.4)), cx: lerp(135, 135, u), cy: lerp(300, 300, u) }
  };
});
// 9. Лестница вниз, фонарик слабеет
add(42.5, 47.0, (t, u) => {
  const n = 9 - Math.floor(seg(t, 42.5, 46.9) * 8);
  const L0 = t < 45.6 ? 1 : clamp(.55 + .55 * Math.sin(t * 41) * Math.sin(t * 23), .05, 1);
  const L = t < 43.6 ? 0 : L0;
  const x = lerp(48, 200, E(t, 42.5, 47.0)), y = lerp(305, 400, E(t, 42.5, 47.0));
  const up = E(t, 43.3, 43.9);
  const o = { breath: t * 2, drop: 2.5 * Math.abs(Math.sin(t * 9.5)), walk: { ph: t * 9.5, amp: .9 }, lean: 2 * Math.sin(t * 9.5), armR: { a: [lerp(15, 72, up), lerp(-30, 98, up)] } };
  if (t >= 43.0) o.holdR = { svg: P_flash(L, 300) };
  return {
    g: BG.stairs.replace('>7<', `>${n}<`) + D(.56 + (1 - L) * .22) + RG('denis', x, y, .5, o) + R(t, 14, 14, .12, 300, .22),
    cam: { z: 1.2, cx: x + 20, cy: y - 80 }
  };
});
// 10. У бака: фонарик гаснет, топливо на ощупь
add(47.0, 52.25, (t, u) => {
  const L = t < 47.9 ? 1 : t < 48.24 ? (Math.sin(t * 70) > 0 ? 1 : .1) : 0;
  const fill = E(t, 49.5, 51.7);
  const lower = E(t, 48.3, 48.9), den10 = { breath: t * 2, lean: t > 48.24 ? 3 * Math.sin(t * 3.1) : 0, armR: { a: [lerp(92, 20, lower), lerp(100, 12, lower)] }, holdR: { svg: P_flash(L, 260) } };
  const dripT = (t * 2.5) % 1;
  return {
    g: BG.lot + RG('denis', 60, 470, .7, den10) +
      `<path d="M127 296 q4 40 26 70" stroke="#2a3040" stroke-width="2.4" fill="none"/><rect x="142" y="392" width="22" height="30" rx="3" fill="#7a2b24"/><rect x="146" y="${(420 - 24 * fill).toFixed(1)}" width="14" height="${(24 * fill).toFixed(1)}" fill="${P.amber}" opacity=".55"/>
       ${t > 49.3 ? `<circle cx="153" cy="${(366 + dripT * 24).toFixed(1)}" r="1.8" fill="${P.amber}" opacity=".8"/>` : ''}` +
      D(.28 + .58 * (1 - L)) + R(t, 46, 15, .28, 360, .22),
    cam: { z: 1.12 + .35 * E(t, 47.0, 52.2), cx: 120, cy: 340, sh: t > 48.24 ? .7 : 0 }
  };
});
// 11. Трасса — отняли канистру
add(52.25, 58.5, (t, u) => {
  const wk = E(t, 52.3, 54.8), sx = lerp(55, 95, wk), sy = lerp(400, 445, wk), ss = lerp(.55, .78, wk);
  const ph = t * 7.5;
  const thIn = E(t, 54.8, 56.7), thOut = E(t, 57.8, 58.5);
  const th = thIn * (1 - thOut);
  const ths = lerp(.18, .62, thIn) * lerp(1, .35, thOut);
  const thy = lerp(215, 420, thIn) - 140 * thOut;
  const taken = t >= 57.2;
  const dO = { walk: { ph, amp: t < 54.8 ? 1 : .3 }, drop: 3 * Math.abs(Math.sin(ph)), breath: t * 3, lean: 1.5 * Math.sin(ph), armR: { a: [10, 6] }, holdL: { svg: P_flash(0, 10) } };
  if (!taken) dO.holdR = { svg: P_can };
  const dHand = handW('denis', sx, sy, ss, dO, 'R');
  const tA = { walk: { ph: t * 6, amp: thOut > 0 ? 1 : .2 }, breath: t * 2 };
  tA.armL = reachPose('thug', 185, thy, ths, tA, 'L', dHand, E(t, 56.7, 57.15) * (1 - E(t, 57.3, 57.8)));
  if (taken) tA.holdL = { svg: P_can };
  return {
    g: BG.road + D(.22) + `<g opacity="${th.toFixed(3)}">${RG('thug', 130, thy - 6, ths * .92, { walk: { ph: t * 6 + 1, amp: thOut > 0 ? 1 : .2 }, c: '#0e121b' })}${RG('thug', 185, thy, ths, tA)}</g>` +
      RG('denis', sx, sy, ss, dO) + R(t, 56, 16, .32, 380, .22),
    cam: { z: 1.02, cx: 135, cy: 260 + 5 * u, sh: .4 }
  };
});
// 12. Минуты у Михи
add(58.5, 61.7, (t, u) => {
  const prog = E(t, 58.8, 61.6) * .85, C = 2 * Math.PI * 52;
  const bob = 4 * Math.abs(Math.sin(t * 8));
  return {
    g: BG.road + D(.28) + `<circle cx="135" cy="95" r="52" fill="none" stroke="#1a2234" stroke-width="9"/>
      <circle cx="135" cy="95" r="52" fill="none" stroke="${t > 60.9 ? '#ff5a4a' : P.amber}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * prog).toFixed(1)}" transform="rotate(-90 135 95)"/>
      ${txt(t < 60.4 ? '60 мин' : '1 час', 135, 104, 24, '#f2f4f8')}` +
      RG('denis', 135, 450, .85, { walk: { ph: t * 10, amp: 1.3 }, drop: 5 * Math.abs(Math.sin(t * 10)), lean: 3 * Math.sin(t * 10), armL: { a: [20 + 28 * Math.sin(t * 10), 50] }, armR: { a: [20 - 28 * Math.sin(t * 10), 50] }, holdR: { svg: P_flash(0, 10) } }) + R(t, 50, 17, .3, 400, .22),
    cam: { z: 1.04 + .04 * u, cx: 135, cy: 200, sh: .6 }
  };
});
// 13a. Запасной блок в кармане
add(61.7, 64.9, (t, u) => {
  const rise = E(t, 62.2, 63.3), by = lerp(320, 170, rise);
  const zero = t > 64.0, fl = zero ? (Math.sin(t * 16) > 0 ? 1 : .35) : .0;
  const shake = zero ? 1.4 * Math.sin(t * 60) : 0;
  return {
    g: `<rect width="270" height="480" fill="#162b31"/><rect x="0" y="60" width="270" height="14" fill="${P.amber}" opacity=".6"/><rect x="0" y="90" width="270" height="6" fill="${P.amber}" opacity=".3"/>
      <path d="M40 250 L230 250 L230 360 L40 360z" fill="#1d3840"/><path d="M40 250 L230 250 L230 270 L40 270z" fill="#244850"/>
      <g transform="translate(${shake.toFixed(2)} 0)"><rect x="100" y="${by}" width="72" height="120" rx="12" fill="#1a2234" stroke="#2b3550" stroke-width="3"/>
      <rect x="110" y="${by + 14}" width="52" height="30" rx="4" fill="#07120e"/>${txt(zero ? '0%' : '', 136, by + 38, 22, '#ff4a3a', { op: .4 + .6 * fl })}
      <rect x="116" y="${by + 70}" width="40" height="8" rx="3" fill="#2c3750"/></g>
      <path d="M40 300 L230 300 L230 480 L40 480z" fill="#1d3840"/><path d="M40 292 L230 292 L230 306 L40 306z" fill="#2d4a52"/>
      <rect width="270" height="480" fill="#000" opacity="${(zero ? .12 : .3).toFixed(2)}"/>`,
    cam: { z: lerp(1.0, 1.25, u), cx: 135, cy: 240 }
  };
});
// 13b. Впереди горит свет
add(64.9, 66.95, (t, u) => {
  const r = lerp(6, 80, E(t, 64.9, 66.9)), a = lerp(.25, .95, E(t, 64.9, 66.9));
  const y = lerp(380, 330, u);
  return {
    g: BG.road + D(.34) + `<circle cx="135" cy="190" r="${r.toFixed(1)}" fill="url(#halo)" opacity="${a.toFixed(3)}"/>` +
      RG('denis', 135, y, lerp(.5, .38, u), { walk: { ph: t * 7, amp: 1 }, drop: 2 * Math.abs(Math.sin(t * 7)), breath: t * 3, holdR: { svg: P_flash(0, 10) } }) + R(t, 50, 18, .3, 380, .22),
    cam: { z: lerp(1.0, 1.35, E(t, 64.9, 66.9)), cx: 135, cy: lerp(260, 220, u), sh: .3 }
  };
});
// 14. Больница снаружи: одно крыло
add(66.95, 70.95, (t, u) => {
  const pan = E(t, 67.1, 70.2);
  const cold = E(t, 69.9, 70.6);
  return {
    g: BG.hospital +
      `<ellipse cx="78" cy="260" rx="130" ry="150" fill="url(#warm)" opacity="${(.22 + .05 * Math.sin(t * 9) + .18 * E(t, 67.8, 68.4)).toFixed(3)}"/>` +
      `<circle cx="50" cy="413" r="${(18 + 3 * Math.sin(t * 8)).toFixed(1)}" fill="url(#warm)" opacity=".6"/>` +
      `<rect x="135" y="130" width="115" height="260" fill="#1a2a4a" opacity="${(.0 + .2 * cold).toFixed(3)}"/>` + D(.15) + R(t, 60, 19, .3, 380, .22),
    cam: { z: 1.55, cx: lerp(80, 190, pan), cy: 255 }
  };
});
// 15. Коридор: Денис и врач
add(70.95, 78.05, (t, u) => {
  const pulse = .5 + .5 * Math.sin(t * 4.5);
  const outl = E(t, 75.8, 76.2) * (1 - E(t, 77.0, 77.1));
  const redled = t > 77.08 ? (Math.sin(t * 14) > 0 ? 1 : .2) : 0;
  return {
    g: BG.corridor + `<rect width="270" height="480" fill="${P.red}" opacity="${(.06 + .08 * pulse).toFixed(3)}"/>` +
      RG('denis', 72, 462, .78, { breath: t * 2, headRot: 5 * Math.sin(t * 1.1) }) + RG('doctor', 198, 462, .78, { breath: t * 1.8, headRot: -4 * Math.sin(t * 1.9), armL: { a: [18 + 12 * Math.sin(t * 3), 55 + 20 * Math.sin(t * 3 + 1)] } }) +
      `<circle cx="155" cy="245" r="${(10 + 10 * outl).toFixed(1)}" fill="url(#halo)" opacity="${(outl * .8).toFixed(2)}"/>` +
      `<circle cx="155" cy="245" r="2.6" fill="#ff3a2a" opacity="${redled}"/><circle cx="155" cy="245" r="18" fill="url(#redh)" opacity="${(redled * .8).toFixed(2)}"/>`,
    cam: { z: lerp(1.0, 1.14, E(t, 70.95, 78.0)), cx: 135, cy: 300 }
  };
});
// 16. Врач выдёргивает вилку
function ecg(t, alive) {
  if (!alive) return `<path d="M190 264 H236" stroke="${P.green}" stroke-width="2.4"/>`;
  let d = '';
  for (let x = 190; x <= 236; x += 1) {
    const ph = (((x + t * 40) % 24) + 24) % 24; let y = 0;
    if (ph > 6 && ph < 9) y = -9 * (1 - Math.abs(ph - 7.5) / 1.5); else if (ph >= 9 && ph < 12) y = 7 * (1 - Math.abs(ph - 10.5) / 1.5);
    d += (d ? ' L' : 'M') + x + ' ' + (264 + y).toFixed(1);
  }
  return `<path d="${d}" stroke="${P.green}" stroke-width="2.4" fill="none"/>`;
}
add(78.05, 83.45, (t, u) => {
  const walk = E(t, 78.2, 80.3), dx = lerp(330, 214, walk), dy = 436;
  const bend = E(t, 79.8, 80.4) * (1 - E(t, 80.6, 81.3));
  const dO = { walk: walk < 1 ? { ph: t * 8, amp: 1 } : null, drop: walk < 1 ? 3 * Math.abs(Math.sin(t * 8)) : 0, breath: t * 1.8, lean: 10 * bend };
  const SOCK = [248, 325], pullE = E(t, 80.56, 81.2);
  const tgt = [lerp(SOCK[0], 212, pullE), lerp(SOCK[1], 405, pullE)];
  dO.armR = reachPose('doctor', dx, dy, .8, dO, 'R', tgt, E(t, 79.8, 80.4) * (1 - E(t, 81.2, 81.9)));
  const held = t >= 80.56;
  if (held) dO.holdR = { svg: P_plug };
  const plugW = held ? handW('doctor', dx, dy, .8, dO, 'R') : SOCK;
  const alive = t < 80.6, off = t > 82.4;
  const ledOn = alive ? 1 : (Math.sin(t * 10) > 0 && t < 82.4 ? 1 : .2);
  const extra = `<rect x="188" y="250" width="48" height="24" rx="3" fill="#07120e"/>${off ? '' : ecg(t, alive)}` +
    `<rect x="192" y="284" width="10" height="10" fill="#1a2234"/><circle cx="196" cy="290" r="4" fill="${off ? '#2a1717' : P.red}" opacity="${off ? 1 : ledOn}"/>`;
  const px = 105 + (212 - 130) * .8, py = 430 - (403 - 276) * .8;
  const sag = 446 + 6 * (1 - pullE);
  return {
    g: BG.corridor + D(.18) + `<rect width="270" height="480" fill="${P.red}" opacity="${(.06 + .06 * Math.sin(t * 4.5)).toFixed(3)}"/>` +
      `<rect x="240" y="314" width="16" height="22" rx="2" fill="#2a3350"/>` +
      RG('denis', 38, 462, .46, { op: .85, breath: t * 2 }) +
      CH('oldman', 105, 430, .8, { extra }) +
      `<path d="M${px.toFixed(1)} ${py.toFixed(1)} Q 200 ${sag.toFixed(1)} ${plugW[0].toFixed(1)} ${plugW[1].toFixed(1)}" stroke="#0a0c14" stroke-width="2.2" fill="none"/>` +
      (held ? '' : `<rect x="${SOCK[0] - 4}" y="${SOCK[1] - 5}" width="8" height="10" rx="1.5" fill="#cfd6dc"/>`) +
      RG('doctor', dx, dy, .8, dO),
    cam: { z: lerp(1.0, 1.2, E(t, 78.05, 83.4)), cx: lerp(135, 150, u), cy: lerp(300, 335, u) }
  };
});
// 17. Врач смотрит
add(83.45, 90, (t, u) => {
  const pulse = .5 + .5 * Math.sin(t * 4.5);
  return {
    g: BG.corridor + D(.35) + `<rect width="270" height="480" fill="${P.red}" opacity="${(.08 + .1 * pulse).toFixed(3)}"/>` +
      RG('doctor', 135, 655, 1.5, { breath: t * 1.6, headRot: lerp(-16, 0, E(t, 83.5, 85.3)) }),
    cam: { z: lerp(1.0, 2.05, E(t, 83.45, 88.5)), cx: 135, cy: lerp(300, 175, E(t, 83.45, 88.5)) }
  };
});

// ---- HUD ----
function hud(t) {
  if (t < 3.3 || t > 88.0) return '';
  const a = E(t, 3.3, 3.9) * (1 - E(t, 87.4, 88.0));
  const p = pct(t), pi = Math.round(p);
  const col = p > 22 ? P.green : p > 14 ? P.amber : '#ff5a4a';
  const mins = Math.round(lerp(160, 290, seg(t, 3.5, 66)) + (t > 66 ? (t - 66) * 1.0 : 0));
  const hh = String(Math.floor(mins / 60) % 24).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
  const bl = p < 14 && Math.sin(t * 8) > 0 ? .55 : 1;
  return `<g opacity="${a.toFixed(3)}">
   <rect x="52" y="78" width="228" height="76" rx="16" fill="#05070c" opacity=".55"/>
   ${txt(hh + ':' + mm, 166, 134, 52, '#e9edf5')}
   <rect x="760" y="78" width="268" height="76" rx="16" fill="#05070c" opacity=".55"/>
   <rect x="780" y="98" width="112" height="36" rx="7" fill="none" stroke="${col}" stroke-width="4" opacity="${bl}"/><rect x="892" y="108" width="8" height="16" rx="2" fill="${col}" opacity="${bl}"/>
   <rect x="785" y="103" width="${(102 * pi / 31).toFixed(1)}" height="26" rx="4" fill="${col}" opacity="${bl}"/>
   ${txt(pi + '%', 968, 134, 46, col, { op: bl })}</g>`;
}

// ---- субтитры ----
const cvs = document.createElement('canvas').getContext('2d');
const SUBFONT = 'bold 96px "DejaVu Sans"';
cvs.font = SUBFONT;
const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}:]/gu, '');
const KEY = new Set(['проценты', 'минуты', 'жизни', '02:40', 'сердце', 'тридцать', 'один', 'процент', 'три', 'пять', '103', 'платит', 'генератор', 'бесплатно', 'фуре', 'ощупь', 'час', 'свет', 'одно', 'крыло', 'меня', 'дальше', 'посмотрел', 'сумки', 'девять']);
const RED = new Set(['погас', 'умерли', 'пуст', 'чёрным', 'занята', 'вилку', 'замолчал', 'пустой', 'канистра', 'ушла', 'двое', 'тишина']);
const CH_ = []; {
  let cur = [];
  const flush = () => { if (cur.length) { CH_.push(cur); cur = []; } };
  WORDS.forEach((w, i) => {
    cur.push({ w: w[0], s: w[1], e: w[2] });
    const chars = cur.map(x => x.w).join(' ').length, last = /[.:?!»]$/.test(w[0]) || /[.:»]$/.test(w[0].replace(/["”]/g, ''));
    const next = WORDS[i + 1], gap = next ? next[1] - w[2] : 9;
    if (last || gap > .55 || chars >= 24 || (/,$/.test(w[0]) && chars >= 13)) flush();
  });
  flush();
}
// раскладка по строкам
const SUBS = CH_.map(ws => {
  const lines = [[]]; let wd = 0; const sp = cvs.measureText(' ').width;
  ws.forEach(x => {
    x.wd = cvs.measureText(x.w).width;
    if (wd + x.wd > 900 && lines[lines.length - 1].length) { lines.push([]); wd = 0; }
    lines[lines.length - 1].push(x); wd += x.wd + sp;
  });
  lines.forEach(l => { const tw = l.reduce((s, x) => s + x.wd, 0) + sp * (l.length - 1); let x0 = 540 - tw / 2; l.forEach(x => { x.x = x0 + x.wd / 2; x0 += x.wd + sp; }); });
  return { s: ws[0].s, e: ws[ws.length - 1].e, lines };
});
SUBS.forEach((c, i) => { const nx = SUBS[i + 1]; c.end = Math.min(c.e + .35, nx ? nx.s - .02 : 89.1); });
function subs(t) {
  const c = SUBS.find(c => t >= c.s - .02 && t < c.end); if (!c) return '';
  const n = c.lines.length, base = n === 1 ? 1500 : 1440;
  let o = '';
  c.lines.forEach((l, li) => l.forEach(x => {
    if (t < x.s - .02) return;
    const k = E(t, x.s - .02, x.s + .12), sc = 1 + .18 * (1 - k) + (t - x.s < .35 ? .05 * Math.sin(seg(t, x.s, x.s + .35) * Math.PI) : 0);
    const nw = norm(x.w), fill = RED.has(nw) ? '#ff5a4a' : KEY.has(nw) ? '#ffb84a' : '#f2f4f8';
    const y = base + li * 118;
    o += `<text x="${x.x.toFixed(1)}" y="${y}" font-size="96" font-weight="bold" text-anchor="middle" fill="${fill}" stroke="#05070c" stroke-width="16" stroke-linejoin="round" paint-order="stroke" opacity="${k.toFixed(3)}" transform="translate(${x.x.toFixed(1)} ${y - 34}) scale(${sc.toFixed(3)}) translate(${-x.x.toFixed(1)} ${-(y - 34)})">${x.w}</text>`;
  }));
  return o;
}

// ---- сборка кадра ----
function camT(c, t) {
  const z = Math.max(c.z || 1, 1), hw = 135 / z, hh = 240 / z;
  const cx = clamp(c.cx ?? 135, hw, 270 - hw), cy = clamp(c.cy ?? 240, hh, 480 - hh), sh = c.sh || 0;
  const jx = sh * (Math.sin(t * 47.3) + Math.sin(t * 31.1)) * 2, jy = sh * (Math.sin(t * 39.7) + Math.sin(t * 23.9)) * 2;
  return `translate(${(540 + jx).toFixed(2)} ${(960 + jy).toFixed(2)}) scale(${(4 * z).toFixed(4)}) translate(${(-cx).toFixed(3)} ${(-cy).toFixed(3)})`;
}
const $ = id => document.getElementById(id);
function sceneAt(t) { let i = 0; for (let k = 0; k < S.length; k++) if (t >= S[k].t0) i = k; return i; }
window.renderFrame = function (t) {
  const FADE = .3;
  const i = sceneAt(t), sc = S[i];
  const draw = (s, tt) => { const u = clamp((tt - s.t0) / (s.t1 - s.t0)); const r = s.fn(tt, u); return r; };
  const cur = draw(sc, t);
  let html = '', camv = camT(cur.cam, t);
  const rep = s => s.replace(/31%/g, P3(t) + '%');
  if (i > 0 && t - sc.t0 < FADE) {
    const prev = S[i - 1], pr = draw(prev, t);
    const k = (t - sc.t0) / FADE;
    // оба кадра со своими камерами
    $('cam').setAttribute('transform', '');
    html = `<g transform="${camT(pr.cam, t)}">${rep(pr.g)}</g><g opacity="${ease(k).toFixed(3)}" transform="${camv}">${rep(cur.g)}</g>`;
  } else {
    $('cam').setAttribute('transform', '');
    html = `<g transform="${camv}">${rep(cur.g)}</g>`;
  }
  $('scene').innerHTML = html;
  $('top').innerHTML = cur.top || '';
  $('hud').innerHTML = hud(t);
  $('subs').innerHTML = subs(t);
  // мигание света + тень
  const fl = Math.max(0, .05 * Math.sin(t * 13) * Math.sin(t * 3.7));
  $('flick').setAttribute('opacity', fl.toFixed(3));
  // затемнение: старт и финал
  let f = 1 - E(t, 0, .35);
  f = Math.max(f, E(t, 88.5, 89.1));
  $('fade').setAttribute('opacity', f.toFixed(3));
  // финальная плашка
  $('endcard').innerHTML = t > 88.9 ? `<g opacity="${E(t, 88.9, 89.3).toFixed(3)}">${txt('Продолжение следует…', 540, 960, 64, '#e9edf5')}</g>` : '';
};
window.TOTAL = TOTAL;
