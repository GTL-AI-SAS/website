// Measures the header's natural width (logo + nav at max-content + container padding)
// and whether any nav link wraps. Usage: node scripts/measure-header.mjs
import { chromium } from '@playwright/test';
const base = process.env.BASE_URL || 'http://localhost:4174/';
const browser = await chromium.launch();
const res = {};
for (const width of [360, 390, 414, 430, 479, 480]) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  res[width] = await page.evaluate(() => {
    const wraps = (a) => { const h = a.offsetHeight; const w = a.style.whiteSpace; a.style.whiteSpace = 'nowrap'; const one = a.offsetHeight; a.style.whiteSpace = w; return h > one; };
    const inner = document.querySelector('.header-inner');
    const logo = inner.querySelector('.logo');
    const nav = inner.querySelector('.nav');
    const cs = getComputedStyle(inner);
    const visible = [...nav.querySelectorAll('a')].filter((a) => getComputedStyle(a).display !== 'none');
    const clone = nav.cloneNode(true);
    clone.style.cssText = 'position:absolute;visibility:hidden;width:max-content;white-space:nowrap';
    inner.appendChild(clone);
    const navNatural = clone.getBoundingClientRect().width;
    clone.remove();
    const gap = parseFloat(cs.columnGap) || 0;
    const natural = parseFloat(cs.paddingLeft) + logo.getBoundingClientRect().width + gap + navNatural + parseFloat(cs.paddingRight);
    return {
      links: visible.map((a) => a.textContent.trim()),
      naturalWidth: Math.round(natural * 10) / 10,
      fits: natural <= window.innerWidth,
      logoToNav: Math.round((nav.getBoundingClientRect().left - logo.getBoundingClientRect().right) * 10) / 10,
      wrappedLinks: visible.filter(wraps).map((a) => a.textContent.trim()),
      pageScrollWidth: document.documentElement.scrollWidth,
    };
  });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(res, null, 2));
