// PF2 Pass A: the WhatsApp request links and the privacy page, in the browser.
// Pass B: in form mode the same links stay on every button (and work without JavaScript); with JavaScript the
// script announces the dialog instead of WhatsApp, and the dialog adds three new-tab links of its own.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORM_NOTICE_TEXT, NEW_TAB_TEXT_GENERIC } from '../build-pricing.mjs';
import { waitForFonts } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, '..', 'pricing.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(here, '..', 'site-config.json'), 'utf8'));
const FORM = config.planRequestMode === 'form';

// Expected links, built here from the data and the config (not from the generator).
const SITE = '(gtl-ai.com)';
const NEW_TAB_TEXT = '(abre WhatsApp en una pestaña nueva)';
const BASE = `https://wa.me/${config.whatsappNumber === 'PENDIENTE' ? '' : config.whatsappNumber}?text=`;
const BUTTONS = [
  ...data.packages.flatMap((p) => p.tiers.map((t) => ({
    selector: `#planes a[data-package="${p.code}"][data-tier="${t.code}"]`,
    text: p.code === 'a-medida' ? `Hola, quiero cotizar un proyecto a medida ${SITE}` : `Hola, quiero información del plan ${p.name} · ${t.name} ${SITE}`,
  }))),
  ...data.bundles.items.map((b) => ({
    selector: `#planes a[data-bundle="${b.code}"]`, text: `Hola, quiero información del paquete ${b.name} ${SITE}`,
  })),
  { selector: '#planes a[data-general="true"]', text: `Hola, quiero ayuda para elegir un plan ${SITE}` },
];

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const [py, pm, pd] = config.privacyPolicyDate.split('-').map(Number);
const POLICY_DATE = `${pd} de ${MONTHS[pm - 1]} de ${py}`;

// GitHub Pages serves /privacidad.html; the local server may drop ".html" (clean URLs). Either is the page.
const PRIVACY_URL = /\/privacidad(\.html)?$/;
const homeAt = (hash) => new RegExp(`/(index(\\.html)?)?#${hash}$`);

async function open(page, path = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await waitForFonts(page);
}

// js: whether plan-request.js has run. In form mode it swaps each button's notice for "(abre un formulario)" and
// adds aria-haspopup="dialog"; href, target and rel never change.
async function checkEveryLink(page, js) {
  const buttonNotice = FORM && js ? FORM_NOTICE_TEXT : NEW_TAB_TEXT;
  expect(BUTTONS).toHaveLength(21);
  // The 21 buttons and, in form mode, the dialog's two WhatsApp links (static general-enquiry href, step 8, N4).
  await expect(page.locator('#planes a[href^="https://wa.me/"]')).toHaveCount(FORM ? 23 : 21);
  for (const b of BUTTONS) {
    const link = page.locator(b.selector);
    await expect(link, b.selector).toHaveCount(1);
    const href = await link.getAttribute('href');
    expect(href, b.selector).toBe(BASE + encodeURIComponent(b.text));
    expect(new URL(href).searchParams.get('text'), b.selector).toBe(b.text);
    await expect(link, b.selector).toHaveAttribute('target', '_blank');
    await expect(link, b.selector).toHaveAttribute('rel', 'noopener');
    if (FORM) await expect(link, b.selector).toHaveAttribute('data-request', /^(plan|custom|bundle|general)$/);
    if (FORM && js) await expect(link, b.selector).toHaveAttribute('aria-haspopup', 'dialog');
    else expect(await link.getAttribute('aria-haspopup'), b.selector).toBeNull();
    // What happens on activation is announced, hidden from sight.
    const notice = link.locator('.visually-hidden');
    await expect(notice, b.selector).toHaveText(buttonNotice);
    // Links in inactive tabs are hidden and have no accessible name; the visible ones announce it.
    if (await link.isVisible()) {
      await expect(link, b.selector).toHaveAccessibleName(new RegExp(`${buttonNotice.replace(/[()]/g, '\\$&')}$`));
    }
  }
  // Every link that opens a new tab, anywhere on the page, carries a notice: the 21 buttons and, in form mode, the
  // dialog's two WhatsApp links and its privacy link.
  const blank = page.locator('a[target="_blank"]');
  expect(await blank.count()).toBe(FORM ? 24 : 21);
  for (const a of await blank.all()) {
    const expected = (await a.getAttribute('data-request')) !== null ? buttonNotice
      : (await a.getAttribute('data-request-whatsapp')) !== null ? NEW_TAB_TEXT : NEW_TAB_TEXT_GENERIC;
    await expect(a.locator('.visually-hidden')).toHaveText(expected);
  }
}

test.describe('WhatsApp request links', () => {
  test('every button has its link and message (with JavaScript)', async ({ page }) => {
    await open(page);
    await checkEveryLink(page, true);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('every button has its link and message, and opens it in a new tab', async ({ page, context }) => {
      // Stand in for wa.me so nothing leaves the machine.
      await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>wa.me</title>' }));
      await open(page);
      await checkEveryLink(page, false);
      for (const b of BUTTONS) {
        const link = page.locator(b.selector);
        const href = await link.getAttribute('href');
        const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
        await popup.waitForLoadState();
        expect(popup.url(), b.selector).toBe(href);
        expect(new URL(popup.url()).searchParams.get('text'), b.selector).toBe(b.text);
        await popup.close();
        await expect(page).toHaveURL(/\/$/);
      }
    });
  });
});

test.describe('privacy page', () => {
  test('the footer link on the home page opens it', async ({ page }) => {
    await open(page);
    const link = page.locator('footer.site-footer a', { hasText: 'Privacidad' });
    await expect(link).toHaveAttribute('href', 'privacidad.html');
    await link.click();
    await expect(page).toHaveURL(PRIVACY_URL);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de tratamiento de datos personales');
  });

  test('it has every section, and its values equal the config', async ({ page }) => {
    await open(page, '/privacidad.html');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    await expect(page.locator('main h2')).toHaveText([
      '1. Responsable', '2. Qué datos recibimos', '3. Para qué los usamos', '4. Autorización', '5. Quién más los maneja',
      '6. Sus derechos', '7. Cómo ejercerlos', '8. Cuánto tiempo los guardamos', '9. Vigencia']);
    const c = config.controller;
    await expect(page.locator('#responsable')).toContainText(
      `${c.name}, NIT ${c.nit}, con domicilio en ${c.city}, Colombia, y dirección ${c.address}.`);
    await expect(page.locator('#responsable [data-config="contactEmail"]')).toHaveText(config.contactEmail);
    await expect(page.locator('#ejercer')).toContainText(`Escríbanos a ${config.contactEmail}`);
    await expect(page.locator('[data-config="privacyPolicyVersion"]')).toHaveText(config.privacyPolicyVersion);
    await expect(page.locator('[data-config="privacyPolicyDate"]')).toHaveText(POLICY_DATE);
    await expect(page.locator('#derechos')).toContainText('Ley 1581 de 2012');
    await expect(page.locator('#derechos')).toContainText('Superintendencia de Industria y Comercio (SIC)');
    await expect(page.locator('#conservacion')).toContainText('24 meses');
    await expect(page.locator('#encargados')).toContainText('fuera de Colombia');
    await expect(page.locator('#encargados')).toContainText('nuestro proveedor de correo electrónico');
  });

  test(`the form paragraphs are ${FORM ? 'present in form mode and name Railway and Resend' : 'absent in WhatsApp mode'}`, async ({ page }) => {
    await open(page, '/privacidad.html');
    await expect(page.locator('[data-form-only]')).toHaveCount(FORM ? 3 : 0);
    if (FORM) {
      await expect(page.locator('#datos')).toContainText('Cuando usa el formulario de solicitud');
      await expect(page.locator('#autorizacion')).toContainText('al marcar la casilla de autorización del formulario');
      await expect(page.locator('#encargados')).toContainText('Railway, que aloja el servidor y la base de datos donde se guardan sus solicitudes');
      await expect(page.locator('#encargados')).toContainText('Resend, que nos envía los correos de aviso de cada solicitud');
    } else {
      await expect(page.locator('main')).not.toContainText('formulario');
    }
  });

  for (const [name, hash] of [['About', 'about'], ['Planes', 'planes'], ['Team', 'team'], ['Roadmap', 'future'], ['Get in Touch', 'contact']]) {
    test(`the header link "${name}" reaches the home page section`, async ({ page }) => {
      await open(page, '/privacidad.html');
      await page.locator('.site-header .nav a', { hasText: name }).click();
      await expect(page).toHaveURL(homeAt(hash));
      await expect(page.locator(`#${hash}`)).toBeInViewport();
    });
  }

  test('the logo and the footer links work', async ({ page }) => {
    await open(page, '/privacidad.html');
    await expect(page.locator('footer .footer-privacy')).toHaveAttribute('aria-current', 'page');
    await page.locator('footer .footer-privacy').click();
    await expect(page).toHaveURL(PRIVACY_URL);
    await expect(page.locator('footer .footer-email')).toHaveAttribute('href', /^mailto:/);
    await page.locator('.site-header .logo').click();
    await expect(page).toHaveURL(/\/(index(\.html)?)?$/);
    await expect(page.locator('#planes')).toHaveCount(1);
  });

  test('at 360 px the header fits as on the home page and nothing scrolls sideways', async ({ page }) => {
    await open(page, '/privacidad.html', 360);
    await expect(page.locator('.nav a[href$="#future"]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('axe finds no serious or critical violations', async ({ page }) => {
    await open(page, '/privacidad.html');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});
