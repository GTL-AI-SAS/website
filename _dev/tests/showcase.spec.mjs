import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

const FEATURES = [
  ['landing', 'Página web y SEO'],
  ['calendar', 'Agenda'],
  ['booking', 'Reservas en línea'],
  ['sales', 'Ventas y pagos'],
  ['finance', 'Finanzas y contabilidad'],
  ['messages', 'Llamadas y mensajes'],
];
const SHOWCASE_JS_URL = /\/showcase\.js(\?.*)?$/;
const T0 = new Date('2026-11-10T10:00:00');

// Most tests drive the tour by hand, so they pause its autoplay first (the button sits below the screens).
async function open(page, width = 1440, { pause = true } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await waitForFonts(page);
  if (pause) {
    await page.locator('[data-showcase-toggle]').click();
    await expect(page.locator('[data-showcase-toggle]')).toHaveText('Reanudar recorrido');
    // Instantly: the page scrolls smoothly, and boxes measured mid-scroll would be stale.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }
}

const tour = (page) => page.locator('#features');

// The finite animations: the hero underline, the Get in Touch arc and parts of the landing page loop forever.
const settleAnimations = (page) => page.evaluate(() => Promise.all(document.querySelector('#features').getAnimations({ subtree: true })
  .filter((a) => a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished)));

// The selected slide has finished moving once its centre is the stage's centre.
async function expectCentered(page, code) {
  await expect.poll(() => page.evaluate((id) => {
    const slide = document.getElementById(id).getBoundingClientRect();
    const stage = document.querySelector('[data-showcase-stage]').getBoundingClientRect();
    return Math.round(Math.abs((slide.left + slide.width / 2) - (stage.left + stage.width / 2)));
  }, `feature-${code}`)).toBeLessThanOrEqual(1);
}

async function expectSelected(page, code, { centered = true } = {}) {
  const index = FEATURES.findIndex(([c]) => c === code);
  for (const [i, [c]] of FEATURES.entries()) {
    await expect(page.locator(`#feature-tab-${c}`)).toHaveAttribute('aria-selected', i === index ? 'true' : 'false');
    await expect(page.locator(`#feature-tab-${c}`)).toHaveAttribute('tabindex', i === index ? '0' : '-1');
    expect(await page.locator(`#feature-${c}`).evaluate((el) => el.inert), c).toBe(i !== index);
  }
  if (centered) await expectCentered(page, code);
}

// How far the countdown has filled a tab, from 0 to 1.
const fillOf = (page, code) => page.locator(`#feature-tab-${code}`)
  .evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')) || 0);

// What each screen's demo has done by its end: the elements it changes, as they are when it has played.
const DEMO_ENDS = {
  calendar: ['.m-ev-laura.is-moved', '.m-ev-daniel.is-cancel', '.m-cal-next.is-on', '.m-date .m-long[data-show="1"]'],
  booking: ['.m-book-staff > .is-on:nth-child(2)', '.m-book-days > .is-on:nth-child(4)', '.m-book-pm > .is-on:nth-child(3)', '.m-booked.is-on'],
  sales: ['.m-filter.is-set', '.m-tlist--fisio.is-on'],
  finance: ['.m-fin-seg > .is-on:nth-child(3)', '.m-plot.is-y'],
  messages: ['.m-convs.is-new', '.m-msg--ask.is-on', '.m-msg--reply.is-on'],
};

test.describe('feature tour', () => {
  test('replaces About after the hero, and the "Features" link reaches it', async ({ page }) => {
    await open(page);
    await expect(page.locator('#about')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'About GTL AI' })).toHaveCount(0);
    expect(await page.evaluate(() => document.querySelector('.hero').nextElementSibling.id)).toBe('features');
    await page.locator('.nav a[href="#features"]').click();
    await expect(page).toHaveURL(/#features$/);
    await expect(page.locator('#features [role="tablist"]')).toBeInViewport();
  });

  test('six tabs in order, Landing page & SEO first, one screen available to assistive technology', async ({ page }) => {
    await open(page);
    const list = tour(page).getByRole('tablist', { name: 'Funciones' });
    await expect(list.getByRole('tab')).toHaveText(FEATURES.map(([, name]) => name));
    for (const [code] of FEATURES) {
      await expect(page.locator(`#feature-tab-${code}`)).toHaveAttribute('aria-controls', `feature-${code}`);
      await expect(page.locator(`#feature-${code}`)).toHaveAttribute('aria-labelledby', `feature-tab-${code}`);
    }
    await expect(tour(page).getByRole('tabpanel')).toHaveCount(1);
    await expect(tour(page).getByRole('tabpanel')).toHaveAttribute('id', 'feature-landing');
    await expectSelected(page, 'landing');
  });

  test('a click on each tab slides its screen to the middle and marks the tab; its caption is for screen readers only', async ({ page }) => {
    await open(page);
    for (const [code, name] of [...FEATURES.slice(1), FEATURES[0]]) {
      await tour(page).getByRole('tab', { name }).click();
      await expectSelected(page, code);
      await expect(tour(page).getByRole('tabpanel')).toHaveAttribute('id', `feature-${code}`);
      await expect(tour(page).getByRole('tabpanel').getByRole('heading', { level: 3 })).toHaveCount(1);
      const box = await page.locator(`#feature-${code} .showcase-caption`).boundingBox();
      expect(box.width * box.height, code).toBeLessThanOrEqual(1);
      await expect(tour(page).locator('.showcase-tab.is-active')).toHaveAttribute('id', `feature-tab-${code}`);
    }
  });

  test('the photos on the screens load from the site itself', async ({ page }) => {
    await open(page);
    const photos = tour(page).locator('img');
    await expect(photos).toHaveCount(5);
    expect(await photos.evaluateAll((els) => els.every((i) => new URL(i.src).origin === location.origin))).toBe(true);
    await expect.poll(() => photos.evaluateAll((els) => els.every((i) => i.complete && i.naturalWidth > 0))).toBe(true);
  });

  test('arrow keys, Home and End move, select and wrap around (automatic activation)', async ({ page }) => {
    await open(page);
    const focused = () => page.evaluate(() => document.activeElement.id);
    await page.locator('#feature-tab-landing').focus();
    await page.keyboard.press('ArrowLeft');
    await expectSelected(page, 'messages');
    expect(await focused()).toBe('feature-tab-messages');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, 'landing');
    await page.keyboard.press('End');
    await expectSelected(page, 'messages');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, 'booking');
    expect(await focused()).toBe('feature-tab-booking');
  });

  test('the neighbours peek on both sides and a click on one brings it to the middle', async ({ page }) => {
    await open(page);
    const width = page.viewportSize().width;
    const active = await page.locator('#feature-landing').boundingBox();
    // The loop: Calls & texts waits on the left of the landing page, Calendar on the right.
    const left = await page.locator('#feature-messages').boundingBox();
    const right = await page.locator('#feature-calendar').boundingBox();
    expect(left.x + left.width).toBeGreaterThan(40);
    expect(left.x + left.width).toBeLessThan(active.x);
    expect(right.x).toBeGreaterThan(active.x + active.width);
    expect(right.x).toBeLessThan(width - 40);
    const y = active.y + 120;
    await page.mouse.click(right.x + 20, y);
    await expectSelected(page, 'calendar');
    await settleAnimations(page);
    const now = await page.locator('#feature-landing').boundingBox();
    await page.mouse.click(now.x + now.width - 20, y);
    await expectSelected(page, 'landing');
  });

  test('a horizontal swipe moves one screen; a vertical drag does not', async ({ page }) => {
    await open(page, 390);
    const swipe = (dx, dy) => page.evaluate(([dx, dy]) => {
      const stage = document.querySelector('[data-showcase-stage]');
      const r = stage.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + 100;
      const at = (type, cx, cy) => stage.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: cx, clientY: cy }));
      at('pointerdown', x, y);
      at('pointerup', x + dx, y + dy);
    }, [dx, dy]);
    await swipe(-120, 10);
    await expectSelected(page, 'calendar');
    await swipe(10, -140);
    await expectSelected(page, 'calendar');
    await swipe(120, 0);
    await expectSelected(page, 'landing');
  });

  for (const width of [360, 390, 768, 1440]) {
    test(`no horizontal scroll and no screen spills out of its frame at ${width} px, in every tab`, async ({ page }) => {
      await open(page, width);
      for (const [code, name] of FEATURES) {
        await tour(page).getByRole('tab', { name }).click();
        await expectSelected(page, code);
        await settleAnimations(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), code).toBeLessThanOrEqual(width);
        const spill = await page.locator(`#feature-${code} .mock`).evaluate((mock) => {
          const frame = mock.getBoundingClientRect();
          return mock.scrollWidth > mock.clientWidth + 1 || mock.scrollHeight > mock.clientHeight + 1 || frame.height < 100;
        });
        expect(spill, code).toBe(false);
      }
    });
  }

  test('axe finds no serious or critical violations in the section, in every tab', async ({ page }) => {
    await open(page);
    for (const [code, name] of FEATURES) {
      await tour(page).getByRole('tab', { name }).click();
      await expectSelected(page, code);
      await settleAnimations(page);
      const r = await new AxeBuilder({ page }).include('#features').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${code} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
});

// The countdown runs on requestAnimationFrame, so a fake clock makes it exact.
test.describe('feature tour autoplay', () => {
  async function openOnClock(page, width = 1440) {
    await page.clock.install({ time: T0 });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
    // Restart the countdown on the first tab from a known moment, then take the mouse off the tour.
    await page.locator('#feature-tab-landing').click();
    await page.mouse.move(2, 2);
  }

  test('the selected tab fills over the turn of its screen, and the next screen slides in when the fill reaches the end', async ({ page }) => {
    test.setTimeout(90_000);
    await openOnClock(page);
    await expect(page.locator('[data-showcase-toggle]')).toHaveText('Pausar recorrido');
    const turns = await tour(page).locator('[data-feature]').evaluateAll((els) => els.map((e) => Number(e.dataset.duration)));
    expect(turns.every((t) => t >= 5000 && t <= 9000)).toBe(true);
    const selected = () => page.evaluate(() => document.querySelector('#features [aria-selected="true"]').id.replace('feature-tab-', ''));
    await page.clock.runFor(1000);
    // All the way round the loop: each fill grows in step with the clock, then the next tab takes over.
    for (const [i, [code]] of FEATURES.entries()) {
      const [next] = FEATURES[(i + 1) % FEATURES.length];
      expect(await fillOf(page, code), code).toBeCloseTo(1000 / turns[i], 1);
      await page.clock.runFor(turns[i] / 2 - 1000);
      expect(await fillOf(page, code), code).toBeCloseTo(0.5, 1);
      await page.clock.runFor(turns[i] / 2 - 300);
      expect(await selected(), code).toBe(code);
      expect(await fillOf(page, code), code).toBeGreaterThan(0.9);
      let waited = turns[i] - 300;
      while ((await selected()) !== next) {
        expect(waited, `waiting for ${next}`).toBeLessThan(turns[i] + 500);
        await page.clock.runFor(100);
        waited += 100;
      }
      await expectSelected(page, next, { centered: false });
      expect(await fillOf(page, code), code).toBe(0);
      await page.clock.runFor(1000 - (waited - turns[i]));
    }
  });

  test('each screen plays its demo while it is selected, and is put back once it has left', async ({ page }) => {
    test.setTimeout(60_000);
    await openOnClock(page);
    for (const [code, ends] of Object.entries(DEMO_ENDS)) {
      // The click leaves the mouse on the tabs: the countdown holds, the demo plays on.
      await page.locator(`#feature-tab-${code}`).click();
      for (const end of ends) await expect(page.locator(`#feature-${code} ${end}`), `${code} ${end}`).toHaveCount(0);
      await page.clock.runFor(7000);
      await expectSelected(page, code, { centered: false });
      for (const end of ends) await expect(page.locator(`#feature-${code} ${end}`), `${code} ${end}`).toHaveCount(1);
      await expect(page.locator(`#feature-${code} .m-cursor`)).toHaveCount(1);
    }
    await page.locator('#feature-tab-landing').click();
    await page.clock.runFor(1000);
    for (const [code, ends] of Object.entries(DEMO_ENDS)) {
      for (const end of ends) await expect(page.locator(`#feature-${code} ${end}`), `${code} ${end}`).toHaveCount(0);
      await expect(page.locator(`#feature-${code} [data-show]:not([data-show="0"])`)).toHaveCount(0);
    }
  });

  test('a finished demo plays again while the countdown is held', async ({ page }) => {
    await openOnClock(page);
    await page.locator('#feature-tab-booking').click();
    await page.clock.runFor(7000);
    await expect(page.locator('#feature-booking .m-booked.is-on')).toHaveCount(1);
    // Its turn (6.5 s) and a pause after it: then the screen is put back and it starts over.
    await page.clock.runFor(2600);
    await expect(page.locator('#feature-booking .m-booked.is-on')).toHaveCount(0);
    await page.clock.runFor(4000);
    await expect(page.locator('#feature-booking .m-booked.is-on')).toHaveCount(1);
    await expectSelected(page, 'booking', { centered: false });
  });

  for (const width of [390, 1440]) {
    test(`every demo ends inside its frame at ${width} px${width === 1440 ? ', and axe finds no serious or critical violations' : ''}`, async ({ page }) => {
      test.setTimeout(90_000);
      await openOnClock(page, width);
      for (const code of Object.keys(DEMO_ENDS)) {
        await page.locator(`#feature-tab-${code}`).click();
        await page.clock.runFor(7000);
        // The transitions run on the real clock.
        await settleAnimations(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), code).toBeLessThanOrEqual(width);
        const spill = await page.locator(`#feature-${code} .mock`).evaluate((mock) => mock.scrollWidth > mock.clientWidth + 1 || mock.scrollHeight > mock.clientHeight + 1);
        expect(spill, code).toBe(false);
        if (width !== 1440) continue;
        // axe needs timers, so the clock runs while it checks; Pause holds the screen as it is meanwhile.
        const toggle = page.locator('[data-showcase-toggle]');
        await toggle.click();
        await page.clock.resume();
        const r = await new AxeBuilder({ page }).include('#features').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        await expect(page.locator(`#feature-${code} ${DEMO_ENDS[code].at(-1)}`)).toHaveCount(1);
        await toggle.click();
        const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
        expect(bad.map((v) => `${code} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
      }
    });
  }

  test('Pause holds the tour, the fill and the demo on the screen until Play', async ({ page }) => {
    await openOnClock(page);
    const toggle = page.locator('[data-showcase-toggle]');
    await page.clock.runFor(2000);
    await toggle.click();
    await expect(toggle).toHaveText('Reanudar recorrido');
    await expect(tour(page)).toHaveClass(/is-paused/);
    const fill = await fillOf(page, 'landing');
    expect(fill).toBeCloseTo(2000 / 6000, 1);
    await page.clock.runFor(15_000);
    await expectSelected(page, 'landing', { centered: false });
    expect(await fillOf(page, 'landing')).toBe(fill);
    await toggle.click();
    await expect(toggle).toHaveText('Pausar recorrido');
    await expect(tour(page)).not.toHaveClass(/is-paused/);
    await page.clock.runFor(4100);
    await expectSelected(page, 'calendar', { centered: false });

    // The calendar's demo stops where it is, and goes on from there.
    await page.clock.runFor(2000);
    await expect(page.locator('#feature-calendar .m-ev-laura.is-lift')).toHaveCount(1);
    await toggle.click();
    const state = () => page.locator('#feature-calendar .mock').evaluate((m) => m.innerHTML);
    const before = await state();
    await page.clock.runFor(10_000);
    expect(await state()).toBe(before);
    await expectSelected(page, 'calendar', { centered: false });
    await toggle.click();
    await page.clock.runFor(1000);
    await expect(page.locator('#feature-calendar .m-ev-laura.is-moved')).toHaveCount(1);
  });

  test('a mouse over the selected screen holds the tour; moving away lets it go on', async ({ page }) => {
    await openOnClock(page);
    const box = await page.locator('#feature-landing .mock').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.clock.runFor(15_000);
    await expectSelected(page, 'landing', { centered: false });
    expect(await fillOf(page, 'landing')).toBe(0);
    await page.mouse.move(2, 2);
    await page.clock.runFor(6100);
    await expectSelected(page, 'calendar', { centered: false });
  });

  test('in the tab row only a button holds the tour; the space beside and between the buttons does not', async ({ page }) => {
    test.setTimeout(90_000);
    await openOnClock(page);
    const first = await page.locator('#feature-tab-landing').boundingBox();
    const second = await page.locator('#feature-tab-calendar').boundingBox();
    const y = first.y + first.height / 2;
    // Between the first two buttons, then beside the first: the fill goes on and the next screen comes in.
    await page.mouse.move((first.x + first.width + second.x) / 2, y);
    await page.clock.runFor(3000);
    expect(await fillOf(page, 'landing')).toBeCloseTo(0.5, 1);
    await page.mouse.move(first.x - 12, y);
    await page.clock.runFor(3100);
    await expectSelected(page, 'calendar', { centered: false });
    // On a button it holds, wherever the selected tab is, for longer than the calendar's whole turn.
    await page.mouse.move(first.x + first.width / 2, y);
    const fill = await fillOf(page, 'calendar');
    await page.clock.runFor(9000);
    await expectSelected(page, 'calendar', { centered: false });
    expect(await fillOf(page, 'calendar')).toBe(fill);
    await page.mouse.move(first.x - 12, y);
    await page.clock.runFor(8000);
    await expectSelected(page, 'booking', { centered: false });
  });

  test('keyboard focus on the tabs holds the tour', async ({ page }) => {
    await openOnClock(page);
    await page.locator('.hero .btn-ghost').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.id)).toBe('feature-tab-landing');
    await page.clock.runFor(15_000);
    await expectSelected(page, 'landing', { centered: false });
    // Tab moves on to the Pause button: focus has left the tabs.
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-showcase-toggle]')).toBeFocused();
    await page.clock.runFor(6100);
    await expectSelected(page, 'calendar', { centered: false });
  });

  test('scrolled out of view the tour waits, and goes on when it comes back', async ({ page }) => {
    await openOnClock(page);
    await page.locator('#team').scrollIntoViewIfNeeded();
    await expect.poll(async () => { await page.clock.runFor(50); return page.evaluate(() => window.scrollY > 1500); }).toBe(true);
    await page.waitForTimeout(300);
    await page.clock.runFor(15_000);
    await expectSelected(page, 'landing', { centered: false });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.clock.runFor(6100);
    await expectSelected(page, 'calendar', { centered: false });
  });

  test('with reduced motion the tour starts paused and the screens play no demos, even once it plays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openOnClock(page);
    const toggle = page.locator('[data-showcase-toggle]');
    await expect(toggle).toHaveText('Reanudar recorrido');
    await page.clock.runFor(15_000);
    await expectSelected(page, 'landing', { centered: false });
    expect(await fillOf(page, 'landing')).toBe(0);
    await page.locator('#feature-tab-calendar').click();
    await page.clock.runFor(7000);
    await toggle.click();
    await page.clock.runFor(7000);
    await expectSelected(page, 'calendar', { centered: false });
    expect(await fillOf(page, 'calendar')).toBeCloseTo(7000 / 8000, 1);
    await expect(tour(page).locator('.m-cursor')).toHaveCount(0);
    await expect(tour(page).locator('.mock [data-show]')).toHaveCount(0);
    await expect(page.locator('#feature-calendar .m-ev-laura')).toHaveAttribute('class', 'm-ev m-ev--fisio m-ev-laura');
  });
});

test.describe('Get in Touch', () => {
  test('a bright arc runs round its border; with reduced motion it is the plain Menta ring', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('.site-header .nav-cta');
    expect(await cta.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('cta-spin');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await cta.evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
    expect(await cta.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(110, 231, 200)');
  });
});

test.describe('feature tour without its script', () => {
  test.use({ javaScriptEnabled: false });

  test('without JavaScript every screen is listed with its name and caption, and there are no tabs or pause button', async ({ page }) => {
    await open(page, 1440, { pause: false });
    await expect(tour(page).locator('.showcase-tabs')).toBeHidden();
    await expect(tour(page).locator('[data-showcase-toggle]')).toBeHidden();
    await expect(tour(page).locator('[role="tablist"]')).toHaveCount(0);
    for (const [code, name] of FEATURES) {
      await expect(page.locator(`#feature-${code} .showcase-kicker`)).toHaveText(name);
      await expect(page.locator(`#feature-${code} .showcase-caption h3`)).toBeVisible();
      await expect(page.locator(`#feature-${code} .mock`)).toBeVisible();
    }
    const tops = await page.locator('.showcase-slide').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(FEATURES.length);
  });
});

test('if showcase.js fails to load, every screen is listed and the request form still opens', async ({ page, context }) => {
  await context.route(SHOWCASE_JS_URL, (r) => r.abort());
  await open(page, 1440, { pause: false });
  await expect(tour(page).locator('.showcase-tabs')).toBeHidden();
  await expect(tour(page).locator('[data-showcase-toggle]')).toBeHidden();
  for (const [code] of FEATURES) await expect(page.locator(`#feature-${code} .showcase-caption h3`)).toBeVisible();
  await page.locator('#contact a[data-request]').click();
  await expect(page.locator('#request-dialog')).toBeVisible();
});
