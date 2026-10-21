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
