BRIEF VERSION: 0002-W8 v1.1 (2026-10-21)

# 0002-W8 — Hosted prototype: deploy tooling for Workers static assets

## Outcome

The production build of the web app can be deployed to Cloudflare Workers static assets at `horizon.nextphase.software` by the maintainer, with one script, from a clean checkout, with the response headers of decision 0022 and a `/release.json` that names the commit. The deploy tooling lives in `infra/cloud/web/`, apart from the app; the app itself does not change. The first real deploy is the maintainer's, outside this brief.

## Deliverables

1. **A separate tooling package, `infra/cloud/web/`:**
   - `package.json` (private, `packageManager` pnpm 12.9.1 as in `apps/web/`, `engines.node` as in `apps/web/`) with one dependency, `wrangler` **4.148.0** exactly (MIT OR Apache-2.0), and its own `pnpm-lock.yaml`.
   - `pnpm-workspace.yaml` declining every dependency install script that pnpm 12 asks about: `allowBuilds:` with `esbuild: false` and `workerd: false` **(v1.1)**. No install script runs; Wrangler uses the platform binaries its packages publish. With this file, `corepack pnpm install --frozen-lockfile` exits 0; without it, pnpm 12.9.1 stops with `ERR_PNPM_IGNORED_BUILDS`. If a later lockfile resolves another package with an install script, that is escalated, not allowed.
   - `wrangler.jsonc`: name `horizon`; a pinned `compatibility_date` of 2026-10-06; `assets.directory` set to the staging folder of deliverable 3; `assets.not_found_handling` `"single-page-application"`; no `main`, no bindings; the custom domain `horizon.nextphase.software` as a route with `custom_domain: true`; `workers_dev: true`.
   - `README.md`: what the folder is, the commands of deliverables 3–5, and that deploying needs the maintainer's own Cloudflare login (`wrangler login`) and the `nextphase.software` zone on that account.
   - An `.assetsignore` is not needed: the staging folder holds only the files of deliverable 3.
2. **License check for this closure** (`corepack pnpm run licenses` in `infra/cloud/web/`): the same allow-list as the app's full closure (decision 0011 and its amendments), plus exactly two package-version exceptions (decision 0022 item 4): `@img/sharp-libvips-<platform>@1.3.3`, LGPL-3.0-or-later, for any platform variant the lockfile resolves; and `@speed-highlight/core@1.2.24`, CC0-1.0. Any other license, or a listed license at another version, fails with package, version and license. The app's own license command and its results are unchanged.
3. **Staging** (`corepack pnpm run stage`): from the repository's current checkout, builds the engine module and the app with the app's own commands (`cargo build -p horizon-wasm --target wasm32-unknown-unknown --release`, then in `apps/web/` `corepack pnpm install --frozen-lockfile`, `run build:engine`, `run build`), then writes a fresh staging folder (git-ignored) containing exactly: every file of `apps/web/dist/`, a `_headers` file and a `release.json`.
   - **`_headers`** applies to `/*`:
     - `Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'; frame-ancestors 'none'` (the app's meta CSP, word for word, plus `frame-ancestors 'none'`);
     - `X-Content-Type-Options: nosniff`;
     - `Referrer-Policy: no-referrer`;
     - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
   - **`release.json`:** `{"commit": "<full 40-character commit>", "engine": "<the value of MODEL_VERSION in packages/engine/src/projection.rs, today horizon-engine-0.4.0>"}`, canonical JSON with sorted keys and one trailing newline. No timestamp, so a rebuild of the same commit stages identical files.
   - **It refuses** (non-zero exit, message naming the reason) a working tree with uncommitted or untracked changes outside ignored paths. It **warns**, and continues, when the commit is not an ancestor of `origin/main` (decision 0022 item 5).
4. **Deploy** (`corepack pnpm run deploy`): runs staging, then `wrangler deploy` with the committed configuration. No token, account ID or secret is read from or written to either repository; Wrangler uses the maintainer's own login. After a deploy it prints the commit and the two addresses.
5. **Checks without a Cloudflare account:**
   - `corepack pnpm run check`: staging, then `wrangler deploy --dry-run` (exit 0), then a local server (`wrangler dev` on `127.0.0.1`, no remote resources) and requests to `/`, `/release.json`, the engine module, a font and an unknown path requested as a page navigation (header `Sec-Fetch-Mode: navigate`, which is when Workers applies the single-page fallback). It asserts: status 200 for each, the unknown path returning `index.html` (single-page fallback), the four headers exactly as above on every response, `release.json` naming the checked-out commit, and the engine module's `Content-Type` `application/wasm`.
   - `corepack pnpm test` (`node --test`): unit tests for the refusal on a dirty tree, the warning when the commit is not on `origin/main`, the `release.json` bytes, the `_headers` bytes, and that the staged file list is `dist/` plus exactly `_headers` and `release.json`.
6. **Documentation:** `docs/architecture/web-shell.md` gains a "Hosting" section (decision 0022, the headers, `release.json`, the commands). `AGENTS.md` gains a "Deploy tooling — 0002-W8" validation block with the commands of deliverables 2 and 5, run after the web shell sequence. `README.md`'s `infra/` row says it holds the deploy tooling.

## Done when

1. `infra/cloud/web/` installs with `corepack pnpm install --frozen-lockfile`; Wrangler resolves to exactly 4.148.0.
2. The tooling license check passes, and fails a planted unlisted license (by unit test on a fixture list).
3. `corepack pnpm run check` passes from a clean checkout of the branch's final commit: dry-run deploy, local headers, single-page fallback, `release.json`, `application/wasm`.
4. Staging twice from the same commit gives byte-identical staging folders.
5. The unit tests of deliverable 5 pass.
6. **Nothing under `apps/web/` changes;** the app's commands (typecheck, lint, format, unit tests, build, both license checks) pass unchanged. Engine code, references, goldens and schemas are unchanged.
7. No secret, token, account ID or real data appears in any committed file.

## Read first

- `AGENTS.md`, `README.md`, `docs/architecture/web-shell.md`.
- Decision records `0022-*` and `0011-*` (item 11, and the license amendment).
- Cloudflare documentation, retrieved 2026-10-21: Workers static assets (`https://developers.cloudflare.com/workers/static-assets/`), headers (`https://developers.cloudflare.com/workers/static-assets/headers/`), single-page applications (`https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/`), custom domains (`https://developers.cloudflare.com/workers/configuration/routing/custom-domains/`), Wrangler configuration (`https://developers.cloudflare.com/workers/wrangler/configuration/`), limits (`https://developers.cloudflare.com/workers/platform/limits/`).

## Guardrails

- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Do** keep credentials server-side and out of every repository; deploying uses the maintainer's own Cloudflare login.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence and the web shell sequence, **excluding the end-to-end browser suite** (`corepack pnpm exec playwright install …` and `corepack pnpm run e2e`), because nothing under `apps/web/` changes (the "Engine-only briefs" rule applies to briefs that change nothing under `apps/web/`). Then, in `infra/cloud/web/`: `node --version`, `corepack pnpm --version`, `corepack pnpm install --frozen-lockfile`, `corepack pnpm run licenses`, `corepack pnpm test`, `corepack pnpm run check`, and `corepack pnpm run check` a second time with a byte comparison of the two staging folders. Record each command with its exit status and counts.

## Exclusions

- **The first real deploy, the custom domain's DNS and the Cloudflare login:** the maintainer's, after merge.
- **Automated deploys (CI) and enforcing "deployed equals published":** later decisions.
- **Any change to the app or its Content Security Policy meta tag.**
- **A link to the hosted site in the app or the README:** added once the first deploy is confirmed.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool versions, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### Implementation — 2026-10-21

- Branch: `codex/0002-W8-hosted-prototype`.
- Source/test revisions: `92c244d6641e8b5aa917b12c06fb1d5667de1e4b` for Rust, CLI, WebAssembly and unchanged web validation; `d32352fc2e5795f95c36288748bd222ff87359ca` for the corrected staging implementation and final tooling sequence. The only source difference is the staging file-copy fix; app, engine and tests are unchanged. Each command row identifies its revision. This record is committed afterward; the handoff reports the final tip.
- Implemented v1.1: separate assets-only tooling, declined install scripts, exact headers, deterministic staging and release metadata, dirty-tree refusal, ancestry warning, local HTTP checks, license policy and documentation. No app, engine, schema, reference or golden changes.
- Tool versions: Rust/cargo 1.99.1, cargo-deny 0.20.2, wasm-bindgen CLI and test runner 0.2.129, Node v24.22.0, corepack 0.36.0, pnpm 12.9.1, Wrangler 4.148.0. Node v24.22.0 was printed before every WebAssembly validation command, including app builds and every staging build.
- The initial v1 install stopped with exit 1 (`ERR_PNPM_IGNORED_BUILDS`, esbuild 0.28.1 and workerd 1.20261006.1). Under v1.1 both scripts are declined; frozen installation succeeds without running them. Preparatory v1.1 checks before the source commit also passed: frozen install (exit 0), tooling licenses (exit 0, 35 package versions), unit tests (exit 0, 12 passed), Wrangler version/help (exit 0).

#### Ordered validation commands

Working directory is the repository root unless shown. Counts aggregate all test harnesses for that invocation; `—` means the command is a build, static check, install, version report or HTTP check rather than a Rust test harness. Every row is a fresh invocation.

| Order | Revision | Directory | Command | Exit | Passed / failed / ignored or observation |
| --- | --- | --- | --- | --- | --- |
| 1 | `92c244d` | `.` | `rustc --version` | 0 | — |
| 2 | `92c244d` | `.` | `cargo --version` | 0 | — |
| 3 | `92c244d` | `.` | `cargo deny --version` | 0 | — |
| 4 | `92c244d` | `.` | `wasm-bindgen --version` | 0 | — |
| 5 | `92c244d` | `.` | `wasm-bindgen-test-runner --version` | 0 | — |
| 6 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 7 | `92c244d` | `.` | `corepack --version` | 0 | 0.36.0 |
| 8 | `92c244d` | `.` | `cargo test -p horizon-app intake` | 0 | 28 / 0 / 0 |
| 9 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values_intake` | 0 | 5 / 0 / 0 |
| 10 | `92c244d` | `.` | `cargo test -p horizon-app answers` | 0 | 10 / 0 / 0 |
| 11 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 / 0 / 0 |
| 12 | `92c244d` | `.` | `cargo test -p horizon-app compare` | 0 | 3 / 0 / 0 |
| 13 | `92c244d` | `.` | `cargo test -p horizon-app immutability` | 0 | 1 / 0 / 0 |
| 14 | `92c244d` | `.` | `cargo test -p horizon-app export` | 0 | 2 / 0 / 0 |
| 15 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 / 0 / 0 |
| 16 | `92c244d` | `.` | `cargo test -p horizon-engine tax` | 0 | 2 / 0 / 0 |
| 17 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 / 0 / 0 |
| 18 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 / 0 / 0 |
| 19 | `92c244d` | `.` | `cargo test -p horizon-app --test reference_values` | 0 | 7 / 0 / 0 |
| 20 | `92c244d` | `.` | `cargo test -p horizon-engine ledger` | 0 | 2 / 0 / 0 |
| 21 | `92c244d` | `.` | `cargo test -p horizon-engine money` | 0 | 2 / 0 / 0 |
| 22 | `92c244d` | `.` | `cargo test -p horizon-app validation` | 0 | 5 / 0 / 0 |
| 23 | `92c244d` | `.` | `cargo test -p horizon-parity` | 0 | 18 / 0 / 0 |
| 24 | `92c244d` | `.` | `cargo test --workspace` | 0 | 112 / 0 / 0 |
| 25 | `92c244d` | `.` | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — |
| 26 | `92c244d` | `.` | `cargo fmt --all --check` | 0 | — |
| 27 | `92c244d` | `.` | `cargo test --workspace --release` | 0 | 112 / 0 / 0 |
| 28 | `92c244d` | `.` | `cargo build --workspace --release` | 0 | — |
| 29 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 30 | `92c244d` | `.` | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — |
| 31 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 32 | `92c244d` | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 18 / 0 / 0 |
| 33 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 34 | `92c244d` | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 1 / 0 / 0 |
| 35 | `92c244d` | `.` | `cargo deny check licenses` | 0 | — |
| 463 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 464 | `92c244d` | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 / 0 / 0 |
| 465 | `92c244d` | `.` | `cargo test -p horizon-wasm` | 0 | 5 / 0 / 0 |
| 466 | `92c244d` | `.` | `node --version` | 0 | v24.22.0 |
| 467 | `92c244d` | `.` | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — |
| 468 | `92c244d` | `apps/web` | `node --version` | 0 | v24.22.0 |
| 469 | `92c244d` | `apps/web` | `corepack --version` | 0 | 0.36.0 |
| 470 | `92c244d` | `apps/web` | `corepack pnpm --version` | 0 | 12.9.1 |
| 471 | `92c244d` | `apps/web` | `corepack pnpm install --frozen-lockfile` | 0 | — |
| 472 | `92c244d` | `apps/web` | `node --version` | 0 | v24.22.0 |
| 473 | `92c244d` | `apps/web` | `corepack pnpm run build:engine` | 0 | — |
| 474 | `92c244d` | `apps/web` | `corepack pnpm run types` | 0 | — |
| 475 | `92c244d` | `apps/web` | `corepack pnpm run typecheck` | 0 | — |
| 476 | `92c244d` | `apps/web` | `corepack pnpm run lint` | 0 | — |
| 477 | `92c244d` | `apps/web` | `corepack pnpm run format:check` | 0 | — |
| 478 | `92c244d` | `apps/web` | `corepack pnpm test` | 0 | Test Files  18 passed (18); Tests  284 passed (284) |
| 479 | `92c244d` | `apps/web` | `node --version` | 0 | v24.22.0 |
| 480 | `92c244d` | `apps/web` | `corepack pnpm run build` | 0 | — |
| 481 | `92c244d` | `apps/web` | `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| 482 | `92c244d` | `infra/cloud/web` | `node --version` | 0 | v24.22.0 |
| 483 | `92c244d` | `infra/cloud/web` | `corepack pnpm --version` | 0 | 12.9.1 |
| 484 | `92c244d` | `infra/cloud/web` | `corepack pnpm install --frozen-lockfile` | 0 | — |
| 485 | `92c244d` | `infra/cloud/web` | `corepack pnpm run licenses` | 0 | Deploy tooling license policy passed (35 package versions). |
| 486 | `92c244d` | `infra/cloud/web` | `corepack pnpm test` | 0 | 12 passed; 0 failed; 0 skipped |
| 487 | `92c244d` | `infra/cloud/web` | `node --version` | 0 | v24.22.0 |
| 488 | `92c244d` | `infra/cloud/web` | `corepack pnpm run check` | 1 | Failed during native recursive copy with EACCES before dry-run; resolved by byte copying in the later revision |
| 489 | `d32352f` | `infra/cloud/web` | `node --version` | 0 | v24.22.0 |
| 490 | `d32352f` | `infra/cloud/web` | `corepack pnpm --version` | 0 | 12.9.1 |
| 491 | `d32352f` | `infra/cloud/web` | `corepack pnpm install --frozen-lockfile` | 0 | — |
| 492 | `d32352f` | `infra/cloud/web` | `corepack pnpm run licenses` | 0 | Deploy tooling license policy passed (35 package versions). |
| 493 | `d32352f` | `infra/cloud/web` | `corepack pnpm test` | 0 | 12 passed; 0 failed; 0 skipped |
| 494 | `d32352f` | `infra/cloud/web` | `node --version` | 0 | v24.22.0 |
| 495 | `d32352f` | `infra/cloud/web` | `corepack pnpm run check` | 0 | dry-run exit 0; 5 HTTP responses passed, including 20 exact header checks, release commit, WASM MIME and SPA fallback |
| 496 | `d32352f` | `infra/cloud/web` | `node --version` | 0 | v24.22.0 |
| 497 | `d32352f` | `infra/cloud/web` | `corepack pnpm run check` | 0 | dry-run exit 0; 5 HTTP responses passed, including 20 exact header checks, release commit, WASM MIME and SPA fallback |

Release levers timing, after the release build: `cargo run --release -p horizon-cli -- levers answers-working-61` exited 3 (partial) in 0.471072 s, below 2 s.

Release WebAssembly intake means (ten runs per case):

```text
v2-working-complete: mean 70.424 ms (10 runs)
v2-solve-spending: mean 149.887 ms (10 runs)
v2-solve-savings: mean 59.814 ms (10 runs)
v2-solve-retirement: mean 100.613 ms (10 runs)
v2-solve-savings-with-range: mean 258.030 ms (10 runs)
```

Separate WebAssembly levers test: 1 passed, exit 0, harness duration 4.97s (Node v24.22.0).

The first release levers invocation exited 3 in 7.371 s, including a 6.94 s Cargo rebuild of standalone dependencies after the workspace release build. It exceeded the wall-clock threshold. The unchanged command was repeated after that build; the timing above is that fresh execution. Both results are retained.

#### Expanded CLI commands

All expanded CLI commands below ran against `92c244d6641e8b5aa917b12c06fb1d5667de1e4b`. Each invocation printed canonical JSON and exactly one newline; the validation checked those bytes and the exit against its returned status. The workspace CLI tests independently compare application/CLI bytes. The rows below give every expansion, in the prescribed command-group order. Status-to-exit mapping is complete 0, partial 3, invalid 1, unsupported 2, incomplete 4; dev-run partial retains 0.

Intake: `cargo run -p horizon-cli -- intake <answers.json>`, each public reference case extracted to a separate synthetic JSON file. These are all 29 W4 and 25 W5 documents.

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

For each fixture row, run `cargo run -p horizon-cli -- <command> <fixture>` for spend, levers, run, export and dev-run; impact appends `packages/app/test-data/empty-rough.json`; compare is `cargo run -p horizon-cli -- compare A-drawdown <fixture>`. Cells are observed exit statuses (one invocation per cell; 336 commands).

| Fixture | Spend | Levers | Impact | Run | Compare | Export | Dev-run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `A-drawdown` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-pass-limit-1` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-roth_before_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-tax_deferred_first` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `B-early-retiree` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `C-partial-base-year-no-taxable` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `D-still-working-rmd-surplus` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `E-senior-2028-loss-carry` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `answers-cap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-underfunded` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61-retire-later` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
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

Additional reference commands:

| Command | Exit | Status |
| --- | --- | --- |
| `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
| `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
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

CLI total: 427 invocations including both release timing invocations; observed exits 0: 131, 1: 118, 2: 46, 3: 122, 4: 10. All expected exits and canonical-output checks passed.

#### Staging, licenses and scope

Both full local checks passed after the file-copy fix. The two staging folders from `d32352fc2e5795f95c36288748bd222ff87359ca` had identical file lists and byte-identical contents: 11 files, 1718421 bytes, comparison exit 0. The staging list was also checked against app dist plus exactly `_headers` and `release.json` by the tooling unit test. Dirty modified, staged and untracked trees refuse; ignored output is allowed. Ancestry warning cases continue. The planted unlisted license and wrong package/version/license fixture cases are rejected.

New direct dependency: `wrangler@4.148.0` (MIT OR Apache-2.0). The independent lockfile pins its transitive closure; no app dependencies changed. Installed tooling closure checked on Linux arm64 (35 package versions):

| Package | Version | License |
| --- | --- | --- |
| `@cloudflare/kv-asset-handler` | 0.5.0 | MIT OR Apache-2.0 |
| `@cloudflare/unenv-preset` | 2.16.2 | MIT OR Apache-2.0 |
| `@cloudflare/workerd-linux-arm64` | 1.20261006.1 | Apache-2.0 |
| `@cspotcode/source-map-support` | 0.8.1 | MIT |
| `@esbuild/linux-arm64` | 0.28.1 | MIT |
| `@img/colour` | 1.1.0 | MIT |
| `@img/sharp-libvips-linux-arm64` | 1.3.3 | LGPL-3.0-or-later |
| `@img/sharp-linux-arm64` | 0.35.4 | Apache-2.0 |
| `@jridgewell/resolve-uri` | 3.1.2 | MIT |
| `@jridgewell/sourcemap-codec` | 1.6.0 | MIT |
| `@jridgewell/trace-mapping` | 0.3.9 | MIT |
| `@poppinss/colors` | 4.1.6 | MIT |
| `@poppinss/dumper` | 0.6.5 | MIT |
| `@poppinss/exception` | 1.2.3 | MIT |
| `@sindresorhus/is` | 7.2.0 | MIT |
| `@speed-highlight/core` | 1.2.24 | CC0-1.0 |
| `blake3-wasm` | 2.1.5 | MIT |
| `cookie` | 1.1.1 | MIT |
| `detect-libc` | 2.1.2 | Apache-2.0 |
| `error-stack-parser-es` | 1.0.5 | MIT |
| `esbuild` | 0.28.1 | MIT |
| `kleur` | 4.1.5 | MIT |
| `miniflare` | 5.20261006.0-alpha | MIT |
| `path-to-regexp` | 6.3.0 | MIT |
| `pathe` | 2.0.3 | MIT |
| `semver` | 7.8.5 | ISC |
| `sharp` | 0.35.4 | Apache-2.0 |
| `supports-color` | 10.2.2 | MIT |
| `undici` | 7.29.1 | MIT |
| `unenv` | 2.0.0-rc.24 | MIT |
| `workerd` | 1.20261006.1 | Apache-2.0 |
| `wrangler` | 4.148.0 | MIT OR Apache-2.0 |
| `ws` | 8.21.0 | MIT |
| `youch` | 4.1.0-beta.10 | MIT |
| `youch-core` | 0.3.3 | MIT |

Exclusions and reasons:

- No real deploy, Cloudflare login or custom-domain DNS operation: expressly reserved for the maintainer after merge. Only dry-run deploys and local-only Wrangler serving ran.
- No automated deployment/CI or enforcement that deployed source is published: later decisions.
- No change under `apps/web/`, to its CSP meta tag, or to engine code, schemas, references or goldens: outside this brief; existing commands and both app license closures passed unchanged.
- No Playwright browser installation or end-to-end browser suite: explicitly excluded by v1.1 and the maintainer because the app does not change. No browser version claim is made.
- No hosted-site link in the app or root README: deferred until the first real deployment is confirmed.
- No push or pull request: not requested. Independent review remains the maintainer's next step.
