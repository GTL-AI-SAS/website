import { test as base, expect, devices } from '@playwright/test';
import { mediaSite as createMediaSite } from './media-site.mjs';
const test = base.extend({ mediaSite: async ({}, use) => {
  const site = await createMediaSite();
  try { await use(site); } finally { await site.close(); }
}});
const position = (trigger) => trigger.evaluate((el) => {
  const video = el.querySelector('video.is-active');
  const fraction = video.ended || video.currentTime >= video.duration - 0.002 ? 1
    : video.currentTime <= 0.002 ? 0 : video.currentTime / video.duration;
  return video.dataset.direction === 'advance' ? fraction : 1 - fraction;
});

test('the first hover keeps its still cover until a video frame is presented', async ({ page }) => {
  await page.addInitScript(() => {
    const frames = new Map();
    let nextId = 0;
    HTMLVideoElement.prototype.requestVideoFrameCallback = function (callback) {
      const id = ++nextId;
      frames.set(id, { video: this, callback });
      return id;
    };
    HTMLVideoElement.prototype.cancelVideoFrameCallback = (id) => frames.delete(id);
    window.presentPendingVideoFrames = () => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(({ video, callback }) => callback(performance.now(), { mediaTime: video.currentTime }));
    };
    window.pendingVideoFrameCount = () => frames.size;
  });
  await page.goto('/');
  const trigger = page.locator('[data-brand-scrub]');
  const still = trigger.locator('img');
  await trigger.hover();
  await expect(trigger).toHaveClass(/is-ready/);
  await expect.poll(() => page.evaluate(() => window.pendingVideoFrameCount())).toBeGreaterThan(0);
  await expect(still).toBeVisible();
  await expect(trigger).not.toHaveClass(/has-video-frame/);
  await page.evaluate(() => window.presentPendingVideoFrames());
  await expect(still).toBeHidden();
  await expect(trigger).toHaveClass(/has-video-frame/);
});

test('touch controls work with an iPhone viewport in WebKit', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== 'webkit', 'iPhone emulation uses WebKit');
  const context = await browser.newContext({ ...devices['iPhone 13'], baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const trigger = page.locator('[data-brand-scrub]');
    await expect(trigger).not.toHaveClass(/is-ready/);
    await trigger.tap();
    await expect(trigger).toHaveClass(/is-ready/);
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.15);
    await expect(trigger.locator('img')).toBeHidden();
    await trigger.tap();
    await expect.poll(() => position(trigger)).toBe(0);
    for (const video of await trigger.locator('video').all()) await expect(video).toHaveJSProperty('paused', true);
  } finally { await context.close(); }
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
  await expect(page.locator('[data-brand-intro] source')).toHaveAttribute('src', /gtl-ai-holiday-lights\.mp4$/);
  await expect(page.locator('[data-brand-intro] video')).toHaveAttribute('poster', /holiday-lights\.png$/);
});

for (const leaveBeforeReady of [false, true]) {
  test(`cold loading preserves the latest pointer state (${leaveBeforeReady ? 'outside' : 'hovering'})`, async ({ page, mediaSite }) => {
    mediaSite.state.hold = true;
    await page.goto(mediaSite.url, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-brand-scrub]');
    const advance = trigger.locator('[data-direction="advance"]');
    const returning = trigger.locator('[data-direction="return"]');
    expect(mediaSite.state.requested.size).toBe(0);
    await trigger.hover();
    await expect.poll(() => mediaSite.state.requested.size).toBe(2);

    // Early attempts must not start a partially downloaded clip or lose the final intent.
    await trigger.hover();
    await page.mouse.move(0, 0);
    await trigger.hover();
    if (leaveBeforeReady) await page.mouse.move(0, 0);
    const sources = [...mediaSite.state.requested];
    mediaSite.release(sources[0]);
    await expect(trigger).not.toHaveClass(/is-ready/);
    await expect(trigger.locator('img')).toBeVisible();
    mediaSite.release(sources[1]);
    await expect(trigger).toHaveClass(/is-ready/);
    for (const video of [advance, returning]) {
      expect(await video.evaluate((el) => el.currentSrc)).toMatch(/\/assets\/branding\/.*\.mp4(?:\?rev=[a-f0-9]+)?$/);
    }

    if (leaveBeforeReady) {
      await expect(advance).toHaveJSProperty('paused', true);
      // Safari can preroll its paused clock within the first frame; the cover
      // must still show the exact initial image until playback presents a frame.
      await expect(trigger.locator('img')).toBeVisible();
      await expect(trigger).not.toHaveClass(/has-video-frame/);
      await trigger.hover();
    }
    await expect(advance).toHaveJSProperty('paused', false);
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.15);
    await expect(trigger).toHaveClass(/has-video-frame/);
    await expect(trigger.locator('img')).toBeHidden();
    await returning.evaluate(video => {
      video.returnPlaybackObserved = false;
      video.addEventListener('playing', () => { video.returnPlaybackObserved = true; }, { once: true });
    });
    await page.mouse.move(0, 0);
    await expect(returning).toHaveClass(/is-active/);
    // The short return may finish before the next assertion is scheduled.
    await expect(returning).toHaveJSProperty('returnPlaybackObserved', true);
    await expect.poll(() => position(trigger), { timeout: 6000 }).toBe(0);

    // Further interactions reuse the same two native video sources.
    await trigger.hover();
    await expect.poll(() => position(trigger)).toBeGreaterThan(0.15);
    await page.mouse.move(0, 0);
    await expect.poll(() => position(trigger), { timeout: 6000 }).toBe(0);
    expect(mediaSite.state.requested.size).toBe(2);
  });
}

test('a failed initial download can retry on the next hover', async ({ page, mediaSite }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mediaSite.state.failReturn = true;
  await page.goto(mediaSite.url);
  const trigger = page.locator('[data-brand-scrub]');
  await expect(trigger).not.toHaveClass(/is-ready/);
  await expect(trigger.locator('img')).toBeVisible();
  await trigger.hover();
  await expect.poll(() => mediaSite.state.returnFailures).toBe(1);
  // Safari may retry a failed byte-range request itself. Otherwise retry by hover.
  await expect(trigger).not.toHaveAttribute('aria-busy', 'true');
  await page.mouse.move(0, 0);
  await trigger.hover();
  await expect(trigger).toHaveClass(/is-ready/);
  await expect(trigger.locator('[data-direction="advance"]')).toHaveJSProperty('paused', false);
  expect(mediaSite.state.returnFailures).toBe(1);
  expect(errors).toEqual([]);
});

for (const destination of ['return', 'advance']) {
  test(`a switch within a millisecond of the endpoint never restarts the ${destination} clip`, async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-brand-scrub]');
    await trigger.hover();
    await expect(trigger).toHaveClass(/is-ready/);
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
      // Ignore unrelated blur/focus events while staging this exact boundary condition.
      el.dispatchEvent(new PointerEvent(destination === 'return' ? 'pointerleave' : 'pointerenter', { pointerType: 'mouse' }));
    }, destination);

    // A media clock rounded to the endpoint may hold the outgoing frame instead
    // of switching clips. Neither case may restart playback from the other end.
    await expect.poll(() => position(trigger)).toBe(destination === 'return' ? 0 : 1);
    for (const video of await trigger.locator('video').all()) await expect(video).toHaveJSProperty('paused', true);
  });
}

test('rapid pointer changes preserve continuous progress and finish at rest', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[data-brand-scrub]');
  await trigger.hover();
  await expect(trigger).toHaveClass(/is-ready/);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.evaluate((el) => {
    const videos = [...el.querySelectorAll('video')];
    const duration = Math.min(...videos.map(video => video.duration));
    const jumps = [];
    let previous;
    let stopped = false;
    const callbacks = new Map();
    function nextFrame(video, callback) {
      if (typeof video.requestVideoFrameCallback === 'function') {
        return video.requestVideoFrameCallback(callback);
      }
      // The Windows WebKit test port lacks frame callbacks. Sample running
      // clocks there, excluding the endpoint transition; a real restart still
      // fails continuity as soon as its next non-endpoint frame is shown.
      return requestAnimationFrame(time => {
        if (!video.paused && !video.seeking && video.currentTime > 0.002 && video.currentTime < video.duration - 0.04) {
          callback(time, { mediaTime: video.currentTime });
        } else if (!stopped) callbacks.set(video, nextFrame(video, callback));
      });
    }
    function sample(video) {
      callbacks.set(video, nextFrame(video, (time, metadata) => {
        // Check frames actually presented, not WebKit/Firefox's rounded or
        // transient currentTime values at end-of-stream and during seeking.
        if (video.classList.contains('is-active') && !video.seeking) {
          const fraction = Math.max(0, Math.min(1, metadata.mediaTime / video.duration));
          const current = { time, position: video.dataset.direction === 'advance' ? fraction : 1 - fraction };
          if (previous) {
            const allowed = (current.time - previous.time) / 1000 / duration + 0.03;
            if (Math.abs(current.position - previous.position) > allowed) jumps.push({ previous, current });
          }
          previous = current;
        }
        if (!stopped) sample(video);
      }));
    }
    videos.forEach(sample);
    el.stopSampling = () => {
      stopped = true;
      callbacks.forEach((id, video) => typeof video.cancelVideoFrameCallback === 'function'
        ? video.cancelVideoFrameCallback(id) : cancelAnimationFrame(id));
      return jumps;
    };
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
