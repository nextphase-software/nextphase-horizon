BRIEF VERSION: 0002-W9 v1 (2026-10-21)

# 0002-W9 — Allow the host's analytics script and stop inlining fonts

## Outcome

On the hosted prototype, Cloudflare Web Analytics, which the host inserts into served pages, is allowed by the Content Security Policy, and no font is blocked: the build no longer inlines small assets as `data:` URLs. Nothing in the app adds analytics, a cookie or a script of its own.

## Deliverables

1. **Content Security Policy.** The policy gains exactly one source, `https://static.cloudflareinsights.com`, in `script-src`, and is otherwise unchanged:
   - the meta tag in `apps/web/index.html`: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'`;
   - the `_headers` file staged by `infra/cloud/web/` (brief 0002-W8): the same policy plus `frame-ancestors 'none'`, word for word. The other three headers are unchanged.
   - When the host inserts the beacon itself it reports to the site's own `/cdn-cgi/rum`, which `connect-src 'self'` already allows; no other source is added.
2. **No inlined assets.** `apps/web/vite.config.ts` sets `build.assetsInlineLimit: 0`, so every font, image and other asset is a file served from the site's own origin. The built CSS contains no `data:` URL.
3. **Tests.** Every test that asserts the exact policy uses the new string. The end-to-end check that the app makes no request to another origin stays as it is: the app itself sends none, and the locally served build has no host-inserted script. A unit test asserts the built CSS has no `data:` URL.
4. **Documentation.** `docs/architecture/web-shell.md`: the policy line; the sentence "There is no analytics, cookie write or external request in the app" becomes "The app itself adds no analytics, cookie write or external request; on the hosted site, the host may insert Cloudflare Web Analytics (decision 0011, amendment of 2026-10-21), which the policy allows. Any script in the page can read what the page stores, including the answers kept on the device." The hosting section names the allowed source.

## Done when

1. The meta policy and the staged `_headers` policy are the strings in deliverable 1, by test.
2. The production build's CSS has no `data:` URL, and every font is a file under `assets/`.
3. The full web sequence passes, including the end-to-end suite in the 8 projects with axe, keyboard, the exact-policy check and no off-origin requests; the deploy tooling's `licenses`, `test` and `check` pass.
4. Engine code, references, goldens, schemas and every expected-text file are unchanged; no dependency is added.

## Read first

- `AGENTS.md`, `docs/architecture/web-shell.md`, `infra/cloud/web/README.md`.
- Decision records `0011-*` (amendment of 2026-10-21), `0022-*` (amendment of 2026-10-21) and `0018-*`.
- Vite build options, `build.assetsInlineLimit` (`https://vite.dev/config/build-options#build-assetsinlinelimit`, retrieved 2026-10-21); Cloudflare Web Analytics FAQ (`https://developers.cloudflare.com/web-analytics/faq/`, retrieved 2026-10-21).

## Guardrails

- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Do** keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence, the web shell sequence with `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects, then the deploy-tooling block. Record `node --version`, `corepack pnpm --version`, the browser versions and the e2e project and test counts.

## Exclusions

- **Deploying:** the maintainer redeploys after merge.
- **Any analytics, cookie or script added by the app itself, and any other policy source.**
- **Verifying the live beacon:** done after the redeploy, outside this brief (the host inserts it only on the hosted site).

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### Implementation — 2026-10-21

- Branch: `codex/0002-W9-analytics-and-fonts`.
- Source/test revision: `0eedceafda1c0ce792b81bb6fde9d437ba0643ec`; the complete sequence below was freshly run at this revision after resuming validation. The checkout was clean for both deploy-tooling checks. This record is committed afterward.
- Changes: allow exactly `https://static.cloudflareinsights.com` in both script policies and their exact-policy tests; disable asset inlining; test actual built CSS and emitted font references; update the web-shell security and hosting documentation.
- New dependencies: none. Engine source, schemas, references, goldens, expected-text files, manifests and lockfiles are unchanged.
- Tools: Rust 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129, Node.js v24.22.0, corepack 0.36.0, pnpm 12.9.1, Playwright 1.63.0. Node v24.22.0 was recorded before each WebAssembly command, including app builds and the builds inside each deploy-tooling check.

#### Ordered validation commands

Commands run from the workspace root unless a working directory is shown. Test counts sum all harnesses for that invocation; filtered tests are not counted as passed. Each command below exited 0. CLI commands, interleaved at the documented point, are expanded in the following tables.

| Step | Directory | Command | Result |
| --- | --- | --- | --- |
| 1 | `.` | `cargo test -p horizon-app intake` | 28 passed, 0 failed, 0 ignored |
| 2 | `.` | `cargo test -p horizon-app --test reference_values_intake` | 5 passed, 0 failed, 0 ignored |
| 3 | `.` | `cargo test -p horizon-app answers` | 10 passed, 0 failed, 0 ignored |
| 4 | `.` | `cargo test -p horizon-app --test reference_values_answers` | 6 passed, 0 failed, 0 ignored |
| 5 | `.` | `cargo test -p horizon-app compare` | 3 passed, 0 failed, 0 ignored |
| 6 | `.` | `cargo test -p horizon-app immutability` | 1 passed, 0 failed, 0 ignored |
| 7 | `.` | `cargo test -p horizon-app export` | 2 passed, 0 failed, 0 ignored |
| 8 | `.` | `cargo test -p horizon-app --test reference_values_w4` | 1 passed, 0 failed, 0 ignored |
| 9 | `.` | `cargo test -p horizon-engine tax` | 2 passed, 0 failed, 0 ignored |
| 10 | `.` | `cargo test -p horizon-app --test reference_values_w3` | 4 passed, 0 failed, 0 ignored |
| 11 | `.` | `cargo test -p horizon-app --test reference_values_w2` | 11 passed, 0 failed, 0 ignored |
| 12 | `.` | `cargo test -p horizon-app --test reference_values` | 7 passed, 0 failed, 0 ignored |
| 13 | `.` | `cargo test -p horizon-engine ledger` | 2 passed, 0 failed, 0 ignored |
| 14 | `.` | `cargo test -p horizon-engine money` | 2 passed, 0 failed, 0 ignored |
| 15 | `.` | `cargo test -p horizon-app validation` | 5 passed, 0 failed, 0 ignored |
| 16 | `.` | `cargo test -p horizon-parity` | 18 passed, 0 failed, 0 ignored |
| 17 | `.` | `cargo test --workspace` | 112 passed, 0 failed, 0 ignored |
| 18 | `.` | `cargo clippy --workspace --all-targets -- -D warnings` | Passed |
| 19 | `.` | `cargo fmt --all --check` | Passed |
| 20 | `.` | `cargo test --workspace --release` | 112 passed, 0 failed, 0 ignored |
| 21 | `.` | `cargo build --workspace --release` | Passed |
| 22 | `.` | `node --version` | v24.22.0 |
| 23 | `.` | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | Passed |
| 24 | `.` | `node --version` | v24.22.0 |
| 25 | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 18 passed, 0 failed, 0 ignored |
| 26 | `.` | `node --version` | v24.22.0 |
| 27 | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 1 passed, 0 failed, 0 ignored |
| 28 | `.` | `cargo deny check licenses` | License check passed |
| 455 | `.` | `node --version` | v24.22.0 |
| 456 | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 1 passed, 0 failed, 0 ignored |
| 457 | `.` | `cargo test -p horizon-wasm` | 5 passed, 0 failed, 0 ignored |
| 458 | `.` | `node --version` | v24.22.0 |
| 459 | `.` | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | Passed |
| 460 | `apps/web` | `node --version` | v24.22.0 |
| 461 | `apps/web` | `corepack --version` | 0.36.0 |
| 462 | `apps/web` | `corepack pnpm --version` | 12.9.1 |
| 463 | `apps/web` | `corepack pnpm install --frozen-lockfile` | Passed |
| 464 | `apps/web` | `node --version` | v24.22.0 |
| 465 | `apps/web` | `corepack pnpm run build:engine` | Passed |
| 466 | `apps/web` | `corepack pnpm run types` | Passed |
| 467 | `apps/web` | `corepack pnpm run typecheck` | Passed |
| 468 | `apps/web` | `corepack pnpm run lint` | Passed |
| 469 | `apps/web` | `corepack pnpm run format:check` | Passed |
| 470 | `apps/web` | `corepack pnpm test` | 285 passed in 19 files |
| 471 | `apps/web` | `node --version` | v24.22.0 |
| 472 | `apps/web` | `corepack pnpm run build` | Passed |
| 473 | `apps/web` | `corepack pnpm exec playwright install chromium webkit` | Chromium and WebKit installation passed |
| 474 | `apps/web` | `corepack pnpm run e2e` | 104 passed; 8 projects |
| 475 | `apps/web` | `corepack pnpm run licenses` | 4 production / 358 full-closure package versions passed |
| 476 | `infra/cloud/web` | `node --version` | v24.22.0 |
| 477 | `infra/cloud/web` | `corepack pnpm --version` | 12.9.1 |
| 478 | `infra/cloud/web` | `corepack pnpm install --frozen-lockfile` | Passed |
| 479 | `infra/cloud/web` | `corepack pnpm run licenses` | 35 package versions passed |
| 480 | `infra/cloud/web` | `corepack pnpm test` | 12 passed; 0 failed, cancelled or skipped |
| 481 | `infra/cloud/web` | `corepack pnpm run check` | 5 responses; 4 exact headers each; dry-run and local checks passed |
| 482 | `infra/cloud/web` | `corepack pnpm run check` | 5 responses; 4 exact headers each; dry-run and local checks passed |

#### Expanded CLI validation

Every invocation below prints canonical JSON followed by one newline. Expected exits: complete 0, partial 3, invalid 1, unsupported 2, incomplete 4; `dev-run` retains exit 0 for partial. The workspace CLI tests also passed byte-for-byte comparisons with application operations.

- `cargo run --release -p horizon-cli -- levers answers-working-61`: exit 3, partial, 0.648 seconds after the release build (under two seconds).

All 29 W4 and 25 W5 answer documents were separately extracted. For every row, the command was `cargo run -p horizon-cli -- intake <document>`; Each extracted filename is `<reference>-<case>.answers.json`, identified below.

| Reference | Case | Exit | Status |
| --- | --- | --- | --- |
| 0002-W4 | `already-retired` | 0 | complete |
| 0002-W4 | `invalid-negative-before-retirement` | 1 | invalid |
| 0002-W4 | `invalid-range-order` | 1 | invalid |
| 0002-W4 | `invalid-range-order-before-negative` | 1 | invalid |
| 0002-W4 | `invalid-retirement-not-after-valuation` | 1 | invalid |
| 0002-W4 | `left-out-pay` | 3 | partial |
| 0002-W4 | `left-out-pay-and-spending-now` | 3 | partial |
| 0002-W4 | `left-out-pension` | 3 | partial |
| 0002-W4 | `left-out-social-security` | 3 | partial |
| 0002-W4 | `left-out-spending-now` | 3 | partial |
| 0002-W4 | `monthly-and-leap-birthday` | 3 | partial |
| 0002-W4 | `monthly-range-odd` | 3 | partial |
| 0002-W4 | `needed-all-four` | 4 | incomplete |
| 0002-W4 | `needed-birth-date` | 4 | incomplete |
| 0002-W4 | `needed-retirement` | 4 | incomplete |
| 0002-W4 | `needed-same-as-now-without-now` | 4 | incomplete |
| 0002-W4 | `needed-savings` | 4 | incomplete |
| 0002-W4 | `needed-spending-in-retirement` | 4 | incomplete |
| 0002-W4 | `no-savings` | 3 | partial |
| 0002-W4 | `partner` | 2 | unsupported |
| 0002-W4 | `pension-later-rises-not-sure` | 3 | partial |
| 0002-W4 | `pension-later-rises-yes` | 3 | partial |
| 0002-W4 | `range-one-savings` | 3 | partial |
| 0002-W4 | `range-same-as-now` | 3 | partial |
| 0002-W4 | `range-two` | 3 | partial |
| 0002-W4 | `starting-values` | 3 | partial |
| 0002-W4 | `unused-pay-when-retired` | 0 | complete |
| 0002-W4 | `unused-social-security-amount` | 3 | partial |
| 0002-W4 | `working-complete` | 3 | partial |
| 0002-W5 | `v1-working-complete-unchanged` | 3 | partial |
| 0002-W5 | `v2-age-instead-of-date` | 3 | partial |
| 0002-W5 | `v2-age-leap-valuation` | 3 | partial |
| 0002-W5 | `v2-age-too-young` | 1 | invalid |
| 0002-W5 | `v2-needed-birth` | 4 | incomplete |
| 0002-W5 | `v2-needed-retirement-without-pay` | 4 | incomplete |
| 0002-W5 | `v2-needed-three` | 4 | incomplete |
| 0002-W5 | `v2-needed-two` | 4 | incomplete |
| 0002-W5 | `v2-partner` | 2 | unsupported |
| 0002-W5 | `v2-range-nothing-solved` | 3 | partial |
| 0002-W5 | `v2-solve-retirement` | 3 | partial |
| 0002-W5 | `v2-solve-retirement-unreachable` | 3 | partial |
| 0002-W5 | `v2-solve-retirement-with-range` | 3 | partial |
| 0002-W5 | `v2-solve-savings` | 3 | partial |
| 0002-W5 | `v2-solve-savings-none-needed` | 3 | partial |
| 0002-W5 | `v2-solve-savings-retired` | 0 | complete |
| 0002-W5 | `v2-solve-savings-unreachable` | 3 | partial |
| 0002-W5 | `v2-solve-savings-with-range` | 3 | partial |
| 0002-W5 | `v2-solve-spending` | 3 | partial |
| 0002-W5 | `v2-solve-spending-same-as-now-missing` | 3 | partial |
| 0002-W5 | `v2-solve-spending-shortfall-at-zero` | 3 | partial |
| 0002-W5 | `v2-what-if-savings-total` | 3 | partial |
| 0002-W5 | `v2-what-if-savings-total-fills-savings` | 3 | partial |
| 0002-W5 | `v2-what-if-total-with-range` | 3 | partial |
| 0002-W5 | `v2-working-complete` | 3 | partial |

For each of the 48 fixture names below, each column expands to `cargo run -p horizon-cli -- <command> <name>`, except `impact`, which appends `packages/app/test-data/empty-rough.json`, and `compare`, which uses `compare A-drawdown <name>`. Cells show observed exit codes. Each cell is one command, 336 commands total.

| Fixture | spend | levers | impact | run | compare | export | dev-run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `A-drawdown-pass-limit-1` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-roth_before_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-tax_deferred_first` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `B-early-retiree` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `C-partial-base-year-no-taxable` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `D-still-working-rmd-surplus` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `E-senior-2028-loss-carry` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `answers-cap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-underfunded` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61-retire-later` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `invalid-account-type` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-cost-basis` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-date` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-end-before-start` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-assumption` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-cash-return` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-field` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-investment-return` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-tax-indexing` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-negative-balance` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-negative-tax-indexing` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-output-range` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-owner` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-plan-end-age` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-rate` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-tax-pass-limit` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `retirement-date-baseline` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `retirement-date-scenario` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `return-assumption-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `return-assumption-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `spending-amount-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `spending-amount-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `synthetic-leap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `synthetic-retired` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `synthetic-working` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `two-person` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unchanged-copy-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `unchanged-copy-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `unsupported-healthcare` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-negative-cash-return` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-negative-investment-return` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-state-tax` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-tax-year` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `withdrawal-order-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `withdrawal-order-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Additional reference and import commands (each run once):

| Command | Exit | Status |
| --- | --- | --- |
| `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
| `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | invalid |
| `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | unsupported |
| `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported |

#### Timing, browser and artifact evidence

Release `intake_v2_timing` means, ten runs per case:

| Case | Mean (ms) |
| --- | --- |
| v2-working-complete | 67.718 |
| v2-solve-spending | 143.383 |
| v2-solve-savings | 58.965 |
| v2-solve-retirement | 103.232 |
| v2-solve-savings-with-range | 257.590 |

Separate WebAssembly levers harness: 5.15s; exit 0. Node v24.22.0 was recorded immediately before it.

| Project | Passed tests | Browser version | Screenshots |
| --- | --- | --- | --- |
| chromium-1280-dark | 13 | 153.0.8010.12 | 390 |
| chromium-1280-light | 13 | 153.0.8010.12 | 390 |
| chromium-375-dark | 13 | 153.0.8010.12 | 390 |
| chromium-375-light | 13 | 153.0.8010.12 | 390 |
| webkit-1280-dark | 13 | 26.6 | 390 |
| webkit-1280-light | 13 | 26.6 | 390 |
| webkit-375-dark | 13 | 26.6 | 390 |
| webkit-375-light | 13 | 26.6 | 390 |

All 104 e2e tests passed in 8 projects in 20.5 minutes (0 failed, skipped or flaky), including axe, keyboard access, responsive overflow checks, themes, the exact meta policy, all five examples, and no off-origin app requests. All 3,120 screenshots of the exercised screens in every project and the Playwright HTML/JSON reports were saved outside the repository. Production output contains 1 CSS file with no `data:` URL and 4 font files under `assets/`.

Both deploy checks passed from the clean source revision: dry-run only, five local responses each, all four exact headers, release commit, SPA navigation fallback and `application/wasm`. The first staging directory was preserved outside the repository before the second check; complete file lists and every byte matched: 12 files, 1717967 bytes, comparison exit 0.

#### Exclusions and handoff

- Real deployment, Cloudflare login and live-beacon verification were excluded as specified: deployment and live verification belong to the maintainer after redeployment. Only local serving and dry-run deploy validation ran.
- No app analytics, cookie, script or additional policy source was added. No validation exclusion was taken.
- The interrupted earlier attempt is not counted as a pass; this record reports the fresh complete run. No independent review was performed by the implementer; a different reviewer evaluates this change.
