# Pricing section: how to change it

> **Plans retired from the page (2026-11-11).** Each offer is now tailored, so the site no longer shows the plans
> section or `pricing.js`. The build still validates `pricing.json` and writes, between the `pricing:start` /
> `pricing:end` markers, only the request form that "Hablar con nosotros" opens (its plan field is hidden and fixed
> on a general request). `renderSection` and the data stay here in `_dev`, unpublished, for when plans come back.

The "Planes y precios" section on the home page is generated from one data file.
**Never edit the section in `index.html` by hand**; the check will fail.

> **A push or merge to `main` publishes gtl-ai.com immediately.** There is no CI,
> so every check below is run by hand before merging.

Everything under `_dev/` is development tooling. GitHub Pages (Jekyll) does not publish
folders that start with `_`, so none of it goes live. The site itself stays plain static
files (`index.html`, `privacidad.html`, `style.css`, `pricing.js`, `plan-request.js` and the generated
`site-config.js`) with no build step on GitHub Pages.

## One-time setup (PowerShell, from the repository root)

```powershell
npm --prefix _dev install
npx --prefix _dev playwright install chromium firefox webkit
```

## Change a price or a text

1. Edit the prices where they live now (BF-W1, November 2026), all written by hand, VAT included, in the site's
   format (`$&nbsp;100.000`):
   - `_dev/templates/precios.html`: the four plan cards, A medida, the conditions line, the add-ons (Falco) and the
     FAQ. `precios.html` is built from it; never edit `precios.html` itself.
   - `index.html`: the home page's price line in `#contact` ("Planes desde $ 100.000 al mes, IVA incluido").
   - `i18n.js`: the English and French of every text you changed (keyed by the Spanish), then
     `npm --prefix _dev run i18n:check`, which must print nothing.

   **`_dev/pricing.json` holds no price that the site shows.** It is an older catalogue (other plans, prices without
   IVA), kept only because the build still validates it and the lead API's `CatalogSiteSyncTest` reads its package
   codes. Don't edit it to change a price. Taking it out of the build is on the follow-up list.
2. Regenerate the pages:
   ```powershell
   npm --prefix _dev run pricing:build
   ```
3. Run the tests:
   ```powershell
   npm --prefix _dev run test:unit
   npm --prefix _dev run test:e2e
   ```
   The end-to-end tests run in Chromium, Firefox and WebKit, on port 4174. Port 4174 must be free:
   the tests never reuse a server that is already running there. The form tests (`plan-request-form.spec.mjs`)
   simulate the API with Playwright route interception on the site's own origin; no request ever reaches
   `api.gtl-ai.com`, and the real origin is blocked and asserted untouched.
   The prices on the pages are checked by `tests/bf-w1.test.mjs` and `tests/precios.spec.mjs`; when a price changes
   on purpose, update them in the same commit. (`tests/pricing.test.mjs` checks the older catalogue in
   `pricing.json`, not the pages.)
4. Review the diff and commit the template, the built `precios.html`, `index.html` and `i18n.js` together.

## Look at the page locally

```powershell
npm --prefix _dev run serve
```

Then open http://localhost:4174/#planes. Use port 4174 only.

## Checks

| Command | What it does |
|---|---|
| `npm --prefix _dev run pricing:check` | Fails if `index.html`, `privacidad.html` or `site-config.js` differs from what `pricing.json`, `site-config.json` and the privacy template generate (line endings normalised), if the head script, `pricing.js` tag, "Planes" link or footer "Privacidad" link is missing, or if a price appears outside the generated block, or if a `?v=` stamp on a stylesheet or script is malformed or differs from the file's current hash (PF3: the file was edited without a rebuild). A hand edit to any of the three files, or to a file they load, is caught. |
| `npm --prefix _dev run pricing:release-check` | Runs the check above, then lists every price still `propuesta`, every draft field still `PENDIENTE-COPY` by its path (for example `packages[agenda].tiers[crece].suits`), every config value still `PENDIENTE` or missing (`whatsappNumber`, `contactEmail`, `controller.city`, `controller.address`), every line of `privacidad.html` that still contains `PENDIENTE`, and, in form mode only, an `apiBaseUrl` that is not `https://`. It fails while any remain. |
| `npm --prefix _dev run links` | Checks every `href`/`src` in the built pages: anchors have their id, local files exist (`site-config.js`, `plan-request.js`, `privacidad.html`, …). |
| `npm --prefix _dev run i18n:check` | Lists every text on the three pages, in the scripts and in the launch banner and demos (switched off and on) that has no English or no French translation in `i18n.js`, and any problem in the tables. It prints nothing when there is none. `-- --later` also lists the Spanish that stays on purpose (text inside images, and the drawn screens and logos marked `data-i18n="off"`); `-- --unused` also lists table entries that no page or script uses. |

## Before merging to `main` (by hand, since there is no CI)

1. `npm --prefix _dev run pricing:release-check` must pass: every price confirmed, no draft text, the config complete
   and the privacy text approved.
2. `npm --prefix _dev run i18n:check` must print nothing: every text has its English and French.
3. `npm --prefix _dev run test:unit` and `npm --prefix _dev run test:e2e` must pass.
4. Only then merge. The merge publishes the site.

## How the page works

- The generator writes the section between `<!-- pricing:start -->` and `<!-- pricing:end -->`.
- A one-line script in `<head>` adds the `js` class before the page paints. Only with that class
  does CSS collapse the packages into tabs, so nothing jumps on load.
- `pricing.js` adds the tab roles and keyboard support. Without JavaScript, every package is listed.
  If `pricing.js` fails to load (`onerror` on its tag) or throws (its `try`/`catch`), the `js` class is
  removed and the page falls back to that same full list.
- The request buttons carry `data-package`/`data-tier`, `data-bundle` or `data-general`. In every mode each one
  is a plain `https://wa.me/<number>?text=<message>` link written at build time (`target="_blank" rel="noopener"`),
  so it works without JavaScript.
- **Form mode (PF2 Pass B, live since 2026-10-24).** The build also writes `data-request` on each button, a `<dialog>` with the
  request form and two `<script>` tags (`site-config.js`, then `plan-request.js`, both deferred) inside the markers.
  `plan-request.js` opens the dialog on click with the plan preselected, validates with the API's own rules, and
  POSTs JSON to `<apiBaseUrl>/api/plan-requests` with an `Idempotency-Key` (a new UUID when the dialog opens and
  after any change or any 4xx; the same one on a retry after a network error, a timeout or a 5xx, also when the dialog is
  closed and reopened from the same plan with nothing changed, since the first request may have been stored). If the config has no
  API address, the script fails to load, or JavaScript is off, nothing changes: every button is still its WhatsApp link.
  The script never logs or stores anything.

## Versioned asset URLs (PF3)

Every local stylesheet and script a page loads is referenced as `<file>?v=<first 10 hex digits of its SHA-256>`:
`style.css` and `pricing.js` in the `<head>` of `index.html`, `style.css` in the `<head>` of `privacidad.html`, and, in form
mode, `site-config.js` and `plan-request.js` inside the pricing markers. A changed file has a new URL, so no browser or
cache keeps serving the old copy. The build stamps them (`versionAssets` in `build-pricing.mjs`); the hash is of the file's
bytes with CRLF read as LF, so it never depends on an editor's or a checkout's line endings, and on the repository's
LF-only files `sha256sum style.css | cut -c1-10` gives it.

- After editing `style.css`, `pricing.js` or `plan-request.js`, run `npm --prefix _dev run pricing:build` and commit the file
  together with `index.html` (and `privacidad.html` for `style.css`). Until then `pricing:check` fails:
  `index.html: style.css?v=c8210106a9 is stale: the file is now … (edited without a rebuild).`
- A stamp that is not `?v=` plus 10 hex digits (`?v=latest`, `?V=…`, any other `?query` on a local file) fails with
  `has a malformed ?v= stamp`; the build rewrites it.
- `site-config.js` is generated, so its stamp follows the config: a config change re-stamps it in the same build.
- The stamp is a plain query string: GitHub Pages and the local server ignore it, and so does the link check.

## Site config: `_dev/site-config.json` (PF2)

One file holds the values the home page and the privacy page share. The build stamps them in; never type them
into the HTML.

| Key | What it is |
|---|---|
| `planRequestMode` | `"form"` (live since 2026-10-24, PF2 Pass B): every request button opens the request form; its WhatsApp link stays as the fallback. `"whatsapp"`: every request button is a plain WhatsApp link and nothing of the form is published. |
| `whatsappNumber` | Digits only, with the country code, for example `573001234567`. While it is `"PENDIENTE"`, the links are `https://wa.me/?text=…` (WhatsApp asks for the contact) and the release check fails. |
| `contactEmail` | The email for clients and privacy requests, shown on the privacy page. `"PENDIENTE"` until JD gives it. |
| `replyTime` | The reply-time promise shown in the form's success view. |
| `privacyPolicyVersion`, `privacyPolicyDate` | Shown at the end of the privacy page, and the version is sent with every form request as `policyVersion`. **It must equal Railway's `POLICY_VERSION`**, or every submission is a 422 and the form tells the visitor to reload. The date is `YYYY-MM-DD` and is written out, e.g. "30 de octubre de 2026". |
| `controller` | The data controller: `name`, `nit`, `city` and `address` (the release check fails while the city or the street address is `"PENDIENTE"`), and `footerAddress`, the address as the footer of every page writes it (BF-W1: "Cra. 47 #104B-15, Bogotá, Colombia"; the privacy policy keeps `address`). |
| `instagramUrl` | BF-W1: the company's Instagram, linked from the footer of every page. The build accepts only an `https://www.instagram.com/<account>/` address. |
| `launch` | BF-W1, release 2: `enabled` (the switch, `false` until release 2), `liveFrom` (when the banner's text changes, with its offset: `2026-11-27T00:00:00-05:00` is 00:00 in Bogotá on 27 November) and `demos`, one `{ "name", "description", "url" }` per card of the demos section, in order. See "Release 2" below. |
| `apiBaseUrl` | `null` in WhatsApp mode. In form mode, the `https://` address of the plan-request API (`https://api.gtl-ai.com`); the release check fails on anything else. |

After changing it, run `npm --prefix _dev run pricing:build` and commit `site-config.json`, `index.html`,
`privacidad.html` and `site-config.js` together.

The build writes `site-config.js` (`window.GTL_CONFIG`) with exactly five keys for the browser: `planRequestMode`,
`apiBaseUrl`, `privacyPolicyVersion`, `replyTime`, `whatsappNumber`. Nothing else from the config reaches the browser.

The WhatsApp messages are built from the names in `pricing.json`, one builder per kind (`requestMessage` in
`build-pricing.mjs`): "Hola, quiero información del plan Agenda · Crece (gtl-ai.com)", "… del paquete Clínica Completa …",
"Hola, quiero cotizar un proyecto a medida (gtl-ai.com)" and "Hola, quiero ayuda para elegir un plan (gtl-ai.com)".
They never carry personal data. Each link opens in a new tab and says so to screen readers with visually hidden
text inside it, "(abre WhatsApp en una pestaña nueva)" (`NEW_TAB_TEXT` in `build-pricing.mjs`).

## The privacy page (`privacidad.html`, PF2)

- Generated from `_dev/templates/privacidad.html`. Never edit `privacidad.html` by hand; the check fails.
- `{{key}}` in the template takes a value from the config. Text between `<!-- form -->` and `<!-- /form -->` appears only in form mode.
- The header and footer are copied from `index.html` at build time, with their links pointing to `index.html#…`.
- The text was approved by JD in PQ1 (version 1.0); form mode changed it to version 1.1 (Pass B, amendment A1 §4); W15
  (2026-10-30) put the registered name, NIT and address in §1 (version 1.2). It is not legal advice.
- In form mode three parts appear that WhatsApp mode hides: what the form collects (§2), the consent box (§4) and the
  providers Railway (server and database) and Resend (notification emails) in §5.
- The home page links to it from the footer ("Privacidad"), and the form's consent box links to it too.

## Form mode (PF2 Pass B): on since 2026-10-24

`site-config.json` has `"planRequestMode": "form"`, `"apiBaseUrl": "https://api.gtl-ai.com"`, `"privacyPolicyVersion": "1.2"`.
The form's field limits (name 2–100, business 2–150, phone 20, email 254, city 80, message 500) live in `FIELD_LIMITS` in
`build-pricing.mjs`; the build writes them as `minlength`/`maxlength`, and `plan-request.js` reads them from there.
They are the live API's own limits (`PlanRequestValidator`; amendment A2 §1), so nothing the form accepts is too long for the API.

The honeypot field (`nickname`, always sent as `""`) is hidden by an inline off-screen style on its wrapper (`HONEYPOT_STYLE` in
`build-pricing.mjs`; PF3), so it never shows even if `style.css` fails to load; `style.css` carries the same rule for the class. It is
not `display:none`, which bots skip; the input has `tabindex="-1"`, `aria-hidden="true"` and `autocomplete="off"`.

**Back to WhatsApp mode in one line:** set `"planRequestMode": "whatsapp"` in `site-config.json` (the `apiBaseUrl` may
stay), run `npm --prefix _dev run pricing:build`, then the tests. The dialog, the `data-request` attributes and the two
script tags disappear from `index.html`, the privacy page drops its form paragraphs, and `site-config.js` says `whatsapp`.
The Pass B end-to-end tests skip themselves in WhatsApp mode. Bump `privacyPolicyVersion`/`privacyPolicyDate` if the
privacy text changes as a result, and keep Railway's `POLICY_VERSION` equal to it.

**Policy version and date (amendment A1 §4–§6).** Form mode has been live since 2026-10-24; privacy policy 1.2 (W15) has been
live since 2026-10-30, and Railway runs `POLICY_VERSION` `1.2`. `privacyPolicyDate` is the policy's effective date: it changes, together with
`privacyPolicyVersion` and Railway's `POLICY_VERSION`, only when the policy text changes. Then, in this order: Railway first
(set `POLICY_VERSION` and let the API redeploy), the config second, rebuild, unit + e2e + `pricing:release-check`, merge.

If the policy version on the site and on Railway ever differ, every submission is answered with 422
`policy_version_mismatch` and the form shows "La política de privacidad se actualizó. Recargue la página para continuar.";
fix the variable (or the config) and the mismatch ends.

## Languages: Spanish, English and French (BF-W1)

- The pages are written in Spanish. `i18n.js` (at the root, loaded last on every page) holds the English and French
  tables, keyed by the Spanish text, and swaps every text, the attributes it translates (`aria-label`, `alt`, `title`,
  `placeholder`, …), the title and the description when the visitor picks ENG or FRA in the header's menu; ES brings
  back the page as written. The choice is kept in `localStorage` (`gtl-lang`), and `?lang=es`, `?lang=en` or `?lang=fr`
  in the address sets it.
- A new or changed Spanish text needs its English and French entries in `i18n.js` in the same commit; `i18n:check`
  lists any that is missing. The French is formal (*vous*); `i18n.js` adds the no-break spaces French wants before
  `? ! : ;` and inside `« »` when it writes a text.
- `data-i18n="off"` keeps a part as written in every language (the client logos and their names, the footer's company
  line, and the drawn screens of the sample clinic and of the story sites, which stay in Spanish). `data-lang-note="fr"` (or `"en fr"`) marks a
  note shown only in those languages: in French, that the client logos and stories are fictitious examples; on the
  privacy page, a first line saying the Spanish version applies. `data-en-href` and `data-fr-href` give a link its
  address in that language (the WhatsApp messages and email subjects).
- The privacy page is translated too. Its Spanish text is the one that applies, and its version is the same in every language.
- The form sends the same fields and the same `policyVersion` in every language. Only what the visitor reads changes,
  including the message a plan's button writes in the form, which is in the visitor's language.

## Release 2: the launch banner and the demos (BF-W1)

Built and switched off. **To switch it on, one line:** in `_dev/site-config.json`, under `launch`, change
`"enabled": false` to `"enabled": true`; then run `npm --prefix _dev run pricing:build`, the checks and tests above, and merge.
The build then writes:

- the banner, between `<!-- launch-banner:start -->` and `<!-- launch-banner:end -->` above the header of
  `index.html`, and above the header of the pricing and privacy pages, where its link points to `index.html#demos`;
- the "Demos por especialidad" section, between `<!-- launch-demos:start -->` and `<!-- launch-demos:end -->`, after the stories.

The banner's text changes by itself at `launch.liveFrom` by the visitor's clock (00:00 in Bogotá on Friday 27 November),
so nothing has to be published that day. A visitor can close it; it comes back once, with the new text, after the
launch. Without JavaScript the banner is not shown. Switched off, nothing is written between the markers and the pages
are as before. The demos' names and descriptions are in Spanish in the config, and their English and French are in
`i18n.js`; `i18n:check` renders the section with the switch on, so a missing translation is caught before release 2.
