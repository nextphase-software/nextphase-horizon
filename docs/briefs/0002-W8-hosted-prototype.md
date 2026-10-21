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
