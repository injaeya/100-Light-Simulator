import { chromium } from 'playwright';
const url = process.argv[2], out = process.argv[3], name = process.argv[4] || '키';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);
// 조명 목록에서 해당 조명 행 클릭(선택)
await p.locator('.light-row', { hasText: name }).first().click();
await p.waitForTimeout(500);
async function setRange(sel, v) {
  await p.locator(sel).first().evaluate((n, val) => {
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(n, String(val)); n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true }));
  }, v);
}
await setRange('input[type=range][min="14"][max="200"]', 24);
await setRange('input[type=range][min="0.5"][max="8"]', 7);
await setRange('input[type=range][min="0.3"][max="3"]', 2.2);
await p.waitForTimeout(1200);
await p.screenshot({ path: out });
console.log('ERRORS', errors.length ? errors.join(' | ') : 'none');
await b.close();
