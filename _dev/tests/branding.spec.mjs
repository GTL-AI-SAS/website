import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const CLIPS = /\/assets\/branding\/ezgif-gtl-ai-sticker-1-yume(?:-reverse)?\.mp4$/;
const clipPath = (url) => fileURLToPath(new URL(`../../assets/branding/${decodeURIComponent(new URL(url).pathname.split('/').pop())}`, import.meta.url));
const position = (trigger) => trigger.evaluate((el) => {
  const video = el.querySelector('video.is-active');
  return video.dataset.direction === 'advance'
    ? video.currentTime / video.duration
    : 1 - video.currentTime / video.duration;
});

test('the More from our brand section is removed and December chooses a holiday intro', async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    class DecemberDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [2026, 11, 1])); }
      static now() { return new RealDate(2026, 11, 1).getTime(); }
    }
    Object.defineProperty(DecemberDate, 'parse', { value: RealDate.parse });
    Object.defineProperty(DecemberDate, 'UTC', { value: RealDate.UTC });
    window.Date = DecemberDate;
    Math.random = () => 0.99;
  });
  await page.goto('/');
  await expect(page.getByText('More from our brand', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-brand-intro] source')).toHaveAttribute('src', /gtl-ai-navidad-luces-1080p\.mp4$/);
  await expect(page.locator('[data-brand-intro] video')).toHaveAttribute('poster', /holiday-lights\.png$/);
});

for (const leaveBeforeReady of [false, true]) {
  test(`cold loading preserves the latest pointer state (${leaveBeforeReady ? 'outside' : 'hovering'})`, async ({ page }) => {
    const pending = [];
    const requests = [];
    await page.route(CLIPS, (route) => {
      requests.push(route.request().url());
      return new Promise((resolve) => pending.push(async () => {
        await route.fulfill({ path: clipPath(route.request().url()), contentType: 'video/mp4' });
        resolve();
      }));
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-brand-scrub]');
    const advance = trigger.locator('[data-direction="advance"]');
    const returning = trigger.locator('[data-direction="return"]');
    await expect.poll(() => pending.length).toBe(2);

    // Early attempts must not start a partially downloaded clip or lose the final intent.
    await trigger.hover();
    await page.mouse.move(0, 0);
    await trigger.hover();
    if (leaveBeforeReady) await page.mouse.move(0, 0);
    await pending[0]();
    await expect(trigger).not.toHaveClass(/is-ready/);
    await expect(trigger.locator('img')).toBeVisible();
    await pending[1]();
    await expect(trigger).toHaveClass(/is-ready/);
    for (const video of [advance, returning]) {
      expect(await video.evaluate((el) => el.currentSrc)).toMatch(/^blob:/);
    }

    if (leaveBeforeReady) {
      await expect(advance).toHaveJSProperty('paused', true);
      expect(await position(trigger)).toBe(0);
      await trigger.hover();
    }
    await expect(advance).toHaveJSProperty('paused', false);
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.15);
    await page.mouse.move(0, 0);
    await expect(returning).toHaveClass(/is-active/);
    await expect(returning).toHaveJSProperty('paused', false);
    await expect.poll(() => position(trigger), { timeout: 6000 }).toBe(0);

    // Once ready, neither direction may need another HTTP range request.
    await trigger.hover();
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.15);
    await page.mouse.move(0, 0);
    await expect.poll(() => position(trigger), { timeout: 6000 }).toBe(0);
    expect(requests).toHaveLength(2);
  });
}

test('a failed initial download can retry on the next hover', async ({ page }) => {
  let returnRequests = 0;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(CLIPS, async (route) => {
    if (!route.request().url().includes('-reverse.mp4') && ++returnRequests === 1) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({ path: clipPath(route.request().url()), contentType: 'video/mp4' });
  });
  await page.goto('/');
  const trigger = page.locator('[data-brand-scrub]');
  await expect(trigger).not.toHaveClass(/is-ready/);
  await expect(trigger.locator('img')).toBeVisible();
  await trigger.hover();
  await expect(trigger).toHaveClass(/is-ready/);
  await expect(trigger.locator('[data-direction="advance"]')).toHaveJSProperty('paused', false);
  expect(returnRequests).toBe(2);
  expect(errors).toEqual([]);
});

for (const destination of ['return', 'advance']) {
  test(`a switch within a millisecond of the endpoint never restarts the ${destination} clip`, async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-brand-scrub]');
    await expect(trigger).toHaveClass(/is-ready/);
    await trigger.hover();
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.1);
    if (destination === 'advance') {
      await page.mouse.move(0, 0);
      await expect(trigger.locator('[data-direction="return"]')).toHaveClass(/is-active/);
    }

    // Recreate the sub-millisecond enter/leave timing deterministically. The other
    // clip is already at its end, as it would be after completing an earlier cycle.
    await trigger.evaluate(async (el, destination) => {
      const active = el.querySelector('video.is-active');
      const target = el.querySelector(`[data-direction="${destination}"]`);
      for (const video of el.querySelectorAll('video')) video.pause();
      const seek = (video, time) => new Promise((resolve) => {
        video.addEventListener('seeked', resolve, { once: true });
        video.currentTime = time;
      });
      await seek(active, 0.0005);
      await seek(target, target.duration);
    }, destination);

    if (destination === 'return') await page.mouse.move(0, 0);
    else await trigger.hover();
    const target = trigger.locator(`[data-direction="${destination}"]`);
    await expect(target).toHaveClass(/is-active/);
    await expect.poll(() => target.evaluate((video) => video.duration - video.currentTime), { timeout: 1000 }).toBeLessThan(0.002);
    await expect(target).toHaveJSProperty('paused', true, { timeout: 1000 });
  });
}

test('rapid pointer changes preserve continuous progress and finish at rest', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[data-brand-scrub]');
  await expect(trigger).toHaveClass(/is-ready/);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.evaluate((el) => {
    const read = () => {
      const video = el.querySelector('video.is-active');
      return {
        time: performance.now(),
        position: video.dataset.direction === 'advance'
          ? video.currentTime / video.duration : 1 - video.currentTime / video.duration,
      };
    };
    const duration = Math.min(...Array.from(el.querySelectorAll('video'), (video) => video.duration));
    const jumps = [];
    let previous = read();
    let frame;
    function sample() {
      const current = read();
      const allowed = (current.time - previous.time) / 1000 / duration + 0.03;
      if (Math.abs(current.position - previous.position) > allowed) jumps.push({ previous, current });
      previous = current;
      frame = requestAnimationFrame(sample);
    }
    frame = requestAnimationFrame(sample);
    el.stopSampling = () => { cancelAnimationFrame(frame); return jumps; };
  });
  const box = await trigger.boundingBox();
  for (let i = 0; i < 60; i++) {
    const inside = i % 2 === 0;
    await page.mouse.move(inside ? box.x + box.width / 2 : 0, inside ? box.y + box.height / 2 : 0);
    if (i % 3 === 0) await page.waitForTimeout((i % 5) * 7);
  }
  await page.mouse.move(0, 0);
  await expect.poll(() => position(trigger), { timeout: 6000 }).toBe(0);
  expect(await trigger.evaluate((el) => el.stopSampling())).toEqual([]);
  await expect(trigger.locator('video.is-active')).toHaveCount(1);
  for (const video of await trigger.locator('video').all()) await expect(video).toHaveJSProperty('paused', true);
});
