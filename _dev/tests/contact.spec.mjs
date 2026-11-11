import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';
import { loadConfig, contactLinks } from '../build-pricing.mjs';

// Quiero saber más (#contact), which took the place of the roadmap: a form, WhatsApp, or email.
const config = loadConfig();
const ES = contactLinks(config, 'es');
const EN = contactLinks(config, 'en');

async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const section = (page) => page.locator('#contact');
const link = (page, kind) => page.locator(`#contact [data-contact="${kind}"]`);

test.describe('Quiero saber más', () => {
  test('sits last, before the footer, with three ways to reach us; "Contáctenos" leads to it', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => document.querySelector('main').lastElementChild.id)).toBe('contact');
    await expect(section(page).getByRole('heading', { level: 2 })).toHaveText('Quiero saber más');
    await expect(section(page).locator('.contact-card')).toHaveCount(3);
    await expect(section(page).locator('.contact-card h3')).toHaveText(['Déjenos sus datos', 'WhatsApp', 'Correo electrónico']);
    await page.locator('.nav-cta').click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(section(page).locator('h2')).toBeInViewport();
  });

  test('the links carry the number and the address from the config', async ({ page }) => {
    await open(page);
    expect(config.whatsappNumber).toBe('573192788238');
    await expect(link(page, 'whatsapp')).toHaveAttribute('href', ES.whatsapp);
    expect(ES.whatsapp).toContain('https://wa.me/573192788238?text=');
    await expect(section(page).locator('[data-contact-text="whatsapp"]')).toHaveText('+57 319 278 8238');
    await expect(link(page, 'mailto')).toHaveText('garydmendez@gtl-ai.com');
    await expect(link(page, 'mailto')).toHaveAttribute('href', ES.mailto);
    await expect(link(page, 'gmail')).toHaveAttribute('href', ES.gmail);
    await expect(link(page, 'outlook')).toHaveAttribute('href', ES.outlook);
    expect(ES.gmail).toContain('to=garydmendez%40gtl-ai.com');
    expect(ES.outlook).toContain('to=garydmendez%40gtl-ai.com');
    for (const kind of ['whatsapp', 'gmail', 'outlook']) {
      await expect(link(page, kind)).toHaveAttribute('target', '_blank');
      await expect(link(page, kind)).toHaveAttribute('rel', 'noopener');
    }
    await expect(link(page, 'gmail')).toHaveAccessibleName(/^Gmail/);
    await expect(link(page, 'outlook')).toHaveAccessibleName(/^Outlook/);
  });

  test('"Hablar con nosotros" opens the request form', async ({ page }) => {
    await open(page);
    await link(page, 'request').click();
    const dialog = page.locator('#request-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('select[name="plan"]')).toHaveValue('general');
    await expect(page).not.toHaveURL(/wa\.me/);
  });

  test('in English the text and the links are English, and back', async ({ page }) => {
    await open(page);
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="en"]').click();
    await expect(section(page).locator('h2')).toHaveText('I want to know more');
    await expect(link(page, 'request')).toContainText('Talk to us');
    await expect(link(page, 'whatsapp')).toContainText('Open WhatsApp');
    for (const kind of Object.keys(EN)) await expect(link(page, kind), kind).toHaveAttribute('href', EN[kind]);
    expect(EN.whatsapp).toContain('Hi%2C%20I');
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="es"]').click();
    for (const kind of Object.keys(ES)) await expect(link(page, kind), kind).toHaveAttribute('href', ES[kind]);
  });

  for (const width of [320, 360, 390, 768]) {
    test(`on a ${width} px screen the cards stack, the buttons are easy to tap and nothing scrolls sideways`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        await section(page).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        const lefts = await section(page).locator('.contact-card').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
        expect(new Set(lefts).size, url).toBe(1);
        for (const kind of Object.keys(ES)) {
          const box = await link(page, kind).boundingBox();
          if (kind !== 'mailto') expect(box.height, `${url} ${kind}`).toBeGreaterThanOrEqual(44);
          expect(box.x + box.width, `${url} ${kind}`).toBeLessThanOrEqual(width);
        }
      }
    });
  }

  test('on a wide screen the three cards sit side by side', async ({ page }) => {
    await open(page);
    const tops = await section(page).locator('.contact-card').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('axe finds no serious or critical violations in the section, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      const r = await new AxeBuilder({ page }).include('#contact').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
});
