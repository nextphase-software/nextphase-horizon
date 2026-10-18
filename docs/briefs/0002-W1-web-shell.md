BRIEF VERSION: 0002-W1 v2 (2026-10-18)

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
   - type packages `@types/react` `19.3.0`, `@types/react-dom` `19.3.0` and `@types/node` `24.19.1`;
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
   - **Licenses** (decision 0011 and its 2026-10-18 amendment): `licenses` runs two checks and fails if either fails.
     - **Shipped code:** over `pnpm licenses list --json --prod`, every package is MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0 or 0BSD, except OFL-1.1 for `@fontsource-variable/plus-jakarta-sans`. No other exception applies.
     - **All packages:** over `pnpm licenses list --json`, every package is on that list, or is the font, or matches one of these exact build- and test-only exceptions:

       | License | Packages |
       | --- | --- |
       | MPL-2.0 | `@axe-core/playwright` 4.13.0; `axe-core` 4.13.0 and 4.14.0; `lightningcss` 1.33.0 and each `lightningcss-<platform>` 1.33.0 |
       | MIT-0 | `@csstools/color-helpers` 6.1.2; `@csstools/css-syntax-patches-for-csstree` 1.1.15 |
       | CC0-1.0 | `language-subtag-registry` 0.3.23; `mdn-data` 2.27.1 |
       | CC-BY-4.0 | `caniuse-lite` 1.0.30001816 |
       | BlueOak-1.0.0 | `lru-cache` 11.5.3; `minimatch` 10.2.6 |
       | Python-2.0 | `argparse` 2.0.1 |
       | PSF-2.0 | `argparse` 3.0.3 |

     - The script prints each failure with its package, version and license. Any other license, or a listed license on another package or version, is escalated, not allowed.
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
6. **Licenses:** both license checks pass; shipped code uses only the strict list and the font's OFL-1.1; every new JavaScript package is listed with its exact version and license.
7. **Earlier guarantees hold:**
   - all Rust validation commands pass unchanged;
   - no earlier reference file, schema or golden changes;
   - no new top-level entry;
   - no new Rust crate beyond `horizon-wasm` itself.

## Read first

- `DESIGN.md` (Visual language, version 1) and `AGENTS.md`.
- Decision records `docs/decisions/0007-*`, `docs/decisions/0010-*`, `docs/decisions/0011-*` (including its 2026-10-18 amendment) and `docs/decisions/0012-*`.
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

## Implementation record — v2 (2026-10-18)

- **Branch:** `codex/0002-W1-web-shell`, fast-forwarded from `main` at
  `4b5d536072132f8fc3265e30a513a36e260cd5dc` before implementation.
- **Initial source/test revision validated:** `fddb9e61138b4d8820d17fa99a8d37d8f2736e44`.
  Every command below ran in a fresh local Git clone of that committed revision,
  with no copied node_modules, generated bindings/types, build output or target
  directory. Source/tests stayed unchanged during validation. This record and its
  inline validation details below are committed afterward;
  the final branch tip is reported separately in the handoff.
- **End to end:** **not run by the implementer; run by the reviewer**.
  Playwright browser installation was also not run by the implementer. The
  maintainer explicitly excluded both under the sandbox constraint. The reviewer
  installs Chromium/Firefox/WebKit and runs the committed 12 browser/size/theme
  projects outside the sandbox, including keyboard, axe, privacy, no-overflow and
  canonical/number-parity assertions. Actual browser versions are recorded by
  the harness's browser-version annotations when the reviewer runs it.

### Initial v2 validation (historical)

The original v2 run completed 420 commands with expected exits. Its historical
summary is retained below. The per-command observations are now inline in this
brief rather than in a separate validation artifact. The review follow-up record
below identifies the new source/test revision and its fresh-clone checks.

| Commands / layer | Observed result |
| --- | --- |
| Full cumulative 0001-W1–W4 / 0003-W1 Rust sequence and all CLI expansions | 408 root commands, all expected exits; 372 CLI invocations over all 48 fixtures and reference/rejection cases. Each emitted canonical JSON plus one newline. Complete/partial/invalid/unsupported exits were 0/3/1/2; dev-run retained 0 for partial. |
| `cargo test --workspace` | Exit 0; 75 tests passed across harnesses. |
| `cargo clippy --workspace --all-targets -- -D warnings` | Exit 0. |
| `cargo fmt --all --check` | Exit 0. |
| `cargo test --workspace --release` | Exit 0; 75 tests passed across harnesses. |
| Release workspace and engine/app WASM builds | Exit 0 each. |
| Native / WASM parity | Exit 0 each; 15 native tests / 14 WASM tests passed. Node v24.22.0 was recorded before every WASM build/test command. |
| `cargo deny check licenses` | Exit 0. |
| `cargo run --release -p horizon-cli -- levers answers-working-61` | Expected exit 3; **0.786s** wall time, below 2s, after an explicit CLI release build (exit 0). The extra build keeps feature-selection recompilation outside the measurement. |
| Isolated WASM levers test | Exit 0; 1 passed / 13 filtered; **5.28s** harness duration; 6.107s command wall time. |
| `cargo test -p horizon-wasm` | Exit 0; 2 tests passed, covering all eight exports' valid/error bytes and malformed argument/precedence cases. |
| `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | Exit 0. |
| `corepack pnpm install --frozen-lockfile` | Exit 0 in the fresh clone. |
| `corepack pnpm run build:engine` / `types` | Exit 0 each; bindings and all 11 schema type modules regenerated from committed inputs. |
| `corepack pnpm run typecheck` / `lint` / `format:check` | Exit 0 each. |
| `corepack pnpm test` | Exit 0; 12 tests passed in 5 files, including strict production/exact tool-exception license-policy tests. |
| `corepack pnpm run build` | Exit 0; static worker/WASM assets, self-hosted font files and OFL-1.1 notice emitted. |
| `corepack pnpm run licenses` | Exit 0; strict shipped-code check passed for 4 versions and the full installed closure passed for 359 versions using only v2's exact build/test exceptions. |
| Playwright install / e2e | **not run by the implementer; run by the reviewer**. No browser assertions or runtime-version checks are claimed. |

**Tools observed:** Node **v24.22.0**, corepack **0.36.0**, pnpm **12.9.1**,
Rust **1.99.1**, wasm-bindgen and its test runner **0.2.129**, cargo-deny
**0.20.2**. Playwright package **1.63.0** is pinned; browser runtime versions
remain for the reviewer. Node's pinned executable directory was first on PATH.

### Dependencies and exclusions

Every new JavaScript package/version/license is in
[dependencies.md](../model/dependencies.md#web-shell--0002-w1-v2) and the committed
app manifest/lockfile. The v2 type-package pins are @types/react **19.3.0**,
@types/react-dom **19.3.0**, @types/node **24.19.1** (all MIT). Exact tool-only
license exceptions come from decision 0011's accepted amendment and v2; they are
rejected in production. Other packages, versions and licenses still fail closed.
The font's OFL-1.1 license is included in build output. horizon-wasm depends only
on horizon-app and wasm-bindgen **=0.2.129** (MIT OR Apache-2.0), already locked;
no other external Rust dependency is added.

- Designed screens are excluded: this brief is the foundation/sample page only.
- Deployment/hosting are excluded: a separate brief selects the host/domain.
- Persistence is excluded by decision 0011 item 8; state stays in memory.
- HTTP/agent access is excluded: later features.
- Charts are excluded: they arrive with the baseline screen.
- Browser installation and launches are excluded from the implementer's run by
  the maintainer's explicit sandbox instruction; the reviewer runs them outside.
- Independent review remains with a different reviewer under AGENTS.md.
- Earlier schemas, reference vectors, fixtures, goldens and decision records are
  unchanged. No new tracked top-level entry or server authorization surface was
  introduced. No main-branch mutation, push or hook bypass was performed.

<details>
<summary>Original v2 validation commands at fddb9e6 (historical)</summary>

| Directory | Command | Exit | Counts / result |
| --- | --- | --- | --- |
| workspace root | `node --version` | 0 | No test harness |
| workspace root | `corepack --version` | 0 | No test harness |
| workspace root | `rustc --version` | 0 | No test harness |
| workspace root | `wasm-bindgen --version` | 0 | No test harness |
| workspace root | `wasm-bindgen-test-runner --version` | 0 | No test harness |
| workspace root | `cargo deny --version` | 0 | No test harness |
| workspace root | `cargo test -p horizon-app answers` | 0 | test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.96s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s; test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.21s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 11 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.15s |
| workspace root | `cargo test -p horizon-app compare` | 0 | test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.05s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 11 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app immutability` | 0 | test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 5 filtered out; finished in 0.03s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 11 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app export` | 0 | test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 4.43s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 11 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s |
| workspace root | `cargo test -p horizon-engine tax` | 0 | test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s |
| workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s |
| workspace root | `cargo test -p horizon-app --test reference_values` | 0 | test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-engine ledger` | 0 | test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-engine money` | 0 | test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out; finished in 0.00s |
| workspace root | `cargo test -p horizon-app validation` | 0 | test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 11 filtered out; finished in 0.00s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s; test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s |
| workspace root | `cargo test -p horizon-parity` | 0 | test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.27s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s |
| workspace root | `cargo test --workspace` | 0 | test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.93s; test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.59s; test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.14s; test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s; test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s; test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 55.66s; test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 12.08s; test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.13s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.91s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s |
| workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | No test harness |
| workspace root | `cargo fmt --all --check` | 0 | No test harness |
| workspace root | `cargo test --workspace --release` | 0 | test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s; test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.60s; test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.85s; test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s; test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s; test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.81s; test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.94s; test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.82s; test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.53s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s |
| workspace root | `cargo build --workspace --release` | 0 | No test harness |
| workspace root | `node --version` | 0 | No test harness |
| workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | No test harness |
| workspace root | `node --version` | 0 | No test harness |
| workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | test result: ok. 14 passed; 0 failed; 0 ignored; 0 filtered out; finished in 20.64s; test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s |
| workspace root | `cargo deny check licenses` | 0 | No test harness |
| workspace root | `cargo build --release -p horizon-cli` | 0 | No test harness |
| workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON document plus newline; invalid |
| workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON document plus newline; partial |
| workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON document plus newline; unsupported |
| workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON document plus newline; complete |
| workspace root | `node --version` | 0 | No test harness |
| workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | test result: ok. 1 passed; 0 failed; 0 ignored; 13 filtered out; finished in 5.28s |
| workspace root | `cargo test -p horizon-wasm` | 0 | test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.92s |
| workspace root | `node --version` | 0 | No test harness |
| workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | No test harness |
| apps/web | `node --version` | 0 | No test harness |
| apps/web | `corepack --version` | 0 | No test harness |
| apps/web | `corepack pnpm --version` | 0 | No test harness |
| apps/web | `corepack pnpm install --frozen-lockfile` | 0 | No test harness |
| apps/web | `corepack pnpm run build:engine` | 0 | No test harness |
| apps/web | `corepack pnpm run types` | 0 | No test harness |
| apps/web | `corepack pnpm run typecheck` | 0 | No test harness |
| apps/web | `corepack pnpm run lint` | 0 | No test harness |
| apps/web | `corepack pnpm run format:check` | 0 | All matched files use Prettier code style! |
| apps/web | `corepack pnpm test` | 0 | Test Files  5 passed (5); Tests  12 passed (12) |
| apps/web | `corepack pnpm run build` | 0 | No test harness |
| apps/web | `corepack pnpm run licenses` | 0 | No test harness |

</details>

### Review follow-up — H1, M1, L1, L2 (2026-10-18)

**Branch:** `codex/0002-W1-web-shell`.
**New source/test revision validated:** `a006fb113e51179b840b10cdd6500cc36f566a34`.
All checks below ran in a fresh local Git clone of that committed revision,
without copied node_modules, target output, generated types or WASM bindings.
Source/tests stayed unchanged during validation. This record is committed after
that revision; the final branch tip is reported separately in the handoff.

| Finding | Change |
| --- | --- |
| H1 | Keyboard label type-ahead selects households. Focus traversal is Alt+Tab for WebKit on macOS and Tab otherwise. A worker-scoped fixture supplies a fresh empty temporary `CFFIXED_USER_HOME` through Firefox's `launchOptions.env` only on darwin, and removes it after the browser closes. Every existing e2e assertion is retained. |
| M1 | README/AGENTS document the full contributor validation sequence without a run-specific exception. README describes the shell without a gate state. The architecture document explains the macOS 27 Firefox workaround and its public reference. |
| L1 | Answer/error reset occurs at the worker-request start in the selection effect. A same-value change event keeps the existing answer; a changed selection clears the answer while its request is pending. Both cases have unit tests. |
| L2 | The separate JSON validation artifact and all links to it are removed. Its historical command observations and the new results are inline in this brief. |

The same-value regression was first reproduced against the old handler: the unit
suite exited 1 with 1 failure / 13 passes, leaving only Calculating sample
household visible. After the fix, the fresh-clone suite passed all 14 tests.
The synchronous loading reset has one documented, line-scoped exception to
`react-hooks/set-state-in-effect`; lint configuration and all other rules remain
unchanged.

**Affected-command validation** (all commands from `apps/web/`):

| Command | Exit | Counts / observed result |
| --- | --- | --- |
| `node --version` | 0 | v24.22.0 |
| `corepack --version` | 0 | 0.36.0 |
| `corepack pnpm --version` | 0 | 12.9.1 |
| `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 |
| `corepack pnpm install --frozen-lockfile` | 0 | Frozen lockfile installed in fresh clone |
| `corepack pnpm run build:engine` | 0 | Release WASM module and bindings generated |
| `corepack pnpm run types` | 0 | 11 schema type modules generated |
| `corepack pnpm run typecheck` | 0 | Strict typecheck passed, including e2e fixture/spec |
| `corepack pnpm run lint` | 0 | Lint passed |
| `corepack pnpm run format:check` | 0 | All matched files use Prettier code style! |
| `corepack pnpm test` | 0 | Test Files  6 passed (6); Tests  14 passed (14) |
| `corepack pnpm run build` | 0 | Static site, worker/WASM, font and license built |
| `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (359 package versions). |
| `corepack pnpm exec playwright test --list` | 0 | Total: 12 tests in 1 file |

**End to end:** **not run by the implementer; run by the reviewer**.
Playwright browser installation was also not run. The maintainer excluded both
because browsers cannot start in this sandbox. `playwright test --list` only
loaded/discovered the 12 projects; it did not execute browser fixtures or page
assertions. The reviewer reruns the full e2e matrix outside the sandbox and
records actual browser versions. This record makes no browser-pass claim.

**Tool versions observed:** Node v24.22.0, corepack 0.36.0, pnpm 12.9.1,
wasm-bindgen 0.2.129. Node's pinned executable directory was first on PATH for
every command, including both WASM-producing build commands. Dependencies,
package pins, package manifests and lockfiles are unchanged; no dependency was
added. The license checks passed for 4 shipped versions and 359 installed
versions.

**Validation scope/exclusions:** this follow-up changes only the web component,
its tests/browser fixture and the four findings' documentation. Rust source,
Cargo manifests/lockfile, schemas, model references, financial fixtures and
goldens are unchanged, so native Rust tests, CLI fixture sweeps, Rust lint/format,
WASM numeric parity and Rust license checks were not rerun. The fresh-clone web
builds still compiled the unchanged release WASM module. Earlier full cumulative
observations remain above as historical results, not new passes. Independent
review remains with a different reviewer. The brief's original exclusions
(designed screens, charts, persistence, hosting/deployment and HTTP/agent access)
remain unchanged. No main-branch mutation, push or hook bypass was performed.

### Re-review follow-up — household radios and Firefox cleanup (2026-10-18)

**Branch:** `codex/0002-W1-web-shell`.
**New source/test revision validated:** `bdfcd5503cc9d453c5802a5f9b49371ead16bf55`.
The following commands ran against that committed revision in a fresh local Git
clone, with no copied node_modules, generated types/bindings or target output.
The source and tests stayed unchanged throughout validation. This implementation
record is committed afterward; the final branch tip is reported separately.

The household control now uses a native fieldset with the legend Sample
household and five labeled radios sharing `name="household"`. The labels and
order are unchanged, and the first radio starts checked. Wrapping grid labels
and a zero minimum inline size keep the fieldset within its available width;
the radios inherit the visible accent focus ring. Unit tests cover labels,
order, values, initial selection, selecting the checked household again and
clearing the answer when a different household request starts.

The e2e suite replaces the superseded label type-ahead with ArrowDown from the
focused, checked radio. It asserts each radio's checked state, value, focus and
focus outline. Platform/browser focus traversal and every other assertion remain
in place, including all golden/reference, axe, privacy, overflow and theme checks.
Firefox home cleanup now uses `rmSync` with `maxRetries: 10` and
`retryDelay: 200` to retry transient failures caused by late Firefox writes.
The macOS-only Firefox launch environment and per-launch directory stay intact.

**Affected-command validation** (all commands from `apps/web/`):

| Command | Exit | Counts / observed result |
| --- | --- | --- |
| `node --version` | 0 | v24.22.0 |
| `corepack --version` | 0 | 0.36.0 |
| `corepack pnpm --version` | 0 | 12.9.1 |
| `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 |
| `corepack pnpm install --frozen-lockfile` | 0 | Frozen lockfile installed in fresh clone |
| `corepack pnpm run build:engine` | 0 | Release WASM module and bindings generated |
| `corepack pnpm run types` | 0 | Schema type generation passed |
| `corepack pnpm run typecheck` | 0 | Strict typecheck passed, including e2e fixture/spec |
| `corepack pnpm run lint` | 0 | Lint passed |
| `corepack pnpm run format:check` | 0 | All matched files use Prettier code style! |
| `corepack pnpm test` | 0 | 6 test files passed; 15 tests passed |
| `corepack pnpm run build` | 0 | 27 modules transformed; static site, worker/WASM, font and license built |
| `corepack pnpm run licenses` | 0 | 4 shipped package versions and 359 installed package versions passed |
| `corepack pnpm exec playwright test --list` | 0 | 12 tests discovered in 1 file |

**End to end:** **not run by the implementer; run by the reviewer**.
Playwright browser installation was also not run, as requested because browsers
cannot start in this sandbox. Test discovery does not launch browsers or execute
fixtures/page assertions. Actual keyboard behavior, focus, the 375 px overflow
check, browser versions and retry cleanup require the reviewer's e2e run outside
the sandbox; no browser pass is claimed here.

**Toolchain/dependencies:** Node v24.22.0 was first on PATH for every command,
including both WASM-producing builds; corepack 0.36.0 invoked pnpm 12.9.1.
wasm-bindgen was 0.2.129. No dependencies were added; package manifests, pins and
lockfiles are unchanged.

**Validation scope/exclusions:** only the household component/styles, their
unit/e2e tests, Firefox cleanup and the related architecture/implementation
record changed. Rust source, Cargo manifests/lockfile, schemas, financial
fixtures, references and goldens are unchanged. Native Rust tests, CLI fixture
sweeps, Rust lint/format, WASM numeric parity and Rust license checks were not
rerun because these changes cannot affect them. Fresh-clone web builds compiled
the unchanged release WASM module. Earlier cumulative results remain historical
observations. M1, L1 and L2 remain resolved; no separate validation artifact was
added. Independent browser review remains with a different reviewer. No main
mutation, push or hook bypass was performed.

### Re-review follow-up — best-effort Firefox cleanup (2026-10-18)

**Branch:** `codex/0002-W1-web-shell`.
**New source/test revision validated:** `050b89dbf13817eae80c67c840b81947645bac5e`.
Validation ran in a fresh local Git clone of that committed revision, without
copied node_modules, generated types/bindings or target output. Source and tests
stayed unchanged during validation; this record is committed afterward.

The sole code change wraps Firefox's temporary-home `rmSync` in a try/catch.
The existing recursive/force options, 10 retries and 200 ms retry delay remain.
A short comment explains that Firefox can keep writing after close, so removal
of this OS-temp directory is best effort. Cleanup failure cannot fail teardown.
No browser assertions, application code or other behavior changed.

**Validation commands** (all from `apps/web/`, pinned Node directory first on PATH):

| Command | Exit | Counts / observed result |
| --- | --- | --- |
| `node --version` | 0 | v24.22.0 |
| `corepack --version` | 0 | 0.36.0 |
| `corepack pnpm --version` | 0 | 12.9.1 |
| `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 |
| `corepack pnpm install --frozen-lockfile` | 0 | Frozen installation in fresh clone |
| `corepack pnpm run build:engine` | 0 | Release WASM module and bindings generated |
| `corepack pnpm run types` | 0 | Schema type generation passed |
| `corepack pnpm run typecheck` | 0 | Strict typecheck passed, including browser fixture |
| `corepack pnpm run lint` | 0 | Lint passed |
| `corepack pnpm run format:check` | 0 | All matched files use Prettier code style! |
| `corepack pnpm test` | 0 | 6 test files passed; 15 tests passed |
| `corepack pnpm run build` | 0 | Production site and worker/WASM built |
| `corepack pnpm run licenses` | 0 | 4 shipped and 359 installed package versions passed |
| `corepack pnpm exec playwright test --list` | 0 | 12 tests discovered in 1 file |

**End to end:** **not run by the implementer; run by the reviewer**.
Playwright installation and e2e execution were excluded as requested because
browsers cannot start in this sandbox. Discovery does not execute teardown or
page assertions. The reviewer reruns e2e outside the sandbox; no new browser
result is claimed by the implementer.

**Dependencies/exclusions:** no dependencies added; manifests, pins and lockfiles
are unchanged. Rust source, financial fixtures, references, schemas and goldens
are unchanged. Rust tests, CLI sweeps, Rust lint/format, WASM numeric parity and
Rust license checks were not rerun because this browser-fixture-only change
cannot affect them. Web build prerequisites and all non-browser web validation
commands were rerun above. No separate validation artifact was added. No main
mutation, push or hook bypass was performed. Final branch tip is reported
separately in the handoff.
