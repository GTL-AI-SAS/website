// W0: checks every link in the built pages. For each page it lists the external links and fails on:
//   - an href="#id" with no element of that id on the page ("#" alone is the top of the page);
//   - a relative href or src whose file does not exist;
//   - a link to another checked page whose #id that page does not have.
// A leading "/" is the site root, a "?query" is ignored, and attributes may use " or '.
// Usage: node scripts/check-links.mjs   (npm --prefix _dev run links)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SITE_ROOT = resolve(here, '..', '..');
export const PAGES = ['index.html', 'privacidad.html'];

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
// Comments are not links (the pricing and founder markers, the PENDIENTE-COPY note).
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

export const idsOf = (html) => new Set([...stripComments(html).matchAll(/\sid=(["'])(.+?)\1/g)].map((m) => m[2]));
export const refsOf = (html) => [...stripComments(html).matchAll(/\s(href|src)=(["'])(.*?)\2/g)].map((m) => ({ attr: m[1], value: decode(m[3]) }));

// pages: { 'index.html': html, ... } relative to root. Returns { errors, external, checked }.
export function checkLinks(pages, root = SITE_ROOT) {
  const ids = Object.fromEntries(Object.entries(pages).map(([name, html]) => [name, idsOf(html)]));
  const errors = [];
  const external = [];
  let checked = 0;
  for (const [name, html] of Object.entries(pages)) {
    for (const { attr, value } of refsOf(html)) {
      checked += 1;
      const where = `${name}: ${attr}="${value}"`;
      if (EXTERNAL.test(value)) { external.push(where); continue; }
      const [withQuery, hash] = value.split('#');
      const path = withQuery.replace(/\?.*$/, '');
      if (path === '') {
        if (hash && !ids[name].has(hash)) errors.push(`${where} — no element with id "${hash}"`);
        continue;
      }
      // "/x" is the site root; "x" is relative to the page. "/" alone is the index.
      const absolute = path.startsWith('/') ? join(root, path) : resolve(root, dirname(name), path);
      const target = relative(root, absolute).replace(/\\/g, '/') || 'index.html';
      if (!existsSync(join(root, target))) { errors.push(`${where} — file ${target} does not exist`); continue; }
      if (hash && ids[target] && !ids[target].has(hash)) errors.push(`${where} — ${target} has no element with id "${hash}"`);
    }
  }
  return { errors, external, checked };
}

export const readPages = (root = SITE_ROOT, names = PAGES) =>
  Object.fromEntries(names.map((n) => [n, readFileSync(join(root, n), 'utf8')]));

function main() {
  const { errors, external, checked } = checkLinks(readPages());
  console.log(`Checked ${checked} links in ${PAGES.join(', ')}.`);
  console.log(`External links (${external.length}, listed, not fetched):`);
  for (const e of external) console.log(`  ${e}`);
  if (errors.length) {
    console.error(`\nLink check FAILED: ${errors.length} problem(s).\n  ${errors.join('\n  ')}`);
    return 1;
  }
  console.log('\nLink check passed: every #anchor has its id and every local file exists.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
