// ===== Серия 2: «Своя розетка» — сцены =====
// ---- новые фоны и предметы ----
function frostMarks(fr) {
  const r = rng(77); let o = '';
  for (let i = 0; i < 90 * fr; i++) {
    const side = r(), x = side < .35 ? 14 + r() * 50 : side < .7 ? 206 + r() * 50 : 14 + r() * 242, y = side < .7 ? 20 + r() * 280 : 20 + r() * 60 + (r() < .5 ? 0 : 200);
    const a = r() * 6.28, l = 4 + r() * 10 * fr;
    o += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * l).toFixed(1)}" y2="${(y + Math.sin(a) * l).toFixed(1)}" stroke="#e8f3ff" stroke-opacity="${(.5 * fr).toFixed(2)}" stroke-width="1.2"/>`;
  }
  return o;
}
function cab(t, o = {}) {
  const fr = o.frost || 0, eng = o.eng ? 1 : 0, led = o.led ?? (eng ? 1 : .15), warn = o.warn || 0;
  const needle = (cx, cy, a) => `<line x1="${cx}" y1="${cy}" x2="${(cx + 15 * Math.cos(a)).toFixed(1)}" y2="${(cy + 15 * Math.sin(a)).toFixed(1)}" stroke="${eng ? '#ffd27a' : '#5a6a8a'}" stroke-width="1.8"/>`;
  let s = `<rect width="270" height="480" fill="#070a12"/><rect x="14" y="20" width="242" height="282" fill="${eng ? '#18263f' : '#0b1322'}"/>`;
  if (eng) s += `<polygon points="112,170 158,170 250,302 20,302" fill="#1f2a46"/><polygon points="36,302 234,302 150,170 120,170" fill="${P.amber}" opacity="${(.14 + .03 * Math.sin(t * 20)).toFixed(3)}"/><path d="M135 172 V300" stroke="#3a4666" stroke-width="3" stroke-dasharray="8 10"/>`;
  s += R(t, 40, 31, .22, 300, .22);
  if (fr > 0) s += `<rect x="14" y="20" width="242" height="282" fill="#cfe3f5" opacity="${(.5 * fr).toFixed(3)}"/>${frostMarks(fr)}`;
  s += `<polygon points="0,0 30,0 12,300 0,300" fill="#05070c"/><polygon points="270,0 240,0 258,300 270,300" fill="#05070c"/><rect width="270" height="22" fill="#05070c"/>
   <path d="M0 300 Q135 268 270 300 V480 H0z" fill="#10151f"/><path d="M0 300 Q135 268 270 300" stroke="#222c44" stroke-width="3" fill="none"/>
   ${[[66, 345], [112, 345]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="21" fill="${eng ? '#1a2236' : '#0b0f19'}" stroke="#2a3654" stroke-width="3"/>${needle(x, y, -2.4 + (eng ? (i ? .9 : 1.3) : .1) + (o.starter ? .12 * Math.sin(t * 22 + i) : 0))}`).join('')}
   <circle cx="150" cy="332" r="4" fill="#ff3a2a" opacity="${(warn * (Math.sin(t * 9) > 0 ? 1 : .2)).toFixed(2)}"/><circle cx="150" cy="346" r="4" fill="${P.amber}" opacity="${(warn * (Math.sin(t * 9 + 2) > 0 ? 1 : .2)).toFixed(2)}"/>
   <ellipse cx="92" cy="425" rx="74" ry="36" fill="none" stroke="#151c2c" stroke-width="13"/><rect x="82" y="418" width="20" height="14" rx="3" fill="#151c2c"/>
   <rect x="170" y="310" width="76" height="42" rx="6" fill="#1a2234" stroke="#2b3550" stroke-width="2"/><circle cx="184" cy="324" r="4" fill="${P.green}" opacity="${led}"/><circle cx="184" cy="324" r="14" fill="${P.green}" opacity="${(led * .12).toFixed(3)}"/>${txt('220V', 216, 324, 9, '#6a7a9a')}<circle cx="212" cy="341" r="3" fill="#07090f"/><circle cx="224" cy="341" r="3" fill="#07090f"/>
   <rect x="158" y="378" width="104" height="102" fill="#0f1420"/><rect x="176" y="392" width="68" height="46" rx="4" fill="#2a4a5a"/><rect x="176" y="392" width="68" height="10" rx="3" fill="#3a6a7a"/><path d="M198 392 q12 -12 24 0" stroke="#1a2234" stroke-width="3" fill="none"/>`;
  return s;
}
function fist(t) {
  const w = E(t, 23.8, 25.9); let steam = '';
  for (let k = 0; k < 6; k++) { const ph = ((t * .5 + k / 6) % 1), x = 100 + 14 * k + 10 * Math.sin(ph * 6 + k), y = 150 - ph * 110; steam += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(6 + 12 * ph).toFixed(1)}" fill="#cfe3f5" opacity="${(.2 * (1 - ph) * (.3 + w)).toFixed(3)}"/>`; }
  return `<rect width="270" height="480" fill="#0b101c"/><ellipse cx="135" cy="260" rx="${(70 + 60 * w).toFixed(0)}" ry="${(70 + 60 * w).toFixed(0)}" fill="url(#warm)" opacity="${(.12 + .55 * w).toFixed(3)}"/>
   <rect x="113" y="128" width="44" height="270" rx="10" fill="#2b2f3a"/><rect x="104" y="112" width="62" height="34" rx="8" fill="#3a4050"/>
   ${[0, 1, 2, 3].map(i => `<rect x="88" y="${196 + i * 27}" width="94" height="23" rx="11.5" fill="${P.skin}"/><path d="M${96} ${207 + i * 27} h${78}" stroke="#a88566" stroke-width="1.2" opacity=".5"/>`).join('')}
   <ellipse cx="190" cy="232" rx="13" ry="34" fill="${P.skin}" transform="rotate(-16 190 232)"/>${steam}`;
}
const stairNum = (n) => BG.stairs.replace('>7<', `>${n}<`);
const SOCK2 = [248, 325];
function ecg2(t, alive) { return ecg(t, alive); }
function plugRect(p) { return `<rect x="${(p[0] - 4).toFixed(1)}" y="${(p[1] - 5).toFixed(1)}" width="8" height="10" rx="1.5" fill="#cfd6dc"/>`; }
const darkOverlay = D;
function flatDisplay(txtv, col, op = 1) { return `<rect x="202" y="338" width="38" height="16" rx="2" fill="#07120e"/>${txt(txtv, 221, 351, 12, col, { op })}`; }

// ---- сцены ----
// 1. Вилка обратно
add(0, 5.6, (t, u) => {
  const M = [215, 298], plugged = t >= 2.4, toD = t >= 1.72;
  const dO = { breath: t * 1.8, headRot: 3 * Math.sin(t * 1.1) }, nO = { breath: t * 2, headRot: -3 * Math.sin(t * 1.3), mouth: 'worry' };
  dO.armR = reachPose('doctor', 128, 462, .78, dO, 'R', M, E(t, .5, 1.2) * (1 - E(t, 1.72, 2.3)));
  const tgt = [lerp(M[0], SOCK2[0], E(t, 1.75, 2.35)), lerp(M[1], SOCK2[1], E(t, 1.75, 2.35))];
  nO.armR = reachPose('denis', 200, 462, .78, nO, 'R', tgt, E(t, .9, 1.5) * (1 - E(t, 2.6, 3.2)));
  if (!toD) dO.holdR = { svg: P_plug }; else if (!plugged) nO.holdR = { svg: P_plug };
  const plugW = !toD ? handW('doctor', 128, 462, .78, dO, 'R') : !plugged ? handW('denis', 200, 462, .78, nO, 'R') : SOCK2;
  const alive = t > 2.45, px = 62 + (212 - 130) * .62, py = 440 - (403 - 276) * .62;
  const extra = `<rect x="188" y="250" width="48" height="24" rx="3" fill="#07120e"/>${alive ? ecg(t, true) : ''}<rect x="192" y="284" width="10" height="10" fill="#1a2234"/><circle cx="196" cy="290" r="4" fill="${alive ? P.green : '#2a1717'}"/>`;
  return {
    g: BG.corridor + D(.2) + `<rect width="270" height="480" fill="${P.red}" opacity="${(.06 + .06 * Math.sin(t * 4.5)).toFixed(3)}"/><rect x="240" y="314" width="16" height="22" rx="2" fill="#2a3350"/>` +
      CH('oldman', 62, 440, .62, { extra }) +
      `<path d="M${px.toFixed(1)} ${py.toFixed(1)} Q 150 ${(450).toFixed(1)} ${plugW[0].toFixed(1)} ${plugW[1].toFixed(1)}" stroke="#0a0c14" stroke-width="2.2" fill="none"/>` +
      (plugged ? plugRect(SOCK2) : '') + RG('doctor', 128, 462, .78, dO) + RG('denis', 200, 462, .78, nO),
    cam: { z: lerp(1.0, 1.12, u), cx: 150, cy: 320 }
  };
});
// 2a. Старик вдохнул
add(5.6, 7.5, (t, u) => {
  const extra = `<rect x="188" y="250" width="48" height="24" rx="3" fill="#07120e"/>${ecg(t, true)}<rect x="192" y="284" width="10" height="10" fill="#1a2234"/><circle cx="196" cy="290" r="4" fill="${P.green}"/>`;
  return {
    g: BG.corridor + D(.25) + `<rect width="270" height="480" fill="${P.red}" opacity="${(.05 + .05 * Math.sin(t * 4.5)).toFixed(3)}"/>` + CH('oldman', 135, 420, .95, { extra, breath: t * 3.5 }),
    cam: { z: lerp(1.2, 1.7, E(t, 5.6, 7.5)), cx: 120, cy: 340 }
  };
});
// 2b. Миха потерял розетку
add(7.5, 9.5, (t, u) => {
  const bl = Math.sin(t * 8) > 0 ? 1 : .35;
  return {
    g: BG.flat + mihaBed(t) + D(.58) + flatDisplay(Math.round(pct2(t)) + '%', '#ff5a4a', bl) + R(t, 40, 6, .3, 340, .22, true),
    cam: { z: lerp(1.1, 1.8, u), cx: lerp(110, 200, u), cy: lerp(300, 345, u) }
  };
});
// 3. «Своё питание есть?»
add(9.5, 14.3, (t, u) => {
  const dO = { breath: t * 1.8, headRot: -3 * Math.sin(t * 1.9), armL: { a: [20 + 14 * Math.sin(t * 3), 60 + 20 * Math.sin(t * 3 + 1)] } };
  return {
    g: BG.corridor + `<rect width="270" height="480" fill="${P.red}" opacity="${(.06 + .07 * (.5 + .5 * Math.sin(t * 4.5))).toFixed(3)}"/>` +
      RG('denis', 72, 462, .78, { breath: t * 2, headRot: 4 * Math.sin(t * 1.1) }) + RG('doctor', 198, 462, .78, dO),
    cam: { z: lerp(1.0, 1.14, u), cx: 135, cy: 300 }
  };
});
// 4. Фура, инвертор, холодильник
add(14.3, 20.8, (t, u) => {
  const inv = E(t, 16.0, 16.4) * (1 - E(t, 17.4, 17.8)), fr = E(t, 17.4, 17.8) * (1 - E(t, 18.9, 19.3));
  const z = t < 19 ? lerp(1.0, 1.7, E(t, 14.3, 17.4)) : lerp(1.7, 1.05, E(t, 19.0, 20.8));
  return {
    g: cab(t, { eng: false, led: .2 + .8 * inv }) + D(.12 + .25 * E(t, 19.1, 20.6)) +
      `<circle cx="208" cy="331" r="${(34 + 6 * Math.sin(t * 8)).toFixed(1)}" fill="none" stroke="${P.green}" stroke-width="2.2" opacity="${(inv * .8).toFixed(2)}"/>` +
      `<rect x="170" y="386" width="82" height="58" rx="8" fill="none" stroke="${P.amber}" stroke-width="2.4" opacity="${(fr * (.5 + .5 * Math.sin(t * 8))).toFixed(2)}"/>`,
    cam: { z, cx: lerp(135, 208, E(t, 14.3, 17.4)), cy: lerp(240, 350, E(t, 14.3, 17.4)) }
  };
});
// 5. До фуры километр, фонарик мёртв
add(20.8, 23.6, (t, u) => {
  return {
    g: BG.road + D(.3) + `<rect x="226" y="150" width="4" height="60" fill="#1b2438"/><rect x="204" y="124" width="54" height="34" rx="3" fill="#1c3a2c" stroke="#3a6a52" stroke-width="2"/>${txt('1 км', 231, 148, 15, '#bfe8d0')}` +
      RG('denis', 120, 440, .72, { walk: { ph: t * 6.5, amp: 1 }, drop: 2.5 * Math.abs(Math.sin(t * 6.5)), breath: t * 3, holdR: { svg: P_flash(0, 10) } }) + R(t, 56, 41, .32, 380, .22),
    cam: { z: 1.04, cx: 135, cy: 255, sh: .3 }
  };
});
// 6. Фонарик в кулаке
add(23.6, 26.3, (t, u) => ({ g: fist(t), cam: { z: lerp(1.0, 1.25, u), cx: 135, cy: 240 } }));
// 7. Вспыхнул на пять секунд
add(26.3, 30.0, (t, u) => {
  const on = t < 29.6; const L = on ? (t > 28.9 ? clamp(.5 + .5 * Math.sin(t * 44) * Math.sin(t * 19), .1, 1) : 1) : 0;
  const n = on ? Math.max(1, 5 - Math.floor((t - 26.4) / .62)) : 0;
  const o = { walk: { ph: t * 7, amp: 1 }, drop: 2.5 * Math.abs(Math.sin(t * 7)), breath: t * 3, armR: { a: [38, 34] }, holdR: { svg: P_flash(L, 330) } };
  return {
    g: BG.road + D(.5 - .22 * L) + `<ellipse cx="150" cy="445" rx="70" ry="18" fill="${P.amber}" opacity="${(.22 * L).toFixed(3)}"/>` + RG('denis', 110, 430, .75, o) +
      (on ? `<text x="135" y="86" font-size="40" font-weight="bold" fill="${P.amber}" text-anchor="middle" opacity=".85">${n}</text>` : '') + R(t, 56, 42, .32, 380, .22),
    cam: { z: 1.05, cx: 135, cy: 255, sh: .3 }
  };
});
// 8. У фуры двое
add(30.0, 34.7, (t, u) => {
  const fill = E(t, 32.9, 34.6), hoodO = { hood: true };
  const tA = { hood: true, breath: t * 2, armR: { a: [18, 12] } }, tB = { hood: true, breath: t * 2 + 1, armL: { a: [20, 14] } };
  const den = { walk: { ph: t * 6, amp: 1 }, drop: 2 * Math.abs(Math.sin(t * 6)), breath: t * 3, holdR: { svg: P_flash(0, 10) } };
  const dx = lerp(-10, 48, E(t, 30.0, 32.6));
  return {
    g: BG.lot + `<rect width="270" height="480" fill="#3a4a72" opacity=".07"/>` + D(.16) +
      `<path d="M127 296 q4 40 8 82" stroke="#2a3040" stroke-width="2.4" fill="none"/><rect x="124" y="392" width="22" height="30" rx="3" fill="#7a2b24"/><rect x="128" y="${(420 - 24 * fill).toFixed(1)}" width="14" height="${(24 * fill).toFixed(1)}" fill="${P.amber}" opacity=".6"/>` +
      RG('teen', 96, 428, .68, tA) + RG('teen2', 172, 428, .64, tB) + RG('denis', dx, 470, .8, den) + R(t, 46, 43, .28, 360, .22),
    cam: { z: lerp(1.0, 1.25, u), cx: lerp(120, 125, u), cy: 320 }
  };
});
// 9. Мог закричать, мог ударить — один закашлялся
add(34.7, 39.4, (t, u) => {
  const cough = crit(t, 37.6, 38.7), hood = t < 38.6;
  const nO = { breath: t * 3, armL: { a: [lerp(15, 70, E(t, 35.0, 35.9)), lerp(10, 105, E(t, 35.0, 35.9))] }, armR: { a: [lerp(15, 70, E(t, 36.0, 36.6)), lerp(10, 105, E(t, 36.0, 36.6))] } };
  const tA = { hood, breath: t * 2, lean: cough ? 10 * Math.sin(t * 17) : 0, headRot: cough ? 8 * Math.sin(t * 17 + 1) : 0 };
  return {
    g: BG.lot + D(.2) + RG('teen2', 232, 450, .8, { hood: true, breath: t * 2 }) + RG('teen', 178, 470, .95, tA) + RG('denis', 68, 500, 1.0, nO) + R(t, 40, 44, .26, 360, .22),
    cam: { z: lerp(1.0, 1.25, E(t, 34.7, 39.4)), cx: lerp(130, 150, u), cy: 330 }
  };
});
// 10. Бабушка дома, печка без топлива
add(39.4, 44.0, (t, u) => {
  const bub = E(t, 41.2, 41.8) * (1 - E(t, 43.8, 44.0));
  const tA = { hood: false, breath: t * 2, headRot: 4 * Math.sin(t * 1.6), armR: { a: [24 + 12 * Math.sin(t * 3), 70 + 20 * Math.sin(t * 3)] } };
  const tB = { hood: false, breath: t * 2 + 1, holdL: { svg: P_can }, armL: { a: [8, 4] } };
  return {
    g: BG.lot + D(.15) + RG('teen2', 205, 480, .92, tB) + RG('teen', 118, 490, .98, tA) +
      `<g opacity="${bub.toFixed(3)}"><circle cx="70" cy="100" r="52" fill="#0b101c" stroke="#2a3654" stroke-width="3"/><circle cx="48" cy="156" r="8" fill="#0b101c" stroke="#2a3654" stroke-width="2"/>
        <rect x="44" y="90" width="52" height="38" rx="6" fill="#1d2640"/><rect x="52" y="98" width="20" height="22" rx="3" fill="#0a0e18"/><path d="M46 82 l8 -10 l8 10" stroke="#3a4766" stroke-width="3" fill="none"/>
        <path d="M24 76 l12 -10 M24 110 l10 8" stroke="#9fd6e8" stroke-width="2" opacity=".7"/><circle cx="84" cy="108" r="${(4 + Math.sin(t * 3)).toFixed(1)}" fill="#5a7ab0" opacity=".35"/>
        <circle cx="98" cy="74" r="7" fill="${P.skinPale}"/><rect x="88" y="80" width="22" height="14" rx="5" fill="#4a3a4a"/></g>` + R(t, 40, 45, .24, 360, .22),
    cam: { z: lerp(1.0, 1.2, u), cx: 140, cy: 330 }
  };
});
// 11. «Берите. Но сначала поедете со мной»
add(44.0, 47.3, (t, u) => {
  const go = E(t, 45.6, 47.1), pt = E(t, 44.6, 45.3);
  const nO = { breath: t * 2, armR: { a: [lerp(10, 82, pt), lerp(6, 90, pt)] } };
  const ax = lerp(150, 215, go), bx = lerp(205, 240, go);
  return {
    g: BG.lot + D(.15) + RG('teen2', bx, 470, .9 - .1 * go, { hood: false, walk: go > 0 && go < 1 ? { ph: t * 8, amp: 1 } : null, holdL: { svg: P_can } }) +
      RG('teen', ax, 480, .95 - .1 * go, { hood: false, walk: go > 0 && go < 1 ? { ph: t * 8 + 1, amp: 1 } : null }) + RG('denis', 70, 500, .95, nO) + R(t, 40, 46, .24, 360, .22),
    cam: { z: 1.1, cx: lerp(130, 160, u), cy: 330 }
  };
});
// 12. Дизель не заводился: мороз, 18 минут
add(47.3, 53.1, (t, u) => {
  const fr = E(t, 47.4, 51.5), left = Math.max(0, 18 * (1 - seg(t, 49.84, 52.5)));
  const starter = (Math.floor(t * 1.4) % 2) === 0;
  const mm = Math.floor(left), ss = Math.floor((left - mm) * 60);
  return {
    g: cab(t, { frost: fr, eng: false, starter: starter && t > 47.8, warn: 1, led: .1 }) + D(.2) + R(t, 10, 47, .1, 200),
    top: `<g opacity="${(E(t, 49.6, 50.0) * (1 - E(t, 52.8, 53.1))).toFixed(3)}"><rect x="300" y="760" width="480" height="150" rx="24" fill="#05070c" opacity=".55"/><text x="540" y="880" font-size="110" font-weight="bold" fill="${left < 6 ? '#ff5a4a' : P.amber}" text-anchor="middle" font-family="DejaVu Sans Mono">${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}</text></g>`,
    cam: { z: lerp(1.0, 1.1, u), cx: 135, cy: 260, sh: starter && t > 47.8 ? .7 : .15 }
  };
});
// 13. Блок в инвертор — двигатель завёлся
add(53.1, 57.2, (t, u) => {
  const eng = t >= 53.2, ins = E(t, 53.9, 54.5), pc = Math.min(11, Math.floor(Math.max(0, t - 54.6) / .55));
  const hx = lerp(30, 170, ins);
  return {
    g: `<rect width="270" height="480" fill="#0a0e18"/><rect x="20" y="130" width="230" height="220" rx="14" fill="#1a2234" stroke="#2b3550" stroke-width="4"/>
      <circle cx="60" cy="170" r="10" fill="${P.green}" opacity="${eng ? (t > 54.5 ? 1 : .8) : .1}"/><circle cx="60" cy="170" r="34" fill="${P.green}" opacity="${eng ? .12 : 0}"/>${txt('220V', 150, 182, 26, '#6a7a9a')}
      <rect x="150" y="224" width="68" height="62" rx="8" fill="#07090f"/><circle cx="172" cy="255" r="6" fill="#161c2c"/><circle cx="196" cy="255" r="6" fill="#161c2c"/>
      <g transform="translate(${(hx - 170).toFixed(1)} 0)"><rect x="150" y="220" width="86" height="76" rx="12" fill="#222c42" stroke="#3a4766" stroke-width="3"/><rect x="160" y="230" width="48" height="26" rx="4" fill="#07120e"/>${txt(pc + '%', 184, 250, 20, pc > 0 ? P.green : '#ff4a3a')}
      <rect x="164" y="268" width="40" height="8" rx="3" fill="#2c3750"/><ellipse cx="260" cy="260" rx="46" ry="30" fill="${P.skin}"/><rect x="236" y="244" width="30" height="14" rx="7" fill="${P.skin}" opacity="0"/></g>
      <rect width="270" height="480" fill="#fff" opacity="${(eng ? .02 * Math.sin(t * 40) : 0).toFixed(3)}"/>`,
    cam: { z: lerp(1.0, 1.25, u), cx: 150, cy: 240, sh: eng && t < 54.0 ? 1.5 : .2 }
  };
});
// 14a. Девятый этаж: лестница
add(57.2, 58.4, (t, u) => {
  const n = 1 + Math.floor(seg(t, 57.2, 58.3) * 8);
  const o = { walk: { ph: t * 10, amp: .9 }, drop: 2 * Math.abs(Math.sin(t * 10)), lean: 2 * Math.sin(t * 10), holdR: { svg: P_flash(0, 10) } };
  const x = lerp(60, 190, u), y = lerp(310, 400, u);
  return { g: stairNum(n) + D(.5) + RG('denis', x, y, .5, o) + R(t, 14, 14, .12, 300, .22), cam: { z: 1.2, cx: x + 20, cy: y - 80 } };
});
// 14b. Дверь открыта
add(58.4, 59.4, (t, u) => {
  const open = E(t, 58.4, 59.2);
  return {
    g: `<rect width="270" height="480" fill="#0b101c"/><rect y="400" width="270" height="80" fill="#080b13"/><rect x="60" y="80" width="150" height="320" fill="#05070c"/>
      <polygon points="${(60 + 150).toFixed(0)},80 ${(210 - 70 * open).toFixed(0)},100 ${(210 - 70 * open).toFixed(0)},400 210,400" fill="#1a1612"/>
      <rect x="60" y="80" width="150" height="320" fill="none" stroke="#2a3350" stroke-width="8"/><ellipse cx="135" cy="260" rx="${(80 * open).toFixed(0)}" ry="150" fill="#2a4a6a" opacity="${(.18 * open).toFixed(3)}"/>` + RG('denis', 135, 480, .85, { breath: t * 3, holdR: { svg: P_flash(0, 10) } }) + R(t, 4, 15, .05),
    cam: { z: lerp(1.0, 1.2, u), cx: 135, cy: 260 }
  };
});
// 14c. Аппарат молчит: ноль
add(59.4, 61.3, (t, u) => {
  const bl = Math.sin(t * 9) > 0 ? 1 : .3;
  return {
    g: BG.flat + mihaBed(t) + D(.62) + flatDisplay('0%', '#ff4a3a', bl) + `<circle cx="221" cy="346" r="${(24 + 4 * Math.sin(t * 9)).toFixed(1)}" fill="#ff3a2a" opacity="${(.12 * bl).toFixed(3)}"/>` + RG('denis', 115, 405, .6, { breath: t * 3, headRot: 3 * Math.sin(t * 1.2), holdR: { svg: P_flash(0, 10) } }) + R(t, 40, 6, .3, 340, .22, true),
    cam: { z: lerp(1.1, 1.85, E(t, 59.4, 61.2)), cx: lerp(130, 205, u), cy: lerp(300, 345, u) }
  };
});
// 15. Вставил блок: 11%
add(61.3, 65.3, (t, u) => {
  const ins = E(t, 61.5, 62.3), on = t > 62.55, pc = on ? 11 : 0;
  const hx = lerp(-60, 40, ins);
  return {
    g: `<rect width="270" height="480" fill="#0a0e18"/><rect x="40" y="110" width="190" height="250" rx="16" fill="#1a2234" stroke="#2b3550" stroke-width="4"/>
      <rect x="62" y="136" width="146" height="78" rx="8" fill="#07120e"/>${txt(pc + '%', 135, 196, 58, on ? P.green : '#ff4a3a', { op: on ? 1 : (Math.sin(t * 9) > 0 ? 1 : .3) })}
      <circle cx="80" cy="250" r="9" fill="${on ? P.green : '#2a1717'}"/><circle cx="80" cy="250" r="${on ? 34 : 0}" fill="${P.green}" opacity=".12"/><rect x="104" y="244" width="100" height="12" rx="5" fill="#2c3750"/>
      <g transform="translate(${hx.toFixed(1)} 0)"><rect x="150" y="290" width="86" height="62" rx="12" fill="#222c42" stroke="#3a4766" stroke-width="3"/><ellipse cx="236" cy="322" rx="44" ry="26" fill="${P.skin}"/></g>
      ${on ? [0, 1, 2].map(k => { const r = ((t * 30 + k * 20) % 60); return `<circle cx="135" cy="175" r="${(70 + r).toFixed(1)}" fill="none" stroke="${P.green}" stroke-width="2" opacity="${(.4 * (1 - r / 60)).toFixed(3)}"/>`; }).join('') : ''}`,
    cam: { z: lerp(1.0, 1.15, u), cx: 135, cy: 235 }
  };
});
// 16. Миха не шутил. Сердце
add(65.3, 90, (t, u) => {
  const lean = E(t, 67.8, 69.4);
  const d = { breath: t * 2.5, lean: -80 * lean, headRot: -10 * lean, mouth: 'worry', brow: 3 };
  const beats = [69.9, 70.7, 71.5, 72.2].filter(b => t > b && t < b + .6).map(b => { const k = (t - b) / .6; return `<circle cx="95" cy="325" r="${(14 + 40 * k).toFixed(1)}" fill="none" stroke="${P.green}" stroke-width="2" opacity="${(.5 * (1 - k)).toFixed(3)}"/>`; }).join('');
  return {
    g: BG.flat + mihaBed(t * .5) + D(.5 + .15 * E(t, 70, 72)) + flatDisplay('11%', P.green, 1) + RG('denis', lerp(330, 232, lean), 430, .6, d) + beats + R(t, 40, 6, .3, 340, .22, true),
    cam: { z: lerp(1.1, 1.9, E(t, 65.3, 71)), cx: lerp(130, 120, u), cy: lerp(300, 330, E(t, 65.3, 71)) }
  };
});
