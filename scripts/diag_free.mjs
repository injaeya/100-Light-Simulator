import { chromium } from 'playwright';
const url = process.argv[2], out = process.argv[3];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.getByText('자유뷰', { exact: true }).click();
await page.waitForTimeout(1000);
// 뷰포트 중앙에서 휠 줌아웃
const cx = 700, cy = 450;
// 궤도만 회전(위에서 비스듬히), 휠 줌 없음
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 0; i < 12; i++) { await page.mouse.move(cx - i * 10, cy - i * 6); await page.waitForTimeout(25); }
await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log('ERRORS', errors.length ? errors.join(' | ') : 'none');
await browser.close();
