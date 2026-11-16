// W0: current-site hotfix. Links, claims, title and description, and the config-driven footer email.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadConfig, validateConfig, applySiteConfig, footerEmail, CURRENT_FOOTER_EMAIL, INDEX_PATH, PRIVACY_PATH,
} from '../build-pricing.mjs';
import { checkLinks, readPages, refsOf, idsOf } from '../scripts/check-links.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LF = (s) => s.replace(/\r\n/g, '\n');
const config = loadConfig();
const index = LF(readFileSync(INDEX_PATH, 'utf8'));
const privacy = LF(readFileSync(PRIVACY_PATH, 'utf8'));

// The kickoff's "Founder lines" block, written out independently of site-config.json:
// every founder is NONE, so no Trayectoria (Background) list appears.
const KICKOFF_FOUNDER_LINES = {
  'Gary Mendez': [],
  'Daniel Rengifo': [],
  'Jesus David Garcia, CFA': [],
  'David Andres Ramirez': [],
};

const cards = (html) => [...html.matchAll(/<article class="member-card">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
const nameOf = (card) => card.match(/<h3>([^<]*)<\/h3>/)[1];
const backgroundOf = (card) => {
  const block = card.match(/<h4>Trayectoria<\/h4>\s*<ul>([\s\S]*?)<\/ul>/);
  return block ? [...block[1].matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]) : null;
};
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// ---------- links ----------

test('the link check passes on the built index.html and privacidad.html', () => {
  const { errors, external, checked } = checkLinks(readPages());
  assert.deepEqual(errors, []);
  assert.ok(checked > 0);
  assert.ok(external.some((e) => e.includes('https://wa.me/')));
  assert.ok(external.some((e) => e.includes('mailto:')));
});

test('the link check CLI exits 0 on the built pages (it exits 1 on any problem)', () => {
  const r = spawnSync(process.execPath, [join(here, '..', 'scripts', 'check-links.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Link check passed/);
});

test('the link check catches a missing anchor, a missing file and a broken cross-page anchor', () => {
  const pages = {
    'index.html': '<a href="#nope">x</a><a href="projects/el-juego.html">y</a><p id="ok"></p>',
    'privacidad.html': '<a href="index.html#ok">ok</a><a href="index.html#gone">z</a>',
  };
  const { errors } = checkLinks(pages);
  assert.equal(errors.length, 3, errors.join('\n'));
  assert.ok(errors.some((e) => /href="#nope"/.test(e)));
  assert.ok(errors.some((e) => /projects\/el-juego\.html does not exist/.test(e)));
  assert.ok(errors.some((e) => /index\.html#gone/.test(e)));
});

test('the link check treats a leading / as the site root, not the file system root', () => {
  const pages = {
    'index.html': '<p id="team"></p>',
    'privacidad.html': '<a href="/">a</a><a href="/index.html#team">b</a><link href="/style.css"><a href="/index.html#gone">c</a><a href="/missing.html">d</a>',
  };
  const { errors } = checkLinks(pages);
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.ok(errors.some((e) => /index\.html has no element with id "gone"/.test(e)));
  assert.ok(errors.some((e) => /file missing\.html does not exist/.test(e)));
});

test('the link check ignores a ?query when resolving a file', () => {
  const pages = {
    'index.html': '<p id="team"></p><link href="style.css?v=2"><a href="index.html?x=1#team">a</a><a href="index.html?x=1#gone">b</a><script src="nope.js?v=1"></script>',
  };
  const { errors } = checkLinks(pages);
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.ok(errors.some((e) => /index\.html\?x=1#gone/.test(e)));
  assert.ok(errors.some((e) => /file nope\.js does not exist/.test(e)));
});

test('the link check reads single-quoted attributes too', () => {
  const html = "<p id='ok'></p><a href='#ok'>a</a><a href='#nope'>b</a><img src='missing.png'><a href=\"#ok\">c</a>";
  assert.deepEqual([...idsOf(html)], ['ok']);
  assert.deepEqual(refsOf(html).map((r) => r.value), ['#ok', '#nope', 'missing.png', '#ok']);
  const { errors, checked } = checkLinks({ 'index.html': html });
  assert.equal(checked, 4);
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.ok(errors.some((e) => /href="#nope" — no element with id "nope"/.test(e)));
  assert.ok(errors.some((e) => /file missing\.png does not exist/.test(e)));
});

test('the roadmap became Quiero saber más, and no project pages are linked', () => {
  assert.doesNotMatch(index, /<section id="future"/);
  assert.match(index, /<section id="contact" class="contact"/);
  assert.doesNotMatch(index + privacy, /projects\//);
});

// ---------- claims ----------

test('no "Achievements" heading or list remains anywhere', () => {
  for (const [name, html] of [['index.html', index], ['privacidad.html', privacy]]) {
    assert.doesNotMatch(html, /Achievements/i, name);
  }
  // Each founder card has its name, role and a short bio (Gary Mendez: his four lines, BF-W1); the only heading
  // allowed inside is Trayectoria (Background).
  const c = cards(index);
  assert.equal(c.length, 4);
  for (const card of c) {
    assert.match(card, /<p class="role">/);
    assert.match(card, nameOf(card) === 'Gary Mendez' ? /<ul class="member-points">/ : /<p class="member-bio">/);
    const headings = [...card.matchAll(/<h4>([^<]*)<\/h4>/g)].map((m) => m[1]);
    assert.ok(headings.every((h) => h === 'Trayectoria'), headings.join());
  }
});

test('the founder lines in the config are exactly the kickoff\'s', () => {
  assert.deepEqual(config.founders, KICKOFF_FOUNDER_LINES);
});

test('Background lists appear only for founders with lines, word for word', () => {
  for (const card of cards(index)) {
    const name = nameOf(card);
    assert.ok(name in KICKOFF_FOUNDER_LINES, `unknown founder ${name}`);
    const lines = KICKOFF_FOUNDER_LINES[name];
    const shown = backgroundOf(card);
    if (lines.length === 0) assert.equal(shown, null, `${name} must have no Background list`);
    else assert.deepEqual(shown.map(unescape), lines);
  }
});

test('the build renders given lines exactly and escaped, only for that founder, and removes them again', () => {
  const lines = ['Línea uno', 'A & B <c> "d"'];
  const withLines = { ...config, founders: { ...KICKOFF_FOUNDER_LINES, 'Daniel Rengifo': lines } };
  const html = applySiteConfig(index, withLines);
  for (const card of cards(html)) {
    const shown = backgroundOf(card);
    if (nameOf(card) === 'Daniel Rengifo') assert.deepEqual(shown.map(unescape), lines);
    else assert.equal(shown, null);
  }
  assert.ok(html.includes('<li>A &amp; B &lt;c&gt; &quot;d&quot;</li>'));
  assert.equal(applySiteConfig(html, config), index);
});

test('the config rejects more than three lines, empty lines and a founder without a card', () => {
  const bad = (founders) => validateConfig({ ...config, founders });
  assert.deepEqual(bad(KICKOFF_FOUNDER_LINES), []);
  assert.ok(bad({ 'Gary Mendez': ['a', 'b', 'c', 'd'] }).some((e) => /founders\.Gary/.test(e)));
  assert.ok(bad({ 'Gary Mendez': [''] }).some((e) => /founders\.Gary/.test(e)));
  assert.ok(bad(undefined).some((e) => /founders is required/.test(e)));
  assert.throws(() => applySiteConfig(index, { ...config, founders: { ...KICKOFF_FOUNDER_LINES, 'Someone Else': [] } }), /Someone Else/);
});

// ---------- head and hero ----------

test('the title and meta description are the contract\'s', () => {
  assert.equal(index.match(/<title>([^<]*)<\/title>/g).length, 1);
  assert.equal(index.match(/<title>([^<]*)<\/title>/)[1],
    'GTL AI | Impulsando sueños');
  assert.ok(index.includes('<link rel="icon" type="image/png" sizes="32x32" href="assets/branding/favicon-32.png">'), 'the 夢 logo is the tab icon');
  const desc = index.match(/<meta name="description" content="([^"]*)">/g);
  assert.equal(desc.length, 1);
  assert.equal(unescape(desc[0].match(/content="([^"]*)"/)[1]),
    'Creamos la página web de su negocio con agenda, pedidos o reservas en línea. Planes con precios claros y soporte en Colombia.');
  assert.ok(index.indexOf('<meta name="description"') < index.indexOf('</head>'));
});

test('the hero buttons go to #contact and #team (the plans section was retired)', () => {
  const actions = index.match(/<div class="hero-actions">([\s\S]*?)<\/div>/)[1];
  const links = [...actions.matchAll(/<a href="([^"]*)" class="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2], unescape(m[3])]);
  assert.deepEqual(links, [
    ['#contact', 'btn btn-primary', 'Quiero saber más'],
    ['#team', 'btn btn-ghost', 'Por qué nosotros'],
  ]);
  assert.doesNotMatch(index, /<section id="planes"/);
  assert.match(index, /<section id="contact"/);
  assert.match(index, /<section id="team"/);
});

test('Por qué nosotros: Expertise-as-Software, then the founders with their bios, roles and LinkedIn where given', () => {
  const team = index.match(/<section id="team"[\s\S]*?<\/section>/)[0];
  assert.match(team, /<h2 id="team-title">Por qué nosotros<\/h2>/);
  // BF-W1, decision 9: the heading and its three paragraphs, each from its first words to its last.
  assert.match(team, /<h3 class="why-heading">Expertise-as-Software: la evolución del SaaS<\/h3>/);
  const why = [...team.matchAll(/<p class="why-text">([^<]*)<\/p>/g)].map((m) => m[1]);
  assert.equal(why.length, 3);
  assert.match(why[0], /^El SaaS le vende una herramienta que usted tiene que aprender a usar\. .* lo convertimos en su propio software\.$/);
  assert.match(why[1], /^Nuestros paquetes de software incluyen .* Como complemento, ofrecemos asesoría financiera y tributaria con contador público\.$/);
  assert.match(why[2], /^Es una forma innovadora .* somos pioneros en llevarla a Colombia y a toda Latinoamérica\. Somos una empresa multinacional, con sede en Bogotá y en París, y existimos para una sola cosa: ayudarle a hacer realidad su sueño\.$/);
  // The second paragraph names the four plans in precios.html's order, and its add-on.
  const precios = readFileSync(join(here, '..', '..', 'precios.html'), 'utf8');
  const plans = [...precios.matchAll(/<article class="pr-tier[^"]*" data-tier="[^"]+">\s*(?:<span class="pr-badge">[^<]*<\/span>)?<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(plans, ['Presencia', 'Agenda', 'Gestión', 'Completo']);
  assert.deepEqual(plans.map((p) => why[1].indexOf(`${p}, su`) >= 0 || why[1].indexOf(`${p}, todo`) >= 0), [true, true, true, true]);
  assert.ok(plans.map((p) => why[1].indexOf(`${p},`)).every((v, i, a) => i === 0 || v > a[i - 1]));
  assert.ok(precios.includes('<h3>Asesorías financieras y tributarias</h3>'));
  assert.ok(precios.includes('Con un contador público:'));
  assert.doesNotMatch(team, /ingenieros de software y contadores profesionales|precio asequible para pymes/);
  assert.deepEqual(cards(index).map(nameOf), ['Gary Mendez', 'Daniel Rengifo', 'Jesus David Garcia, CFA', 'David Andres Ramirez']);
  const roles = cards(index).map((c) => c.match(/<p class="role">([^<]*)<\/p>/)[1]);
  // BF-W1: Daniel Rengifo is COO (was CTO) and David Andres Ramirez is CTO (was CDO).
  assert.deepEqual(roles, ['Director ejecutivo (CEO)', 'Director de operaciones (COO)', 'Director financiero (CFO)', 'Director de tecnología (CTO)']);
  assert.doesNotMatch(team, /CDO|Director de datos/);
  const [gary, daniel, , david] = cards(index);
  assert.deepEqual([...gary.matchAll(/<li>.*?<span>([^<]*)<\/span><\/li>/g)].map((m) => m[1]), ['Investigador y desarrollador de productos de IA',
    'PhD en arquitectura de diseño conversacional con IA', 'Emprendedor en serie', 'Exjugador de squash del PSA Challenger Tour']);
  assert.match(daniel, /<p class="member-bio">Lidera nuestra sede en París y las operaciones de GTL AI\. /);
  assert.match(david, /<p class="member-bio">Lidera la tecnología de GTL AI\. /);
  const links = cards(index).map((c) => (c.match(/<a class="member-link" href="([^"]*)" target="_blank" rel="noopener">/) || [])[1] || null);
  assert.deepEqual(links, [null, 'https://www.linkedin.com/in/dfrengifo/', null, 'https://www.linkedin.com/in/david-andr%C3%A9s-ram%C3%ADrez-vanegas/']);
});

// ---------- the footer email ----------

const footerLink = (html) => html.match(/<a href="mailto:([^"]*)" class="footer-email">([^<]*)<\/a>/).slice(1);

test('the footer carries contactEmail from the config (index and privacy page); PENDIENTE would keep the old address', () => {
  // PQ1 set the address; the pre-PQ1 one must be gone from both pages.
  assert.equal(config.contactEmail, 'gtlai@gtl-ai.com');
  assert.equal(footerEmail(config), config.contactEmail);
  assert.deepEqual(footerLink(index), [config.contactEmail, config.contactEmail]);
  assert.deepEqual(footerLink(privacy), [config.contactEmail, config.contactEmail]);
  assert.doesNotMatch(index + privacy, /garydmendez25/);
  assert.equal(CURRENT_FOOTER_EMAIL, 'garydmendez25@gmail.com');
  assert.equal(footerEmail({ ...config, contactEmail: 'PENDIENTE' }), CURRENT_FOOTER_EMAIL);
});

test('the build writes whatever contactEmail is set to the footer link and its text', () => {
  const set = { ...config, contactEmail: 'hola@example.com' };
  assert.equal(footerEmail(set), 'hola@example.com');
  const html = applySiteConfig(index, set);
  assert.deepEqual(footerLink(html), ['hola@example.com', 'hola@example.com']);
  assert.doesNotMatch(html, /garydmendez25|garydmendez@/);
  // Back to the committed config gives the committed page again.
  assert.equal(applySiteConfig(html, config), index);
  // PENDIENTE (pre-PQ1) writes the old address.
  assert.deepEqual(footerLink(applySiteConfig(index, { ...config, contactEmail: 'PENDIENTE' })), [CURRENT_FOOTER_EMAIL, CURRENT_FOOTER_EMAIL]);
});

test('pricing:check passes, so the committed pages are what the build writes from the config', () => {
  const r = spawnSync(process.execPath, [join(here, '..', 'build-pricing.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});
