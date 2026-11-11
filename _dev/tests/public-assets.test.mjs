import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_ROOT } from '../build-pricing.mjs';

test('private planning notes are absent from the published root and excluded from Jekyll', () => {
  for (const name of ['TODO.md', 'TODO.html']) {
    assert.equal(existsSync(join(SITE_ROOT, name)), false);
    assert.ok(readFileSync(join(SITE_ROOT, '.gitignore'), 'utf8').includes(`/${name}`));
    assert.ok(readFileSync(join(SITE_ROOT, '_config.yml'), 'utf8').includes(`- ${name}`));
  }
});

test('every published branding asset has a page reference, including seasonal media', () => {
  const pages = ['index.html', 'privacidad.html'].map(name => readFileSync(join(SITE_ROOT, name), 'utf8')).join('\n');
  for (const name of readdirSync(join(SITE_ROOT, 'assets', 'branding'))) {
    assert.ok(pages.includes(`assets/branding/${name}`), `${name} is published but unused`);
  }
});

test('every feature tour photo is used by the page and stays below 40 KB', () => {
  const page = readFileSync(join(SITE_ROOT, 'index.html'), 'utf8');
  const names = readdirSync(join(SITE_ROOT, 'assets', 'showcase'));
  assert.ok(names.length > 0);
  for (const name of names) {
    assert.ok(page.includes(`assets/showcase/${name}`), `${name} is published but unused`);
    assert.ok(statSync(join(SITE_ROOT, 'assets', 'showcase', name)).size < 40_000, `${name} is over 40 KB`);
  }
});

test('the initial hero video stays below 300 KB', () => {
  assert.ok(statSync(join(SITE_ROOT, 'assets', 'branding', 'gtl-ai-logo-intro.mp4')).size < 300_000);
});
