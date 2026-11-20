const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [, , startS, stepS, totalS, outDir, onlyS] = process.argv;
  const start = +startS, step = +stepS, total = +totalS;
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await p.waitForTimeout(300);
  const list = onlyS ? onlyS.split(',').map(Number) : null;
  if (list) {
    for (const t of list) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `${outDir}/t_${t}.png` }); }
  } else {
    for (let n = start; n < total; n += step) {
      await p.evaluate(t => render(t), n / 30);
      await p.screenshot({ path: `${outDir}/${String(n).padStart(4, '0')}.png` });
    }
  }
  await b.close();
})();
