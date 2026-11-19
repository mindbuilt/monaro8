// Render the share image for every page into /og/<slug>.png (1200×630) from og.html + the real contour data.
// Needs the site served locally: `python3 -m http.server 8787` from the repo root.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const PAGES = {
  home: ['Useful software, built in&nbsp;Cooma.', 'Independent venture builder'],
  ventures: ['Five businesses, and what each one&nbsp;fixes.', 'Ventures'],
  thesis: ['Find the problem. Build the&nbsp;fix.', 'How we work'],
  advisory: ['Independent digital and product advice for&nbsp;Canberra.', 'Digital advisory'],
  contact: ['Get in touch.', 'Contact'],
};
fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const [slug, [h, k]] of Object.entries(PAGES)) {
  await p.goto(`${BASE}/tools/og.html?h=${encodeURIComponent(h)}&k=${encodeURIComponent(k)}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.title === 'ready'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(ROOT, 'og', `${slug}.png`) }); console.log('og', slug);
}
await b.close();
