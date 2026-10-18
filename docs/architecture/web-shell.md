# Web shell — 0002-W1 v2

The static app in `apps/web/` uses React 19.3.0, React DOM 19.3.0, Vite 8.3.2
and strict TypeScript 6.0.3. Its package manifest, pnpm 12.9.1 lockfile,
configuration and harness live there; no JavaScript entry is added at the root.
It bundles five existing synthetic fixtures. There is no server API or database.

## Module and transport

`packages/wasm` builds the unpublished `horizon-wasm` cdylib. Its only dependencies
are horizon-app and wasm-bindgen =0.2.129 (already resolved). Eight exports take
JSON strings and return canonical JSON strings: run, scenario, compare,
export_run, import_run, sustainable_spending, levers and input_impact. They call
the corresponding application operations; run uses run_fixture to retain the
fixture's tax pass limit. Shared parsing and canonical envelope serialization
in horizon-app's `json` module reuse existing dependencies. No calculation rule
is added. Errors are returned as the existing code/message/status envelope,
without the CLI's newline, including compare's unsupported-error precedence
and input_impact's rough-input parsing precedence.

`build:engine` compiles release WebAssembly and runs wasm-bindgen --target web
into ignored `src/generated/engine/`. `types` generates TypeScript for every
committed schema into ignored `src/generated/types/`; the page consumes the
sustainable-spending type. No earlier schema, fixture, reference or golden changes.

The main thread creates exactly one module Worker. Only `engine.worker.ts`
imports/initializes WebAssembly. `protocol.ts` defines the discriminated request
union `{id, op, args}` and reply `{id, json}`. Argument tuples are specific to
each operation. The client correlates replies by ID, preserving canonical bytes.
Worker initialization failure rejects requests and shows Calculation unavailable;
no figures are presented as a successful result. Selection changes clear the
previous answer, announce loading and ignore late replies from older selections.

## Page and tokens

The foundation page has a product header, a theme button and a native
sample-household radio group with a fieldset and legend. Supported/Partial/Unsupported status labels include
icons and words. Partial includes the returned omission count. Three figures
come directly from sustainable_spending, entered and headroom, formatted as
whole dollars; each says "today's dollars, per year". Flags are written in words,
and omissions remain exactly as returned. Errors show their status and message
with no figures. Every household is explicitly labeled Sample household.

`tokens.css` maps every DESIGN.md v1 color to the same CSS custom property name,
with separate light/dark values. Typography uses text-*, leading-*, weight-*
and font-body tokens; spacing and radii use space-* and radius-*.
`style.css` uses these semantic names. Amounts, ages and years inherit tabular
lining figures. Plus Jakarta Sans Variable 5.3.0 is self-hosted and its OFL-1.1
license is emitted to `dist/licenses/plus-jakarta-sans-OFL-1.1.txt`.

The operating-system preference applies until the button sets an in-memory
light/dark choice on the document. Explicit choice wins over preference changes;
a reload clears it. Layout is one column below 560px and uses a two-column
label/value layout from 900px. Controls fit 320px and keyboard focus has a 3px
accent outline with 2px offset. There are no charts or animations.

## Security and development

The HTML meta CSP is exactly:

```text
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'
```

All resources, including fonts and the worker/WASM assets, are served locally.
There is no analytics, storage API, cookie write or external request in the app.
The engine remains a pure local calculation module. No hosted authorization
surface is introduced. Existing household financial data is never used.

`dev` builds the module and types, then watches Vite's static production output
and serves it at http://127.0.0.1:5173. Reload after a source rebuild; rerun dev
after Rust/schema changes. This keeps the same CSP in development: Vite HMR's
injected inline scripts/styles would require weakening it. `build` regenerates
the module/types, typechecks and emits the static site to ignored `dist/`.

## Test layers and outstanding gates

- Native horizon-wasm tests compare all eight export results with the typed
  application operations for valid/error inputs and check malformed arguments.
- Vitest/jsdom/Testing Library prove number/status/flag formatting, figures and
  omissions, error presentation, all protocol dispatch operations, out-of-order
  correlation and worker failure handling against stubs.
- Playwright serves the built site in Chromium, Firefox and WebKit at 375×812
  and 1280×800 in both color schemes. Each project selects all five households
  with keyboard events, checks focus/theme precedence/reload behavior, runs axe,
  observes origin requests, traps storage/cookie writes and inspects stored state.
  The harness captures the real application worker for byte-identical run golden
  checks, compares displayed amounts with worker results and the unchanged
  0003-W1 references, and checks the couple's error code. No production test API
  is exposed. Browser versions are attached to test results; screenshots and
  traces are ignored generated evidence.
- Full earlier native/WebAssembly/CLI validation remains required. The CLI
  corpus expansion is defined in the answer and scenario/export fixture guides.
- `licenses` checks production and all packages independently. Production uses
  the strict allow-list plus the named font exception. Only the exact build/test
  package-version-license exceptions from decision 0011's 2026-10-18 amendment
  apply to the full closure. Policy unit tests prove that tool exceptions are
  rejected in production and that other packages, versions and licenses fail.
  See [the exact inventory](../model/dependencies.md#web-shell--0002-w1-v2).

The full browser sequence is documented in README and AGENTS. The implementation
record states actual validation; harness code does not establish a browser pass.
The harness checks the exact CSP meta tag; it does not treat axe's own injected
audit styles as application CSP failures. Designed screens, charts, deployment,
hosting, persistence and HTTP/agent access stay excluded by the brief.

### macOS 27 browser harness

The native household radio group starts with its first option checked. Focus
traversal reaches the theme button, then the checked radio; ArrowDown selects and
focuses each next household without mouse input. Focus traversal uses Alt+Tab
for WebKit on macOS and Tab for Chromium, Firefox and other platforms. All
existing focus, golden/reference, axe, privacy, overflow and theme assertions
remain in place. Labels wrap within a fieldset whose minimum inline size is zero,
and radios retain the visible accent focus ring.

On macOS 27, Firefox 155 can fail with "Could not find profile folder" while
resolving its shared app-data directory. See
[Playwright issue 42768](https://github.com/microsoft/playwright/issues/42768),
retrieved 2026-10-18. The worker-scoped launch-options fixture in `e2e/fixtures.ts`
sets `launchOptions.env.CFFIXED_USER_HOME` only for Firefox projects when
`process.platform === "darwin"`. It creates a fresh empty temporary directory
for each worker's browser launch, including replacement/retry workers, preserves
the other environment variables and deletes that directory after the browser
fixture shuts down. Cleanup retries transient directory-removal failures up to
10 times with a 200 ms retry delay to allow late Firefox writes to finish. The setting is never applied to Chromium, WebKit or other
platforms and never changes the host process's environment.
