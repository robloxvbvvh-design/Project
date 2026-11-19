const { chromium } = require('playwright');
const { spawn } = require('child_process');
const FPS = 30, TOTAL = 89.6, N = Math.round(TOTAL * FPS), WORKERS = 3;
const per = Math.ceil(N / WORKERS);
async function worker(k) {
  const a = k * per, b = Math.min(N, a + per);
  const out = `/home/user/Project/episode1/build/chunk_${k}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('pageerror', k, e.message));
  await p.goto('file:///home/user/Project/episode1/build/anim.html');
  await p.waitForFunction('window.renderFrame');
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    await p.evaluate(t => window.renderFrame(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 50 === 0) console.log(`w${k} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await br.close();
  console.log(`w${k} done`);
}
Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k))).then(() => console.log('ALL DONE'));
