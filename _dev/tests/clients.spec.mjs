import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// Clients (#clients): two rows of logos drifting in opposite directions, between the feature tour and the plans.
// The logos are placeholders (fictional businesses) until real client logos are approved.
async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const section = (page) => page.locator('#clients');
const tracks = (page) => page.locator('#clients .client-track');
const anim = (page) => tracks(page).evaluateAll((els) => els.map((e) => {
  const s = getComputedStyle(e);
  return { name: s.animationName, direction: s.animationDirection, state: s.animationPlayState };
}));

test.describe('clients', () => {
  test('sits right after the feature tour, with its claim and line', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || s.className)))
      .toEqual(['hero', 'features', 'clients', 'stories', 'falco', 'team', 'contact']);
    await expect(section(page).locator('h2')).toHaveText('Clientes reales creando su sueño con nosotros');
    await expect(section(page).locator('.clients-note')).toHaveText('Una pequeña inversión con retorno inmediato en más clientes y mejor gestión.');
  });

  test('two rows drift in opposite directions; each holds its six logos twice, and screen readers get one list', async ({ page }) => {
    await open(page);
    await expect(page.locator('#clients .client-row')).toHaveCount(2);
    for (const row of await page.locator('#clients .client-row').all()) {
      await expect(row.locator('.client-set')).toHaveCount(2);
      await expect(row.locator('.client-set').first().locator('.client')).toHaveCount(6);
      await expect(row.locator('.client-set[data-copy] .client')).toHaveCount(6);
    }
    await expect(page.locator('#clients .clients-rows')).toHaveAttribute('aria-hidden', 'true');
    await expect(section(page).locator('ul.visually-hidden li')).toHaveCount(12);
    const a = await anim(page);
    expect(a.map((x) => x.name)).toEqual(['clients-drift', 'clients-drift']);
    expect(a.map((x) => x.direction)).toEqual(['normal', 'reverse']);
    expect(a.map((x) => x.state)).toEqual(['running', 'running']);
  });

  test('the Pause button stops both rows and Play starts them again', async ({ page }) => {
    await open(page);
    const toggle = section(page).locator('[data-clients-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('Pausar logos');
    await toggle.click();
    await expect(toggle).toHaveText('Reanudar logos');
    expect((await anim(page)).map((x) => x.state)).toEqual(['paused', 'paused']);
    await toggle.click();
    await expect(toggle).toHaveText('Pausar logos');
    await page.mouse.move(2, 2);
    expect((await anim(page)).map((x) => x.state)).toEqual(['running', 'running']);
  });

  test('with reduced motion the logos stand still, once each, with no Pause button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    expect((await anim(page)).map((x) => x.name)).toEqual(['none', 'none']);
    await expect(page.locator('#clients .client-set[data-copy]').first()).toBeHidden();
    await expect(section(page).locator('[data-clients-toggle]')).toBeHidden();
  });

  test('in English the claim, the line and the button are English, and the logos are unchanged', async ({ page }) => {
    await open(page, '/?lang=en');
    await expect(section(page).locator('h2')).toHaveText('Real clients building their dream with us');
    await expect(section(page).locator('.clients-note')).toHaveText('A small investment with an immediate return: more customers and better management.');
    await expect(section(page).locator('[data-clients-toggle]')).toHaveText('Pause logos');
    await expect(section(page).locator('.cl-fonda').first()).toContainText('la fonda de');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });

  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`at ${width} px nothing scrolls sideways and every logo fits its tile, in both languages`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        await section(page).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        const spill = await page.locator('#clients .client').evaluateAll((els) => els
          .filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className));
        expect(spill, url).toEqual([]);
        const copy = await section(page).locator('.clients-copy').boundingBox();
        expect(copy.x + copy.width, url).toBeLessThanOrEqual(width);
      }
    });
  }

  test('axe finds no serious or critical violations in the section, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      const r = await new AxeBuilder({ page }).include('#clients').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
});

test.describe('clients without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the logos stand still, once each, and there is no Pause button', async ({ page }) => {
    await open(page);
    expect((await anim(page)).map((x) => x.name)).toEqual(['none', 'none']);
    await expect(page.locator('#clients .client-set[data-copy]').first()).toBeHidden();
    await expect(section(page).locator('[data-clients-toggle]')).toBeHidden();
  });
});
