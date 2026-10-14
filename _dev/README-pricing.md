# Pricing section: how to change it

The "Planes y precios" section on the home page is generated from one data file.
**Never edit the section in `index.html` by hand**; the check will fail.

> **A push or merge to `main` publishes gtl-ai.com immediately.** There is no CI,
> so every check below is run by hand before merging.

Everything under `_dev/` is development tooling. GitHub Pages (Jekyll) does not publish
folders that start with `_`, so none of it goes live. The site itself stays plain static
files (`index.html`, `style.css`, `pricing.js`) with no build step on GitHub Pages.

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
   the tests never reuse a server that is already running there.
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
| `npm --prefix _dev run pricing:check` | Fails if `index.html` or `privacidad.html` differs from what `pricing.json`, `site-config.json` and the privacy template generate (line endings normalised), if the head script, `pricing.js` tag, "Planes" link or footer "Privacidad" link is missing, or if a price appears outside the generated block. A hand edit to either page is caught. |
| `npm --prefix _dev run pricing:release-check` | Runs the check above, then lists every price still `propuesta`, every draft field still `PENDIENTE-COPY` by its path (for example `packages[agenda].tiers[crece].suits`), every config value still `PENDIENTE` or missing (`whatsappNumber`, `contactEmail`, `controller.city`, `controller.address`), every line of `privacidad.html` that still contains `PENDIENTE`, and, in form mode only, an `apiBaseUrl` that is not `https://`. It fails while any remain. |

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
- The request buttons carry `data-package`/`data-tier`, `data-bundle` or `data-general`. In WhatsApp mode (PF2) each one
  is a plain `https://wa.me/<number>?text=<message>` link written at build time (`target="_blank" rel="noopener"`),
  so it works without JavaScript.

## Site config: `_dev/site-config.json` (PF2)

One file holds the values the home page and the privacy page share. The build stamps them in; never type them
into the HTML.

| Key | What it is |
|---|---|
| `planRequestMode` | `"whatsapp"` (today): every request button is a WhatsApp link. `"form"`: the request form (PF2 Pass B, not built yet). |
| `whatsappNumber` | Digits only, with the country code, for example `573001234567`. While it is `"PENDIENTE"`, the links are `https://wa.me/?text=…` (WhatsApp asks for the contact) and the release check fails. |
| `contactEmail` | The email for clients and privacy requests, shown on the privacy page. `"PENDIENTE"` until JD gives it. |
| `replyTime` | The reply-time promise shown after a form request (used from Pass B). |
| `privacyPolicyVersion`, `privacyPolicyDate` | Shown at the end of the privacy page. The date is `YYYY-MM-DD` and is written out, e.g. "16 de octubre de 2026". |
| `controller` | The data controller: `name`, `nit`, `city` and `address` (the city and the street address are `"PENDIENTE"` until JD gives them). |
| `apiBaseUrl` | `null` in WhatsApp mode. In form mode, the `https://` address of the plan-request API. |

After changing it, run `npm --prefix _dev run pricing:build` and commit `site-config.json`, `index.html` and
`privacidad.html` together.

The WhatsApp messages are built from the names in `pricing.json`, one builder per kind (`requestMessage` in
`build-pricing.mjs`): "Hola, quiero información del plan Agenda · Crece (gtl-ai.com)", "… del paquete Clínica Completa …",
"Hola, quiero cotizar un proyecto a medida (gtl-ai.com)" and "Hola, quiero ayuda para elegir un plan (gtl-ai.com)".
They never carry personal data. Each link opens in a new tab and says so to screen readers with visually hidden
text inside it, "(abre WhatsApp en una pestaña nueva)" (`NEW_TAB_TEXT` in `build-pricing.mjs`).

## The privacy page (`privacidad.html`, PF2)

- Generated from `_dev/templates/privacidad.html`. Never edit `privacidad.html` by hand; the check fails.
- `{{key}}` in the template takes a value from the config. Text between `<!-- form -->` and `<!-- /form -->` appears only in form mode.
- The header and footer are copied from `index.html` at build time, with their links pointing to `index.html#…`.
- The text is a draft for JD's approval in PQ1, not legal advice. The template's first comment line is a `PENDIENTE-COPY`
  marker, so the release check fails until JD approves the text and that line is deleted.
- The home page links to it from the footer ("Privacidad").

## Switching to form mode (after PB1 and PB2 are live)

Form mode is PF2 Pass B and is **not built yet**: today the build stops with
`planRequestMode "form" needs PF2 Pass B`. Once Pass B is merged:

1. In `site-config.json`, set `"planRequestMode": "form"` and `"apiBaseUrl": "https://…"` (the PB1 API address).
2. Run `npm --prefix _dev run pricing:build`. The privacy page then also shows its form paragraphs.
3. Run the tests and `npm --prefix _dev run pricing:release-check`; in form mode it fails without an `https://` `apiBaseUrl`.
4. Commit and merge as usual. To go back, set `"planRequestMode": "whatsapp"` and rebuild.
