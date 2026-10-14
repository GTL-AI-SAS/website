import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatCOP, esc, txt, loadData, validate, bundleListPrice, releaseItems, renderSection,
  outsideMarkers, wiringProblems, INDEX_PATH, START, END,
} from '../build-pricing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const builder = join(here, '..', 'build-pricing.mjs');
const data = loadData();
const index = readFileSync(INDEX_PATH, 'utf8').replace(/\r\n/g, '\n');
const run = (...args) => spawnSync(process.execPath, [builder, ...args], { encoding: 'utf8' });

// Independent copy of the contract's Appendix A (COP, excluding IVA). Do not derive from pricing.json.
const APPENDIX_A = {
  presencia: { esencial: [1200000, 79000], crece: [1900000, 149000], pro: [2900000, 249000] },
  agenda: { esencial: [2500000, 199000], crece: [4000000, 350000], pro: [6500000, 590000] },
  pedidos: { esencial: [2000000, 199000], crece: [3500000, 349000], pro: [6000000, 590000] },
  reservas: { esencial: [2500000, 249000], crece: [4500000, 399000], pro: [7000000, 690000] },
};
const COMUNIDAD = { esencial: [1500000, 2500, 250000], crece: [2500000, 3500, 350000] };
const A_MEDIDA_FROM = 15000000;
const ADDONS = { dian: 79000, 'recepcionista-ia': 149000, metricas: 99000, redes: 290000 };
const ADDON_RULES = { 'whatsapp-extra': 'Costo + 30 %', pagos: 'Tarifa de la pasarela, al costo' };
const BUNDLES = {
  'clinica-completa': [578000, 490000],
  'finca-directa': [689000, 590000],
  'restaurante-propio': [718000, 620000],
};
const CONJUNTO_PER_ASSEMBLY = 300000;

const pkg = (code) => data.packages.find((p) => p.code === code);
const tier = (p, t) => pkg(p).tiers.find((x) => x.code === t);

test('the data is valid', () => {
  assert.deepEqual(validate(data), []);
});

test('every fixed-price plan equals Appendix A', () => {
  for (const [p, tiers] of Object.entries(APPENDIX_A)) {
    for (const [t, [setup, monthly]] of Object.entries(tiers)) {
      assert.equal(tier(p, t).setup.amount, setup, `${p}/${t} setup`);
      assert.equal(tier(p, t).monthly.amount, monthly, `${p}/${t} monthly`);
    }
  }
});

test('Comunidad per-unit pricing equals Appendix A, and Pro is "A cotizar"', () => {
  for (const [t, [setup, perUnit, minimum]] of Object.entries(COMUNIDAD)) {
    assert.equal(tier('comunidad', t).setup.amount, setup);
    assert.equal(tier('comunidad', t).monthly.perUnit, perUnit);
    assert.equal(tier('comunidad', t).monthly.minimum, minimum);
  }
  assert.equal(tier('comunidad', 'pro').setup.text, 'A cotizar');
  assert.equal(tier('comunidad', 'pro').monthly.text, 'A cotizar');
});

test('A medida starts at 15.000.000 and shows no hourly rate', () => {
  const t = tier('a-medida', 'proyecto');
  assert.equal(t.price.from, A_MEDIDA_FROM);
  // No rate is kept in the data until JD sets one (step 8, M2).
  assert.equal(JSON.stringify(data).includes('"hourlyRate"'), false, 'hourlyRate must not be in the data');
  const html = renderSection(data);
  const panel = html.slice(html.indexOf('id="panel-a-medida"'), html.indexOf('class="pricing-common"'));
  assert.ok(panel.includes('id="tier-a-medida-proyecto"'), 'A medida panel not found');
  assert.deepEqual(panel.match(/\$\s*\d[\d.,]*/g), ['$15.000.000']);
});

test('add-ons equal Appendix A', () => {
  for (const [code, monthly] of Object.entries(ADDONS)) {
    assert.equal(data.addons.items.find((a) => a.code === code).monthly, monthly, code);
  }
  for (const [code, rule] of Object.entries(ADDON_RULES)) {
    assert.equal(data.addons.items.find((a) => a.code === code).rule, rule, code);
  }
});

test('computed bundle list prices are 578.000, 689.000 and 718.000; bundle prices equal Appendix A', () => {
  for (const [code, [list, price]] of Object.entries(BUNDLES)) {
    const b = data.bundles.items.find((x) => x.code === code);
    assert.equal(bundleListPrice(data, b), list, `${code} list`);
    assert.equal(b.bundleMonthly, price, `${code} price`);
    assert.equal(b.listPrice, undefined, `${code}: the list price must not be typed`);
  }
  const cc = data.bundles.items.find((x) => x.code === 'conjunto-conectado');
  assert.equal(cc.priceText.amount, CONJUNTO_PER_ASSEMBLY);
  assert.equal(bundleListPrice(data, cc), null);
});

test('every price is "propuesta" until PQ1', () => {
  const statuses = [];
  for (const p of data.packages) for (const t of p.tiers) statuses.push(t.status);
  for (const a of data.addons.items) statuses.push(a.status);
  for (const b of data.bundles.items) statuses.push(b.status);
  assert.ok(statuses.every((s) => s === 'propuesta'));
});

test('the formatter gives es-CO amounts without Intl', () => {
  assert.equal(formatCOP(4000000), '$4.000.000');
  assert.equal(formatCOP(250000), '$250.000');
  assert.equal(formatCOP(2500), '$2.500');
  assert.equal(formatCOP(999), '$999');
  assert.equal(formatCOP(15000000), '$15.000.000');
});

test('one escaping function handles HTML specials', () => {
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

test('the validator rejects a bundle part that does not exist', () => {
  const broken = structuredClone(data);
  broken.bundles.items[0].parts[1].code = 'no-existe';
  assert.ok(validate(broken).some((e) => /part addon no-existe does not exist/.test(e)));
});

test('the validator rejects two highlighted tiers and non-integer amounts', () => {
  const broken = structuredClone(data);
  broken.packages[0].tiers[0].highlight = true;
  broken.packages[1].tiers[0].setup.amount = 1200000.5;
  const errors = validate(broken);
  assert.ok(errors.some((e) => /exactly one highlighted tier/.test(e)));
  assert.ok(errors.some((e) => /setup needs a positive integer/.test(e)));
});

test('--check passes on the committed index.html', () => {
  const r = run('--check');
  assert.equal(r.status, 0, r.stderr);
});

test('index.html has its wiring and no price outside the generated block', () => {
  assert.ok(index.includes(START) && index.includes(END));
  assert.deepEqual(wiringProblems(index), []);
  assert.equal(outsideMarkers(index).match(/\$\d/g), null);
});

test('--release fails and lists every propuesta price and PENDIENTE-COPY text', () => {
  const r = run('--release');
  assert.equal(r.status, 1);
  const items = releaseItems(data);
  assert.ok(items.length > 0);
  for (const item of items) assert.ok(r.stderr.includes(item), `missing from output: ${item}`);
  assert.match(r.stderr, /propuesta\s+packages\[agenda\]\.tiers\[crece\]/);
  assert.match(r.stderr, /PENDIENTE-COPY\s+faq/);
});

test('no draft marker reaches the page', () => {
  assert.ok(!index.includes('PENDIENTE'));
  assert.ok(!/data-status|copyStatus/.test(index));
});

// ---------- copy (step 8): register, fidelity to Appendix B, field-level draft markers ----------

const NOT_VISIBLE = new Set(['code', 'type', 'package', 'tier', 'status', 'copyStatus', 'currency', 'updated']);
function visibleStrings(node, out = []) {
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach((v) => visibleStrings(v, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) if (!NOT_VISIBLE.has(k)) visibleStrings(v, out);
  }
  return out;
}

const TU_FORMS = ['tu', 'tus', 'tuyo', 'tuyos', 'te', 'contigo', 'puedes', 'quieras', 'escríbenos', 'cuéntanos',
  'agrégalos', 'pagas', 'haces', 'sabes', 'trabajas'];

test('register: no visible Spanish text addresses the buyer as tú', () => {
  const word = new RegExp(`(?<![\\p{L}\\p{N}])(${TU_FORMS.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
  assert.ok(word.test('Cuéntanos de TU negocio') && !word.test('Contenido para redes'), 'the matcher itself works');
  const strings = visibleStrings(data);
  assert.ok(strings.length > 150, `too few strings collected (${strings.length})`);
  const hits = strings.filter((s) => word.test(s)).map((s) => `${s.match(word)[0]}: ${s}`);
  assert.deepEqual(hits, []);
});

// Independent copy of the contract's Appendix B (amended 2026-10-13). Do not derive from pricing.json.
const APPENDIX_B = [
  'Planes', 'Planes y precios',
  'Una puesta en marcha única para poner su negocio en línea y una mensualidad que lo mantiene funcionando, seguro y al día.',
  'Presencia', 'Agenda', 'Pedidos', 'Reservas', 'Comunidad', 'A medida',
  'Una página web profesional para cualquier negocio.',
  'Página web con agenda en línea para consultorios y centros de salud y bienestar.',
  'Pedidos en línea para restaurantes.',
  'Reservas directas para fincas y alojamientos.',
  'Un portal para conjuntos residenciales y edificios.',
  'Software a la medida de su negocio.',
  'Esencial', 'Crece', 'Pro', 'Más elegido',
  'Para empezar con lo esencial.', 'Para negocios que quieren crecer.', 'Para varias sedes y más contenido.',
  'Para un profesional independiente.', 'Para consultorios con equipo.', 'Para varias sedes y más pacientes.',
  'Para empezar a vender en línea.', 'Para restaurantes que quieren crecer.', 'Para varias sedes y más pedidos.',
  'Para empezar a recibir reservas directas.', 'Para alojamientos que quieren crecer.', 'Para varias propiedades y más reservas.',
  'Para empezar a gestionar el conjunto en línea.', 'Para conjuntos que quieren hacer todo en línea.', 'Para varias torres o conjuntos.',
  'Mensualidad', 'Puesta en marcha (pago único)', 'A cotizar',
  'Todo lo de Esencial, y además:', 'Todo lo de Crece, y además:', 'Solicitar este plan',
  'Sitio de una página con la plantilla de su sector', 'Botón de WhatsApp', 'Ubicación en Google Maps', '1 cambio pequeño al mes',
  'Hasta 5 páginas', 'Formulario de contacto', 'Gestión de su Perfil de Empresa en Google', 'SEO local básico', '2 cambios al mes',
  'Informe mensual de visitas', 'Hasta 10 páginas y blog', 'Varias sedes', 'Panel de métricas', 'Facturación electrónica DIAN incluida',
  'Soporte prioritario', '4 cambios al mes',
  'Agenda en línea', '1 sede', '1 profesional', 'Hasta 5 profesionales', 'Recordatorios por WhatsApp', 'Anticipos en línea',
  'Informe mensual de resultados',
  'Menú o catálogo en línea', 'Pedidos por WhatsApp', 'Pedidos en línea con pago', 'Avisos de pedido por WhatsApp', 'Informe mensual de ventas',
  'Calendario de disponibilidad', 'Solicitudes de reserva', '1 propiedad o tipo de unidad', 'Hasta 5 unidades',
  'Mensajes a huéspedes por WhatsApp', 'Informe mensual de ocupación', 'Varias propiedades',
  'Portal del conjunto', 'Avisos y documentos', 'Reserva de zonas comunes', 'Solicitudes en línea (PQRS)', 'Avisos por WhatsApp',
  'Informe mensual', 'Para varias torres o conjuntos',
  'Todos los planes incluyen su propio dominio, hosting, actualizaciones de seguridad, una copia de seguridad mensual y soporte.',
  'Permanencia mínima de 12 meses · Precios en COP + IVA (19 %)',
  'Proyecto a medida', 'Definimos el alcance con usted y le enviamos una propuesta escrita.',
  'Para clientes en Estados Unidos también trabajamos por horas.', 'Cotizar mi proyecto',
  'Complementos', 'Agréguelos a cualquier plan.',
  'Facturación electrónica DIAN', 'Recepcionista IA (asistente por WhatsApp)', 'Contenido para redes sociales (4 publicaciones al mes)',
  'Mensajes adicionales de marketing por WhatsApp', 'Pagos con tarjeta y QR', 'Costo + 30 %', 'Tarifa de la pasarela, al costo',
  'Paquetes por sector', 'Un plan y sus complementos, a un precio menor.',
  'Clínica Completa', 'Finca Directa', 'Restaurante Propio', 'Conjunto Conectado',
  'Solicitar este paquete', 'Precio de lista',
  'Forma de pago',
  'Usted paga una puesta en marcha única y una mensualidad.',
  'El pago inicial, que es la puesta en marcha más su primera mensualidad, se paga completo antes de empezar.',
  'Después, la mensualidad se paga el día 1 de cada mes.',
  'La mensualidad cubre hosting, seguridad, copias de seguridad, los cambios mensuales de su plan y soporte.',
  'Permanencia mínima de 12 meses.',
  'Precios en pesos colombianos (COP) + IVA (19 %).',
  'Su dominio y sus datos son suyos.', 'Sin comisión por cita, pedido ni reserva.',
  'Usted trabaja directamente con el equipo que construye su sitio.',
  '¿Qué cubre la puesta en marcha?',
  'El diseño, la configuración y la puesta en marcha de su sitio con la plantilla de su sector: sus servicios, horarios, fotos y textos, la conexión de su dominio y las pruebas antes del lanzamiento.',
  '¿Qué incluye la mensualidad?',
  'Hosting, actualizaciones de seguridad, una copia de seguridad mensual, soporte y los cambios mensuales incluidos en su plan.',
  '¿De quién son el dominio y los datos?',
  'Suyos. El dominio queda a nombre de su negocio y puede pedir una copia de sus datos cuando quiera.',
  '¿Puedo cambiar de plan?',
  'Sí. Puede subir de plan cuando quiera y el cambio se refleja en la siguiente mensualidad. Para bajar de plan, escríbanos y lo revisamos según su permanencia.',
  '¿Cómo se paga?',
  'Antes de empezar, usted hace un solo pago con la puesta en marcha y su primera mensualidad. Después, la mensualidad se paga el día 1 de cada mes.',
  '¿Los precios incluyen IVA?',
  'No. Todos los precios están en pesos colombianos y no incluyen IVA (19 %).',
  '¿No sabe cuál elegir?', 'Cuéntenos sobre su negocio y le recomendamos el plan indicado.', 'Hablar con nosotros',
];
// Appendix B lines composed from data at render time (labels + formatted figures).
const APPENDIX_B_RENDERED = [
  '$350.000 / mes + IVA', '$4.000.000 + IVA',
  '$2.500 por unidad al mes + IVA', 'Mínimo $250.000 / mes + IVA',
  'Desde $15.000.000 por proyecto + IVA',
  '$79.000 / mes + IVA', '$149.000 / mes + IVA', '$99.000 / mes + IVA', '$290.000 / mes + IVA',
  'Agenda Crece + Facturación DIAN + Recepcionista IA', 'Reservas Crece + Contenido para redes',
  'Pedidos Crece + Facturación DIAN + Contenido para redes', 'Comunidad Crece + una Asamblea Virtual al año',
  '$578.000 $490.000 / mes + IVA', '$689.000 $590.000 / mes + IVA', '$718.000 $620.000 / mes + IVA',
  'Precio de Comunidad Crece + $300.000 por asamblea + IVA',
];

test('fidelity: every Appendix B string appears in the data exactly', () => {
  const strings = new Set(visibleStrings(data));
  assert.deepEqual(APPENDIX_B.filter((s) => !strings.has(s)), []);
});

test('fidelity: every composed Appendix B line appears in the rendered section exactly', () => {
  const text = renderSection(data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.deepEqual(APPENDIX_B_RENDERED.filter((s) => !text.includes(s)), []);
});

test('draft markers sit on fields: no object holding a confirmed field carries copyStatus', () => {
  const offenders = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${(v && v.code) || i}]`));
    if (!node || typeof node !== 'object') return;
    if (('name' in node || 'includes' in node) && 'copyStatus' in node) offenders.push(path);
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(data, '');
  assert.deepEqual(offenders, []);
  // Confirmed fields are plain strings with no marker.
  const plain = (v, at) => assert.equal(typeof v, 'string', `${at} must be a plain confirmed string`);
  for (const p of data.packages) {
    plain(p.name, `${p.code}.name`);
    for (const t of p.tiers) {
      if (t.name !== undefined) plain(t.name, `${p.code}/${t.code}.name`);
      t.includes.forEach((i, n) => plain(i, `${p.code}/${t.code}.includes[${n}]`));
    }
  }
  for (const a of data.addons.items) plain(a.name, `addon ${a.code}.name`);
  for (const b of data.bundles.items) plain(b.name, `bundle ${b.code}.name`);
  plain(tier('a-medida', 'proyecto').price.prefix, 'a-medida price.prefix');
  plain(tier('a-medida', 'proyecto').price.suffix, 'a-medida price.suffix');
  plain(data.common.line, 'common.line');
  plain(data.meta.note, 'meta.note');
  plain(data.paymentTerms.heading, 'paymentTerms.heading');
  data.paymentTerms.items.forEach((i, n) => plain(i, `paymentTerms.items[${n}]`));
  for (const [k, v] of Object.entries(data.meta.labels)) plain(v, `meta.labels.${k}`);
});

test('every draft field is listed by the release check at field level', () => {
  const items = new Set(releaseItems(data).filter((i) => i.startsWith('PENDIENTE-COPY')).map((i) => i.replace(/^PENDIENTE-COPY\s+/, '')));
  const expected = ['meta.eyebrow', 'meta.subtitle', 'addons.heading', 'addons.subtitle', 'bundles.heading', 'bundles.subtitle',
    'faq.heading', 'closingCta.heading', 'closingCta.text', 'closingCta.button',
    'bundles.items[conjunto-conectado].priceText.base', 'bundles.items[conjunto-conectado].priceText.unit',
    'bundles.items[conjunto-conectado].parts[1].name',
    'packages[a-medida].tiers[proyecto].title', 'packages[a-medida].tiers[proyecto].text',
    'packages[a-medida].tiers[proyecto].hourlyLine', 'packages[a-medida].tiers[proyecto].button'];
  for (const p of data.packages) {
    expected.push(`packages[${p.code}].for`);
    if (p.code === 'a-medida') continue;
    for (const t of p.tiers) {
      expected.push(`packages[${p.code}].tiers[${t.code}].suits`);
      if (t.includesLead) expected.push(`packages[${p.code}].tiers[${t.code}].includesLead`);
    }
  }
  data.trust.items.forEach((_, i) => expected.push(`trust.items[${i}]`));
  data.faq.items.forEach((_, i) => expected.push(`faq.items[${i}]`));
  assert.deepEqual(expected.filter((e) => !items.has(e)), []);
  // Only draft fields are listed: every listed node is a { text } field or an FAQ entry.
  for (const i of items) assert.match(i, /\.(for|suits|includesLead|title|text|hourlyLine|button|prefix|suffix|heading|subtitle|eyebrow|base|unit|name|shortName)$|^(trust|faq)\.items\[\d+\]$/, i);
  assert.equal(txt({ text: 'a', copyStatus: 'PENDIENTE-COPY' }), 'a');
  assert.equal(txt('b'), 'b');
});

test('there is no .nojekyll file', () => {
  assert.equal(existsSync(join(root, '.nojekyll')), false);
});
