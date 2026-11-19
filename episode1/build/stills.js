const { chromium } = require('playwright');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file:///home/user/Project/episode1/build/anim.html');
  await p.waitForFunction('window.renderFrame');
  for (const t of times) {
    await p.evaluate(t => window.renderFrame(t), t);
    await p.screenshot({ path: `/home/user/Project/episode1/build/still_${t}.png` });
  }
  await b.close();
})();
