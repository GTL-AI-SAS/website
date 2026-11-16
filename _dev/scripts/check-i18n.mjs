// Lists every text of the site that has no English or no French translation, and prints nothing when there is none.
//
//   node scripts/check-i18n.mjs            the texts with no translation, and any problem in the tables; exit 1 if any
//   node scripts/check-i18n.mjs --later    also what stays in Spanish on purpose: text inside pictures (image and video
//                                          files, and the drawn screens and logos marked data-i18n="off")
//   node scripts/check-i18n.mjs --unused   also the table entries that no page and no script uses
//
// It reads the built pages (text, the attributes i18n.js translates, the title and the description), the
// scripts (the texts they write) and what the build writes only for some config values (the launch banner and the
// demos, switched off or on), and asks i18n.js itself, loaded here without a browser, for each translation.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { loadConfig, renderLaunchBanner, renderLaunchDemos } from '../build-pricing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const SITE_ROOT = join(here, '..', '..');
export const PAGES = ['index.html', 'precios.html', 'privacidad.html'];
// site-config.js is left out: its one sentence reaches the page through the build, inside a longer text.
export const SCRIPTS = ['showcase.js', 'plan-request.js', 'precios.js'];
// The attributes i18n.js translates, and data-label, which the scripts copy into an aria-label.
const ATTRS = ['aria-label', 'alt', 'title', 'placeholder', 'data-message', 'data-label'];

// Text inside image and video files, which cannot be translated: listed for later (--later).
export const IMAGE_TEXT = [
  ['assets/branding/holiday-hat.png', '"FELIZ NAVIDAD" (the hero\'s still in December)'],
  ['assets/branding/gtl-ai-holiday-hat.mp4', '"FELIZ NAVIDAD" (the hero\'s clip in December; taken from its still, the clip was not watched)'],
  ['assets/branding/holiday-lights.png', '"FELICES FIESTAS" (the hero\'s still in December)'],
  ['assets/branding/gtl-ai-holiday-lights.mp4', '"FELICES FIESTAS" (the hero\'s clip in December; taken from its still, the clip was not watched)'],
];

// Texts in the scripts that visitors never read (they look like sentences to the rule below).
const NOT_SHOWN = new Set(['use strict', '(prefers-reduced-motion: reduce)']);
// Parts of a sentence that a script joins to a field's name or a number: SAMPLES holds the whole sentences.
const PARTS = new Set(['debe tener al menos', 'caracteres.', 'no puede superar los']);
// Sentences the scripts and the build put together, as the page shows them.
export const SAMPLES = [
  'El nombre debe tener al menos 2 caracteres.', 'El nombre no puede superar los 100 caracteres.',
  'El nombre del negocio debe tener al menos 2 caracteres.', 'El nombre del negocio no puede superar los 150 caracteres.',
  'El teléfono no puede superar los 20 caracteres.', 'El correo no puede superar los 254 caracteres.',
  'La ciudad no puede superar los 80 caracteres.', 'El mensaje no puede superar los 500 caracteres.',
  'Plan: Elija un plan de la lista.', 'Nombre: Escriba su nombre.', 'Nombre: Revise su nombre.',
  'Negocio: Indique el nombre de su negocio, su Instagram o su sitio web.', 'Negocio: Revise el nombre de su negocio.',
  'Teléfono o WhatsApp: Indique un teléfono o un correo electrónico.',
  'Teléfono o WhatsApp: Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.',
  'Correo electrónico: Revise el correo electrónico; por ejemplo, nombre@dominio.com.',
  'Ciudad: Revise la ciudad.', 'Mensaje: Revise el mensaje.',
  'Autorización: Marque la casilla de autorización para continuar.',
  'Nombre: El nombre debe tener al menos 2 caracteres.',
  '1 de enero de 2027', '30 de octubre de 2026',
  // The heading of a founder's Background list, which the build writes when the config gives a founder some lines.
  'Trayectoria',
];

const norm = (v) => v.replace(/\s+/g, ' ').trim();
const hasLetter = (t) => /\p{L}/u.test(t);

// ---------- i18n.js, without a browser ----------

export function loadEngine(source = readFileSync(join(SITE_ROOT, 'i18n.js'), 'utf8')) {
  const element = { classList: { add() {}, remove() {} }, setAttribute() {}, getAttribute: () => null };
  const window = {};
  const context = {
    window,
    document: {
      documentElement: element, body: element, title: '', querySelector: () => null, querySelectorAll: () => [],
      addEventListener() {}, dispatchEvent() {},
    },
    location: { search: '' },
    localStorage: { getItem: () => null, setItem() {} },
    URLSearchParams,
    MutationObserver: class { observe() {} },
    CustomEvent: class {},
  };
  vm.runInNewContext(source, context, { filename: 'i18n.js' });
  if (!window.gtlI18n || !window.gtlI18n.tables) throw new Error('i18n.js did not set window.gtlI18n');
  return window.gtlI18n;
}

// ---------- the pages ----------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', times: '×', middot: '·', hellip: '…' };
export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return Object.hasOwn(ENTITIES, e) ? ENTITIES[e] : m;
  });
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+/g;
const attrsOf = (s) => Object.fromEntries([...s.matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)]
  .map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? '')]));

// What a page holds: the texts i18n.js translates, the texts it leaves as written (by region), the inline scripts,
// and any note for one language that i18n.js would try to translate.
export function readPage(html, page) {
  const texts = [];
  const kept = [];
  const scripts = [];
  const problems = [];
  const stack = [];
  const top = () => stack[stack.length - 1] || { off: null };
  for (const m of html.matchAll(TOKEN)) {
    const tok = m[0];
    if (tok.startsWith('<!')) continue;         // a comment or the doctype
    if (m[1]) {                                   // <script> or <style>, whole
      if (m[1].toLowerCase() === 'script' && !/\bsrc\s*=/.test(m[2])) scripts.push(m[3]);
      continue;
    }
    if (m[5]) {
      const name = m[5].toLowerCase();
      if (m[4]) {                                 // a closing tag
        const at = stack.map((e) => e.name).lastIndexOf(name);
        if (at >= 0) stack.length = at;
        continue;
      }
      const a = attrsOf(m[6]);
      let off = top().off;
      if (off === null && (a['data-i18n'] === 'off' || name === 'noscript')) off = (a.class || name).split(/\s+/)[0];
      if ('data-lang-note' in a) {
        if (off === null) problems.push(`${page}: a note with data-lang-note is not marked data-i18n="off", so i18n.js would translate it: ${m[0].slice(0, 80)}`);
        off = 'note';
      }
      if (off === null) {
        for (const attr of ATTRS) if (a[attr] && hasLetter(a[attr])) texts.push({ text: norm(a[attr]), where: `${page} ${attr}` });
        if (name === 'meta' && a.name === 'description' && a.content) texts.push({ text: norm(a.content), where: `${page} description` });
      }
      if (!VOID.has(name) && !/\/\s*$/.test(m[6])) stack.push({ name, off });
      continue;
    }
    const text = norm(decode(tok));
    if (!text || !hasLetter(text)) continue;
    const off = top().off;
    if (off === null) texts.push({ text, where: `${page} text` });
    else if (off !== 'note' && off !== 'lang-switch') kept.push({ text, region: off, page });
  }
  return { texts, kept, scripts, problems };
}

// ---------- the scripts ----------

// Every string literal of a script, with its escapes read ('…', "…" and `…` without ${}).
export function stringsOf(js) {
  const out = [];
  let i = 0;
  let prev = '';                                  // the last significant character, to tell a regex from a division
  const n = js.length;
  while (i < n) {
    const c = js[i];
    if (c === '/' && js[i + 1] === '/') { i = js.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && js[i + 1] === '*') { i = js.indexOf('*/', i) + 2; if (i < 2) break; continue; }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\b(return|typeof|case|in|of)$/.test(js.slice(Math.max(0, i - 8), i).trimEnd()))) {
      let j = i + 1;
      let inClass = false;
      for (; j < n; j++) {
        if (js[j] === '\\') { j++; continue; }
        if (js[j] === '[') inClass = true;
        else if (js[j] === ']') inClass = false;
        else if (js[j] === '/' && !inClass) break;
        else if (js[j] === '\n') break;
      }
      i = j + 1;
      prev = '/';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      let raw = '';
      for (; j < n && js[j] !== c; j++) {
        if (js[j] === '\\') { raw += js[j] + js[j + 1]; j++; } else raw += js[j];
      }
      let value = raw;
      try { value = JSON.parse('"' + raw.replace(/\\'/g, "'").replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'); } catch { /* as written */ }
      out.push(value);
      i = j + 1;
      prev = c;
      continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

// A string a visitor reads: it has an accent or ¿ ¡ … ·, or it is a sentence (a capital or an opening mark first, then
// more words) with nothing of code in it. A part of a sentence starts with a space.
export function shownText(s) {
  const t = norm(s);
  if (!t || !/\p{L}{2,}/u.test(t) || /[<>{}=\[\]\\]|^[.#]|\/\//.test(t) || NOT_SHOWN.has(t)) return null;
  if (/[^\x00-\x7F]/.test(t)) return t;
  if (/^[A-Z(]\S*\s/.test(t) && /\p{Ll}{2,}/u.test(t)) return t;
  if (/^\s\p{L}/u.test(s) && /^(\p{L}+[ .])+\p{L}*\.?$/u.test(t + ' ')) return t;
  return null;
}

// ---------- the check ----------

export function check({ root = SITE_ROOT } = {}) {
  const i18n = loadEngine(readFileSync(join(root, 'i18n.js'), 'utf8'));
  const langs = i18n.langs;
  const used = new Map();                         // text -> where it was first found
  const kept = [];
  const problems = [];
  const add = (text, where) => { if (!used.has(text)) used.set(text, where); };
  for (const page of PAGES) {
    const r = readPage(readFileSync(join(root, page), 'utf8').replace(/\r\n/g, '\n'), page);
    r.texts.forEach((t) => add(t.text, t.where));
    kept.push(...r.kept);
    problems.push(...r.problems);
    r.scripts.forEach((js) => stringsOf(js).forEach((s) => { const t = shownText(s); if (t && !PARTS.has(t)) add(t, `${page} inline script`); }));
  }
  for (const file of SCRIPTS) {
    stringsOf(readFileSync(join(root, file), 'utf8')).forEach((s) => { const t = shownText(s); if (t && !PARTS.has(t)) add(t, file); });
  }
  SAMPLES.forEach((s) => add(s, 'a sentence the scripts or the build put together'));
  // The launch banner and the demos section: the build writes them only while launch.enabled is true in the config,
  // so they are read here as it would write them.
  const config = loadConfig(join(root, '_dev', 'site-config.json'));
  const on = { ...config, launch: { ...config.launch, enabled: true } };
  const launch = readPage(`${renderLaunchBanner(on)}
${renderLaunchDemos(on)}`, 'the launch banner and demos');
  launch.texts.forEach((t) => add(t.text, t.where));
  problems.push(...launch.problems);

  const missing = [];
  for (const [text, where] of used) {
    const without = langs.filter((l) => !i18n.has(text, l));
    if (without.length) missing.push({ text, where, without });
  }
  // A translation that is also another Spanish text with a different translation: i18n.js would leave that text alone.
  for (const l of langs) {
    const table = i18n.tables[l];
    const outs = new Map(Object.keys(table).map((k) => [norm(i18n.translate(k, l)), k]));
    for (const text of used.keys()) {
      const to = i18n.translate(text, l);
      if (to !== null && norm(to) !== text && outs.has(text)) {
        problems.push(`${l}: "${text}" is a Spanish text of the site and also the translation of "${outs.get(text)}"; i18n.js would not translate it`);
      }
    }
    if (l === 'fr') {
      for (const [k, v] of Object.entries(table)) {
        if (/[\p{L}\d)»][?!;](\s|$)|[\p{L})»]:(\s|$)/u.test(v)) problems.push(`fr: no space before the punctuation in the translation of "${k}": ${v}`);
      }
    }
  }
  const unused = Object.fromEntries(langs.map((l) => [l, Object.keys(i18n.tables[l]).filter((k) => !used.has(k) && i18n.tables[l][k] !== k)]));
  const images = IMAGE_TEXT.map(([file, text]) => ({ file, text, exists: existsSync(join(root, file)) }));
  return { langs, used, missing, problems, kept, unused, images };
}

function main(argv) {
  const r = check();
  for (const m of r.missing) console.log(`no ${m.without.join(', no ')}: ${JSON.stringify(m.text)}  (${m.where})`);
  for (const p of r.problems) console.log(`problem: ${p}`);
  for (const i of r.images) if (!i.exists) console.log(`problem: ${i.file} is listed as an image with text but does not exist`);
  if (argv.includes('--later')) {
    console.log('Text inside image and video files (cannot be translated):');
    for (const i of r.images) console.log(`  ${i.file}: ${i.text}`);
    console.log('Drawn pictures and names that stay as written in every language (data-i18n="off"):');
    const regions = new Map();
    for (const k of r.kept) {
      const key = `${k.page} .${k.region}`;
      if (!regions.has(key)) regions.set(key, new Set());
      regions.get(key).add(k.text);
    }
    for (const [key, set] of regions) console.log(`  ${key}: ${set.size} text(s), for example ${[...set].slice(0, 3).map((t) => JSON.stringify(t)).join(', ')}`);
  }
  if (argv.includes('--unused')) {
    for (const l of r.langs) {
      console.log(`${l}: ${r.unused[l].length} entr${r.unused[l].length === 1 ? 'y' : 'ies'} no page or script uses`);
      for (const k of r.unused[l]) console.log(`  ${JSON.stringify(k)}`);
    }
  }
  return r.missing.length || r.problems.length || r.images.some((i) => !i.exists) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
