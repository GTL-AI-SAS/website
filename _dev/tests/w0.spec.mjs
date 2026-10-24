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
  test('the hero buttons read as the contract says and scroll to #planes and #team', async ({ page }) => {
    await open(page);
    const buttons = page.locator('.hero-actions a');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText('See plans & pricing');
    await expect(buttons.nth(0)).toHaveClass(/btn-primary/);
    await expect(buttons.nth(1)).toHaveText('Meet the founders');
    await expect(buttons.nth(1)).toHaveClass(/btn-ghost/);

    await buttons.nth(0).click();
    await expect(page).toHaveURL(/#planes$/);
    await expect(page.locator('#planes-title')).toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.hero-actions a', { hasText: 'Meet the founders' }).click();
    await expect(page).toHaveURL(/#team$/);
    await expect(page.locator('#team h2')).toBeInViewport();
  });

  test('the roadmap cards are not links and carry the "In exploration" tag', async ({ page }) => {
    await open(page);
    const cardsEl = page.locator('#future .future-card');
    await expect(cardsEl).toHaveCount(3);
    expect(await cardsEl.evaluateAll((els) => els.map((e) => e.tagName))).toEqual(['ARTICLE', 'ARTICLE', 'ARTICLE']);
    await expect(page.locator('#future a')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Explore the project/ })).toHaveCount(0);
    await expect(page.locator('#future .future-tag--status')).toHaveText(['In exploration', 'In exploration', 'In exploration']);
    // A hover no longer lifts the card like a link: text cursor, no transform, border unchanged.
    const card = cardsEl.first();
    const style = () => card.evaluate((e) => {
      const s = getComputedStyle(e);
      return { cursor: s.cursor, transform: s.transform, borderColor: s.borderColor };
    });
    const before = await style();
    await card.hover();
    const after = await style();
    expect(after.cursor).toBe('default');
    expect(after.transform).toBe('none');
    expect(after.borderColor).toBe(before.borderColor);
  });

  test('the founder cards show name, role and Goals, and no Achievements', async ({ page }) => {
    await open(page);
    await expect(page.locator('#team .member-card')).toHaveCount(4);
    await expect(page.locator('#team', { hasText: 'Achievements' })).toHaveCount(0);
    for (const card of await page.locator('#team .member-card').all()) {
      await expect(card.locator('h3')).toHaveCount(1);
      await expect(card.locator('.role')).toHaveCount(1);
      await expect(card.locator('h4')).toHaveText(['Goals']);
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
      await page.locator('#future').scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});
