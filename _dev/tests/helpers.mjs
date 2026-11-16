// Shared by every spec (not a test: Playwright runs *.spec.mjs, node --test runs *.test.mjs).
import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const config = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'site-config.json'), 'utf8'));

// The home page's sections (main > section), in order. Release 2 (launch.enabled in site-config.json) adds the
// demos section after the stories (BF-W1), so the specs follow the switch and release 2 stays one line.
export const SECTIONS = ['hero', 'features', 'clients', 'stories', ...(config.launch.enabled ? ['demos'] : []), 'falco', 'team', 'contact'];

// The one font wait. Web fonts come from Google Fonts; a slow fetch once took Firefox past Playwright's default 5 s
// (step 8, N5), so every page-open helper waits up to this long for document.fonts to report "loaded". It only waits:
// it sees "loaded" or fails the test, and every later assertion keeps its own timeout.
export const FONT_WAIT_MS = 15_000;

// Polled from Node: with JavaScript disabled, Firefox never settles a promise returned to evaluate().
export async function waitForFonts(page) {
  await expect.poll(() => page.evaluate(() => document.fonts.status), { timeout: FONT_WAIT_MS }).toBe('loaded');
}
