BRIEF VERSION: 0005-W2 v1 (2026-10-19)

# 0005-W2 — Tidy-up across the plan, comparison and export screens

## Outcome

The plan, comparison and export screens say true things in two less common situations: when the plan ends before the retirement date, and when savings run short before retirement. The comparison chart labels each shortfall beside its own marker. The export screen's printed page, headings, screen-reader text and download button are corrected, and its tests check the full wording. Nothing about any calculation changes.

## Deliverables

1. **Plan screen title and answers** (brief 0003-W2 v1.1, deliverable 5). `<end>` is the plan-end age; `A` and `<year>` the age and year of the first year with `shortfall > 0`. "Outside the plan" means the person is not retired and no projected year contains the retirement date.
   - **Title:** "Do your savings last?" when the person is retired **or** the retirement date is outside the plan; otherwise "Can you retire at <age>?" as before.
   - **Answer 1:**
     - outside the plan: "Retirement falls after the plan ends: savings run short at age <A> (<year>)." or "Retirement falls after the plan ends: savings last to <end>.";
     - not retired, and the first shortfall year is before the retirement-date year: "No: savings run short at age <A> (<year>), before you retire.";
     - otherwise as before.
   - **Answer 2:** outside the plan: "Retirement falls after the plan ends, so the plan has no retirement spending to test."; otherwise as before.
   - These sentences are the same functions the export summary already reuses, so the summary changes with them.
2. **Comparison chart labels** (brief 0004-W1 v1.1, deliverable 6.6):
   - each "<plan name>: Runs short at <age>" label sits beside its own dotted marker: to the left of the marker when the marker is in the right half of the chart, otherwise to its right;
   - the baseline's label is on the first label row and the copy's on the second, so the two never overlap;
   - labels stay inside the chart's drawing area at 375 px and 1280 px.
3. **Export screen** (brief 0005-W1):
   1. **One h1:** the summary's title "Horizon plan summary" is not an `h1`; the screen keeps one `h1` ("Take your plan with you"). The printed page still shows the title.
   2. **Print colours:** in print, every colour token (including lines, borders and the status colours) uses its light-theme value, so an error card prints in light colours from the dark theme.
   3. **Screen readers:** the "≈" in the summary's "Rough value" tag is hidden from screen readers, as in the input check; no `role="alert"` element contains another.
   4. **No omissions:** with an empty omission list, the summary's status line reads "<status word>. No omissions are listed."
   5. **Download button:** "Download plan file" uses the primary button style, as in reference screen 6.
   6. **Results cache:** the reuse of plan results across screens keeps at most the eight most recently used households, so a long session does not hold every edit's results.
4. **Tests that check the whole text:**
   - the non-JSON rejection asserts "This file did not pass the check of the file format, so Horizon did not open it." and, with a household open, that the household, its copies and rough marks are unchanged (the re-download equals the original);
   - the summary's header line is asserted exactly;
   - the "the rerun" check name is asserted as literal text, not built from the code under test;
   - copy lines are asserted in creation order, each as literal text;
   - the "Plan end age 65" case in brief 0005-W1's Done when 3 also asserts its status word.

## Done when

1. **Plan screen and export summary** (native `horizon-engine-0.4.0` CLI, verified 2026-10-19):

   | Case | Title | Answer 1 | Answer 2 |
   | --- | --- | --- | --- |
   | working sample, plan end age 65 (edited in the setup) | "Do your savings last?" | "Retirement falls after the plan ends: savings last to 65." | "Retirement falls after the plan ends, so the plan has no retirement spending to test." |
   | `answers-underfunded` | "Can you retire at 66?" | "No: savings run short at age 61 (2026), before you retire." | "Savings run short even with no retirement spending." |
   | `answers-underfunded`, plan end age 65 (edited in the setup) | "Do your savings last?" | "Retirement falls after the plan ends: savings run short at age 61 (2026)." | "Retirement falls after the plan ends, so the plan has no retirement spending to test." |

   The same answer 1 and answer 2 appear in the export summary for those cases. For the working sample, `synthetic-retired` and `A-drawdown`, every title and answer is unchanged.
2. **Comparison chart:** for the working sample with "Retire a year earlier, at 65", both labels are drawn, each within 160 px horizontally of its own marker and inside the drawing area, without overlapping, at 375 px and 1280 px.
3. **Export:** deliverable 3 holds and is tested: one `h1`; light print colours from the dark theme, including a failed-copy error card; the hidden "≈" and no nested alerts; the zero-omission sentence (a unit test); the primary download button; a unit test that the results cache keeps eight households.
4. **Tests:** deliverable 4's assertions exist and pass.
5. **Earlier guarantees:** all 0002-W1 to 0005-W1 checks pass, updated only where this brief changes a sentence; axe reports no violations; no horizontal page scroll at 375 px; nothing stored or requested off-origin; the suite passes on Linux and on macOS; Rust validation and licences unchanged; no new dependency, schema, golden or engine change.

## Read first

- Briefs 0003-W2, 0004-W1 and 0005-W1 (the screens this tidies), `DESIGN.md`, `AGENTS.md`, decision record 0011 (item 5).
- `docs/briefs/assets/design-v1/04-baseline.html`, `05-compare.html` and `06-export.html`.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0005-W1 sequence in `AGENTS.md`, including Playwright install and `corepack pnpm run e2e` in all three browsers. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Any change to a calculation, the engine, a schema or the plan file:** none.
- **New screens or features:** none; this milestone corrects wording, layout and tests on existing screens.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.


### Implementation — 2026-10-19

**Branch:** `codex/0005-W2-tidy-up`.
**Final source/test revision:** `db4bb3ec3705d380edfaa78ae90d2fa0f3b2775a`.
This record follows the source/test revision; the final branch tip is reported
separately at handoff. No push, main mutation or hook bypass was performed.

The plan and export summary share the corrected outside-plan and
before-retirement-shortfall answers. The plan title follows the same coverage
rule. Comparison labels sit six SVG units beside their own markers, to the left
in the right half and to the right otherwise, on separate baseline/copy rows.
Rendered geometry tests check proximity, containment and non-overlap at both
viewport widths; unit tests cover both marker sides.

Export keeps one HTML `h1`. The preview title is an `h2`; the print-only title
uses an explicit level-one heading role on a paragraph, preserving the printed
heading and its appearance without another HTML `h1`. Every print colour token
uses the light palette. Tests check the full palette and a failed-copy card's
background, border and status colours. The rough symbol is hidden from assistive
technology, import rejection alerts are not nested, empty omissions have their
own sentence, and download uses the primary style. The results cache evicts the
least recently used household beyond eight, retaining pending calls for reuse.

Whole-text assertions cover the non-JSON rejection, unchanged download/copies/
rough marks after rejection, both header variants, literal rerun check wording,
all six copy lines in creation order, and the edited age-65 status. Both outside-
plan cases are edited through setup and checked on Plan and Export. Working,
retired and drawdown reference answers remain covered by the earlier suite.

The changes were checked against the committed design references for screens
4–6. The primary download action follows screen 6. The brief's corrected words,
marker positions and accessible/print semantics are the intended differences;
no broader redesign was made.

**Dependencies:** none added or changed. Engine, calculation, schemas, fixtures,
references, goldens, dependency manifests/locks and plan-file bytes are unchanged.
The source commits passed the public-boundary hooks.

**Validation revisions and environment:** Rust/CLI commands 1–403 ran with Rust
inputs identical to starting revision `1ef6b4df0ce9242bfbfdca23910429402ba3fe5c`
and the final source revision; web edits were in progress. Commands 404–407
selected the unchanged web toolchain and installed the frozen lockfile before
source commit `665977a0555fd33414f2f00a84801a9158d7675e`. Commands 408–420 used
that source revision. Commands 421–424 used
`fc0fe301864b6e32dd47986ec930a9a13bce28e3`. Commands 425–433 used
`91ab43b5fff88f3985e566ad06342a50db7561ae`. Commands 434 onward used the final
source/test revision. The final revision only changes web source/tests/styles;
Rust inputs remain identical throughout.

Linux, Rust 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129,
Node v24.22.0, corepack 0.36.0, pnpm 12.9.1 and Playwright 1.63.0 were used.
Every WebAssembly build/test has a recorded Node version in the sequence below;
the same installed Node executable directory and runner were used throughout.

The first release levers invocation took 5.333 seconds, including 4.92 seconds
of Cargo compilation for package-specific dependency features. With compilation
complete, fresh invocations took 0.456 and **0.431 seconds**, both exit 3, satisfying
the two-second runtime gate. The isolated WebAssembly levers harness reported
**6.04 seconds**, 1 passed / 0 failed / 13 filtered, exit 0.

**Corrections during validation:** the first full browser attempt was stopped
after its print-colour assertion compared minified `#fff` with `#ffffff`.
The assertion now expands equivalent short hex values before comparing the
full light palette. The next attempt exposed the missing level-one print
heading after removing the duplicate HTML `h1`. The first targeted fix retained
the native `h2`, which Playwright still classified at level two; the final
print-only paragraph has an explicit heading role and level one. Interrupted
and failed attempts are recorded below; they are not counted as passes.

**Final results:** workspace tests passed 75/75 in debug and release; native parity
15/15; WebAssembly parity 14/14; browser binding tests 2/2; web unit tests 93/93 in
14 files. The final Playwright run passed **48/48 tests across 12 projects** in 31.4
minutes, with no retries or unexpected results, covering Chromium, Firefox and
WebKit, 375×812 and 1280×800, light and dark. The final targeted dark Chromium export
check passed 1/1. Browser-version annotations report chromium **153.0.8010.12**;
firefox **155.0**; webkit **26.6**. axe, keyboard, exact text/byte parity, print,
responsive overflow and privacy assertions passed. Rust and both web
dependency-closure licence checks passed. There are 1,332 fresh final-run screenshot
captures (111 per project) and 4 one-page Letter PDFs, plus the HTML/JSON Playwright
reports, retained outside the repository; earlier attempts are kept separately. Each
screen is captured in every browser/size/theme project.

**Exclusions and limitations:** no calculation, engine, schema or plan-file
change, and no new screen or feature, as the brief excludes them. No dependency
was needed. macOS execution is not available in this Linux container and is not
claimed; its suite remains for a macOS runner. Independent review must be done
by another reviewer and is not claimed here. No other brief deliverable is
excluded.

**Commands and observed results:** commands use the workspace root unless the
working-directory column says `apps/web`. Counts sum the harnesses invoked by
that command, including filtered suites; CLI nonzero exits are the expected
status codes, not failures. Every CLI output was freshly parsed and checked for
canonical JSON and exactly one trailing newline; the Rust CLI suite also checks
application byte parity. All 48 fixture names, 5 extra reference comparison pairs,
26 current golden imports, 3 rejection imports and the explicit rough reference
were expanded. No placeholder command is counted as a run.

Preparation also ran `corepack pnpm exec prettier --write` on each changed web
source/test/style file (exit 0), `git diff --check` (exit 0), and
`git diff --exit-code HEAD -- packages Cargo.toml Cargo.lock rust-toolchain.toml docs/model docs/briefs/assets apps/web/package.json apps/web/pnpm-lock.yaml`
(exit 0 before the first source commit). A subsequent focused lint/typecheck
pair during the print-heading correction also exited 0. No Rust or JavaScript
license policy or dependency configuration changed.

| # | Directory | Command | Exit | Counts / observation |
| --- | --- | --- | ---: | --- |
| 1 | `.` | `node --version` | 0 | v24.22.0 |
| 2 | `.` | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 |
| 3 | `.` | `cargo test -p horizon-app answers` | 0 | 9 passed; 0 failed; 0 ignored |
| 4 | `.` | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed; 0 failed; 0 ignored |
| 5 | `.` | `cargo test -p horizon-app compare` | 0 | 3 passed; 0 failed; 0 ignored |
| 6 | `.` | `cargo test -p horizon-app immutability` | 0 | 1 passed; 0 failed; 0 ignored |
| 7 | `.` | `cargo test -p horizon-app export` | 0 | 2 passed; 0 failed; 0 ignored |
| 8 | `.` | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed; 0 failed; 0 ignored |
| 9 | `.` | `cargo test -p horizon-engine tax` | 0 | 2 passed; 0 failed; 0 ignored |
| 10 | `.` | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed; 0 failed; 0 ignored |
| 11 | `.` | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed; 0 failed; 0 ignored |
| 12 | `.` | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed; 0 failed; 0 ignored |
| 13 | `.` | `cargo test -p horizon-engine ledger` | 0 | 2 passed; 0 failed; 0 ignored |
| 14 | `.` | `cargo test -p horizon-engine money` | 0 | 2 passed; 0 failed; 0 ignored |
| 15 | `.` | `cargo test -p horizon-app validation` | 0 | 5 passed; 0 failed; 0 ignored |
| 16 | `.` | `cargo test -p horizon-parity` | 0 | 15 passed; 0 failed; 0 ignored |
| 17 | `.` | `cargo test --workspace` | 0 | 75 passed; 0 failed; 0 ignored |
| 18 | `.` | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | Passed (no test count) |
| 19 | `.` | `cargo fmt --all --check` | 0 | Passed (no test count) |
| 20 | `.` | `cargo test --workspace --release` | 0 | 75 passed; 0 failed; 0 ignored |
| 21 | `.` | `cargo build --workspace --release` | 0 | Passed (no test count) |
| 22 | `.` | `node --version` | 0 | v24.22.0 |
| 23 | `.` | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | Passed (no test count) |
| 24 | `.` | `node --version` | 0 | v24.22.0 |
| 25 | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed; 0 failed; 0 ignored |
| 26 | `.` | `cargo deny check licenses` | 0 | licenses ok |
| 27 | `.` | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON; partial |
| 28 | `.` | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON; complete |
| 29 | `.` | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON; partial |
| 30 | `.` | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 31 | `.` | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 32 | `.` | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 33 | `.` | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON; partial |
| 34 | `.` | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON; partial |
| 35 | `.` | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON; partial |
| 36 | `.` | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 37 | `.` | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON; partial |
| 38 | `.` | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON; partial |
| 39 | `.` | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON; partial |
| 40 | `.` | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON; partial |
| 41 | `.` | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 42 | `.` | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 43 | `.` | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON; invalid |
| 44 | `.` | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 45 | `.` | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 46 | `.` | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 47 | `.` | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 48 | `.` | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 49 | `.` | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 50 | `.` | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 51 | `.` | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 52 | `.` | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 53 | `.` | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON; invalid |
| 54 | `.` | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 55 | `.` | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON; invalid |
| 56 | `.` | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 57 | `.` | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON; partial |
| 58 | `.` | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 59 | `.` | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 60 | `.` | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 61 | `.` | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 62 | `.` | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 63 | `.` | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON; partial |
| 64 | `.` | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON; complete |
| 65 | `.` | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON; partial |
| 66 | `.` | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON; unsupported |
| 67 | `.` | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 68 | `.` | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 69 | `.` | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 70 | `.` | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 71 | `.` | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 72 | `.` | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 73 | `.` | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 74 | `.` | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 75 | `.` | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 76 | `.` | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON; complete |
| 77 | `.` | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON; partial |
| 78 | `.` | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 79 | `.` | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 80 | `.` | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 81 | `.` | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON; partial |
| 82 | `.` | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON; partial |
| 83 | `.` | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON; partial |
| 84 | `.` | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 85 | `.` | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON; partial |
| 86 | `.` | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON; partial |
| 87 | `.` | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON; partial |
| 88 | `.` | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON; partial |
| 89 | `.` | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 90 | `.` | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 91 | `.` | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON; invalid |
| 92 | `.` | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 93 | `.` | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 94 | `.` | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 95 | `.` | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 96 | `.` | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 97 | `.` | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 98 | `.` | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 99 | `.` | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 100 | `.` | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 101 | `.` | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON; invalid |
| 102 | `.` | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 103 | `.` | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON; invalid |
| 104 | `.` | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 105 | `.` | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON; partial |
| 106 | `.` | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 107 | `.` | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 108 | `.` | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 109 | `.` | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 110 | `.` | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 111 | `.` | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON; partial |
| 112 | `.` | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON; complete |
| 113 | `.` | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON; partial |
| 114 | `.` | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON; unsupported |
| 115 | `.` | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 116 | `.` | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 117 | `.` | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 118 | `.` | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 119 | `.` | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 120 | `.` | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 121 | `.` | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 122 | `.` | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 123 | `.` | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 124 | `.` | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 125 | `.` | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 126 | `.` | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 127 | `.` | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 128 | `.` | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 129 | `.` | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 130 | `.` | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 131 | `.` | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 132 | `.` | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 133 | `.` | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 134 | `.` | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 135 | `.` | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 136 | `.` | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 137 | `.` | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 138 | `.` | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 139 | `.` | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 140 | `.` | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 141 | `.` | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 142 | `.` | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 143 | `.` | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 144 | `.` | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 145 | `.` | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 146 | `.` | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 147 | `.` | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 148 | `.` | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 149 | `.` | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 150 | `.` | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 151 | `.` | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 152 | `.` | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON; invalid |
| 153 | `.` | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 154 | `.` | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 155 | `.` | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 156 | `.` | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 157 | `.` | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 158 | `.` | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 159 | `.` | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 160 | `.` | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 161 | `.` | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON; partial |
| 162 | `.` | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 163 | `.` | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 164 | `.` | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 165 | `.` | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 166 | `.` | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 167 | `.` | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 168 | `.` | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 169 | `.` | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON; unsupported |
| 170 | `.` | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 171 | `.` | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON; complete |
| 172 | `.` | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON; partial |
| 173 | `.` | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON; complete |
| 174 | `.` | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON; partial |
| 175 | `.` | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 176 | `.` | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 177 | `.` | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 178 | `.` | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON; partial |
| 179 | `.` | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON; partial |
| 180 | `.` | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON; partial |
| 181 | `.` | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 182 | `.` | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON; partial |
| 183 | `.` | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON; partial |
| 184 | `.` | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON; partial |
| 185 | `.` | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON; partial |
| 186 | `.` | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 187 | `.` | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 188 | `.` | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON; invalid |
| 189 | `.` | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 190 | `.` | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 191 | `.` | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 192 | `.` | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 193 | `.` | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 194 | `.` | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 195 | `.` | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 196 | `.` | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 197 | `.` | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 198 | `.` | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON; invalid |
| 199 | `.` | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 200 | `.` | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON; invalid |
| 201 | `.` | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 202 | `.` | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON; partial |
| 203 | `.` | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 204 | `.` | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 205 | `.` | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 206 | `.` | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 207 | `.` | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 208 | `.` | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON; partial |
| 209 | `.` | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON; complete |
| 210 | `.` | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON; partial |
| 211 | `.` | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON; unsupported |
| 212 | `.` | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 213 | `.` | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 214 | `.` | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 215 | `.` | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 216 | `.` | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 217 | `.` | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 218 | `.` | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 219 | `.` | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 220 | `.` | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 221 | `.` | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON; complete |
| 222 | `.` | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON; partial |
| 223 | `.` | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 224 | `.` | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 225 | `.` | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 226 | `.` | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON; partial |
| 227 | `.` | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON; partial |
| 228 | `.` | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON; partial |
| 229 | `.` | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 230 | `.` | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON; partial |
| 231 | `.` | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON; partial |
| 232 | `.` | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON; partial |
| 233 | `.` | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON; partial |
| 234 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 235 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 236 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON; invalid |
| 237 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 238 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 239 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 240 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 241 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 242 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 243 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 244 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 245 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 246 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON; invalid |
| 247 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 248 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON; invalid |
| 249 | `.` | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 250 | `.` | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON; partial |
| 251 | `.` | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 252 | `.` | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 253 | `.` | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 254 | `.` | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 255 | `.` | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 256 | `.` | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON; partial |
| 257 | `.` | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON; complete |
| 258 | `.` | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON; partial |
| 259 | `.` | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON; unsupported |
| 260 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 261 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 262 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 263 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 264 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 265 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 266 | `.` | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 267 | `.` | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 268 | `.` | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 269 | `.` | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 270 | `.` | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 271 | `.` | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 272 | `.` | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 273 | `.` | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 274 | `.` | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON; complete |
| 275 | `.` | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON; partial |
| 276 | `.` | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 277 | `.` | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 278 | `.` | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 279 | `.` | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON; partial |
| 280 | `.` | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON; partial |
| 281 | `.` | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON; partial |
| 282 | `.` | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 283 | `.` | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON; partial |
| 284 | `.` | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON; partial |
| 285 | `.` | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON; partial |
| 286 | `.` | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON; partial |
| 287 | `.` | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 288 | `.` | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 289 | `.` | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON; invalid |
| 290 | `.` | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 291 | `.` | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 292 | `.` | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 293 | `.` | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 294 | `.` | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 295 | `.` | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 296 | `.` | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 297 | `.` | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 298 | `.` | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 299 | `.` | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON; invalid |
| 300 | `.` | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 301 | `.` | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON; invalid |
| 302 | `.` | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 303 | `.` | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON; partial |
| 304 | `.` | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON; partial |
| 305 | `.` | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 306 | `.` | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 307 | `.` | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 308 | `.` | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 309 | `.` | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON; partial |
| 310 | `.` | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON; complete |
| 311 | `.` | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON; partial |
| 312 | `.` | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON; unsupported |
| 313 | `.` | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 314 | `.` | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 315 | `.` | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 316 | `.` | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 317 | `.` | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 318 | `.` | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 319 | `.` | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 320 | `.` | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 321 | `.` | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 322 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON; partial |
| 323 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON; complete |
| 324 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON; complete |
| 325 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON; complete |
| 326 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON; complete |
| 327 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON; partial |
| 328 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON; partial |
| 329 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON; partial |
| 330 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON; complete |
| 331 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON; partial |
| 332 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON; partial |
| 333 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON; partial |
| 334 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON; partial |
| 335 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON; partial |
| 336 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON; partial |
| 337 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON; complete |
| 338 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON; complete |
| 339 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON; complete |
| 340 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON; complete |
| 341 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON; partial |
| 342 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON; complete |
| 343 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON; partial |
| 344 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON; complete |
| 345 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON; complete |
| 346 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON; complete |
| 347 | `.` | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON; complete |
| 348 | `.` | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON; invalid |
| 349 | `.` | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON; unsupported |
| 350 | `.` | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON; unsupported |
| 351 | `.` | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON; complete |
| 352 | `.` | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON; partial |
| 353 | `.` | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON; complete |
| 354 | `.` | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON; complete |
| 355 | `.` | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON; complete |
| 356 | `.` | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON; partial |
| 357 | `.` | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON; partial |
| 358 | `.` | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON; partial |
| 359 | `.` | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON; complete |
| 360 | `.` | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON; partial |
| 361 | `.` | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON; partial |
| 362 | `.` | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON; partial |
| 363 | `.` | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON; partial |
| 364 | `.` | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON; invalid |
| 365 | `.` | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON; invalid |
| 366 | `.` | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON; invalid |
| 367 | `.` | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON; invalid |
| 368 | `.` | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON; invalid |
| 369 | `.` | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON; invalid |
| 370 | `.` | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON; invalid |
| 371 | `.` | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON; invalid |
| 372 | `.` | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 373 | `.` | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON; invalid |
| 374 | `.` | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON; invalid |
| 375 | `.` | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON; invalid |
| 376 | `.` | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON; invalid |
| 377 | `.` | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON; invalid |
| 378 | `.` | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON; invalid |
| 379 | `.` | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON; invalid |
| 380 | `.` | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON; partial |
| 381 | `.` | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON; partial |
| 382 | `.` | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON; complete |
| 383 | `.` | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON; complete |
| 384 | `.` | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON; complete |
| 385 | `.` | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON; complete |
| 386 | `.` | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON; partial |
| 387 | `.` | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON; complete |
| 388 | `.` | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON; partial |
| 389 | `.` | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON; unsupported |
| 390 | `.` | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON; complete |
| 391 | `.` | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON; complete |
| 392 | `.` | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON; unsupported |
| 393 | `.` | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON; unsupported |
| 394 | `.` | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON; unsupported |
| 395 | `.` | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON; unsupported |
| 396 | `.` | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON; unsupported |
| 397 | `.` | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON; complete |
| 398 | `.` | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON; complete |
| 399 | `.` | `node --version` | 0 | v24.22.0 |
| 400 | `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed; 0 failed; 0 ignored |
| 401 | `.` | `cargo test -p horizon-wasm` | 0 | 2 passed; 0 failed; 0 ignored |
| 402 | `.` | `node --version` | 0 | v24.22.0 |
| 403 | `.` | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | Passed (no test count) |
| 404 | `apps/web` | `node --version` | 0 | v24.22.0 |
| 405 | `apps/web` | `corepack --version` | 0 | 0.36.0 |
| 406 | `apps/web` | `corepack pnpm --version` | 0 | 12.9.1 |
| 407 | `apps/web` | `corepack pnpm install --frozen-lockfile` | 0 | Passed (no test count) |
| 408 | `.` | `cargo deny --version` | 0 | cargo-deny 0.20.2 |
| 409 | `.` | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) |
| 410 | `.` | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON; partial |
| 411 | `.` | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON; partial |
| 412 | `apps/web` | `corepack pnpm run build:engine` | 0 | Passed (no test count) |
| 413 | `apps/web` | `corepack pnpm run types` | 0 | Passed (no test count) |
| 414 | `apps/web` | `corepack pnpm run typecheck` | 0 | Passed (no test count) |
| 415 | `apps/web` | `corepack pnpm run lint` | 0 | Passed (no test count) |
| 416 | `apps/web` | `corepack pnpm run format:check` | 0 | Passed (no test count) |
| 417 | `apps/web` | `corepack pnpm test` | 0 | 93 tests passed / 14 files |
| 418 | `apps/web` | `corepack pnpm run build` | 0 | Passed (no test count) |
| 419 | `apps/web` | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Passed (no test count) |
| 420 | `apps/web` | `corepack pnpm run e2e` | 130 | 1 failed; 3 interrupted; 1 passed |
| 421 | `apps/web` | `corepack pnpm run typecheck` | 0 | Passed (no test count) |
| 422 | `apps/web` | `corepack pnpm run lint` | 0 | Passed (no test count) |
| 423 | `apps/web` | `corepack pnpm run format:check` | 0 | Passed (no test count) |
| 424 | `apps/web` | `corepack pnpm run e2e` | 130 | 2 failed; 2 interrupted; 2 passed |
| 425 | `apps/web` | `corepack pnpm run build:engine` | 0 | Passed (no test count) |
| 426 | `apps/web` | `corepack pnpm run types` | 0 | Passed (no test count) |
| 427 | `apps/web` | `corepack pnpm run typecheck` | 0 | Passed (no test count) |
| 428 | `apps/web` | `corepack pnpm run lint` | 0 | Passed (no test count) |
| 429 | `apps/web` | `corepack pnpm run format:check` | 0 | Passed (no test count) |
| 430 | `apps/web` | `corepack pnpm test` | 0 | 93 tests passed / 14 files |
| 431 | `apps/web` | `corepack pnpm run build` | 0 | Passed (no test count) |
| 432 | `apps/web` | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Passed (no test count) |
| 433 | `apps/web` | `corepack pnpm run e2e e2e/export.spec.ts e2e/compare.spec.ts --project=chromium-375-dark` | 1 | 1 failed; 1 passed |
| 434 | `apps/web` | `corepack pnpm run build:engine` | 0 | Passed (no test count) |
| 435 | `apps/web` | `corepack pnpm run types` | 0 | Passed (no test count) |
| 436 | `apps/web` | `corepack pnpm run typecheck` | 0 | Passed (no test count) |
| 437 | `apps/web` | `corepack pnpm run lint` | 0 | Passed (no test count) |
| 438 | `apps/web` | `corepack pnpm run format:check` | 0 | Passed (no test count) |
| 439 | `apps/web` | `corepack pnpm test` | 0 | 93 tests passed / 14 files |
| 440 | `apps/web` | `corepack pnpm run build` | 0 | Passed (no test count) |
| 441 | `apps/web` | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Passed (no test count) |
| 442 | `apps/web` | `corepack pnpm run e2e e2e/export.spec.ts --project=chromium-375-dark` | 0 | 1 passed |
| 443 | `apps/web` | `corepack pnpm run e2e` | 0 | 48 passed |
| 444 | `apps/web` | `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
