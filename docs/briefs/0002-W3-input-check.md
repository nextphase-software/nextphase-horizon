BRIEF VERSION: 0002-W3 v1 (2026-10-18)

# 0002-W3 — Input check

## Outcome

After the guided setup, a person sees which of the entries they marked rough could change their result, ranked by how much each could change their headroom. A rough entry that could change headroom by at least 1% of what the household can sustainably spend is labelled "Matters"; the rest "Barely matters". For each entry they can go back and refine it, or keep it rough. The screen says plainly that it measures how complete the inputs are, not how likely the plan is to work. In the setup, marking a value rough becomes a small toggle beside each field's label.

This milestone builds reference screen 3 (`docs/briefs/assets/design-v1/03-input-check.html`) and changes how rough marks are entered on screen 2.

## Deliverables

1. **Rough toggle in the guided setup** (replaces the "Rough" checkbox of 0002-W2).
   - **Placement and control:** each rough-eligible field (dollar and percent fields, as in 0002-W2) has a small toggle button beside its label: `aria-pressed`, keyboard-operable.
   - **Text:** off, it reads "≈ Rough?" in quiet text; on, it reads "≈ Rough value" with a check mark.
   - **When on,** the field gets the dashed `color-estimate-text` outline (DESIGN.md, "Rough values").
   - The toggle's accessible name includes the field label, for example "Mark Balance today, Cash savings, as rough".
   - The review page shows rough marks as before.
2. **Reaching the input check:**
   - the Review page's primary button becomes **"Continue to the input check"**, and "Check this household" stays as the secondary button with its 0002-W2 behaviour;
   - the step bar's **Check** step becomes active once the Review page has been reached, while Plan, Compare and Export stay "not available yet".
3. **One engine call.** The screen sends the edited input and the rough marks through the worker to `input_impact(fixture, rough)`:
   - **Rough items:** one item `{"path": <the marked field's input path>}` per marked field, with no explicit ranges, so the engine's default ranges apply. Items are in setup order: the step order, then field order within a step.
   - **Display:** the screen shows the engine's items in the engine's order, which is ranked by impact.
   - **Errors:** an error envelope shows its status word and message with no figures, plus "Back to household".
4. **Matters rule** (classification only; no new figure). Let `S` be the result's `baseline.sustainable_spending` and `I` an item's `impact`, both whole dollars a year.
   - An item **matters** when `I ≠ 0` and `100 × |I| ≥ S`, compared exactly in integers. The boundary counts as matters.
   - Otherwise it **barely matters**. An impact of zero never matters, including when `S` is 0.
   - **The 1% amount shown** is `S / 100` rounded half up to whole dollars, for display only: "1% · $650" for `S = 64,994`.
5. **Input check screen** (reference screen 3). It must match the reference in these points:
   1. **Eyebrow and headline:**
      - the eyebrow reads "INPUT CHECK · " plus the sample's label;
      - the headline counts in words from one to ten and numerals above: "<N> entries are rough. <M> of them matter.";
      - singular: "One entry is rough. It matters." or "One entry is rough. It barely matters.";
      - when none matter: "None of them matter."; when all of two or more matter: "All of them matter.";
      - with no rough marks: "No entries are marked rough."
   2. **Subline, exactly:** "Ranked by how much each could change your headroom. This shows how complete your inputs are, **not** how likely your plan is to work."
   3. **One card per item, in engine order:**
      - **title:** the label from the table below;
      - **value line:** the entered value as below;
      - **tag:** the dashed "Rough value" tag;
      - **verdict line:** "**Matters**" or "**Barely matters**", then " · could change your headroom by up to **$I** a year";
      - **bar:** see item 4;
      - **tested line:** "Tested from <low> to <high>; headroom <headroom_low> to <headroom_high> (today's dollars).", with dollar amounts formatted like the reference ("−$4,311"), "a year" after the range for yearly amounts, and percents for rates;
      - **actions:** "Refine" (a button) and "Keep as rough" (a link-styled button).
   4. **Bar:**
      - its length is proportional to `|I|` on a scale whose maximum is the smallest value of the form 1, 2, 2.5 or 5 × 10^k, with k a whole number ≥ 0, that is at least the larger of the biggest `|I|` and the 1% amount;
      - a marker labelled "1% · $<amount>" sits at the 1% amount;
      - the bar and marker are `aria-hidden`; the verdict line carries the information.
   5. **Collapsed sections,** each with a short hint:
      - "How “matters” is decided" (hint "1% of $<S> a year"): the rule in one sentence;
      - "How each entry was tested" (hint "Default ranges"): the default ranges from `docs/model/answers.md`;
      - "Entered without a rough mark" (hint "<N> groups of entries"): each setup step with the number of its fields not marked rough. With no rough marks, this section starts open.
   6. **Buttons:**
      - "See the plan" is shown, marked "Not available yet", and not operable;
      - "Back to household" returns to the Review page;
      - the footer and the privacy note are as in 0002-W2.
6. **Labels and value lines,** by input path. `<name>` is the account's readable name from 0002-W2.

   | Path | Title | Value line |
   | --- | --- | --- |
   | `/household/income/wages/0/amount/cents` | Wages | "$85,000 a year, today's dollars" |
   | `/household/income/social_security/amount/cents` | Social Security benefit | "$26,000 a year from 67, today's dollars" |
   | `/household/income/pension/amount/cents` | Pension | "$0 a year from 65, nominal dollars" |
   | `/household/accounts/<i>/opening_balance_cents` | `<name>` balance | "$520,000, today's dollars" |
   | `/household/accounts/<i>/cost_basis_cents` | `<name>` cost basis | "$110,000" |
   | `/household/spending/before_retirement/cents` | Spending until you retire | "$62,000 a year, today's dollars" |
   | `/household/spending/after_retirement/cents` | Spending after you retire | "$67,000 a year, today's dollars" |
   | `/assumptions/<identifier>/value` | Inflation, Investment return, Cash return, or Tax-threshold indexing | "2.5% a year" |

   The dollar basis comes from the input, as in 0002-W2. The example values are the working sample's.
7. **Actions:**
   - **Refine** opens the setup step that holds the field and moves focus to that field.
   - **Keep as rough** marks the card "Kept as rough" and turns the action into "Undo". The rough mark stays either way.
   - Leaving and returning to the input check re-runs the engine on the current entries.

## Done when

1. **Must-match points:** every point of deliverable 5 holds in all three browsers, both sizes and both themes. The reviewer compares screenshots with reference screen 3.
2. **Reference case, keyboard only:**
   - **Steps:** choose the working sample; mark three entries rough with their toggles (Social Security per year, Spending per year before retirement, and Brokerage account cost basis); continue to the input check.
   - **Headline:** "Three entries are rough. Two of them matter."
   - **Cards,** in this order, against the native engine (`horizon-engine-0.4.0`, verified 2026-10-18; `S = 64,994`; 1% amount $650):

     | Card | Verdict | Up to | Tested range | Headroom |
     | --- | --- | --- | --- | --- |
     | Social Security benefit | Matters | **$2,305** | $23,400 to $28,600 a year | −$4,311 to $274 |
     | Spending until you retire | Matters | **$1,624** | $55,800 to $68,200 a year | −$430 to −$3,630 |
     | Brokerage account cost basis | Barely matters | **$8** | $82,500 to $137,500 | −$2,014 to −$1,998 |

3. **Parity:** the worker's `input_impact` output for that input and rough list is byte-identical to the native CLI's output for the committed files `packages/app/test-data/web-input-check-rough.json` (the three items) with fixture `answers-working-61`. The CLI exits 3 (partial).
4. **Edge cases:**
   - **No rough marks:** "No entries are marked rough.", with "Entered without a rough mark" open.
   - **One rough entry:** the singular headline.
   - **An engine error:** status word and message, no figures.
   - **Unit tests for the matters rule:**
     - `S = 64,994`: `I = 650` matters, `649` does not;
     - `S = 65,000`: `I = 650` matters (the boundary);
     - `I = 0` never matters;
     - `S = 0`: `I = 1` matters.

     Plus unit tests for the headline templates and the bar scale (for example 2,305 → 2,500; 650 alone → 1,000; 0 → 1).
5. **Rough toggle:** keyboard-operable with `aria-pressed`; named for its field; shows the dashed outline when on; rough marks reach the input check. The 0002-W2 behaviours and tests still pass, updated for the toggle.
6. **Refine and Keep as rough** behave as in deliverable 7; Refine's focus lands on the field.
7. **Earlier guarantees:**
   - no storage, cookies or off-origin requests;
   - axe reports no violations and there is no horizontal scroll at 375 px, on every screen;
   - the 0002-W1 run parity and the 0002-W2 parity still pass;
   - all Rust validation and licences unchanged;
   - no new dependency, schema or golden change.

## Read first

- `DESIGN.md` (Visual language, version 1, including "Principles for screens"), `AGENTS.md`.
- `docs/briefs/assets/design-v1/03-input-check.html` (reference screen 3) and its README.
- `docs/model/answers.md` ("Rough-input impact"), brief 0002-W2, `docs/architecture/web-shell.md`.
- WAI-ARIA toggle button (`aria-pressed`), retrieved 2026-10-18: https://www.w3.org/WAI/ARIA/apg/patterns/button/

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0002-W2 sequence in `AGENTS.md`, including Playwright install and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/web-input-check-rough.json` (expected exit 3). Its output must equal the browser's.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **The plan, comparison and export screens:** later milestones. "See the plan" stays not available.
- **Explicit low and high ranges entered by a person:** later. Only the engine defaults are used.
- **Changing the engine's ranking or ranges:** none.
- **Saving rough marks:** in memory only.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.


### Implementation — 2026-10-19

**Branch:** `codex/0002-W3-input-check`.
**Source/test revisions validated:**

- `ec27b73048dadf546dc195a5e24fb87507c1364c`: commands 1–423, the complete cumulative
  Rust/WebAssembly/CLI and web sequence, including all 12 browser projects.
- `c5b02a88d1788aaef165b206c2b67bcd0e6d7e37`: commands 424–439, the entire web sequence
  again and both required W2/W3 native commands.

The sole intervening source change adds `align-items: start` to the input-check
card grid so its rough tag stays at its content height on desktop. All Rust and
TypeScript source/tests, fixtures, schemas and dependencies are identical between
these revisions. The affected web sequence was rerun in full; unchanged Rust
checks retain their actual first revision. Every command below ran in the
assigned Linux worktree against the listed committed revision, with source/tests
unchanged within each segment. This implementation record is committed afterward;
the final branch tip is reported separately at handoff.
Commit hooks passed without bypass. No push or main-branch mutation occurred.

Rough-eligible setup fields now have small, field-named toggle buttons beside
their labels, with `aria-pressed`, keyboard activation and the dashed estimate
outline. Review retains its rough marks and household check as a secondary
action. Its primary action opens Input check; the planning bar enables Check
once Review has been reached. Malformed entries block that navigation with a
field message and focus. Refine returns to the correct setup step and field;
Back to household returns to Review. Keep as rough/Undo changes the card's
acknowledgment without removing its rough mark. Re-entering the screen calls
the engine again using the current draft.

Each visit makes one `input_impact` worker call with the edited fixture and
path-only rough items in setup order. Cards retain engine ranking. Classification
uses BigInt integer comparison of nonzero absolute impact against 1% of the
baseline sustainable spending; the half-up whole-dollar marker is display only.
The shared bar maximum follows the brief's 1/2/2.5/5 scale. These are whole USD
per year in today's dollars; tested dollar endpoints originate in engine cents,
and rates retain decimal-string percent formatting. No financial model, ranking,
range, schema, assumption or golden was changed. Unit tests cover the exact
boundary, zero spending/impact, negative impact, large integers, display rounding,
headline templates, bar scales, all field titles/value lines and setup ordering.

**Design:** screen 3 uses DESIGN.md semantic tokens, the existing self-hosted
font, responsive cards and native keyboard-operable disclosures. The brief takes
precedence over its illustration: each entry has its own card, the cost-basis
title uses the full readable account name, the reference impacts share a $2,500
scale, the ranges section describes all documented engine defaults, and See the
plan is disabled with Not available yet. The existing W2 header, footer and exact
privacy note are retained. The initial three-entry screenshot and committed
reference were inspected as presentation validation; independent review remains
a separate maintainer step.

**Validation:** 439 recorded commands completed with their expected exits,
including 377 native CLI executions. Both workspace modes passed 75 tests;
both complete web runs passed 45 tests in 10 files. The CLI sweep expands every
placeholder: 48 fixtures for spend, levers, empty-rough impact, run, export and
dev-run; A-drawdown against all 48 plus five reference comparison pairs; all
26 current golden exports and three rejection imports; the six-item answer
reference; and the W2/W3 required native commands. Every CLI stdout was checked
as exactly one canonical JSON document plus one newline, with exit matched to
its returned status (including dev-run's legacy partial exit 0). The unchanged
Rust CLI suites also prove application-operation byte parity.

**Tools:** preinstalled Rust 1.99.1, Node v24.22.0, corepack 0.36.0,
manifest-selected pnpm 12.9.1 through corepack, wasm-bindgen and its test runner
0.2.129, cargo-deny 0.20.2, and Playwright 1.63.0. The same preinstalled Node
executable/PATH was used throughout the WebAssembly and web runs; observed
versions are recorded below. An initial root-level discovery probe selected
corepack's default pnpm 12.14.0; all web installation/build/test commands used
12.9.1 from apps/web. No global pnpm installation was performed.

**Performance:** release levers exited 3 (partial) in 0.455 seconds
wall time with the matching release CLI already compiled, below the two-second
limit. The first invocation took 4.968s including 4.57s of recompilation after
the intervening workspace/WebAssembly feature builds; that initial measurement
is retained below and the warm invocation was repeated without a source change.
The isolated WebAssembly levers test passed 1 test, with 13 filtered out, in
5.02 seconds from the harness (6.181 seconds command wall time). Full WebAssembly
parity passed 14 tests, with no failures or ignored tests. Node was v24.22.0
for these runs.

**Browser execution:** chromium 153.0.8010.12, firefox 155.0, webkit 26.6,
from executed browser-version annotations. All 12 projects passed: Chromium,
Firefox and WebKit × 375×812 and 1280×800 × light and dark. Playwright's matched
browser installation ran before e2e. Every project checks every sample, all
setup steps, the earlier W1 run goldens and W2 edited answer, and the W3
keyboard-only reference path. The test captures the actual UI worker request
and reply, proves one call with the exact fixture and ordered default-only rough
list, and compares its complete reply byte for byte with native CLI stdout
excluding its single terminating newline. The native command exits 3. The
reference baseline is $64,994, marker $650, and ranked impacts are $2,305,
$1,624 and $8 with the brief's exact ranges/headrooms and headline.

All 396 final captured screen states (33 per project) passed axe with zero
violations and had no horizontal page overflow. Captures include all three
collapsed-section contents, Kept as rough, Refine focus, the edited single-entry
case, no rough entries with the unmarked section open, and the engine error
without figures. Keep/Undo and returning to Review are exercised by keyboard;
the date-error case uses the native date control. Existing privacy, storage,
cookie, off-origin, CSP, theme precedence and reload checks still pass. Screenshots
and the HTML/JSON Playwright reports are saved as local evidence outside the
repository, as requested. The earlier complete browser run also passed all 12
projects and 396 captures; its reports/screenshots were retained separately.
A preliminary Chromium phone run also passed before the final sequence; it is separate development evidence, not a substitute for
these 12 executed projects.

**Dependencies and exclusions:** no dependencies added; both web dependency
closures and cargo-deny licenses pass unchanged. No required validation was
omitted overall. The cumulative Rust/CLI/WebAssembly corpus was not repeated
after the one-line CSS alignment change because none of those inputs, sources or
tests changed; its observations are retained at their actual revision above.
Plan, comparison and export screens remain future milestones, with See the
plan unavailable. Person-entered low/high ranges remain deferred; only engine
defaults are sent. Engine ranking/ranges remain unchanged by scope. Rough marks
and acknowledgments remain in memory, with no persistence. No hosted route,
authorization surface, deployment or top-level tool configuration was introduced.

<details>
<summary>Every validation command, exit and observed count</summary>

| Revision | Directory | Command | Exit | Counts / observed result |
| --- | --- | --- | --- | --- |
| `ec27b73` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) |
| `ec27b73` | workspace root | `wasm-bindgen --version` | 0 | wasm-bindgen 0.2.129 |
| `ec27b73` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 |
| `ec27b73` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 |
| `ec27b73` | workspace root | `node --version` | 0 | v24.22.0 |
| `ec27b73` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed; 0 failed; 0 ignored; 33 filtered out; 8 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed; 0 failed; 0 ignored; 39 filtered out; 8 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed; 0 failed; 0 ignored; 41 filtered out; 8 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed; 0 failed; 0 ignored; 40 filtered out; 8 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed; 0 failed; 0 ignored; 8 filtered out; 2 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed; 0 failed; 0 ignored; 37 filtered out; 8 harness results |
| `ec27b73` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed; 0 failed; 0 ignored; 0 filtered out; 3 harness results |
| `ec27b73` | workspace root | `cargo test --workspace` | 0 | 75 passed; 0 failed; 0 ignored; 0 filtered out; 20 harness results |
| `ec27b73` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | Completed; no test harness |
| `ec27b73` | workspace root | `cargo fmt --all --check` | 0 | Completed; no test harness |
| `ec27b73` | workspace root | `cargo test --workspace --release` | 0 | 75 passed; 0 failed; 0 ignored; 0 filtered out; 20 harness results |
| `ec27b73` | workspace root | `cargo build --workspace --release` | 0 | Completed; no test harness |
| `ec27b73` | workspace root | `node --version` | 0 | v24.22.0 |
| `ec27b73` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | Completed; no test harness |
| `ec27b73` | workspace root | `node --version` | 0 | v24.22.0 |
| `ec27b73` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed; 0 failed; 0 ignored; 0 filtered out; 2 harness results |
| `ec27b73` | workspace root | `cargo deny check licenses` | 0 | License policy passed |
| `ec27b73` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; wall time 4.968s; limit <2s; included 4.57s release recompilation; warm rerun follows |
| `ec27b73` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial; wall time 0.455s; limit <2s |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | 1 canonical JSON document + newline; invalid |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | 1 canonical JSON document + newline; unsupported |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | 1 canonical JSON document + newline; complete |
| `ec27b73` | workspace root | `node --version` | 0 | v24.22.0 |
| `ec27b73` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed; 0 failed; 0 ignored; 13 filtered out; 1 harness results; harness duration 5.02s |
| `ec27b73` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed; 0 failed; 0 ignored; 0 filtered out; 1 harness results |
| `ec27b73` | workspace root | `node --version` | 0 | v24.22.0 |
| `ec27b73` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `node --version` | 0 | v24.22.0 |
| `ec27b73` | apps/web | `corepack --version` | 0 | 0.36.0 |
| `ec27b73` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 |
| `ec27b73` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | Frozen-lockfile installation completed |
| `ec27b73` | apps/web | `corepack pnpm run build:engine` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `corepack pnpm run types` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `corepack pnpm run typecheck` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `corepack pnpm run lint` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `corepack pnpm run format:check` | 0 | All matched files use Prettier code style |
| `ec27b73` | apps/web | `corepack pnpm test` | 0 | Test Files  10 passed (10); Tests  45 passed (45) |
| `ec27b73` | apps/web | `corepack pnpm run build` | 0 | Completed; no test harness |
| `ec27b73` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Matched browser installation completed |
| `ec27b73` | apps/web | `corepack pnpm run e2e` | 0 | 12 passed (2.2m) |
| `ec27b73` | apps/web | `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | 1 canonical JSON document + newline; partial |
| `ec27b73` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/web-input-check-rough.json` | 3 | 1 canonical JSON document + newline; partial |
| `c5b02a8` | apps/web | `node --version` | 0 | v24.22.0 |
| `c5b02a8` | apps/web | `corepack --version` | 0 | 0.36.0 |
| `c5b02a8` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 |
| `c5b02a8` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | Frozen-lockfile installation completed |
| `c5b02a8` | apps/web | `corepack pnpm run build:engine` | 0 | Completed; no test harness |
| `c5b02a8` | apps/web | `corepack pnpm run types` | 0 | Completed; no test harness |
| `c5b02a8` | apps/web | `corepack pnpm run typecheck` | 0 | Completed; no test harness |
| `c5b02a8` | apps/web | `corepack pnpm run lint` | 0 | Completed; no test harness |
| `c5b02a8` | apps/web | `corepack pnpm run format:check` | 0 | All matched files use Prettier code style |
| `c5b02a8` | apps/web | `corepack pnpm test` | 0 | Test Files  10 passed (10); Tests  45 passed (45) |
| `c5b02a8` | apps/web | `corepack pnpm run build` | 0 | Completed; no test harness |
| `c5b02a8` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | Matched browser installation completed |
| `c5b02a8` | apps/web | `corepack pnpm run e2e` | 0 | 12 passed (2.2m) |
| `c5b02a8` | apps/web | `corepack pnpm run licenses` | 0 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `c5b02a8` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | 1 canonical JSON document + newline; partial |
| `c5b02a8` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/web-input-check-rough.json` | 3 | 1 canonical JSON document + newline; partial |

</details>
