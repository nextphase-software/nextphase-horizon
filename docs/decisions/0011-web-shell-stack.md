# 0011 — Web shell stack (React 19 on Vite as a static single-page app in `apps/web`; the engine in the browser through a `horizon-wasm` crate in a Web Worker; TypeScript 6.0, pnpm, Vitest, Playwright with axe; hand-built SVG charts; self-hosted fonts; static hosting)

- Status: Accepted (amendment accepted 2026-10-18)
- Date: 2026-10-17
- Related: [0007](0007-rust-core-typescript-shell.md) — the TypeScript interface calling the WebAssembly module through a thin generated binding; [0010](0010-comparison-export-and-command-line-conventions.md) — WebAssembly parity under Node.js 24.22.0, and the contracts the interface displays; [0012](0012-application-operations-for-answers.md) — the operations the interface calls.

## Context

The first web interface works with sample households only. It stores nothing and has no server, so it can be a static site. Decision 0007 fixed the languages and layering. It did not fix the interface framework, the build tool, how the WebAssembly module reaches the page, or testing and hosting.

Verified on 2026-10-17 against the npm registry and crates.io:
- **Lint toolchain constraints:**
  - `typescript-eslint` 8.71 supports TypeScript below 6.1, so TypeScript 7 is not yet usable with it;
  - `eslint-plugin-jsx-a11y` 6.10 supports ESLint up to 9.
- **Licenses:**
  - React, Vite, Vitest, Testing Library, ESLint, Prettier, pnpm and `json-schema-to-typescript`: MIT;
  - TypeScript and Playwright: Apache-2.0;
  - `axe-core`: MPL-2.0;
  - Plus Jakarta Sans: OFL-1.1;
  - `wasm-bindgen`: MIT OR Apache-2.0, already resolved in `Cargo.lock`.
- **Repository layout:** `apps` and `packages` already exist as top-level directories.

## Decision

1. **The interface is React 19 built with Vite 8 into a static single-page app.** React offers well-established accessible patterns. Vite produces plain static files, so no server or server-side rendering is needed.
2. **The app is self-contained in `apps/web/`,** with its own `package.json`, lockfile and TypeScript configuration. No JavaScript configuration is added at the repository root.
3. **TypeScript 6.0 in strict mode, Node.js 24.22.0 and pnpm 12,** pinned through `packageManager` and `engines`. Moving to TypeScript 7, ESLint 10 or a later Node.js release is a separate change, made once the lint toolchain supports it.
4. **The engine reaches the browser through a new crate, `horizon-wasm`** (`packages/wasm`, `cdylib`, unpublished), which depends on `horizon-app` and `wasm-bindgen`.
   - Each exported function takes and returns canonical JSON strings, one per application operation. No calculation rule lives in the binding.
   - It is built with `wasm-bindgen-cli` (`--target web`).
   - TypeScript types are generated from the published JSON Schemas, so the interface's types cannot drift from the engine's contracts.
5. **The engine runs in a Web Worker,** so repeated runs never block the page. Results are displayed exactly as returned; the interface formats numbers but never computes financial values.
6. **Charts are hand-built SVG components following `DESIGN.md`:**
   - solid baseline, dashed scenario;
   - direct labels;
   - a table alternative for every chart;
   - a compact drawing at phone width.
7. **Fonts are self-hosted** (Plus Jakarta Sans), with the license file shipped. No request goes to a font service.
8. **State stays in memory.** Sample households are bundled. Nothing entered is written to storage, cookies or a server.
9. **Tests:**
   - **Unit:** Vitest with jsdom and Testing Library.
   - **End to end:** Playwright in Chromium, Firefox and WebKit, at 375 px and 1280 px, in light and dark themes, including keyboard-only flows. axe checks accessibility on every screen.
   - **Numbers:** a test proves the figures shown equal the engine's output.
10. **Lint and format:** ESLint 9 with `typescript-eslint`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react-hooks`; Prettier 3.
    - **License check:** JavaScript dependencies are checked under the same policy as the Rust ones, plus OFL-1.1 for the font. MPL-2.0 is allowed only for test-only `axe-core`, which never ships in the built site.
11. **Hosting:** static files built from a recorded public commit.
    - No analytics, cookies or third-party scripts.
    - Content Security Policy: `default-src 'self'`, with `'wasm-unsafe-eval'` in `script-src` for the WebAssembly module.
    - A later deployment brief chooses the host and domain.
12. **Versions are pinned in the brief that adds them,** at the newest release at least 14 days old within these majors, verified on the brief's date.

## Consequences

- The web interface can be built in milestones on one fixed stack, with types generated from the engine's contracts.
- **New dependencies:** JavaScript only; the Rust side adds no crate beyond `wasm-bindgen`.
- **Security:** a strict Content Security Policy, no third-party requests and no stored financial data.
- **Upkeep:** the TypeScript toolchain is pinned and updated deliberately.

## Amendment — 2026-10-18: JavaScript licenses for shipped code and for build and test tools

Accepted 2026-10-18.

Found while implementing brief 0002-W1: the pinned toolchain brings in build, lint and test packages under licenses outside item 10's list. None of them reaches the built site. The production dependency closure is `react`, `react-dom` and `scheduler` (MIT) and the font package (OFL-1.1).

A1. **Shipped code keeps the strict list.** Every package in the production dependency closure is MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0 or 0BSD, or OFL-1.1 for the font package. No exception applies to shipped code.

A2. **Build- and test-only packages may also use MPL-2.0, MIT-0, CC0-1.0, CC-BY-4.0, BlueOak-1.0.0, Python-2.0 and PSF-2.0,** each only as an exact package and version exception listed in the license check. This follows the Rust policy, which allows a single crate by exact version in `deny.toml`. An exception for `lightningcss` also covers its per-platform binary packages (`lightningcss-<platform>`) at the same version, since each operating system resolves a different one.

A3. **Escalate, never allow:**
   - any other license;
   - a listed license on a package or version that is not in the exception list;
   - any license outside the strict list in shipped code.

   A version update that changes the exception list is part of that update's brief.

A4. **This replaces** item 10's sentence allowing MPL-2.0 only for test-only `axe-core`. The rest of item 10, and the three-browser matrix of item 9, are unchanged.
