// Shared by every spec (not a test: Playwright runs *.spec.mjs, node --test runs *.test.mjs).
import { expect } from '@playwright/test';

// The one font wait. Web fonts come from Google Fonts; a slow fetch once took Firefox past Playwright's default 5 s
// (step 8, N5), so every page-open helper waits up to this long for document.fonts to report "loaded". It only waits:
// it sees "loaded" or fails the test, and every later assertion keeps its own timeout.
export const FONT_WAIT_MS = 15_000;

// Polled from Node: with JavaScript disabled, Firefox never settles a promise returned to evaluate().
export async function waitForFonts(page) {
  await expect.poll(() => page.evaluate(() => document.fonts.status), { timeout: FONT_WAIT_MS }).toBe('loaded');
}
