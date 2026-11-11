import { test, expect } from '@playwright/test';

test('the More from our brand section is removed and December chooses a holiday intro', async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    class DecemberDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [2026, 11, 1])); }
      static now() { return new RealDate(2026, 11, 1).getTime(); }
    }
    Object.defineProperty(DecemberDate, 'parse', { value: RealDate.parse });
    Object.defineProperty(DecemberDate, 'UTC', { value: RealDate.UTC });
    window.Date = DecemberDate;
    Math.random = () => 0.99;
  });
  await page.goto('/');
  await expect(page.getByText('More from our brand', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-brand-intro] source')).toHaveAttribute('src', /gtl-ai-holiday-lights\.mp4$/);
  await expect(page.locator('[data-brand-intro] video')).toHaveAttribute('poster', /holiday-lights\.png$/);
});
