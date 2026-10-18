BRIEF VERSION: 0002-W1 v1 (2026-10-18)

# 0002-W1 — Web shell: the engine in the browser

## Outcome

Horizon runs in a web browser for the first time. A static web app in `apps/web/` loads the engine as a WebAssembly module inside a Web Worker. It lets a person pick one of five synthetic sample households and shows, exactly as the engine returns them:
- the result's status;
- the most the household can spend in retirement;
- the entered spending and the headroom;
- what the result does not include.

This milestone builds the foundation and its test harness. Designed screens come in later milestones.

## Deliverables

1. **`horizon-wasm`** (decision 0011, item 4): a new crate at `packages/wasm` (`crate-type = ["cdylib"]`, `publish = false`, SPDX header), added to the workspace.
   - **Dependencies:** `horizon-app` and `wasm-bindgen` `=0.2.129`, the version already in `Cargo.lock`. No other new crate.
   - **Exports,** each taking and returning canonical JSON strings: `run(fixture)`, `scenario(fixture, changes)`, `compare(baseline, scenario)`, `export_run(fixture)`, `import_run(export)`, `sustainable_spending(fixture)`, `levers(fixture)` and `input_impact(fixture, rough)`.
   - **Errors:** never a JavaScript exception. An error returns the existing error envelope `{code, message, status}` as canonical JSON, byte-identical to what the command line prints for the same input, minus the command line's trailing newline.
   - **Layering:** the crate contains no calculation rule; each export calls the `horizon-app` operation of the same name.
   - **Tests:** native unit tests prove each export returns the same bytes as the application operation for one valid and one invalid input.
2. **The web app** in `apps/web/` (items 1–3), self-contained, with no new top-level entry:
   - React `19.3.0`, React DOM `19.3.0`, Vite `8.3.2`, `@vitejs/plugin-react` `6.1.1` and TypeScript `6.0.3` with `strict: true`;
   - `packageManager: "pnpm@12.9.1"` and `engines.node: "24.22.0"`, with exact versions and no ranges for every dependency, and a committed `pnpm-lock.yaml`;
   - **scripts:** `build:engine` (release build of `horizon-wasm` for `wasm32-unknown-unknown`, then `wasm-bindgen --target web` into a git-ignored folder), `types` (TypeScript types from `docs/model/schemas/*.json` with `json-schema-to-typescript` `16.0.0` into a git-ignored folder), `dev`, `build`, `typecheck`, `lint`, `format:check`, `test`, `e2e` and `licenses`.
3. **The engine in a Web Worker** (item 5). Every engine call goes through one worker using a typed message protocol, `{id, op, args}` → `{id, json}`. The main thread never loads the WebAssembly module. Results are shown exactly as returned; the app formats numbers (thousands separators, the dollar sign) but never computes financial values.
4. **Design tokens:**
   - every color token in `DESIGN.md` (Visual language, version 1) as CSS custom properties, in both themes;
   - the typography, space and radius tokens;
   - Plus Jakarta Sans self-hosted from `@fontsource-variable/plus-jakarta-sans` `5.3.0`, with its OFL-1.1 license file included in the build output;
   - the theme follows `prefers-color-scheme` unless the person picks one with a visible toggle, which wins and lasts only for the page session;
   - visible keyboard focus as specified.
5. **The sample-household page** (not a designed screen):
   - a header with the product name and the theme toggle;
   - a labeled control to choose one of five bundled sample households:

     | Fixture | Label |
     | --- | --- |
     | `answers-working-61` | "Single, 61, still working, plans to retire at 66" |
     | `synthetic-retired` | "Single, 70, retired" |
     | `A-drawdown` | "Single, 73, retired, small savings" |
     | `answers-underfunded` | "Single, 61, spending more than income" |
     | `two-person` | "Couple" |

   - for the chosen household, from `sustainable_spending`:
     - the status as a word with an icon: Supported for `complete`, Partial with its count of omissions for `partial`, Unsupported;
     - the most it can spend each year in today's dollars;
     - the entered after-retirement spending and the headroom;
     - any flag, in words;
     - the list of omissions.
   - for an error, its status word and message, with no figures;
   - every figure labeled "today's dollars, per year".
6. **Security and privacy** (items 8 and 11):
   - **Content Security Policy:** a meta tag with `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'`.
   - **No storage:** no `localStorage`, `sessionStorage`, IndexedDB or cookies.
   - **No outside requests:** no analytics and no third-party request.
7. **Tests:**
   - **Unit (Vitest `5.0.3`, `jsdom` `30.1.1`, `@testing-library/react` `16.3.3`, `@testing-library/dom` `10.4.2`):** number formatting, the status-word mapping, and the worker protocol against a stubbed engine.
   - **End to end (`@playwright/test` `1.63.0`, `@axe-core/playwright` `4.13.0`):** Chromium, Firefox and WebKit, each at 375×812 and 1280×800, in light and dark themes. They prove:
     - keyboard-only operation: choosing each household and toggling the theme;
     - no axe violations;
     - no request leaves the page's origin;
     - nothing written to storage or cookies;
     - no horizontal page scroll at 375 px.
   - **Number parity, in the browser:**
     - **Runs:** the worker's `run` output for each of the four valid households is byte-identical to `packages/parity/golden/<name>.run.json`.
     - **Spending:** the `sustainable_spending` figure shown for each household equals `sustainable_spending` in `docs/briefs/0003-W1-reference-values.json` (64,994; 87,061; 43,690; 0 with its flag).
     - **Errors:** the couple's error code is `MULTIPLE_PERSONS_UNSUPPORTED`.
8. **Lint, format and licenses** (item 10):
   - **Lint:** ESLint `9.39.5` with `@eslint/js` `9.39.5`, `typescript-eslint` `8.71.0`, `eslint-plugin-jsx-a11y` `6.10.2`, `eslint-plugin-react-hooks` `7.1.1` and `globals` `17.13.0`.
   - **Format:** Prettier `3.9.9`.
   - **Licenses:** `licenses` runs `pnpm licenses list --json` and fails on any license outside MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0 and 0BSD, with two exceptions: OFL-1.1 for the font package, and MPL-2.0 for `axe-core` as a test dependency only. Any other license is escalated, not allowed.
9. **Repository hygiene:** `.gitignore` gains the generated engine and type folders, `test-results/` and `playwright-report/`. A fresh clone must build and pass everything from documented commands alone.
10. **Documentation:**
    - `docs/architecture/web-shell.md` describes the module, the worker protocol, the token mapping, the page, the security policy and the test layers;
    - `AGENTS.md` and `README.md` list the full cumulative validation, including the Node.js, corepack, pnpm and Playwright browser setup;
    - `docs/model/dependencies.md` lists every new JavaScript package with its exact version and license.

## Done when

1. **The module:** `horizon-wasm`'s native tests pass, and each export's output equals the application operation's bytes, errors included.
2. **Fresh clone:** in a fresh clone, every documented command passes in order, including installing packages from the frozen lockfile and installing the three Playwright browsers.
3. **The page,** in all three browsers at both sizes and in both themes:
   - each household can be chosen by keyboard alone;
   - its status word, figures, flag and omissions appear;
   - the couple shows Unsupported with no figures;
   - axe reports no violations.
4. **Number parity:** browser runs are byte-identical to the committed run goldens for the four valid households, and the spending figures equal the 0003-W1 reference values.
5. **Privacy:** no storage or cookie writes, and no off-origin request, in any browser.
6. **Licenses:** the license check passes, and every new JavaScript package is listed with its exact version and license.
7. **Earlier guarantees hold:**
   - all Rust validation commands pass unchanged;
   - no earlier reference file, schema or golden changes;
   - no new top-level entry;
   - no new Rust crate beyond `horizon-wasm` itself.

## Read first

- `DESIGN.md` (Visual language, version 1) and `AGENTS.md`.
- Decision records `docs/decisions/0007-*`, `docs/decisions/0010-*`, `docs/decisions/0011-*` and `docs/decisions/0012-*`.
- `docs/model/answers.md`, `docs/model/scenario-diff-and-export.md`, `docs/model/error-codes.md` and the schemas in `docs/model/schemas/`.
- Public references, all retrieved 2026-10-18:
  - wasm-bindgen guide: https://wasm-bindgen.github.io/wasm-bindgen/
  - Vite guide: https://vite.dev/guide/
  - Playwright documentation: https://playwright.dev/docs/intro
  - axe-core for Playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
  - WCAG 2.2: https://www.w3.org/TR/WCAG22/

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

**Toolchain:** the 0003-W1 toolchain, plus corepack (bundled with Node.js 24.22.0) providing `pnpm@12.9.1`. Run from the workspace root, in order:

1. The full cumulative Rust sequence in `AGENTS.md`, unchanged.
2. `cargo test -p horizon-wasm`
3. `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release`

Then from `apps/web/`:

4. `corepack pnpm install --frozen-lockfile`
5. `corepack pnpm run build:engine`
6. `corepack pnpm run types`
7. `corepack pnpm run typecheck`
8. `corepack pnpm run lint`
9. `corepack pnpm run format:check`
10. `corepack pnpm test`
11. `corepack pnpm run build`
12. `corepack pnpm exec playwright install chromium firefox webkit`
13. `corepack pnpm run e2e`
14. `corepack pnpm run licenses`

Record `node --version`, `corepack pnpm --version` and the Playwright browser versions.

## Exclusions

- **Designed screens** (question picker, setup, input check, baseline, comparison, export): later milestones, each with an approved design reference.
- **Deployment and hosting:** a separate deployment brief chooses the host and domain.
- **Persisting anything a person enters:** excluded by decision 0011, item 8.
- **An HTTP API and agent access:** later features.
- **Charts:** none are needed on this page; the chart components arrive with the baseline screen.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
