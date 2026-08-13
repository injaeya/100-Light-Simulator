import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shot.png';

const browser = await chromium.launch({
  args: [
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE ERROR: ' + m.text());
});
page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000); // let three render a few frames

// sample the canvas to detect all-black
const stats = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return { hasCanvas: false };
  // draw canvas into a 2d context to read pixels
  const w = 200, h = 120;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(c, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0, max = 0, nonBlack = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += lum; if (lum > max) max = lum; if (lum > 12) nonBlack++;
  }
  return {
    hasCanvas: true,
    cw: c.width, ch: c.height,
    avgLum: +(sum / (w * h)).toFixed(1),
    maxLum: max,
    nonBlackPct: +(100 * nonBlack / (w * h)).toFixed(1),
  };
});

await page.screenshot({ path: out, fullPage: false });
console.log('STATS', JSON.stringify(stats));
console.log('ERRORS', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
