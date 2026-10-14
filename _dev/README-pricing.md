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
| `npm --prefix _dev run pricing:check` | Fails if `index.html` differs from `pricing.json` (line endings normalised), if the head script, `pricing.js` tag or "Planes" link is missing, or if a price appears outside the generated block. |
| `npm --prefix _dev run pricing:release-check` | Runs the check above, then lists every price still `propuesta` and every draft field still `PENDIENTE-COPY` by its path (for example `packages[agenda].tiers[crece].suits`), and fails while any remain. |

## Before merging to `main` (by hand, since there is no CI)

1. `npm --prefix _dev run pricing:release-check` must pass: every price confirmed, no draft text.
2. `npm --prefix _dev run test:unit` and `npm --prefix _dev run test:e2e` must pass.
3. Only then merge. The merge publishes the site.

## How the page works

- The generator writes the section between `<!-- pricing:start -->` and `<!-- pricing:end -->`.
- A one-line script in `<head>` adds the `js` class before the page paints. Only with that class
  does CSS collapse the packages into tabs, so nothing jumps on load.
- `pricing.js` adds the tab roles and keyboard support. Without JavaScript, every package is listed.
  If `pricing.js` fails to load (`onerror` on its tag) or throws (its `try`/`catch`), the `js` class is
  removed and the page falls back to that same full list.
- The request buttons carry `data-package`/`data-tier`, `data-bundle` or `data-general`; PF2 wires them.
