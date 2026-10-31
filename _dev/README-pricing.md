# Pricing section: how to change it

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

1. Edit `_dev/pricing.json`.
   - Amounts are whole pesos without separators and without IVA: `350000`, not `350.000`.
   - A bundle's list price is computed from its parts. Never type it.
   - Once JD confirms a price, change its `"status"` from `"propuesta"` to `"confirmado"`.
   - Draft text is marked per field: `"suits": { "text": "…", "copyStatus": "PENDIENTE-COPY" }`.
     Once JD approves it, remove its `"copyStatus"` (keeping `{ "text": "…" }` or a plain string is fine).
     Never put `copyStatus` on a tier, package or block object; a unit test rejects it.
   - An add-on that is not available yet (PQ1: DIAN) carries `"badge": "Próximamente"` and a `"note"` line; a bundle may
     carry a `"note"` under its contents line. Delete them once the add-on is available.
   - Every text addresses the buyer as *usted*; a unit test rejects tú forms (tu, puedes, escríbenos, …).
2. Regenerate the section:
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
   `tests/pricing.test.mjs` holds its own copy of the approved figures. When a figure changes
   on purpose, update that copy in the same commit.
4. Review the diff and commit `pricing.json` and `index.html` together.

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

## Before merging to `main` (by hand, since there is no CI)

1. `npm --prefix _dev run pricing:release-check` must pass: every price confirmed, no draft text, the config complete
   and the privacy text approved.
2. `npm --prefix _dev run test:unit` and `npm --prefix _dev run test:e2e` must pass.
3. Only then merge. The merge publishes the site.

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
| `controller` | The data controller: `name`, `nit`, `city` and `address` (the city and the street address are `"PENDIENTE"` until JD gives them). |
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
