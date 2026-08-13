import { chromium } from 'playwright';
const url = process.argv[2], out = process.argv[3];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
if (process.argv[4] === 'male') { await page.getByText('남성', { exact: true }).click(); await page.waitForTimeout(800); }
async function setRange(sel, val) {
  const el = page.locator(sel).first();
  await el.evaluate((node, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(node, String(v));
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }, val);
}
// 초점거리 24mm(광각), 카메라 거리 7m, 높이 2.2m
await setRange('input[type=range][min="14"][max="200"]', 24);
await page.waitForTimeout(300);
await setRange('input[type=range][min="0.5"][max="8"]', 7);
await page.waitForTimeout(300);
await setRange('input[type=range][min="0.3"][max="3"]', 2.2);
await page.waitForTimeout(1200);
await page.screenshot({ path: out });
console.log('ERRORS', errors.length ? errors.join(' | ') : 'none');
await browser.close();
