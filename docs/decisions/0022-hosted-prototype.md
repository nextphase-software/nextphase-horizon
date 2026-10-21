# 0022 — Hosted prototype (Workers static assets at horizon.nextphase.software; deployed by the maintainer with one script from a clean commit, which the site records; deploy tooling kept apart from the app)

- Status: Accepted
- Date: 2026-10-21
- Related:
  - [0011](0011-web-shell-stack.md), item 11 — static Cloudflare hosting from a recorded public commit with a strict Content Security Policy, leaving the product and the domain to the deploy brief; and its license amendment, whose allow-list the deploy tooling reuses.

## Context

The web app is a static single-page app: the production build is 9 files, 1.3 MB, the largest the 0.94 MB engine module. Decision 0011 chose static Cloudflare hosting and left two choices open: Workers static assets or Pages, and the domain.

Verified on 2026-10-21 against Cloudflare's documentation and Wrangler 4.148.0:

- **Workers static assets is the recommended product for a new static site or single-page app;** Pages continues, but new features go to Workers ([Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)).
- **A `_headers` file in the asset directory sets response headers natively** ([headers](https://developers.cloudflare.com/workers/static-assets/headers/)), and `assets.not_found_handling = "single-page-application"` serves `index.html` for page navigations that match no file.
- **Requests to static assets are free and unlimited on every plan;** the Free plan allows 20,000 files per version and 25 MiB per file ([limits](https://developers.cloudflare.com/workers/platform/limits/)).
- **With this record's configuration,** `wrangler deploy --dry-run` succeeds, and `wrangler dev` serves the page, `release.json`, the engine module (`application/wasm`) and an unknown navigation (`index.html`) with every header below.
- **Wrangler 4.148.0** (MIT OR Apache-2.0) installs 36 packages. All are MIT, Apache-2.0, ISC or MIT OR Apache-2.0, except the `@img/sharp-libvips-*` platform binaries at 1.3.3 (LGPL-3.0-or-later), pulled in by its local simulator, and `@speed-highlight/core@1.2.24` (CC0-1.0).
- **The app's Content Security Policy is a meta tag,** which cannot carry `frame-ancestors`.

## Decision

1. **Host the production build on Workers static assets,** assets only, with no Worker script and `not_found_handling = "single-page-application"`.
2. **Serve it at `horizon.nextphase.software`** as a Workers custom domain, with the `workers.dev` address as a fallback.
3. **Keep the deploy tooling in `infra/cloud/web/`,** with its own `package.json`, lockfile and license check, so the app's dependency closures do not change. Wrangler is pinned to 4.148.0.
4. **Allow two exact exceptions in that tooling closure only:** `@img/sharp-libvips-*@1.3.3` (LGPL-3.0-or-later) and `@speed-highlight/core@1.2.24` (CC0-1.0). Nothing from `infra/cloud/web/` ships in the site; any other license fails the check.
5. **Deploy with one script run by the maintainer** under their own Cloudflare login. It builds from a clean checkout, stages the build with a `_headers` file and a `release.json` naming the commit and engine version, and deploys. It refuses a dirty working tree and warns when the commit is not on the public `main`. No token, account ID or secret is stored in the repository.
6. **Send these headers on every response:** the app's Content Security Policy word for word plus `frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: no-referrer`; and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`. There are no analytics, cookies or third-party scripts.
7. **Leave the app unchanged.** A release is identified by `/release.json`.

## Consequences

- The site stays within the Free plan, because static asset requests are free and unlimited.
- Staging is reproducible: `release.json` carries no timestamp, so the same commit stages identical files.
- Automated deploys, and making every deploy match a public commit by rule, are left to later decisions.

## Amendment — 2026-10-21: analytics, cookies and third-party scripts

Accepted 2026-10-21.

Item 6's sentence "There are no analytics, cookies or third-party scripts" is removed, following the amendment to [decision 0011](0011-web-shell-stack.md) of the same date. The headers in item 6 stay as they are. A hosting platform that inserts its own script into served pages, such as an analytics beacon, is blocked by the Content Security Policy until a brief allows it.
