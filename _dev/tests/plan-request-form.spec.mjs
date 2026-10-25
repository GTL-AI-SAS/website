// PF2 Pass B: the request form against a simulated API. Every request is intercepted by Playwright
// (page.route) on a same-origin apiBaseUrl served through a test copy of site-config.js; the real API
// origin is blocked and asserted untouched. Lead values below are test data only.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORM_NOTICE_TEXT, FIELD_LIMITS } from '../build-pricing.mjs';
import { waitForFonts } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, '..', 'site-config.json'), 'utf8'));
const published = readFileSync(join(here, '..', '..', 'site-config.js'), 'utf8');

test.skip(config.planRequestMode !== 'form', 'the committed site is in WhatsApp mode: there is no dialog to test');

const API = 'http://localhost:4174'; // the served site's own origin
const ENDPOINT = `${API}/api/plan-requests`;
const REAL_API = 'https://api.gtl-ai.com';
// PF3: the page requests site-config.js?v=<hash> and style.css?v=<hash>, so routes match the path with any query.
const SITE_CONFIG_URL = /\/site-config\.js(\?.*)?$/;
const STYLE_URL = /\/style\.css(\?.*)?$/;
const KEYS = ['packageCode', 'tierCode', 'bundleCode', 'name', 'business', 'phone', 'email', 'city', 'message', 'consent', 'policyVersion', 'nickname'];
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const POLICY_MISMATCH = 'La política de privacidad se actualizó. Recargue la página para continuar.';
const WA = (text) => `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`;
// Test data only.
const LEAD = { name: 'Prueba Playwright', business: 'Negocio de Prueba', phone: '+57 300 000 0000', email: 'prueba@example.com', city: 'Ciudad Prueba', message: 'Mensaje de prueba.' };
const BUTTON = {
  plan: '#planes a[data-package="agenda"][data-tier="crece"]',
  custom: '#planes a[data-package="a-medida"][data-tier="proyecto"]',
  bundle: '#planes a[data-bundle="clinica-completa"]',
  general: '#planes a[data-general="true"]',
};
const SEL = {
  dialog: '#request-dialog', form: '[data-request-form]', success: '[data-request-success]', banner: '[data-request-banner]',
  retry: '[data-request-retry]', submit: '[data-request-submit]', errors: '[data-request-errors]',
};

const reply = (status, body, headers = {}) => (route) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
const created = reply(201, { requestId: '11111111-1111-4111-8111-111111111111' });
const replayed = reply(200, { requestId: '11111111-1111-4111-8111-111111111111' });
const failed = reply(500, { code: 'INTERNAL_ERROR' });
const invalid = (fields) => reply(422, { code: 'VALIDATION_ERROR', fields });
const sequence = (...responders) => (route, n) => responders[Math.min(n, responders.length) - 1](route, n);

// Blocks the real API, serves the test config (form mode, same-origin API, optional short timeout) and records
// every request the page makes to the simulated endpoint.
async function setup(page, respond, { timeoutMs } = {}) {
  const real = [];
  page.on('request', (r) => { if (r.url().startsWith(REAL_API)) real.push(r.url()); });
  await page.route(`${REAL_API}/**`, (r) => r.abort());
  const testConfig = { ...JSON.parse(published.match(/window\.GTL_CONFIG = (\{.*\});/)[1]), planRequestMode: 'form', apiBaseUrl: API };
  if (timeoutMs) testConfig.requestTimeoutMs = timeoutMs;
  await page.route(SITE_CONFIG_URL, (r) => r.fulfill({ contentType: 'application/javascript', body: `window.GTL_CONFIG = ${JSON.stringify(testConfig)};` }));
  const requests = [];
  await page.route(ENDPOINT, async (route) => {
    const req = route.request();
    requests.push({ method: req.method(), key: req.headers()['idempotency-key'], contentType: req.headers()['content-type'], body: JSON.parse(req.postData()) });
    await respond(route, requests.length);
  });
  return { requests, real };
}

async function open(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await waitForFonts(page);
}

async function openDialog(page, selector = BUTTON.plan) {
  if (selector === BUTTON.custom) await page.locator('#tab-a-medida').click();
  await page.locator(selector).click();
  await expect(page.locator(SEL.dialog)).toBeVisible();
  return page.locator(SEL.dialog);
}

async function fill(page, lead = LEAD) {
  for (const [k, v] of Object.entries(lead)) await page.locator(`#request-${k}`).fill(v);
  await page.locator('#request-consent').check();
}

const submit = (page) => page.locator(SEL.submit).click();
const focusedId = (page) => page.evaluate(() => document.activeElement && document.activeElement.id);
const values = (page) => page.evaluate(() => Object.fromEntries(['name', 'business', 'phone', 'email', 'city', 'message'].map((k) => [k, document.getElementById(`request-${k}`).value])));

// The timeout path (A1 §2) runs on Playwright's fake clock. The page's abort timer (requestTimeoutMs) is set on a paused
// clock: the first request is intercepted and left unanswered, then the clock is advanced past the timeout and the page
// gives the request up itself. With a real 400 ms timer, Firefox under load sometimes cancelled the fetch before it had
// reached the interception layer at all; the retry then became the first intercepted request and hit the unanswered
// responder (step 8: 2 runs in 20 in Firefox, in the original timeout test as much as in the close/reopen one).
const TIMEOUT_MS = 400;
const unanswered = (route) => { setTimeout(() => route.abort().catch(() => {}), 3000); }; // the page has long given it up by then
async function openWithPausedClock(page) {
  await page.clock.install(); // before navigation and ticking, so the page loads normally
  await open(page);
  await page.clock.pauseAt(Date.now() + 60_000);
}
async function timeOutFirstRequest(page, requests) {
  await expect.poll(() => requests.length).toBe(1); // intercepted and suspended
  await page.clock.runFor(TIMEOUT_MS + 1);          // the page's own timer fires: the fetch rejects, the key is kept
}

test.describe('the request form', () => {
  test('the script takes over the 21 buttons: aria-haspopup, the notice, and the WhatsApp href kept', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    const buttons = page.locator('#planes a[data-request]');
    await expect(buttons).toHaveCount(21);
    for (const a of await buttons.all()) {
      await expect(a).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(a).toHaveAttribute('href', /^https:\/\/wa\.me\//);
      await expect(a.locator('.visually-hidden')).toHaveText(FORM_NOTICE_TEXT);
    }
    await expect(page.locator(SEL.dialog)).toBeHidden();
    expect(requests).toEqual([]);
  });

  test('a 201 shows success, and the body is exactly the contract\'s shape for the chosen plan', async ({ page }) => {
    const { requests, real } = await setup(page, created);
    await open(page);
    await openDialog(page, BUTTON.plan);
    await expect(page.locator('#request-plan')).toHaveValue('plan:agenda:crece');
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    await expect(page.locator(SEL.success)).toContainText(config.replyTime);
    await expect(page.locator(SEL.form)).toBeHidden();
    await expect(page.locator(SEL.dialog)).toHaveAttribute('aria-labelledby', 'request-success-title');
    expect(await focusedId(page)).toBe('request-success-title');
    expect(requests).toHaveLength(1);
    const r = requests[0];
    expect(r.method).toBe('POST');
    expect(r.contentType).toMatch(/^application\/json/);
    expect(r.key).toMatch(UUID_V4);
    expect(Object.keys(r.body)).toEqual(KEYS);
    expect(r.body).toEqual({ packageCode: 'agenda', tierCode: 'crece', bundleCode: null, ...LEAD, consent: true, policyVersion: config.privacyPolicyVersion, nickname: '' });
    // The success view's WhatsApp link carries the plan only.
    const wa = page.locator(`${SEL.success} [data-request-whatsapp]`);
    await expect(wa).toHaveAttribute('href', WA('Hola, quiero información del plan Agenda · Crece (gtl-ai.com)'));
    await expect(wa).toHaveAttribute('target', '_blank');
    for (const v of Object.values(LEAD)) expect(await wa.getAttribute('href')).not.toContain(encodeURIComponent(v));
    expect(real).toEqual([]);
  });

  for (const [kind, codes] of [
    ['bundle', { packageCode: null, tierCode: null, bundleCode: 'clinica-completa' }],
    ['custom', { packageCode: 'a-medida', tierCode: 'proyecto', bundleCode: null }],
    ['general', { packageCode: null, tierCode: null, bundleCode: null }],
  ]) {
    test(`the ${kind} button preselects its plan, and empty optional values are sent as null`, async ({ page }) => {
      const { requests } = await setup(page, created);
      await open(page);
      await openDialog(page, BUTTON[kind]);
      const expectedValue = kind === 'bundle' ? 'bundle:clinica-completa' : kind === 'custom' ? 'plan:a-medida:proyecto' : 'general';
      await expect(page.locator('#request-plan')).toHaveValue(expectedValue);
      await fill(page, { name: LEAD.name, business: LEAD.business, phone: LEAD.phone, email: '', city: '  ', message: '' });
      await submit(page);
      await expect(page.locator(SEL.success)).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0].body).toEqual({ ...codes, name: LEAD.name, business: LEAD.business, phone: LEAD.phone, email: null, city: null, message: null, consent: true, policyVersion: config.privacyPolicyVersion, nickname: '' });
    });
  }

  test('changing the plan in the dialog changes the codes sent and the WhatsApp link', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    await openDialog(page, BUTTON.plan);
    await page.locator('#request-plan').selectOption('bundle:finca-directa');
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests[0].body.packageCode).toBeNull();
    expect(requests[0].body.tierCode).toBeNull();
    expect(requests[0].body.bundleCode).toBe('finca-directa');
    await expect(page.locator(`${SEL.success} [data-request-whatsapp]`)).toHaveAttribute('href', WA('Hola, quiero información del paquete Finca Directa (gtl-ai.com)'));
  });

  test('a 500 keeps the values and offers a retry; the retry reuses the key and a replayed 200 is success', async ({ page }) => {
    const { requests } = await setup(page, sequence(failed, replayed));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    const banner = page.locator(SEL.banner);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('no está disponible en este momento');
    await expect(page.locator(SEL.retry)).toBeVisible();
    await expect(page.locator(`${SEL.banner} [data-request-whatsapp]`)).toHaveAttribute('href', WA('Hola, quiero información del plan Agenda · Crece (gtl-ai.com)'));
    expect(await values(page)).toEqual(LEAD);
    expect(await page.evaluate(() => document.activeElement.matches('[data-request-retry]'))).toBe(true);
    await page.locator(SEL.retry).click();
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0].key).toBe(requests[1].key);
    expect(requests[0].body).toEqual(requests[1].body);
  });

  test('a network failure keeps the values; the retry reuses the key', async ({ page }) => {
    const { requests } = await setup(page, sequence((route) => route.abort('failed'), created));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.banner)).toBeVisible();
    await expect(page.locator(SEL.banner)).toContainText('problema de conexión');
    await expect(page.locator(SEL.retry)).toBeVisible();
    expect(await values(page)).toEqual(LEAD);
    await expect(page.locator(SEL.submit)).toBeEnabled();
    await page.locator(SEL.retry).click();
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests.map((r) => r.key)).toEqual([requests[0].key, requests[0].key]);
    expect(requests[0].key).toMatch(UUID_V4);
  });

  test('a timeout is treated like a network failure: same key on retry', async ({ page }) => {
    const { requests } = await setup(page, sequence(unanswered, replayed), { timeoutMs: TIMEOUT_MS });
    await openWithPausedClock(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await timeOutFirstRequest(page, requests);
    await expect(page.locator(SEL.banner)).toBeVisible();
    await expect(page.locator(SEL.banner)).toContainText('problema de conexión');
    await expect(page.locator(SEL.retry)).toBeVisible();
    await page.locator(SEL.retry).click();
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0].key).toBe(requests[1].key);
  });

  for (const [status, body, text] of [
    [409, { code: 'IDEMPOTENCY_CONFLICT' }, 'No pudimos registrar su solicitud'],
    [422, { code: 'VALIDATION_ERROR', fields: [{ field: 'name', code: 'too_short' }] }, null],
    [429, { code: 'RATE_LIMITED' }, 'Recibimos varias solicitudes suyas en poco tiempo'],
  ]) {
    test(`after a ${status} the next attempt uses a new key`, async ({ page }) => {
      const { requests } = await setup(page, sequence(reply(status, body, status === 429 ? { 'Retry-After': '600' } : {}), created));
      await open(page);
      await openDialog(page);
      await fill(page);
      await submit(page);
      if (text) {
        await expect(page.locator(SEL.banner)).toBeVisible();
        await expect(page.locator(SEL.banner)).toContainText(text);
        await expect(page.locator(SEL.retry)).toBeHidden();
        await expect(page.locator(`${SEL.banner} [data-request-whatsapp]`)).toHaveAttribute('href', /^https:\/\/wa\.me\//);
      } else {
        await expect(page.locator('#request-name-error')).toHaveText('El nombre debe tener al menos 2 caracteres.');
      }
      expect(await values(page)).toEqual(LEAD);
      await submit(page);
      await expect(page.locator(SEL.success)).toBeVisible();
      expect(requests).toHaveLength(2);
      expect(requests[1].key).toMatch(UUID_V4);
      expect(requests[1].key).not.toBe(requests[0].key);
    });
  }

  test('a change after a failure uses a new key', async ({ page }) => {
    const { requests } = await setup(page, sequence(failed, created));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.retry)).toBeVisible();
    await page.locator('#request-message').fill('Mensaje de prueba, corregido.');
    await page.locator(SEL.retry).click();
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[1].body.message).toBe('Mensaje de prueba, corregido.');
  });

  // Step 8 (A2 §2): after a network error, a timeout or a 5xx the first request may have been stored. Closing the dialog
  // and reopening it from the same plan with nothing changed keeps the values, the banner and the key, so "Reintentar"
  // replays the request instead of creating a second lead.
  for (const [label, responder, timesOut] of [
    ['a 500', failed, false],
    ['a network failure', (route) => route.abort('failed'), false],
    ['a timeout', unanswered, true],
  ]) {
    test(`after ${label}, closing and reopening from the same plan keeps the values, the banner and the key`, async ({ page }) => {
      const { requests } = await setup(page, sequence(responder, replayed), timesOut ? { timeoutMs: TIMEOUT_MS } : {});
      if (timesOut) await openWithPausedClock(page); else await open(page);
      await openDialog(page, BUTTON.bundle);
      await fill(page);
      await submit(page);
      if (timesOut) await timeOutFirstRequest(page, requests);
      await expect(page.locator(SEL.retry)).toBeVisible();
      const bannerText = await page.locator('[data-request-banner-text]').textContent();
      await page.keyboard.press('Escape');
      await expect(page.locator(SEL.dialog)).toBeHidden();
      await openDialog(page, BUTTON.bundle);
      await expect(page.locator('#request-plan')).toHaveValue('bundle:clinica-completa');
      await expect(page.locator('#request-plan')).toBeFocused();
      expect(await values(page)).toEqual(LEAD);
      await expect(page.locator(SEL.banner)).toBeVisible();
      await expect(page.locator('[data-request-banner-text]')).toHaveText(bannerText);
      await expect(page.locator(SEL.retry)).toBeVisible();
      await expect(page.locator(`${SEL.banner} [data-request-whatsapp]`)).toHaveAttribute('href', WA('Hola, quiero información del paquete Clínica Completa (gtl-ai.com)'));
      await page.locator(SEL.retry).click();
      await expect(page.locator(SEL.success)).toBeVisible();
      expect(requests).toHaveLength(2);
      expect(requests[1].key).toBe(requests[0].key);
      expect(requests[1].body).toEqual(requests[0].body);
    });
  }

  test('after a 500, reopening from a different plan hides the banner and uses a new key', async ({ page }) => {
    const { requests } = await setup(page, sequence(failed, created));
    await open(page);
    await openDialog(page, BUTTON.plan);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.retry)).toBeVisible();
    await page.locator(`${SEL.form} [data-request-close]`, { hasText: 'Cancelar' }).click();
    await expect(page.locator(SEL.dialog)).toBeHidden();
    await openDialog(page, BUTTON.bundle);
    await expect(page.locator('#request-plan')).toHaveValue('bundle:clinica-completa');
    await expect(page.locator(SEL.banner)).toBeHidden();
    expect(await values(page)).toEqual(LEAD);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].key).toMatch(UUID_V4);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[0].body.packageCode).toBe('agenda');
    expect(requests[1].body.bundleCode).toBe('clinica-completa');
  });

  test('after a 500, a changed field, then closing and reopening from the same plan hides the banner and uses a new key', async ({ page }) => {
    const { requests } = await setup(page, sequence(failed, created));
    await open(page);
    await openDialog(page, BUTTON.plan);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.retry)).toBeVisible();
    await page.locator('#request-city').fill('Otra Ciudad');
    await page.keyboard.press('Escape');
    await expect(page.locator(SEL.dialog)).toBeHidden();
    await openDialog(page, BUTTON.plan);
    await expect(page.locator('#request-plan')).toHaveValue('plan:agenda:crece');
    await expect(page.locator(SEL.banner)).toBeHidden();
    expect(await values(page)).toEqual({ ...LEAD, city: 'Otra Ciudad' });
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].key).toMatch(UUID_V4);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[1].body.city).toBe('Otra Ciudad');
  });

  test('a 422 maps every field error to its field, in Spanish, with aria-invalid and a summary', async ({ page }) => {
    const { requests } = await setup(page, invalid([
      { field: 'tierCode', code: 'required' }, { field: 'name', code: 'too_short' }, { field: 'business', code: 'required' },
      { field: 'phone', code: 'invalid' }, { field: 'email', code: 'invalid' }, { field: 'city', code: 'too_long' },
      { field: 'message', code: 'too_long' }, { field: 'consent', code: 'consent_required' },
    ]));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    const expected = {
      plan: 'Elija un plan de la lista.',
      name: 'El nombre debe tener al menos 2 caracteres.',
      business: 'Indique el nombre de su negocio, su Instagram o su sitio web.',
      phone: 'Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.',
      email: 'Revise el correo electrónico; por ejemplo, nombre@dominio.com.',
      city: `La ciudad no puede superar los ${FIELD_LIMITS.city.max} caracteres.`,
      message: `El mensaje no puede superar los ${FIELD_LIMITS.message.max} caracteres.`,
      consent: 'Marque la casilla de autorización para continuar.',
    };
    for (const [field, message] of Object.entries(expected)) {
      const error = page.locator(`#request-${field}-error`);
      await expect(error, field).toBeVisible();
      await expect(error, field).toHaveText(message);
      const control = page.locator(`#request-${field}`);
      await expect(control, field).toHaveAttribute('aria-invalid', 'true');
      expect((await control.getAttribute('aria-describedby')).split(' '), field).toContain(`request-${field}-error`);
    }
    const summary = page.locator(SEL.errors);
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAttribute('role', 'alert');
    await expect(summary.locator('li')).toHaveCount(8);
    await expect(summary.locator('li').first()).toHaveText('Plan: Elija un plan de la lista.');
    expect(await focusedId(page)).toBe('request-plan');
    expect(await values(page)).toEqual(LEAD);
    await expect(page.locator(SEL.banner)).toBeHidden();
    expect(requests).toHaveLength(1);
  });

  test('a 429 shows the polite message and offers WhatsApp, without a retry button', async ({ page }) => {
    await setup(page, reply(429, { code: 'RATE_LIMITED' }, { 'Retry-After': '600' }));
    await open(page);
    await openDialog(page, BUTTON.bundle);
    await fill(page);
    await submit(page);
    const banner = page.locator(SEL.banner);
    await expect(banner).toBeVisible();
    await expect(banner).toHaveText(/Recibimos varias solicitudes suyas en poco tiempo\. Espere unos minutos e inténtelo de nuevo, o escríbanos por WhatsApp\./);
    await expect(page.locator(SEL.retry)).toBeHidden();
    await expect(page.locator(`${SEL.banner} [data-request-whatsapp]`)).toHaveAttribute('href', WA('Hola, quiero información del paquete Clínica Completa (gtl-ai.com)'));
    expect(await values(page)).toEqual(LEAD);
  });

  test('policy_version_mismatch shows its message and nothing is sent again', async ({ page }) => {
    const { requests } = await setup(page, invalid([{ field: 'policyVersion', code: 'policy_version_mismatch' }]));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    const banner = page.locator(SEL.banner);
    await expect(banner).toBeVisible();
    await expect(banner.locator('[data-request-banner-text]')).toHaveText(POLICY_MISMATCH);
    await expect(page.locator(SEL.retry)).toBeHidden();
    await expect(page.locator(SEL.submit)).toBeDisabled();
    // A programmatic submit, Enter in a field, a reopened dialog: still nothing.
    await page.evaluate(() => document.querySelector('[data-request-form]').requestSubmit());
    await page.locator('#request-name').press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.locator(SEL.dialog)).toBeHidden();
    await openDialog(page, BUTTON.general);
    await expect(banner.locator('[data-request-banner-text]')).toHaveText(POLICY_MISMATCH);
    await expect(page.locator(SEL.submit)).toBeDisabled();
    await page.evaluate(() => document.querySelector('[data-request-form]').requestSubmit());
    await page.waitForTimeout(300);
    expect(requests).toHaveLength(1);
  });

  for (const [label, responder] of [
    ['422 unknown_field', invalid([{ field: 'nombre', code: 'unknown_field' }])],
    ['422 unknown_code', invalid([{ field: 'packageCode', code: 'unknown_code' }])],
    ['400', reply(400, { code: 'MALFORMED_REQUEST' })],
    ['413', reply(413, { code: 'PAYLOAD_TOO_LARGE' })],
    // A field named after an Object.prototype property is unknown, never a message (step 8, N6).
    ['422 naming "constructor"', invalid([{ field: 'constructor', code: 'name' }])],
  ]) {
    test(`a ${label} shows the generic banner, keeps the values and offers WhatsApp`, async ({ page }) => {
      const { requests } = await setup(page, sequence(responder, created));
      await open(page);
      await openDialog(page);
      await fill(page);
      await submit(page);
      const banner = page.locator(SEL.banner);
      await expect(banner).toBeVisible();
      await expect(banner.locator('[data-request-banner-text]')).toHaveText('No pudimos registrar su solicitud. Puede intentarlo de nuevo o escribirnos por WhatsApp.');
      await expect(page.locator(SEL.retry)).toBeHidden();
      await expect(banner.locator('[data-request-whatsapp]')).toHaveAttribute('href', WA('Hola, quiero información del plan Agenda · Crece (gtl-ai.com)'));
      await expect(page.locator('.request-error:visible')).toHaveCount(0);
      await expect(page.locator(SEL.errors)).toBeHidden();
      expect(await values(page)).toEqual(LEAD);
      await expect(page.locator(SEL.submit)).toBeEnabled();
      await submit(page);
      await expect(page.locator(SEL.success)).toBeVisible();
      expect(requests).toHaveLength(2);
      expect(requests[1].key).not.toBe(requests[0].key);
    });
  }

  test('a double click sends one request', async ({ page }) => {
    const { requests } = await setup(page, async (route) => { await new Promise((r) => setTimeout(r, 400)); await created(route); });
    await open(page);
    await openDialog(page);
    await fill(page);
    await page.locator(SEL.submit).dblclick();
    await expect(page.locator(SEL.success)).toBeVisible();
    await page.waitForTimeout(300);
    expect(requests).toHaveLength(1);
  });

  test('while a request is in flight the submit button is disabled and says so', async ({ page }) => {
    await setup(page, async (route) => { await new Promise((r) => setTimeout(r, 800)); await created(route); });
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.submit)).toBeDisabled();
    await expect(page.locator(SEL.submit)).toHaveText('Enviando…');
    await expect(page.locator(SEL.form)).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator(SEL.success)).toBeVisible();
  });

  test('an unticked consent box blocks submission, with the error at the box', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    await openDialog(page);
    await fill(page);
    await page.locator('#request-consent').uncheck();
    await submit(page);
    await expect(page.locator('#request-consent-error')).toHaveText('Marque la casilla de autorización para continuar.');
    await expect(page.locator('#request-consent')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(SEL.errors)).toContainText('Autorización: Marque la casilla de autorización para continuar.');
    expect(await focusedId(page)).toBe('request-consent');
    await page.waitForTimeout(200);
    expect(requests).toHaveLength(0);
    await page.locator('#request-consent').check();
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].body.consent).toBe(true);
  });

  test('the browser applies the API\'s rules before sending anything', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    await openDialog(page);
    await submit(page); // everything empty
    for (const [field, message] of [['name', 'Escriba su nombre.'], ['business', 'Indique el nombre de su negocio, su Instagram o su sitio web.'],
      ['phone', 'Indique un teléfono o un correo electrónico.'], ['email', 'Indique un teléfono o un correo electrónico.'],
      ['consent', 'Marque la casilla de autorización para continuar.']]) {
      await expect(page.locator(`#request-${field}-error`), field).toHaveText(message);
    }
    await expect(page.locator('#request-city-error')).toBeHidden();
    await expect(page.locator(SEL.errors).locator('li')).toHaveCount(5);
    expect(await focusedId(page)).toBe('request-name');
    await fill(page, { ...LEAD, name: 'A', phone: 'abc', email: 'sin-arroba' });
    await submit(page);
    await expect(page.locator('#request-name-error')).toHaveText(`El nombre debe tener al menos ${FIELD_LIMITS.name.min} caracteres.`);
    await expect(page.locator('#request-phone-error')).toHaveText('Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.');
    await expect(page.locator('#request-email-error')).toHaveText('Revise el correo electrónico; por ejemplo, nombre@dominio.com.');
    // The inputs cap the lengths themselves (A1 §1).
    for (const [field, max] of [['name', FIELD_LIMITS.name.max], ['business', FIELD_LIMITS.business.max], ['phone', FIELD_LIMITS.phone.max],
      ['email', FIELD_LIMITS.email.max], ['city', FIELD_LIMITS.city.max], ['message', FIELD_LIMITS.message.max]]) {
      await expect(page.locator(`#request-${field}`), field).toHaveAttribute('maxlength', String(max));
    }
    await page.waitForTimeout(200);
    expect(requests).toHaveLength(0);
    // A phone alone is enough; so is an email alone.
    await fill(page, { ...LEAD, email: '' });
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].body.email).toBeNull();
  });

  test('the honeypot is sent empty and is hidden from sight, keyboard and screen readers', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    await openDialog(page);
    const trap = page.locator('#request-nickname');
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(trap).toHaveAttribute('aria-hidden', 'true');
    await expect(trap).toHaveAttribute('autocomplete', 'off');
    const box = await trap.boundingBox();
    expect(box === null || box.x + box.width < 0).toBe(true);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests[0].body.nickname).toBe('');
    expect(Object.keys(requests[0].body)).toContain('nickname');
  });

  // PF3: the honeypot's wrapper carries an inline off-screen style, so it never shows even when style.css fails to load.
  for (const [label, blockCss] of [['with style.css', false], ['with style.css blocked', true]]) {
    test(`the honeypot's box is entirely outside the viewport and Tab never reaches it (${label})`, async ({ page }) => {
      const { requests } = await setup(page, created);
      if (blockCss) await page.route(STYLE_URL, (r) => r.abort());
      await open(page);
      // The stylesheet really is, or is not, in effect: the header is sticky only with style.css. (Chromium lists an
      // aborted stylesheet in document.styleSheets as an empty sheet, so the computed style is the evidence.)
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('.site-header')).position)).toBe(blockCss ? 'static' : 'sticky');
      await openDialog(page);
      const boxes = await page.evaluate(() => {
        const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
        return { wrapper: rect(document.querySelector('.request-nickname')), input: rect(document.getElementById('request-nickname')), vw: window.innerWidth, vh: window.innerHeight };
      });
      for (const [name, b] of [['wrapper', boxes.wrapper], ['input', boxes.input]]) {
        const outside = b.right <= 0 || b.bottom <= 0 || b.left >= boxes.vw || b.top >= boxes.vh;
        expect(outside, `${name} ${JSON.stringify(b)} in ${boxes.vw}x${boxes.vh}`).toBe(true);
      }
      // Tab from the plan <select> to the Cancelar button: every field in order and never the honeypot, which sits
      // between message and consent in the markup. Ids only: whether a link is in the tab order is up to the engine.
      expect(await focusedId(page)).toBe('request-plan');
      const visited = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        visited.push(await page.evaluate(() => {
          const el = document.activeElement;
          return el.id || (el.matches('[data-request-submit]') ? 'submit' : el.matches('[data-request-close]') ? 'close' : el.tagName);
        }));
        if (visited[visited.length - 1] === 'close') break;
      }
      expect(visited).not.toContain('request-nickname');
      expect(visited.filter((id) => id.startsWith('request-') || id === 'submit' || id === 'close')).toEqual(
        ['request-name', 'request-business', 'request-phone', 'request-email', 'request-city', 'request-message', 'request-consent', 'submit', 'close']);
      expect(requests).toEqual([]);
    });
  }

  test('the body sends the config\'s privacyPolicyVersion, the one the privacy page shows', async ({ page }) => {
    const { requests } = await setup(page, created);
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests[0].body.policyVersion).toBe(config.privacyPolicyVersion);
    expect(requests[0].body.policyVersion).toBe('1.1');
    await page.goto('/privacidad.html');
    await expect(page.locator('[data-config="privacyPolicyVersion"]')).toHaveText(requests[0].body.policyVersion);
  });

  test('the key is a v4 UUID even without crypto.randomUUID', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true }); });
    const { requests } = await setup(page, created);
    await open(page);
    expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined');
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    expect(requests[0].key).toMatch(UUID_V4);
  });

  test('without an API address in the config the buttons stay plain WhatsApp links', async ({ page, context }) => {
    await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>wa.me</title>' }));
    await page.route(SITE_CONFIG_URL, (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.GTL_CONFIG = {"planRequestMode":"form","apiBaseUrl":null};' }));
    await open(page);
    const link = page.locator(BUTTON.plan);
    expect(await link.getAttribute('aria-haspopup')).toBeNull();
    await expect(link.locator('.visually-hidden')).toHaveText('(abre WhatsApp en una pestaña nueva)');
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await popup.waitForLoadState();
    expect(popup.url()).toBe(await link.getAttribute('href'));
    await popup.close();
    await expect(page.locator(SEL.dialog)).toBeHidden();
  });
});

test.describe('accessibility', () => {
  test('focus moves into the dialog, Esc closes it and focus returns to the button', async ({ page }) => {
    await setup(page, created);
    await open(page);
    await openDialog(page, BUTTON.bundle);
    expect(await focusedId(page)).toBe('request-plan');
    expect(await page.evaluate(() => document.querySelector('#request-dialog').contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator(SEL.dialog)).toBeHidden();
    // Retrying assertions: in WebKit the dialog's close event, which returns focus, runs ~20 ms after it hides (step 8, M1).
    await expect(page.locator(BUTTON.bundle)).toBeFocused();
    // The Cancelar and × buttons return focus too.
    await openDialog(page, BUTTON.general);
    await page.locator(`${SEL.form} [data-request-close]`, { hasText: 'Cancelar' }).click();
    await expect(page.locator(SEL.dialog)).toBeHidden();
    await expect(page.locator(BUTTON.general)).toBeFocused();
    await openDialog(page, BUTTON.plan);
    await page.locator('.request-close').click();
    await expect(page.locator(SEL.dialog)).toBeHidden();
    await expect(page.locator(BUTTON.plan)).toBeFocused();
  });

  test('every control has a label; the dialog is labelled and described', async ({ page }) => {
    await setup(page, created);
    await open(page);
    await openDialog(page);
    await expect(page.locator(SEL.dialog)).toHaveAttribute('aria-labelledby', 'request-title');
    await expect(page.locator(SEL.dialog)).toHaveAttribute('aria-describedby', 'request-intro');
    for (const [id, name] of [['request-plan', 'Plan'], ['request-name', 'Nombre (obligatorio)'], ['request-business', 'Negocio (obligatorio)'],
      ['request-phone', 'Teléfono o WhatsApp'], ['request-email', 'Correo electrónico'], ['request-city', 'Ciudad'], ['request-message', 'Mensaje']]) {
      await expect(page.locator(`#${id}`), id).toHaveAccessibleName(name);
    }
    await expect(page.locator('#request-consent')).toHaveAccessibleName(/^Autorizo a GTL AI a tratar mis datos/);
    await expect(page.locator('#request-business')).toHaveAccessibleDescription(/El nombre de su negocio, su Instagram o su sitio web\./);
    await expect(page.locator('#request-phone')).toHaveAccessibleDescription(/Indique al menos un medio de contacto/);
    await expect(page.locator('.request-close')).toHaveAccessibleName('Cerrar');
  });

  for (const state of ['open', 'with errors', 'success']) {
    test(`axe finds no serious or critical violations in the dialog (${state})`, async ({ page }) => {
      await setup(page, created);
      await open(page);
      await openDialog(page);
      if (state === 'with errors') await submit(page);
      if (state === 'success') { await fill(page); await submit(page); await expect(page.locator(SEL.success)).toBeVisible(); }
      const r = await new AxeBuilder({ page }).include('#request-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    });
  }

  for (const width of [360, 1440]) {
    test(`it works by keyboard only at ${width} px, and the honeypot is never reached`, async ({ page }) => {
      const { requests } = await setup(page, created);
      await open(page, width);
      await page.locator(BUTTON.plan).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(SEL.dialog)).toBeVisible();
      expect(await focusedId(page)).toBe('request-plan');
      const visited = [];
      const typed = { name: LEAD.name, business: LEAD.business, phone: LEAD.phone, email: LEAD.email, city: LEAD.city, message: LEAD.message };
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press('Tab');
        const id = await focusedId(page);
        visited.push(id);
        const field = id.replace('request-', '');
        if (typed[field]) await page.keyboard.type(typed[field]);
        if (field === 'consent') await page.keyboard.press('Space');
        if (await page.evaluate(() => document.activeElement.matches('[data-request-submit]'))) break;
      }
      expect(visited).not.toContain('request-nickname');
      expect(visited.filter((id) => id.startsWith('request-'))).toEqual(['request-name', 'request-business', 'request-phone', 'request-email', 'request-city', 'request-message', 'request-consent']);
      expect(await page.locator('#request-consent').isChecked()).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.keyboard.press('Enter');
      await expect(page.locator(SEL.success)).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0].body).toEqual({ packageCode: 'agenda', tierCode: 'crece', bundleCode: null, ...LEAD, consent: true, policyVersion: config.privacyPolicyVersion, nickname: '' });
      await page.keyboard.press('Escape');
      await expect(page.locator(SEL.dialog)).toBeHidden();
      await expect(page.locator(BUTTON.plan)).toBeFocused();
    });
  }
});

test.describe('privacy in the browser', () => {
  test('after a full flow no lead value is in the URL, the storage, the cookies or the console', async ({ page }) => {
    const console_ = [];
    page.on('console', (m) => console_.push(m.text()));
    page.on('pageerror', (e) => console_.push(String(e)));
    const { requests, real } = await setup(page, sequence(failed, invalid([{ field: 'email', code: 'invalid' }]), created));
    await open(page);
    await openDialog(page);
    await fill(page);
    await submit(page);
    await expect(page.locator(SEL.retry)).toBeVisible();
    await page.locator(SEL.retry).click();
    await expect(page.locator('#request-email-error')).toBeVisible();
    await submit(page);
    await expect(page.locator(SEL.success)).toBeVisible();
    await page.keyboard.press('Escape');
    expect(requests).toHaveLength(3);
    const stored = await page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage }, c: document.cookie }));
    expect(stored).toBe(JSON.stringify({ l: {}, s: {}, c: '' }));
    const haystack = [page.url(), stored, ...console_].join('\n');
    for (const v of Object.values(LEAD)) {
      expect(haystack, v).not.toContain(v);
      expect(haystack, v).not.toContain(encodeURIComponent(v));
    }
    expect(page.url()).toMatch(/\/(index\.html)?$/);
    expect(real).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a button is still its WhatsApp link, and no dialog opens', async ({ page, context }) => {
    await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>wa.me</title>' }));
    await context.route(`${REAL_API}/**`, (r) => r.abort());
    await open(page);
    const link = page.locator(BUTTON.plan);
    await expect(link).toHaveAttribute('href', WA('Hola, quiero información del plan Agenda · Crece (gtl-ai.com)'));
    await expect(link).toHaveAttribute('target', '_blank');
    expect(await link.getAttribute('aria-haspopup')).toBeNull();
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await popup.waitForLoadState();
    expect(popup.url()).toBe(await link.getAttribute('href'));
    expect(new URL(popup.url()).searchParams.get('text')).toBe('Hola, quiero información del plan Agenda · Crece (gtl-ai.com)');
    await popup.close();
    await expect(page.locator(SEL.dialog)).toBeHidden();
    expect(await page.locator(SEL.dialog).getAttribute('open')).toBeNull();
  });
});
