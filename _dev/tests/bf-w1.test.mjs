// BF-W1: French, the language menu's flags, the footer's company line and Instagram link, prices with VAT included,
// the launch banner and demos behind one switch, and the translation check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  loadConfig, validateConfig, applySiteConfig, sharedChrome, footerCompany, renderLaunchBanner, renderLaunchDemos,
  contactLinks, BANNER_START, BANNER_END, DEMOS_START, DEMOS_END, LINK_LANGS, CONTACT_MESSAGES, PRICES_MESSAGES,
  INDEX_PATH, PRIVACY_PATH, PRICES_PATH, SITE_ROOT,
} from '../build-pricing.mjs';
import { check, loadEngine, readPage, shownText, stringsOf } from '../scripts/check-i18n.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LF = (s) => s.replace(/\r\n/g, '\n');
const read = (path) => LF(readFileSync(path, 'utf8'));
const config = loadConfig();
const index = read(INDEX_PATH);
const prices = read(PRICES_PATH);
const privacy = read(PRIVACY_PATH);
const PAGES = [['index.html', index], ['precios.html', prices], ['privacidad.html', privacy]];
const count = (text, part) => text.split(part).length - 1;
const footerOf = (html) => html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
const headerOf = (html) => html.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];

// ---------- the language menu ----------

test('the menu offers Español, English and Français, each with its flag as an image and its name', () => {
  for (const [name, html] of PAGES) {
    const menu = html.match(/<ul class="lang-menu" id="lang-menu" hidden>([\s\S]*?)<\/ul>/)[1];
    const options = [...menu.matchAll(/<button type="button" lang="(\w+)" data-lang="(\w+)"><img class="lang-flag" src="(assets\/flags\/\w+\.svg)" alt=""[^>]*><b aria-hidden="true">(\w+)<\/b><span>([^<]*)<\/span><\/button>/g)]
      .map((m) => m.slice(1));
    assert.deepEqual(options, [
      ['es', 'es', 'assets/flags/co.svg', 'ES', 'Español'],
      ['en', 'en', 'assets/flags/us.svg', 'ENG', 'English'],
      ['fr', 'fr', 'assets/flags/fr.svg', 'FRA', 'Français'],
    ], name);
    // The closed menu: the current language's flag and code, one span per language (style.css shows the active one).
    const current = html.match(/<button type="button" class="lang-current"[^>]*>([\s\S]*?)<\/button>/)[1];
    assert.deepEqual([...current.matchAll(/<span class="lang-is lang-is-(\w+)"><img class="lang-flag" src="assets\/flags\/(\w+)\.svg" alt=""[^>]*><span>(\w+)<\/span><\/span>/g)]
      .map((m) => m.slice(1)), [['es', 'co', 'ES'], ['en', 'us', 'ENG'], ['fr', 'fr', 'FRA']], name);
    // No flag emoji (Windows does not draw them) and no UK flag.
    assert.doesNotMatch(html, /[\u{1F1E6}-\u{1F1FF}]|flags\/gb\.svg/u, name);
    // The page shows nothing in Spanish first when English or French was chosen.
    assert.ok(html.includes("if(l==='en'||l==='fr'){document.documentElement.classList.add('i18n-pending')"), name);
  }
  for (const flag of ['co', 'us', 'fr']) {
    const svg = readFileSync(join(SITE_ROOT, 'assets', 'flags', `${flag}.svg`), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, flag);
    assert.ok(svg.length < 2000, `${flag}.svg is small`);
  }
});

test('i18n.js knows three languages, keeps Spanish as the default and sets <html lang>', () => {
  const i18n = loadEngine();
  assert.deepEqual([...i18n.langs], ['en', 'fr']);          // the languages with a table; Spanish is the page itself
  const js = read(join(SITE_ROOT, 'i18n.js'));
  assert.ok(js.includes("var HTML_LANG = { es: 'es-CO', en: 'en', fr: 'fr' };"));
  assert.ok(js.includes("var start = 'es';"));
  assert.ok(js.includes("var KEY = 'gtl-lang';"));
});

// ---------- the footer and Instagram ----------

// The ticket's values, written out independently of site-config.json.
const COMPANY_LINE = '<p class="footer-company" data-i18n="off"><span>GTL AI S.A.S</span> <span class="nowrap">NIT 902.117.320-8</span> '
  + '<span>Cra. 47 #104B-15, Bogotá, Colombia</span></p>';
const INSTAGRAM = 'https://www.instagram.com/gtl_ai_/';

test('the footer shows the legal name, the NIT and the address from the config, on every page', () => {
  assert.equal(config.controller.name, 'GTL AI S.A.S');
  assert.equal(config.controller.nit, '902.117.320-8');
  assert.equal(config.controller.footerAddress, 'Cra. 47 #104B-15, Bogotá, Colombia');
  assert.equal(footerCompany(config), COMPANY_LINE);
  for (const [name, html] of PAGES) {
    assert.equal(count(html, COMPANY_LINE), 1, name);
    assert.equal(count(footerOf(html), COMPANY_LINE), 1, name);
    assert.match(footerOf(html), /class="footer-email"/, name);
    assert.match(footerOf(html), /class="footer-privacy"/, name);
  }
});

test('the privacy page names the same company and NIT, with nothing pending, and no page has structured data', () => {
  assert.ok(privacy.includes('<p>GTL AI S.A.S, NIT 902.117.320-8, con domicilio en Bogotá D.C., Colombia, y dirección Carrera 47 # 104B-15.</p>'));
  for (const [name, html] of PAGES) {
    assert.doesNotMatch(html, /en constitución|en trámite/i, name);
    assert.doesNotMatch(html, /application\/ld\+json/, name);
  }
  // The policy's text did not change in BF-W1, so its version did not either.
  assert.equal(config.privacyPolicyVersion, '1.2');
});

test('the footer links to the company Instagram: an icon with a name, in a new tab, noopener noreferrer', () => {
  assert.equal(config.instagramUrl, INSTAGRAM);
  for (const [name, html] of PAGES) {
    const links = [...footerOf(html).matchAll(/<a href="([^"]*)" class="footer-social" target="_blank" rel="noopener noreferrer">([\s\S]*?)<\/a>/g)];
    assert.equal(links.length, 1, name);
    assert.equal(links[0][1], INSTAGRAM, name);
    assert.match(links[0][2], /^<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">[\s\S]*<\/svg><span class="visually-hidden">Instagram de GTL AI<\/span> <span class="visually-hidden">\(abre en una pestaña nueva\)<\/span>$/, name);
    assert.equal(count(html, 'instagram.com'), 1, name);
  }
  const i18n = loadEngine();
  assert.equal(i18n.translate('Instagram de GTL AI', 'en'), 'GTL AI on Instagram');
  assert.equal(i18n.translate('Instagram de GTL AI', 'fr'), 'Instagram de GTL AI');
});

test('the build writes the footer address and the Instagram link from whatever the config holds', () => {
  const set = { ...config, controller: { ...config.controller, footerAddress: 'Calle 1 #2-3, Cali, Colombia' }, instagramUrl: 'https://www.instagram.com/otra.cuenta/' };
  const html = applySiteConfig(index, set);
  assert.ok(html.includes('<span>Calle 1 #2-3, Cali, Colombia</span></p>'));
  assert.ok(html.includes('<a href="https://www.instagram.com/otra.cuenta/" class="footer-social"'));
  assert.equal(applySiteConfig(html, config), index);
});

test('the config check asks for the footer address, the Instagram address and the launch values', () => {
  assert.deepEqual(validateConfig(config), []);
  const errorsOf = (change) => { const c = structuredClone(config); change(c); return validateConfig(c).join('\n'); };
  assert.match(errorsOf((c) => { delete c.controller.footerAddress; }), /controller\.footerAddress/);
  assert.match(errorsOf((c) => { c.instagramUrl = 'http://instagram.com/gtl_ai_'; }), /instagramUrl/);
  assert.match(errorsOf((c) => { c.launch.enabled = 'true'; }), /launch\.enabled/);
  assert.match(errorsOf((c) => { c.launch.liveFrom = '2026-11-27T00:00:00'; }), /launch\.liveFrom/);
  assert.match(errorsOf((c) => { c.launch.demos[0].url = 'https://demo-fisio-deportiva.gtl-ai.com/agenda'; }), /launch\.demos/);
  assert.match(errorsOf((c) => { c.launch.demos = []; }), /launch\.demos/);
});

// ---------- the launch banner and the demos (release 2) ----------

// Decisions 3 and 4, written out independently of the build and the config.
const DECISION_3 = {
  before: ['Lanzamiento oficial este Black Friday, viernes 27 de noviembre.', 'Vea las demos por especialidad.'],
  after: ['Ya estamos en vivo: sitios web con agenda en línea para cada especialidad.', 'Vea las demos.'],
};
const DECISION_4 = [
  ['Fisioterapia deportiva', 'https://demo-fisio-deportiva.gtl-ai.com'],
  ['Fisioterapia', 'https://demo-fisio-general.gtl-ai.com'],
  ['Odontología', 'https://demo-odontologia.gtl-ai.com'],
  ['Estética', 'https://demo-estetica.gtl-ai.com'],
  ['Nutrición', 'https://demo-nutricion.gtl-ai.com'],
  ['Psicología', 'https://demo-psicologia.gtl-ai.com'],
  ['Veterinaria', 'https://demo-veterinaria.gtl-ai.com'],
];
const ON = { ...config, launch: { ...config.launch, enabled: true } };
const OFF = { ...config, launch: { ...config.launch, enabled: false } };

// The committed pages follow the switch, so release 2 is the one-line change in the config and a build: off (release
// 1), no page carries the banner or the demos; on, every page carries the banner and the home page the demos.
test('the pages carry the banner and the demos section exactly when the switch is on (off for release 1)', () => {
  const on = config.launch.enabled;
  assert.equal(typeof on, 'boolean');
  assert.equal(renderLaunchBanner(config) !== '', on);
  assert.equal(renderLaunchDemos(config) !== '', on);
  if (!on) {
    assert.ok(index.includes(`${BANNER_START}\n${BANNER_END}\n<header class="site-header">`));
    assert.ok(index.includes(`  ${DEMOS_START}\n  ${DEMOS_END}\n`));
  }
  for (const [name, html] of PAGES) {
    if (!on) {
      assert.doesNotMatch(html, /class="launch-banner"|data-launch-|id="demos"|demo-card|demo-[\w-]+\.gtl-ai\.com/, name);
      continue;
    }
    assert.equal(count(html, '<aside class="launch-banner"'), 1, name);
    assert.ok(html.indexOf('<aside class="launch-banner"') < html.indexOf('<header class="site-header">'), name);
    assert.equal(count(html, '<section id="demos"'), name === 'index.html' ? 1 : 0, name);
  }
});

test('release 2: the switch on writes the banner above the header and the demos after the stories; off gives the page back', () => {
  assert.deepEqual(config.launch.demos.map((d) => [d.name, d.url]), DECISION_4);
  assert.equal(config.launch.liveFrom, '2026-11-27T00:00:00-05:00');
  // From the page as release 1 ships it, whichever way the committed switch is set.
  const off = applySiteConfig(index, OFF);
  const html = applySiteConfig(off, ON);

  const banner = html.slice(html.indexOf(BANNER_START) + BANNER_START.length, html.indexOf(BANNER_END));
  assert.ok(html.indexOf(BANNER_END) < html.indexOf('<header class="site-header">'));
  assert.ok(banner.includes('<aside class="launch-banner" aria-label="Lanzamiento" data-launch-banner data-live-from="2026-11-27T05:00:00.000Z">'));
  for (const [state, [text, link]] of Object.entries(DECISION_3)) {
    const hidden = state === 'after' ? ' hidden' : '';
    assert.ok(banner.includes(`<span data-launch-text="${state}"${hidden}>${text}</span>`), state);
    assert.match(banner, new RegExp(`<a href="#demos">(?:(?!</a>).)*<span data-launch-text="${state}"${hidden}>${link.replace(/\./g, '\\.')}</span>`), state);
  }
  assert.ok(banner.includes('<button type="button" class="launch-banner-close" data-launch-close aria-label="Cerrar aviso">&times;</button>'));
  // Decision 2: it announces the launch; no discount.
  assert.doesNotMatch(banner.replace(/<script>[\s\S]*<\/script>/, ''), /descuento|oferta|%|\$/i);

  const demos = html.slice(html.indexOf(DEMOS_START), html.indexOf(DEMOS_END));
  assert.ok(html.indexOf('<section id="stories"') < html.indexOf(DEMOS_START));
  assert.ok(demos.includes('<section id="demos" class="demos" aria-labelledby="demos-title">'));
  assert.ok(demos.includes('<h2 id="demos-title">Demos por especialidad</h2>'));
  assert.ok(demos.includes('<p class="section-sub">Sitios de muestra con agenda en línea, uno por especialidad. Los datos son de ejemplo.</p>'));
  const cards = [...demos.matchAll(/<li class="demo-card"><h3 id="demo-(\d)-title">([^<]*)<\/h3><p>([^<]*)<\/p><a class="btn btn-ghost demo-link" id="demo-\1-link" aria-labelledby="demo-\1-link demo-\1-title" href="([^"]*)" target="_blank" rel="noopener noreferrer">Ver demo <span class="visually-hidden">\(abre en una pestaña nueva\)<\/span><\/a><\/li>/g)];
  assert.deepEqual(cards.map((m) => [m[2], m[4]]), DECISION_4);
  assert.equal(count(demos, '<li class="demo-card">'), 7);
  // Each description is one line with no claim: what kind of practice the demo is for.
  for (const m of cards) assert.match(m[3], /^Para (centros|consultorios|clínicas)[^.]*\.$/, m[3]);

  // Criterion 13: no new header link; the banner's link leads to the section.
  assert.equal(headerOf(html), headerOf(off));
  // The other pages carry the banner above their header, linking to the home page's section.
  for (const page of ['precios.html', 'privacidad.html']) {
    const chrome = sharedChrome(html, page);
    assert.ok(chrome.header.startsWith('<aside class="launch-banner"'), page);
    assert.equal(count(chrome.header, '<a href="index.html#demos">'), 1, page);
    assert.doesNotMatch(sharedChrome(off, page).header, /launch-banner/, page);
  }
  // Off again: exactly the page as it was. And the committed page is what the committed switch builds.
  assert.equal(applySiteConfig(html, OFF), off);
  assert.equal(applySiteConfig(index, config), index);
});

// The banner's own script, run here with a clock, a store and the banner's parts standing in for the page's.
function runBanner(nowIso, closed = null) {
  const script = renderLaunchBanner(ON).match(/<script>([\s\S]*)<\/script>/)[1];
  const texts = ['before', 'after', 'before', 'after'].map((state) => ({ state, hidden: state === 'after', getAttribute: () => state }));
  const store = new Map(closed ? [['gtl-launch-closed', closed]] : []);
  const page = { now: Date.parse(nowIso), timers: [], click: null, store, texts };
  const banner = {
    hidden: false,
    getAttribute: (name) => (name === 'data-live-from' ? '2026-11-27T05:00:00.000Z' : null),
    querySelectorAll: () => texts,
    querySelector: () => ({ addEventListener: (type, fn) => { page.click = fn; } }),
  };
  page.banner = banner;
  page.shown = () => (banner.hidden ? null : [...new Set(texts.filter((t) => !t.hidden).map((t) => t.state))].join());
  vm.runInNewContext(script, {
    document: { querySelector: () => banner },
    Date: { now: () => page.now, parse: Date.parse },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) },
    setTimeout: (fn, ms) => page.timers.push([fn, ms]),
  });
  return page;
}

test('the banner changes its text by itself at 00:00 in Bogotá on Friday 27 November, and can be closed', () => {
  // 23:59:59 on Thursday 26 in Bogotá (UTC-5): the first text, and a timer for the second.
  const before = runBanner('2026-11-27T04:59:59.000Z');
  assert.equal(before.shown(), 'before');
  assert.deepEqual(before.timers.map((t) => t[1]), [1000]);
  before.now += 1000;
  before.timers[0][0]();
  assert.equal(before.shown(), 'after');
  // 00:00:00 on Friday 27 in Bogotá, and later: the second text, no timer.
  for (const now of ['2026-11-27T05:00:00.000Z', '2026-12-05T12:00:00.000Z']) {
    const after = runBanner(now);
    assert.equal(after.shown(), 'after', now);
    assert.deepEqual(after.timers, [], now);
  }
  assert.equal(runBanner('2026-11-16T15:00:00.000Z').shown(), 'before');
  // Closing hides it and is remembered for that text only: the launch-day text shows again.
  const closing = runBanner('2026-11-20T15:00:00.000Z');
  closing.click();
  assert.equal(closing.shown(), null);
  assert.equal(closing.store.get('gtl-launch-closed'), 'before');
  assert.equal(runBanner('2026-11-21T15:00:00.000Z', 'before').shown(), null);
  assert.equal(runBanner('2026-11-27T05:00:00.000Z', 'before').shown(), 'after');
  assert.equal(runBanner('2026-11-28T05:00:00.000Z', 'after').shown(), null);
});

test('the banner and the demos read in English and French, and say the demos are in Spanish', () => {
  const i18n = loadEngine();
  const texts = [...Object.values(DECISION_3).flat(), 'Demos por especialidad', 'Ver demo', 'Lanzamiento', 'Cerrar aviso',
    ...config.launch.demos.flatMap((d) => [d.name, d.description])];
  for (const l of ['en', 'fr']) for (const t of texts) assert.ok(i18n.has(t, l), `${l}: ${t}`);
  const line = 'Sitios de muestra con agenda en línea, uno por especialidad. Los datos son de ejemplo.';
  assert.match(i18n.translate(line, 'en'), /sample data\. The demos are in Spanish\.$/);
  assert.match(i18n.translate(line, 'fr'), /Les données sont des exemples\. Les démos sont en espagnol\.$/);
});

// ---------- prices ----------

test('the four plans cost $ 100.000, $ 200.000, $ 300.000 and $ 500.000 a month with VAT included; Falco too', () => {
  const amounts = [...prices.matchAll(/<p class="pr-price"><span class="pr-amount">([^<]*)<\/span>(?:<span class="pr-unit">([^<]*)<\/span>)?<\/p>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(amounts, [
    ['$&nbsp;100.000', '/ mes, IVA incluido'], ['$&nbsp;200.000', '/ mes, IVA incluido'], ['$&nbsp;300.000', '/ mes, IVA incluido'],
    ['$&nbsp;500.000', '/ mes, IVA incluido'], ['A cotizar', undefined], ['A cotizar', undefined], ['+ $&nbsp;150.000', '/ mes, IVA incluido'],
  ]);
  assert.ok(prices.includes('<p><strong>Sin costo de instalación · Permanencia mínima de 12 meses · Precios en COP, IVA (19 %) incluido</strong></p>'));
  assert.ok(prices.includes('<p>Sí. Los precios están en pesos colombianos e incluyen el IVA (19 %).</p>'));
  assert.ok(prices.includes('<p>Cada mes, el día 1.</p>'));
  assert.ok(index.includes('<p><strong>Planes desde $&nbsp;100.000 al mes, IVA incluido</strong>, sin costo de instalación.</p>'));
});

test('no shipped page or script still shows an old price, "+ IVA" or the annual offer', () => {
  const shipped = ['index.html', 'precios.html', 'privacidad.html', 'i18n.js', 'showcase.js', 'plan-request.js', 'precios.js', 'site-config.js', 'style.css'];
  for (const file of shipped) {
    const text = read(join(SITE_ROOT, file)).replace(/&nbsp;|\u00a0|\\u00a0/g, ' ');
    assert.doesNotMatch(text, /(^|[^\d.])(50|179|299|449)\.000/m, file);
    assert.doesNotMatch(text, /\+ IVA|\+ VAT|no incluyen IVA|2 meses gratis|año completo|2 months free|full year/i, file);
  }
  const i18n = loadEngine();
  assert.equal(i18n.translate('/ mes, IVA incluido', 'en'), '/ month, VAT included');
  // Criterion 6: "IVA incluido" in French is Colombian VAT included (typed with plain spaces here).
  assert.equal(i18n.translate('/ mes, IVA incluido', 'fr'), '/ mois, TVA colombienne (IVA) incluse');
  assert.equal(i18n.translate('Próximamente', 'fr'), 'Bientôt disponible');
});

// ---------- links in three languages ----------

test('every WhatsApp and email link with a prefilled text has it in Spanish, English and French', () => {
  assert.deepEqual(LINK_LANGS, ['en', 'fr']);
  assert.deepEqual(Object.keys(CONTACT_MESSAGES), ['es', 'en', 'fr']);
  for (const [l, m] of Object.entries(CONTACT_MESSAGES)) assert.ok(m.whatsapp.endsWith('(gtl-ai.com)') && m.subject.length > 0, l);
  for (const [key, m] of Object.entries(PRICES_MESSAGES)) {
    assert.deepEqual(Object.keys(m), ['es', 'en', 'fr'], key);
    for (const text of Object.values(m)) assert.ok(text.endsWith('(gtl-ai.com)'), key);
  }
  for (const [name, html] of PAGES) {
    assert.equal(count(html, ' data-en-href="'), count(html, ' data-fr-href="'), name);
    for (const m of html.matchAll(/ href="([^"]*)" data-en-href="([^"]*)" data-fr-href="([^"]*)"/g)) {
      const start = m[1].match(/^(https:\/\/wa\.me\/\d+\?text=|mailto:[^?]*\?subject=|https:\/\/[a-z.]+\/[^?]*\?)/);
      assert.ok(start, `${name}: ${m[1].slice(0, 60)}`);
      assert.ok(m[2].startsWith(start[0].slice(0, 20)) && m[3].startsWith(start[0].slice(0, 20)), name);
      assert.notEqual(m[3], m[1], name);
      assert.notEqual(m[3], m[2], name);
    }
  }
  assert.ok(count(index, ' data-fr-href="') >= 4);
  assert.equal(count(prices, ' data-fr-href="'), 7);
  assert.ok(decodeURIComponent(contactLinks(config, 'fr').whatsapp).endsWith('?text=Bonjour, je souhaite en savoir plus sur GTL AI (gtl-ai.com)'));
  // The form's own WhatsApp links: the one plan option carries the three messages, and plan-request.js picks the page's.
  for (const [name, html] of [['index.html', index], ['precios.html', prices]]) {
    assert.match(html, /<option value="general" data-whatsapp="https:\/\/wa\.me\/\d+\?text=Hola[^"]*" data-whatsapp-en="https:\/\/wa\.me\/\d+\?text=Hi[^"]*" data-whatsapp-fr="https:\/\/wa\.me\/\d+\?text=Bonjour[^"]*">Información general<\/option>/, name);
  }
  assert.ok(read(join(SITE_ROOT, 'plan-request.js')).includes("option.getAttribute('data-whatsapp-' + lang)"));
});

// ---------- French: decision 1, and what must stay the same ----------

test('in French the made-up businesses read as examples: no "real clients", a visible note, scenarios instead of quotes', () => {
  const i18n = loadEngine();
  const fr = (t) => i18n.translate(t, 'fr');
  assert.doesNotMatch(fr('Clientes reales creando su sueño con nosotros'), /r[ée]el|vrai|clients/i);
  assert.match(fr('Clientes reales creando su sueño con nosotros'), /^Exemples illustratifs/);
  const quotes = Object.keys(i18n.tables.fr).filter((k) => k.startsWith('“'));
  assert.equal(quotes.length, 5);
  for (const q of quotes) {
    assert.ok(index.includes(q), q.slice(0, 40));
    assert.match(fr(q), /^Exemple\u00a0: /, q.slice(0, 40));
    assert.doesNotMatch(fr(q), /[“”«»"]/, q.slice(0, 40));
  }
  // Not a quotation in French, and credited to no one (BF-W1 review, N3).
  assert.equal(count(index, '<blockquote data-fr-role="none">'), 5);
  assert.equal(count(index, '<blockquote'), 5);
  assert.match(read(join(SITE_ROOT, 'style.css')), /html\[lang="fr"\] \.story-quote figcaption \{\n  display: none;\n\}/);
  // N5: French groups a number of four digits or more with a no-break space.
  assert.match(fr('Este carácter chino significa «sueño» y se escribe así desde hace más de 3.000 años. Los avances de la humanidad siempre fueron un sueño primero, y nosotros lo elegimos porque de eso se trata GTL AI: de impulsar tus sueños para hacerlos realidad.'), /depuis plus de 3\u00a0000 ans\./);
  // The notes: French only, visible text, not translated again by i18n.js.
  const notes = [...index.matchAll(/<p class="example-note" lang="fr" hidden data-lang-note="fr" data-i18n="off">([^<]*)<\/p>/g)].map((m) => m[1]);
  assert.equal(notes.length, 2);
  for (const n of notes) assert.match(n, /^Exemples illustratifs&nbsp;: .*fictives\.$/);
  assert.ok(index.indexOf(notes[0]) > index.indexOf('<section id="clients"') && index.indexOf(notes[0]) < index.indexOf('<section id="stories"'));
  assert.ok(index.indexOf(notes[1]) > index.indexOf('<section id="stories"'));
  // No address of a made-up site in French.
  assert.match(read(join(SITE_ROOT, 'style.css')), /html\[lang="fr"\] \.story-url \{\n  visibility: hidden;\n\}/);
  // In Spanish and English nothing changes in this ticket.
  assert.ok(index.includes('<h2 id="clients-title">Clientes reales creando su sueño con nosotros</h2>'));
  assert.equal(i18n.translate('Clientes reales creando su sueño con nosotros', 'en'), 'Real clients building their dream with us');
});

test('"Expertise-as-Software" stays in English in every language, and the privacy page says which version applies', () => {
  const i18n = loadEngine();
  const heading = 'Expertise-as-Software: la evolución del SaaS';
  const why = [...index.matchAll(/<p class="why-text">([^<]*)<\/p>/g)].map((m) => m[1]);
  assert.equal(why.length, 3);
  // The plan and add-on names as precios.html shows them in each language.
  const names = {
    en: ['Presence', 'Calendar', 'Management', 'Complete', 'Financial and tax advisory'],
    fr: ['Présence', 'Agenda', 'Gestion', 'Complet', 'Conseil financier et fiscal'],
  };
  for (const l of ['en', 'fr']) {
    assert.match(i18n.translate(heading, l), /^Expertise-as-Software/, l);
    const t = why.map((p) => i18n.translate(p, l));
    assert.equal(count(t[0], 'Expertise-as-Software'), 1, l);
    assert.deepEqual(['Presencia', 'Agenda', 'Gestión', 'Completo', 'Asesorías financieras y tributarias'].map((n) => i18n.translate(n, l)), names[l], l);
    const [presence, calendar, management, complete] = names[l];
    for (const n of [presence, calendar, management, complete]) assert.ok(t[1].includes(`${n}, `), `${l}: ${n}`);
    assert.match(t[1], l === 'en' ? /financial and tax advisory/ : /conseil financier et fiscal/, l);
    assert.match(t[1], /Falco/, l);
    assert.match(t[2], /Bogotá/, l);
    assert.match(t[2], /Paris/, l);
  }
  assert.ok(privacy.includes('<p class="container legal-lang-note" lang="en" hidden data-lang-note="en" data-i18n="off">This is a translation. The Spanish version of this policy is the one that applies.</p>'));
  assert.ok(privacy.includes('<p class="container legal-lang-note" lang="fr" hidden data-lang-note="fr" data-i18n="off">Ceci est une traduction. Seule la version en espagnol de cette politique fait foi.</p>'));
  assert.ok(privacy.indexOf('data-lang-note="fr"') < privacy.indexOf('<h1'));
  // The policy itself is translated now: its <main> is no longer marked data-i18n="off".
  assert.match(privacy, /<main lang="es-CO">/);
  assert.equal(i18n.translate('GTL AI S.A.S, NIT 902.117.320-8, con domicilio en Bogotá D.C., Colombia, y dirección Carrera 47 # 104B-15.', 'fr'),
    'GTL AI S.A.S, NIT 902.117.320-8, domiciliée à Bogotá D.C., Colombie, à l’adresse Carrera 47 # 104B-15.');
  assert.equal(i18n.translate('30 de octubre de 2026', 'fr'), '30 octobre 2026');
  assert.equal(i18n.translate('1 de enero de 2027', 'fr'), '1er janvier 2027');
  assert.equal(i18n.translate('30 de octubre de 2026', 'en'), 'October 30, 2026');
});

test('French is typed with plain spaces and written with no-break spaces where French wants them', () => {
  const i18n = loadEngine();
  const fr = (t) => i18n.translate(t, 'fr');
  assert.equal(fr('¿Cómo se paga?'), 'Comment se fait le paiement\u00a0?');
  assert.equal(fr('significa «sueño»'), 'signifie «\u00a0rêve\u00a0»');
  assert.equal(fr('A las 3:15, por favor.'), 'À 15\u00a0h\u00a015, s’il vous plaît.');
  assert.match(fr('Llevas $ 2.340.000 hoy, 8 % más que el martes pasado.'), /\$\u00a02\.340\.000 aujourd’hui, 8\u00a0% de plus/);
  assert.equal(fr('Nombre: Escriba su nombre.'), 'Nom\u00a0: Saisissez votre nom.');
  assert.equal(fr('El nombre debe tener al menos 2 caracteres.'), 'Le nom doit comporter au moins 2 caractères.');
  assert.equal(fr('El correo no puede superar los 254 caracteres.'), 'L’e-mail ne peut pas dépasser 254 caractères.');
  // The table itself has no no-break space and no straight apostrophe in a French text.
  for (const [k, v] of Object.entries(i18n.tables.fr)) {
    if (v === k) continue;
    assert.doesNotMatch(v, /\u00a0|\u202f/, k);
    assert.doesNotMatch(v, /\p{L}'\p{L}/u, k);
  }
  // Formal register: no "tu" forms.
  for (const [k, v] of Object.entries(i18n.tables.fr)) assert.doesNotMatch(v, /(^|[\s’(])(tu|toi|ton|ta|tes|te|t’)(?=[\s,.?!]|$)/i, k);
});

// ---------- the translation check (criterion 9) ----------

test('the translation check finds every text in English and French, and prints nothing', () => {
  const r = check();
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.problems, []);
  assert.ok(r.used.size > 450, `${r.used.size} texts read`);
  // Every entry of the two tables is used, the launch's (switched off) included.
  assert.deepEqual(r.unused, { en: [], fr: [] });
  assert.ok(r.used.has('Vea las demos por especialidad.') && r.used.has('Ver demo') && r.used.has('Cerrar aviso'));
  for (const i of r.images) assert.ok(i.exists && existsSync(join(SITE_ROOT, i.file)), i.file);
  const cli = spawnSync(process.execPath, [join(here, '..', 'scripts', 'check-i18n.mjs')], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stdout);
  assert.equal(cli.stdout, '');
  assert.equal(cli.stderr, '');
  const later = spawnSync(process.execPath, [join(here, '..', 'scripts', 'check-i18n.mjs'), '--later'], { encoding: 'utf8' });
  assert.match(later.stdout, /Text inside image and video files \(cannot be translated\):\n {2}assets\/branding\/holiday-hat\.png: "FELIZ NAVIDAD"/);
});

test('the check reads a page as i18n.js does, and reports a text with no translation', () => {
  const page = '<!DOCTYPE html><html><head><title>Un título nuevo</title><meta name="description" content="Una descripción nueva"></head><body>'
    + '<!-- Un comentario --><p>Un texto <b>nuevo</b> aquí</p><p data-i18n="off">GTL AI S.A.S</p><img alt="Una foto nueva" src="a.png">'
    + '<p hidden data-lang-note="fr">Une note</p><script>var s = "Un mensaje nuevo.";</script><style>p{color:red}</style></body></html>';
  const r = readPage(page, 'x.html');
  assert.deepEqual(r.texts.map((t) => t.text), ['Un título nuevo', 'Una descripción nueva', 'Un texto', 'nuevo', 'aquí', 'Una foto nueva']);
  assert.deepEqual(r.kept.map((t) => t.text), ['GTL AI S.A.S']);
  assert.equal(r.problems.length, 1);                       // the note is not marked data-i18n="off"
  assert.deepEqual(r.scripts.flatMap(stringsOf).map(shownText), ['Un mensaje nuevo.']);
  assert.equal(shownText('use strict'), null);
  assert.equal(shownText('data-request-form'), null);
  assert.equal(shownText('Enviando…'), 'Enviando…');
  const i18n = loadEngine();
  assert.equal(i18n.has('Un texto nuevo aquí', 'fr'), false);
  assert.equal(i18n.has('Privacidad', 'fr'), true);
  assert.equal(i18n.has('Privacidad'), true);
});
