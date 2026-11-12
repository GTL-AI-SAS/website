import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForFonts } from './helpers.mjs';
import { loadConfig, whatsappLink, PRICES_MESSAGES } from '../build-pricing.mjs';

// The pricing page (precios.html): four monthly tiers and a custom one, what each plan brings, the add-ons, what comes
// with every plan, the questions and a call to book a demo. The local server serves it at /precios (clean URLs).
const here = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const html = readFileSync(join(here, '..', '..', 'precios.html'), 'utf8');
const TIERS = [
  ['presencia', 'Presencia', '$ 50.000'],
  ['agenda', 'Agenda', '$ 179.000'],
  ['gestion', 'Gestión', '$ 299.000'],
  ['completo', 'Completo', '$ 449.000'],
];
const clean = (t) => t.replace(/\s+/g, ' ').trim();

async function open(page, url = '/precios', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

test.describe('pricing page', () => {
  test('the header\'s Precios link and the home page\'s strip lead to it', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#contact .price-strip')).toContainText('Planes desde $ 50.000 al mes + IVA, sin costo de instalación.');
    await page.locator('#contact .price-strip a').click();
    await expect(page).toHaveURL(/\/precios(\.html)?$/);
    await page.goto('/');
    await page.locator('.nav a', { hasText: 'Precios' }).click();
    await expect(page).toHaveURL(/\/precios(\.html)?$/);
    await expect(page.locator('h1')).toHaveText('Precios sencillos para empresas que crecen');
    await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Precios');
    // Its header links go back to the home page's sections.
    await page.locator('.nav a', { hasText: 'Funciones' }).click();
    await expect(page).toHaveURL(/\/(index(\.html)?)?#features$/);
  });

  test('four monthly tiers with their prices, Agenda marked as the most chosen, and a custom plan', async ({ page }) => {
    await open(page);
    await expect(page.locator('.pr-tier h2')).toHaveText(TIERS.map((t) => t[1]));
    for (const [code, , price] of TIERS) {
      const card = page.locator(`.pr-tier[data-tier="${code}"]`);
      expect(clean(await card.locator('.pr-amount').textContent())).toBe(price);
      await expect(card.locator('.pr-unit')).toHaveText('/ mes + IVA');
      expect(await card.locator('.pr-list li').count()).toBeGreaterThanOrEqual(4);
    }
    await expect(page.locator('.pr-badge')).toHaveCount(1);
    await expect(page.locator('.pr-tier[data-tier="agenda"] .pr-badge')).toHaveText('Más elegido');
    // Each tier builds on the one before.
    await expect(page.locator('.pr-lead')).toHaveText(['Todo lo de Presencia, y además:', 'Todo lo de Agenda, y además:', 'Todo lo de Gestión, y además:']);
    await expect(page.locator('.pr-custom h2')).toHaveText('A medida');
    await expect(page.locator('.pr-custom .pr-amount')).toHaveText('A cotizar');
    await expect(page.locator('.pr-notes')).toContainText('Sin costo de instalación · Permanencia mínima de 12 meses · Precios en COP + IVA (19 %)');
    await expect(page.locator('.pr-notes')).toContainText('Paga el año completo y recibe 2 meses gratis.');
    // Side by side on a wide screen.
    const tops = await page.locator('.pr-tier').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('then what you get, the add-ons, what comes with every plan, the questions and the demo call, in that order', async ({ page }) => {
    await open(page);
    await expect(page.locator('main h2:not(.pr-tier h2):not(.pr-custom h2):not(.request-title)')).toHaveText(
      ['Todo lo que obtienes con GTL AI', 'Complementos opcionales', 'Con cada plan', 'Preguntas frecuentes', '¿GTL AI es para ti?']);
    await expect(page.locator('.pr-cat-title')).toHaveText(['Página web y SEO', 'Agenda y pagos', 'Finanzas y contabilidad', 'Clientes', 'Gestión']);
    await expect(page.locator('.pr-since')).toHaveText(['Desde Presencia', 'Desde Agenda', 'Desde Gestión', 'Desde Agenda', 'Desde Gestión']);
    await expect(page.locator('.pr-addon h3')).toHaveText(['Asesorías financieras y tributarias', 'Falco, chatbot con IA']);
    await expect(page.locator('.pr-addon').first()).toContainText('contador público');
    expect(clean(await page.locator('.pr-addon').nth(1).locator('.pr-price').textContent())).toBe('+ $ 150.000/ mes + IVA');
    await expect(page.locator('.pr-promise h3')).toHaveText(['Puesta en marcha gratis', 'Soporte de primer nivel', 'Si te vas, te llevas tus datos']);
    await expect(page.locator('.pr-q')).toHaveCount(7);
    await expect(page.locator('.pr-cta a')).toHaveText([/^Agendar una demostración/, /^Hablar con nosotros/]);
  });

  test('the features: five categories, one open at a time, each with five functions that have a description and a picture', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    await expect(page.locator('.pr-cat')).toHaveCount(5);
    await expect(page.locator('.pr-cat[open]')).toHaveAttribute('data-cat', 'web');
    await expect(page.locator('.pr-fn')).toHaveCount(25);
    await expect(page.locator('.pr-fn-panel')).toHaveCount(25);
    for (const code of ['agenda', 'finanzas', 'clientes', 'gestion', 'web']) {
      await page.locator(`.pr-cat[data-cat="${code}"] summary`).click();
      await expect(page.locator('.pr-cat[open]')).toHaveCount(1);
      await expect(page.locator('.pr-cat[open]')).toHaveAttribute('data-cat', code);
      const cat = page.locator(`.pr-cat[data-cat="${code}"]`);
      await expect(cat.getByRole('tab')).toHaveCount(5);
      // Every function has its text and its picture; one shows at a time.
      for (const tab of await cat.getByRole('tab').all()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        const panel = cat.getByRole('tabpanel');
        await expect(panel).toHaveCount(1);
        await expect(panel.locator('h4')).toHaveText((await tab.locator('.pr-fn-name').textContent()).trim());
        expect((await panel.locator('p').textContent()).length).toBeGreaterThan(30);
        await expect(panel.locator('.pr-preview .pv-card')).toBeVisible();
      }
    }
    // The open category wears the gradient border.
    expect(await page.locator('.pr-cat[open]').evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    // What is not available yet says so.
    for (const f of ['Facturación electrónica DIAN', 'Recordatorios por WhatsApp']) {
      await expect(page.locator('.pr-fn', { hasText: f }).locator('.feat-soon')).toHaveText('Próximamente');
    }
  });

  test('a mouse passing over a function, or the arrow keys, changes the picture and gives its name the gradient', async ({ page }) => {
    await open(page);
    const cat = page.locator('.pr-cat[data-cat="web"]');
    const active = () => cat.locator('.pr-fn.is-active .pr-fn-name');
    await expect(active()).toHaveText('Landing page a tu medida');
    await expect(cat.getByRole('tabpanel').locator('.pv-page')).toBeVisible();
    await cat.locator('#fn-web-2').hover();
    await expect(active()).toHaveText('SEO local');
    await expect(cat.getByRole('tabpanel').locator('.pv-search')).toBeVisible();
    await expect(cat.getByRole('tabpanel')).toContainText('Preparamos tu página para que la gente cercana te encuentre');
    expect(await active().evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    expect(await cat.locator('#fn-web-1 .pr-fn-name').evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none');
    // Keyboard: the arrows move through the list and wrap round.
    await cat.locator('#fn-web-2').focus();
    await page.keyboard.press('ArrowDown');
    await expect(active()).toHaveText('Perfil de Empresa en Google');
    await expect(cat.locator('#fn-web-3')).toBeFocused();
    await page.keyboard.press('End');
    await expect(active()).toHaveText('Botón de WhatsApp');
    await page.keyboard.press('ArrowDown');
    await expect(active()).toHaveText('Landing page a tu medida');
  });

  test('on a phone every category fits: the functions are buttons above the description and the picture', async ({ page }) => {
    test.setTimeout(90_000);
    for (const url of ['/precios?lang=es', '/precios?lang=en']) {
      await open(page, url, 360);
      for (const code of ['web', 'agenda', 'finanzas', 'clientes', 'gestion']) {
        const cat = page.locator(`.pr-cat[data-cat="${code}"]`);
        if (!(await cat.evaluate((el) => el.open))) await cat.locator('summary').click();
        for (const tab of await cat.locator('.pr-fn').all()) {
          await tab.click();
          expect(await page.evaluate(() => document.documentElement.scrollWidth), `${url} ${code}`).toBeLessThanOrEqual(360);
          const spill = await cat.locator('.pr-fn-panel.is-active .pv-card').evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > 360);
          expect(spill, `${url} ${code}`).toBe(false);
          expect((await tab.boundingBox()).height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('the questions open and close, by mouse and by keyboard', async ({ page }) => {
    await open(page);
    const first = page.locator('.pr-q').first();
    await expect(first.locator('p')).toBeHidden();
    await first.locator('summary').click();
    await expect(first.locator('p')).toBeVisible();
    await expect(first.locator('p')).toHaveText('No. Solo pagas la mensualidad de tu plan; la puesta en marcha va por nuestra cuenta.');
    const second = page.locator('.pr-q').nth(1);
    await second.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(second.locator('p')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(second.locator('p')).toBeHidden();
  });

  test('a tier\'s button opens the request form with the plan noted in the message', async ({ page }) => {
    await page.route('https://api.gtl-ai.com/**', (r) => r.abort());
    await open(page);
    const dialog = page.locator('#request-dialog');
    await page.locator('.pr-tier[data-tier="agenda"] a.btn').click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('#request-plan')).toHaveValue('general');
    await expect(page.locator('#request-message')).toHaveValue('Me interesa el plan Agenda.');
    await page.keyboard.press('Escape');
    // Another tier replaces the note; what the visitor wrote is never replaced.
    await page.locator('.pr-tier[data-tier="completo"] a.btn').click();
    await expect(page.locator('#request-message')).toHaveValue('Me interesa el plan Completo.');
    await page.locator('#request-message').fill('Tengo dos sedes y cinco profesionales.');
    await page.keyboard.press('Escape');
    await page.locator('.pr-custom a.btn').click();
    await expect(page.locator('#request-message')).toHaveValue('Tengo dos sedes y cinco profesionales.');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // The demo button notes the demo, when the message is free again.
    await page.locator('#request-message').evaluate((el) => { el.value = ''; });
    await page.locator('.pr-cta a.btn').first().click();
    await expect(page.locator('#request-message')).toHaveValue('Quiero agendar una demostración.');
  });

  test('every button is a WhatsApp link to our number with its own message, in Spanish and in English', async ({ page }) => {
    await open(page);
    const buttons = { presencia: '.pr-tier[data-tier="presencia"] a.btn', agenda: '.pr-tier[data-tier="agenda"] a.btn', gestion: '.pr-tier[data-tier="gestion"] a.btn',
      completo: '.pr-tier[data-tier="completo"] a.btn', medida: '.pr-custom a.btn', demo: '.pr-cta a.btn >> nth=0', chat: '.pr-cta a.btn >> nth=1' };
    for (const [key, selector] of Object.entries(buttons)) {
      await expect(page.locator(selector), key).toHaveAttribute('href', whatsappLink(config, PRICES_MESSAGES[key].es));
      await expect(page.locator(selector), key).toHaveAttribute('target', '_blank');
    }
    expect(whatsappLink(config, PRICES_MESSAGES.agenda.es)).toContain(`https://wa.me/${config.whatsappNumber}?text=`);
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="en"]').click();
    for (const [key, selector] of Object.entries(buttons)) {
      await expect(page.locator(selector), key).toHaveAttribute('href', whatsappLink(config, PRICES_MESSAGES[key].en));
    }
  });

  test('in English every text is English, with nothing left over, and Spanish comes back exactly', async ({ page }) => {
    await open(page);
    const spanish = await page.locator('main').innerText();
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="en"]').click();
    await expect(page.locator('h1')).toHaveText('Simple pricing for growing businesses');
    await expect(page.locator('.pr-tier h2')).toHaveText(['Presence', 'Calendar', 'Management', 'Complete']);
    await expect(page.locator('.pr-tier[data-tier="agenda"] .pr-unit')).toHaveText('/ month + VAT');
    await expect(page.locator('.pr-promise h3')).toHaveText(['Free onboarding', 'Top-tier support', 'If you leave, you take your data with you']);
    await expect(page.locator('.pr-cat-title')).toHaveText(['Landing page & SEO', 'Scheduling & payments', 'Finance & accounting', 'Client relationships', 'Management']);
    await page.locator('#fn-web-2').click();
    await expect(page.locator('.pr-cat[data-cat="web"]').getByRole('tabpanel')).toContainText('We set up your page so people nearby find you');
    // The pictures are the clinic's own screens: they stay in Spanish.
    await expect(page.locator('.pr-cat[data-cat="web"]').getByRole('tabpanel').locator('.pv-search')).toHaveText('fisioterapia en chicó');
    await page.locator('#fn-web-1').click();
    await expect(page.locator('.pr-cta h2')).toHaveText('Is GTL AI right for you?');
    expect(await page.title()).toBe('Pricing | GTL AI');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
    // The choice carries over from the home page, too.
    await page.goto('/precios');
    await expect(page.locator('h1')).toHaveText('Simple pricing for growing businesses');
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="es"]').click();
    expect(await page.locator('main').innerText()).toBe(spanish);
  });

  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`at ${width} px nothing scrolls sideways, the header fits and the buttons are easy to tap, in both languages`, async ({ page }) => {
      for (const url of ['/precios?lang=es', '/precios?lang=en']) {
        await open(page, url, width);
        await page.locator('.pr-cta').scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        for (const b of await page.locator('main a.btn:visible').all()) {
          const box = await b.boundingBox();
          expect(box.height, url).toBeGreaterThanOrEqual(44);
          expect(box.x + box.width, url).toBeLessThanOrEqual(width);
        }
        // No price or plan name is cut off.
        const cut = await page.locator('.pr-tier h2, .pr-amount, .pr-unit').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
        expect(cut, url).toEqual([]);
      }
    });
  }

  test('on a phone the tiers stack, one under the other', async ({ page }) => {
    await open(page, '/precios', 390);
    const lefts = await page.locator('.pr-tier').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
  });

  test('axe finds no serious or critical violations on the whole page, with a question open, in both languages', async ({ page }) => {
    for (const url of ['/precios?lang=es', '/precios?lang=en']) {
      await open(page, url);
      await page.locator('.pr-q summary').first().click();
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });

  test('the page is written by the build: no placeholder is left, and it carries the form and the stamped scripts', () => {
    expect(html).not.toMatch(/\{\{[\w.]+\}\}/);
    expect(html).toContain('<dialog class="request-dialog" id="request-dialog"');
    for (const f of ['style.css', 'site-config.js', 'plan-request.js', 'precios.js', 'i18n.js']) expect(html).toMatch(new RegExp(`"${f.replace('.', '\\.')}\\?v=[0-9a-f]{10}"`));
    expect(html).not.toContain('showcase.js');
  });
});

test.describe('pricing page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('everything shows in Spanish, and a tier\'s button opens WhatsApp with its plan', async ({ page, context }) => {
    await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>wa.me</title>' }));
    await open(page);
    await expect(page.locator('h1')).toHaveText('Precios sencillos para empresas que crecen');
    await expect(page.locator('.pr-tier')).toHaveCount(4);
    // The features: no list to pick from; every function of the open category shows with its description.
    await expect(page.locator('.pr-cat[open] .pr-fns')).toBeHidden();
    await expect(page.locator('.pr-cat[open] .pr-fn-panel h4')).toHaveText(['Landing page a tu medida', 'SEO local', 'Perfil de Empresa en Google', 'Dominio y hosting', 'Botón de WhatsApp']);
    for (const p of await page.locator('.pr-cat[open] .pr-fn-panel p').all()) await expect(p).toBeVisible();
    const link = page.locator('.pr-tier[data-tier="gestion"] a.btn');
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await popup.waitForLoadState();
    expect(new URL(popup.url()).searchParams.get('text')).toBe('Hola, me interesa el plan Gestión (gtl-ai.com)');
  });
});
