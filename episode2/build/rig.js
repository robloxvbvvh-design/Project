// ===== Скелет персонажей: кости, суставы, обратная кинематика (IK) и предметы в руках =====
// Система координат персонажа: начало — таз, y вниз. Ноги: бедро+голень = 132, рука: плечо+предплечье = 128.
const LEG = 66, ARM = 64, SH_Y = -134, HEAD_Y = -198;
const D2R = Math.PI / 180;

const RIG = {
  denis: {
    w: 128, torso: '#2d4a52', arm: '#2d4a52', pants: '#1c2230', skin: P.skin, shoe: '#0a0a0f',
    deco: `<rect x="-64" y="-65" width="128" height="9" fill="${P.amber}" opacity=".85"/><rect x="-64" y="-45" width="128" height="5" fill="${P.amber}" opacity=".5"/>`,
    head: (o = {}) => face({ cx: 0, cy: 0, mouth: o.mouth || 'worry', brow: o.brow ?? 2 }) +
      `<path d="M-26 20 q26 12 52 0 l-4 14 q-22 14 -44 0z" fill="#6b6f78" opacity=".45"/><path d="M-40 -14 a40 40 0 0 1 80 0 z" fill="#1a2030"/><rect x="-44" y="-16" width="88" height="9" rx="4" fill="#141926"/><rect x="20" y="-12" width="38" height="6" rx="3" fill="#141926"/>`
  },
  miha: {
    w: 84, torso: '#566878', arm: '#566878', pants: '#232a38', skin: P.skinPale, shoe: '#0a0a0f', deco: '',
    tube: `<path d="M0 -176 q-2 40 6 70 q12 40 36 56" stroke="#9fd6e8" stroke-width="2.6" fill="none"/>`,
    head: (o = {}) => face({ cx: 0, cy: 0, skin: P.skinPale, mouth: o.mouth || 'smile', brow: o.brow ?? -1 }) +
      `<path d="M-36 -14 q10 -34 36 -30 q30 -2 38 30 q-20 -18 -38 -14 q-22 0 -36 14z" fill="#1b1612"/><path d="M-8 14 q-6 8 -22 -2 M8 14 q6 8 22 -2" stroke="#9fd6e8" stroke-width="2.6" fill="none"/>`,
    extra: `<g transform="translate(0 0)"><rect x="50" y="50" width="76" height="80" rx="8" fill="#1a2234"/><rect x="58" y="60" width="60" height="26" rx="4" fill="#07120e"/><text x="88" y="80" font-size="20" font-family="DejaVu Sans" font-weight="bold" fill="${P.green}" text-anchor="middle">31%</text><circle cx="68" cy="106" r="5" fill="${P.green}" opacity=".8"/><rect x="80" y="102" width="36" height="8" rx="3" fill="#2c3750"/></g>`
  },
  petrovich: {
    w: 150, torso: '#3b2d27', arm: '#4a3a33', under: '#4a3a33', pants: '#2a2420', skin: '#c2967c', shoe: '#0a0a0f',
    deco: `<path d="M0 -158 v170" stroke="#241b17" stroke-width="3"/><path d="M-34 -120 h-26 M34 -120 h26 M-38 -70 h-24 M38 -70 h24" stroke="#241b17" stroke-width="3"/>`,
    head: (o = {}) => face({ cx: 0, cy: 0, skin: '#c2967c', mouth: 'flat', brow: 1 }) +
      `<path d="M-36 6 q-6 -14 -2 -26 M36 6 q6 -14 2 -26" stroke="#8a8a90" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M-16 18 q16 -9 32 0 q-16 14 -32 0z" fill="#8a8a90"/>`
  },
  doctor: {
    w: 100, torso: '#cfd6dc', arm: '#cfd6dc', pants: '#2a4a52', skin: '#cdb59c', shoe: '#0a0a0f',
    deco: `<path d="M-50 -130 h100" stroke="#9aa6af" stroke-width="3"/><rect x="-8" y="-158" width="16" height="170" fill="#2a4a52" opacity=".55"/><path d="M-24 -152 q-10 60 24 70 q34 -10 24 -70" stroke="#222" stroke-width="3.5" fill="none"/><circle cx="0" cy="-78" r="6" fill="#222"/>`,
    head: (o = {}) => face({ cx: 0, cy: 0, skin: '#cdb59c', mouth: 'flat', brow: 0 }) +
      `<path d="M-38 10 h76 v10 q-38 36 -76 0z" fill="#8fb3bf"/><circle cx="-14" cy="2" r="11" fill="none" stroke="#1a1e2a" stroke-width="3"/><circle cx="14" cy="2" r="11" fill="none" stroke="#1a1e2a" stroke-width="3"/><path d="M-3 2 h6" stroke="#1a1e2a" stroke-width="3"/><path d="M-38 -22 q38 -34 76 0 q-4 -6 -76 0z" fill="#2a2420"/>`
  },
  thug: {
    w: 76, torso: '#171c29', arm: '#171c29', pants: '#171c29', skin: '#171c29', shoe: '#07090f', deco: '',
    head: (o = {}) => `<path d="M-44 14 q0 -62 44 -62 q44 0 44 62 q0 28 -20 42 h-48 q-20 -14 -20 -42z" fill="${o.c || '#171c29'}"/><path d="M-28 0 q28 -14 56 0 v18 q-28 12 -56 0z" fill="#05060a"/><ellipse cx="-12" cy="8" rx="4.5" ry="3" fill="#cfd8e0" opacity=".75"/><ellipse cx="12" cy="8" rx="4.5" ry="3" fill="#cfd8e0" opacity=".75"/>`
  }
};

// ---- геометрия ----
function rot(p, deg) { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
function toWorld(x, y, s, o, q) { const l = rot(q, o.lean || 0), fl = o.flip ? -1 : 1; return [x + fl * s * l[0], y + s * (l[1] - LEG * 2 + (o.drop || 0))]; }
function toLocal(x, y, s, o, w) { const fl = o.flip ? -1 : 1; const l = [(w[0] - x) / (fl * s), (w[1] - y) / s + LEG * 2 - (o.drop || 0)]; return rot(l, -(o.lean || 0)); }
const dirOf = r => [-Math.sin(r * D2R), Math.cos(r * D2R)];
// решение руки: pose.a=[a1,a2] (угол наружу, градусы) или pose.to=[wx,wy] (мировая точка, IK)
function armSolve(kind, x, y, s, o, side) {
  const sp = RIG[kind], sd = side === 'R' ? 1 : -1, S = [sd * (sp.w / 2 + 5), SH_Y];
  const pose = (side === 'R' ? o.armR : o.armL) || { a: [7, 3] };
  if (pose.to) {
    const T = toLocal(x, y, s, o, pose.to), dx = T[0] - S[0], dy = T[1] - S[1];
    let d = Math.hypot(dx, dy); const reach = 2 * ARM - .01; d = Math.min(d, reach);
    const phi = Math.atan2(dy, dx), k = Math.acos(clamp(d / (2 * ARM), 0, 1));
    const cands = [phi + k, phi - k].map(a => [Math.cos(a), Math.sin(a)]);
    let u = (pose.bend || 1) > 0 ? (cands[0][1] > cands[1][1] ? cands[0] : cands[1]) : (cands[0][1] > cands[1][1] ? cands[1] : cands[0]);
    const E = [S[0] + ARM * u[0], S[1] + ARM * u[1]];
    const tx = S[0] + Math.cos(phi) * d, ty = S[1] + Math.sin(phi) * d;
    let f = [tx - E[0], ty - E[1]]; const fl = Math.hypot(f[0], f[1]) || 1; f = [f[0] / fl, f[1] / fl];
    return { r1: -Math.atan2(u[0], u[1]) / D2R, r2: -Math.atan2(f[0], f[1]) / D2R, S };
  }
  return { r1: -sd * pose.a[0], r2: -sd * pose.a[1], S };
}
function handLocal(kind, x, y, s, o, side) {
  const A = armSolve(kind, x, y, s, o, side), u = dirOf(A.r1), f = dirOf(A.r2);
  return [A.S[0] + ARM * u[0] + ARM * f[0], A.S[1] + ARM * u[1] + ARM * f[1]];
}
function handW(kind, x, y, s, o, side) { return toWorld(x, y, s, o, handLocal(kind, x, y, s, o, side)); }

// ---- рисование ----
const limb = (w, c, len) => `<rect x="${-w / 2}" y="${-w / 2}" width="${w}" height="${len + w / 2}" rx="${w / 2}" fill="${c}"/>`;
function legSvg(sp, hx, hip, knee) {
  return `<g transform="translate(${hx} 0) rotate(${hip.toFixed(2)})">${limb(24, sp.pants, LEG)}<g transform="translate(0 ${LEG}) rotate(${knee.toFixed(2)})">${limb(24, sp.pants, LEG)}<ellipse cx="0" cy="${LEG + 2}" rx="21" ry="8" fill="${sp.shoe}"/></g></g>`;
}
function armSvg(sp, A, hold, sd, o) {
  const abs2 = (o.lean || 0) + A.r2;
  const prop = hold ? `<g transform="translate(0 ${ARM}) rotate(${hold.upright === false ? 0 : (-abs2).toFixed(2)})">${hold.svg}</g>` : '';
  return `<g transform="translate(${A.S[0]} ${A.S[1]}) rotate(${A.r1.toFixed(2)})">${limb(22, sp.arm, ARM)}<g transform="translate(0 ${ARM}) rotate(${(A.r2 - A.r1).toFixed(2)})">${limb(22, sp.arm, ARM).replace(/y="-11"/, 'y="-11"')}<circle cx="0" cy="${ARM}" r="11.5" fill="${sp.skin}"/>${hold ? `<g transform="translate(0 ${ARM}) rotate(${hold.upright === false ? 0 : (-abs2 + (o.flip ? 0 : 0)).toFixed(2)})">${hold.svg}</g>` : ''}</g></g>`;
}
// RG(kind, x, y, s, opts): ноги стоят на (x,y). opts: flip, lean, headRot, breath, drop, walk{ph,amp}, armL/armR, holdL/holdR{svg,upright}, op, mouth, brow, light
function RG(kind, x, y, s, o = {}) {
  const sp = RIG[kind], fl = o.flip ? -1 : 1, br = 1 + .012 * Math.sin(o.breath || 0);
  const wk = o.walk, ph = wk ? wk.ph : 0, am = wk ? (wk.amp ?? 1) : 0;
  const hipL = am * 17 * Math.sin(ph), hipR = am * 17 * Math.sin(ph + Math.PI);
  const knL = am * 30 * Math.max(0, Math.cos(ph)), knR = am * 30 * Math.max(0, Math.cos(ph + Math.PI));
  const AL = armSolve(kind, x, y, s, o, 'L'), AR = armSolve(kind, x, y, s, o, 'R');
  const w = sp.w;
  const body = `${legSvg(sp, -18, hipL, knL)}${legSvg(sp, 18, hipR, knR)}
   <g transform="rotate(${(o.lean || 0).toFixed(2)})"><g transform="scale(1 ${br.toFixed(4)})">
    <rect x="${-w / 2}" y="-162" width="${w}" height="175" rx="32" fill="${sp.under || sp.torso}"/>${sp.under ? `<rect x="${-w / 2 + 3}" y="-158" width="${w - 6}" height="170" rx="30" fill="${sp.torso}"/>` : ''}${sp.deco}${sp.tube || ''}</g>
    <rect x="-11" y="-178" width="22" height="26" fill="${sp.skin}"/>
    <g transform="translate(0 ${HEAD_Y}) rotate(${(o.headRot || 0).toFixed(2)})">${sp.head(o)}</g>
    ${armSvg(sp, AL, o.holdL, -1, o)}${armSvg(sp, AR, o.holdR, 1, o)}
   </g>`;
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${fl * s} ${s}) translate(0 ${(-LEG * 2 + (o.drop || 0)).toFixed(2)})" ${o.op != null ? `opacity="${o.op}"` : ''}>${body}${sp.extra || ''}</g>`;
}

// ---- предметы в руке (начало координат — ладонь, ось y — вдоль предплечья) ----
const P_flash = (L = 1, len = 240) => `<rect x="-6" y="-8" width="12" height="34" rx="3" fill="#2b2f3a"/><path d="M-9 24 L9 24 L12 34 L-12 34z" fill="#3a4050"/>
  <polygon points="-9,36 9,36 ${len * .24},${len} ${-len * .24},${len}" fill="${P.amber}" opacity="${(.2 * L).toFixed(3)}"/><circle cx="0" cy="34" r="6" fill="#ffe2a0" opacity="${(.9 * L).toFixed(3)}"/>`;
const P_bag = `<rect x="-13" y="2" width="26" height="20" rx="3" fill="#6b4a2c"/><path d="M-8 2 q8 -13 16 0" stroke="#3a2a18" stroke-width="2.6" fill="none"/>`;
const P_can = `<rect x="-11" y="4" width="22" height="30" rx="3" fill="#a03228"/><rect x="-4" y="-5" width="10" height="10" rx="2" fill="#a03228"/>`;
const P_lantern = `<rect x="-9" y="-2" width="18" height="30" rx="4" fill="#33383f"/><circle cx="0" cy="14" r="12" fill="${P.amber}" opacity=".9"/><circle cx="0" cy="14" r="46" fill="${P.amber}" opacity=".12"/>`;
const P_plug = `<rect x="-5" y="-6" width="10" height="12" rx="2" fill="#cfd6dc"/>`;
const P_phone = (dig, no, t) => `<g transform="translate(0 -26)"><rect x="-17" y="-34" width="34" height="62" rx="6" fill="#0b0f18" stroke="#2b3550" stroke-width="2"/><rect x="-13" y="-29" width="26" height="50" rx="3" fill="${no ? '#2a1717' : '#15334a'}"/>${txt(dig, 0, -8, 10, '#cfe8ff')}${no ? `<g>${txt('нет сети', 0, 4, 5.5, '#ff6a5a')}<path d="M-8 14 v-3 M-3 14 v-6 M2 14 v-9 M7 14 v-12" stroke="#6a2a2a" stroke-width="2.6"/><path d="M-11 -2 l22 24" stroke="#ff4a3a" stroke-width="2"/></g>` : ''}</g>`;
