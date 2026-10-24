import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { footerEmail, loadConfig } from '../build-pricing.mjs';
import { waitForFonts } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const before = JSON.parse(readFileSync(join(here, 'fixtures', 'sections-before.json'), 'utf8'));
const shotDir = join(here, '..', 'screenshots', 'after');
const WIDTHS = [360, 390, 768, 1440];
const PACKAGES = ['agenda', 'presencia', 'pedidos', 'reservas', 'comunidad', 'a-medida'];
const SECTIONS = {
  header: '.site-header', hero: '.hero', about: '#about', team: '#team', future: '#future', footer: 'footer.site-footer',
};

async function open(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await waitForFonts(page);
}

test.describe('placement and existing content', () => {
  test('the section sits after About and before Team, and the "Planes" link reaches it', async ({ page }) => {
    await open(page);
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || s.className));
    expect(order).toEqual(['hero', 'about', 'planes', 'team', 'future']);
    const navOrder = await page.locator('.nav a').allTextContents();
    expect(navOrder.map((t) => t.trim())).toEqual(['About', 'Planes', 'Team', 'Roadmap', 'Get in Touch']);
    await page.locator('.nav a[href="#planes"]').click();
    await expect(page).toHaveURL(/#planes$/);
    await expect(page.locator('#planes-title')).toBeInViewport();
  });

  test('the existing sections\' text equals the snapshot taken before the change', async ({ page }) => {
    await open(page);
    const now = await page.evaluate((sel) => {
      const norm = (s) => s.replace(/\s+/g, ' ').trim();
      return Object.fromEntries(Object.entries(sel).map(([k, s]) => [k, norm(document.querySelector(s).textContent)]));
    }, SECTIONS);
    // The one accepted header change: the "Planes" link between About and Team.
    expect(now.header).toBe(before.header.replace('About Team', 'About Planes Team'));
    // The two accepted footer changes: the email from the config (W0) and the "Privacidad" link after it (PF2).
    expect(now.footer).toBe(before.footer.replace('garydmendez25@gmail.com', `${footerEmail(loadConfig())} Privacidad`));
    for (const key of ['hero', 'about', 'team', 'future']) expect(now[key], key).toBe(before[key]);
  });

  test('the request buttons carry their PF2 data attributes', async ({ page }) => {
    await open(page);
    await expect(page.locator('#planes a[data-package][data-tier]')).toHaveCount(5 * 3 + 1);
    await expect(page.locator('#planes a[data-package="a-medida"][data-tier="proyecto"]')).toHaveCount(1);
    await expect(page.locator('#planes a[data-bundle]')).toHaveCount(4);
    await expect(page.locator('#planes a[data-general="true"]')).toHaveCount(1);
  });
});

test.describe('tabs', () => {
  test('ARIA roles and states are right, and Agenda is the default', async ({ page }) => {
    await open(page);
    const list = page.getByRole('tablist', { name: 'Paquetes' });
    await expect(list).toBeVisible();
    const tabs = list.getByRole('tab');
    await expect(tabs).toHaveCount(6);
    for (const [i, code] of PACKAGES.entries()) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('aria-controls', `panel-${code}`);
      await expect(page.locator(`#panel-${code}`)).toHaveAttribute('role', 'tabpanel');
      await expect(page.locator(`#panel-${code}`)).toHaveAttribute('aria-labelledby', `tab-${code}`);
    }
    await expect(page.getByRole('tab', { name: 'Agenda' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Agenda' })).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('tab', { name: 'Pedidos' })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByRole('tab', { name: 'Pedidos' })).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-agenda');
  });

  test('a click selects a tab and shows only its panel', async ({ page }) => {
    await open(page);
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await expect(page.getByRole('tab', { name: 'Comunidad' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Agenda' })).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#panel-comunidad')).toBeVisible();
    await expect(page.locator('#panel-agenda')).toBeHidden();
    await expect(page.locator('#panel-comunidad')).toContainText('$2.500');
    await expect(page.locator('#panel-comunidad')).toContainText('A cotizar');
  });

  test('arrow keys, Home and End move and select (automatic activation)', async ({ page }) => {
    await open(page);
    const selected = () => page.locator('[role="tab"][aria-selected="true"]').getAttribute('id');
    const focused = () => page.evaluate(() => document.activeElement.id);
    await page.getByRole('tab', { name: 'Agenda' }).focus();
    await page.keyboard.press('ArrowRight');
    expect(await selected()).toBe('tab-presencia');
    expect(await focused()).toBe('tab-presencia');
    await expect(page.locator('#panel-presencia')).toBeVisible();
    await page.keyboard.press('End');
    expect(await selected()).toBe('tab-a-medida');
    await expect(page.locator('#panel-a-medida')).toContainText('Desde $15.000.000');
    await page.keyboard.press('ArrowRight');
    expect(await selected()).toBe('tab-agenda');
    await page.keyboard.press('ArrowLeft');
    expect(await selected()).toBe('tab-a-medida');
    await page.keyboard.press('Home');
    expect(await selected()).toBe('tab-agenda');
    await page.keyboard.press('Enter');
    expect(await selected()).toBe('tab-agenda');
    // Tab leaves the tablist for the panel content (roving tabindex).
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.closest('[role="tablist"]'))).toBeNull();
  });

  test('the FAQ opens and closes by keyboard', async ({ page }) => {
    await open(page);
    const first = page.locator('.faq-item').first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(first).not.toHaveAttribute('open', '');
    await expect(page.locator('.faq-item')).toHaveCount(6);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every package shows with its heading, and there is no tablist', async ({ page }) => {
    await open(page);
    await expect(page.locator('[role="tablist"]')).toHaveCount(0);
    await expect(page.locator('[data-tabs]')).toBeHidden();
    for (const code of PACKAGES) {
      await expect(page.locator(`#panel-${code}`)).toBeVisible();
      await expect(page.locator(`#panel-${code} h3.package-name`)).toBeVisible();
    }
  });

  test('every visible price is followed by "+ IVA"', async ({ page }) => {
    await open(page);
    const problems = await page.evaluate(() => {
      const out = [];
      const section = document.querySelector('#planes');
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      // 1. Every text containing a price sits inside a price element.
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (/\$\d/.test(n.nodeValue) && visible(n.parentElement) && !n.parentElement.closest('[data-price]')) {
          out.push(`price outside [data-price]: ${n.nodeValue.trim()}`);
        }
      }
      // 2. In each price element, "+ IVA" comes after the last price.
      for (const el of section.querySelectorAll('[data-price]')) {
        if (!visible(el)) continue;
        const text = el.textContent.replace(/\s+/g, ' ');
        const last = text.search(/\$\d[\d.]*(?!.*\$\d)/);
        if (last >= 0 && !text.slice(last).includes('+ IVA')) out.push(`no "+ IVA" after the price: ${text.trim()}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

});

test.describe('without JavaScript (axe)', () => {
  // axe needs page scripts, so the no-JS render is reproduced: pricing.js blocked, no "js" class.
  test('axe finds no serious or critical violations with every package shown', async ({ page, context }) => {
    await context.route('**/pricing.js', (r) => r.abort());
    await open(page);
    await page.evaluate(() => document.documentElement.classList.remove('js'));
    await expect(page.locator('#panel-comunidad')).toBeVisible();
    const r = await new AxeBuilder({ page }).include('#planes').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});

test.describe('if pricing.js fails (step 8, N8)', () => {
  const allPanelsAndNoTabs = async (page) => {
    await expect(page.locator('html')).not.toHaveClass(/(^|\s)js(\s|$)/);
    await expect(page.locator('[data-tabs]')).toBeHidden();
    await expect(page.locator('[role="tablist"]')).toHaveCount(0);
    for (const code of PACKAGES) {
      await expect(page.locator(`#panel-${code}`)).toBeVisible();
      await expect(page.locator(`#panel-${code} h3.package-name`)).toBeVisible();
    }
  };

  test('blocked: every package shows and no tab row shows', async ({ page, context }) => {
    await context.route('**/pricing.js', (r) => r.abort());
    await open(page);
    await allPanelsAndNoTabs(page);
  });

  test('throwing: every package shows and no tab row shows', async ({ page }) => {
    // Make pricing.js throw after it has started changing the page.
    await page.addInitScript(() => {
      const set = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name, value) {
        if (name === 'aria-selected') throw new Error('simulated pricing.js failure');
        return set.call(this, name, value);
      };
    });
    await open(page);
    await allPanelsAndNoTabs(page);
  });
});

test.describe('layout and quality gates', () => {
  test('there is no layout shift when pricing.js runs', async ({ page, context }) => {
    const positions = async () => {
      await open(page);
      return page.evaluate(() => ['#planes', '.pricing-tabs', '#panel-agenda', '.pricing-note', '#team', 'footer']
        .map((s) => Math.round(document.querySelector(s).getBoundingClientRect().top + window.scrollY)));
    };
    const withScript = await positions();
    const cls = await page.evaluate(() => new Promise((resolve) => {
      let sum = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => resolve(sum), 500);
    }));
    expect(cls).toBeLessThanOrEqual(0.01);
    // The page as it paints before pricing.js acts: the script loads but does nothing. (Aborting it
    // would now trigger the N8 fallback, which deliberately shows every package.)
    await context.route('**/pricing.js', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    const withoutScript = await positions();
    expect(await page.locator('[role="tablist"]').count()).toBe(0);
    expect(withoutScript).toEqual(withScript);
  });

  for (const width of WIDTHS) {
    test(`no horizontal scroll at ${width} px`, async ({ page }) => {
      await open(page, width);
      for (const code of PACKAGES) {
        await page.locator(`#tab-${code}`).click();
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw, `${code} at ${width}`).toBeLessThanOrEqual(width);
      }
    });
  }

  for (const width of [360, 390, 414, 430, 480]) {
    test(`the header fits on one line at ${width} px`, async ({ page }) => {
      await open(page, width);
      const roadmap = page.locator('.nav a[href="#future"]');
      if (width < 480) await expect(roadmap).toBeHidden();
      else await expect(roadmap).toBeVisible();
      const m = await page.evaluate(() => {
        const inner = document.querySelector('.header-inner');
        const nav = inner.querySelector('.nav');
        const clone = nav.cloneNode(true);
        clone.style.cssText = 'position:absolute;visibility:hidden;width:max-content;white-space:nowrap';
        inner.appendChild(clone);
        const cs = getComputedStyle(inner);
        const natural = parseFloat(cs.paddingLeft) + inner.querySelector('.logo').getBoundingClientRect().width
          + (parseFloat(cs.columnGap) || 0) + clone.getBoundingClientRect().width + parseFloat(cs.paddingRight);
        clone.remove();
        const wraps = (a) => { const h = a.offsetHeight; const w = a.style.whiteSpace; a.style.whiteSpace = 'nowrap'; const one = a.offsetHeight; a.style.whiteSpace = w; return h > one; };
        const tall = [...nav.querySelectorAll('a')].filter((a) => a.offsetParent && wraps(a)).length;
        return { natural, tall };
      });
      expect(m.tall).toBe(0);
      expect(m.natural).toBeLessThanOrEqual(width);
    });
  }

  test('on phones the six tabs form two even rows of three (step 8, N2)', async ({ page }) => {
    await open(page, 360);
    const boxes = await page.locator('[role="tab"]').evaluateAll((els) => els.map((e) => {
      const r = e.getBoundingClientRect();
      return { top: Math.round(r.top), w: Math.round(r.width), one: e.scrollWidth <= e.clientWidth };
    }));
    expect(new Set(boxes.map((b) => b.top)).size).toBe(2);
    expect(boxes.slice(0, 3).every((b) => b.top === boxes[0].top)).toBe(true);
    expect(Math.max(...boxes.map((b) => b.w)) - Math.min(...boxes.map((b) => b.w))).toBeLessThanOrEqual(1);
    expect(boxes.every((b) => b.one)).toBe(true);
  });

  for (const width of WIDTHS) {
    test(`the setup fee has its own label line and no amount wraps at ${width} px (step 8, N1)`, async ({ page }) => {
      await open(page, width);
      const r = await page.evaluate(() => {
        const lines = (el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return new Set([...range.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.bottom))).size;
        };
        document.documentElement.classList.remove('js'); // every panel, every card
        const out = [];
        for (const s of document.querySelectorAll('#planes .price-setup')) {
          const label = s.querySelector('.price-label');
          if (!label || label.textContent.trim() !== 'Puesta en marcha (pago único)') out.push('setup label missing');
          if (s.textContent.includes('·')) out.push('setup still has "·"');
        }
        for (const el of document.querySelectorAll('#planes .price-amount, #planes .price-setup-value, #planes .price-min .nowrap')) {
          if (lines(el) > 1) out.push(`wraps: ${el.textContent.trim()}`);
        }
        return out;
      });
      expect(r).toEqual([]);
    });
  }

  test('Roadmap is hidden at 479 px and visible at 480 px', async ({ page }) => {
    await open(page, 479);
    await expect(page.locator('.nav a[href="#future"]')).toBeHidden();
    await open(page, 480);
    await expect(page.locator('.nav a[href="#future"]')).toBeVisible();
  });

  test('axe finds no serious or critical violations in the section, in every tab', async ({ page }) => {
    await open(page);
    for (const code of PACKAGES) {
      await page.locator(`#tab-${code}`).click();
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
      const r = await new AxeBuilder({ page }).include('#planes').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${code} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });

  for (const width of WIDTHS) {
    test(`screenshot at ${width} px`, async ({ page }, testInfo) => {
      const dir = join(shotDir, testInfo.project.name);
      mkdirSync(dir, { recursive: true });
      await open(page, width);
      await page.screenshot({ path: join(dir, `home-${width}.png`), fullPage: true });
      await page.locator('#planes').screenshot({ path: join(dir, `planes-${width}.png`) });
    });
  }
});
