import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// Customer stories (#stories): the kinds of business as tabs; each shows the client's site, a quote and what changed.
// The businesses and quotes are made up until approved client stories replace them.
const STORIES = [
  ['fisioterapia', 'Fisioterapia', 'Alba Fisioterapia', 'Physiotherapy'],
  ['clinica', 'Clínica dental', 'Sonríe Dental', 'Dental clinic'],
  ['barberia', 'Peluquería y barbería', 'Barbería El Bigote', 'Hair salon & barbershop'],
  ['tatuajes', 'Estudio de tatuajes', 'Tinta Norte', 'Tattoo studio'],
  ['restaurante', 'Restaurante', 'La Fonda de Rosita', 'Restaurant'],
];

async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const section = (page) => page.locator('#stories');

async function expectStory(page, code) {
  for (const [c] of [...STORIES, ['negocio']]) {
    await expect(page.locator(`#story-tab-${c}`)).toHaveAttribute('aria-selected', c === code ? 'true' : 'false');
    await expect(page.locator(`#story-tab-${c}`)).toHaveAttribute('tabindex', c === code ? '0' : '-1');
    if (c === code) await expect(page.locator(`#story-${c}`)).toBeVisible();
    else await expect(page.locator(`#story-${c}`)).toBeHidden();
  }
}

test.describe('customer stories', () => {
  test('sit after the logos and before Por qué nosotros; Fisioterapia is the default', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || s.className)))
      .toEqual(['hero', 'features', 'clients', 'stories', 'falco', 'team', 'contact']);
    const list = section(page).getByRole('tablist', { name: 'Historias de clientes' });
    await expect(list.getByRole('tab')).toHaveCount(6);
    for (const [code, kind, name] of STORIES) await expect(page.locator(`#story-tab-${code}`)).toHaveText(`${kind}${name}`);
    await expect(page.locator('#story-tab-negocio')).toHaveText('Escoge TU negocio15 tipos de negocio');
    await expect(section(page).locator('h2')).toHaveText('Menos tiempo administrativo, más tiempo en su negocio y lo que haces mejor');
    await expectStory(page, 'fisioterapia');
  });

  test('each story shows its client\'s site, a quote with who said it, and before and after points', async ({ page }) => {
    await open(page);
    for (const [code, kind, name] of STORIES) {
      await page.locator(`#story-tab-${code}`).click();
      await expectStory(page, code);
      const panel = page.locator(`#story-${code}`);
      await expect(panel.getByRole('heading', { level: 3 })).toHaveText(`${kind} · ${name}`);
      await expect(panel.locator('.story-site')).toBeVisible();
      await expect(panel.locator('.story-brand')).toHaveText(name);
      await expect.poll(() => panel.locator('.story-hero img').evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
      await expect(panel.locator('blockquote')).toContainText('“');
      await expect(panel.locator('figcaption')).toContainText(name);
      await expect(panel.locator('.story-point--before')).toHaveCount(1);
      await expect(panel.locator('.story-point--now')).toHaveCount(2);
    }
    // The tattoo studio is one of the logos above.
    await expect(page.locator('#clients .cl-tinta').first()).toContainText('TINTA NORTE');
  });

  test('arrow keys, Home and End move between the stories and wrap around', async ({ page }) => {
    await open(page);
    await page.locator('#story-tab-fisioterapia').focus();
    await page.keyboard.press('ArrowDown');
    await expectStory(page, 'clinica');
    await page.keyboard.press('ArrowRight');
    await expectStory(page, 'barberia');
    await page.keyboard.press('End');
    await expectStory(page, 'negocio');
    await page.keyboard.press('ArrowDown');
    await expectStory(page, 'fisioterapia');
    await page.keyboard.press('ArrowUp');
    await expectStory(page, 'negocio');
    await page.keyboard.press('ArrowUp');
    await expectStory(page, 'restaurante');
    await page.keyboard.press('Home');
    await expectStory(page, 'fisioterapia');
    await expect(page.locator('#story-tab-fisioterapia')).toBeFocused();
  });

  test('in English the tabs, quotes and points are English, and the clients\' own sites stay Spanish', async ({ page }) => {
    await open(page, '/?lang=en');
    await expect(section(page).locator('h2')).toHaveText('Less admin time, more time for your business and what you do best');
    await expect(page.locator('#story-tab-negocio')).toHaveText('Pick YOUR business15 kinds of business');
    for (const [code, , name, en] of STORIES) await expect(page.locator(`#story-tab-${code}`)).toHaveText(`${en}${name}`);
    await expect(page.locator('#story-fisioterapia blockquote')).toContainText('The time I used to lose');
    await expect(page.locator('#story-fisioterapia .story-copy strong')).toHaveText('Muévete sin dolor');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });

  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`at ${width} px nothing scrolls sideways and the selected story fits, in both languages`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        for (const [code] of [...STORIES, ['negocio']]) {
          await page.locator(`#story-tab-${code}`).click();
          expect(await page.evaluate(() => document.documentElement.scrollWidth), `${url} ${code}`).toBeLessThanOrEqual(width);
          const box = await page.locator(`#story-${code}`).boundingBox();
          expect(box.x + box.width, `${url} ${code}`).toBeLessThanOrEqual(width);
          const tab = await page.locator(`#story-tab-${code}`).boundingBox();
          expect(tab.height, code).toBeGreaterThanOrEqual(44);
        }
      }
    });
  }

  test('axe finds no serious or critical violations in any story, in both languages', async ({ page }) => {
    test.setTimeout(90_000); // twelve axe runs: six tabs in two languages
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      for (const [code] of [...STORIES, ['negocio']]) {
        await page.locator(`#story-tab-${code}`).click();
        const r = await new AxeBuilder({ page }).include('#stories').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
        expect(bad.map((v) => `${url} ${code} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
      }
    }
  });
});

// Escoge TU negocio: the kinds of business, and some of the features each one gets.
const PICKS = {
  fisioterapia: ['Página web y SEO', 'Reservas en línea', 'Historia clínica', 'Finanzas y contabilidad'],
  restaurante: ['Reserva de mesas', 'Pedidos en línea', 'Domicilios', 'Inventario', 'Finanzas y contabilidad'],
  lavanderia: ['Página web y SEO', 'Aviso de prenda lista', 'Seguimiento de pedidos', 'Finanzas y contabilidad'],
  veterinaria: ['Fichas de mascotas', 'Recordatorios por WhatsApp', 'Inventario'],
  conjunto: ['Portal de residentes', 'Reserva de zonas comunes', 'Solicitudes PQRS'],
};
const shownFeatures = (page) => page.locator('#story-negocio .feat:not([hidden]) > span').allTextContents();

test.describe('Escoge TU negocio', () => {
  test('stands out with the spinning arc of "Contáctenos", and with reduced motion a plain ring', async ({ page }) => {
    await open(page);
    const tab = page.locator('#story-tab-negocio');
    expect(await tab.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('cta-spin');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await tab.evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  });

  test('offers 15 kinds of business, the last "Otro tipo de sueño", and each shows its own features', async ({ page }) => {
    await open(page);
    await page.locator('#story-tab-negocio').click();
    const chips = page.locator('#story-negocio [data-biz]');
    await expect(chips).toHaveCount(15);
    await expect(chips.last()).toHaveText('Otro tipo de sueño');
    await expect(page.locator('#story-negocio [data-biz="fisioterapia"]')).toHaveAttribute('aria-pressed', 'true');
    for (const [code, must] of Object.entries(PICKS)) {
      await page.locator(`#story-negocio [data-biz="${code}"]`).click();
      await expect(page.locator(`#story-negocio [data-biz="${code}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#story-negocio [aria-pressed="true"]')).toHaveCount(1);
      const shown = await shownFeatures(page);
      for (const f of must) expect(shown, `${code}: ${f}`).toContain(f);
      // Empty groups are hidden.
      const empty = await page.locator('#story-negocio .feat-group:not([hidden])').evaluateAll((gs) => gs.filter((g) => !g.querySelector('.feat:not([hidden])')).length);
      expect(empty, code).toBe(0);
      await expect(page.locator('[data-biz-dream]')).toBeHidden();
    }
    // A laundry gets no table reservations.
    await page.locator('#story-negocio [data-biz="lavanderia"]').click();
    expect(await shownFeatures(page)).not.toContain('Reserva de mesas');
    await page.locator('#story-negocio [data-biz="otro"]').click();
    await expect(page.locator('[data-biz-dream]')).toBeVisible();
    await expect(page.locator('[data-biz-dream] a')).toHaveAttribute('href', '#contact');
  });

  test('features still coming are marked "Próximamente", as in the plans', async ({ page }) => {
    await open(page);
    await page.locator('#story-tab-negocio').click();
    await page.locator('#story-negocio [data-biz="clinica"]').click();
    for (const f of ['Anticipos en línea', 'Recordatorios por WhatsApp', 'Facturación electrónica DIAN']) {
      await expect(page.locator('#story-negocio .feat:not([hidden])', { hasText: f }).locator('.feat-soon')).toHaveText('Próximamente');
    }
    await expect(page.locator('#story-negocio .feat:not([hidden])', { hasText: 'Reservas en línea' }).locator('.feat-soon')).toHaveCount(0);
  });

  test('in English the kinds and the features are English', async ({ page }) => {
    await open(page, '/?lang=en');
    await page.locator('#story-tab-negocio').click();
    await page.locator('#story-negocio [data-biz="lavanderia"]').click();
    await expect(page.locator('#story-negocio [data-biz="lavanderia"]')).toHaveText('Laundry');
    const shown = await shownFeatures(page);
    expect(shown).toContain('"Ready for pickup" alerts');
    expect(shown).toContain('Finance & accounting');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });
});

test.describe('customer stories without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every story is listed with its heading, and there are no tabs', async ({ page }) => {
    await open(page);
    await expect(section(page).locator('.story-tabs')).toBeHidden();
    for (const [code, kind, name] of STORIES) {
      await expect(page.locator(`#story-${code} h3`)).toBeVisible();
      await expect(page.locator(`#story-${code} h3`)).toHaveText(`${kind} · ${name}`);
      await expect(page.locator(`#story-${code} blockquote`)).toBeVisible();
    }
    // Escoge TU negocio lists every feature, without the kinds to pick from.
    await expect(page.locator('#story-negocio .biz-chips')).toBeHidden();
    const all = await page.locator('#story-negocio .feat').count();
    expect(await page.locator('#story-negocio .feat').evaluateAll((els) => els.filter((e) => e.offsetParent !== null).length)).toBe(all);
  });
});
