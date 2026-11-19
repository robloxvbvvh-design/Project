// Новые герои серии 2: подростки (капюшон поднят / опущен)
function teenHead(col, hair, o, girl) {
  if (o.hood) return RIG.thug.head({ c: col });
  return `<ellipse cx="0" cy="30" rx="46" ry="17" fill="${col}"/>` + face({ cx: 0, cy: 0, mouth: o.mouth || 'worry', brow: o.brow ?? -1 }) +
    (girl ? `<path d="M-40 -6 q2 -38 40 -38 q38 0 40 38 q-14 -18 -40 -16 q-26 -2 -40 16z" fill="${hair}"/><path d="M34 -20 q22 6 18 52 q-6 -26 -22 -32z" fill="${hair}"/>`
      : `<path d="M-38 -8 q4 -34 38 -34 q34 0 38 34 q-14 -16 -38 -14 q-24 -2 -38 14z" fill="${hair}"/>`);
}
RIG.teen = { w: 70, torso: '#171c29', arm: '#171c29', pants: '#171c29', skin: P.skin, shoe: '#07090f', deco: '', head: o => teenHead('#171c29', '#1d1812', o, false) };
RIG.teen2 = { w: 62, torso: '#0e121b', arm: '#0e121b', pants: '#0e121b', skin: '#d0a98a', shoe: '#07090f', deco: '', head: o => teenHead('#0e121b', '#3a2a1e', o, true) };
