# Web shell — 0002-W1 v2

The static app in `apps/web/` uses React 19.3.0, React DOM 19.3.0, Vite 8.3.2
and strict TypeScript 6.0.3. Its package manifest, pnpm 12.9.1 lockfile,
configuration and harness live there; no JavaScript entry is added at the root.
It bundles five existing synthetic fixtures. There is no server API or database.

## Module and transport

`packages/wasm` builds the unpublished `horizon-wasm` cdylib. Its only dependencies
are horizon-app and wasm-bindgen =0.2.129 (already resolved). Nine exports take
JSON strings and return canonical JSON strings: run, scenario, compare,
export_run, import_run, sustainable_spending, levers, input_impact and plan_from_answers. They call
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
no figures are presented as a successful result. Sample metadata is fetched once. Intake calculations announce loading and ignore
late replies after navigation or newer answers.

## Page and tokens

Welcome offers own figures and five invented example households. Examples open
on the plan screen, with Plan, Compare and Export navigation. Own figures
use Your answers, Plan, Compare and Export. Coverage appears only after a result:
"✓ Covers your situation", "△ Leaves out N things" or "! Horizon can't plan for
this yet". Invented figures say "Example household — invented figures". Error
results show their reason without successful figures.

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
accent outline with 2px offset. Charts have compact drawings and table alternatives. Motion respects the system preference.

## Security and development

The HTML meta CSP is exactly:

```text
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'
```

All resources, including fonts and the worker/WASM assets, are served locally.
There is no analytics, cookie write or external request in the app. The only stored item is the own-answers intake described below.
The engine remains a pure local calculation module. No hosted authorization
surface is introduced. Existing household financial data is never used.

`dev` builds the module and types, then watches Vite's static production output
and serves it at http://127.0.0.1:5173. Reload after a source rebuild; rerun dev
after Rust/schema changes. This keeps the same CSP in development: Vite HMR's
injected inline scripts/styles would require weakening it. `build` regenerates
the module/types, typechecks and emits the static site to ignored `dist/`.

## Test layers and outstanding gates

- Native horizon-wasm tests compare all nine export results with the typed
  application operations for valid/error inputs and check malformed arguments.
- Vitest/jsdom/Testing Library prove number/status/flag formatting, figures and
  omissions, error presentation, all protocol dispatch operations, out-of-order
  correlation and worker failure handling against stubs.
- Playwright serves the built site in Chromium and WebKit at 375×812
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
audit styles as application CSP failures. Deployment, hosting and HTTP/agent access stay excluded.

## Question-led intake — 0002-W6 v1.2

The welcome screen replaces Start and the guided household setup. The fifteen
questions use `answers.v2`, with date parts or age, exact text-to-cents parsing
(including k/m suffixes), monthly or yearly money, ranges, uncertainty and later
answers. Hidden questions are omitted. `assumptions` and `not_sure` are always
present; money carries its stated `per`. No monthly/yearly conversion or
calculation rule lives in the interface. The local date at the first start is
retained as `valuation_date`.

One-question, conversation and guided-page styles share one control state.
Switching styles keeps the question and entered answers. Review lists later and
uncertain answers separately, names exclusions, and permits changing only the
rates the person supplies. See my plan always remains available there. The worker
calls `plan_from_answers`; the results head uses `answers-plan.v2` for needed,
unsupported, invalid, worked-out and range outcomes. A plain result reuses
`planHeadline` word for word. The original plan body, comparison and export run
on the returned household input. The what-if panel below adds temporary changes (0002-W7).

### Device storage — decision 0018

Exactly one local-storage item, `horizon.intake.v1`, contains exactly `format`
(`horizon-saved-intake`), `version` (1), `answers` (version 2), `style`
(`one_question`, `conversation`, `guided_page`) and `place` ("1"–"15", "review",
"results"). It contains no result, generated input, copy, export, timestamp or
identifier. Confirmed answers and navigation/style changes save it. A reload
returns to Welcome with Continue with my answers, which resumes the saved place.
Examples do not save or overwrite it. There are no cookies, session storage,
IndexedDB writes, analytics, or requests carrying answers. The CSP is unchanged.

Welcome and Review say: "Your answers are saved on this device only. They are
never sent anywhere." Forget my answers asks once, deletes the item immediately
and returns to Welcome. Unavailable/full storage leaves intake working in memory,
with the required review notice. A loaded envelope must match exactly; its
answers are sent through `plan_from_answers`. Malformed input or an unknown saved
version is deleted with the unreadable-answers notice. Meaningful invalid,
incomplete and unsupported results are valid saved documents. Worker failure
preserves the stored item and reports calculation unavailability.

### Browser and reference coverage

Playwright runs Chromium and WebKit at 375×812 and 1280×800, in light and dark:
eight projects. Firefox is neither installed nor run. Keyboard traversal uses
Alt+Tab for WebKit on macOS, Tab elsewhere. Every captured screen gets axe and
horizontal-overflow checks. The storage trap permits only the named local key,
after entering own figures; other storage and cookie writes fail. Native/worker
byte comparisons, plan and comparison figures, file download/import, print,
coverage words and off-origin checks remain covered. Removed guided-setup tests are replaced by intake flows. Existing outside-plan browser references reopen the same
synthetic input through the plan-file flow.

All 24 version 2 head references are rendered in unit tests. Twenty explicit
control states build answers whose native engine output matches each case byte
for byte. Earlier engine schemas, tests, fixtures, reference files and goldens
are unchanged. `types` generates both version 2 answer contracts from the
committed schemas. No dependency is added.

Full-page screenshots and reports use `HORIZON_EVIDENCE_DIR` when supplied,
otherwise the existing ignored output directories. Validation commands remain
in README and AGENTS; the implementation record reports the actual passes,
versions, counts and exclusions.


## What-if panel — 0002-W7 v1.2

Own-figure results with a household input and a successful result show native
sliders and number boxes below Starting values Horizon used. They cover
retirement age (unless already retired), annual retirement spending, savings,
Social Security amount and start age (unless expecting none), pension amount
(when answered), investment growth and price rises. Starting values and their
answer, range, worked-out or Horizon-used labels come from the answers and the
returned input. Unreachable searches use the input at the search limit and say
that no age or amount works. Ranges have bands; other values have marks except
null worked-out values. Out-of-range starting values extend the track.

A slider sends only on pointer or key release; a number box sends on Enter or
blur after range validation. Every changed control is applied together to a copy
of the answers and sent to `plan_from_answers`. The head announces Working out
your plan, then uses the existing intake head and the returned household input
for the plan body. Obsolete replies are ignored, including after reset or leaving
the screen. An active change says What if: not your answers.

Reset restores the original controls and result. Keep writes changed answers,
removes their uncertainty marks, and saves through the existing device-storage
path. Savings balances are copied from the returned accounts in answer order,
preserving answered cost bases. When no accounts existed or all balances were
zero, the generated taxable account replaces them with its returned balance and
basis. What-if documents, results and intermediate control values are never
stored; only Keep changes the saved answers. Examples retain their existing flow.

The one exact sum allowed by decision 0011 adds returned account balances with
integer cents to initialize Savings today. The UI does not share that total
among accounts or calculate any financial outcome; the engine does both. Rates
use the existing decimal-text conversions. No dependencies or CSP changes.


## Plain results — 0003-W3 v1.2

Plan, Compare and Export use today’s dollars, with the valuation year stated.
The plan opens with its factual headline and one follow-on from sustainable
spending, then what moves it most. Worked-out answers retain the intake head
and have no spending follow-on. Ranged plans introduce the central follow-on
with “At the middle of your ranges”. The plain shortfall explanation names
only the first shortfall year and its returned `shortfall_today` value; an
unreachable worked-out answer keeps that explanation inside the experts layer.

Each screen has one closed, keyboard-operable “Details for experts” section.
The plan keeps its yearly chart/table, shortfall arithmetic and assumptions
there, labelling figures in “dollars of each year”. Compare keeps totals added
across years and every differing line there; each line’s returned monetary
value supplies its own dollar-basis label. Four headline measures remain on
the plain comparison. Export keeps file details and the opening checks there.
Rejected files show the brief’s plain sentence for the failed format, content,
engine-version, rerun or readability check; technical error text is not added
to that plain message.
Every displayed financial figure comes from the engine; no financial values
are derived by the interface. Dates use day, month name and year. Comparison
retirement ages reuse the what-if whole-year age conversion, including leap
birthdays and retirement dates beyond the plan’s end.

The Check screen, navigation step and interface input-impact calls are removed.
The engine operation, binding, protocol dispatch and CLI command remain.
Own-figure plans show “Answers that could change this”: the returned ranked
ranges and then saved not-sure answers, excluding changed what-if answers and
answers already represented by ranges. Each range links to its intake question.
The intake head supplies the only plan coverage chip and left-out list. The
export summary lists saved not-sure answers, uses the displayed plan’s answers
for its headline and follow-on, and keeps tried copies in the summary rather than the plan file.
No export format, engine, schema, reference, golden, dependency or CSP changes.
