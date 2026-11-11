import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// W0: hero buttons, roadmap cards, the founder cards, axe on the whole page, and no horizontal scroll.
const WIDTHS = [360, 390, 768, 1440];

async function open(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await waitForFonts(page);
}

test.describe('W0 current-site hotfix', () => {
  test('the hero buttons scroll to Quiero saber más and Por qué nosotros', async ({ page }) => {
    await open(page);
    const buttons = page.locator('.hero-actions a');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText('Quiero saber más');
    await expect(buttons.nth(0)).toHaveClass(/btn-primary/);
    await expect(buttons.nth(1)).toHaveText('Por qué nosotros');
    await expect(buttons.nth(1)).toHaveClass(/btn-ghost/);

    await buttons.nth(0).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact-title')).toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.hero-actions a', { hasText: 'Por qué nosotros' }).click();
    await expect(page).toHaveURL(/#team$/);
    await expect(page.locator('#team h2')).toBeInViewport();
  });

  test('the founder cards show name, role and a short bio, and no Achievements', async ({ page }) => {
    await open(page);
    await expect(page.locator('#team .member-card')).toHaveCount(4);
    await expect(page.locator('#team', { hasText: 'Achievements' })).toHaveCount(0);
    for (const card of await page.locator('#team .member-card').all()) {
      await expect(card.locator('h3')).toHaveCount(1);
      await expect(card.locator('.role')).toHaveCount(1);
      await expect(card.locator('.member-bio')).toHaveCount(1);
      await expect(card.locator('h4')).toHaveCount(0);
    }
  });

  test('axe finds no serious or critical violations on the whole page', async ({ page }) => {
    await open(page);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });

  for (const width of WIDTHS) {
    test(`no horizontal scroll on the whole page at ${width} px`, async ({ page }) => {
      await open(page, width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator('#contact').scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});
