import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// The page is written in Spanish; i18n.js swaps every text to English from its table, and back.
async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const current = (page) => page.locator('[data-lang-current]');
const choose = async (page, lang) => {
  await current(page).click();
  await page.locator(`.lang-menu [data-lang="${lang}"]`).click();
};
// The page's text outside the parts that stay Spanish (the clinic screens, the legal text).
const pageText = (page) => page.evaluate(() => {
  const body = document.body.cloneNode(true);
  body.querySelectorAll('[data-i18n="off"], script').forEach((el) => el.remove());
  return body.textContent.replace(/\s+/g, ' ').trim();
});

test.describe('language', () => {
  test('the page is Spanish by default, with the Colombian flag and ES on the switch', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await expect(current(page)).toHaveAttribute('aria-label', 'Idioma: español. Cambiar idioma');
    await expect(current(page).locator('.lang-is-es')).toBeVisible();
    await expect(current(page).locator('.lang-is-en')).toBeHidden();
    await expect(current(page).locator('.lang-is:visible')).toHaveText('ES');
    // Before "Contáctenos" in the header.
    expect(await page.evaluate(() => {
      const sw = document.querySelector('[data-lang-switch]');
      return sw.nextElementSibling.classList.contains('nav-cta');
    })).toBe(true);
  });

  test('ENG turns every text English, with no Spanish left over, and ES brings back the page exactly', async ({ page }) => {
    await open(page);
    const spanish = await pageText(page);
    await choose(page, 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('Software for empowering your dream');
    await expect(page.locator('.nav-cta')).toHaveText('Get in Touch');
    await expect(page.locator('#team-title')).toHaveText('Why us');
    await expect(page.locator('.hero-actions a').first()).toHaveText('I want to know more');
    await expect(page.locator('#feature-tab-calendar')).toHaveText('Calendar');
    await expect(current(page).locator('.lang-is:visible')).toHaveText('ENG');
    await expect(current(page)).toHaveAttribute('aria-label', 'Language: English. Change language');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
    expect(await page.title()).toBe('GTL AI | Empowering dreams');
    // The clinic's screens stay in Spanish.
    await expect(page.locator('#feature-calendar .m-date .m-long')).toContainText('Martes, 17 de noviembre');
    await expect(page.locator('#feature-calendar .mock')).toHaveAttribute('lang', 'es-CO');
    await choose(page, 'es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    expect(await pageText(page)).toBe(spanish);
  });

  test('the choice is kept for the next visit, and ?lang= sets it', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Software for empowering your dream');
    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/);
    await page.goto('/?lang=es');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await page.goto('/?lang=en#team');
    await expect(page.locator('#team-title')).toHaveText('Why us');
  });

  test('the menu opens and closes like a disclosure, by mouse and keyboard', async ({ page }) => {
    await open(page);
    const menu = page.locator('.lang-menu');
    await expect(menu).toBeHidden();
    await current(page).focus();
    await page.keyboard.press('Enter');
    await expect(current(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await expect(menu.locator('[data-lang="es"]')).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(current(page)).toBeFocused();
    await current(page).click();
    await page.locator('h1').click();
    await expect(menu).toBeHidden();
    await expect(current(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('the request form and its messages follow the language', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    await page.locator('#contact a[data-request]').click();
    const dialog = page.locator('#request-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-request-submit]')).toHaveText('Send request');
    await dialog.locator('[data-request-submit]').click();
    await expect(dialog).toContainText('Check the marked fields:');
    await expect(dialog).toContainText('Name: Write your name.');
    await expect(dialog).not.toContainText('Revise');
  });

  test('the tour Pause label follows the language', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    const toggle = page.locator('[data-showcase-toggle]');
    await expect(toggle).toHaveText('Pause tour');
    await toggle.click();
    await expect(toggle).toHaveText('Play tour');
    await choose(page, 'es');
    await expect(toggle).toHaveText('Reanudar recorrido');
  });

  for (const width of [320, 360, 390, 768, 1024]) {
    test(`the header fits at ${width} px in both languages`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        await expect(current(page)).toBeVisible();
        await expect(page.locator('.nav-cta')).toBeVisible();
      }
    });
  }

  test('axe finds no serious or critical violations in the header, with the menu open, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      await current(page).click();
      const r = await new AxeBuilder({ page }).include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });

  test('on the privacy page the header changes language and the policy stays Spanish, with a note', async ({ page }) => {
    // Chosen on the page itself: the local server's redirect to /privacidad drops a ?lang= query.
    await open(page, '/privacidad.html');
    await choose(page, 'en');
    await expect(page.locator('.site-header .nav-cta')).toHaveText('Get in Touch');
    await expect(page.locator('main')).toHaveAttribute('lang', 'es-CO');
    await expect(page.locator('#legal-title')).toHaveText('Política de tratamiento de datos personales');
    await expect(page.locator('[data-lang-note]')).toBeVisible();
    await choose(page, 'es');
    await expect(page.locator('[data-lang-note]')).toBeHidden();
    await expect(page.locator('.site-header .nav-cta')).toHaveText('Contáctenos');
  });
});

test.describe('language without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page is Spanish and the switch is not shown', async ({ page }) => {
    await open(page);
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await expect(page.locator('[data-lang-switch]')).toBeHidden();
  });
});
