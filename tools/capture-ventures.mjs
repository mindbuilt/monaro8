// Re-capture each venture's live site as /assets/ventures/<id>.webp (1200 px wide).
//   node tools/capture-ventures.mjs            all ventures
//   node tools/capture-ventures.mjs zerra      one venture
// Then set "captured" in tools/data/ventures.json if you want the caption date to change, and run build.mjs.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ventures } = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/data/ventures.json'), 'utf8'));
const only = process.argv[2];
const browser = await chromium.launch();
for (const v of ventures.filter(v => !only || v.id === only)) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(v.capture?.url || v.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  if (v.capture?.dismiss) { const b = page.getByRole('button', { name: new RegExp(v.capture.dismiss, 'i') }); if (await b.count()) await b.first().click(); await page.waitForTimeout(600); }
  const png = (await page.screenshot()).toString('base64');
  const webp = await page.evaluate(async src => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = 1200; c.height = Math.round(img.height * 1200 / img.width);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', 0.8).split(',')[1];
  }, png);
  const out = path.join(ROOT, 'assets/ventures', `${v.id}.webp`);
  fs.writeFileSync(out, Buffer.from(webp, 'base64'));
  console.log('captured', v.id, Math.round(fs.statSync(out).size / 1024) + ' KB');
  await page.close();
}
await browser.close();
