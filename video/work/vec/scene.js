const W = 720, H = 1280, DUR = 27.9;
const SC = [
 [0.0, 2.0, 0.06, 1.85, "СЕГОДНЯ В ШКОЛЕ ПОСТАВИЛИ СКАНЕР АУРЫ.", "ВХОД"],
 [2.0, 4.8, 2.14, 4.49, "ОТЛИЧНИК ПРОШЁЛ ПЕРВЫМ. АУРА — НОЛЬ.", "ОТЛИЧНИК"],
 [4.8, 7.8, 5.08, 7.51, "ФИЗРУК РЯВКНУЛ НА ВСЮ ШКОЛУ. АУРА — НОЛЬ.", "ФИЗРУК"],
 [7.8, 11.4, 8.08, 11.13, "ДИРЕКТОР НАДЕЛ ЛУЧШИЙ КОСТЮМ. АУРА — МИНУС СТО.", "ДИРЕКТОР"],
 [11.4, 14.0, 11.66, 13.68, "ДАЖЕ ШКОЛЬНЫЙ КОТ СКАЗАЛ «МЯУ». НОЛЬ.", "КОТ"],
 [14.0, 17.9, 14.25, 17.62, "ВСЕ НАЧАЛИ ДЕЛАТЬ КРУТЫЕ ПОЗЫ. НОЛЬ, НОЛЬ, НОЛЬ.", "ВСЯ ШКОЛА"],
 [17.9, 20.4, 18.11, 20.33, "ТОГДА ВЫШЕЛ ВАНЯ С БУЛКОЙ. СКАНЕР ЗАВИС.", "ВАНЯ"],
 [20.4, 23.1, 20.56, 22.88, "И ПОКАЗАЛ: ОШИБКА. ПРОВЕРЬТЕ РОЗЕТКУ.", "СКАНЕР"],
 [23.1, 27.9, 23.42, 27.67, "ОКАЗАЛОСЬ, СКАНЕР ПРОСТО НЕ БЫЛ ВКЛЮЧЁН. ЗАТО ВАЙФАЙ В ШКОЛЕ — ВСЁ РАВНО НОЛЬ.", "ШКОЛА"],
];
const HL = ["#ffd640", "#ff6eaa", "#6ee682", "#64c8ff"];
const f = n => (+n).toFixed(2);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const popS = (lt, d0 = 0, dur = 0.3) => { const x = (lt - d0) / dur; if (x <= 0) return 0; if (x >= 1) return 1; return x < 0.5 ? ease(x / 0.5) * 1.18 : 1.18 - 0.18 * ((x - 0.5) / 0.5); };

// ---------- gradients registry ----------
const REG = {};
function G(c1, c2, dir = "v") {
  const id = "g" + (c1 + c2 + dir).replace(/[^0-9a-f]/gi, "");
  if (!REG[id]) {
    const [x2, y2] = dir === "v" ? [0, 1] : dir === "h" ? [1, 0] : [1, 1];
    REG[id] = `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    document.getElementById("gdefs").innerHTML = Object.values(REG).join("");
  }
  return `url(#${id})`;
}
function hex(c) { return c; }
function shade(c, k) { // k>0 darker, k<0 lighter
  const n = parseInt(c.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = k < 0 ? 255 : 0, a = Math.abs(k);
  r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---------- character ----------
function kid(o) {
  const { x, y, h, t = 0, skin = "#f4c096", top = "#24a89e", pants = "#222a54", hairC = "#2a1c18", hair = "cap", capC = "#d6323e",
    mood = "smile", look = [0, 0], armL = "down", armR = "down", logo = false, shades = false, glasses = false, tie = null, whistle = false,
    track = false, bounce = 1, phase = 0, flip = 1 } = o;
  const u = h / 10;
  const bob = Math.sin(t * 6 + phase) * 0.1 * bounce;
  const topL = G(shade(top, -0.18), top, "h"), topD = shade(top, 0.22);
  const skinG = G(shade(skin, -0.12), shade(skin, 0.08), "d");
  let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(u * flip)} ${f(u)})">`;
  s += `<ellipse cx="0" cy="0.15" rx="3" ry="0.5" fill="#000" opacity=".2" filter="url(#blur6)"/>`;
  s += `<g transform="translate(0 ${f(bob)})">`;
  // legs
  for (const sx of [-1, 1]) {
    const lx = sx * 0.85;
    s += `<rect x="${f(lx - 0.45)}" y="-3.7" width="0.9" height="3.3" rx="0.3" fill="${sx < 0 ? pants : shade(pants, 0.18)}"/>`;
    s += `<path d="M${f(lx - 0.8)} -0.55 Q${f(lx - 0.8)} -0.9 ${f(lx - 0.35)} -0.95 L${f(lx + 0.4)} -0.95 Q${f(lx + 0.85)} -0.85 ${f(lx + 0.85)} -0.2 L${f(lx + 0.85)} 0.05 L${f(lx - 0.8)} 0.05Z" fill="#f4f5fa"/>`;
    s += `<rect x="${f(lx - 0.8)}" y="-0.15" width="1.65" height="0.22" rx="0.1" fill="#8fdc5a"/>`;
  }
  // arms (behind torso for down poses)
  const arm = (side, mode) => {
    const sx = side * 1.85, sy = -5.75; let ex, ey, cx, cy;
    const w = Math.sin(t * 9) * 0.3;
    switch (mode) {
      case "up": ex = sx + side * 0.9; ey = sy - 2.4 + w; cx = sx + side * 1.4; cy = sy - 1.0; break;
      case "hip": ex = sx + side * 0.9; ey = sy + 1.8; cx = sx + side * 1.5; cy = sy + 0.8; break;
      case "hold": ex = side * 0.7; ey = sy + 2.0; cx = side * 2.0; cy = sy + 1.9; break;
      case "point": ex = sx + side * 3.3; ey = sy + 0.3; cx = sx + side * 1.6; cy = sy + 0.5; break;
      case "shrug": ex = sx + side * 1.7; ey = sy + 1.2 + Math.sin(t * 7) * 0.2; cx = sx + side * 1.6; cy = sy + 0.2; break;
      default: ex = sx + side * 0.35; ey = sy + 3.0; cx = sx + side * 0.7; cy = sy + 1.4;
    }
    return `<path d="M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" stroke="${topD}" stroke-width="0.8" stroke-linecap="round" fill="none"/>` +
      `<path d="M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" stroke="${top}" stroke-width="0.66" stroke-linecap="round" fill="none"/>` +
      `<circle cx="${f(ex)}" cy="${f(ey)}" r="0.52" fill="${skinG}"/>`;
  };
  s += arm(-1, armL) + arm(1, armR);
  // torso
  s += `<path d="M-2.05 -6.0 Q-2.2 -4.2 -1.8 -3.05 L1.8 -3.05 Q2.2 -4.2 2.05 -6.0 Q0 -6.9 -2.05 -6.0Z" fill="${topL}"/>`;
  s += `<path d="M1.0 -6.5 Q2.1 -6.0 2.05 -6.0 Q2.2 -4.2 1.8 -3.05 L0.9 -3.05 Q1.5 -4.6 1.0 -6.5Z" fill="${topD}" opacity=".35"/>`;
  s += `<path d="M-1.85 -3.55 L1.85 -3.55 L1.8 -3.05 L-1.8 -3.05Z" fill="${shade(pants, 0.1)}"/>`;
  s += `<path d="M-1.0 -6.55 Q0 -5.7 1.0 -6.55" stroke="${shade(top, -0.5)}" stroke-width="0.14" fill="none" stroke-linecap="round"/>`;
  if (track) s += `<rect x="-0.1" y="-6.3" width="0.2" height="3.1" fill="#fff"/><rect x="-2.1" y="-5.0" width="4.2" height="0.18" fill="#fff" opacity=".8"/>`;
  if (logo) s += `<path d="M-0.05 -5.4 L0.8 -5.4 L0.3 -4.5 L0.95 -4.5 L-0.5 -2.9 L-0.1 -4.1 L-0.8 -4.1Z" fill="#fff"/>`;
  if (tie) s += `<path d="M-0.9 -6.3 L0 -5.4 L0.9 -6.3 L0.45 -6.45 L-0.45 -6.45Z" fill="#f6f6fa"/><path d="M-0.28 -5.45 L0.28 -5.45 L0.42 -3.6 L0 -3.2 L-0.42 -3.6Z" fill="${tie}"/>`;
  if (whistle) s += `<path d="M-0.6 -6.4 Q0 -4.9 0.6 -6.4" stroke="#e8e8ee" stroke-width="0.1" fill="none"/><ellipse cx="0" cy="-4.8" rx="0.4" ry="0.3" fill="#f0c83c"/>`;
  // neck+head
  s += `<rect x="-0.5" y="-6.9" width="1" height="0.8" fill="${shade(skin, 0.12)}"/>`;
  s += `<g transform="translate(0 -8.25)">`;
  // hair behind
  if (hair === "mohawk") for (let i = -2; i <= 2; i++) s += `<path d="M${i * 0.45 - 0.35} -1.7 Q${i * 0.45 + 0.1} -3.4 ${i * 0.45 + 0.4} -1.7Z" fill="${hairC}"/>`;
  if (hair === "bun") s += `<circle cx="0" cy="-2.3" r="0.75" fill="${hairC}"/>`;
  for (const sx of [-1, 1]) s += `<ellipse cx="${sx * 1.9}" cy="0.2" rx="0.42" ry="0.52" fill="${shade(skin, 0.1)}"/>`;
  s += `<circle cx="0" cy="0" r="1.98" fill="${skinG}"/>`;
  s += `<ellipse cx="-0.7" cy="-1.1" rx="0.7" ry="0.3" fill="#fff" opacity=".22"/>`;
  for (const sx of [-1, 1]) s += `<ellipse cx="${sx * 1.15}" cy="0.95" rx="0.42" ry="0.27" fill="#ff7878" opacity=".4"/>`;
  // hair front
  if (hair === "cap") s += `<path d="M-2.05 -0.35 Q-2.3 -3.0 0 -3.05 Q2.3 -3.0 2.05 -0.35 Q0 -0.85 -2.05 -0.35Z" fill="${G(shade(capC, -0.15), shade(capC, 0.12))}"/><path d="M-2.0 -0.55 Q0 -1.1 2.0 -0.55 L3.2 -0.45 Q3.3 -0.1 2.9 -0.05 L-2.0 -0.2Z" fill="${shade(capC, 0.25)}"/><circle cx="0" cy="-3.0" r="0.22" fill="${shade(capC, 0.25)}"/>`;
  if (hair === "side") s += `<path d="M-2.08 0.0 Q-2.4 -2.9 0.2 -3.0 Q2.4 -2.9 2.08 0 Q1.9 -1.0 1.4 -1.35 Q0 -1.0 -1.0 -1.5 Q-1.7 -1.3 -2.08 0Z" fill="${hairC}"/><ellipse cx="-0.6" cy="-2.5" rx="0.6" ry="0.16" fill="#fff" opacity=".18"/>`;
  if (hair === "bun") s += `<path d="M-2.05 -0.2 Q-2.3 -2.8 0 -2.9 Q2.3 -2.8 2.05 -0.2 Q1.0 -1.5 0 -1.3 Q-1.0 -1.5 -2.05 -0.2Z" fill="${hairC}"/>`;
  if (hair === "mohawk") s += `<path d="M-1.4 -1.2 Q0 -2.4 1.4 -1.2 Q0 -1.7 -1.4 -1.2Z" fill="${hairC}"/>`;
  if (hair === "bald") for (const sx of [-1, 1]) s += `<path d="M${sx * 1.9} -0.9 Q${sx * 2.3} -0.2 ${sx * 1.95} 0.5 Q${sx * 1.7} -0.2 ${sx * 1.9} -0.9Z" fill="#d6d6dc"/>`;
  // eyes
  const ey = 0.05;
  if (shades) {
    s += `<rect x="-1.4" y="${ey - 0.45}" width="1.3" height="0.95" rx="0.32" fill="#14141e"/><rect x="0.1" y="${ey - 0.45}" width="1.3" height="0.95" rx="0.32" fill="#14141e"/><rect x="-0.12" y="${ey - 0.25}" width="0.24" height="0.14" fill="#14141e"/><path d="M-1.1 ${ey - 0.2} L-0.6 ${ey - 0.2}" stroke="#7a8ac8" stroke-width="0.1" stroke-linecap="round"/>`;
  } else {
    for (const sx of [-0.56, 0.56]) {
      s += `<ellipse cx="${sx}" cy="${ey}" rx="0.5" ry="0.56" fill="#fff"/><circle cx="${f(sx + look[0] * 0.22)}" cy="${f(ey + look[1] * 0.2)}" r="0.18" fill="#1c1616"/>`;
      if (glasses) s += `<circle cx="${sx}" cy="${ey}" r="0.68" fill="#bfe4ff" opacity=".2" stroke="#32324e" stroke-width="0.1"/>`;
    }
    if (glasses) s += `<path d="M-0.1 ${ey} L0.1 ${ey}" stroke="#32324e" stroke-width="0.1"/>`;
  }
  // mouth + brows
  const mc = "#8c463c";
  const my = 1.15;
  if (mood === "smile") s += `<path d="M-0.62 ${my - 0.3} Q0 ${my + 0.35} 0.62 ${my - 0.3}" stroke="${mc}" stroke-width="0.11" fill="none" stroke-linecap="round"/>`;
  if (mood === "flat") s += `<path d="M-0.5 ${my} L0.5 ${my}" stroke="${mc}" stroke-width="0.12" stroke-linecap="round"/>`;
  if (mood === "wow") s += `<ellipse cx="0" cy="${my}" rx="0.22" ry="0.32" fill="#78283a"/>`;
  if (mood === "eat") s += `<ellipse cx="0" cy="${my}" rx="0.42" ry="${0.25 + 0.14 * Math.abs(Math.sin(t * 8))}" fill="#78283a"/>`;
  if (mood === "sad") s += `<path d="M-0.6 ${my + 0.4} Q0 ${my - 0.2} 0.6 ${my + 0.4}" stroke="${mc}" stroke-width="0.12" fill="none" stroke-linecap="round"/>`;
  if (mood === "shout") { const mo = 0.4 + 0.22 * Math.abs(Math.sin(t * 12)); s += `<ellipse cx="0" cy="${my}" rx="0.66" ry="${mo}" fill="#78283a"/><ellipse cx="0" cy="${my + mo * 0.55}" rx="0.4" ry="${mo * 0.38}" fill="#ee6e7a"/>`; }
  if (["shout", "flat", "sad"].includes(mood) && !shades) {
    const up = mood === "sad" ? 0.7 : 0.95;
    s += `<path d="M-1.25 ${-up} L-0.25 -0.75" stroke="#46302a" stroke-width="0.15" stroke-linecap="round"/><path d="M0.25 -0.75 L1.25 ${-up}" stroke="#46302a" stroke-width="0.15" stroke-linecap="round"/>`;
  }
  s += `</g></g></g>`;
  return s;
}

function catSvg(x, y, sc, t, mouth) {
  const c = "#ffa84b", d = "#e27c2d", tail = Math.sin(t * 5) * 0.4;
  let s = `<g transform="translate(${x} ${y}) scale(${sc})">`;
  s += `<ellipse cx="0" cy="1.35" rx="2.6" ry="0.4" fill="#000" opacity=".2" filter="url(#blur6)"/>`;
  s += `<path d="M1.6 -0.4 Q3.0 -0.8 ${f(2.7 + tail * 0.3)} ${f(-1.6 + tail)} Q${f(2.5 + tail * 0.3)} -2.4 ${f(2.2 + tail * 0.4)} ${f(-2.4 + tail)}" stroke="${c}" stroke-width="0.7" stroke-linecap="round" fill="none"/>`;
  s += `<ellipse cx="0" cy="-0.4" rx="2.0" ry="1.55" fill="${G("#ffbe6a", c)}"/><ellipse cx="0.4" cy="0" rx="1.4" ry="1.0" fill="#ffd9a0"/>`;
  s += `<ellipse cx="-1.0" cy="1.0" rx="0.6" ry="0.35" fill="${c}"/><ellipse cx="1.0" cy="1.0" rx="0.6" ry="0.35" fill="${c}"/>`;
  const hy = -2.1;
  s += `<path d="M-1.55 ${hy - 0.4} L-1.4 ${hy - 2.1} L-0.3 ${hy - 1.2}Z" fill="${c}"/><path d="M1.55 ${hy - 0.4} L1.4 ${hy - 2.1} L0.3 ${hy - 1.2}Z" fill="${c}"/>`;
  s += `<path d="M-1.35 ${hy - 0.7} L-1.28 ${hy - 1.6} L-0.7 ${hy - 1.1}Z" fill="#ff96a2"/><path d="M1.35 ${hy - 0.7} L1.28 ${hy - 1.6} L0.7 ${hy - 1.1}Z" fill="#ff96a2"/>`;
  s += `<ellipse cx="0" cy="${hy}" rx="1.75" ry="1.4" fill="${G("#ffbe6a", c)}"/>`;
  for (const i of [-1, 1]) s += `<path d="M${i * 0.5} ${hy - 1.1} L${i * 0.4} ${hy - 0.6}" stroke="${d}" stroke-width="0.2" stroke-linecap="round"/><ellipse cx="${i * 0.78}" cy="${hy - 0.1}" rx="0.4" ry="0.5" fill="#cdf578" stroke="#222" stroke-width="0.06"/><ellipse cx="${i * 0.78}" cy="${hy - 0.1}" rx="0.1" ry="0.43" fill="#151515"/>`;
  s += `<path d="M-0.2 ${hy + 0.35} L0.2 ${hy + 0.35} L0 ${hy + 0.6}Z" fill="#f0788a"/>`;
  if (mouth) s += `<ellipse cx="0" cy="${hy + 0.95}" rx="0.45" ry="0.38" fill="#78283a"/>`;
  else s += `<path d="M-0.4 ${hy + 0.7} Q0 ${hy + 1.0} 0.4 ${hy + 0.7}" stroke="#8c463c" stroke-width="0.07" fill="none"/>`;
  for (const i of [-1, 1]) for (const k of [-0.1, 0.25]) s += `<path d="M${i * 0.8} ${hy + 0.55 + k} L${i * 2.2} ${hy + 0.35 + 2 * k}" stroke="#fff" stroke-width="0.05"/>`;
  return s + `</g>`;
}

// ---------- scanner & bits ----------
function scanner(x, y, k, label, val, col, state, t = 0) {
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
  s += `<ellipse cx="0" cy="540" rx="130" ry="18" fill="#000" opacity=".22" filter="url(#blur6)"/>`;
  s += `<rect x="-18" y="170" width="36" height="360" rx="8" fill="${G("#8a94b0", "#6a7390", "h")}"/><rect x="-90" y="500" width="180" height="40" rx="14" fill="#5a6482"/>`;
  s += `<rect x="-135" y="-20" width="270" height="240" rx="26" fill="${G("#7a86ac", "#3c4668")}" stroke="#c8d2ee" stroke-width="5"/>`;
  s += `<rect x="-112" y="4" width="224" height="192" rx="16" fill="#0a181e"/><rect x="-112" y="4" width="224" height="192" rx="16" fill="url(#scan)"/>`;
  s += `<rect x="-112" y="4" width="224" height="60" rx="16" fill="#fff" opacity=".05"/>`;
  s += `<text x="0" y="36" font-size="17" text-anchor="middle" fill="#78ffbe">${label}</text>`;
  if (state === "busy") for (let i = 0; i < 8; i++) { const a = t * 8 + i * Math.PI / 4, r = 6 + 5 * (((i - t * 8) % 8 + 8) % 8) / 8; s += `<circle cx="${f(Math.cos(a) * 34)}" cy="${f(120 + Math.sin(a) * 34)}" r="${f(r * 0.8)}" fill="#78ffbe"/>`; }
  else if (state === "err") s += `<text x="0" y="118" font-size="46" text-anchor="middle" fill="#ff5050">ERROR</text><text x="0" y="168" font-size="17" text-anchor="middle" fill="#ffaaaa">${val}</text>`;
  else s += `<text x="0" y="${val.length < 4 ? 138 : 132}" font-size="${val.length < 4 ? 78 : 54}" text-anchor="middle" fill="${col}">${val}</text>`;
  [["#ff5a5a", "err"], ["#ffd246", "busy"], ["#6ee678", "ok"]].forEach(([c, st], i) => {
    const on = state === st; s += `<circle cx="${-40 + i * 40}" cy="-38" r="11" fill="${on ? c : "#3c3c4b"}"/>` + (on ? `<circle cx="${-40 + i * 40}" cy="-38" r="18" fill="${c}" opacity=".25" filter="url(#blur6)"/>` : "");
  });
  return s + `</g>`;
}
function badge(x, y, val, lt, col = "#ff5a5a", size = 1) {
  const s = popS(lt) * size; if (s <= 0.05) return "";
  return `<g transform="translate(${x} ${y}) scale(${f(s)})"><rect x="-78" y="-40" width="156" height="80" rx="20" fill="#121630" stroke="#ffd246" stroke-width="5"/><text x="0" y="16" font-size="46" text-anchor="middle" fill="${col}">${val}</text></g>`;
}
function rrect(x, y, w, h, r, fill, extra = "") { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`; }

// ---------- backgrounds ----------
function bgHall(top = "#ffe8a8", floor = "#bf8a5c", lock = "#4678c3") {
  let s = rrect(0, 0, W, 1000, 0, G(top, shade(top, 0.05)));
  s += rrect(0, 0, W, 210, 0, shade(top, 0.08));
  for (let i = 0; i < 9; i++) {
    const c = i % 2 ? shade(lock, 0.06) : lock;
    s += `<rect x="${i * 82 + 6}" y="300" width="70" height="580" rx="6" fill="${G(shade(c, -0.12), shade(c, 0.12), "h")}"/>`;
    s += `<rect x="${i * 82 + 24}" y="345" width="34" height="34" rx="3" fill="${shade(c, 0.3)}"/><rect x="${i * 82 + 24}" y="660" width="34" height="34" rx="3" fill="${shade(c, 0.3)}"/>`;
    s += `<rect x="${i * 82 + 32}" y="560" width="6" height="40" rx="3" fill="#dfe6f4"/>`;
  }
  s += rrect(0, 880, W, 120, 0, shade(top, 0.12));
  s += rrect(0, 1000, W, 280, 0, G(floor, shade(floor, 0.2)));
  for (let i = -2; i < 12; i++) s += `<path d="M${i * 90} 1000 L${i * 90 + 30} 1000 L${i * 90 - 100} 1280 L${i * 90 - 130} 1280Z" fill="${shade(floor, 0.1)}" opacity=".6"/>`;
  s += rrect(0, 994, W, 14, 0, shade(floor, 0.3));
  return s;
}
function bgRoom(top, bot, accent) {
  let s = rrect(0, 0, W, 1280, 0, G(top, bot));
  s += rrect(0, 140, W, 10, 0, accent);
  s += rrect(0, 1060, W, 220, 0, shade(bot, 0.3));
  for (const x of [60, 480]) s += `<rect x="${x}" y="280" width="180" height="240" rx="10" fill="${shade(top, 0.3)}" stroke="#e6be5a" stroke-width="6"/>`;
  ["#ffb432", "#32c8ff", "#ff5aa0", "#3cc86e"].forEach((c, i) => s += `<rect x="${420 + i * 52}" y="300" width="40" height="90" rx="4" fill="${c}"/>`);
  return s;
}

// ---------- shots ----------
const HERO = { top: "#24a89e", hair: "cap", capC: "#d6323e", logo: true, hairC: "#2a1c18" };
const shots = [
 [0.0, 2.0, (t, lt) => {
   let s = rrect(0, 0, W, 1000, 0, G("#8bcdff", "#cdebff"));
   s += `<circle cx="590" cy="170" r="70" fill="#fff0a0"/><circle cx="590" cy="170" r="110" fill="#fff0a0" opacity=".25" filter="url(#blur14)"/>`;
   for (const [cx, cy] of [[130, 190], [420, 130]]) s += `<ellipse cx="${cx}" cy="${cy}" rx="70" ry="30" fill="#fff"/><ellipse cx="${cx + 50}" cy="${cy + 8}" rx="50" ry="24" fill="#fff"/>`;
   s += `<rect x="40" y="290" width="640" height="720" fill="${G("#cc6450", "#b0503e", "h")}"/><rect x="40" y="280" width="640" height="30" fill="#963c34"/>`;
   for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) s += `<rect x="${80 + c * 120}" y="${440 + r * 150}" width="80" height="100" rx="6" fill="${G("#cdeeff", "#9dd2f4")}" stroke="#f4f4f4" stroke-width="5"/>`;
   s += `<rect x="140" y="330" width="440" height="75" rx="14" fill="#284687" stroke="#fff" stroke-width="5"/><text x="360" y="382" font-size="44" text-anchor="middle" fill="#fff">ШКОЛА №7</text>`;
   s += rrect(0, 1000, W, 280, 0, "#70c07a") + rrect(0, 1050, W, 230, 0, "#babac6");
   s += rrect(270, 640, 180, 370, 10, "#734834") + rrect(285, 660, 150, 350, 8, "#3e2a26");
   s += scanner(175, 640, 0.8, "АУРА-СКАНЕР", "...", "#78ffbe", "busy", t);
   s += kid({ ...HERO, x: 540, y: 1185, h: 480, t, mood: "smile", armR: "up", look: [-1, 0], phase: 0.5 });
   return s; }],
 [2.0, 3.4, (t, lt) => bgHall() + scanner(150, 640, 0.85, "АУРА-СКАНЕР", "...", "#78ffbe", "busy", t) +
   kid({ x: 450 + 250 * (1 - ease(lt / 0.9)), y: 1190, h: 500, t, top: "#78be82", pants: "#46466b", hair: "side", glasses: true, mood: "smile", armL: "hold", armR: "hold", look: [-1, 0], phase: 1 })],
 [3.4, 4.8, (t, lt) => bgRoom("#6046aa", "#3c2878", "#ff69b4") +
   kid({ x: 360, y: 1520, h: 1250, t, top: "#78be82", pants: "#46466b", hair: "side", glasses: true, mood: lt < 0.8 ? "smile" : "flat", look: [1, -0.3], phase: 1 }) +
   (lt < 0.8 ? `<rect x="100" y="${f(250 + 550 * ((t * 2.8) % 1))}" width="520" height="8" rx="4" fill="#8cffc8"/>` : "") + badge(360, 190, "АУРА 0", Math.max(0, lt - 0.7), "#ff5a5a", 1.5)],
 [4.8, 6.4, (t, lt) => bgHall("#ffd6c8", "#aa785a", "#c84650") + scanner(150, 640, 0.85, "АУРА-СКАНЕР", "...", "#78ffbe", "busy", t) +
   `<g transform="translate(${f(lt > 0.2 ? Math.sin(t * 40) * 5 : 0)} 0)">` + kid({ x: 470, y: 1190, h: 520, t, top: "#dc3c3c", pants: "#c83237", hair: "side", mood: "shout", whistle: true, track: true, armL: "hip", armR: "up", bounce: 1.6, phase: 2 }) + `</g>` +
   (lt > 0.2 ? [0, 1, 2, 3, 4].map(i => { const a = -0.7 + i * 0.35; return `<path d="M${f(470 + Math.cos(a) * 200)} ${f(730 + Math.sin(a) * 90)} L${f(470 + Math.cos(a) * 270)} ${f(730 + Math.sin(a) * 120)}" stroke="#ff783c" stroke-width="8" stroke-linecap="round"/>`; }).join("") + `<text x="600" y="520" font-size="44" text-anchor="middle" fill="#ff5a3c" filter="url(#sub)">ЭЭЭЙ!</text>` : "")],
 [6.4, 7.8, (t, lt) => bgRoom("#d23c46", "#8c1e32", "#ffbe46") +
   kid({ x: 360, y: 1520, h: 1250, t, top: "#dc3c3c", pants: "#c83237", hair: "side", mood: "shout", whistle: true, track: true, bounce: 2, phase: 2 }) +
   (lt < 1 ? [0, 1, 2, 3, 4, 5, 6].map(i => { const a = Math.PI + (i - 3) * 0.25; return `<path d="M${f(360 + Math.cos(a) * 330)} ${f(560 + Math.sin(a) * 300)} L${f(360 + Math.cos(a) * 420)} ${f(560 + Math.sin(a) * 380)}" stroke="#ffd25a" stroke-width="10" stroke-linecap="round"/>`; }).join("") : "") + badge(360, 150, "0", Math.max(0, lt - 1), "#ff5a5a", 1.6)],
 [7.8, 9.6, (t, lt) => bgHall("#d6e6f5", "#96786a", "#3c5a96") + scanner(150, 640, 0.85, "АУРА-СКАНЕР", "...", "#78ffbe", "busy", t) +
   kid({ x: 470, y: 1190, h: 520, t, top: "#282c42", pants: "#282c42", skin: "#f5c8a0", hair: "bald", tie: "#cd2834", mood: "flat", armL: "hip", armR: "hip", bounce: 0.4, phase: 3, look: [-1, 0] })],
 [9.6, 11.4, (t, lt) => { const fl = 0.5 + 0.5 * Math.sin(t * 10); return bgRoom(fl > 0.5 ? "#961428" : "#3c0a14", "#280610", "#ff3c46") +
   `<g transform="translate(${f(Math.sin(t * 50) * 5)} 0)">` + scanner(360, 200, 2.2, "АУРА-СКАНЕР", "-100", "#ff3c3c", "ok", t) + `</g>` +
   (Math.floor(t * 4) % 2 === 0 ? `<text x="360" y="1000" font-size="54" text-anchor="middle" fill="#ff7878" filter="url(#sub)">АУРА ПАДАЕТ!</text>` : ""); }],
 [11.4, 13.0, (t, lt) => {
   let s = rrect(0, 0, W, 1280, 0, G("#96cdfa", "#d2ebff"));
   s += `<rect x="70" y="130" width="580" height="670" rx="20" fill="#fff" stroke="#cea470" stroke-width="20"/><rect x="92" y="152" width="263" height="626" rx="8" fill="${G("#a8d6fc", "#7ec0f4")}"/><rect x="365" y="152" width="263" height="626" rx="8" fill="${G("#a8d6fc", "#7ec0f4")}"/>`;
   s += `<rect x="120" y="560" width="70" height="218" fill="#bccde1"/><rect x="520" y="480" width="70" height="298" fill="#aabcd7"/>`;
   s += rrect(0, 760, W, 80, 0, "#c88c5c") + rrect(0, 840, W, 440, 0, G("#b07850", "#8c5a3c"));
   s += catSvg(360, 860, 105, t, lt > 0.35 && lt < 1.2);
   if (lt > 0.35 && lt < 1.4) { const k = popS(lt, 0.35); s += `<g transform="translate(360 330) scale(${f(k)})"><rect x="-130" y="-60" width="260" height="120" rx="28" fill="#fff" stroke="#28283c" stroke-width="5"/><path d="M-30 55 L15 55 L-10 112Z" fill="#fff"/><text x="0" y="22" font-size="62" text-anchor="middle" fill="#28283c">МЯУ</text></g>`; }
   return s; }],
 [13.0, 14.0, (t, lt) => rrect(0, 0, W, 1280, 0, G("#96cdfa", "#d2ebff")) + rrect(0, 760, W, 80, 0, "#c88c5c") + rrect(0, 840, W, 440, 0, "#b07850") +
   scanner(170, 330, 1.0, "АУРА-СКАНЕР", "0", "#ff5a5a", "ok", t) + catSvg(500, 900, 85, t, false) + badge(500, 520, "0", lt, "#ff5a5a", 1.5)],
 [14.0, 16.2, (t, lt) => {
   let s = bgHall("#e8d8ff", "#966e8c", "#6e50be");
   const P = [[110, "#e8508e", "mohawk", "up", "hip", "#2a1c18"], [270, "#46b67a", "cap", "hip", "hip", "#2a1c18"], [430, "#fab034", "bun", "up", "down", "#cd7d3e"], [590, "#5c5cde", "side", "hip", "up", "#2a1c18"]];
   P.forEach(([x, c, hs, al, ar, hc], i) => { const k = ease((lt - i * 0.3) / 0.35); s += kid({ x, y: 1230 + 60 * (1 - k), h: 400, t, top: c, pants: "#323252", hair: hs, hairC: hc, capC: "#35c27a", shades: true, mood: "flat", armL: al, armR: ar, bounce: 0.7, phase: i }); });
   P.forEach(([x], i) => s += badge(x, 770, "0", Math.max(0, lt - 0.4 - i * 0.4), "#ff5a5a", 0.9));
   return s; }],
 [16.2, 17.9, (t, lt) => bgRoom("#5a3caa", "#37237a", "#6ee6ff") + kid({ x: 360, y: 1520, h: 1250, t, top: "#5c5cde", pants: "#323252", hair: "side", shades: true, mood: "flat", armR: "up", phase: 1 }) +
   [0, 1, 2].map(i => badge(130 + i * 230, 230 + (i % 2) * 70, "0", Math.max(0, lt - 0.1 - i * 0.35), "#ff5a5a", 1.15)).join("")],
 [17.9, 19.2, (t, lt) => bgRoom("#3c78d2", "#244696", "#ffd246") + kid({ ...HERO, x: 360, y: 1520, h: 1250, t, mood: "eat", armL: "hold", armR: "hold", look: [0, 1], phase: 0.5 }) +
   `<ellipse cx="360" cy="${1520 - 1250 * 0.52}" rx="150" ry="100" fill="${G("#f4bb68", "#e8ae60")}"/><ellipse cx="360" cy="${1520 - 1250 * 0.52 - 30}" rx="130" ry="55" fill="#fad28e"/>`],
 [19.2, 20.4, (t, lt) => bgRoom("#1e2846", "#0f1428", "#ffd246") + scanner(360, 200, 2.2, "АУРА-СКАНЕР", "...", "#78ffbe", "busy", t) +
   [0, 1, 2].map(i => `<text x="${150 + i * 210}" y="${f(920 - ((lt * 80 + i * 40) % 120))}" font-size="90" text-anchor="middle" fill="#ffd640">?</text>`).join("")],
 [20.4, 21.8, (t, lt) => { const fl = 0.5 + 0.5 * Math.sin(t * 12); return bgRoom(fl > 0.5 ? "#a01228" : "#460810", "#230510", "#ff3c46") +
   `<g transform="translate(${f(lt < 0.7 ? Math.sin(t * 55) * 6 : 0)} 0)">` + scanner(360, 200, 2.2, "АУРА-СКАНЕР", "ПРОВЕРЬТЕ РОЗЕТКУ", "#ff7878", "err", t) + `</g>` +
   (Math.floor(t * 5) % 2 === 0 ? `<text x="360" y="1000" font-size="120" text-anchor="middle" fill="#ff5a5a">!</text>` : ""); }],
 [21.8, 23.1, (t, lt) => bgHall("#fae2e2", "#aa785a", "#506eb4") +
   `<rect x="520" y="760" width="130" height="140" rx="16" fill="#fff" stroke="#bebec8" stroke-width="5"/><circle cx="568" cy="825" r="9" fill="#323232"/><circle cx="602" cy="825" r="9" fill="#323232"/>` +
   scanner(200, 520, 0.95, "АУРА-СКАНЕР", "OFF", "#828290", "ok", t) +
   `<path d="M215 1060 Q330 1100 430 1070" stroke="#1e1e1e" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="430" y="1050" width="55" height="40" rx="8" fill="#1e1e1e"/>` +
   kid({ ...HERO, x: 420, y: 1190, h: 460, t, mood: "wow", armR: "point", look: [1, 1], phase: 0.5 }) +
   (Math.floor(t * 4) % 2 === 0 ? `<text x="530" y="960" font-size="40" text-anchor="middle" fill="#ff6464" filter="url(#sub)">ЗДЕСЬ!</text>` : "")],
 [23.1, 25.3, (t, lt) => { const k = ease((lt - 0.2) / 0.9), on = lt > 1.1, px = 430 + 70 * k, py = 1070 - 240 * k;
   let s = bgHall("#fae2e2", "#aa785a", "#506eb4");
   s += `<rect x="520" y="760" width="130" height="140" rx="16" fill="#fff" stroke="#bebec8" stroke-width="5"/><circle cx="568" cy="825" r="9" fill="#323232"/><circle cx="602" cy="825" r="9" fill="#323232"/>`;
   s += scanner(200, 520, 0.95, "АУРА-СКАНЕР", on ? "100" : "OFF", on ? "#78ffbe" : "#828290", "ok", t);
   s += `<path d="M215 1060 Q${f(px - 80)} ${f(py + 40)} ${f(px - 10)} ${f(py + 6)}" stroke="#1e1e1e" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="${f(px - 20)}" y="${f(py - 20)}" width="46" height="40" rx="8" fill="#1e1e1e"/>`;
   s += kid({ ...HERO, x: 420, y: 1190, h: 460, t, mood: on ? "smile" : "flat", armR: k < 1 ? "up" : "down", look: [1, -0.5], phase: 0.5 });
   if (on) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 2; s += `<circle cx="${f(200 + Math.cos(a) * 200)}" cy="${f(520 + Math.sin(a) * 140)}" r="7" fill="#ffe664"/>`; }
   return s; }],
 [25.3, 27.9, (t, lt) => {
   let s = rrect(0, 0, W, 1280, 0, G("#1e3264", "#121c40")) + rrect(0, 140, W, 10, 0, "#6ee6ff");
   const cx = 360, cy = 300;
   for (const r of [250, 170, 90]) s += `<path d="M${f(cx - r * 0.707)} ${f(cy + 80 - r * 0.707)} A${r} ${r} 0 0 1 ${f(cx + r * 0.707)} ${f(cy + 80 - r * 0.707)}" stroke="#5f6982" stroke-width="34" fill="none" stroke-linecap="round"/>`;
   s += `<circle cx="${cx}" cy="${cy + 90}" r="22" fill="#5f6982"/>`;
   const k = popS(lt, 0.2); if (k > 0.05) s += `<path d="M${f(cx - 190 * k)} ${f(cy - 130 * k)} L${f(cx + 190 * k)} ${f(cy + 170 * k)}" stroke="#f04650" stroke-width="30" stroke-linecap="round"/>`;
   s += `<text x="360" y="580" font-size="80" text-anchor="middle" fill="#ff646e" filter="url(#sub)">Wi-Fi: 0</text>`;
   s += kid({ ...HERO, x: 360, y: 1400, h: 520, t, mood: "sad", armL: "shrug", armR: "shrug", phase: 0.5 });
   return s; }],
];

// ---------- overlay ----------
function wordsTiming(si) {
  const [, , s0, s1, txt] = SC[si]; const ws = txt.split(" ");
  const wt = ws.map(w => w.length + (/[.:,]$/.test(w) ? 3 : 0)); const tot = wt.reduce((a, b) => a + b, 0);
  let t = s0; return ws.map((w, i) => { const d = (s1 - s0) * wt[i] / tot; const r = [w, t, t + d]; t += d; return r; });
}
function groups(ws) {
  const gs = []; let cur = [], n = 0;
  for (const w of ws) {
    if (cur.length && (n + w.length > 17 || cur.length >= 3)) { gs.push(cur); cur = []; n = 0; }
    cur.push(w); n += w.length + 1; if (/[.:]$/.test(w)) { gs.push(cur); cur = []; n = 0; }
  }
  if (cur.length) gs.push(cur); return gs;
}
function hud(t, si) {
  let s = `<rect x="100" y="38" width="520" height="98" rx="24" fill="#161c34" stroke="#ffcd46" stroke-width="4"/>`;
  s += `<rect x="120" y="56" width="66" height="62" rx="16" fill="${G("#ffd96a", "#ffbe2e")}"/><rect x="140" y="66" width="26" height="26" rx="6" fill="#161c34"/><circle cx="153" cy="79" r="6" fill="#78ffbe"/><rect x="150" y="92" width="6" height="14" fill="#161c34"/><rect x="142" y="106" width="22" height="4" rx="2" fill="#161c34"/>`;
  s += `<text x="206" y="68" font-size="14" letter-spacing="3.4" fill="#ffcd46">АУРА-СКАНЕР</text><text x="206" y="112" font-size="36" fill="#fff">${SC[si][5]}</text>`;
  const sp = t >= SC[si][2] && t <= SC[si][3];
  for (let i = 0; i < 9; i++) {
    const hgt = sp ? 8 + 44 * Math.abs(Math.sin(t * 13 + i * 1.7)) * (0.5 + 0.5 * Math.sin(i * 0.9 + 1)) : 6;
    s += `<rect x="${508 + i * 11}" y="${f(87 - hgt / 2)}" width="6" height="${f(hgt)}" rx="2" fill="#3cebb0"/>`.replace("#3cebb0", "#3ceb82");
  }
  return s;
}
function subs(t, si) {
  const ws = wordsTiming(si); const gs = groups(ws.map(w => w[0]));
  let cur = -1; ws.forEach((w, i) => { if (t >= w[1] - 0.02) cur = i; });
  if (cur < 0) return "";
  let gi = 0, idx = 0; for (let g = 0; g < gs.length; g++) { if (cur < idx + gs[g].length) { gi = g; break; } idx += gs[g].length; }
  const g = gs[gi], first = idx;
  const lines = [];
  const len = g.join(" ").length;
  if (len > 14) { const h = Math.ceil(g.length / 2); lines.push([g.slice(0, h), first], [g.slice(h), first + h]); } else lines.push([g, first]);
  let s = ""; let y = 790;
  for (const [ws2, f0] of lines) {
    s += `<text x="360" y="${y}" font-size="54" text-anchor="middle" filter="url(#sub)" xml:space="preserve">` +
      ws2.map((w, j) => `<tspan fill="${f0 + j === cur ? HL[(f0 + j) % 4] : "#fff"}">${w}</tspan>`).join(`\u00a0\u00a0`) + `</text>`;
    y += 72;
  }
  return s;
}

function render(t) {
  let si = 0; SC.forEach((s, i) => { if (t >= s[0] && t < s[1]) si = i; });
  let sh = shots[0]; shots.forEach(x => { if (t >= x[0] && t < x[1]) sh = x; });
  const lt = t - sh[0];
  const z = 1 + 0.05 * clamp(lt / (sh[1] - sh[0]));
  const dx = Math.sin(t * 1.3) * 3, dy = Math.cos(t * 1.1) * 3;
  const body = sh[2](t, lt);
  document.getElementById("scene").innerHTML = `<g transform="translate(${f(360 + dx)} ${f(640 + dy)}) scale(${f(z)}) translate(-360 -640)">${body}</g><rect width="720" height="1280" fill="url(#vig)"/>`;
  document.getElementById("over").innerHTML = hud(t, si) + subs(t, si);
}
render(0);
