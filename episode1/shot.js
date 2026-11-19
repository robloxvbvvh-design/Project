const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2160, height: 1500 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file:///home/user/Project/episode1/sheet.html');
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/home/user/Project/episode1/sheet.png' });
  await b.close();
})();
