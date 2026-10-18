BRIEF VERSION: 0002-W2 v1 (2026-10-18)

# 0002-W2 — Start screen and guided household setup

## Outcome

A person opens Horizon and sees what it can answer and five synthetic sample households, each with the status the engine reports. They pick a question and a household and continue into a guided setup: one short step at a time (about you, income, accounts, spending, assumptions), then one page reviewing every answer. Any value they are unsure of can be marked rough. Checking the household runs the engine on exactly what they entered and shows the result honestly, or the engine's error. Nothing is stored: reloading or closing the page clears everything.

This milestone builds screens 1 and 2 of the design references. The input check, the plan, comparison and export screens come in later milestones.

## Deliverables

1. **Design references** in `docs/briefs/assets/design-v1/`:
   - the six reference screens, each as an HTML page (`01-start.html`, `02-setup-accounts.html`, `03-input-check.html`, `04-baseline.html`, `05-compare.html`, `06-export.html`) with three frames (desktop light, desktop dark, phone at 375 px), plus a PNG of each desktop-light frame;
   - a `README.md` naming each screen, which brief implements it, and which parts are illustrative and must not ship (listed in deliverable 1's table below).

   This milestone implements **screens 1 and 2**. Screens 3–6 are references for later briefs and must not be built here.

   | Screen | Implemented by | Illustrative, do not ship |
   | --- | --- | --- |
   | 1 Start | 0002-W2 | The "When should I claim Social Security?" question is shown as not available; no claiming-age feature |
   | 2 Setup, accounts | 0002-W2 | Only the Accounts step is drawn; the other steps follow the same pattern, specified below |
   | 3–6 | Later briefs | Everything; not built in this milestone |

2. **DESIGN.md principles.** `DESIGN.md` gains the section "Principles for screens", committed with this brief:
   - **Simple by default, detail on demand:** each screen opens with one plain sentence generated from the engine result, and a picture where one helps. Everything else sits in labelled sections that open on request.
   - **Factual headlines:** headlines state results ("Savings run short at 93, two years before the plan ends") and never judge them; no invented thresholds.
   - **A chart view for data tables** that share one unit: chart by default, table one click away. Every chart keeps its table alternative.

   The implementation follows these for screens 1 and 2.

3. **Start screen** (reference screen 1), replacing the sample-household page of 0002-W1:
   - **Step bar:** Question, Household, Check, Plan, Compare, Export. In this milestone only Question and Household are active. The other four are shown and visibly marked "not available yet". They are not links or buttons, so keyboard focus skips them.
   - **Intro sentence,** generated from the engine statuses of the five samples, for example "The engine gives a full result for two of these five sample households, a partial one for two, and none for the couple (only one person is supported)." The counts come from the engine, never hard-coded.
   - **"Your question":** a native radio group of three questions. "Can I afford to retire when I want to?" and "How much can I spend each year?" are marked Supported; the first is chosen by default. "When should I claim Social Security?" is shown disabled with "Not available yet" and the reason: claiming-age rules are not modelled.
   - **"Start from a sample household":** a native radio group of the five 0002-W1 samples with their exact labels, each showing the status the engine returns for it:
     - "Supported" for complete;
     - "Partial (N omissions)" for partial, N being the engine's omission count;
     - "Unsupported" for an unsupported error.

     A one-line note appears when the engine reports a flag or an unsupported reason. Statuses come from one `sustainable_spending` call per sample through the worker.
   - **Collapsed sections:** "What the statuses mean", and "What the selected household's result leaves out" (the engine's omission list for the selected sample).
   - **Continue** opens the guided setup for the selected household, with a short line saying the setup goes step by step and ends with a review of every answer. For the couple (Unsupported), Continue is disabled and the reason is shown: Horizon plans for one person only.
4. **Guided setup** (reference screen 2):
   - **Step list** (left on desktop, top on phone): About you, Income, Accounts, Spending, Assumptions, Review your answers. Visited steps show a tick. **Back** and **Continue** move one step; any visited step can be reopened from the list.
   - **Heading:** the sample's label, for example "Single, 61, still working, plans to retire at 66".
   - **Privacy note, exactly:** "Your answers stay in this page only. Reload or close it and they're gone."
   - **Fields,** prefilled from the selected sample. Each edits exactly one place in the household input or assumptions:

     | Step | Field | Household input path | Notes |
     | --- | --- | --- | --- |
     | About you | Birth date | `/household/persons/0/birth_date` | Date |
     | About you | Retirement date | `/household/persons/0/retirement_date` | Date |
     | About you | Plan to age | `/household/persons/0/plan_end_age` | Whole number |
     | About you | Values as of | `/household/valuation_date` | Read-only |
     | Income | Wages per year | `/household/income/wages/0/amount/cents` | Only when the sample has a wage entry |
     | Income | Wages end on my retirement date | `/household/income/wages/0/end_date` | Checkbox. Checked when the sample's end date equals the retirement date; while checked, the end date is kept equal to the retirement date; unchecked, it is its own date field |
     | Income | Social Security per year | `/household/income/social_security/amount/cents` | |
     | Income | Social Security starts at age | `/household/income/social_security/start_age` | Whole number |
     | Income | Pension per year | `/household/income/pension/amount/cents` | |
     | Income | Pension starts at age | `/household/income/pension/start_age` | Whole number |
     | Accounts | Account type | `/household/accounts/<i>/account_type` | Cash, Brokerage (taxable), Tax-deferred, Roth |
     | Accounts | Balance today | `/household/accounts/<i>/opening_balance_cents` | |
     | Accounts | Cost basis | `/household/accounts/<i>/cost_basis_cents` | Taxable accounts only; `null` otherwise |
     | Accounts | Plan kind | `/household/accounts/<i>/tax_deferred_kind` | Tax-deferred only: "Workplace plan, such as a 401(k)" (`employer_plan`) or "Traditional IRA" (`traditional_ira`); `null` otherwise |
     | Spending | Spending per year before retirement | `/household/spending/before_retirement/cents` | |
     | Spending | Spending per year after retirement | `/household/spending/after_retirement/cents` | |
     | Assumptions | Inflation, investment return, cash return, tax-threshold indexing | `/assumptions/<identifier>/value` | Percent per year |

   - **Every amount** shows its dollar basis next to it ("today's dollars" or "nominal dollars"), kept from the sample unchanged. Every field without an obvious meaning gets one short explanation line; the reference shows the cost-basis explanation.
   - **Accounts:**
     - "Edit type" changes an account's type, setting or clearing cost basis and plan kind as in the table;
     - "Add an account" appends a cash account with balance $0, owned by the sample's person, with an id `account-N` that does not collide with existing ids;
     - removing accounts is not in this milestone.
   - **Rough marker:** each amount, cost basis and assumption rate can be marked "Rough". Only fields with an engine default range (`docs/model/answers.md`, "Rough-input impact") are eligible; dates and ages are not. Rough marks are kept in memory as a list of the household input paths above, for the next milestone's input check, and are shown on the review page.
   - **Review your answers:** every field grouped by step, each group with an Edit link that opens that step, and rough marks shown. The button **"Check this household"** sends the edited input through the worker to `sustainable_spending`:
     - **on success,** the 0002-W1 result view: status word with its icon, sustainable spending, entered spending and headroom in today's dollars a year, any flag in words, and the omission list;
     - **on an error envelope,** the status word and the engine's message with no figures, plus Edit links to every step.
   - **Navigation:** Back from the first setup step returns to the Start screen, keeping the choices. Choosing a different household on the Start screen discards edits after a confirmation that names what will be lost.
5. **Entry parsing**, exact and without floating point. The interface converts what a person types into the input format; it never computes financial values.
   - **Dollars:** whole dollars, optional "$" and thousands commas, no decimals, no sign. `150,000` becomes `15000000` cents by appending "00" to the digits. Anything else shows a field message ("Enter a whole-dollar amount, like 150,000") and blocks Continue on that step.
   - **Percent:** up to two decimal places, no sign, at most 100. `2.5` becomes `"0.025"` by exact decimal string shifting. The value is written in the same format as the sample (minimal decimal string, no trailing zeros, "0" for zero).
   - **Whole numbers:** digits only.
   - **Dates:** the browser's date input, `YYYY-MM-DD`.
   - **The engine stays the only validator of meaning** (for example a retirement date before the valuation date). Its errors reach the person through "Check this household".
6. **State:** in memory only, as in 0002-W1. The theme behaviour, CSP, worker protocol, tokens and focus ring are unchanged.

## Done when

1. **Design references:** the six HTML pages and six PNGs are present and match the approved references. The HTML makes no outside requests (no font service) and starts with an SPDX line.
2. **Start screen:** in all three browsers, both sizes and both themes:
   - the five samples show the engine's statuses and omission counts;
   - the intro sentence's counts match;
   - the claiming-age question cannot be chosen;
   - the couple cannot continue and says why;
   - the not-yet-available steps are marked and skipped by keyboard focus.
3. **Guided setup:** keyboard-only, a person can choose the working sample, step through every setup step, change the 401(k) balance to 600,000, mark it rough, change inflation to 3, reach the review page, see both edits and the rough mark, and check the household.
4. **Parity:** the result shown for that edited household equals the native engine's `sustainable_spending` output for `packages/app/test-data/web-edited-working-61.json`. That file is `answers-working-61` with only `/household/accounts/2/opening_balance_cents` set to `60000000` and `/assumptions/inflation/value` set to `"0.03"`. Expected values (native engine `horizon-engine-0.4.0`, verified 2026-10-18): sustainable spending **$64,654**, entered **$67,000**, headroom **−$2,346**, status **Partial (5 omissions)**, no flag. The higher balance is outweighed by the higher inflation. The browser's `run` output for the five samples stays byte-identical to the committed goldens, as in 0002-W1.
5. **Errors:** with "Wages end on my retirement date" checked, setting the retirement date to 2025-06-01 (before the wages start on 2026-01-01) leads to the engine's invalid envelope `END_BEFORE_START` ("Wage end date precedes its start date.") on check. The status word and that message appear with no figures.
6. **Parsing:** unit tests cover dollars (commas, "$", rejections), percent (0, 2.5, 3, 12.25, 100 and rejections) and the exact strings written.
7. **Privacy and accessibility:** no storage, cookies or off-origin requests; axe reports no violations; no horizontal page scroll at 375 px. This holds on every step and on the review page.
8. **Earlier guarantees hold:**
   - all Rust validation passes unchanged;
   - the licence checks pass with no new dependency;
   - no earlier reference file, schema or golden changes;
   - no new top-level entry.

## Read first

- `DESIGN.md` (Visual language, version 1, and the new "Principles for screens"), `AGENTS.md`.
- The design references in `docs/briefs/assets/design-v1/` (screens 1 and 2, and the README).
- `docs/model/answers.md` ("Rough-input impact"), `docs/model/scenario-diff-and-export.md` (input paths), `docs/model/error-codes.md`, and the household-input schema in `docs/model/schemas/`.
- `docs/architecture/web-shell.md` and brief 0002-W1.
- Public references, retrieved 2026-10-18:
  - WCAG 2.2: https://www.w3.org/TR/WCAG22/
  - WAI-ARIA radio group pattern: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
  - MDN date input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0002-W1 sequence in `AGENTS.md`, unchanged, including `corepack pnpm exec playwright install chromium firefox webkit` and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json`. Record its output; it must match the browser assertion of Done when 4.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Screens 3–6:** later milestones (input check, plan, comparison, export).
- **Removing accounts; editing the withdrawal order; more than one wage entry:** later. The sample's withdrawal order is kept unchanged.
- **Saving progress, accounts and sign-in:** plan 0006. Nothing persists here.
- **A "show everything" entry mode:** deferred. The review page serves experienced users.
- **The printed summary and charts:** later screens.

## Implementation record

### Implementation — 2026-10-18

**Branch:** `codex/0002-W2-start-and-guided-setup`.
**Source/test revisions validated:**

- `f59297a9c201b89cd41d0b9e968e49bb15815af3`: commands 1–401 below,
  including the complete cumulative Rust/CLI corpus, isolated WebAssembly levers
  and horizon-wasm checks.
- `4f11ac4083a3558e552dd96efb00ea5b522f6075`: commands 402–416 below,
  covering the complete web sequence and the edited-household native command.

Only `apps/web/e2e/shell.spec.ts` changed between these revisions: keyboard
traversal now uses Shift+Tab for earlier document targets. Application and Rust
source/tests, fixtures, dependencies and schemas are identical. Those already
passed Rust checks were retained at their actual revision; the affected web
sequence was rerun in full after the harness correction. Each table row records
one actual execution at its listed revision, in the assigned Linux worktree.
Source/tests stayed unchanged within each validation segment. This record is
committed afterward; the final branch tip is reported separately in the handoff.
No push, main-branch mutation or hook bypass was performed. Public-boundary hooks
passed on every source/test commit.

Start and the six-step guided setup are implemented with native controls,
engine-derived sample statuses/counts/flags/omissions, exact entry parsing,
in-memory rough paths, retirement-linked wages, conditional account fields,
collision-free account additions, review/edit navigation and engine check/error
presentation. Returning through Start preserves answers, rough marks and visited
steps. Changing households requires confirmation before discarding edits.
`web-edited-working-61.json` contains exactly the two changes specified by the
brief. Earlier fixtures, schemas, references and goldens are unchanged.

**Design:** the six existing HTML/PNG reference pairs, their README and the
DESIGN.md principles were already committed on the starting revision and remain
unchanged. A read-only Python check verified all six SPDX first lines, all 18
frame IDs and all six PNG signatures (exit 0). Screens 1 and 2 follow the reference
layout, tokens and self-hosted typeface. The brief's visible unavailable steps,
dollar bases, Rough controls, plan-kind fields and full review extend the
illustrative drawings. The setup opening sentence describes the editing task;
it does not invent an engine result before Check. Screens 3–6 were not built.

**Tools:** Rust 1.99.1, Node v24.22.0, corepack 0.36.0,
pnpm 12.9.1 (through corepack in apps/web), wasm-bindgen/test runner 0.2.129,
cargo-deny 0.20.2 and Playwright 1.63.0. The preinstalled pinned toolchain was
used. The same Node executable/PATH was used for all WebAssembly builds and
runs; version observations are included below. A discovery probe outside
apps/web selected corepack's default pnpm 12.14.0; every web installation,
build and validation used the manifest-selected 12.9.1.

**Browser execution:** chromium 153.0.8010.12, firefox 155.0, webkit 26.6.
All 12 projects passed: Chromium, Firefox and WebKit × 375×812 and 1280×800 ×
light and dark. Versions above come from the executed tests' browser-version
annotations. Playwright installation ran successfully before execution.
Every project checked every sample, all six setup steps, review, the edited
result, the engine error and all four supported sample result views. The full
working-sample edit/check path used keyboard traversal; the additional
programmatically filled date-error case used pointer navigation after the native
date control. All 204 captured screens passed axe with zero violations and no
horizontal page overflow. Full-page screenshots and the HTML/JSON Playwright
reports were saved as local evidence outside the repository, as requested.
The tests also proved same-origin requests, no storage/cookie writes or stored
state, exact CSP, explicit/system theme precedence and reload clearing.

**Performance:** release levers finished in 0.435 seconds wall time
(limit <2 seconds), exit 3 as expected. The isolated WebAssembly levers harness
reported `test result: ok. 1 passed; 0 failed; 0 ignored; 13 filtered out; finished in 5.03s`; its command wall time was
6.178 seconds. Node was v24.22.0 for both WebAssembly runs.

**Edited native output:** the required spend command exited 3 and produced one
canonical JSON document plus one newline. Its answer fields and engine omissions
were:

```json
{
  "status": "partial",
  "sustainable_spending": 64654,
  "entered": 67000,
  "headroom": -2346,
  "flag": null,
  "omissions": [
    "state tax not modeled",
    "alternative minimum tax not modeled",
    "taxable-account dividends and interest not modeled",
    "itemized deductions and credits not modeled",
    "contributions not modeled"
  ]
}
```

The browser asserted the same $64,654 sustainable spending, $67,000 entered
spending, −$2,346 headroom, Partial (5 omissions) and null flag. The full canonical
native output, retained with local validation evidence, has SHA-256
`5968fb2e8519d8fb0fe5e19604b1ec8a22623e5580b997f0b9ce42e3c414602f` (including its newline).
The linked-date check returned `END_BEFORE_START`, Invalid, “Wage end date
precedes its start date.” and no result figures.

**Dependencies:** none added. Manifests and lockfiles are unchanged. The Rust
license check and both web dependency-closure checks passed; exact package
counts appear below.

**Development validation:** before the source commit, installation/types/build,
typecheck, lint, formatting and unit tests were run while implementing. Initial
typecheck (exit 2) and unit runs (exit 1; 3 failed / 22 passed) exposed a case-only
module-name collision and obsolete Start assertions; these were fixed. Later
unit runs passed 25, then 27, then 28 tests (all exit 0). The initial phone
Chromium e2e attempts exited 1 while resolving relative locators, stable Rough
names and review text matching, then passed (1/1, exit 0). An early full matrix
exited 1 with 4 passed / 8 failed because of native radio wrap and date-focus
assumptions. The two-browser follow-up exited 1 with WebKit passed and Firefox
failed; after limiting programmatic-date navigation to pointer actions, Firefox
passed (1/1, exit 0). The required working edit/check path remains keyboard-only.
The first committed-revision cumulative attempt at `fc621b5` passed every
command through the browser installation, then e2e exited 1 with 8 passed / 4
failed. All four WebKit projects finished the required edit/check path but could
not traverse to Edit afterward: disabling the focused Check button during the
worker request left focus on the body. A WebKit-only diagnostic trial with
alternate traversal also exited 1 (0 passed / 1 failed). The corrected button
uses aria-disabled/aria-busy, retains focus and ignores duplicate activation.
The WebKit follow-up passed (1/1, exit 0), and all 28 unit tests passed (exit 0),
including pending focus and duplicate prevention. The correction is committed
as `f59297a9c201b89cd41d0b9e968e49bb15815af3`. The complete cumulative
sequence was rerun from the start against that revision; commands 1–413 passed,
then e2e exited 1 with 8 passed / 4 failed (Firefox). The forward-only harness
could not return from the final button to earlier review links. Choosing
Shift+Tab when the target precedes the focused element fixed that test helper;
Firefox and WebKit phone follow-ups passed together (2/2, exit 0). That harness
change is committed as `4f11ac4083a3558e552dd96efb00ea5b522f6075`. Its complete
web sequence is recorded below, alongside the unchanged core validation. These earlier failures are
reported observations, not passing results for the final harness.

**Exclusions:** each remains as specified by the brief:

- Screens 3–6 (input check, plan, comparison and export) belong to later briefs.
- Account removal, withdrawal-order editing and multiple wage entries are later
  work; this milestone preserves the existing withdrawal order and wage list.
- Persistence, user accounts and sign-in belong to plan 0006; this page keeps
  only in-memory state.
- A show-everything entry mode is deferred; Review serves experienced users.
- Printed summaries and charts belong to later screens.
- The disabled claiming question implements no claiming-age rules, which the
  engine does not model.

No server/tenant/authorization surface, new top-level entry or dependency is
introduced. Independent review remains for a different reviewer; this record
reports implementation validation. No required validation was excluded.

All CLI corpus commands below were expanded over the 48 fixtures, all five
reference comparison pairs, 26 current golden exports and three import rejection
cases. The sweep checked each observed exit against its JSON status, canonical
JSON bytes and exactly one trailing newline. Existing CLI/application byte-parity
tests also passed as part of the workspace suites. Expected exits 1, 2 and 3 are
successful validation observations for invalid, unsupported and partial cases.

<details>
<summary>Required validation commands, exits and counts (416 invocations)</summary>

| Revision | Directory | Command | Exit | Counts / observed result |
| --- | --- | --- | --- | --- |
| `f59297a` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed; 0 failed; 0 ignored; 33 filtered out; 8 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed; 0 failed; 0 ignored; 39 filtered out; 8 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed; 0 failed; 0 ignored; 41 filtered out; 8 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed; 0 failed; 0 ignored; 40 filtered out; 8 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed; 0 failed; 0 ignored; 37 filtered out; 8 harness result(s) |
| `f59297a` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed; 0 failed; 0 ignored; 0 filtered out; 3 harness result(s) |
| `f59297a` | workspace root | `cargo test --workspace` | 0 | 75 passed; 0 failed; 0 ignored; 0 filtered out; 20 harness result(s) |
| `f59297a` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | Completed; no test harness |
| `f59297a` | workspace root | `cargo fmt --all --check` | 0 | Completed; no test harness |
| `f59297a` | workspace root | `cargo test --workspace --release` | 0 | 75 passed; 0 failed; 0 ignored; 0 filtered out; 20 harness result(s) |
| `f59297a` | workspace root | `cargo build --workspace --release` | 0 | Completed; no test harness |
| `f59297a` | workspace root | `node --version` | 0 | v24.22.0 |
| `f59297a` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | Completed; no test harness |
| `f59297a` | workspace root | `node --version` | 0 | v24.22.0 |
| `f59297a` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed; 0 failed; 0 ignored; 0 filtered out; 2 harness result(s) |
| `f59297a` | workspace root | `cargo deny check licenses` | 0 | licenses ok |
| `f59297a` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; 0.435s wall |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON document + newline; partial |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `f59297a` | workspace root | `node --version` | 0 | v24.22.0 |
| `f59297a` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed; 0 failed; 0 ignored; 13 filtered out; 1 harness result(s); 5.03s |
| `f59297a` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness result(s) |
| `f59297a` | workspace root | `node --version` | 0 | v24.22.0 |
| `f59297a` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `node --version` | 0 | v24.22.0 |
| `4f11ac4` | apps/web | `corepack --version` | 0 | 0.36.0 |
| `4f11ac4` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 |
| `4f11ac4` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date, resolution step is skipped; Done in 52ms using pnpm v12.9.1 |
| `4f11ac4` | apps/web | `corepack pnpm run build:engine` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `corepack pnpm run types` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `corepack pnpm run typecheck` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `corepack pnpm run lint` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `corepack pnpm run format:check` | 0 | Checking formatting...; All matched files use Prettier code style! |
| `4f11ac4` | apps/web | `corepack pnpm test` | 0 | Test Files  8 passed (8); Tests  28 passed (28) |
| `4f11ac4` | apps/web | `corepack pnpm run build` | 0 | 31 modules transformed; production bundle built |
| `4f11ac4` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Completed; no test harness |
| `4f11ac4` | apps/web | `corepack pnpm run e2e` | 0 | 12 passed (1.1m) |
| `4f11ac4` | apps/web | `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `4f11ac4` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | 1 canonical JSON document + newline; partial |

</details>
