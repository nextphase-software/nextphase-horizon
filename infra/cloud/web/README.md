# Horizon deploy tooling

This private package stages the production app and deploys it as Cloudflare
Workers static assets, as specified by [decision 0022](../../../docs/decisions/0022-hosted-prototype.md).
It has its own lockfile and license check; none of its dependencies ships in the
site. Nothing under `apps/web/` is changed by this tooling.

Use the repository's pinned Rust toolchain, wasm-bindgen CLI 0.2.129, Node.js
24.22.0, corepack 0.36.0 and pnpm 12.9.1. From this directory:

```sh
node --version
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm run licenses
corepack pnpm test
corepack pnpm run stage
corepack pnpm run check
```

The workspace configuration declines the `esbuild` and `workerd` install
scripts. Wrangler uses the published platform binaries. If another install
script is requested, escalate it; do not approve it or relax this policy.

`stage` refuses uncommitted or untracked changes outside ignored paths, and
warns and continues if HEAD is not a known ancestor of `origin/main` (including
when that remote reference is unavailable). It builds the engine, installs the
app with its frozen lockfile, then runs the app's `build:engine` and `build`
commands. It replaces ignored `staging/` with exactly the files in `apps/web/dist/`
plus `_headers` and `release.json`. The release contains the full checked-out
commit and the engine's `MODEL_VERSION`, sorted as canonical JSON with one
newline and no timestamp. Staging the same commit twice produces the same bytes.

`check` stages, runs `wrangler deploy --dry-run`, and starts `wrangler dev`
locally on `127.0.0.1` with no remote resources. It checks five responses: the
page, release, engine module, a font, and an unknown page navigation. Every
response must return 200 and the four exact security headers; the engine must
be `application/wasm`, and the unknown page must return `index.html`. It stops
the local server afterward. No Cloudflare account is needed for these checks.

To deploy, the maintainer needs their own Cloudflare login and the
`nextphase.software` zone on that account:

```sh
corepack pnpm exec wrangler login
corepack pnpm run deploy
```

`deploy` stages, then runs Wrangler with the committed `wrangler.jsonc`. After
success it prints the full commit, the custom-domain address, and the actual
`workers.dev` fallback address reported by Wrangler. Login is managed by
Wrangler outside the repository. Do not put tokens, account IDs or secrets in
either the tooling or app. The first real deployment, login and DNS setup are
the maintainer's work after merge.

The configuration has no Worker script or bindings. `_headers` applies the app's
meta CSP plus `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, and
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` to
`/*`. `/release.json` identifies the deployed source.

Public references (retrieved 2026-10-21):
[static assets](https://developers.cloudflare.com/workers/static-assets/),
[headers](https://developers.cloudflare.com/workers/static-assets/headers/),
[single-page applications](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/),
[custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/),
and [limits](https://developers.cloudflare.com/workers/platform/limits/).
