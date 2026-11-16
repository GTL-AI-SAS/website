import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForFonts } from './helpers.mjs';

// The page is written in Spanish; i18n.js swaps every text to English or French from its tables, and back.
async function open(page, url = '/', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url);
  await waitForFonts(page);
}

const current = (page) => page.locator('[data-lang-current]');
const choose = async (page, lang) => {
  await current(page).click();
  await page.locator(`.lang-menu [data-lang="${lang}"]`).click();
};
// The page's text outside the parts that stay as written (the clinic screens, names, the notes for one language).
const pageText = (page) => page.evaluate(() => {
  const body = document.body.cloneNode(true);
  body.querySelectorAll('[data-i18n="off"], script').forEach((el) => el.remove());
  return body.textContent.replace(/\s+/g, ' ').trim();
});
const LANGS = ['/?lang=es', '/?lang=en', '/?lang=fr'];

test.describe('language', () => {
  test('the page is Spanish by default, with the Colombian flag and ES on the switch', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await expect(current(page)).toHaveAttribute('aria-label', 'Idioma: español. Cambiar idioma');
    await expect(current(page).locator('.lang-is-es')).toBeVisible();
    await expect(current(page).locator('.lang-is-en')).toBeHidden();
    await expect(current(page).locator('.lang-is-fr')).toBeHidden();
    await expect(current(page).locator('.lang-is:visible')).toHaveText('ES');
    await expect(current(page).locator('.lang-is:visible img')).toHaveAttribute('src', 'assets/flags/co.svg');
    // Before "Contáctenos" in the header.
    expect(await page.evaluate(() => {
      const sw = document.querySelector('[data-lang-switch]');
      return sw.nextElementSibling.classList.contains('nav-cta');
    })).toBe(true);
  });

  test('the menu offers Español, English and Français, each named by its language with its flag drawn', async ({ page }) => {
    await open(page);
    await current(page).click();
    const options = page.locator('.lang-menu').getByRole('button');
    await expect(options).toHaveCount(3);
    // The accessible name is the language's name: the flag is decorative and the code is hidden from it.
    for (const [i, name, flag] of [[0, 'Español', 'co'], [1, 'English', 'us'], [2, 'Français', 'fr']]) {
      await expect(options.nth(i)).toHaveAccessibleName(name);
      const img = options.nth(i).locator('img');
      await expect(img).toHaveAttribute('src', `assets/flags/${flag}.svg`);
      await expect(img).toHaveAttribute('alt', '');
      // The image file loads and has a size (not an emoji, which Windows does not draw). The menu's flags load
      // lazily, once it opens, so this waits for the load, as the other specs do.
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      const box = await img.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(16);
      expect(box.height).toBeGreaterThanOrEqual(10);
    }
  });

  test('ENG turns every text English, with no Spanish left over, and ES brings back the page exactly', async ({ page }) => {
    await open(page);
    const spanish = await pageText(page);
    await choose(page, 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('Software for empowering your dream');
    await expect(page.locator('.nav-cta')).toHaveText('Get in Touch');
    await expect(page.locator('#team-title')).toHaveText('Why us');
    await expect(page.locator('.hero-actions a').first()).toHaveText('I want to know more');
    await expect(page.locator('#feature-tab-calendar')).toHaveText('Calendar');
    await expect(current(page).locator('.lang-is:visible')).toHaveText('ENG');
    await expect(current(page).locator('.lang-is:visible img')).toHaveAttribute('src', 'assets/flags/us.svg');
    await expect(current(page)).toHaveAttribute('aria-label', 'Language: English. Change language');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
    expect(await page.title()).toBe('GTL AI | Empowering dreams');
    // The clinic's screens stay in Spanish.
    await expect(page.locator('#feature-calendar .m-date .m-long')).toContainText('Martes, 17 de noviembre');
    await expect(page.locator('#feature-calendar .mock')).toHaveAttribute('lang', 'es-CO');
    await choose(page, 'es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    expect(await pageText(page)).toBe(spanish);
  });

  test('FRA turns every text French, with no Spanish left over, and ES brings back the page exactly', async ({ page }) => {
    await open(page);
    const spanish = await pageText(page);
    await choose(page, 'fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveText('Un logiciel pour propulser votre rêve');
    await expect(page.locator('.nav-cta')).toHaveText('Contact');
    await expect(page.locator('#team-title')).toHaveText('Pourquoi nous');
    await expect(page.locator('.hero-actions a').first()).toHaveText('Je veux en savoir plus');
    await expect(page.locator('#feature-tab-calendar')).toHaveText('Agenda');
    await expect(current(page).locator('.lang-is:visible')).toHaveText('FRA');
    await expect(current(page).locator('.lang-is:visible img')).toHaveAttribute('src', 'assets/flags/fr.svg');
    await expect(current(page)).toHaveAttribute('aria-label', 'Langue : français. Changer de langue');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
    expect(await page.title()).toBe('GTL AI | Propulser les rêves');
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('Nous créons le site web de votre entreprise');
    // The team: the roles, Gary Mendez's four lines, Paris, and Expertise-as-Software left in English.
    await expect(page.locator('#team .role')).toHaveText(['Directeur général (CEO)', 'Directeur des opérations (COO)', 'Directeur financier (CFO)', 'Directeur de la technologie (CTO)']);
    await expect(page.locator('#team .member-card').first().locator('.member-points li')).toHaveText(['Chercheur et développeur de produits d’IA',
      'PhD en architecture de design conversationnel par IA', 'Entrepreneur en série', 'Ancien joueur de squash du PSA Challenger Tour']);
    await expect(page.locator('#team .member-card').nth(1).locator('.member-bio')).toContainText('Il dirige notre bureau de Paris');
    await expect(page.locator('#team .why-heading')).toHaveText('Expertise-as-Software : l’évolution du SaaS');
    await expect(page.locator('#team .why-text')).toHaveCount(3);
    await expect(page.locator('#team .why-text').first()).toContainText('Avec Expertise-as-Software, votre savoir devient le logiciel.');
    await expect(page.locator('#team .why-text').nth(1)).toContainText('Présence, votre site web avec référencement sur Google');
    await expect(page.locator('#team .why-text').nth(2)).toContainText('implantée à Bogotá et à Paris');
    // The same marks and the same price, with Colombian VAT.
    await expect(page.locator('#contact .price-strip')).toContainText('Formules à partir de $ 100.000 par mois, TVA colombienne (IVA) incluse, sans frais d’installation.');
    // The footer: the company's name, NIT and address as written, and Instagram named in French.
    await expect(page.locator('.footer-company')).toHaveText('GTL AI S.A.S NIT 902.117.320-8 Cra. 47 #104B-15, Bogotá, Colombia');
    await expect(page.locator('.footer-social')).toHaveAccessibleName('Instagram de GTL AI (s’ouvre dans un nouvel onglet)');
    await expect(page.locator('.footer-privacy')).toHaveText('Confidentialité');
    // French punctuation: a no-break space before ? and :.
    expect(await page.locator('#falco .fc-user').nth(2).textContent()).toBe('Comment se présente mon calendrier aujourd’hui ?');
    // The clinic's screens stay in Spanish.
    await expect(page.locator('#feature-calendar .m-date .m-long')).toContainText('Martes, 17 de noviembre');
    await choose(page, 'es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    expect(await pageText(page)).toBe(spanish);
  });

  test('the footer names the company and links to Instagram, in Spanish and English too', async ({ page }) => {
    await open(page);
    const footer = page.locator('footer.site-footer');
    await expect(footer.locator('.footer-company')).toHaveText('GTL AI S.A.S NIT 902.117.320-8 Cra. 47 #104B-15, Bogotá, Colombia');
    await expect(footer.locator('.footer-email')).toBeVisible();
    await expect(footer.locator('.footer-privacy')).toBeVisible();
    const instagram = footer.locator('.footer-social');
    await expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/gtl_ai_/');
    await expect(instagram).toHaveAttribute('target', '_blank');
    await expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(instagram).toHaveAccessibleName('Instagram de GTL AI (abre en una pestaña nueva)');
    await expect(instagram.locator('svg')).toBeVisible();
    const box = await instagram.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
    await choose(page, 'en');
    await expect(instagram).toHaveAccessibleName('GTL AI on Instagram (opens in a new tab)');
    await expect(footer.locator('.footer-company')).toHaveText('GTL AI S.A.S NIT 902.117.320-8 Cra. 47 #104B-15, Bogotá, Colombia');
  });

  test('the choice is kept for the next visit and from page to page, and ?lang= sets it', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Software for empowering your dream');
    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/);
    await page.goto('/?lang=es');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await page.goto('/?lang=en#team');
    await expect(page.locator('#team-title')).toHaveText('Why us');
    // French: chosen in the menu, kept on a reload, and carried to the pricing and privacy pages.
    await page.goto('/');
    await choose(page, 'fr');
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Un logiciel pour propulser votre rêve');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/);
    await page.locator('.nav a', { hasText: 'Tarifs' }).click();
    await expect(page.locator('h1')).toHaveText('Des tarifs simples pour les entreprises qui grandissent');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await page.locator('footer .footer-privacy').click();
    await expect(page.locator('#legal-title')).toHaveText('Politique de traitement des données personnelles');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    // An unknown language is Spanish.
    await page.goto('/?lang=de');
    await expect(page.locator('h1')).toHaveText('Un logiciel pour propulser votre rêve');   // the kept choice stands
    await page.goto('/?lang=es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
  });

  test('the menu opens and closes like a disclosure, by mouse and keyboard', async ({ page }) => {
    await open(page);
    const menu = page.locator('.lang-menu');
    await expect(menu).toBeHidden();
    await current(page).focus();
    await page.keyboard.press('Enter');
    await expect(current(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await expect(menu.locator('[data-lang="es"]')).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(current(page)).toBeFocused();
    await current(page).click();
    await page.locator('h1').click();
    await expect(menu).toBeHidden();
    await expect(current(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('the keyboard alone chooses a language: Space opens, the arrows move, Enter chooses, Escape closes', async ({ page }) => {
    await open(page);
    const menu = page.locator('.lang-menu');
    const option = (lang) => menu.locator(`[data-lang="${lang}"]`);
    await current(page).focus();
    await page.keyboard.press('Space');
    await expect(menu).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(option('es')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(option('en')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(option('fr')).toBeFocused();
    // The focus can be seen.
    expect(await option('fr').evaluate((el) => { const s = getComputedStyle(el); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0; })).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(option('es')).toBeFocused();       // and around
    await page.keyboard.press('ArrowUp');
    await expect(option('fr')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(option('es')).toBeFocused();
    await page.keyboard.press('End');
    await expect(option('fr')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(current(page)).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(option('fr')).toHaveAttribute('aria-current', 'true');
    expect(await current(page).evaluate((el) => { const s = getComputedStyle(el); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0; })).toBe(true);
    // An arrow on the closed button opens the menu; Space chooses; Tab away closes.
    await page.keyboard.press('ArrowDown');
    await expect(menu).toBeVisible();
    await expect(option('es')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(menu).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(current(page)).toBeFocused();
  });

  test('a touch chooses a language', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/');
    await waitForFonts(page);
    await current(page).tap();
    await expect(page.locator('.lang-menu')).toBeVisible();
    // Each option is big enough for a finger: at least WCAG 2.5.8's 24 px high (the menu's are 34 px), and wide.
    for (const o of await page.locator('.lang-menu [data-lang]').all()) {
      const box = await o.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    await page.locator('.lang-menu [data-lang="fr"]').tap();
    await expect(page.locator('.lang-menu')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(current(page).locator('.lang-is:visible')).toHaveText('FRA');
    await context.close();
  });

  test('the request form and its messages follow the language', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    await page.locator('#contact a[data-request]').click();
    const dialog = page.locator('#request-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-request-submit]')).toHaveText('Send request');
    await dialog.locator('[data-request-submit]').click();
    await expect(dialog).toContainText('Check the marked fields:');
    await expect(dialog).toContainText('Name: Write your name.');
    await expect(dialog).not.toContainText('Revise');
  });

  test('in French the form has its labels, hints, consent text and errors, and its consent links to the privacy page', async ({ page }) => {
    await open(page, '/?lang=fr');
    await page.locator('#contact a[data-request]').click();
    const dialog = page.locator('#request-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#request-title')).toHaveText('Demander des informations');
    for (const [field, label] of [['name', 'Nom (obligatoire)'], ['business', 'Entreprise (obligatoire)'], ['phone', 'Téléphone ou WhatsApp'],
      ['email', 'E-mail'], ['city', 'Ville'], ['message', 'Message']]) {
      await expect(dialog.locator(`label[for="request-${field}"]`), field).toHaveText(label);
    }
    await expect(dialog).toContainText('Le nom de votre entreprise, son Instagram ou son site web.');
    await expect(dialog).toContainText('Indiquez au moins un moyen de contact : téléphone ou e-mail.');
    await expect(dialog).toContainText('J’autorise GTL AI à traiter mes données pour répondre à cette demande et assurer un suivi commercial, conformément à sa politique de traitement des données personnelles');
    const policy = dialog.locator('a[href="privacidad.html"]');
    await expect(policy).toHaveText(/^politique de traitement des données personnelles/);
    await expect(dialog.locator('[data-request-submit]')).toHaveText('Envoyer la demande');
    await dialog.locator('[data-request-submit]').click();
    await expect(dialog).toContainText('Vérifiez les champs signalés :');
    await expect(dialog).toContainText('Nom : Saisissez votre nom.');
    await expect(dialog).toContainText('Autorisation : Cochez la case d’autorisation pour continuer.');
    await expect(dialog).not.toContainText(/Revise|Escriba|Marque la casilla/);
    await dialog.locator('#request-name').fill('A');
    await dialog.locator('[data-request-submit]').click();
    await expect(dialog.locator('#request-name-error')).toHaveText('Le nom doit comporter au moins 2 caractères.');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);
  });

  test('the tour Pause label follows the language', async ({ page }) => {
    await open(page);
    await choose(page, 'en');
    const toggle = page.locator('[data-showcase-toggle]');
    await expect(toggle).toHaveText('Pause tour');
    await toggle.click();
    await expect(toggle).toHaveText('Play tour');
    await choose(page, 'fr');
    await expect(toggle).toHaveText('Reprendre la visite');
    await choose(page, 'es');
    await expect(toggle).toHaveText('Reanudar recorrido');
  });

  for (const width of [320, 360, 390, 768, 1024, 1280]) {
    test(`the header fits at ${width} px in every language`, async ({ page }) => {
      for (const url of LANGS) {
        await open(page, url, width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
        await expect(current(page)).toBeVisible();
        await expect(page.locator('.nav-cta')).toBeVisible();
        // Nothing in the header reaches past the screen, with the menu closed or open.
        await current(page).click();
        const over = await page.evaluate((w) => [...document.querySelectorAll('.site-header a, .site-header button')]
          .filter((el) => el.offsetParent && el.getBoundingClientRect().right > w + 0.5).map((el) => el.textContent.trim()), width);
        expect(over, url).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
      }
    });
  }

  test('axe finds no serious or critical violations in the header and the footer, with the menu open, in every language', async ({ page }) => {
    for (const url of LANGS) {
      await open(page, url);
      await current(page).click();
      const r = await new AxeBuilder({ page }).include('.site-header').include('.site-footer').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });

  test('the privacy page is translated too, with a first line saying the Spanish version applies', async ({ page }) => {
    // Chosen on the page itself: the local server's redirect to /privacidad drops a ?lang= query.
    await open(page, '/privacidad.html');
    const note = (lang) => page.locator(`[data-lang-note="${lang}"]`);
    const spanish = await page.locator('main').innerText();
    await expect(page.locator('#legal-title')).toHaveText('Política de tratamiento de datos personales');
    await expect(note('en')).toBeHidden();
    await expect(note('fr')).toBeHidden();

    await choose(page, 'fr');
    await expect(page.locator('.site-header .nav-cta')).toHaveText('Contact');
    await expect(page.locator('main')).toHaveAttribute('lang', 'fr');
    await expect(note('fr')).toBeVisible();
    await expect(note('fr')).toHaveText('Ceci est une traduction. Seule la version en espagnol de cette politique fait foi.');
    await expect(note('en')).toBeHidden();
    // The note comes first: before the policy's title, in the page and on the screen.
    expect(await page.evaluate(() => {
      const n = document.querySelector('[data-lang-note="fr"]');
      const title = document.getElementById('legal-title');
      return n.parentElement.tagName === 'MAIN' && !!(n.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING)
        && n.getBoundingClientRect().bottom <= title.getBoundingClientRect().top;
    })).toBe(true);
    await expect(page.locator('#legal-title')).toHaveText('Politique de traitement des données personnelles');
    await expect(page.locator('main')).toContainText('GTL AI S.A.S, NIT 902.117.320-8, domiciliée à Bogotá D.C., Colombie, à l’adresse Carrera 47 # 104B-15.');
    await expect(page.locator('main')).toContainText('Selon la loi 1581 de 2012, vous pouvez :');
    await expect(page.locator('main')).toContainText('Version 1.2, en vigueur depuis le');
    await expect(page.locator('main')).not.toContainText(/Responsable$|Sus derechos|Vigencia|Cuando usted/);
    expect(await page.title()).toBe('Politique de traitement des données personnelles — GTL AI');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);

    await choose(page, 'en');
    await expect(page.locator('.site-header .nav-cta')).toHaveText('Get in Touch');
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    await expect(note('en')).toBeVisible();
    await expect(note('en')).toHaveText('This is a translation. The Spanish version of this policy is the one that applies.');
    await expect(note('fr')).toBeHidden();
    await expect(page.locator('#legal-title')).toHaveText('Personal data policy');
    await expect(page.locator('main')).toContainText('GTL AI S.A.S, NIT 902.117.320-8, domiciled in Bogotá D.C., Colombia, at Carrera 47 # 104B-15.');
    expect(await page.evaluate(() => window.gtlI18n.missing)).toEqual([]);

    await choose(page, 'es');
    await expect(note('en')).toBeHidden();
    await expect(note('fr')).toBeHidden();
    await expect(page.locator('main')).toHaveAttribute('lang', 'es-CO');
    await expect(page.locator('.site-header .nav-cta')).toHaveText('Contáctenos');
    expect(await page.locator('main').innerText()).toBe(spanish);
  });

  test('no page logs an error or leaves a text untranslated, in any language', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const path of ['/', '/precios.html', '/privacidad.html']) {
      await open(page, path);
      for (const lang of ['fr', 'en', 'es']) {
        await choose(page, lang);
        await expect(page.locator('html')).toHaveAttribute('lang', { es: 'es-CO', en: 'en', fr: 'fr' }[lang]);
        expect(await page.evaluate(() => window.gtlI18n.missing), `${path} ${lang}`).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
});

test.describe('language without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page is Spanish and the switch is not shown', async ({ page }) => {
    await open(page);
    await expect(page.locator('h1')).toHaveText('Software para impulsar su sueño');
    await expect(page.locator('[data-lang-switch]')).toBeHidden();
    // The notes for one language stay hidden, and the footer still names the company.
    await expect(page.locator('.example-note').first()).toBeHidden();
    await expect(page.locator('.footer-company')).toContainText('NIT 902.117.320-8');
  });
});
