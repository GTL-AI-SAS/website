// PF2 Pass A: WhatsApp request links, the site config, the privacy page and the release check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadData, loadConfig, renderSection, applyToIndex, renderPrivacy, sharedChrome, validateConfig,
  configReleaseItems, privacyReleaseItems, wiringProblems, requestMessage, whatsappLink, formatDateEs,
  formatWhatsApp, FOOTER_LINK, NEW_TAB_TEXT, INDEX_PATH, PRIVACY_PATH, PRIVACY_TEMPLATE_PATH,
} from '../build-pricing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const builder = join(here, '..', 'build-pricing.mjs');
const run = (...args) => spawnSync(process.execPath, [builder, ...args], { encoding: 'utf8' });
const LF = (s) => s.replace(/\r\n/g, '\n');
const data = loadData();
const config = loadConfig();
const index = LF(readFileSync(INDEX_PATH, 'utf8'));
const privacy = LF(readFileSync(PRIVACY_PATH, 'utf8'));
const template = readFileSync(PRIVACY_TEMPLATE_PATH, 'utf8');

// Test values only; never published.
const TEST_CONFIG = {
  ...config,
  whatsappNumber: '573001234567',
  contactEmail: 'privacidad@example.com',
  controller: { ...config.controller, city: 'Medellín', address: 'Calle 10 # 43-12' },
  privacyPolicyVersion: '0.1',
  privacyPolicyDate: '2026-10-16',
  apiBaseUrl: null,
};
// The config as PF2 shipped it, before PQ1 filled in JD's values.
const PENDING_CONFIG = {
  ...TEST_CONFIG,
  whatsappNumber: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  controller: { ...config.controller, city: 'PENDIENTE', address: 'PENDIENTE' },
};

// The contract's four messages, written out independently of the generator.
const SITE = '(gtl-ai.com)';
const expectedMessages = (d) => {
  const out = [];
  for (const p of d.packages) {
    for (const t of p.tiers) {
      out.push({
        key: `${p.code}/${t.code}`,
        text: p.code === 'a-medida'
          ? `Hola, quiero cotizar un proyecto a medida ${SITE}`
          : `Hola, quiero información del plan ${p.name} · ${t.name} ${SITE}`,
      });
    }
  }
  for (const b of d.bundles.items) out.push({ key: `bundle ${b.code}`, text: `Hola, quiero información del paquete ${b.name} ${SITE}` });
  out.push({ key: 'general', text: `Hola, quiero ayuda para elegir un plan ${SITE}` });
  return out;
};

// Every request link in rendered HTML, keyed like expectedMessages.
function requestLinks(html) {
  const links = [];
  for (const m of html.matchAll(/<a class="btn[^"]*"([^>]*)>/g)) {
    const attrs = m[1];
    const attr = (n) => (attrs.match(new RegExp(` ${n}="([^"]*)"`)) || [])[1];
    const key = attr('data-bundle') ? `bundle ${attr('data-bundle')}`
      : attr('data-general') ? 'general'
        : attr('data-package') ? `${attr('data-package')}/${attr('data-tier')}` : null;
    if (key) links.push({ key, href: attr('href').replace(/&amp;/g, '&'), target: attr('target'), rel: attr('rel') });
  }
  return links;
}

const decode = (href) => new URL(href).searchParams.get('text');

test('the four message kinds read exactly as the contract writes them', () => {
  const agenda = data.packages.find((p) => p.code === 'agenda');
  const crece = agenda.tiers.find((t) => t.code === 'crece');
  const clinica = data.bundles.items.find((b) => b.code === 'clinica-completa');
  assert.equal(requestMessage.plan(agenda, crece), 'Hola, quiero información del plan Agenda · Crece (gtl-ai.com)');
  assert.equal(requestMessage.bundle(clinica), 'Hola, quiero información del paquete Clínica Completa (gtl-ai.com)');
  assert.equal(requestMessage.custom(), 'Hola, quiero cotizar un proyecto a medida (gtl-ai.com)');
  assert.equal(requestMessage.general(), 'Hola, quiero ayuda para elegir un plan (gtl-ai.com)');
});

for (const [label, cfg, base] of [
  ['the committed config', config, `https://wa.me/${config.whatsappNumber}?text=`],
  ['a number still PENDIENTE (dev only)', PENDING_CONFIG, 'https://wa.me/?text='],
  ['a test number', TEST_CONFIG, 'https://wa.me/573001234567?text='],
]) {
  test(`every button gets its wa.me link and message, with ${label}`, () => {
    const links = requestLinks(renderSection(data, cfg));
    const expected = expectedMessages(data);
    assert.equal(links.length, 21);
    assert.deepEqual(links.map((l) => l.key), expected.map((e) => e.key));
    for (const [i, l] of links.entries()) {
      assert.equal(l.href, base + encodeURIComponent(expected[i].text), l.key);
      assert.equal(decode(l.href), expected[i].text, l.key);
      assert.equal(l.target, '_blank', l.key);
      assert.equal(l.rel, 'noopener', l.key);
    }
  });
}

test('the committed index.html carries exactly these links', () => {
  const links = requestLinks(index);
  const expected = expectedMessages(data);
  assert.deepEqual(links.map((l) => [l.key, l.href]),
    expected.map((e) => [e.key, whatsappLink(config, e.text)]));
  assert.ok(!index.includes('href="#contact" data-'), 'a request button still points to #contact');
});

test('messages follow the data: renamed package, tier and bundle in a fixture', () => {
  const fixture = structuredClone(data);
  fixture.packages.find((p) => p.code === 'agenda').name = 'Agenda Salud';
  fixture.packages.find((p) => p.code === 'pedidos').tiers.find((t) => t.code === 'pro').name = 'Pro Plus';
  fixture.bundles.items.find((b) => b.code === 'clinica-completa').name = 'Clínica Total';
  fixture.bundles.items.find((b) => b.code === 'finca-directa').name = 'Finca Libre';
  const links = requestLinks(renderSection(fixture, TEST_CONFIG));
  const expected = expectedMessages(fixture);
  assert.deepEqual(links.map((l) => decode(l.href)), expected.map((e) => e.text));
  const texts = links.map((l) => decode(l.href));
  assert.ok(texts.includes('Hola, quiero información del plan Agenda Salud · Crece (gtl-ai.com)'));
  assert.ok(texts.includes('Hola, quiero información del plan Pedidos · Pro Plus (gtl-ai.com)'));
  assert.ok(texts.includes('Hola, quiero información del paquete Clínica Total (gtl-ai.com)'));
});

// Every link that opens a new tab says so inside it, visually hidden; the visible labels stay as they were.
const NEW_TAB_SPAN = `<span class="visually-hidden">${NEW_TAB_TEXT}</span>`;
test('every target="_blank" link carries the hidden new-tab notice', () => {
  assert.equal(NEW_TAB_TEXT, '(abre WhatsApp en una pestaña nueva)');
  for (const [name, html, count] of [['rendered section', renderSection(data, TEST_CONFIG), 21], ['index.html', index, 21],
    ['privacidad.html', privacy, 0]]) {
    const blank = [...html.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.equal(blank.length, count, name);
    for (const [a, inner] of blank) assert.ok(inner.includes(NEW_TAB_SPAN), `${name}: no new-tab notice in ${a.slice(0, 120)}`);
  }
  const labels = [...index.matchAll(/target="_blank"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
  assert.deepEqual([...new Set(labels)].sort(),
    ['Cotizar mi proyecto', 'Hablar con nosotros', 'Solicitar este paquete', 'Solicitar este plan']);
});

test('links are fully percent-encoded and carry no personal data', () => {
  for (const l of requestLinks(renderSection(data, TEST_CONFIG))) {
    const text = l.href.split('?text=')[1];
    assert.match(text, /^[A-Za-z0-9%()\-_.!~*']+$/, `${l.key}: unencoded character in ${text}`);
    assert.ok(!/@|\d{7,}/.test(decode(l.href)), `${l.key}: message looks like it carries contact data`);
  }
});

// ---------- the config ----------

// PQ1: JD's inputs (2026-10-14), written out independently of site-config.json.
test('the committed config is valid and holds JD\'s PQ1 inputs', () => {
  assert.deepEqual(validateConfig(config), []);
  assert.equal(config.planRequestMode, 'whatsapp');
  assert.equal(config.apiBaseUrl, null);
  assert.equal(config.whatsappNumber, '573192788238');
  assert.equal(config.contactEmail, 'garydmendez@gtl-ai.com');
  assert.equal(config.controller.city, 'Bogotá');
  assert.equal(config.controller.address, 'Cra 47 #104B-15');
  assert.equal(config.privacyPolicyVersion, '1.0');
  assert.equal(config.privacyPolicyDate, '2026-10-15');
  assert.equal(formatDateEs(config.privacyPolicyDate), '15 de octubre de 2026');
  assert.equal(formatWhatsApp(config.whatsappNumber), '+57 319 278 8238');
  assert.deepEqual(validateConfig(TEST_CONFIG), []);
  assert.deepEqual(validateConfig(PENDING_CONFIG), []);
});

test('the config validator rejects malformed values', () => {
  const bad = (patch) => validateConfig({ ...TEST_CONFIG, ...patch });
  assert.ok(bad({ whatsappNumber: '+57 300 123 4567' }).some((e) => /whatsappNumber/.test(e)));
  assert.ok(bad({ whatsappNumber: '' }).some((e) => /whatsappNumber is required/.test(e)));
  assert.ok(bad({ contactEmail: 'no-es-correo' }).some((e) => /contactEmail/.test(e)));
  assert.ok(bad({ controller: { ...TEST_CONFIG.controller, city: '' } }).some((e) => /controller.city/.test(e)));
  assert.ok(bad({ controller: { ...TEST_CONFIG.controller, address: '' } }).some((e) => /controller.address/.test(e)));
  assert.ok(bad({ privacyPolicyDate: '16/10/2026' }).some((e) => /privacyPolicyDate/.test(e)));
  assert.ok(bad({ planRequestMode: 'email' }).some((e) => /planRequestMode/.test(e)));
  assert.ok(bad({ planRequestMode: 'form' }).some((e) => /Pass B/.test(e)));
});

test('release items: PENDIENTE and missing values fail; test values with apiBaseUrl null pass', () => {
  assert.deepEqual(configReleaseItems(PENDING_CONFIG).map((i) => i.split(/\s+/)), [
    ['PENDIENTE', 'whatsappNumber'], ['PENDIENTE', 'contactEmail'], ['PENDIENTE', 'controller.city'],
    ['PENDIENTE', 'controller.address']]);
  assert.deepEqual(configReleaseItems(config), []);
  assert.deepEqual(configReleaseItems(TEST_CONFIG), []);
  const missing = { ...TEST_CONFIG, contactEmail: undefined, controller: { name: 'x', nit: 'y' } };
  assert.deepEqual(configReleaseItems(missing).map((i) => i.split(/\s+/)), [['missing', 'contactEmail'], ['missing', 'controller.city'],
    ['missing', 'controller.address']]);
  assert.deepEqual(configReleaseItems({ ...TEST_CONFIG, controller: { ...TEST_CONFIG.controller, address: 'PENDIENTE' } })
    .map((i) => i.split(/\s+/)), [['PENDIENTE', 'controller.address']]);
  assert.deepEqual(configReleaseItems({ ...TEST_CONFIG, whatsappNumber: 'PENDIENTE-57' }).length, 1);
});

test('release items: form mode needs an https:// apiBaseUrl', () => {
  const form = { ...TEST_CONFIG, planRequestMode: 'form' };
  assert.equal(configReleaseItems({ ...form, apiBaseUrl: null }).length, 1);
  assert.equal(configReleaseItems({ ...form, apiBaseUrl: 'http://api.gtl-ai.com' }).length, 1);
  assert.deepEqual(configReleaseItems({ ...form, apiBaseUrl: 'https://api.gtl-ai.com' }), []);
  assert.deepEqual(configReleaseItems({ ...TEST_CONFIG, apiBaseUrl: null }), []);
});

// ---------- the privacy page ----------

const chrome = sharedChrome(index);
const renderWith = (cfg) => renderPrivacy(template, cfg, chrome);
const textOf = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const HEADINGS = ['1. Responsable', '2. Qué datos recibimos', '3. Para qué los usamos', '4. Autorización',
  '5. Quién más los maneja', '6. Sus derechos', '7. Cómo ejercerlos', '8. Cuánto tiempo los guardamos', '9. Vigencia'];

test('the privacy page states every element the contract lists, from config', () => {
  const html = renderWith(TEST_CONFIG);
  const text = textOf(html);
  assert.match(html, /<html lang="es-CO">/);
  assert.match(html, /<title>Política de tratamiento de datos personales/);
  assert.deepEqual([...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]), HEADINGS);
  for (const s of [
    'GTL AI (sociedad en constitución), NIT en trámite, con domicilio en Medellín, Colombia, y dirección Calle 10 # 43-12.',
    'Correo: privacidad@example.com', 'Teléfono y WhatsApp: +57 300 123 4567',
    'recibimos su número, su nombre de perfil y lo que nos cuente en la conversación',
    'Para responder su solicitud', 'seguimiento comercial',
    'Tratamos sus datos con su autorización',
    'WhatsApp (Meta)', 'GitHub Pages', 'nuestro proveedor de correo electrónico para recibir y responder sus solicitudes',
    'fuera de Colombia', 'Ley 1581 de 2012', 'acceder a ellos en forma gratuita',
    'Superintendencia de Industria y Comercio (SIC)', 'Escríbanos a privacidad@example.com',
    'consultas en un máximo de 10 días hábiles', 'no superará 5 días hábiles adicionales',
    'reclamos en un máximo de 15 días hábiles, prorrogables hasta por 8 días hábiles más',
    'Hasta 24 meses', 'Versión 0.1, vigente desde el 16 de octubre de 2026',
  ]) assert.ok(text.includes(s), `missing: ${s}`);
  assert.match(html, /href="mailto:privacidad@example.com"/);
  assert.match(html, /href="https:\/\/wa.me\/573001234567"/);
});

test('form-mode paragraphs are absent in WhatsApp mode and present in form mode', () => {
  const formOnly = ['Cuando usa el formulario de solicitud', 'al marcar la casilla de autorización del formulario',
    'Para el formulario usamos además un proveedor de servidor.'];
  const wa = textOf(renderWith(TEST_CONFIG));
  const form = textOf(renderWith({ ...TEST_CONFIG, planRequestMode: 'form', apiBaseUrl: 'https://api.example.com' }));
  for (const s of formOnly) {
    assert.ok(!wa.includes(s), `shown in WhatsApp mode: ${s}`);
    assert.ok(form.includes(s), `missing in form mode: ${s}`);
  }
  assert.ok(!privacy.includes('data-form-only') && !privacy.includes('<!-- form'));
});

test('the committed privacidad.html is the template with the committed config; version and date equal config', () => {
  assert.equal(privacy, renderWith(config));
  const span = (k) => (privacy.match(new RegExp(`data-config="${k}">([^<]*)<`)) || [])[1];
  assert.equal(span('privacyPolicyVersion'), config.privacyPolicyVersion);
  assert.equal(span('privacyPolicyDate'), formatDateEs(config.privacyPolicyDate));
  assert.ok(textOf(privacy).includes(`${config.controller.name}, NIT ${config.controller.nit}, con domicilio en ${config.controller.city}, Colombia, y dirección ${config.controller.address}.`));
});

test('the privacy page reuses the site header and footer with links to index.html', () => {
  assert.match(privacy, /<header class="site-header" lang="en">/);
  for (const id of ['about', 'planes', 'team', 'future', 'contact']) assert.ok(privacy.includes(`href="index.html#${id}"`), id);
  assert.ok(privacy.includes('<a href="index.html" class="logo">'));
  assert.ok(!/href="#/.test(privacy), 'an in-page link was not rewritten');
  assert.ok(privacy.includes('<a aria-current="page" href="privacidad.html" class="footer-privacy" lang="es-CO">Privacidad</a>'));
});

test('privacy release items: the draft marker and PENDIENTE values are caught; the committed page passes', () => {
  // PQ1 deleted the marker line from the template; it must not come back.
  assert.doesNotMatch(template, /PENDIENTE/);
  assert.match(template, /^<!DOCTYPE html>\r?\n<html lang="es-CO">/);
  assert.deepEqual(privacyReleaseItems(privacy), []);
  const draftTemplate = '<!DOCTYPE html>\n<!-- PENDIENTE-COPY: draft text -->\n' + template.replace(/^<!DOCTYPE html>\r?\n/, '');
  const items = privacyReleaseItems(renderPrivacy(draftTemplate, PENDING_CONFIG, chrome));
  assert.ok(items.some((i) => /PENDIENTE-COPY: draft text/.test(i)), 'draft marker not reported');
  assert.ok(items.some((i) => /con domicilio en PENDIENTE/.test(i)));
  assert.deepEqual(privacyReleaseItems(renderPrivacy(template, TEST_CONFIG, chrome)), []);
  const handEdited = renderPrivacy(template, TEST_CONFIG, chrome).replace('Medellín', 'PENDIENTE');
  assert.equal(privacyReleaseItems(handEdited).length, 1);
});

const TU_FORMS = ['tu', 'tus', 'tuyo', 'tuyos', 'te', 'contigo', 'puedes', 'quieras', 'escríbenos', 'cuéntanos',
  'agrégalos', 'pagas', 'haces', 'sabes', 'trabajas', 'escribes', 'usas', 'incluyas', 'conviertas', 'avisamos'];

test('register: the privacy page addresses the visitor as usted', () => {
  const word = new RegExp(`(?<![\\p{L}\\p{N}])(${TU_FORMS.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
  assert.ok(word.test('Si USAS el formulario') && !word.test('Cuando usa el formulario'), 'the matcher itself works');
  const main = textOf(renderWith({ ...TEST_CONFIG, planRequestMode: 'form' }).split('<main>')[1].split('</main>')[0]);
  assert.equal(main.match(word), null);
});

test('dates and numbers are formatted for the page', () => {
  assert.equal(formatDateEs('2026-10-16'), '16 de octubre de 2026');
  assert.equal(formatDateEs('2027-01-01'), '1 de enero de 2027');
  assert.equal(formatWhatsApp('573001234567'), '+57 300 123 4567');
  assert.equal(formatWhatsApp('13055550123'), '+13055550123');
  assert.equal(formatWhatsApp('PENDIENTE'), 'PENDIENTE');
});

// ---------- the footer link and the CLI ----------

test('index.html has one "Privacidad" link, in the footer, and the check requires it', () => {
  assert.equal(index.split('href="privacidad.html"').length - 1, 1);
  assert.ok(index.split('<footer')[1].includes(FOOTER_LINK));
  assert.deepEqual(wiringProblems(index), []);
  assert.ok(wiringProblems(index.replace(FOOTER_LINK, '')).some((p) => /Privacidad/.test(p)));
  // The build puts it back.
  assert.ok(applyToIndex(index.replace(`\n    ${FOOTER_LINK}`, ''), renderSection(data, config)).includes(FOOTER_LINK));
});

test('--release passes with the committed config and pages (PQ1)', () => {
  const r = run('--release');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Release check passed/);
  assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stdout, /FAILED|apiBaseUrl/);
  assert.ok(!privacy.includes('PENDIENTE'));
});
