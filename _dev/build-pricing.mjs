// Renders the "Planes y precios" section from _dev/pricing.json into index.html.
//
//   node build-pricing.mjs            write the section between the pricing markers
//   node build-pricing.mjs --check    fail if index.html differs from the data (EOL-normalised)
//   node build-pricing.mjs --release  --check, plus fail while any price is "propuesta"
//                                     or any text is "PENDIENTE-COPY" (lists each one)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(here, 'pricing.json');
export const INDEX_PATH = join(here, '..', 'index.html');

export const START = '<!-- pricing:start -->';
export const END = '<!-- pricing:end -->';
const HEAD_SCRIPT = "<script>document.documentElement.classList.add('js')</script>";
// If pricing.js fails to load, drop the "js" class so every package stays listed (step 8, N8).
const JS_TAG = '<script src="pricing.js" defer onerror="document.documentElement.classList.remove(\'js\')"></script>';
const OLD_JS_TAG = '<script src="pricing.js" defer></script>';
const NAV_LINK = '<a href="#planes">Planes</a>';
const DRAFT = 'PENDIENTE-COPY';
const THREE_TIERS = ['esencial', 'crece', 'pro'];

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

function tierCard(pkg, t, data) {
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
    `<a class="btn ${t.highlight ? 'btn-primary' : 'btn-ghost'} tier-cta" href="#contact" data-package="${esc(pkg.code)}" data-tier="${esc(t.code)}">${esc(L.requestPlan)}</a>`,
    '</article>',
  );
  return lines.join('\n');
}

function customCard(pkg, t, data) {
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
    `<a class="btn btn-primary tier-cta" href="#contact" data-package="${esc(pkg.code)}" data-tier="${esc(t.code)}">${esc(txt(t.button))}</a>`,
    '</article>',
  ].join('\n');
}

function panel(pkg, data, active) {
  const custom = pkg.code === 'a-medida';
  const cards = pkg.tiers.map((t) => (custom ? customCard(pkg, t, data) : tierCard(pkg, t, data))).join('\n');
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

function bundleCard(b, data) {
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
    `<a class="btn btn-ghost" href="#contact" data-bundle="${esc(b.code)}">${esc(L.requestBundle)}</a>`,
    '</article>',
  ].join('\n');
}

function addonRow(a, data) {
  const value = a.rule
    ? `<span class="addon-rule">${esc(a.rule)}</span>`
    : `<span class="price-amount">${formatCOP(a.monthly)}</span> <span class="price-unit">${esc(data.meta.labels.perMonth)} ${esc(data.meta.ivaLabel)}</span>`;
  return `<li class="addon"><span class="addon-name">${esc(a.name)}</span><span class="addon-price" data-price>${value}</span></li>`;
}

export function renderSection(data) {
  const m = data.meta;
  const tabs = data.packages
    .map((p, i) => `<button type="button" class="pricing-tab${i === 0 ? ' is-active' : ''}" id="tab-${p.code}" data-tab="${esc(p.code)}">${esc(p.name)}</button>`)
    .join('\n');
  const panels = data.packages.map((p, i) => panel(p, data, i === 0)).join('\n');
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
    `<div class="bundle-grid">\n${data.bundles.items.map((b) => bundleCard(b, data)).join('\n')}\n</div>`,
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
    `<a class="btn btn-primary" href="#contact" data-general="true">${esc(txt(data.closingCta.button))}</a>`,
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
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s < 0 || e < s) throw new Error('index.html: pricing markers are missing or out of order');
  return html.slice(0, s + START.length) + '\n' + sectionHTML + '\n  ' + html.slice(e);
}

// Static wiring outside the markers that the section depends on.
export function wiringProblems(htmlLF) {
  const problems = [];
  if (!htmlLF.includes(HEAD_SCRIPT)) problems.push('head script that adds the "js" class is missing');
  else if (htmlLF.indexOf(HEAD_SCRIPT) > htmlLF.indexOf('href="style.css"')) problems.push('head script must come before the stylesheet');
  if (!htmlLF.includes(JS_TAG)) problems.push('pricing.js script tag is missing');
  if (!htmlLF.includes(NAV_LINK)) problems.push('"Planes" header link is missing');
  return problems;
}

export function outsideMarkers(htmlLF) {
  const s = htmlLF.indexOf(START);
  const e = htmlLF.indexOf(END);
  return htmlLF.slice(0, s) + htmlLF.slice(e + END.length);
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

function main(argv) {
  const check = argv.includes('--check') || argv.includes('--release');
  const release = argv.includes('--release');
  const data = loadData();
  const errors = validate(data);
  if (errors.length) {
    console.error('pricing.json is invalid:\n  - ' + errors.join('\n  - '));
    return 1;
  }
  const raw = readFileSync(INDEX_PATH, 'utf8');
  const current = toLF(raw);
  const next = applyToIndex(current, renderSection(data));

  if (!check) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    if (next !== current) writeFileSync(INDEX_PATH, next.replace(/\n/g, eol));
    console.log(next === current ? 'index.html already up to date.' : 'index.html updated from pricing.json.');
    return 0;
  }

  let failed = false;
  if (!current.includes(START)) {
    console.error('index.html has no pricing markers. Run: npm --prefix _dev run pricing:build');
    return 1;
  }
  if (next !== current) {
    const a = current.split('\n');
    const b = next.split('\n');
    const line = a.findIndex((l, i) => l !== b[i]);
    console.error(`index.html differs from pricing.json (first difference at line ${line + 1}):`);
    console.error(`  index.html: ${(a[line] || '').trim()}`);
    console.error(`  expected:   ${(b[line] || '').trim()}`);
    failed = true;
  }
  for (const p of wiringProblems(current)) { console.error(`index.html: ${p}`); failed = true; }
  const stray = outsideMarkers(current).match(/\$\d[\d.]*/g);
  if (stray) { console.error(`index.html has prices outside the generated block: ${stray.join(', ')}`); failed = true; }
  if (!failed) console.log('pricing:check passed — index.html matches pricing.json.');

  if (release) {
    const items = releaseItems(data);
    if (items.length) {
      console.error(`\nRelease check FAILED: ${items.length} item(s) still pending.\n  ${items.join('\n  ')}`);
      failed = true;
    } else if (!failed) {
      console.log('Release check passed: every price is confirmado and no text is PENDIENTE-COPY.');
    }
  }
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
