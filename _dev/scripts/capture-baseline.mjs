// Captures the existing sections' text, screenshots and header widths from the
// page served on http://localhost:4174. Run once on the unchanged page (PF1 Step 1).
// Usage: node scripts/capture-baseline.mjs <label>   (label: before | after)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] || 'before';
const base = process.env.BASE_URL || 'http://localhost:4174/';
const shotDir = join(here, '..', 'screenshots', label);
mkdirSync(shotDir, { recursive: true });

export const SECTIONS = {
  header: '.site-header',
  hero: '.hero',
  about: '#about',
  team: '#team',
  future: '#future',
  footer: 'footer.site-footer',
};

const browser = await chromium.launch();
const out = { widths: {} };
for (const width of [360, 390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  if (width === 1440) {
    out.sections = await page.evaluate((sel) => {
      const norm = (s) => s.replace(/\s+/g, ' ').trim();
      return Object.fromEntries(
        Object.entries(sel).map(([k, s]) => [k, norm(document.querySelector(s).textContent)]),
      );
    }, SECTIONS);
  }
  out.widths[width] = await page.evaluate(() => {
    const inner = document.querySelector('.header-inner');
    const nav = document.querySelector('.nav');
    return {
      viewport: window.innerWidth,
      headerInnerScrollWidth: inner.scrollWidth,
      navRight: Math.round(nav.getBoundingClientRect().right * 10) / 10,
      pageScrollWidth: document.documentElement.scrollWidth,
    };
  });
  await page.screenshot({ path: join(shotDir, `home-${width}.png`), fullPage: true });
  await page.close();
}
await browser.close();

if (label === 'before') {
  writeFileSync(
    join(here, '..', 'tests', 'fixtures', 'sections-before.json'),
    JSON.stringify(out.sections, null, 2) + '\n',
  );
}
console.log(JSON.stringify(out.widths, null, 2));
