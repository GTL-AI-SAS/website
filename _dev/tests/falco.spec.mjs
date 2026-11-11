import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// Falco, the AI receptionist (#falco): a pixel-art carrier pigeon takes an envelope from side to side until Pause, and three chats
// play once when the section comes into view.
async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const section = (page) => page.locator('#falco');
const steps = (page) => page.locator('#falco .fc-step');

test.describe('Falco', () => {
  test('sits between the customer stories and Por qué nosotros, with its title, text and three chats', async ({ page }) => {
    await open(page);
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id));
    expect(order.slice(order.indexOf('stories'), order.indexOf('team') + 1)).toEqual(['stories', 'falco', 'team']);
    await expect(section(page).locator('h2')).toHaveText('Un recepcionista con IA para tu negocio que organiza la agenda y hace reservas automáticas');
    await expect(section(page).locator('.falco-lead')).toContainText('Es tu asistente personal para tu negocio.');
    await expect(section(page).locator('.falco-card h3')).toHaveText(['Atiende a tus clientes', 'Te resume tu día', 'Te da la agenda']);
    await expect(section(page).locator('.falco-pixel')).toHaveCount(1);
    // The name is easy to see: big, above the title.
    await expect(section(page).locator('.falco-name b')).toHaveText('Falco');
    expect(await section(page).locator('.falco-name b').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(48);
    await expect(section(page).locator('.falco-name span')).toHaveText('Recepcionista con IA');
    await expect(steps(page)).toHaveCount(10);
  });

  test('the messages wait out of sight, then play once when the section comes into view', async ({ page }) => {
    await open(page);
    await expect(section(page)).toHaveClass(/is-armed/);
    await expect(steps(page).first()).toBeHidden();
    await section(page).scrollIntoViewIfNeeded();
    await expect(section(page)).toHaveClass(/is-playing/);
    for (const s of await steps(page).all()) await expect(s).toBeVisible({ timeout: 8000 });
    await expect(section(page).locator('.fc-pill')).toHaveText('Cita agendada');
    await expect(section(page).locator('.fc-agenda li')).toHaveCount(4);
    // The chats' animations are finite: only the bird keeps moving.
    expect(await section(page).locator('.falco-grid').evaluate((el) => el.getAnimations({ subtree: true }).every((a) => a.effect.getComputedTiming().endTime !== Infinity))).toBe(true);
  });

  test('the pigeon carries its envelope from the client to the shop and back, turning round at each end, until Pause', async ({ page }) => {
    await open(page);
    await section(page).scrollIntoViewIfNeeded();
    const state = () => section(page).evaluate((el) => {
      const s = (q) => getComputedStyle(el.querySelector(q));
      return { fly: s('.falco-flight').animationName, turn: s('.falco-pixel').animationName, flap: s('.falco-frame--a').animationName, play: s('.falco-flight').animationPlayState };
    });
    expect(await state()).toEqual({ fly: 'falco-cross', turn: 'falco-turn', flap: 'falco-frame-a', play: 'running' });
    // It moves, stays inside the page, and faces the way it flies.
    const at = (ms) => section(page).evaluate((el, t) => {
      for (const a of el.querySelector('.falco-sky').getAnimations({ subtree: true })) { a.pause(); a.currentTime = t; }
      const b = el.querySelector('.falco-pixel').getBoundingClientRect();
      return { x: b.left, right: b.right, flipped: new DOMMatrix(getComputedStyle(el.querySelector('.falco-pixel')).transform).a < 0 };
    }, ms);
    // It flies between the client's bubble and the shop, and each end ticks when it arrives.
    await expect(section(page).locator('.falco-end')).toHaveCount(2);
    const ends = await section(page).locator('.falco-end').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.right]));
    const ok = (which) => section(page).locator(`.falco-end--${which} .falco-ok`).evaluate((el) => getComputedStyle(el).visibility);
    const going = await at(3000);
    expect(await ok('to')).toBe('hidden');
    const far = await at(7800);
    expect(await ok('to')).toBe('visible');
    expect(await ok('from')).toBe('hidden');
    expect(far.right).toBeLessThanOrEqual(ends[1][0] + 1);
    expect(going.x).toBeGreaterThanOrEqual(ends[0][1] - 1);
    const back = await at(12000);
    expect(far.x).toBeGreaterThan(going.x + 200);
    expect(back.x).toBeLessThan(far.x - 100);
    expect(far.right).toBeLessThanOrEqual(1440);
    expect(going.flipped).toBe(false);
    expect(back.flipped).toBe(true);
    await page.reload();
    await waitForFonts(page);
    const toggle = section(page).locator('[data-falco-toggle]');
    await expect(toggle).toHaveText('Pausar animación');
    await toggle.click();
    await expect(toggle).toHaveText('Reanudar animación');
    expect((await state()).play).toBe('paused');
    await toggle.click();
    expect((await state()).play).toBe('running');
  });

  test('with reduced motion every message shows from the start', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await expect(section(page)).not.toHaveClass(/is-armed/);
    for (const s of await steps(page).all()) await expect(s).toBeVisible();
    // The bird stands still in the middle, and there is no Pause button.
    expect(await section(page).locator('.falco-flight').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(section(page).locator('.falco-pixel')).toBeVisible();
    await expect(section(page).locator('[data-falco-toggle]')).toBeHidden();
  });

  test('in English the title, text and chats are English', async ({ page }) => {
    await open(page, '/?lang=en');
    await expect(section(page).locator('h2')).toHaveText('An AI receptionist for your business that organizes your calendar and books appointments automatically');
    await expect(section(page).locator('.fc-user').nth(2)).toHaveText('How is my calendar today?');
    await expect(section(page).locator('.fc-user').last()).toHaveText('Give me today’s agenda.');
    await expect(section(page).locator('.falco-name')).toHaveText('FalcoAI receptionist');
    await expect(section(page).locator('[data-falco-toggle]')).toHaveText('Pause animation');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`at ${width} px nothing scrolls sideways, in both languages`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        await section(page).scrollIntoViewIfNeeded();
        await expect(steps(page).last()).toBeVisible({ timeout: 8000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
      }
    });
  }

  test('axe finds no serious or critical violations once the chats have played, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      await section(page).scrollIntoViewIfNeeded();
      await expect(steps(page).last()).toBeVisible({ timeout: 8000 });
      await page.evaluate(() => Promise.all(document.querySelector('#falco').getAnimations({ subtree: true })
        .filter((a) => a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished)));
      const r = await new AxeBuilder({ page }).include('#falco').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
});

// The demo chat: a scripted sample (no AI). Eight questions; each gets one of its five answers at random.
const QUESTIONS = ['¿Cómo va mi calendario hoy?', 'Dame la agenda de mañana.', '¿Cuánto vendí esta semana?', '¿Quién no ha pagado?',
  '¿Cuándo debo pagar impuestos?', '¿Cuál es mi servicio más vendido?', '¿Tengo espacios libres el viernes?', '¿Cuántos clientes nuevos tuve este mes?'];
const demo = (page) => page.locator('[data-falco-demo]');
const messages = (page) => page.locator('[data-falco-log] .fc-msg:not(.fc-typing)');
const clean = (t) => t.replace(/\s+/g, ' ').trim();
// Asks a question and returns Falco's answer, once it has finished "typing".
async function ask(page, id) {
  const before = await messages(page).count();
  await page.locator(`[data-falco-demo] [data-q="${id}"]`).click();
  await expect(messages(page)).toHaveCount(before + 2);
  await expect(page.locator('[data-falco-log] .fc-typing')).toHaveCount(0);
  return clean(await messages(page).last().textContent());
}

test.describe('Falco demo chat', () => {
  test('offers eight questions under the chats, says it is a demo, and greets', async ({ page }) => {
    await open(page);
    await expect(demo(page).locator('h3')).toHaveText('Pruébalo tú mismo');
    await expect(demo(page).locator('.falco-demo-tag')).toHaveText('Demostración: respuestas de ejemplo con los datos de Alba, una clínica ficticia. Todavía no es la IA en vivo.');
    await expect(demo(page).locator('[data-q]')).toHaveText(QUESTIONS);
    // The questions sit in two even columns of four.
    const cells = await demo(page).locator('[data-q]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; }));
    expect(new Set(cells.map((c) => c[0])).size).toBe(2);
    expect(new Set(cells.map((c) => c[1])).size).toBe(4);
    expect(new Set(cells.map((c) => c[2])).size).toBe(1);
    await expect(messages(page)).toHaveCount(1);
    await expect(messages(page).first()).toContainText('Soy Falco');
    expect(await page.evaluate(() => Object.values(window.gtlFalcoDemo).map((x) => x.a.length))).toEqual([5, 5, 5, 5, 5, 5, 5, 5]);
  });

  test('a question goes into the chat, Falco types, then gives one of its five answers', async ({ page }) => {
    await open(page);
    const data = await page.evaluate(() => window.gtlFalcoDemo);
    for (const [id, { q, a }] of Object.entries(data)) {
      await page.locator(`[data-falco-demo] [data-q="${id}"]`).click();
      await expect(page.locator('[data-falco-log] .fc-user').last()).toHaveText(clean(q));
      await expect(page.locator('[data-falco-log] .fc-typing')).toHaveCount(1);
      await expect(page.locator('[data-falco-log] .fc-typing')).toHaveCount(0);
      const said = clean(await messages(page).last().textContent());
      expect(a.map(clean), id).toContain(said);
    }
    // 1 greeting + 8 questions + 8 answers, and the page did not grow sideways.
    await expect(messages(page)).toHaveCount(17);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  });

  test('the same question never gets the same answer twice running, and a click while Falco types is ignored', async ({ page }) => {
    await open(page);
    let previous = null;
    for (let k = 0; k < 5; k++) {
      const said = await ask(page, 'taxes');
      expect(said).not.toBe(previous);
      expect(said).toMatch(/ejemplo/); // every tax answer says its dates are examples
      previous = said;
    }
    const count = await messages(page).count();
    // Two clicks in the same instant: the second lands while Falco is typing.
    await page.evaluate(() => {
      document.querySelector('[data-falco-demo] [data-q="sales"]').click();
      document.querySelector('[data-falco-demo] [data-q="unpaid"]').click();
    });
    await expect(page.locator('[data-falco-log] .fc-typing')).toHaveCount(0);
    await expect(messages(page)).toHaveCount(count + 2);
    await expect(page.locator('[data-falco-log] .fc-user').last()).toHaveText('¿Cuánto vendí esta semana?');
  });

  test('the chat scrolls inside its box: the newest message shows and the page does not move', async ({ page }) => {
    await open(page);
    await demo(page).scrollIntoViewIfNeeded();
    const height = await demo(page).evaluate((el) => el.getBoundingClientRect().height);
    for (const id of ['calendar', 'tomorrow', 'sales', 'unpaid', 'taxes']) await ask(page, id);
    // One more, asked from the page itself so that only the chat can move anything.
    const y = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => document.querySelector('[data-falco-demo] [data-q="top"]').click());
    await expect(messages(page)).toHaveCount(13);
    await expect(page.locator('[data-falco-log] .fc-typing')).toHaveCount(0);
    expect(await demo(page).evaluate((el) => el.getBoundingClientRect().height)).toBe(height);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    const log = await page.locator('[data-falco-log]').evaluate((el) => ({ over: el.scrollHeight > el.clientHeight, end: Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 2 }));
    expect(log).toEqual({ over: true, end: true });
  });

  test('in English the questions and every answer have their English, and a switch back restores the Spanish', async ({ page }) => {
    await open(page, '/?lang=en');
    expect(await page.evaluate(() => Object.values(window.gtlFalcoDemo).flatMap((x) => [x.q, ...x.a]).filter((t) => !window.gtlI18n.has(t)))).toEqual([]);
    await expect(demo(page).locator('h3')).toHaveText('Try it yourself');
    await expect(demo(page).locator('[data-q]').first()).toHaveText('How is my calendar today?');
    await expect(page.locator('[data-falco-log]')).toHaveAttribute('aria-label', 'Sample conversation with Falco');
    const said = await ask(page, 'calendar');
    await expect(page.locator('[data-falco-log] .fc-user').last()).toHaveText('How is my calendar today?');
    expect(said).not.toMatch(/citas|Hoy|Tienes/);
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
    await page.locator('[data-lang-current]').click();
    await page.locator('.lang-menu [data-lang="es"]').click();
    await expect(page.locator('[data-falco-log] .fc-user').last()).toHaveText('¿Cómo va mi calendario hoy?');
    expect(await page.evaluate(() => window.gtlFalcoDemo.calendar.a.map((t) => t.replace(/\s+/g, ' ').trim())))
      .toContain(clean(await messages(page).last().textContent()));
  });

  for (const width of [320, 390, 768]) {
    test(`at ${width} px the demo fits, the questions are easy to tap and nothing scrolls sideways`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, url, width);
        await ask(page, 'taxes');
        await ask(page, 'new');
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        for (const chip of await demo(page).locator('[data-q]').all()) {
          const box = await chip.boundingBox();
          expect(box.height, url).toBeGreaterThanOrEqual(39.9); // 40 px, less a rounding hair in Firefox
          expect(box.x + box.width, url).toBeLessThanOrEqual(width);
        }
      }
    });
  }

  test('works by keyboard, and axe finds no serious or critical violations after a few answers, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, url);
      await demo(page).locator('[data-q="friday"]').focus();
      await page.keyboard.press('Enter');
      await expect(messages(page)).toHaveCount(3);
      await ask(page, 'top');
      await expect(page.locator('[data-falco-log]')).toHaveAttribute('role', 'log');
      await page.evaluate(() => Promise.all(document.querySelector('[data-falco-demo]').getAnimations({ subtree: true }).map((a) => a.finished)));
      const r = await new AxeBuilder({ page }).include('[data-falco-demo]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
});

test.describe('Falco without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every message shows, and the bird stands still (there is no Pause button)', async ({ page }) => {
    await open(page);
    for (const s of await steps(page).all()) await expect(s).toBeVisible();
    expect(await section(page).locator('.falco-flight').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(section(page).locator('[data-falco-toggle]')).toBeHidden();
    // The demo chat needs the script, so it is not shown.
    await expect(page.locator('[data-falco-demo]')).toBeHidden();
  });
});
