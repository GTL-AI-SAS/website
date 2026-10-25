// PF3: versioned asset URLs. Every local stylesheet and script a page loads is referenced as
// <file>?v=<first 10 hex of its SHA-256>; the build stamps them and --check fails while a stamp differs from the
// file's current hash. The build is only ever run here on scratch copies of the site (os.tmpdir()), never on the
// repository's files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assetVersion, assetRefs, versionAssets, stripVersions, assetVersionProblems, fileVersion, wiringProblems,
  SITE_ROOT, INDEX_PATH, PRIVACY_PATH, START, END, VERSION_LENGTH,
} from '../build-pricing.mjs';

const LF = (s) => s.replace(/\r\n/g, '\n');
const index = LF(readFileSync(INDEX_PATH, 'utf8'));
const privacy = LF(readFileSync(PRIVACY_PATH, 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
// What each committed page loads, in document order.
const INDEX_ASSETS = ['style.css', 'pricing.js', 'site-config.js', 'plan-request.js'];
const PRIVACY_ASSETS = ['style.css'];

// ---------- the version ----------

test('the version is the first 10 hex digits of the SHA-256 of the file\'s bytes (sha256sum\'s on the LF files)', () => {
  assert.equal(VERSION_LENGTH, 10);
  // Known digests: SHA-256("") = e3b0c442 98fc1c14 …, SHA-256("abc") = ba7816bf 8f01cfea ….
  assert.equal(assetVersion(Buffer.alloc(0)), 'e3b0c44298');
  assert.equal(assetVersion(Buffer.from('abc')), 'ba7816bf8f');
  for (const f of INDEX_ASSETS) {
    assert.equal(fileVersion(f), sha256(readFileSync(join(SITE_ROOT, f))).slice(0, 10), f);
    assert.match(fileVersion(f), /^[0-9a-f]{10}$/);
  }
  assert.throws(() => fileVersion('nope.js'), /nope\.js is referenced by a page but does not exist/);
});

// ---------- the committed pages ----------

test('every local stylesheet and script on both committed pages carries ?v= equal to the file\'s current hash', () => {
  const refs = assetRefs(index);
  assert.deepEqual(refs.map((r) => r.file), INDEX_ASSETS);
  for (const r of refs) assert.equal(r.version, fileVersion(r.file), r.file);
  const privacyRefs = assetRefs(privacy);
  assert.deepEqual(privacyRefs.map((r) => r.file), PRIVACY_ASSETS);
  for (const r of privacyRefs) assert.equal(r.version, fileVersion(r.file), r.file);
  assert.deepEqual(assetVersionProblems(index, fileVersion), []);
  assert.deepEqual(assetVersionProblems(privacy, fileVersion), []);
  // No local .css/.js is referenced bare by any attribute, and nothing else carries a stamp.
  for (const [name, html, count] of [['index.html', index, INDEX_ASSETS.length], ['privacidad.html', privacy, PRIVACY_ASSETS.length]]) {
    const bare = [...html.matchAll(/\s(?:href|src)="([^":]+\.(?:css|js))"/g)].map((m) => m[1]);
    assert.deepEqual(bare, [], `${name}: ${bare.join(', ')}`);
    assert.equal((html.match(/\?v=/g) || []).length, count, name);
  }
  // Where they sit: style.css and pricing.js in <head> (the one change outside the markers); in form mode the two
  // form scripts inside the markers; style.css in the privacy page's <head>.
  const head = index.slice(0, index.indexOf('</head>'));
  assert.ok(head.includes(`<link rel="stylesheet" href="style.css?v=${fileVersion('style.css')}">`));
  assert.ok(head.includes(`<script src="pricing.js?v=${fileVersion('pricing.js')}" defer onerror="document.documentElement.classList.remove('js')"></script>`));
  const inside = index.slice(index.indexOf(START), index.indexOf(END));
  assert.ok(inside.includes(`<script src="site-config.js?v=${fileVersion('site-config.js')}" defer></script>\n  <script src="plan-request.js?v=${fileVersion('plan-request.js')}" defer></script>`));
  assert.ok(privacy.slice(0, privacy.indexOf('</head>')).includes(`<link rel="stylesheet" href="style.css?v=${fileVersion('style.css')}">`));
});

test('the wiring check reads through the stamps: the stamped page passes and a missing pricing.js tag is still caught', () => {
  assert.deepEqual(wiringProblems(index), []);
  assert.notEqual(stripVersions(index), index);
  assert.deepEqual(wiringProblems(stripVersions(index)), []);
  const noTag = index.replace(/<script src="pricing\.js\?v=[0-9a-f]+" defer onerror="[^"]*"><\/script>\n/, '');
  assert.notEqual(noTag, index);
  assert.ok(wiringProblems(noTag).some((p) => /pricing\.js script tag is missing/.test(p)));
});

// ---------- the stamping ----------

test('stamping: external URLs and <a> links untouched, bare and stale references stamped, idempotent, strippable', () => {
  const versions = { 'style.css': '0123456789', 'app.js': 'abcdefabcd', 'sub/x.css': 'ffffffffff' };
  const versionOf = (f) => { if (!(f in versions)) throw new Error(`${f} missing`); return versions[f]; };
  const html = [
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="style.css">',
    '<link rel="stylesheet" href="sub/x.css?v=0000000000">',
    '<script src="app.js" defer onerror="document.documentElement.classList.remove(\'js\')"></script>',
    '<script src="//cdn.example.com/lib.js"></script>',
    '<script src="https://cdn.example.com/lib.js"></script>',
    '<script>document.documentElement.classList.add(\'js\')</script>',
    '<a href="style.css">a link, not a load</a>',
  ].join('\n');
  const out = versionAssets(html, versionOf);
  assert.ok(out.includes('<link rel="stylesheet" href="style.css?v=0123456789">'));
  assert.ok(out.includes('<link rel="stylesheet" href="sub/x.css?v=ffffffffff">'));
  assert.ok(out.includes('<script src="app.js?v=abcdefabcd" defer onerror="document.documentElement.classList.remove(\'js\')"></script>'));
  for (const same of ['href="https://fonts.gstatic.com" crossorigin', 'css2?family=Inter&display=swap" rel="stylesheet"',
    'src="//cdn.example.com/lib.js"', 'src="https://cdn.example.com/lib.js"', '<a href="style.css">']) {
    assert.ok(out.includes(same), same);
  }
  assert.equal(versionAssets(out, versionOf), out, 'stamping twice changes nothing');
  assert.equal(stripVersions(out), html.replace('sub/x.css?v=0000000000', 'sub/x.css'));
  assert.equal(stripVersions(out), stripVersions(html));
  assert.deepEqual(assetRefs(html), [
    { file: 'style.css', version: null, query: null }, { file: 'sub/x.css', version: '0000000000', query: 'v=0000000000' }, { file: 'app.js', version: null, query: null },
  ]);
  assert.deepEqual(assetRefs(out), [
    { file: 'style.css', version: '0123456789', query: 'v=0123456789' }, { file: 'sub/x.css', version: 'ffffffffff', query: 'v=ffffffffff' }, { file: 'app.js', version: 'abcdefabcd', query: 'v=abcdefabcd' },
  ]);
  assert.throws(() => versionAssets('<script src="gone.js"></script>', versionOf), /gone\.js missing/);
  // Problems: a missing stamp, a stale stamp, a file that does not exist; a stamped page has none.
  assert.deepEqual(assetVersionProblems(out, versionOf), []);
  const problems = assetVersionProblems(html, versionOf);
  assert.equal(problems.length, 3, problems.join('\n'));
  assert.match(problems[0], /^style\.css has no \?v= version \(the file is 0123456789\)/);
  assert.match(problems[1], /^sub\/x\.css\?v=0000000000 is stale: the file is now ffffffffff \(edited without a rebuild\)/);
  assert.match(problems[2], /^app\.js has no \?v= version/);
  assert.deepEqual(assetVersionProblems('<script src="gone.js?v=1234567890"></script>', () => null), ['gone.js is referenced but does not exist']);
});

test('a malformed stamp (?v=latest, ?V=…, any other ?query on a local .css/.js) gets its own message, and the build re-stamps it', () => {
  const versions = { 'style.css': '0123456789', 'app.js': 'abcdefabcd' };
  const versionOf = (f) => (f in versions ? versions[f] : null);
  const cases = ['style.css?v=latest', 'style.css?V=0123456789', 'app.js?x=1', 'app.js?v=abcdefabc', 'app.js?v=abcdefabcd&x=1',
    'app.js?v=ABCDEFABCD', 'app.js?v=', 'app.js?'];
  const html = cases.map((c, i) => (i % 2 ? `<script src="${c}" defer></script>` : `<link rel="stylesheet" href="${c}">`)).join('\n');
  // Each one is seen (so nothing slips past the checks), none counts as a version.
  const refs = assetRefs(html);
  assert.deepEqual(refs.map((r) => `${r.file}?${r.query}`), cases);
  assert.deepEqual(refs.map((r) => r.version), cases.map(() => null));
  const fix = 'Run: npm --prefix _dev run pricing:build';
  const problems = assetVersionProblems(html, versionOf);
  assert.equal(problems.length, cases.length, problems.join('\n'));
  assert.equal(problems[0], `style.css?v=latest has a malformed ?v= stamp (expected ?v=0123456789). ${fix}`);
  assert.equal(problems[1], `style.css?V=0123456789 has a malformed ?v= stamp (expected ?v=0123456789). ${fix}`);
  assert.equal(problems[2], `app.js?x=1 has a malformed ?v= stamp (expected ?v=abcdefabcd). ${fix}`);
  assert.equal(problems[7], `app.js? has a malformed ?v= stamp (expected ?v=abcdefabcd). ${fix}`);
  for (const p of problems) assert.match(p, /^[a-z.-]+\?[^ ]* has a malformed \?v= stamp \(expected \?v=[0-9a-f]{10}\)\. Run: npm --prefix _dev run pricing:build$/);
  assert.ok(!problems.some((p) => /has no \?v= version|is stale/.test(p)), 'not the bare or the stale message');
  // A file that does not exist is reported as such, malformed stamp or not.
  assert.deepEqual(assetVersionProblems('<script src="gone.js?v=latest"></script>', versionOf), ['gone.js is referenced but does not exist']);
  // The build replaces a malformed stamp like a stale one; stripping removes it; a well-formed stamp parses as before.
  const out = versionAssets(html, versionOf);
  assert.deepEqual(assetVersionProblems(out, versionOf), []);
  assert.deepEqual(assetRefs(out).map((r) => r.version), cases.map((c) => versions[c.split('?')[0]]));
  assert.equal(stripVersions(html), html.replace(/\?[^"]*"/g, '"'));
  assert.deepEqual(assetRefs('<link rel="stylesheet" href="style.css?v=0123456789">'), [{ file: 'style.css', version: '0123456789', query: 'v=0123456789' }]);
  // External URLs with a query are still not local references.
  assert.deepEqual(assetRefs('<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">'), []);
});

// ---------- line endings ----------

const CRLF = (bytes) => Buffer.from(bytes.toString('latin1').replace(/\n/g, '\r\n'), 'latin1');

test('a CRLF copy of a file gets the same stamp as the LF original: the hash reads CRLF as LF', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gtl-pf3-crlf-'));
  try {
    for (const f of INDEX_ASSETS) {
      const lf = readFileSync(join(SITE_ROOT, f));
      assert.ok(!lf.includes(0x0d), `${f} is LF in the repository`);
      assert.ok(lf.includes(0x0a), `${f} has a line break`);
      const crlf = CRLF(lf);
      assert.ok(crlf.length > lf.length);
      assert.notEqual(sha256(crlf), sha256(lf), `${f}: the raw bytes differ`);
      writeFileSync(join(dir, f), crlf);
      assert.equal(fileVersion(f, dir), fileVersion(f), f);
      assert.equal(assetVersion(crlf), assetVersion(lf), f);
      // On the LF original the stamp is sha256sum's.
      assert.equal(fileVersion(f), sha256(lf).slice(0, 10), f);
    }
    // The same for a string (site-config.js is hashed from the text the build writes), and only CRLF is read as LF.
    assert.equal(assetVersion('a\r\nb\r\n'), assetVersion('a\nb\n'));
    assert.equal(assetVersion('a\r\nb\r\n'), sha256(Buffer.from('a\nb\n')).slice(0, 10));
    assert.equal(assetVersion(Buffer.from('a\r\nb\r\n')), assetVersion('a\nb\n'));
    assert.notEqual(assetVersion('a\rb'), assetVersion('a\nb'), 'a lone CR is not a line ending pair');
    assert.notEqual(assetVersion('a\n\nb'), assetVersion('a\nb'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- the build and the check, on a scratch copy of the site ----------

// The copy has its own _dev/build-pricing.mjs: the build resolves everything relative to its own folder and imports
// only Node built-ins, so no node_modules are needed and the repository's files are never touched.
function scratchSite() {
  const dir = mkdtempSync(join(tmpdir(), 'gtl-pf3-'));
  for (const f of ['index.html', 'privacidad.html', ...INDEX_ASSETS]) cpSync(join(SITE_ROOT, f), join(dir, f));
  mkdirSync(join(dir, '_dev', 'templates'), { recursive: true });
  for (const f of ['build-pricing.mjs', 'pricing.json', 'site-config.json', join('templates', 'privacidad.html')]) {
    cpSync(join(SITE_ROOT, '_dev', f), join(dir, '_dev', f));
  }
  return {
    dir,
    run: (...args) => spawnSync(process.execPath, [join(dir, '_dev', 'build-pricing.mjs'), ...args], { encoding: 'utf8' }),
    read: (f) => LF(readFileSync(join(dir, f), 'utf8')),
    drop: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test('the committed site passes --check on a scratch copy, and a rebuild there changes no byte', () => {
  const s = scratchSite();
  try {
    const before = Object.fromEntries(['index.html', 'privacidad.html', 'site-config.js'].map((f) => [f, readFileSync(join(s.dir, f))]));
    const check = s.run('--check');
    assert.equal(check.status, 0, check.stderr);
    assert.match(check.stdout, /every \?v= stamp equals the hash of its file/);
    const build = s.run();
    assert.equal(build.status, 0, build.stderr);
    assert.equal((build.stdout.match(/already up to date/g) || []).length, 3, build.stdout);
    for (const [f, bytes] of Object.entries(before)) assert.ok(readFileSync(join(s.dir, f)).equals(bytes), `${f} must be byte-identical after a rebuild`);
  } finally { s.drop(); }
});

for (const file of ['style.css', 'pricing.js', 'plan-request.js']) {
  test(`one byte added to ${file} without a rebuild fails --check; the rebuild stamps the new hash and the check passes again`, () => {
    const s = scratchSite();
    try {
      const old = fileVersion(file);
      appendFileSync(join(s.dir, file), ' ');
      const now = fileVersion(file, s.dir);
      assert.notEqual(now, old);
      const check = s.run('--check');
      assert.equal(check.status, 1, check.stdout);
      assert.ok(check.stderr.includes(`index.html: ${file}?v=${old} is stale: the file is now ${now} (edited without a rebuild). Run: npm --prefix _dev run pricing:build`), check.stderr);
      if (file === 'style.css') assert.ok(check.stderr.includes(`privacidad.html: style.css?v=${old} is stale: the file is now ${now}`), check.stderr);
      else assert.ok(!check.stderr.includes('privacidad.html'), check.stderr);
      assert.match(check.stderr, /index\.html differs from the data/, 'the stamped head line differs too');
      const build = s.run();
      assert.equal(build.status, 0, build.stderr);
      assert.match(build.stdout, /index\.html updated/);
      const page = s.read('index.html');
      assert.equal(assetRefs(page).find((r) => r.file === file).version, now);
      assert.ok(!page.includes(`?v=${old}"`));
      if (file === 'style.css') assert.equal(assetRefs(s.read('privacidad.html'))[0].version, now);
      const again = s.run('--check');
      assert.equal(again.status, 0, again.stderr);
      // The repository's own file was never touched.
      assert.equal(fileVersion(file), old);
    } finally { s.drop(); }
  });
}

test('site-config.js edited by hand fails --check twice over (the generated file and its stamp); the rebuild restores it and the stamp stays', () => {
  const s = scratchSite();
  try {
    const old = fileVersion('site-config.js');
    appendFileSync(join(s.dir, 'site-config.js'), '\n// edited by hand\n');
    const now = fileVersion('site-config.js', s.dir);
    const check = s.run('--check');
    assert.equal(check.status, 1, check.stdout);
    assert.match(check.stderr, /site-config\.js differs from the data/);
    assert.ok(check.stderr.includes(`index.html: site-config.js?v=${old} is stale: the file is now ${now}`), check.stderr);
    const build = s.run();
    assert.equal(build.status, 0, build.stderr);
    // The stamp follows the bytes the build writes, which did not change, so index.html is left alone.
    assert.match(build.stdout, /index\.html already up to date\./);
    assert.match(build.stdout, /site-config\.js updated/);
    assert.equal(fileVersion('site-config.js', s.dir), old);
    assert.equal(s.run('--check').status, 0);
  } finally { s.drop(); }
});

test('a config change re-stamps site-config.js in the same build, from the bytes it writes', () => {
  const s = scratchSite();
  try {
    const cfgPath = join(s.dir, '_dev', 'site-config.json');
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
    cfg.replyTime = 'Le respondemos en dos días hábiles.';
    writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    const old = fileVersion('site-config.js');
    const check = s.run('--check');
    assert.equal(check.status, 1, check.stdout);
    assert.match(check.stderr, /site-config\.js differs from the data/);
    const build = s.run();
    assert.equal(build.status, 0, build.stderr);
    assert.match(build.stdout, /index\.html updated/);
    assert.match(build.stdout, /site-config\.js updated/);
    const now = fileVersion('site-config.js', s.dir);
    assert.notEqual(now, old);
    assert.equal(assetRefs(s.read('index.html')).find((r) => r.file === 'site-config.js').version, now);
    assert.equal(s.run('--check').status, 0);
    assert.equal((s.run().stdout.match(/already up to date/g) || []).length, 3, 'a second build changes nothing');
  } finally { s.drop(); }
});

test('a stamp removed by hand from a page fails --check', () => {
  const s = scratchSite();
  try {
    const page = join(s.dir, 'privacidad.html');
    const html = readFileSync(page, 'utf8');
    const stripped = html.replace(/href="style\.css\?v=[0-9a-f]+"/, 'href="style.css"');
    assert.notEqual(stripped, html);
    writeFileSync(page, stripped);
    const check = s.run('--check');
    assert.equal(check.status, 1, check.stdout);
    assert.ok(check.stderr.includes(`privacidad.html: style.css has no ?v= version (the file is ${fileVersion('style.css')})`), check.stderr);
  } finally { s.drop(); }
});

test('a malformed stamp written by hand fails --check with its own message, and the rebuild replaces it', () => {
  const s = scratchSite();
  try {
    const style = fileVersion('style.css');
    const pricing = fileVersion('pricing.js');
    const edits = [
      ['privacidad.html', `href="style.css?v=${style}"`, 'href="style.css?v=latest"'],
      ['index.html', `src="pricing.js?v=${pricing}"`, `src="pricing.js?V=${pricing}"`],
    ];
    for (const [f, from, to] of edits) {
      const html = readFileSync(join(s.dir, f), 'utf8');
      assert.ok(html.includes(from), `${f} carries ${from}`);
      writeFileSync(join(s.dir, f), html.replace(from, to));
    }
    const check = s.run('--check');
    assert.equal(check.status, 1, check.stdout);
    assert.ok(check.stderr.includes(`privacidad.html: style.css?v=latest has a malformed ?v= stamp (expected ?v=${style}). Run: npm --prefix _dev run pricing:build`), check.stderr);
    assert.ok(check.stderr.includes(`index.html: pricing.js?V=${pricing} has a malformed ?v= stamp (expected ?v=${pricing}). Run: npm --prefix _dev run pricing:build`), check.stderr);
    assert.ok(!/has no \?v= version|is stale/.test(check.stderr), check.stderr);
    const build = s.run();
    assert.equal(build.status, 0, build.stderr);
    assert.match(build.stdout, /index\.html updated/);
    assert.match(build.stdout, /privacidad\.html updated/);
    assert.equal(assetRefs(s.read('privacidad.html'))[0].version, style);
    assert.equal(assetRefs(s.read('index.html')).find((r) => r.file === 'pricing.js').version, pricing);
    assert.equal(s.run('--check').status, 0);
  } finally { s.drop(); }
});

test('a scratch copy of the site rewritten with CRLF passes --check with the committed stamps, and a rebuild there changes no byte', () => {
  const s = scratchSite();
  try {
    const files = ['index.html', 'privacidad.html', ...INDEX_ASSETS, join('_dev', 'pricing.json'), join('_dev', 'site-config.json'),
      join('_dev', 'templates', 'privacidad.html')];
    for (const f of files) {
      const lf = readFileSync(join(s.dir, f));
      assert.ok(!lf.includes(0x0d), `${f} is LF`);
      writeFileSync(join(s.dir, f), CRLF(lf));
    }
    const before = Object.fromEntries(['index.html', 'privacidad.html', 'site-config.js'].map((f) => [f, readFileSync(join(s.dir, f))]));
    for (const bytes of Object.values(before)) assert.ok(bytes.includes(0x0d), 'the copy is CRLF');
    // The stamps on the CRLF pages are the committed ones, and every CRLF file hashes to them.
    for (const page of ['index.html', 'privacidad.html']) {
      for (const r of assetRefs(s.read(page))) assert.equal(r.version, fileVersion(r.file), `${page}: ${r.file}`);
    }
    for (const f of INDEX_ASSETS) assert.equal(fileVersion(f, s.dir), fileVersion(f), f);
    const check = s.run('--check');
    assert.equal(check.status, 0, check.stderr);
    assert.match(check.stdout, /every \?v= stamp equals the hash of its file/);
    const build = s.run();
    assert.equal(build.status, 0, build.stderr);
    assert.equal((build.stdout.match(/already up to date/g) || []).length, 3, build.stdout);
    for (const [f, bytes] of Object.entries(before)) assert.ok(readFileSync(join(s.dir, f)).equals(bytes), `${f} must be byte-identical after a rebuild`);
  } finally { s.drop(); }
});
