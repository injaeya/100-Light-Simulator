import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4188/';
const outA = process.argv[3];
const outB = process.argv[4];

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
if (outA) await page.screenshot({ path: outA });

// hash canvas pixels helper
async function canvasHash() {
  return page.evaluate(() => {
    const c = document.querySelector('canvas');
    const t = document.createElement('canvas');
    t.width = 160; t.height = 100;
    t.getContext('2d').drawImage(c, 0, 0, 160, 100);
    const d = t.getContext('2d').getImageData(0, 0, 160, 100).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 40) h = (h * 31 + d[i]) >>> 0;
    return h;
  });
}

// drag on the 3D viewport center to orbit
const box = { x: 720, y: 450 };
await page.mouse.move(box.x, box.y);
await page.mouse.down();
for (let i = 0; i < 12; i++) {
  await page.mouse.move(box.x - i * 12, box.y + i * 5);
  await page.waitForTimeout(20);
}
await page.mouse.up();
await page.waitForTimeout(1500);
if (outB) await page.screenshot({ path: outB });

console.log('ERRORS', errors.length ? errors.join(' | ') : 'none');
await browser.close();
