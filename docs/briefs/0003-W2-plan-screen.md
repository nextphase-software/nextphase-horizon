BRIEF VERSION: 0003-W2 v1.1 (2026-10-18)

# 0003-W2 — Plan screen

## Outcome

After setting up a household and checking its rough entries, a person sees their plan:
- a one-sentence factual headline and the result's status;
- three answers: can you retire when you want, what can you spend, and what moves it most;
- the savings picture over time in today's dollars;
- one click away: the levers, why savings run short, every year of the ledger, and the assumptions, with a chart first wherever a picture helps and a table one click further.

Every figure comes from the engine. The screen formats and arranges figures but never adds, subtracts or derives a financial value.

This milestone builds reference screen 4 (`docs/briefs/assets/design-v1/04-baseline.html`).

## Deliverables

1. **Reaching the plan:**
   - the input check's "See the plan" becomes active;
   - the step bar's **Plan** step becomes active once the Review page has been reached;
   - Compare and Export stay "not available yet".

   The plan uses the household exactly as entered, including edits.
2. **Engine calls,** through the worker on that input: `run`, `sustainable_spending` and `levers`.
   - Each section shows "Calculating…" until its data arrives.
   - An error envelope from any call shows its status word and message with no figures, plus "Back to household".
3. **Display rules:**
   - **Amounts:** cents become whole dollars rounded half away from zero, for display only.
   - **Ages:** from the engine's `age_on_december_31`.
   - **Labels:** "today's dollars" and "nominal" as DESIGN.md requires.
   - **No new numbers:** no figure shown on the screen is computed by the interface. Stacked chart segments are drawn from engine totals; the stack height is never shown as a number.
4. **Factual headline and status** (must-match 1 and 2):
   - **Headline:**
     - "Savings run short at <A>, <N> years before the plan ends." when a year has a shortfall. `A` is the age in the first year with `shortfall > 0`; `N` is the plan-end age minus `A`, in words from one to ten and numerals above.
     - "Savings run short at <A>, in the plan's last year." when `N` is 0.
     - "Savings last to <plan-end age>." when there is no shortfall.
   - **Eyebrow:** the sample's label, then " · RETIRE AT <age>", where the age is the `age_on_december_31` in the retirement-date year. Retired households show " · RETIRED".
   - **Status bar:** the status chip; the sentence "This result leaves some things out."; a collapsed "What this result does not include" listing the engine's omissions; and "Results are modeled annual amounts, not predictions."
5. **The three answers** (must-match 3). `E` is entered after-retirement spending, `S` sustainable spending and `H` headroom, from `sustainable_spending`.
   - **Answer 1.** The title is "Can you retire at <age>?", or "Do your savings last?" when the retirement date is on or before the valuation date. The text is one of:
     - "Yes: at $E a year, savings last to <end age>.";
     - "Not at $E a year: savings run short at age <A> (<year>)." for not-yet-retired households;
     - "No: at $E a year, savings run short at age <A> (<year>)." for retired households.
   - **Answer 2,** "What can you spend?":
     - "**$S** a year in today's dollars lasts to <end age>: $|H| less than you plan to spend." when `H < 0`;
     - "…: $H more than you plan to spend." when `H > 0`;
     - "…: exactly what you plan to spend." when `H = 0`;
     - with the flag `shortfall_with_no_retirement_spending`: "Savings run short even with no retirement spending.";
     - with `at_or_above_cap`: "At least $10,000,000 a year in today's dollars; the search stops there."
   - **Answer 3,** "What moves it most?": from the engine's `what_moves_most`, mapped `return` → "investment returns", `spending` → "spending", `retirement_date` → "the retirement date", joined "A, then B, then C.", with only the first letter of the sentence capitalised: "Investment returns, then spending, then the retirement date." or "Spending, then investment returns.". Then a "See the levers" link that opens the Levers section.
6. **Savings by age** (must-match 4):
   - a line of `total_closing_today` by age, in today's dollars of the valuation year, labelled so;
   - a "Retire at <age>" label at the retirement age;
   - a dotted "Runs short at <A>" marker when there is a shortfall;
   - a "Show as a table" alternative listing age, year and savings for the first year, the retirement year and the year after, every age divisible by 5, the year with the highest savings, the first shortfall year and the last year. Any amount the chart labels appears in this table;
   - at 375 px, a compact drawing.
7. **Collapsed sections** (must-match 5), each with a hint:
   - **Levers** (hint "What moves the answer most · <n> changes, ranked"):
     - a "Chart | Table" switch, chart by default;
     - the chart is horizontal bars of each lever's `effect` in the engine's `ranking` order, diverging from zero, with "▲ Better +$X" or "▼ Worse −$X" written beside each bar and no status colours;
     - the table has the columns Change, Savings ("lasts to <end age>", or "runs short at <first_shortfall_age>"), Change in headroom (signed, today's dollars a year) and Better/Worse in words;
     - lever labels use the values in each lever's `changes`: "Investment returns 1 point higher (6%)", "Investment returns 1 point lower (4%)", "Spend 10% less in retirement ($60,300 a year)", "Spend 10% more in retirement ($73,700 a year)", "Retire a year later, at <age + 1>", "Retire a year earlier, at <age − 1>";
     - a lever whose `effect` is 0 shows "No change" in place of the arrow, word and amount, and no bar;
     - levers in the engine's `skipped` list are not shown, and `<n>` in the hint counts only the levers shown;
     - a note: "Claiming Social Security later isn't offered: claiming-age rules are not modeled yet."
   - **Why savings run short** (only when there is a shortfall; hint "In <year>, at <A>"):
     - when the first shortfall year is on or after the retirement-date year: "After retiring, spending of $E a year in today's dollars grows with inflation (<inflation %>) to $<spending that year> by <year> (nominal). That year income brings in $<income_total> and savings supply $<withdrawals_total>, leaving $<shortfall> not covered.";
     - when it is before the retirement-date year: "In <year>, before retiring, spending is $<spending that year> (nominal). That year income brings in $<income_total> and savings supply $<withdrawals_total>, leaving $<shortfall> not covered."
     - When required distributions occur: "Required distributions from age <age in the first year with rmd_total > 0> don't add money; they move it out of the tax-deferred account earlier, and it is taxed."
     - A rules line: "Rules used: <rule_set_year> federal tax law for a single filer, projected after <rule_set_year> with tax-threshold indexing · Withdrawal order: <withdrawal_order_used in words>." The words are: `taxable_first` → "cash and taxable accounts first, then tax-deferred, then Roth"; `tax_deferred_first` → "tax-deferred accounts first"; `roth_before_tax_deferred` → "Roth before tax-deferred"; `proportional_taxable_tax_deferred` → "taxable and tax-deferred in proportion".
   - **Year by year** (hint "Nominal dollars · <n> years"):
     - a "Chart | Table" switch, chart by default;
     - **chart:** a savings-at-year-end line (`total_closing`, nominal) above paired columns per year. "In" stacks `income_total` and `withdrawals_total`, with a dashed box of `shortfall` on top when it is above zero. "Out" stacks `spending` and federal tax `paid`. Markers show "Retires at <age>", "Distributions from <age>" and "Runs short <year> (age <A>)", and the shortfall years are highlighted;
     - **table:** every year, with Year, Age, Income, Spending, Withdrawals, Required distributions, Federal tax, Shortfall, Savings at year end and Note. The notes are "Retires", "Social Security starts", "Required distributions start" and "Savings run short", each in the first year it applies, and the shortfall rows are highlighted. It scrolls inside its own container;
     - nominal, labelled.
   - **Assumptions** (hint "<n> rates, each with a source"):
     - from `assumptions_used`: name, value as a percent a year, source and from-year;
     - source "Sample household" when the person did not change the value in the setup, otherwise "Changed by you";
     - then "Estimates, not facts: change any of them in a copy to see how the plan moves."
8. **Buttons** (must-match 6): "Try a change" and "Export" are shown, marked "Not available yet" and not operable. "Back to household" opens the Review page. The footer and privacy note are as in 0002-W2.
9. **Charts:**
   - hand-built inline SVG (decision 0011), using the tokens;
   - direct labels; baseline series in `color-series-baseline`;
   - no status colours for better or worse; the shortfall uses ink, a sunken fill and words, never the Unsupported colour;
   - every chart has its table, and each chart is `aria-hidden` with its figures available in the table and the text.
10. **Small fix carried from 0002-W3:** the input check's hint "<N> groups of entries" uses words from one to ten ("Five groups of entries").

## Must-match points against reference screen 4

1. Eyebrow and factual headline as in deliverable 4.
2. Status bar with chip, sentence, collapsed omission list and the "not predictions" line.
3. Three answer columns with titles and texts as in deliverable 5 (one column on phones).
4. The "Savings by age" card: today's-dollar line, the retire label, the shortfall marker, the caption naming the dollar basis, and "Show as a table".
5. Four collapsed sections in this order: Levers, Why savings run short, Year by year, Assumptions, each with its hint and a Show/Hide control. Levers and Year by year open on the chart view.
6. "Try a change" and "Export" (not available yet), then the footer.

## Done when

1. **Reference case,** the working sample with no edits:
   - **headline:** "Savings run short at 93, two years before the plan ends.";
   - **eyebrow:** "SINGLE, 61, STILL WORKING, PLANS TO RETIRE AT 66 · RETIRE AT 66";
   - **answer 1:** "Not at $67,000 a year: savings run short at age 93 (2058).";
   - **answer 2:** "**$64,994** a year in today's dollars lasts to 95: $2,006 less than you plan to spend.";
   - **answer 3:** "Investment returns, then spending, then the retirement date.";
   - **chart table:** age 61 $800,268; 65 $934,687 (the highest); 66 $905,702; 93 $886; 95 $1 (today's dollars);
   - **levers,** in this order:

     | Lever | Change in headroom | Savings |
     | --- | --- | --- |
     | Investment returns 1 point higher (6%) | ▲ +$6,749 | lasts to 95 |
     | Spend 10% less in retirement ($60,300 a year) | ▲ +$6,700 | lasts to 95 |
     | Spend 10% more in retirement ($73,700 a year) | ▼ −$6,700 | runs short at 88 |
     | Investment returns 1 point lower (4%) | ▼ −$6,336 | runs short at 88 |
     | Retire a year later, at 67 | ▲ +$3,622 | lasts to 95 |
     | Retire a year earlier, at 65 | ▼ −$3,556 | runs short at 90 |

   - **"Why":** spending $147,652 by 2058, income $57,298, savings supply $78,085, leaving $12,269; distributions from age 75; inflation 2.5%.

   All values come from native `horizon-engine-0.4.0` CLI output, verified 2026-10-18.
2. **Other samples:**

   | Sample | Headline | Answer 1 | Answer 2 |
   | --- | --- | --- | --- |
   | `synthetic-retired` | "Savings last to 95." | "Do your savings last?" / "Yes: at $50,000 a year, savings last to 95." | $87,061, "$37,061 more than you plan to spend." |
   | `A-drawdown` | "Savings run short at 76, two years before the plan ends." | | $43,690, "$16,310 less…" |
   | `answers-underfunded` | "Savings run short at 61, 34 years before the plan ends." | | "Savings run short even with no retirement spending." |

   Also:
   - **eyebrow:** `synthetic-retired` reads "SINGLE, 70, RETIRED · RETIRED";
   - **answer 3:** `synthetic-retired` and `A-drawdown` read "Spending, then investment returns.";
   - **levers:** `synthetic-retired` and `A-drawdown` show four levers, with the hint "What moves the answer most · 4 changes, ranked", and no retirement-date lever;
   - **"Why"** for `answers-underfunded`: "In 2026, before retiring, spending is $120,000 (nominal). That year income brings in $30,000 and savings supply $40,000, leaving $53,826 not covered."

3. **Parity:**
   - the worker's `run`, `sustainable_spending` and `levers` outputs for the working sample are byte-identical to the native CLI's;
   - the 0002-W1, W2 and W3 parity checks still pass;
   - every figure and sentence asserted in Done when 1 and 2 is read from the rendered page and matched exactly against its whole table cell or sentence, not as a substring.
4. **Keyboard and screen readers:**
   - every section and switch is operable by keyboard;
   - "See the levers" opens and focuses the Levers section;
   - the charts are `aria-hidden` with their tables reachable;
   - keyboard steps in the end-to-end tests reach their targets whether focus has to move forward or backward, and the suite passes on Linux and on macOS.
5. **Accessibility and privacy:** axe reports no violations, there is no horizontal page scroll at 375 px (tables scroll inside their containers), and nothing is stored or requested off-origin. This holds in three browsers, both sizes and both themes, with every section open and in both chart and table views.
6. **The input-check hint** reads "Five groups of entries" for the working sample.
7. **Earlier guarantees:** Rust validation and licences unchanged; no new dependency, schema or golden change; no new top-level entry.

## Read first

- `DESIGN.md` (Visual language, version 1, including "Principles for screens"), `AGENTS.md`, decision record 0011 (charts, item 6).
- `docs/briefs/assets/design-v1/04-baseline.html` (reference screen 4) and its README.
- `docs/model/answers.md`, `docs/model/federal-tax.md` (ledger fields), the run-output and answer schemas in `docs/model/schemas/`, `docs/architecture/web-shell.md`, and briefs 0002-W2 and 0002-W3.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0002-W3 sequence in `AGENTS.md`, including Playwright install and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- run answers-working-61`
- `cargo run -p horizon-cli -- spend answers-working-61`
- `cargo run -p horizon-cli -- levers answers-working-61`

Expected exit 3 each. Their outputs must equal the browser's. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Scenario copies and comparison** ("Try a change"): plan 0004.
- **Export:** plan 0005.
- **The full rule-reference view per ledger line:** later.
- **A charting library:** decision 0011 keeps charts hand-built.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### Implementation — 2026-10-19

**Branch:** `codex/0003-W2-plan-screen`.
**Source/test revision:** `1070a0ae8390d7bc3cd9da1559352555b8ca9a7b`.
The record is committed after this revision; the final branch tip is reported
separately at handoff. No push, main-branch mutation or hook bypass was performed.
The source commit passed the public-boundary hooks.

The Plan step activates after Review, and the input check opens the plan using
the serialized edited draft. Three worker requests supply the original run,
sustainable spending and levers. Their sections show loading independently;
any error envelope or transport failure removes the figures and offers a return
to Review. Changing the input discards the previous view and ignores obsolete
replies. The input-check hint now reads "Five groups of entries".

The screen includes the factual headline, retirement/retired eyebrow, status
and omissions, three answers, today's-dollar savings line and selected-year
table, ranked lever chart/table, shortfall explanation, nominal ledger chart/table
and sourced assumptions. The inline SVG uses the semantic tokens and compact
phone drawings. All SVG is hidden from the accessibility tree; native disclosures
and chart/table buttons expose the text and tables. Scrollable tables have
distinct accessible names and accept keyboard focus. "See the levers" opens
and focuses its disclosure. Comparison and export remain visibly unavailable.
The footer and privacy note retain their earlier wording.

**Acceptance discrepancy:** two numbers in Done when 1 conflict with deliverable
3's required rounding. The unchanged committed working run and fresh native and
worker output contain `total_closing_today.cents = 88582` at age 93 and `53` at
age 95. Whole dollars rounded half away from zero are **$886** and **$1**,
respectively, rather than the listed $885 and $0. The screen and its rendered-page
assertions follow the engine values and the explicit rounding rule. These two
example numbers are recorded as deviations, not claimed as matches. The other
specified working and sample answers, lever amounts/order/outcomes and shortfall
explanation figures were read from the rendered page and matched. No reference,
schema, fixture, engine or golden was changed to resolve this discrepancy.

The layout follows reference screen 4's six must-match structures: the opening
headline/status, three columns on desktop and one on phones, savings card,
ordered collapsed sections with hints and Show/Hide controls, and unavailable
actions. The brief's not-predictions sentence, explicit unavailable labels and
Back to household control extend the illustrative reference. Chart scale labels
use actual returned amounts rather than generating new financial tick values.
Independent review remains separate from implementation and validation.

**Validation revisions:** commands 1–30 below used Rust source/tests identical
to `5bfcbdc976a8e8ff04abc43682daa7e8111100d5`, the starting revision. The web
implementation was in progress during those checks; it is not claimed as tested
by Cargo. Commands 31–430 ran at `1070a0ae8390d7bc3cd9da1559352555b8ca9a7b`,
including the entire ordered web sequence at commands 414–427. Command 429
proves the Cargo inputs, Rust source/tests, fixtures, schemas, goldens, design
assets and dependency manifests/lockfiles are unchanged between those revisions.
Source/tests stayed unchanged throughout the final web sequence. No validation
step was excluded, and earlier output was not reused as a new pass.

**Tools:** Rust/cargo 1.99.1; Node v24.22.0; corepack 0.36.0; pnpm 12.9.1
through corepack in `apps/web`; wasm-bindgen and its test runner 0.2.129;
cargo-deny 0.20.2; Playwright 1.63.0. The installed pinned toolchain was used.
Node version observations accompany the WebAssembly runs, with the same Node
executable/PATH. An early discovery call from the workspace root selected
corepack's default pnpm 12.14.0; all web installation/build/validation commands
used the manifest-selected 12.9.1 from `apps/web`.

**Observed results:**

- Native workspace tests: 75 passed in debug and 75 in release, zero failed or
  ignored. Native parity: 15 passed; WebAssembly parity: 14 passed.
- The full 48-fixture CLI corpus, six-item rough-input reference, five reference
  comparison pairs, all 26 current golden imports and three rejection imports
  completed with their expected statuses. The cumulative ledger records 378 CLI
  invocations, including repeated performance/reference calls. Each printed one
  canonical JSON document and one newline; partial/invalid/unsupported exits
  were checked, and `dev-run` retained exit 0 for partial.
- The first release-levers timing (command 30) was **6.693 s**, including a
  **6.26 s dependency/CLI compilation**, and failed the two-second timing gate.
  After an explicit CLI release build (31), the same command (32) took
  **0.441 s**, exited 3 as expected, and met the limit. Neither timing is hidden.
- The isolated WebAssembly levers test (405) passed: **4.99 s** from the test
  harness; command wall time was 6.228 s. The full WebAssembly harness passed
  14 tests in 22.29 s.
- Vitest: **57 passed across 11 files**, zero failed. Typecheck, lint,
  formatting, production build and Playwright browser installation exited 0.
- End to end: **24 passed across all 12 projects**, zero unexpected, skipped or
  flaky tests. Actual browser-version annotations: Chromium **153.0.8010.12**,
  Firefox **155.0**, WebKit **26.6**. Each ran at 375×812 and 1280×800 in light
  and dark themes. Both the cumulative earlier-screen flow and the new plan
  flow ran in every project.
- The browser suite produced **612 full-page screenshot captures**, attached
  to the Playwright HTML report, plus its JSON report, outside the repository.
  Before each capture, axe reported no violations and the page had no horizontal
  overflow. The plan captures include every supported sample, collapsed and
  expanded omissions, all sections in chart view and table view, the edited
  household and the engine error. Earlier captures cover every setup screen,
  all sample Start/result views, input-check states, errors and focus targets.
- Worker replies from the plan's actual three requests were byte-identical to
  fresh native CLI output for all four supported samples and the edited working
  household. The previous run, edited-spending and rough-impact parity checks
  also passed. Keyboard traversal/focus, reachable tables, `aria-hidden` SVG,
  unavailable actions, no storage/cookie writes, empty stored state and no
  off-origin requests were checked in all browser projects.
- Rust licenses passed. Web licenses passed for **4 shipped package versions**
  and **358 package versions** in the full closure.

Development checks before the source commit caught TypeScript/mock fixture
issues and a lint rule for focusable scroll regions; those were corrected before
the final sequence. The first focused Chromium plan run exited 1 at the rounding
discrepancy above; the next exited 1 because expanded table regions shared an
accessible name. Distinct names fixed that accessibility issue. The final focused
Chromium phone/light plan run passed (1 test, 31.2 s), as did the earlier-screen
WebKit phone/dark smoke run (1 test, 21.4 s). The complete final web sequence above
then ran afresh against the committed source/test revision.

**New dependencies:** none. Existing dependency versions, licenses and policies
are unchanged; new source/test files carry `SPDX-License-Identifier: AGPL-3.0-only`.
There is no new top-level entry, worker operation or schema, and no persistence,
server or hosted authorization surface was introduced.

**Exclusions retained from this brief:**

- Scenario copies and comparison: reserved for plan 0004; Try a change is disabled.
- Export: reserved for plan 0005; Export is disabled.
- Full rule-reference views per ledger line: explicitly deferred by this brief.
- A charting library: excluded by decision 0011; charts are hand-built inline SVG.

The following table records every invocation in the final cumulative validation
ledger, including the compilation-inclusive timing attempt, its build/retry and
the final source-scope checks. Counts are harness counts summed within a command,
not estimates of distinct tests across repeated invocations. Durations are command
wall times; the separately requested WebAssembly harness duration is given above.

| # | Revision | Directory | Command | Exit | Counts / observation | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `5bfcbdc` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) | 0.013 |
| 2 | `5bfcbdc` | workspace root | `cargo --version` | 0 | cargo 1.99.1 (5f94df478 2026-08-27) | 0.011 |
| 3 | `5bfcbdc` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 | 0.004 |
| 4 | `5bfcbdc` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 | 0.017 |
| 5 | `5bfcbdc` | workspace root | `node --version` | 0 | v24.22.0 | 0.001 |
| 6 | `5bfcbdc` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed, 0 failed, 0 ignored | 24.756 |
| 7 | `5bfcbdc` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed, 0 failed, 0 ignored | 4.920 |
| 8 | `5bfcbdc` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed, 0 failed, 0 ignored | 0.409 |
| 9 | `5bfcbdc` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed, 0 failed, 0 ignored | 0.122 |
| 10 | `5bfcbdc` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed, 0 failed, 0 ignored | 4.612 |
| 11 | `5bfcbdc` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed, 0 failed, 0 ignored | 0.346 |
| 12 | `5bfcbdc` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed, 0 failed, 0 ignored | 1.253 |
| 13 | `5bfcbdc` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed, 0 failed, 0 ignored | 0.213 |
| 14 | `5bfcbdc` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed, 0 failed, 0 ignored | 0.114 |
| 15 | `5bfcbdc` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed, 0 failed, 0 ignored | 0.089 |
| 16 | `5bfcbdc` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed, 0 failed, 0 ignored | 0.050 |
| 17 | `5bfcbdc` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed, 0 failed, 0 ignored | 0.049 |
| 18 | `5bfcbdc` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed, 0 failed, 0 ignored | 0.362 |
| 19 | `5bfcbdc` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed, 0 failed, 0 ignored | 12.780 |
| 20 | `5bfcbdc` | workspace root | `cargo test --workspace` | 0 | 75 passed, 0 failed, 0 ignored | 107.048 |
| 21 | `5bfcbdc` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | clippy passed; warnings denied | 8.490 |
| 22 | `5bfcbdc` | workspace root | `cargo fmt --all --check` | 0 | Rust formatting passed | 0.085 |
| 23 | `5bfcbdc` | workspace root | `cargo test --workspace --release` | 0 | 75 passed, 0 failed, 0 ignored | 46.860 |
| 24 | `5bfcbdc` | workspace root | `cargo build --workspace --release` | 0 | workspace release build passed | 3.976 |
| 25 | `5bfcbdc` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 26 | `5bfcbdc` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | engine/app WebAssembly build passed | 4.656 |
| 27 | `5bfcbdc` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 28 | `5bfcbdc` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed, 0 failed, 0 ignored | 32.361 |
| 29 | `5bfcbdc` | workspace root | `cargo deny check licenses` | 0 | licenses ok | 0.239 |
| 30 | `5bfcbdc` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; compilation included; timing gate failed | 6.693 |
| 31 | `1070a0a` | workspace root | `cargo build -p horizon-cli --release` | 0 | CLI release build passed | 0.090 |
| 32 | `1070a0a` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; timing gate passed | 0.441 |
| 33 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.083 |
| 34 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.067 |
| 35 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.088 |
| 36 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.085 |
| 37 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.069 |
| 38 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.106 |
| 39 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.077 |
| 40 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.080 |
| 41 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.108 |
| 42 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.168 |
| 43 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.100 |
| 44 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.428 |
| 45 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.491 |
| 46 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 47 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 48 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.051 |
| 49 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 50 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.059 |
| 51 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 52 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 53 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 54 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 55 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 56 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 57 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 58 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 59 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 60 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 61 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 62 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.107 |
| 63 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.107 |
| 64 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 65 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.079 |
| 66 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.077 |
| 67 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 68 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.492 |
| 69 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.286 |
| 70 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.533 |
| 71 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 72 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 73 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.078 |
| 74 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 75 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 76 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 77 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.065 |
| 78 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 79 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.079 |
| 80 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.072 |
| 81 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.177 |
| 82 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.120 |
| 83 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.126 |
| 84 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.192 |
| 85 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.143 |
| 86 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.378 |
| 87 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.248 |
| 88 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.254 |
| 89 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.347 |
| 90 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.511 |
| 91 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.222 |
| 92 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 2.844 |
| 93 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 3.012 |
| 94 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.055 |
| 95 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 96 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 97 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 98 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 99 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 100 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 101 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.080 |
| 102 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.055 |
| 103 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 104 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 105 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 106 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 107 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.051 |
| 108 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 109 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.074 |
| 110 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.381 |
| 111 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.456 |
| 112 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.171 |
| 113 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.178 |
| 114 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.172 |
| 115 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 116 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 2.973 |
| 117 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 1.174 |
| 118 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 3.247 |
| 119 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.054 |
| 120 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 121 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 122 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 123 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 124 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.054 |
| 125 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 126 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 127 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 128 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.142 |
| 129 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 130 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.070 |
| 131 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 132 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.079 |
| 133 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.114 |
| 134 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.107 |
| 135 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.113 |
| 136 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.100 |
| 137 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.112 |
| 138 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.160 |
| 139 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.100 |
| 140 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.428 |
| 141 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.489 |
| 142 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 143 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.053 |
| 144 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.055 |
| 145 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 146 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 147 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 148 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 149 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 150 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 151 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 152 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 153 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 154 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 155 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 156 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 157 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 158 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.105 |
| 159 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.104 |
| 160 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 161 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 162 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.080 |
| 163 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 164 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.492 |
| 165 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.291 |
| 166 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.541 |
| 167 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.056 |
| 168 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 169 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 170 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.052 |
| 171 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 172 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 173 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 174 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 175 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 176 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 177 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON document + newline; partial | 4.830 |
| 178 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 179 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 180 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 181 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 182 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 183 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.058 |
| 184 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.054 |
| 185 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.053 |
| 186 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.065 |
| 187 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.091 |
| 188 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.095 |
| 189 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.111 |
| 190 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.114 |
| 191 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 192 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.053 |
| 193 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 194 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 195 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 196 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 197 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 198 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 199 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 200 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 201 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 202 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 203 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 204 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 205 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 206 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 207 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.055 |
| 208 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 209 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 210 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 211 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 212 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.060 |
| 213 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.092 |
| 214 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.080 |
| 215 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.095 |
| 216 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 217 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.068 |
| 218 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 219 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 220 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 221 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.052 |
| 222 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 223 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 224 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 225 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 226 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 227 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.073 |
| 228 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.078 |
| 229 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.072 |
| 230 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 231 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.076 |
| 232 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.073 |
| 233 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.070 |
| 234 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.067 |
| 235 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.129 |
| 236 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.152 |
| 237 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.160 |
| 238 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.172 |
| 239 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.051 |
| 240 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 241 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 242 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 243 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 244 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 245 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 246 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 247 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 248 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 249 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 250 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 251 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 252 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 253 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 254 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 255 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.077 |
| 256 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.085 |
| 257 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.071 |
| 258 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.077 |
| 259 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.072 |
| 260 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.084 |
| 261 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.151 |
| 262 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.129 |
| 263 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.167 |
| 264 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.051 |
| 265 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 266 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 267 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 268 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 269 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.053 |
| 270 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 271 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.044 |
| 272 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 273 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 274 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.074 |
| 275 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 276 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 277 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 278 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.071 |
| 279 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 280 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.064 |
| 281 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.065 |
| 282 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 283 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 284 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.067 |
| 285 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.061 |
| 286 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.057 |
| 287 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.062 |
| 288 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.115 |
| 289 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.142 |
| 290 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.156 |
| 291 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.159 |
| 292 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 293 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 294 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 295 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 296 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 297 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 298 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.054 |
| 299 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.060 |
| 300 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 301 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 302 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 303 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 304 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 305 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 306 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 307 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 308 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.065 |
| 309 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.066 |
| 310 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 311 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 312 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.067 |
| 313 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 314 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.143 |
| 315 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.116 |
| 316 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.148 |
| 317 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.052 |
| 318 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.068 |
| 319 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 320 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.051 |
| 321 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 322 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.043 |
| 323 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 324 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 325 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.068 |
| 326 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.065 |
| 327 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.096 |
| 328 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.107 |
| 329 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.099 |
| 330 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 331 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.094 |
| 332 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.093 |
| 333 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.082 |
| 334 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.073 |
| 335 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.088 |
| 336 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.268 |
| 337 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.329 |
| 338 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.370 |
| 339 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.358 |
| 340 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.099 |
| 341 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.094 |
| 342 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.099 |
| 343 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.097 |
| 344 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.098 |
| 345 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.096 |
| 346 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.318 |
| 347 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.247 |
| 348 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.335 |
| 349 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.089 |
| 350 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 351 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 352 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.094 |
| 353 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON document + newline; invalid | 0.057 |
| 354 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.051 |
| 355 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.057 |
| 356 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 357 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON document + newline; partial | 0.056 |
| 358 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.061 |
| 359 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 360 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 361 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON document + newline; partial | 0.058 |
| 362 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON document + newline; partial | 0.055 |
| 363 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON document + newline; partial | 0.054 |
| 364 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 365 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON document + newline; partial | 0.094 |
| 366 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON document + newline; partial | 0.093 |
| 367 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON document + newline; partial | 0.109 |
| 368 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON document + newline; partial | 0.115 |
| 369 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 370 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 371 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 372 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 373 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.053 |
| 374 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 375 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 376 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 377 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 378 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 379 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 380 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 381 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 382 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 383 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 384 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 385 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON document + newline; partial | 0.057 |
| 386 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON document + newline; partial | 0.058 |
| 387 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 388 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 389 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 390 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 391 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON document + newline; partial | 0.096 |
| 392 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.085 |
| 393 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON document + newline; partial | 0.097 |
| 394 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 395 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 396 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 397 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 398 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.046 |
| 399 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 400 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.050 |
| 401 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.051 |
| 402 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.061 |
| 403 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 404 | `1070a0a` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 405 | `1070a0a` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed, 0 failed, 0 ignored; harness 4.99 s | 6.228 |
| 406 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | 1 canonical JSON document + newline; partial | 0.497 |
| 407 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/web-input-check-rough.json` | 3 | 1 canonical JSON document + newline; partial | 2.659 |
| 408 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.127 |
| 409 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.424 |
| 410 | `1070a0a` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 2.824 |
| 411 | `1070a0a` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed, 0 failed, 0 ignored | 6.141 |
| 412 | `1070a0a` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 413 | `1070a0a` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | release WebAssembly binding build passed | 0.062 |
| 414 | `1070a0a` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 415 | `1070a0a` | apps/web | `corepack --version` | 0 | 0.36.0 | 0.031 |
| 416 | `1070a0a` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 | 0.041 |
| 417 | `1070a0a` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | frozen lockfile; 383 policy entries passed | 6.915 |
| 418 | `1070a0a` | apps/web | `corepack pnpm run build:engine` | 0 | engine binding built | 0.153 |
| 419 | `1070a0a` | apps/web | `corepack pnpm run types` | 0 | schema types generated | 0.251 |
| 420 | `1070a0a` | apps/web | `corepack pnpm run typecheck` | 0 | TypeScript passed | 1.312 |
| 421 | `1070a0a` | apps/web | `corepack pnpm run lint` | 0 | ESLint passed | 2.087 |
| 422 | `1070a0a` | apps/web | `corepack pnpm run format:check` | 0 | Prettier passed | 0.512 |
| 423 | `1070a0a` | apps/web | `corepack pnpm test` | 0 | 57 tests / 11 files passed; 0 failed | 4.236 |
| 424 | `1070a0a` | apps/web | `corepack pnpm run build` | 0 | production build passed; 36 modules | 1.906 |
| 425 | `1070a0a` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Chromium, Firefox and WebKit install command passed | 0.301 |
| 426 | `1070a0a` | apps/web | `corepack pnpm run e2e` | 0 | 24 passed; 0 unexpected/skipped/flaky; 12 projects; 612 captures | 313.470 |
| 427 | `1070a0a` | apps/web | `corepack pnpm run licenses` | 0 | licenses passed: 4 shipped / 358 full package versions | 0.347 |
| 428 | `1070a0a` | workspace root | `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 | 0.001 |
| 429 | `1070a0a` | workspace root | `git diff --exit-code 5bfcbdc976a8e8ff04abc43682daa7e8111100d5 1070a0ae8390d7bc3cd9da1559352555b8ca9a7b -- packages Cargo.toml Cargo.lock rust-toolchain.toml deny.toml docs/model docs/briefs/assets apps/web/package.json apps/web/pnpm-lock.yaml` | 0 | 0 changes in protected source/assets/dependencies | 0.007 |
| 430 | `1070a0a` | workspace root | `git diff --check` | 0 | 0 whitespace errors | 0.007 |

### Fix round 1 — v1.1 (2026-10-19)

**Branch:** `codex/0003-W2-plan-screen`.
**Source/test revision validated:** `7b4d7b849c5a69c8d4e5da0d97ae839fd560858a`.
This record is committed after that revision; the final tip is reported separately
at handoff.

**Status of the v1 acceptance discrepancy: resolved by v1.1.** Done when 1 now
specifies $886 at age 93 and $1 at age 95, in today's dollars, matching the
unchanged engine cents and required rounding. The working table also includes
age 65, $934,687, the highest savings. All five specified savings amounts are
now checked against complete rendered cells. The earlier record above is kept
as the historical v1 record, not as a statement of a current discrepancy.

The branch was rebased with `git rebase main` (exit 0) onto
`3f9f9fe`, which contains the v1.1 brief. Main remained at that revision.
There was no brief conflict. A byte comparison proved that everything above
`## Implementation record` matches main's v1.1 text and that the earlier record
was retained exactly after the rebase. The replayed implementation and record
commits are `66d0e78` and `6f0f6e1`; the fixes follow them. No main-branch change,
push, hook bypass or change to another worktree was performed. The fix source
commit passed the public-boundary hooks.

**Changes and regression evidence:**

- Both e2e flows now use the same keyboard helper. It tries the preferred
  direction for at most 100 key presses, then the other direction, while retaining
  native Tab/Alt+Tab traversal and focus assertions. Three unit cases cover a
  trapped reverse pass followed by nine forward presses for both Tab and Alt+Tab,
  and bounded failure after trying both directions. No programmatic focus is
  used to bypass traversal in this helper.
- Skipped levers are not rendered. The displayed hint counts the offered ranked
  levers. Both retired samples are checked for the exact four-lever hint, four
  chart rows and absence of a retirement-date lever or skipped-code list.
- Answer 3 uses lower-case mapped words with only the sentence's first letter
  capitalised. The working, synthetic-retired and A-drawdown sentences are checked
  exactly, including "Spending, then investment returns."
- The shortfall explanation selects the before-retirement sentence when the
  first shortfall year precedes the retirement-date year. The underfunded sample's
  full 2026 sentence is checked exactly: nominal spending $120,000, income
  $30,000, savings supply $40,000 and shortfall $53,826. The working sample's
  complete after-retirement explanation, distributions sentence and rules line
  also have exact assertions.
- Savings-table selection includes the actual highest-savings year. A unit case
  proves inclusion when that year is not a five-year or retirement landmark.
  All rendered savings cells are compared with native run amounts, and all
  specified working amounts, including $1, use complete-cell assertions.
- A zero-effect lever displays "No change" without an effect amount or bar.
  A unit test checks both its chart and table representations.
- Reference answers, lever values and outcomes, ledger notes, and the edited
  assumptions row use whole-sentence or whole-cell assertions. The navigation
  unit test now changes the workplace account to $600,000, checks the edited
  cents in all three requests, returns to Review and verifies the retained entry.
- Unexpected native-call statuses include command/fixture, status, signal,
  error stack and the final 4,000 characters of stderr in the assertion message.
  No retry is added to hide an unexpected status.

**Fresh cumulative validation:** all 429 invocations below ran against the
source/test revision above, with no source or test changes during the sequence.
The Rust sequence and fixture expansion ran first, then the complete ordered web
sequence, including browser installation and e2e execution. A CLI release build
immediately before the timed levers invocation ensured compilation was complete.
Expected partial, invalid and unsupported exits were validated against each JSON
status; they are not failures. No cached output was treated as a new pass.

- Native workspace: 75 passed in debug and 75 in release; native parity:
  15 passed; WebAssembly parity: 14 passed. Clippy, Rust formatting, debug/release
  builds and Rust licenses passed.
- All 48 fixtures, the explicit six-item rough reference, the five comparison
  reference pairs, all 26 current golden imports and three rejection imports were
  exercised. The ledger records 377 CLI invocations including performance and
  explicit web-reference calls. Each produced one canonical JSON document and
  one newline with the expected exit; `dev-run` retained exit 0 for partial.
- Release levers (31): **0.416 s**, exit 3, below two seconds. Isolated
  WebAssembly levers (404): **4.97 s from the harness**, 1 passed, exit 0;
  command wall time 5.761 s. The full WebAssembly harness passed in 19.70 s.
- Web typecheck, lint, format check, build and browser installation passed.
  Vitest: **62 passed across 12 files**, zero failed.
- Playwright 1.63.0: **24 passed across all 12 projects**, zero skipped,
  unexpected or flaky tests. Executed browser-version annotations report
  Chromium **153.0.8010.12**, Firefox **155.0** and WebKit **26.6**. Every browser
  ran at 375×812 and 1280×800 in light and dark themes.
- The run generated **612 fresh full-page captures**, their report attachments,
  and the Playwright HTML/JSON reports in a separate external evidence location.
  The earlier evidence folder was not modified. Every captured screen passed axe
  and page-overflow checks. The suite exercised all samples, earlier setup/input
  checks, all plan sections in chart/table views, edited input, errors, keyboard
  controls, exact figures/text, actual worker/native byte parity, storage/cookie
  denial and no off-origin requests.
- Web licenses passed for **4 shipped package versions** and **358 package
  versions** in the full closure.

**Tools:** Rust/cargo 1.99.1; Node **v24.22.0**; corepack **0.36.0**;
pnpm **12.9.1** through corepack in `apps/web`; wasm-bindgen and its runner
**0.2.129**; cargo-deny **0.20.2**. Node observations accompany WebAssembly runs;
the same Node PATH was retained. The preinstalled pinned toolchain was used.
No dependencies were added, so there are no new dependency versions or licenses
to inventory. New helper/test source files carry the AGPL-3.0-only SPDX header.

**Platform validation limit:** this execution environment is Linux. All browser
results above are Linux results; no native macOS browser pass is claimed.
The Alt+Tab unit cases simulate the reported traversal trap and prove fallback,
but native macOS WebKit execution remains a separate platform check.

**Scope and exclusions:** no engine, financial rule, fixture, model/tax version,
schema, golden, dependency manifest/lockfile, design asset or top-level entry
changed. Command 428 checks these protected paths against main. Scenario copies
and comparison remain excluded for plan 0004; Export remains excluded for plan
0005; per-line full rule-reference views remain deferred; a charting library
remains excluded by decision 0011. The unavailable actions stay disabled.
No requested Linux validation was excluded.

Before committing the source revision, development validation also ran:
`corepack pnpm run typecheck` (0), `corepack pnpm test` (0; 62 tests / 12 files),
`corepack pnpm run lint` (0), `corepack pnpm run build` (0), and
`corepack pnpm run e2e --project=chromium-375-light --grep='plan:'`
(0; 1 passed, 26.7 s). These used the working source subsequently committed as
the revision above; the entire ordered sequence was then executed afresh.

The following fix-round ledger retains each actual command, exit, counts and
wall time. Test counts are summed within each command; separate repeated
invocations are not represented as distinct test cases.

| # | Revision | Directory | Command | Exit | Counts / observation | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `7b4d7b8` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) | 0.068 |
| 2 | `7b4d7b8` | workspace root | `cargo --version` | 0 | cargo 1.99.1 (5f94df478 2026-08-27) | 0.011 |
| 3 | `7b4d7b8` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 | 0.004 |
| 4 | `7b4d7b8` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 | 0.018 |
| 5 | `7b4d7b8` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 6 | `7b4d7b8` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed, 0 failed, 0 ignored | 5.825 |
| 7 | `7b4d7b8` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed, 0 failed, 0 ignored | 5.219 |
| 8 | `7b4d7b8` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed, 0 failed, 0 ignored | 0.415 |
| 9 | `7b4d7b8` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed, 0 failed, 0 ignored | 0.126 |
| 10 | `7b4d7b8` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed, 0 failed, 0 ignored | 4.515 |
| 11 | `7b4d7b8` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed, 0 failed, 0 ignored | 0.330 |
| 12 | `7b4d7b8` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed, 0 failed, 0 ignored | 0.049 |
| 13 | `7b4d7b8` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed, 0 failed, 0 ignored | 0.191 |
| 14 | `7b4d7b8` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed, 0 failed, 0 ignored | 0.109 |
| 15 | `7b4d7b8` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed, 0 failed, 0 ignored | 0.072 |
| 16 | `7b4d7b8` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed, 0 failed, 0 ignored | 0.044 |
| 17 | `7b4d7b8` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed, 0 failed, 0 ignored | 0.044 |
| 18 | `7b4d7b8` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed, 0 failed, 0 ignored | 0.355 |
| 19 | `7b4d7b8` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed, 0 failed, 0 ignored | 4.999 |
| 20 | `7b4d7b8` | workspace root | `cargo test --workspace` | 0 | 75 passed, 0 failed, 0 ignored | 88.401 |
| 21 | `7b4d7b8` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | clippy passed; warnings denied | 0.184 |
| 22 | `7b4d7b8` | workspace root | `cargo fmt --all --check` | 0 | Rust formatting passed | 0.086 |
| 23 | `7b4d7b8` | workspace root | `cargo test --workspace --release` | 0 | 75 passed, 0 failed, 0 ignored | 12.520 |
| 24 | `7b4d7b8` | workspace root | `cargo build --workspace --release` | 0 | workspace release build passed | 0.076 |
| 25 | `7b4d7b8` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 26 | `7b4d7b8` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | engine/app WebAssembly build passed | 0.077 |
| 27 | `7b4d7b8` | workspace root | `node --version` | 0 | v24.22.0 | 0.001 |
| 28 | `7b4d7b8` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed, 0 failed, 0 ignored | 20.858 |
| 29 | `7b4d7b8` | workspace root | `cargo deny check licenses` | 0 | licenses ok | 0.119 |
| 30 | `7b4d7b8` | workspace root | `cargo build -p horizon-cli --release` | 0 | CLI release build passed | 0.058 |
| 31 | `7b4d7b8` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; release-levers timing passed | 0.416 |
| 32 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.080 |
| 33 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.066 |
| 34 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 35 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.078 |
| 36 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.067 |
| 37 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.107 |
| 38 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.078 |
| 39 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.078 |
| 40 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.108 |
| 41 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.150 |
| 42 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.100 |
| 43 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.423 |
| 44 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.491 |
| 45 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 46 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 47 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.050 |
| 48 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.066 |
| 49 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 50 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 51 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 52 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 53 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 54 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 55 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 56 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 57 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 58 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 59 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 60 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 61 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.106 |
| 62 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.106 |
| 63 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 64 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.078 |
| 65 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 66 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 67 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.490 |
| 68 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.288 |
| 69 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.530 |
| 70 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 71 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 72 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 73 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 74 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 75 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 76 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 77 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 78 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 79 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 80 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 81 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.118 |
| 82 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.126 |
| 83 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.190 |
| 84 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.144 |
| 85 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.378 |
| 86 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.248 |
| 87 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.251 |
| 88 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.343 |
| 89 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.494 |
| 90 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.217 |
| 91 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 2.846 |
| 92 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 2.967 |
| 93 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.055 |
| 94 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 95 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 96 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 97 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.055 |
| 98 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 99 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 100 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 101 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 102 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 103 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 104 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 105 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.067 |
| 106 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 107 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 108 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 109 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.384 |
| 110 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.450 |
| 111 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 112 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.172 |
| 113 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.169 |
| 114 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.162 |
| 115 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 2.998 |
| 116 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 1.174 |
| 117 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 3.267 |
| 118 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.055 |
| 119 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.171 |
| 120 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.161 |
| 121 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 122 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 123 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 124 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 125 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 126 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.167 |
| 127 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.141 |
| 128 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 129 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.070 |
| 130 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.066 |
| 131 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.079 |
| 132 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.067 |
| 133 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.105 |
| 134 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.078 |
| 135 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.079 |
| 136 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.109 |
| 137 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.149 |
| 138 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.098 |
| 139 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.437 |
| 140 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.492 |
| 141 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 142 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 143 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 144 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 145 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 146 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 147 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 148 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 149 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 150 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 151 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.043 |
| 152 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 153 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 154 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 155 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 156 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 157 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.104 |
| 158 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.102 |
| 159 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 160 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 161 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 162 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 163 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.494 |
| 164 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.294 |
| 165 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial | 0.528 |
| 166 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 167 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.077 |
| 168 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.076 |
| 169 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.053 |
| 170 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 171 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 172 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 173 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 174 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 175 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete | 0.071 |
| 176 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON document + newline; partial | 4.828 |
| 177 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.062 |
| 178 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 179 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 180 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 181 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 182 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 183 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.053 |
| 184 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.051 |
| 185 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 186 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.081 |
| 187 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.092 |
| 188 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.110 |
| 189 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.110 |
| 190 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 191 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 192 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 193 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 194 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 195 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 196 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 197 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 198 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 199 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 200 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 201 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 202 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 203 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 204 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 205 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 206 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.055 |
| 207 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 208 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 209 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 210 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 211 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 212 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.098 |
| 213 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.080 |
| 214 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.095 |
| 215 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.046 |
| 216 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 217 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 218 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 219 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 220 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 221 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 222 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 223 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 224 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 225 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 226 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.071 |
| 227 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.074 |
| 228 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.077 |
| 229 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 230 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.077 |
| 231 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.073 |
| 232 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.070 |
| 233 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.077 |
| 234 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.126 |
| 235 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.151 |
| 236 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.167 |
| 237 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.171 |
| 238 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.053 |
| 239 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 240 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 241 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 242 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 243 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.051 |
| 244 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 245 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 246 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 247 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 248 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 249 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 250 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 251 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.038 |
| 252 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 253 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 254 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.076 |
| 255 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.076 |
| 256 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.068 |
| 257 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.090 |
| 258 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.069 |
| 259 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.072 |
| 260 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.151 |
| 261 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.128 |
| 262 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.155 |
| 263 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 264 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 265 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.070 |
| 266 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.048 |
| 267 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 268 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 269 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.052 |
| 270 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 271 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.069 |
| 272 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 273 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.075 |
| 274 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.082 |
| 275 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.075 |
| 276 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.073 |
| 277 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.069 |
| 278 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 279 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial | 0.063 |
| 280 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 281 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 282 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 283 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON document + newline; partial | 0.055 |
| 284 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial | 0.063 |
| 285 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial | 0.056 |
| 286 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.062 |
| 287 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON document + newline; partial | 0.114 |
| 288 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON document + newline; partial | 0.139 |
| 289 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.154 |
| 290 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial | 0.156 |
| 291 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 292 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 293 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 294 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 295 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 296 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 297 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 298 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 299 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 300 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 301 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 302 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 303 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 304 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 305 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 306 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 307 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial | 0.063 |
| 308 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial | 0.063 |
| 309 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 310 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 311 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 312 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 313 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON document + newline; partial | 0.140 |
| 314 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.121 |
| 315 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON document + newline; partial | 0.144 |
| 316 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 317 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.063 |
| 318 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 319 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 320 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 321 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 322 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.046 |
| 323 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 324 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.064 |
| 325 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.065 |
| 326 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.111 |
| 327 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 328 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.100 |
| 329 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 330 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.094 |
| 331 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.092 |
| 332 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.081 |
| 333 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.072 |
| 334 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.087 |
| 335 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.241 |
| 336 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.317 |
| 337 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.358 |
| 338 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.352 |
| 339 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.093 |
| 340 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.093 |
| 341 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 342 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.100 |
| 343 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 344 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 345 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.317 |
| 346 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.246 |
| 347 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON document + newline; partial | 0.329 |
| 348 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.100 |
| 349 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.094 |
| 350 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 351 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete | 0.095 |
| 352 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON document + newline; invalid | 0.057 |
| 353 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.049 |
| 354 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON document + newline; unsupported | 0.055 |
| 355 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON document + newline; complete | 0.053 |
| 356 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON document + newline; partial | 0.046 |
| 357 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.059 |
| 358 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 359 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete | 0.057 |
| 360 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON document + newline; partial | 0.057 |
| 361 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON document + newline; partial | 0.054 |
| 362 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON document + newline; partial | 0.053 |
| 363 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete | 0.060 |
| 364 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON document + newline; partial | 0.081 |
| 365 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON document + newline; partial | 0.093 |
| 366 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON document + newline; partial | 0.108 |
| 367 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON document + newline; partial | 0.110 |
| 368 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 369 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid | 0.064 |
| 370 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 371 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid | 0.046 |
| 372 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 373 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 374 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 375 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 376 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 377 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 378 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 379 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid | 0.052 |
| 380 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 381 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid | 0.047 |
| 382 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid | 0.049 |
| 383 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid | 0.048 |
| 384 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON document + newline; partial | 0.056 |
| 385 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON document + newline; partial | 0.058 |
| 386 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 387 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 388 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.055 |
| 389 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.056 |
| 390 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON document + newline; partial | 0.093 |
| 391 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete | 0.081 |
| 392 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON document + newline; partial | 0.096 |
| 393 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 394 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 395 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 396 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported | 0.051 |
| 397 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.046 |
| 398 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported | 0.046 |
| 399 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 400 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported | 0.047 |
| 401 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 402 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete | 0.054 |
| 403 | `7b4d7b8` | workspace root | `node --version` | 0 | v24.22.0 | 0.001 |
| 404 | `7b4d7b8` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed, 0 failed, 0 ignored; harness 4.97 s | 5.761 |
| 405 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | 1 canonical JSON document + newline; partial | 0.523 |
| 406 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/web-input-check-rough.json` | 3 | 1 canonical JSON document + newline; partial | 2.636 |
| 407 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.112 |
| 408 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 0.417 |
| 409 | `7b4d7b8` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial | 2.821 |
| 410 | `7b4d7b8` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed, 0 failed, 0 ignored | 4.017 |
| 411 | `7b4d7b8` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 412 | `7b4d7b8` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | release WebAssembly binding built | 0.065 |
| 413 | `7b4d7b8` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 414 | `7b4d7b8` | apps/web | `corepack --version` | 0 | 0.36.0 | 0.029 |
| 415 | `7b4d7b8` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 | 0.036 |
| 416 | `7b4d7b8` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | frozen lockfile; 383 policy entries passed | 6.109 |
| 417 | `7b4d7b8` | apps/web | `corepack pnpm run build:engine` | 0 | engine binding built | 0.148 |
| 418 | `7b4d7b8` | apps/web | `corepack pnpm run types` | 0 | schema types generated | 0.291 |
| 419 | `7b4d7b8` | apps/web | `corepack pnpm run typecheck` | 0 | TypeScript passed | 1.345 |
| 420 | `7b4d7b8` | apps/web | `corepack pnpm run lint` | 0 | ESLint passed | 1.899 |
| 421 | `7b4d7b8` | apps/web | `corepack pnpm run format:check` | 0 | Prettier passed | 0.511 |
| 422 | `7b4d7b8` | apps/web | `corepack pnpm test` | 0 | 62 passed / 12 files; 0 failed | 4.208 |
| 423 | `7b4d7b8` | apps/web | `corepack pnpm run build` | 0 | production build passed; 36 modules | 1.868 |
| 424 | `7b4d7b8` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Chromium, Firefox and WebKit installation passed | 0.391 |
| 425 | `7b4d7b8` | apps/web | `corepack pnpm run e2e` | 0 | 24 passed; 0 unexpected/skipped/flaky; 12 projects; 612 captures | 295.520 |
| 426 | `7b4d7b8` | apps/web | `corepack pnpm run licenses` | 0 | licenses passed: 4 shipped / 358 full package versions | 0.331 |
| 427 | `7b4d7b8` | workspace root | `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 | 0.001 |
| 428 | `7b4d7b8` | workspace root | `git diff --exit-code main HEAD -- packages Cargo.toml Cargo.lock rust-toolchain.toml deny.toml docs/model docs/briefs/assets apps/web/package.json apps/web/pnpm-lock.yaml` | 0 | 0 protected-source/asset/dependency changes | 0.009 |
| 429 | `7b4d7b8` | workspace root | `git diff --check` | 0 | 0 whitespace errors | 0.013 |
