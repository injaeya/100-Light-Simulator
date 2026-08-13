import { chromium } from 'playwright';
const url = process.argv[2], out = process.argv[3], label = process.argv[4] || '카페 창가';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3500);
// 공간 select(첫 번째 select)에서 라벨로 선택
await page.locator('select').first().selectOption({ label });
await page.waitForTimeout(3500);
await page.screenshot({ path: out });
console.log('ERRORS', errors.length ? errors.join(' | ') : 'none');
await browser.close();
