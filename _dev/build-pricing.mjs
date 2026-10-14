// Renders the "Planes y precios" section from _dev/pricing.json into index.html, and the
// privacy page from _dev/templates/privacidad.html into privacidad.html (PF2). Both read
// _dev/site-config.json for the WhatsApp number, the contact email and the controller.
// W0: the build also writes the footer email and the founders' Background lists from site-config.json.
//
//   node build-pricing.mjs            write the section between the pricing markers, and privacidad.html
//   node build-pricing.mjs --check    fail if index.html or privacidad.html differs from the data (EOL-normalised)
//   node build-pricing.mjs --release  --check, plus fail while any price is "propuesta", any text is
//                                     "PENDIENTE-COPY", or a config value or privacidad.html is PENDIENTE
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(here, 'pricing.json');
export const INDEX_PATH = join(here, '..', 'index.html');
export const CONFIG_PATH = join(here, 'site-config.json');
export const PRIVACY_TEMPLATE_PATH = join(here, 'templates', 'privacidad.html');
export const PRIVACY_PATH = join(here, '..', 'privacidad.html');

export const START = '<!-- pricing:start -->';
export const END = '<!-- pricing:end -->';
const HEAD_SCRIPT = "<script>document.documentElement.classList.add('js')</script>";
// If pricing.js fails to load, drop the "js" class so every package stays listed (step 8, N8).
const JS_TAG = '<script src="pricing.js" defer onerror="document.documentElement.classList.remove(\'js\')"></script>';
const OLD_JS_TAG = '<script src="pricing.js" defer></script>';
const NAV_LINK = '<a href="#planes">Planes</a>';
const DRAFT = 'PENDIENTE-COPY';
const PENDING = 'PENDIENTE';
const THREE_TIERS = ['esencial', 'crece', 'pro'];
const FOOTER_EMAIL_LINK = /<a href="mailto:[^"]*" class="footer-email">[^<]*<\/a>/;
export const FOOTER_LINK = '<a href="privacidad.html" class="footer-privacy" lang="es-CO">Privacidad</a>';

// es-CO thousands separator without Intl, so output never depends on locale data.
export function formatCOP(n) {
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A text field is either a confirmed string or a draft { text, copyStatus } object.
export const txt = (v) => (v && typeof v === 'object' ? v.text : v);

export function loadData(path = DATA_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const isAmount = (n) => Number.isInteger(n) && n > 0;

function findPart(data, part) {
  if (part.type === 'plan') {
    const pkg = data.packages.find((p) => p.code === part.package);
    const tier = pkg && pkg.tiers.find((t) => t.code === part.tier);
    return tier ? { pkg, tier } : null;
  }
  if (part.type === 'addon') return data.addons.items.find((a) => a.code === part.code) || null;
  if (part.type === 'extra') return txt(part.name) ? part : null;
  return null;
}

// The list price is computed from the parts, never typed. Null when a part has no fixed monthly amount.
export function bundleListPrice(data, bundle) {
  let sum = 0;
  for (const part of bundle.parts) {
    const found = findPart(data, part);
    if (!found) return null;
    const amount = part.type === 'plan' ? found.tier.monthly.amount : part.type === 'addon' ? found.monthly : undefined;
    if (!isAmount(amount)) return null;
    sum += amount;
  }
  return sum;
}

export function validate(data) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  req(data.meta && data.meta.ivaLabel && data.meta.note, 'meta: ivaLabel and note are required');
  req(data.common && data.common.line, 'common.line is required');
  req(Array.isArray(data.packages) && data.packages.length === 6, 'packages: exactly six are required');

  for (const pkg of data.packages || []) {
    const at = `package ${pkg.code}`;
    req(pkg.code && pkg.name && txt(pkg.for), `${at}: code, name and for are required`);
    req(Array.isArray(pkg.tiers), `${at}: tiers[] is required`);
    if (!Array.isArray(pkg.tiers)) continue;
    if (pkg.code === 'a-medida') {
      req(pkg.tiers.length === 1 && pkg.tiers[0].code === 'proyecto', `${at}: one tier with code "proyecto" is required`);
      const t = pkg.tiers[0] || {};
      req(t.price && isAmount(t.price.from), `${at}: price.from must be a positive integer`);
      req(txt(t.title) && txt(t.text) && txt(t.button), `${at}: title, text and button are required`);
      req(t.status, `${at}: status is required`);
      continue;
    }
    req(pkg.tiers.map((t) => t.code).join() === THREE_TIERS.join(), `${at}: tiers must be esencial, crece, pro`);
    req(pkg.tiers.filter((t) => t.highlight === true).length === 1, `${at}: exactly one highlighted tier is required`);
    for (const t of pkg.tiers) {
      const tat = `${at}/${t.code}`;
      req(t.name && txt(t.suits) && t.status, `${tat}: name, suits and status are required`);
      req(Array.isArray(t.includes) && t.includes.length > 0, `${tat}: includes[] is required`);
      req(t.setup && (isAmount(t.setup.amount) || t.setup.text), `${tat}: setup needs a positive integer amount or text`);
      const m = t.monthly || {};
      req(isAmount(m.amount) || (isAmount(m.perUnit) && isAmount(m.minimum)) || m.text,
        `${tat}: monthly needs amount, perUnit + minimum, or text`);
    }
  }

  const addonCodes = new Set();
  for (const a of data.addons.items) {
    req(a.code && a.name && a.status, `addon ${a.code}: code, name and status are required`);
    req(isAmount(a.monthly) !== Boolean(a.rule), `addon ${a.code}: exactly one of monthly (positive integer) or rule`);
    addonCodes.add(a.code);
  }

  for (const b of data.bundles.items) {
    const at = `bundle ${b.code}`;
    req(b.code && b.name && b.status && Array.isArray(b.parts), `${at}: code, name, status and parts are required`);
    for (const part of b.parts || []) {
      const ref = part.type === 'plan' ? `plan ${part.package}/${part.tier}` : `${part.type} ${part.code || part.name}`;
      req(findPart(data, part), `${at}: part ${ref} does not exist`);
    }
    if (b.bundleMonthly !== undefined) {
      req(isAmount(b.bundleMonthly), `${at}: bundleMonthly must be a positive integer`);
      const list = bundleListPrice(data, b);
      req(list !== null, `${at}: list price cannot be computed from its parts`);
      req(list === null || list > b.bundleMonthly, `${at}: list price ${list} must be greater than ${b.bundleMonthly}`);
    } else {
      req(b.priceText && isAmount(b.priceText.amount) && txt(b.priceText.base) && txt(b.priceText.unit),
        `${at}: needs bundleMonthly, or priceText with base, amount and unit`);
    }
  }

  req(data.paymentTerms && data.paymentTerms.items.length > 0, 'paymentTerms.items is required');
  req(data.trust && data.trust.items.length === 3, 'trust: three items are required');
  req(data.faq && data.faq.items.length >= 5, 'faq: at least five items are required');
  req(data.closingCta && txt(data.closingCta.heading) && txt(data.closingCta.button), 'closingCta: heading and button are required');
  return errors;
}

// ---------- site config (PF2) ----------

export function loadConfig(path = CONFIG_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const filled = (v) => typeof v === 'string' && v.trim() !== '';
const isPending = (v) => typeof v === 'string' && v.includes(PENDING);
// The four values JD still has to give; each may be PENDIENTE until the release.
const RELEASE_VALUES = [['whatsappNumber', (c) => c.whatsappNumber], ['contactEmail', (c) => c.contactEmail],
  ['controller.city', (c) => c.controller && c.controller.city],
  ['controller.address', (c) => c.controller && c.controller.address]];

// Problems that stop any build. PENDIENTE is allowed here; only the release check rejects it.
export function validateConfig(c) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };
  req(c.planRequestMode === 'whatsapp' || c.planRequestMode === 'form', 'planRequestMode must be "whatsapp" or "form"');
  req(c.planRequestMode !== 'form', 'planRequestMode "form" needs PF2 Pass B, which is not built yet');
  for (const [path, get] of RELEASE_VALUES) req(filled(get(c)), `${path} is required (use "${PENDING}" until it is known)`);
  req(!filled(c.whatsappNumber) || c.whatsappNumber === PENDING || /^[1-9]\d{7,14}$/.test(c.whatsappNumber),
    'whatsappNumber: digits only, with the country code (for example 573001234567)');
  req(!filled(c.contactEmail) || c.contactEmail === PENDING || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contactEmail),
    'contactEmail is not an email address');
  req(c.controller && filled(c.controller.name) && filled(c.controller.nit), 'controller: name and nit are required');
  req(filled(c.replyTime), 'replyTime is required');
  req(filled(c.privacyPolicyVersion), 'privacyPolicyVersion is required');
  req(/^\d{4}-\d{2}-\d{2}$/.test(c.privacyPolicyDate) && !Number.isNaN(Date.parse(c.privacyPolicyDate)),
    'privacyPolicyDate must be a date as YYYY-MM-DD');
  req(c.apiBaseUrl === null || filled(c.apiBaseUrl), 'apiBaseUrl must be null or an address');
  // W0: up to three lines per founder, only as JD gave them in the kickoff; [] means no Background list.
  const founders = c.founders;
  req(founders && typeof founders === 'object' && !Array.isArray(founders), 'founders is required (a name -> lines object)');
  for (const [name, lines] of Object.entries(founders || {})) {
    req(Array.isArray(lines) && lines.length <= 3 && lines.every(filled), `founders.${name}: up to three non-empty lines`);
  }
  return errors;
}

// What the release check adds for the config: values still PENDIENTE or missing, and the API address in form mode.
export function configReleaseItems(c) {
  const items = [];
  for (const [path, get] of RELEASE_VALUES) {
    const v = get(c);
    if (!filled(v)) items.push(`missing         ${path}`);
    else if (isPending(v)) items.push(`PENDIENTE       ${path}`);
  }
  if (c.planRequestMode === 'form' && !(typeof c.apiBaseUrl === 'string' && /^https:\/\/[^\s/]+/.test(c.apiBaseUrl))) {
    items.push('not https://    apiBaseUrl (required in form mode)');
  }
  return items;
}

// Every PENDIENTE left in the generated privacy page, by line (a hand edit is caught too).
export function privacyReleaseItems(htmlLF) {
  return htmlLF.split('\n').flatMap((l, i) => (l.includes(PENDING) ? [`PENDIENTE       privacidad.html line ${i + 1}: ${l.trim()}`] : []));
}

// ---------- plan requests: WhatsApp links (PF2) ----------

const SITE_TAG = '(gtl-ai.com)';
// One builder per kind. Names come from pricing.json; messages never carry personal data.
export const requestMessage = {
  plan: (pkg, tier) => `Hola, quiero información del plan ${pkg.name} · ${tier.name} ${SITE_TAG}`,
  bundle: (bundle) => `Hola, quiero información del paquete ${bundle.name} ${SITE_TAG}`,
  custom: () => `Hola, quiero cotizar un proyecto a medida ${SITE_TAG}`,
  general: () => `Hola, quiero ayuda para elegir un plan ${SITE_TAG}`,
};

// While the number is PENDIENTE, wa.me without a number still opens WhatsApp with the text (dev only;
// the release check fails on it).
export function whatsappLink(config, message) {
  const number = config.whatsappNumber === PENDING ? '' : config.whatsappNumber;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const requestAttrs = (config, message) => `href="${esc(whatsappLink(config, message))}" target="_blank" rel="noopener"`;
// Inside every link that opens a new tab (WCAG G201); the visible label does not change.
export const NEW_TAB_TEXT = '(abre WhatsApp en una pestaña nueva)';
const newTab = ` <span class="visually-hidden">${NEW_TAB_TEXT}</span>`;

// ---------- rendering ----------

// The setup fee: its own label line (like "Mensualidad"), then the value (step 8, N1).
function priceSetup(t, L, iva) {
  const value = t.setup.text
    ? `<strong>${esc(t.setup.text)}</strong>`
    : `<strong>${formatCOP(t.setup.amount)}</strong> ${esc(iva)}`;
  return `<div class="price-setup" data-price>\n<p class="price-label">${esc(L.setup)}</p>\n<p class="price-setup-value">${value}</p>\n</div>`;
}

function priceMonthly(t, L, iva) {
  const m = t.monthly;
  let body;
  if (m.text) {
    body = `<p class="price-main"><span class="price-amount price-text">${esc(m.text)}</span></p>`;
  } else if (m.perUnit) {
    body = `<p class="price-main"><span class="price-amount">${formatCOP(m.perUnit)}</span> <span class="price-unit">${esc(L.perUnit)} ${esc(iva)}</span></p>\n` +
      `<p class="price-min">${esc(L.minimum)} <span class="nowrap">${formatCOP(m.minimum)} ${esc(L.perMonth)} ${esc(iva)}</span></p>`;
  } else {
    body = `<p class="price-main"><span class="price-amount">${formatCOP(m.amount)}</span> <span class="price-unit">${esc(L.perMonth)} ${esc(iva)}</span></p>`;
  }
  return `<div class="price-block" data-price>\n<p class="price-label">${esc(L.monthly)}</p>\n${body}\n</div>`;
}

function tierCard(pkg, t, data, config) {
  const L = data.meta.labels;
  const iva = data.meta.ivaLabel;
  const id = `tier-${pkg.code}-${t.code}`;
  const lines = [
    `<article class="tier-card${t.highlight ? ' is-highlight' : ''}" aria-labelledby="${id}">`,
  ];
  if (t.highlight) lines.push(`<p class="tier-badge">${esc(L.badge)}</p>`);
  lines.push(
    `<h4 class="tier-name" id="${id}">${esc(t.name)}</h4>`,
    `<p class="tier-suits">${esc(txt(t.suits))}</p>`,
    priceMonthly(t, L, iva),
    priceSetup(t, L, iva),
  );
  if (t.includesLead) lines.push(`<p class="tier-lead">${esc(txt(t.includesLead))}</p>`);
  lines.push(
    `<ul class="tier-list">\n${t.includes.map((i) => `<li>${esc(i)}</li>`).join('\n')}\n</ul>`,
    `<a class="btn ${t.highlight ? 'btn-primary' : 'btn-ghost'} tier-cta" ${requestAttrs(config, requestMessage.plan(pkg, t))} data-package="${esc(pkg.code)}" data-tier="${esc(t.code)}">${esc(L.requestPlan)}${newTab}</a>`,
    '</article>',
  );
  return lines.join('\n');
}

function customCard(pkg, t, data, config) {
  const iva = data.meta.ivaLabel;
  const id = `tier-${pkg.code}-${t.code}`;
  return [
    `<article class="tier-card tier-card-custom" aria-labelledby="${id}">`,
    `<h4 class="tier-name" id="${id}">${esc(txt(t.title))}</h4>`,
    `<div class="price-block" data-price>`,
    `<p class="price-main"><span class="price-from">${esc(txt(t.price.prefix))}</span> <span class="price-amount">${formatCOP(t.price.from)}</span> <span class="price-unit">${esc(txt(t.price.suffix))} ${esc(iva)}</span></p>`,
    `</div>`,
    `<p class="tier-suits">${esc(txt(t.text))}</p>`,
    `<p class="tier-suits">${esc(txt(t.hourlyLine))}</p>`,
    `<a class="btn btn-primary tier-cta" ${requestAttrs(config, requestMessage.custom())} data-package="${esc(pkg.code)}" data-tier="${esc(t.code)}">${esc(txt(t.button))}${newTab}</a>`,
    '</article>',
  ].join('\n');
}

function panel(pkg, data, active, config) {
  const custom = pkg.code === 'a-medida';
  const cards = pkg.tiers.map((t) => (custom ? customCard(pkg, t, data, config) : tierCard(pkg, t, data, config))).join('\n');
  return [
    `<div class="pricing-panel${active ? ' is-active' : ''}" id="panel-${pkg.code}" data-package="${esc(pkg.code)}">`,
    `<h3 class="package-name" id="package-${pkg.code}">${esc(pkg.name)}</h3>`,
    `<p class="package-for">${esc(txt(pkg.for))}</p>`,
    `<div class="tier-grid${custom ? ' tier-grid-single' : ''}">`,
    cards,
    '</div>',
    '</div>',
  ].join('\n');
}

function partLabel(data, part) {
  const f = findPart(data, part);
  if (part.type === 'plan') return `${f.pkg.name} ${f.tier.name}`;
  if (part.type === 'addon') return txt(f.shortName) || f.name;
  return txt(part.name);
}

function bundleCard(b, data, config) {
  const iva = data.meta.ivaLabel;
  const L = data.meta.labels;
  const contents = b.parts.map((p) => esc(partLabel(data, p))).join(' + ');
  let price;
  if (b.bundleMonthly !== undefined) {
    const list = bundleListPrice(data, b);
    price = `<p class="bundle-price" data-price><s class="bundle-list"><span class="visually-hidden">${esc(L.listPrice)}: </span>${formatCOP(list)}</s> ` +
      `<span class="price-amount">${formatCOP(b.bundleMonthly)}</span> <span class="price-unit">${esc(L.perMonth)} ${esc(iva)}</span></p>`;
  } else {
    // No single list price: the base on its own small line, then "+ amount unit + IVA" (step 8, N5).
    const p = b.priceText;
    price = `<p class="bundle-price bundle-price-text" data-price><span class="bundle-base">${esc(txt(p.base))}</span>\n` +
      `<span class="bundle-plus">+</span> <span class="price-amount">${formatCOP(p.amount)}</span> <span class="price-unit">${esc(txt(p.unit))} ${esc(iva)}</span></p>`;
  }
  return [
    '<article class="bundle-card">',
    `<h4>${esc(b.name)}</h4>`,
    `<p class="bundle-contents">${contents}</p>`,
    price,
    `<a class="btn btn-ghost" ${requestAttrs(config, requestMessage.bundle(b))} data-bundle="${esc(b.code)}">${esc(L.requestBundle)}${newTab}</a>`,
    '</article>',
  ].join('\n');
}

function addonRow(a, data) {
  const value = a.rule
    ? `<span class="addon-rule">${esc(a.rule)}</span>`
    : `<span class="price-amount">${formatCOP(a.monthly)}</span> <span class="price-unit">${esc(data.meta.labels.perMonth)} ${esc(data.meta.ivaLabel)}</span>`;
  return `<li class="addon"><span class="addon-name">${esc(a.name)}</span><span class="addon-price" data-price>${value}</span></li>`;
}

export function renderSection(data, config = loadConfig()) {
  const m = data.meta;
  const tabs = data.packages
    .map((p, i) => `<button type="button" class="pricing-tab${i === 0 ? ' is-active' : ''}" id="tab-${p.code}" data-tab="${esc(p.code)}">${esc(p.name)}</button>`)
    .join('\n');
  const panels = data.packages.map((p, i) => panel(p, data, i === 0, config)).join('\n');
  const body = [
    '<section id="planes" class="pricing" lang="es-CO" aria-labelledby="planes-title">',
    '<div class="container">',
    '<div class="pricing-head">',
    `<p class="eyebrow">${esc(txt(m.eyebrow))}</p>`,
    `<h2 id="planes-title">${esc(txt(m.heading))}</h2>`,
    `<p class="section-sub">${esc(txt(m.subtitle))}</p>`,
    '</div>',
    `<div class="pricing-tabs" data-tabs data-label="${esc(m.labels.tablistLabel)}">`,
    tabs,
    '</div>',
    panels,
    `<p class="pricing-common">${esc(data.common.line)}</p>`,
    `<p class="pricing-note">${esc(m.note)}</p>`,
    '<div class="pricing-block">',
    `<h3>${esc(txt(data.addons.heading))}</h3>`,
    `<p class="block-sub">${esc(txt(data.addons.subtitle))}</p>`,
    `<ul class="addon-list">\n${data.addons.items.map((a) => addonRow(a, data)).join('\n')}\n</ul>`,
    '</div>',
    '<div class="pricing-block">',
    `<h3>${esc(txt(data.bundles.heading))}</h3>`,
    `<p class="block-sub">${esc(txt(data.bundles.subtitle))}</p>`,
    `<div class="bundle-grid">\n${data.bundles.items.map((b) => bundleCard(b, data, config)).join('\n')}\n</div>`,
    '</div>',
    '<div class="pricing-block pricing-split">',
    '<div class="pay-terms">',
    `<h3>${esc(data.paymentTerms.heading)}</h3>`,
    `<ol class="pay-list">\n${data.paymentTerms.items.map((i) => `<li>${esc(i)}</li>`).join('\n')}\n</ol>`,
    '</div>',
    `<ul class="trust-list">\n${data.trust.items.map((i) => `<li>${esc(txt(i))}</li>`).join('\n')}\n</ul>`,
    '</div>',
    '<div class="pricing-block">',
    `<h3>${esc(txt(data.faq.heading))}</h3>`,
    `<div class="faq-list">\n${data.faq.items.map((f) => `<details class="faq-item">\n<summary>${esc(f.q)}</summary>\n<p>${esc(f.a)}</p>\n</details>`).join('\n')}\n</div>`,
    '</div>',
    '<div class="pricing-cta">',
    `<h3>${esc(txt(data.closingCta.heading))}</h3>`,
    `<p>${esc(txt(data.closingCta.text))}</p>`,
    `<a class="btn btn-primary" ${requestAttrs(config, requestMessage.general())} data-general="true">${esc(txt(data.closingCta.button))}${newTab}</a>`,
    '</div>',
    '</div>',
    '</section>',
  ].join('\n');
  // Indent to match the surrounding markup inside <main>.
  return body.split('\n').map((l) => '  ' + l).join('\n');
}

// ---------- applying to index.html ----------

const toLF = (s) => s.replace(/\r\n/g, '\n');

// Returns the full index.html (LF) with the section rendered. On the first run it also
// inserts the markers after About, the "Planes" link, the head script and the pricing.js tag.
export function applyToIndex(htmlLF, sectionHTML) {
  let html = htmlLF;
  if (!html.includes(START)) {
    const aboutEnd = html.indexOf('</section>', html.indexOf('<section id="about"'));
    if (aboutEnd < 0) throw new Error('index.html: About section not found');
    const at = aboutEnd + '</section>'.length;
    html = html.slice(0, at) + `\n\n  ${START}\n  ${END}` + html.slice(at);
    html = html.replace('<a href="#team">Team</a>', `${NAV_LINK}\n      <a href="#team">Team</a>`);
    html = html.replace('<link rel="stylesheet" href="style.css">', `${HEAD_SCRIPT}\n<link rel="stylesheet" href="style.css">`);
    html = html.replace('</head>', `${JS_TAG}\n</head>`);
  }
  html = html.replace(OLD_JS_TAG, JS_TAG);
  // PF2: the footer's "Privacidad" link, after the email (the one change outside the markers).
  if (!html.includes(FOOTER_LINK)) html = html.replace(FOOTER_EMAIL_LINK, (a) => `${a}\n    ${FOOTER_LINK}`);
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s < 0 || e < s) throw new Error('index.html: pricing markers are missing or out of order');
  return html.slice(0, s + START.length) + '\n' + sectionHTML + '\n  ' + html.slice(e);
}

// ---------- config values outside the pricing block (W0) ----------

export const BG_START = '<!-- founder-background:start -->';
export const BG_END = '<!-- founder-background:end -->';
// The footer's address before W0; it stays while contactEmail is PENDIENTE (the release check blocks that).
export const CURRENT_FOOTER_EMAIL = 'garydmendez25@gmail.com';

export const footerEmail = (config) => (isPending(config.contactEmail) ? CURRENT_FOOTER_EMAIL : config.contactEmail);

function backgroundBlock(lines) {
  if (!lines.length) return '';
  const items = lines.map((l) => `              <li>${esc(l)}</li>`).join('\n');
  return `          <div class="member-block">\n            <h4>Background</h4>\n            <ul>\n${items}\n            </ul>\n          </div>\n`;
}

// Writes the footer email and each founder's Background list (between the markers in their card).
export function applySiteConfig(htmlLF, config) {
  const email = esc(footerEmail(config));
  if (!FOOTER_EMAIL_LINK.test(htmlLF)) throw new Error('index.html: footer email link not found');
  let html = htmlLF.replace(FOOTER_EMAIL_LINK, `<a href="mailto:${email}" class="footer-email">${email}</a>`);
  const names = Object.keys(config.founders || {});
  const seen = new Set();
  // Within one card only: a card without markers is never matched across into the next.
  const inCard = '(?:(?!</article>)[\\s\\S])*?';
  const marked = new RegExp(`(<article class="member-card">${inCard}<h3>([^<]*)</h3>${inCard}${BG_START}\\n)${inCard}( *${BG_END})`, 'g');
  html = html.replace(marked, (_, head, name, end) => {
    if (!names.includes(name)) throw new Error(`site-config.json: founders has no entry for "${name}"`);
    seen.add(name);
    return head + backgroundBlock(config.founders[name]) + end;
  });
  const missing = names.filter((n) => !seen.has(n));
  if (missing.length) throw new Error(`index.html: no founder card with markers for ${missing.join(', ')}`);
  return html;
}

// Static wiring outside the markers that the section depends on.
export function wiringProblems(htmlLF) {
  const problems = [];
  if (!htmlLF.includes(HEAD_SCRIPT)) problems.push('head script that adds the "js" class is missing');
  else if (htmlLF.indexOf(HEAD_SCRIPT) > htmlLF.indexOf('href="style.css"')) problems.push('head script must come before the stylesheet');
  if (!htmlLF.includes(JS_TAG)) problems.push('pricing.js script tag is missing');
  if (!htmlLF.includes(NAV_LINK)) problems.push('"Planes" header link is missing');
  if (!footerOf(htmlLF).includes(FOOTER_LINK)) problems.push('"Privacidad" footer link is missing');
  return problems;
}

export function outsideMarkers(htmlLF) {
  const s = htmlLF.indexOf(START);
  const e = htmlLF.indexOf(END);
  return htmlLF.slice(0, s) + htmlLF.slice(e + END.length);
}

// ---------- the privacy page (PF2) ----------

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-10-16" -> "16 de octubre de 2026", without Intl.
export function formatDateEs(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

// "573001234567" -> "+57 300 123 4567"; other countries get "+" and the digits.
export function formatWhatsApp(number) {
  if (number === PENDING) return PENDING;
  const co = number.match(/^57(\d{3})(\d{3})(\d{4})$/);
  return co ? `+57 ${co[1]} ${co[2]} ${co[3]}` : `+${number}`;
}

const headerOf = (htmlLF) => (htmlLF.match(/<header class="site-header">[\s\S]*?<\/header>/) || [''])[0];
const footerOf = (htmlLF) => (htmlLF.match(/<footer [^>]*class="site-footer"[\s\S]*?<\/footer>/) || [''])[0];

// The site's header and footer, taken from index.html so they are never typed twice. On the
// privacy page their in-page links point to index.html, they keep the home page's English
// (lang="en"), and the "Privacidad" link marks the current page.
export function sharedChrome(indexLF) {
  const header = headerOf(indexLF);
  const footer = footerOf(indexLF);
  if (!header || !footer) throw new Error('index.html: site header or footer not found');
  const relink = (s) => s.replace(/href="#"/g, 'href="index.html"').replace(/href="#([^"]+)"/g, 'href="index.html#$1"');
  return {
    header: relink(header).replace('<header class="site-header">', '<header class="site-header" lang="en">'),
    footer: relink(footer).replace(/<footer /, '<footer lang="en" ').replace(FOOTER_LINK, FOOTER_LINK.replace('<a ', '<a aria-current="page" ')),
  };
}

// Fills the template: {{key}} takes a value from the map (already HTML), and the
// <!-- form -->…<!-- /form --> parts stay only in form mode. An unknown key is an error.
export function renderPrivacy(template, config, chrome) {
  const formMode = config.planRequestMode === 'form';
  const email = config.contactEmail;
  const number = config.whatsappNumber;
  const values = {
    header: chrome.header,
    footer: chrome.footer,
    'controller.name': esc(config.controller.name),
    'controller.nit': esc(config.controller.nit),
    'controller.city': esc(config.controller.city),
    'controller.address': esc(config.controller.address),
    contactEmail: email === PENDING ? PENDING : `<a href="mailto:${esc(email)}">${esc(email)}</a>`,
    whatsapp: number === PENDING ? PENDING : `<a href="https://wa.me/${esc(number)}">${esc(formatWhatsApp(number))}</a>`,
    privacyPolicyVersion: esc(config.privacyPolicyVersion),
    privacyPolicyDate: esc(formatDateEs(config.privacyPolicyDate)),
  };
  const html = toLF(template)
    .replace(/<!-- form -->([\s\S]*?)<!-- \/form -->/g, (_, inner) => (formMode ? inner : ''))
    .replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`privacidad template: unknown value {{${key}}}`);
      return values[key];
    });
  if (/<!-- \/?form -->|\{\{/.test(html)) throw new Error('privacidad template: unbalanced form block or placeholder');
  return html;
}

// Every price still "propuesta" and every draft field still "PENDIENTE-COPY", by field path,
// e.g. "PENDIENTE-COPY  packages[agenda].tiers[crece].suits".
export function releaseItems(data) {
  const items = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${node[i] && node[i].code ? node[i].code : i}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (node.status === 'propuesta') items.push(`propuesta       ${path}`);
    if (node.copyStatus === DRAFT) items.push(`${DRAFT}  ${path}`);
    for (const [k, v] of Object.entries(node)) {
      if (k !== 'status' && k !== 'copyStatus') walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(data, '');
  return items;
}

// The first line that differs between a file and what the data generates.
function reportDiff(name, current, next) {
  const a = current.split('\n');
  const b = next.split('\n');
  const line = a.findIndex((l, i) => l !== b[i]);
  const at = line < 0 ? a.length : line;
  console.error(`${name} differs from the data (first difference at line ${at + 1}):`);
  console.error(`  ${name}: ${(a[at] || '').trim()}`);
  console.error(`  expected:   ${(b[at] || '').trim()}`);
}

function main(argv) {
  const check = argv.includes('--check') || argv.includes('--release');
  const release = argv.includes('--release');
  const data = loadData();
  const errors = validate(data);
  if (errors.length) {
    console.error('pricing.json is invalid:\n  - ' + errors.join('\n  - '));
    return 1;
  }
  const config = loadConfig();
  const configErrors = validateConfig(config);
  if (configErrors.length) {
    console.error('site-config.json is invalid:\n  - ' + configErrors.join('\n  - '));
    return 1;
  }
  const raw = readFileSync(INDEX_PATH, 'utf8');
  const current = toLF(raw);
  let next;
  try {
    next = applySiteConfig(applyToIndex(current, renderSection(data, config)), config);
  } catch (e) {
    console.error('site-config.json is invalid:\n  - ' + e.message);
    return 1;
  }
  const privacyRaw = existsSync(PRIVACY_PATH) ? readFileSync(PRIVACY_PATH, 'utf8') : null;
  const privacyCurrent = privacyRaw === null ? null : toLF(privacyRaw);
  const privacyNext = renderPrivacy(readFileSync(PRIVACY_TEMPLATE_PATH, 'utf8'), config, sharedChrome(next));

  if (!check) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    if (next !== current) writeFileSync(INDEX_PATH, next.replace(/\n/g, eol));
    console.log(next === current ? 'index.html already up to date.' : 'index.html updated from pricing.json and site-config.json.');
    const privacyEol = privacyRaw && privacyRaw.includes('\r\n') ? '\r\n' : '\n';
    if (privacyNext !== privacyCurrent) writeFileSync(PRIVACY_PATH, privacyNext.replace(/\n/g, privacyEol));
    console.log(privacyNext === privacyCurrent ? 'privacidad.html already up to date.' : 'privacidad.html updated from its template and site-config.json.');
    return 0;
  }

  let failed = false;
  if (!current.includes(START)) {
    console.error('index.html has no pricing markers. Run: npm --prefix _dev run pricing:build');
    return 1;
  }
  if (next !== current) { reportDiff('index.html', current, next); failed = true; }
  for (const p of wiringProblems(current)) { console.error(`index.html: ${p}`); failed = true; }
  const stray = outsideMarkers(current).match(/\$\d[\d.]*/g);
  if (stray) { console.error(`index.html has prices outside the generated block: ${stray.join(', ')}`); failed = true; }
  if (privacyCurrent === null) {
    console.error('privacidad.html is missing. Run: npm --prefix _dev run pricing:build');
    failed = true;
  } else if (privacyNext !== privacyCurrent) {
    reportDiff('privacidad.html', privacyCurrent, privacyNext);
    failed = true;
  }
  if (!failed) console.log('pricing:check passed — index.html and privacidad.html match pricing.json and site-config.json.');

  if (release) {
    const items = [...releaseItems(data), ...configReleaseItems(config), ...privacyReleaseItems(privacyCurrent || '')];
    if (items.length) {
      console.error(`\nRelease check FAILED: ${items.length} item(s) still pending.\n  ${items.join('\n  ')}`);
      failed = true;
    } else if (!failed) {
      console.log('Release check passed: every price is confirmado, no text is PENDIENTE-COPY and the config is complete.');
    }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
