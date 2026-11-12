import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// The page as a whole, since the plans section was retired (each offer is now tailored): the order of the sections,
// the header, no layout shift on load and no sideways scroll at any width.
async function open(page, width = 1440, url = '/') {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

test.describe('page layout', () => {
  test('the sections come in order, the plans live on their own page, and the header links reach their sections', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || s.className)))
      .toEqual(['hero', 'features', 'clients', 'stories', 'falco', 'team', 'contact']);
    await expect(page.locator('#planes')).toHaveCount(0);
    await expect(page.locator('a[href$="#planes"]')).toHaveCount(0);
    // The plans are on precios.html; the home page only has one line that points there.
    await expect(page.locator('.pricing, .tier-card, .price-amount, .pr-tier')).toHaveCount(0);
    await expect(page.getByText('Planes y precios')).toHaveCount(0);
    await expect(page.locator('.price-strip a')).toHaveAttribute('href', 'precios.html');
    const nav = await page.locator('.nav a').allInnerTexts();
    expect(nav.map((t) => t.trim())).toEqual(['Funciones', 'Historias de clientes', 'Falco · Recepcionista IA', 'Precios', 'Nosotros', 'Contáctenos']);
    for (const [href, target] of [['#features', '#features'], ['#stories', '#stories-title'], ['#falco', '#falco-title'], ['#team', '#team-title'], ['#contact', '#contact-title']]) {
      await page.locator(`.nav a[href="${href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(target)).toBeInViewport();
    }
  });

  test('the header shortens its labels below 1100 px and drops links as it narrows; Falco flows in the brand gradient', async ({ page }) => {
    const shown = async (width, url = '/') => {
      await open(page, width, url);
      return (await page.locator('.nav a').evaluateAll((els) => els.filter((a) => a.offsetParent).map((a) => a.innerText.trim())));
    };
    expect(await shown(1099)).toEqual(['Funciones', 'Historias', 'Falco IA', 'Precios', 'Nosotros', 'Contáctenos']);
    expect(await shown(800)).toEqual(['Funciones', 'Falco IA', 'Precios', 'Nosotros', 'Contáctenos']);
    expect(await shown(500)).toEqual(['Funciones', 'Falco IA', 'Precios', 'Contáctenos']);
    expect(await shown(390)).toEqual(['Falco IA', 'Precios', 'Contáctenos']);
    expect(await shown(320)).toEqual(['Precios', 'Contáctenos']);
    expect(await shown(1440, '/?lang=en')).toEqual(['Features', 'Customer stories', 'Falco · AI Receptionist', 'Pricing', 'About us', 'Get in Touch']);
    const falco = page.locator('.nav .nav-falco');
    expect(await falco.evaluate((el) => getComputedStyle(el).animationName)).toBe('dream-flow');
    expect(await falco.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await falco.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });

  test('under the founders, the story of the logo: the clip, what the character means and our vision', async ({ page }) => {
    await open(page);
    const story = page.locator('#team [data-logo-story]');
    // After the founders' cards.
    expect(await page.evaluate(() => {
      const grid = document.querySelector('#team .team-grid');
      return !!(grid.compareDocumentPosition(document.querySelector('[data-logo-story]')) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    const video = story.locator('video');
    await expect(video.locator('source')).toHaveAttribute('src', 'assets/branding/gtl-ai-logo-historia.mp4');
    await expect(video).toHaveAttribute('poster', 'assets/branding/gtl-ai-logo-historia.webp');
    await expect(video).toHaveAttribute('aria-label', /el carácter 夢, que significa sueño/);
    expect(await video.evaluate((v) => ({ muted: v.muted, inline: v.hasAttribute('playsinline'), controls: v.controls, loop: v.loop })))
      .toEqual({ muted: true, inline: true, controls: false, loop: false });
    await expect(story.locator('[data-logo-replay]')).toHaveText('Reproducir animación');
    await expect(story.locator('h3')).toHaveText('夢 significa «sueño»');
    await expect(story.locator('.logo-story-text')).toContainText('Este carácter chino significa «sueño»');
    await expect(story.locator('.logo-story-text')).toContainText('Nosotros nos encargamos de la parte técnica, financiera y operativa, mientras usted se enfoca en su negocio y en lo que mejor hace.');
    await expect(story.locator('.logo-story-text')).toContainText('de impulsar tus sueños para hacerlos realidad');
    // The clip keeps its shape before it loads, and the button does not cover its captions (along the bottom).
    const box = await video.boundingBox();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    const button = await story.locator('[data-logo-replay]').boundingBox();
    expect(button.y + button.height).toBeLessThan(box.y + box.height / 2);
    await page.goto('/?lang=en');
    await expect(story.locator('h3')).toHaveText('夢 means “dream”');
    await expect(story.locator('[data-logo-replay]')).toHaveText('Play animation');
    await expect(story.locator('.logo-story-text')).toContainText('We take care of the technical, financial and operational side');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });

  test('the header spans the window: logo and sections on the left, language and Contáctenos on the right', async ({ page }) => {
    for (const width of [1440, 1920, 390]) {
      await open(page, width);
      const box = (sel) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, mid: r.top + r.height / 2 }; });
      const logo = await box('.site-header .logo');
      const link = await box('.site-header .nav a:not(.nav-cta) >> visible=true');
      const lang = await box('.site-header .lang-switch');
      const cta = await box('.site-header .nav-cta');
      expect(logo.left, `${width}`).toBeLessThanOrEqual(33);
      expect(width - cta.right, `${width}`).toBeLessThanOrEqual(33);
      // The sections follow the logo; the switch sits just before Contáctenos, with free space between the two groups.
      expect(link.left - logo.right, `${width}`).toBeLessThanOrEqual(48);
      expect(cta.left - lang.right, `${width}`).toBeLessThanOrEqual(34);
      expect(lang.left, `${width}`).toBeGreaterThan(link.right);
      for (const b of [link, lang, cta]) expect(Math.abs(b.mid - logo.mid), `${width}`).toBeLessThan(4);
    }
    // The same header on the other pages.
    await open(page, 1440, '/precios');
    expect(await page.locator('.site-header .nav-cta').evaluate((el) => window.innerWidth - el.getBoundingClientRect().right)).toBeLessThanOrEqual(33);
  });

  test('the hero buttons lead to Quiero saber más and Por qué nosotros', async ({ page }) => {
    await open(page);
    const buttons = page.locator('.hero-actions a');
    await expect(buttons).toHaveText(['Quiero saber más', 'Por qué nosotros']);
    await expect(buttons.nth(0)).toHaveAttribute('href', '#contact');
    await expect(buttons.nth(1)).toHaveAttribute('href', '#team');
  });

  test('there is no layout shift while the page loads', async ({ page }) => {
    await open(page);
    const cls = await page.evaluate(() => new Promise((resolve) => {
      let sum = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => resolve(sum), 500);
    }));
    expect(cls).toBeLessThanOrEqual(0.01);
  });

  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`at ${width} px the header fits on one line and nothing scrolls sideways, in both languages`, async ({ page }) => {
      for (const url of ['/?lang=es', '/?lang=en']) {
        await open(page, width, url);
        const m = await page.evaluate(() => {
          const inner = document.querySelector('.header-inner');
          const nav = inner.querySelector('.nav');
          const clone = nav.cloneNode(true);
          clone.style.cssText = 'position:absolute;visibility:hidden;width:max-content;white-space:nowrap';
          inner.appendChild(clone);
          const cs = getComputedStyle(inner);
          const natural = parseFloat(cs.paddingLeft) + inner.querySelector('.logo').getBoundingClientRect().width
            + (parseFloat(cs.columnGap) || 0) + clone.getBoundingClientRect().width + parseFloat(cs.paddingRight);
          clone.remove();
          const wraps = (a) => { const h = a.offsetHeight; const w = a.style.whiteSpace; a.style.whiteSpace = 'nowrap'; const one = a.offsetHeight; a.style.whiteSpace = w; return h > one; };
          return { natural, tall: [...nav.querySelectorAll('a')].filter((a) => a.offsetParent && wraps(a)).length };
        });
        expect(m.tall, url).toBe(0);
        expect(m.natural, url).toBeLessThanOrEqual(width);
        await page.locator('#contact').scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
      }
    });
  }

  test('axe finds no serious or critical violations in Por qué nosotros, in both languages', async ({ page }) => {
    for (const url of ['/?lang=es', '/?lang=en']) {
      await open(page, 1440, url);
      const r = await new AxeBuilder({ page }).include('#team').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });

  test('Por qué nosotros in English, with the founders\' LinkedIn opening in a new tab', async ({ page }) => {
    await open(page, 1440, '/?lang=en');
    await expect(page.locator('#team-title')).toHaveText('Why us');
    await expect(page.locator('#team .why-lead')).toContainText('professional software engineers and accountants');
    await expect(page.locator('#team .member-card h3')).toHaveText(['Gary Mendez', 'Daniel Rengifo', 'Jesus David Garcia, CFA', 'David Andres Ramirez']);
    await expect(page.locator('#team .role')).toHaveText(['Chief Executive Officer', 'Chief Technology Officer', 'Chief Financial Officer', 'Chief Data Officer']);
    const links = page.locator('#team .member-link');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', 'https://www.linkedin.com/in/dfrengifo/');
    await expect(links.nth(1)).toHaveAttribute('href', 'https://www.linkedin.com/in/david-andr%C3%A9s-ram%C3%ADrez-vanegas/');
    for (const l of await links.all()) {
      await expect(l).toHaveAttribute('target', '_blank');
      await expect(l).toHaveAccessibleName('LinkedIn (opens in a new tab)');
    }
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });
});
