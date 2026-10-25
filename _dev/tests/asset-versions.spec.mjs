// PF3: in the browser, every local stylesheet and script a page loads is requested as <file>?v=<first 10 hex of its
// SHA-256>, the server answers each one (the query is ignored), and the files take effect. Both pages, every engine.
// No request reaches api.gtl-ai.com: the origin is blocked and asserted untouched.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForFonts } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const config = JSON.parse(readFileSync(join(here, '..', 'site-config.json'), 'utf8'));
const ORIGIN = 'http://localhost:4174';
const REAL_API = 'https://api.gtl-ai.com';
const version = (file) => createHash('sha256').update(readFileSync(join(root, file))).digest('hex').slice(0, 10);
const FORM = config.planRequestMode === 'form';
// What each page loads (document order does not matter here).
const EXPECTED = {
  '/': ['style.css', 'pricing.js', ...(FORM ? ['site-config.js', 'plan-request.js'] : [])],
  '/privacidad.html': ['style.css'],
};

test.describe('versioned asset URLs', () => {
  for (const [path, files] of Object.entries(EXPECTED)) {
    test(`${path}: every local .css/.js request carries ?v= equal to the file's hash, is answered, and takes effect`, async ({ page }) => {
      const real = [];
      page.on('request', (r) => { if (r.url().startsWith(REAL_API)) real.push(r.url()); });
      await page.route(`${REAL_API}/**`, (r) => r.abort());
      const local = [];
      page.on('response', (r) => {
        const u = new URL(r.url());
        if (u.origin === ORIGIN && /\.(css|js)$/.test(u.pathname)) local.push({ file: u.pathname.slice(1), search: u.search, status: r.status() });
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await waitForFonts(page);
      await expect.poll(() => local.map((l) => l.file).sort()).toEqual([...files].sort());
      for (const l of local) {
        expect(l.search, l.file).toBe(`?v=${version(l.file)}`);
        expect(l.search, l.file).toMatch(/^\?v=[0-9a-f]{10}$/);
        expect(l.status, l.file).toBe(200);
      }
      // The versioned URLs served the real files: the stylesheet applies and the scripts ran.
      expect(await page.evaluate(() => [...document.styleSheets].some((s) => s.href && /\/style\.css\?v=[0-9a-f]{10}$/.test(s.href)))).toBe(true);
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('.site-header')).position)).not.toBe('static');
      if (path === '/') {
        await expect(page.locator('[role="tablist"]')).toHaveCount(1); // pricing.js ran
        if (FORM) {
          expect(await page.evaluate(() => window.GTL_CONFIG && window.GTL_CONFIG.planRequestMode)).toBe('form'); // site-config.js ran
          await expect(page.locator('#planes a[data-request]').first()).toHaveAttribute('aria-haspopup', 'dialog'); // plan-request.js ran
        }
      }
      // The page's own markup carries the same stamps the browser requested.
      const stamped = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"][href], script[src]')]
        .map((el) => el.getAttribute('href') || el.getAttribute('src')).filter((v) => !/^(https?:)?\/\//.test(v)));
      expect(stamped.sort()).toEqual(files.map((f) => `${f}?v=${version(f)}`).sort());
      expect(real).toEqual([]);
    });
  }
});
