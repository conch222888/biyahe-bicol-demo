# Biyahe Bicol demo

A prototype bus booking app under a placeholder brand: passenger booking, tickets with QR codes, and an operator console. Everything runs in the browser. Schedules, fares, seats and payments are sample data; there is no backend, no real payment and no real sign-in.

## Stack
- Static site: `index.html`, `app.js`, `fil.js` (Filipino strings), `sw.js` (service worker). No framework, no build step.
- `tailwind.css` is a prebuilt, minified file with no source or config in this repo. Do not hand-edit it; new styles go in `index.html`.
- State lives in `localStorage` under one key (`bb_site_v1`).
- `package.json` holds development tooling only (Playwright for the self-test).

## Commands (verified)
- Install tooling: `npm ci && npx playwright install chromium`
- All checks: `./scripts/check.sh` (stages: `lint`, `test`, `security`)
- Self-test only: `node scripts/selftest.mjs` - runs `selftest.js` in headless Chromium. Needs internet: two QR libraries load from public CDNs.
- Run locally: serve the folder with any static server, e.g. `python3 -m http.server 8000`

## Conventions
- When `app.js` or `fil.js` changes, bump the `?v=` number on its `<script>` tag in `index.html`.
- Every user-visible English string needs its Filipino entry in `fil.js`.
- Text that came from a form field goes into the page with `textContent` or through `esc()`, never raw into `innerHTML`.
- A new flow gets a case in `selftest.js`.

## Constraints
- This repository is public. No secrets, real names, phone numbers or operator data.
- Workflow, risk classes and definition of done: `.claude/rules/workflow.md`
- Security and data handling: `.claude/rules/security.md`
- Business rules: `.claude/rules/business.md`
- Never present sample data, simulated payment or the demo signing key as real.
