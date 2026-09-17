// Renders public/og-image.png (1200x630) for link previews.
// Run with: npm run og
//
// LinkedIn, Slack and X will not render an SVG social preview, so this
// rasterises one with the Chromium that is already installed for Playwright.
// Regenerate whenever the tagline or tab list changes.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../public/og-image.png');

// Playwright may be installed globally in this environment rather than locally.
const require = createRequire(import.meta.url);
let chromium;
for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try {
    ({ chromium } = require(id));
    break;
  } catch {
    /* try the next location */
  }
}
if (!chromium) {
  console.error('Playwright not found. Install it, or run this where it is available.');
  process.exit(1);
}

const TABS = ['Regulatory Radar', 'Reg → Reqs Translator', 'Risk Triage Scorer', 'SAIF Mapper'];

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #ffffff;
    display: flex; flex-direction: column; justify-content: center;
    padding: 72px 80px;
    position: relative;
  }
  .rule { position: absolute; top: 0; left: 0; right: 0; height: 10px; background: #1a73e8; }
  h1 { font-size: 86px; font-weight: 700; color: #111827; letter-spacing: -2.5px; line-height: 1; }
  .sub { font-size: 34px; font-weight: 500; color: #374151; margin-top: 22px; }
  .tag { font-size: 24px; color: #6b7280; margin-top: 14px; max-width: 900px; line-height: 1.45; }
  .tabs { display: flex; gap: 12px; margin-top: 44px; flex-wrap: wrap; }
  .tab {
    font-size: 20px; font-weight: 500; color: #1a73e8;
    background: #e8f0fe; border-radius: 999px; padding: 11px 22px;
  }
  .foot {
    position: absolute; bottom: 56px; left: 80px; right: 80px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 20px; color: #9ca3af;
  }
</style></head>
<body>
  <div class="rule"></div>
  <h1>RegReady</h1>
  <div class="sub">AI Compliance Architecture Tool</div>
  <div class="tag">Turn AI regulation into risk classifications, engineering requirements and framework gap analysis — in seconds.</div>
  <div class="tabs">${TABS.map((t) => `<div class="tab">${t}</div>`).join('')}</div>
  <div class="foot">
    <span>reg-ready.vercel.app</span>
    <span>EU AI Act · DSA · US state AI law · NIST AI RMF · SAIF</span>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
// Fonts may be blocked offline; the fallback stack still renders legibly.
await page.waitForTimeout(1200);
const buf = await page.screenshot({ type: 'png' });
await browser.close();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, buf);
console.log(`Wrote ${OUT} (${(buf.length / 1024).toFixed(0)} KB)`);
