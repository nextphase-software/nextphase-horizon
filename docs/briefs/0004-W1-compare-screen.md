BRIEF VERSION: 0004-W1 v1.1 (2026-10-19)

# 0004-W1 — Try a change and compare

## Outcome

From the plan screen, a person picks one change, such as retiring a year later or spending 10% less, and Horizon makes a copy of their plan with exactly that change. The original plan, the baseline, never changes. The comparison screen then shows:
- one factual sentence saying what the change does;
- what changed in the inputs;
- both savings lines over time in today's dollars;
- the headline differences, open, with better or worse in words;
- every ledger line that differs, one click away.

A person can make more copies, one per change, and switch between them. Every figure comes from the engine; the screen formats and arranges figures but never adds, subtracts or derives a financial value.

This milestone builds reference screen 5 (`docs/briefs/assets/design-v1/05-compare.html`) and turns on "Try a change" on the plan screen.

## Deliverables

1. **Try a change** (plan screen, reference screen 4):
   - "Try a change" becomes operable. It opens a panel titled "Try one change in a copy" with one radio option per lever returned by the engine's `levers` operation for the household as entered, in the order of the `levers` array, using the plan screen's lever labels (for example "Retire a year later, at 67").
   - Levers in the engine's `skipped` list are not offered. A lever that already has a copy is shown disabled with " (already a copy)" after its label.
   - Below the options: "Your plan stays as it is." Buttons: "Make the copy" (primary) and "Cancel".
   - "Make the copy" creates the copy (deliverable 3) and opens the comparison on it.
   - The plan screen's "Export" stays "Not available yet".
2. **Step bar:** the **Compare** step becomes active once at least one copy exists. Export stays "Not available yet".
3. **Copies:**
   - A copy is the engine's `scenario` output for the household as entered (the baseline) and that lever's `changes`. At most one copy per lever. Copies live in memory only.
   - **Names** (tab and table header), by lever: `retire_earlier` and `retire_later` → "Retire at <age>"; `spend_lower` and `spend_higher` → "Spend $<amount> a year"; `return_lower` and `return_higher` → "Returns at <rate>%". The age is the baseline run's `age_on_december_31` in the year of the new retirement date; the amount is the new `after_retirement` cents in whole dollars; the rate is the new `investment_return` as a percent.
   - **Headline subjects:** "Retiring at <age>", "Spending $<amount> a year in retirement", "With returns at <rate>%".
   - **When the household changes:** if the person returns to the setup and the serialized household no longer equals the one the copies were made from, all copies are removed, the Compare step returns to "Not available yet", and the plan screen shows "Your copies were removed because the household changed."
4. **Engine calls,** through the worker:
   - for each copy: `scenario(baseline, changes)`, then `compare(baseline, copy)` and `sustainable_spending(copy)`;
   - for the baseline: `sustainable_spending(baseline)` and `levers(baseline)` (results may be reused from the plan screen for the same serialized input).
   - Each section shows "Calculating…" until its data arrives. An error envelope from any call shows its status word and message with no figures, plus "Back to plan".
   - An error in one copy's calls replaces only that copy's comparison. The tabs stay, so the other copies remain reachable.
5. **Display rules** (as 0003-W2):
   - **Amounts:** cents become whole dollars rounded half away from zero, for display only; the minus sign is "−".
   - **No new numbers:** no figure is computed by the interface. A difference is shown only where the engine supplies it (deliverable 6.7).
   - **Better and worse** are words with an arrow, never colour alone. A word that compares two amounts compares them **as displayed**, in whole dollars, so two amounts that both show "$0" read "Same".
6. **Comparison screen** (reference screen 5). It must match the reference in the points listed under "Must-match points".
   1. **Eyebrow:** "Compare · <sample label> · the baseline is protected" (shown in capitals like the plan screen's eyebrow).
   2. **Headline.** `B` is the baseline outcome and `C` the copy's: either "runs short at <age>" (the age in the first year with `shortfall > 0`) or "lasts" (no such year); `<end>` is the plan-end age.
      - B short at A, C lasts: "<Subject>: savings last to <end> instead of running short at <A>."
      - B lasts, C short at A': "<Subject>: savings run short at <A'> instead of lasting to <end>."
      - both last: "<Subject>: savings still last to <end>."
      - both short at the same age A: "<Subject>: savings still run short at <A>."
      - both short at different ages: "<Subject>: savings run short at <A'> instead of <A>."
   3. **Tabs:** "Baseline · retire at <age>" (or "Baseline · retired" when the retirement date is on or before the valuation date, or just "Baseline" when no projected year contains the retirement date, as the plan screen's eyebrow omits the age), then one tab per copy by name, then "+ New copy". The selected copy's tab is marked current (`aria-current` or `aria-selected`). "+ New copy" opens the panel of deliverable 1 and is disabled with "(no more changes to try)" when every lever has a copy.
   4. **Status bar:**
      - each plan's status chip with the app's status word (`Supported`, `Partial (<n> omissions)`, `Unsupported`);
      - the sentence "Both results are <word> and leave out the same things." when both runs have the same status and the same omissions; otherwise "The baseline is <word>; the copy is <word>.";
      - a collapsed "What this result does not include" listing the omissions (one list when equal, otherwise "Baseline" and "Copy" lists);
      - "Results are modeled annual amounts, not predictions."
   5. **What changed:** "What changed: " then each of the comparison's `changed_inputs`, in the engine's order, as "<label> <before> → <after>", joined by "; ". Labels: `/household/persons/0/retirement_date` → "retirement date"; `/household/income/wages/0/end_date` → "wages end", followed by " (follows the retirement date)" when its new value equals the new retirement date; `/household/spending/after_retirement/cents` → "spending after you retire" (values "$<amount> a year"); `/assumptions/investment_return/value` → "investment return" (values as percents). Dates are shown as the engine gives them.
   6. **Savings by age:**
      - two lines of `total_closing_today` by age, in today's dollars of the valuation year: the baseline solid, the copy dashed, each labelled directly;
      - a dotted "Runs short at <age>" marker for each plan that has a shortfall, labelled with the plan's name;
      - the caption "Total savings at the end of each year, in today's dollars (<valuation year> dollars). Solid line: baseline. Dashed line: <copy name>.";
      - "Show as a table": age, year, baseline and copy savings, for the union of both plans' rows under the 0003-W2 savings-table rule (first year, retirement year and the year after, every age divisible by 5, the year with the highest savings, the first shortfall year, the last year).
   7. **Headline differences** (open by default; hint "6 measures · units labelled on each row"). Columns: Measure, Baseline, <copy name>, Change, Difference. Rows, in this order:

      | Measure | Values | Change | Difference |
      | --- | --- | --- | --- |
      | Savings | "last to <end>" or "run short at <age>" | ▲ Better / ▼ Worse / Same (lasting beats running short; later beats earlier) | — |
      | Spending the plan can carry (today's dollars a year) | each `sustainable_spending`; with the flag `shortfall_with_no_retirement_spending`: "none: short even with no retirement spending"; with `at_or_above_cap`: "at least $10,000,000" | ▲ Better / ▼ Worse / Same | — |
      | Headroom (today's dollars a year) | each `headroom` | ▲ Better / ▼ Worse / Same | the lever's `effect`, signed |
      | Left at <end> (today's dollars) | each plan's `ending_total_today` from the comparison summary | ▲ Better / ▼ Worse / Same | — |
      | Shortfall (nominal, summed across years) | each `total_shortfall` | ▲ Higher, worse / ▼ Lower, better / Same | the summary's `difference.total_shortfall`, signed |
      | Federal tax (nominal, summed across years) | each `total_federal_tax_paid` | ▲ Higher / ▼ Lower / Same | the summary's `difference.total_federal_tax_paid`, signed |

      A dash "—" fills a Difference cell the engine does not supply. Below the table: "Rows mix units, so there is no chart here; the savings chart above is the picture. A dash means the difference is not calculated."
   8. **Every line that differs** (collapsed; hint "<n> lines · nominal dollars"):
      - the sentence "<n> ledger lines differ, in years <first> to <last>. All are nominal dollars, each with both values and the difference." (`n` is the number of `line_differences`; first and last are their lowest and highest `year`);
      - a table of every `line_differences` entry in the engine's order, with Year, Line (the `path` without its leading slash, in the code font), Baseline, <copy name> and Difference ("—" where a side or the difference is null), scrolling inside its own container.
   9. **Buttons:** "Export this comparison" shown, marked "Not available yet" and not operable; "Back to plan" returns to the plan screen. The footer and privacy note are as in 0002-W2.

## Must-match points against reference screen 5

1. Eyebrow and factual headline as in deliverables 6.1 and 6.2.
2. The tabs, with the baseline first and "+ New copy" last.
3. The status bar: chips, sentence, collapsed omission list and the "not predictions" line.
4. The "What changed" line.
5. The "Savings by age" card: two lines, solid and dashed, direct labels, the caption naming the dollar basis, and "Show as a table".
6. "Headline differences" open, with better and worse in words; "Every line that differs" collapsed; then "Export this comparison" (not available yet) and "Back to plan", then the footer.

**Intended differences from the reference:**
- Headline differences has six rows, not five: a Headroom row is added, and the "Spending the plan can carry" and "Left at" rows show "—" for the difference. Decision 0011 item 5 says the interface never computes financial values; the engine supplies the headroom effect and the shortfall and tax differences, but not those two differences.
- "Every line that differs" holds the full table in the section, instead of a link to a separate list.
- The reference's explanatory sentence about tax is not shown; only engine-backed text is.

## Done when

1. **Reference case,** keyboard only: the working sample with no edits; on the plan screen, "Try a change" → "Retire a year later, at 67" → "Make the copy".
   - **headline:** "Retiring at 67: savings last to 95 instead of running short at 93.";
   - **tabs:** "Baseline · retire at 66", "Retire at 67", "+ New copy";
   - **status sentence:** "Both results are Partial and leave out the same things.";
   - **what changed:** "What changed: wages end 2031-03-10 → 2032-03-10 (follows the retirement date); retirement date 2031-03-10 → 2032-03-10";
   - **headline differences:**

     | Measure | Baseline | Retire at 67 | Change | Difference |
     | --- | --- | --- | --- | --- |
     | Savings | run short at 93 | last to 95 | ▲ Better | — |
     | Spending the plan can carry (today's dollars a year) | $64,994 | $68,616 | ▲ Better | — |
     | Headroom (today's dollars a year) | −$2,006 | $1,616 | ▲ Better | +$3,622 |
     | Left at 95 (today's dollars) | $1 | $75,045 | ▲ Better | — |
     | Shortfall (nominal, summed across years) | $197,809 | $0 | ▼ Lower, better | −$197,809 |
     | Federal tax (nominal, summed across years) | $230,814 | $267,784 | ▲ Higher | +$36,970 |

   - **savings table** (age, year, baseline, copy; today's dollars): 61 2026 $800,268 $800,268; 65 2030 $934,687 $934,687; 66 2031 $905,702 $970,721; 67 2032 $879,139 $962,588; 68 2033 $858,556 $944,038; 70 2035 $815,873 $905,575; 75 2040 $677,433 $793,621; 80 2045 $511,739 $642,806; 85 2050 $324,844 $472,694; 90 2055 $115,682 $280,782; 93 2058 $886 $154,057; 95 2060 $1 $75,045;
   - **every line that differs:** "550 ledger lines differ, in years 2031 to 2060. …"; its first three rows: 2031 accounts/brokerage/basis_removed $23,095 $0 −$23,095; 2031 accounts/brokerage/closing $247,243 $298,503 +$51,260; 2031 accounts/brokerage/closing_basis $155,932 $194,285 +$38,353.

   All values come from native `horizon-engine-0.4.0` CLI output, verified 2026-10-18.
2. **Other cases** (headline, status sentence, line count, and the "Spending the plan can carry" cells):

   | Sample · change | Headline | Status sentence | Lines | Spending the plan can carry |
   | --- | --- | --- | --- | --- |
   | `answers-working-61` · retire a year earlier | "Retiring at 65: savings run short at 90 instead of 93." | Partial, same | 562 | $64,994 → $61,438 |
   | `answers-working-61` · spend 10% less | "Spending $60,300 a year in retirement: savings last to 95 instead of running short at 93." | Partial, same | 618 | $64,994 → $64,994 (Same) |
   | `synthetic-retired` · spend 10% less | "Spending $45,000 a year in retirement: savings still last to 95." | "Both results are Supported and leave out the same things." | 528 | $87,061 → $87,061 (Same) |
   | `A-drawdown` · spend 10% more | "Spending $66,000 a year in retirement: savings run short at 75 instead of 76." | Supported, same | 144 | $43,690 → $43,690 (Same) |
   | `answers-underfunded` · retire a year later | "Retiring at 67: savings still run short at 61." | Partial, same | 19 | "none: short even with no retirement spending" both |

   Also: for `A-drawdown` · spend 10% more, the "Left at 78" row reads $0 and $0 with "Same"; the retired samples offer four changes and their baseline tab reads "Baseline · retired".
3. **Parity:**
   - for the reference case, the worker's `compare` output is byte-identical to `horizon compare answers-working-61 answers-working-61-retire-later`, and its `sustainable_spending(copy)` output to `horizon spend answers-working-61-retire-later`;
   - the 0002-W1, W2, W3 and 0003-W2 parity checks still pass;
   - every figure and sentence in Done when 1 and 2 is read from the rendered page and matched against its whole table cell or sentence.
4. **Copies:**
   - one copy per lever; a lever with a copy is disabled in the panel; "+ New copy" is disabled when every lever has one;
   - the baseline's run is unchanged after copies are made (its outputs are byte-identical before and after);
   - changing any entry in the setup removes the copies and shows the removal message;
   - an engine error shows its status word and message, no figures, and "Back to plan"; when one copy's calls fail, the tabs stay and another copy can still be opened;
   - with the working sample's plan end age changed to 65 in the setup, the baseline tab reads "Baseline" and the "Retire at 65" copy can be made and compared.
5. **Keyboard and screen readers:** the panel, tabs, sections and switches are operable by keyboard; focus moves to the comparison headline after "Make the copy"; the chart is `aria-hidden` with its table reachable; keyboard steps in the end-to-end tests reach their targets whether focus moves forward or backward.
6. **Accessibility and privacy:** axe reports no violations; no horizontal page scroll at 375 px (tables scroll inside their containers); nothing stored or requested off-origin. This holds in three browsers, both sizes and both themes, with every section open, and the suite passes on Linux and on macOS.
7. **Earlier guarantees:** Rust validation and licences unchanged; no new dependency, schema, golden or engine change; no new top-level entry.

## Read first

- `DESIGN.md` (Visual language, version 1, including "Principles for screens"), `AGENTS.md`, decision records 0010 (comparison conventions) and 0011 (items 5 and 6).
- `docs/briefs/assets/design-v1/05-compare.html` (reference screen 5) and its README.
- `docs/model/scenario-diff-and-export.md` (scenario and comparison operations), `docs/model/answers.md` (levers, effects, headroom), `docs/architecture/web-shell.md`, and briefs 0002-W2, 0002-W3 and 0003-W2.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0003-W2 sequence in `AGENTS.md`, including Playwright install and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- compare answers-working-61 answers-working-61-retire-later`
- `cargo run -p horizon-cli -- spend answers-working-61-retire-later`

Expected exit 3 each. Their outputs must equal the browser's. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Editing any entry of a copy, or several changes in one copy:** later; a copy holds exactly one lever's changes.
- **Naming, saving or deleting copies, and comparing two copies with each other:** later. Copies live in memory and are compared with the baseline only.
- **Export of a comparison:** plan 0005.
- **Changing the engine's levers or comparison output:** none.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### 0004-W1 v1 implementation — 2026-10-19

- Branch: `codex/0004-W1-compare-screen`.
- Completion status: the specified reference flows and validation are implemented; a valid-input baseline-tab case needs maintainer clarification before this milestone can be marked complete (see Open requirement below).
- Final source/test revision: `1ddebcaf51d66826a6caad8c5e090f46374d061e`. The complete sequence was rerun at this revision. Initial validation at `f7793ae6a1b7a941081d89489042fec9ed88bd60` is also retained below, including the interrupted browser attempt. This documentation record is committed afterward.
- Implemented the one-change panel, in-memory engine-produced copies, Compare navigation, protected baseline, factual outcome sentences, two-series savings chart/table, six measures and complete ledger-difference table in a bounded, keyboard-scrollable container. Late results cannot restore removed copies. Display comparisons use rounded whole-dollar values.
- No dependency, engine, schema, golden, design asset, lockfile or top-level entry changes. New dependencies: none (therefore no new license obligations). Existing license policies pass.
- Design verification: reference screen 5 HTML and PNG inspected. The brief-required differences are six measures including Headroom, dashes for unavailable differences, the full ledger table inline, disabled comparison export, and omission/status sentences generated from engine output. Responsive charts use directly labelled solid/dashed lines and dotted shortfall markers; their accessible tables contain the corresponding data.

#### Toolchain and browser evidence

- Rust 1.99.1; cargo-deny 0.20.2; wasm-bindgen-test-runner 0.2.129 (matches Cargo.lock). Node `v24.22.0` recorded before each WebAssembly validation/build. In `apps/web`: corepack 0.36.0 and pnpm 12.9.1.
- Playwright 1.63.0: 12 browser/size/theme projects; 36 passed, 0 unexpected/skipped/flaky; 960 screenshot captures attached to the HTML report. Screenshots and HTML/JSON reports are saved outside the repository.
- Actual browser-version annotations: chromium 153.0.8010.12; firefox 155.0; webkit 26.6.
- Linux browser checks include keyboard traversal in either direction, panel radio order and disabled copies, focus on the comparison headline, all sections open, every ledger row, exact whole-cell/sentence reference assertions, native/worker byte equality, baseline immutability, copy exhaustion/switching/removal, error envelopes, axe with zero violations, no page overflow at 375 px, and no off-origin requests or storage/cookie writes.

#### Ordered validation commands

Every listed command ran afresh; the final complete sequence passed. The earlier interrupted browser command is explicitly recorded. Expected partial/invalid/unsupported CLI exits are retained. CLI rows each produced one JSON document and one newline; the cumulative CLI tests also prove byte equality with application operations. Counts include all harnesses for a command. `workspace root` is the default; web commands run from `apps/web`.

| # | Revision | Directory | Command | Exit | Observed result/count | Seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `f7793ae` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) | 0.039 |
| 2 | `f7793ae` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 | 0.022 |
| 3 | `f7793ae` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 | 0.001 |
| 4 | `f7793ae` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed, 0 failed, 0 ignored | 24.795 |
| 5 | `f7793ae` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed, 0 failed, 0 ignored | 4.938 |
| 6 | `f7793ae` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed, 0 failed, 0 ignored | 0.429 |
| 7 | `f7793ae` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed, 0 failed, 0 ignored | 0.133 |
| 8 | `f7793ae` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed, 0 failed, 0 ignored | 4.501 |
| 9 | `f7793ae` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed, 0 failed, 0 ignored | 0.320 |
| 10 | `f7793ae` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed, 0 failed, 0 ignored | 1.242 |
| 11 | `f7793ae` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed, 0 failed, 0 ignored | 0.214 |
| 12 | `f7793ae` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed, 0 failed, 0 ignored | 0.114 |
| 13 | `f7793ae` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed, 0 failed, 0 ignored | 0.073 |
| 14 | `f7793ae` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed, 0 failed, 0 ignored | 0.049 |
| 15 | `f7793ae` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed, 0 failed, 0 ignored | 0.049 |
| 16 | `f7793ae` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed, 0 failed, 0 ignored | 0.391 |
| 17 | `f7793ae` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed, 0 failed, 0 ignored | 13.315 |
| 18 | `f7793ae` | workspace root | `cargo test --workspace` | 0 | 75 passed, 0 failed, 0 ignored | 105.882 |
| 19 | `f7793ae` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | passed | 8.758 |
| 20 | `f7793ae` | workspace root | `cargo fmt --all --check` | 0 | passed | 0.087 |
| 21 | `f7793ae` | workspace root | `cargo test --workspace --release` | 0 | 75 passed, 0 failed, 0 ignored | 47.410 |
| 22 | `f7793ae` | workspace root | `cargo build --workspace --release` | 0 | passed | 4.902 |
| 23 | `f7793ae` | workspace root | `node --version` | 0 | v24.22.0 | 0.004 |
| 24 | `f7793ae` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | passed | 5.036 |
| 25 | `f7793ae` | workspace root | `node --version` | 0 | v24.22.0 | 0.005 |
| 26 | `f7793ae` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed, 0 failed, 0 ignored | 30.277 |
| 27 | `f7793ae` | workspace root | `cargo deny check licenses` | 0 | licenses ok | 0.165 |
| 28 | `f7793ae` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 5.192 |
| 29 | `f7793ae` | workspace root | `cargo build -p horizon-cli --release` | 0 | passed | 0.108 |
| 30 | `f7793ae` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 0.425 |
| 31 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | complete; 1 canonical JSON document | 0.126 |
| 32 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.075 |
| 33 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.071 |
| 34 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.080 |
| 35 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.071 |
| 36 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.108 |
| 37 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.088 |
| 38 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.086 |
| 39 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.109 |
| 40 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | partial; 1 canonical JSON document | 0.149 |
| 41 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.098 |
| 42 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | partial; 1 canonical JSON document | 0.438 |
| 43 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.491 |
| 44 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 45 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 46 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 47 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 48 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 49 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 50 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 51 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 52 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 53 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 54 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 55 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 56 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 57 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 58 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 59 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 60 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.107 |
| 61 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.108 |
| 62 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.079 |
| 63 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.083 |
| 64 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.078 |
| 65 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.080 |
| 66 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.502 |
| 67 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.295 |
| 68 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | partial; 1 canonical JSON document | 0.539 |
| 69 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 70 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.073 |
| 71 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.078 |
| 72 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 73 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 74 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 75 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.055 |
| 76 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.052 |
| 77 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.083 |
| 78 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.094 |
| 79 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | complete; 1 canonical JSON document | 0.175 |
| 80 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.119 |
| 81 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.127 |
| 82 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.203 |
| 83 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.143 |
| 84 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.378 |
| 85 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.252 |
| 86 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.253 |
| 87 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.348 |
| 88 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | partial; 1 canonical JSON document | 0.504 |
| 89 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.226 |
| 90 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 2.874 |
| 91 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 2.954 |
| 92 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.056 |
| 93 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 94 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | invalid; 1 canonical JSON document | 0.041 |
| 95 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 96 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 97 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 98 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 99 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 100 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.060 |
| 101 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 102 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 103 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 104 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 105 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 106 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 107 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 108 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.383 |
| 109 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.465 |
| 110 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.176 |
| 111 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.179 |
| 112 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.179 |
| 113 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.200 |
| 114 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | partial; 1 canonical JSON document | 2.986 |
| 115 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | complete; 1 canonical JSON document | 1.176 |
| 116 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | partial; 1 canonical JSON document | 3.226 |
| 117 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | unsupported; 1 canonical JSON document | 0.056 |
| 118 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.171 |
| 119 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.171 |
| 120 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 121 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 122 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.053 |
| 123 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 124 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 125 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.172 |
| 126 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.145 |
| 127 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.078 |
| 128 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.063 |
| 129 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.069 |
| 130 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.081 |
| 131 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.070 |
| 132 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.110 |
| 133 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.080 |
| 134 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.080 |
| 135 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.117 |
| 136 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.151 |
| 137 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.100 |
| 138 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.422 |
| 139 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.484 |
| 140 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 141 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 142 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 143 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 144 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 145 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 146 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 147 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 148 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 149 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 150 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.053 |
| 151 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 152 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 153 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 154 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 155 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 156 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.108 |
| 157 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.106 |
| 158 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 159 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.078 |
| 160 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 161 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.078 |
| 162 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.513 |
| 163 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.296 |
| 164 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.530 |
| 165 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 166 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 167 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 168 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.054 |
| 169 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 170 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 171 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 172 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 173 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 174 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.070 |
| 175 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial; 1 canonical JSON document | 4.831 |
| 176 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.069 |
| 177 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.059 |
| 178 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.059 |
| 179 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.051 |
| 180 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.059 |
| 181 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.061 |
| 182 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.056 |
| 183 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.054 |
| 184 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.057 |
| 185 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | partial; 1 canonical JSON document | 0.086 |
| 186 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.097 |
| 187 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | partial; 1 canonical JSON document | 0.113 |
| 188 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.113 |
| 189 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 190 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.055 |
| 191 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 192 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 193 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 194 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 195 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 196 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 197 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 198 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 199 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 200 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.055 |
| 201 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 202 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.055 |
| 203 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 204 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 205 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.061 |
| 206 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.058 |
| 207 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.060 |
| 208 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.058 |
| 209 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.063 |
| 210 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 211 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.096 |
| 212 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.075 |
| 213 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | partial; 1 canonical JSON document | 0.099 |
| 214 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 215 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 216 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 217 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.054 |
| 218 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 219 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 220 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 221 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 222 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 223 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 224 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | complete; 1 canonical JSON document | 0.071 |
| 225 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.079 |
| 226 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.074 |
| 227 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.074 |
| 228 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.075 |
| 229 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.079 |
| 230 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.076 |
| 231 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.073 |
| 232 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.077 |
| 233 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | partial; 1 canonical JSON document | 0.128 |
| 234 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.168 |
| 235 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | partial; 1 canonical JSON document | 0.168 |
| 236 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.177 |
| 237 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 238 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 239 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 240 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 241 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 242 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 243 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 244 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 245 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 246 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 247 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 248 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 249 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 250 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 251 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 252 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 253 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.082 |
| 254 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.082 |
| 255 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.073 |
| 256 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.079 |
| 257 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.071 |
| 258 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 259 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.152 |
| 260 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.120 |
| 261 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | partial; 1 canonical JSON document | 0.157 |
| 262 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 263 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.077 |
| 264 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 265 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 266 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 267 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.043 |
| 268 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 269 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 270 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.071 |
| 271 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 272 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.074 |
| 273 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 274 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 275 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 276 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.070 |
| 277 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | complete; 1 canonical JSON document | 0.066 |
| 278 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.065 |
| 279 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.068 |
| 280 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.065 |
| 281 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.067 |
| 282 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.065 |
| 283 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.060 |
| 284 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.057 |
| 285 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.063 |
| 286 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | partial; 1 canonical JSON document | 0.117 |
| 287 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.141 |
| 288 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | partial; 1 canonical JSON document | 0.157 |
| 289 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.159 |
| 290 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 291 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.040 |
| 292 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 293 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 294 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 295 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.041 |
| 296 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 297 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 298 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 299 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.065 |
| 300 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.041 |
| 301 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 302 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 303 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 304 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 305 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 306 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.066 |
| 307 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.065 |
| 308 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.066 |
| 309 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.069 |
| 310 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.066 |
| 311 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.068 |
| 312 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.142 |
| 313 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.119 |
| 314 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | partial; 1 canonical JSON document | 0.147 |
| 315 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 316 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.066 |
| 317 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.066 |
| 318 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 319 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 320 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 321 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 322 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 323 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.068 |
| 324 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.068 |
| 325 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial; 1 canonical JSON document | 0.096 |
| 326 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 327 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 328 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 329 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 330 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | partial; 1 canonical JSON document | 0.095 |
| 331 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial; 1 canonical JSON document | 0.083 |
| 332 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial; 1 canonical JSON document | 0.086 |
| 333 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete; 1 canonical JSON document | 0.091 |
| 334 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | partial; 1 canonical JSON document | 0.249 |
| 335 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | partial; 1 canonical JSON document | 0.324 |
| 336 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial; 1 canonical JSON document | 0.356 |
| 337 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | partial; 1 canonical JSON document | 0.357 |
| 338 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial; 1 canonical JSON document | 0.100 |
| 339 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial; 1 canonical JSON document | 0.095 |
| 340 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 341 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 342 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 343 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 344 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | partial; 1 canonical JSON document | 0.319 |
| 345 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | complete; 1 canonical JSON document | 0.351 |
| 346 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | partial; 1 canonical JSON document | 0.344 |
| 347 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 348 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 349 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 350 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 351 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | invalid; 1 canonical JSON document | 0.059 |
| 352 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | unsupported; 1 canonical JSON document | 0.052 |
| 353 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 354 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.057 |
| 355 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | partial; 1 canonical JSON document | 0.056 |
| 356 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.062 |
| 357 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.057 |
| 358 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.058 |
| 359 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | partial; 1 canonical JSON document | 0.058 |
| 360 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | partial; 1 canonical JSON document | 0.055 |
| 361 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | partial; 1 canonical JSON document | 0.056 |
| 362 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.057 |
| 363 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | partial; 1 canonical JSON document | 0.085 |
| 364 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | partial; 1 canonical JSON document | 0.095 |
| 365 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | partial; 1 canonical JSON document | 0.110 |
| 366 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | partial; 1 canonical JSON document | 0.113 |
| 367 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 368 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 369 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 370 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 371 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 372 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 373 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 374 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 375 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 376 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 377 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 378 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 379 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 380 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 381 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 382 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 383 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | partial; 1 canonical JSON document | 0.058 |
| 384 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | partial; 1 canonical JSON document | 0.058 |
| 385 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.058 |
| 386 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 387 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 388 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 389 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | partial; 1 canonical JSON document | 0.099 |
| 390 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.085 |
| 391 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | partial; 1 canonical JSON document | 0.099 |
| 392 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 393 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.058 |
| 394 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 395 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 396 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 397 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 398 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 399 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 400 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.058 |
| 401 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.058 |
| 402 | `f7793ae` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 403 | `f7793ae` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 404 | `f7793ae` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed, 0 failed, 0 ignored; harness 4.99 s | 6.193 |
| 405 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | partial; 1 canonical JSON document | 0.472 |
| 406 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- compare answers-working-61 answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.219 |
| 407 | `f7793ae` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.483 |
| 408 | `f7793ae` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed, 0 failed, 0 ignored | 6.024 |
| 409 | `f7793ae` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 410 | `f7793ae` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | passed | 0.069 |
| 411 | `f7793ae` | apps/web | `node --version` | 0 | v24.22.0 | 0.001 |
| 412 | `f7793ae` | apps/web | `corepack --version` | 0 | 0.36.0 | 0.026 |
| 413 | `f7793ae` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 | 0.036 |
| 414 | `f7793ae` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | 383 policy entries passed; frozen lockfile | 0.088 |
| 415 | `f7793ae` | apps/web | `node --version` | 0 | v24.22.0 | 0.001 |
| 416 | `f7793ae` | apps/web | `corepack pnpm run build:engine` | 0 | passed | 0.143 |
| 417 | `f7793ae` | apps/web | `corepack pnpm run types` | 0 | passed | 0.271 |
| 418 | `f7793ae` | apps/web | `corepack pnpm run typecheck` | 0 | passed | 1.513 |
| 419 | `f7793ae` | apps/web | `corepack pnpm run lint` | 0 | passed | 2.254 |
| 420 | `f7793ae` | apps/web | `corepack pnpm run format:check` | 0 | passed | 0.602 |
| 421 | `f7793ae` | apps/web | `corepack pnpm test` | 0 | 72 passed / 13 files; 0 failed | 4.779 |
| 422 | `f7793ae` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 423 | `f7793ae` | apps/web | `corepack pnpm run build` | 0 | passed | 2.084 |
| 424 | `f7793ae` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | three matched browser binaries installed | 0.277 |
| 425 | `f7793ae` | apps/web | `corepack pnpm run e2e` | 130 | interrupted after 18 expected / 2 unexpected / 16 skipped; Firefox screenshot height limit | 446.340 |
| 426 | `1ddebca` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) | 0.030 |
| 427 | `1ddebca` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 | 0.025 |
| 428 | `1ddebca` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 | 0.001 |
| 429 | `1ddebca` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed, 0 failed, 0 ignored | 5.803 |
| 430 | `1ddebca` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed, 0 failed, 0 ignored | 4.881 |
| 431 | `1ddebca` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed, 0 failed, 0 ignored | 0.407 |
| 432 | `1ddebca` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed, 0 failed, 0 ignored | 0.127 |
| 433 | `1ddebca` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed, 0 failed, 0 ignored | 4.491 |
| 434 | `1ddebca` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed, 0 failed, 0 ignored | 0.330 |
| 435 | `1ddebca` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed, 0 failed, 0 ignored | 0.053 |
| 436 | `1ddebca` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed, 0 failed, 0 ignored | 0.197 |
| 437 | `1ddebca` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed, 0 failed, 0 ignored | 0.112 |
| 438 | `1ddebca` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed, 0 failed, 0 ignored | 0.075 |
| 439 | `1ddebca` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed, 0 failed, 0 ignored | 0.048 |
| 440 | `1ddebca` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed, 0 failed, 0 ignored | 0.048 |
| 441 | `1ddebca` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed, 0 failed, 0 ignored | 0.360 |
| 442 | `1ddebca` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed, 0 failed, 0 ignored | 4.960 |
| 443 | `1ddebca` | workspace root | `cargo test --workspace` | 0 | 75 passed, 0 failed, 0 ignored | 87.685 |
| 444 | `1ddebca` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | passed | 0.171 |
| 445 | `1ddebca` | workspace root | `cargo fmt --all --check` | 0 | passed | 0.104 |
| 446 | `1ddebca` | workspace root | `cargo test --workspace --release` | 0 | 75 passed, 0 failed, 0 ignored | 12.472 |
| 447 | `1ddebca` | workspace root | `cargo build --workspace --release` | 0 | passed | 0.073 |
| 448 | `1ddebca` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 449 | `1ddebca` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | passed | 0.067 |
| 450 | `1ddebca` | workspace root | `node --version` | 0 | v24.22.0 | 0.001 |
| 451 | `1ddebca` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed, 0 failed, 0 ignored | 20.699 |
| 452 | `1ddebca` | workspace root | `cargo deny check licenses` | 0 | licenses ok | 0.139 |
| 453 | `1ddebca` | workspace root | `cargo build -p horizon-cli --release` | 0 | passed | 0.060 |
| 454 | `1ddebca` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 0.414 |
| 455 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | complete; 1 canonical JSON document | 0.083 |
| 456 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.066 |
| 457 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.069 |
| 458 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.083 |
| 459 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.069 |
| 460 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.108 |
| 461 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.078 |
| 462 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.079 |
| 463 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.109 |
| 464 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | partial; 1 canonical JSON document | 0.148 |
| 465 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.097 |
| 466 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | partial; 1 canonical JSON document | 0.420 |
| 467 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.488 |
| 468 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 469 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 470 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 471 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 472 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 473 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 474 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 475 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 476 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 477 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.040 |
| 478 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 479 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 480 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 481 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 482 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 483 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 484 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.106 |
| 485 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.162 |
| 486 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.082 |
| 487 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.082 |
| 488 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.078 |
| 489 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.077 |
| 490 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.495 |
| 491 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.289 |
| 492 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | partial; 1 canonical JSON document | 0.532 |
| 493 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 494 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.068 |
| 495 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.076 |
| 496 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 497 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 498 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 499 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 500 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 501 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.078 |
| 502 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 503 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | complete; 1 canonical JSON document | 0.171 |
| 504 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.120 |
| 505 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.125 |
| 506 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.189 |
| 507 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.145 |
| 508 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.384 |
| 509 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.251 |
| 510 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.250 |
| 511 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.343 |
| 512 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | partial; 1 canonical JSON document | 0.500 |
| 513 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.219 |
| 514 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 2.799 |
| 515 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 2.932 |
| 516 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 517 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.040 |
| 518 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 519 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 520 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 521 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 522 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 523 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 524 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.039 |
| 525 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 526 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 527 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 528 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 529 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 530 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 531 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 532 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.375 |
| 533 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.446 |
| 534 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.170 |
| 535 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.172 |
| 536 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.169 |
| 537 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.173 |
| 538 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | partial; 1 canonical JSON document | 2.955 |
| 539 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | complete; 1 canonical JSON document | 1.166 |
| 540 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | partial; 1 canonical JSON document | 3.206 |
| 541 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | unsupported; 1 canonical JSON document | 0.054 |
| 542 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.169 |
| 543 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.168 |
| 544 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 545 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.039 |
| 546 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 547 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 548 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 549 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.180 |
| 550 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.142 |
| 551 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.076 |
| 552 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.070 |
| 553 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.066 |
| 554 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.079 |
| 555 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.068 |
| 556 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.105 |
| 557 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.077 |
| 558 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.078 |
| 559 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.109 |
| 560 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.148 |
| 561 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.097 |
| 562 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.417 |
| 563 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.493 |
| 564 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 565 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 566 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 567 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 568 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 569 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 570 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 571 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 572 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 573 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 574 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 575 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 576 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 577 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 578 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 579 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 580 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.105 |
| 581 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.104 |
| 582 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 583 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 584 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 585 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.076 |
| 586 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.491 |
| 587 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.292 |
| 588 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.526 |
| 589 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 590 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.076 |
| 591 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 592 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.055 |
| 593 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 594 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 595 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 596 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 597 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 598 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.069 |
| 599 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial; 1 canonical JSON document | 4.786 |
| 600 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.066 |
| 601 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.057 |
| 602 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.057 |
| 603 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.057 |
| 604 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.057 |
| 605 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.058 |
| 606 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.054 |
| 607 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.052 |
| 608 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.056 |
| 609 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | partial; 1 canonical JSON document | 0.082 |
| 610 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.092 |
| 611 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | partial; 1 canonical JSON document | 0.109 |
| 612 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.115 |
| 613 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.041 |
| 614 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 615 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 616 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 617 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 618 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 619 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.039 |
| 620 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 621 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.039 |
| 622 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 623 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 624 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 625 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 626 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.056 |
| 627 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.060 |
| 628 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.053 |
| 629 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.061 |
| 630 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.057 |
| 631 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 632 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 633 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.060 |
| 634 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.059 |
| 635 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.094 |
| 636 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.082 |
| 637 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | partial; 1 canonical JSON document | 0.096 |
| 638 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 639 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 640 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.048 |
| 641 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 642 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 643 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 644 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 645 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 646 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.056 |
| 647 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 648 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | complete; 1 canonical JSON document | 0.069 |
| 649 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.074 |
| 650 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.076 |
| 651 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.072 |
| 652 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.074 |
| 653 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.077 |
| 654 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.073 |
| 655 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.071 |
| 656 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.074 |
| 657 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | partial; 1 canonical JSON document | 0.125 |
| 658 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.152 |
| 659 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | partial; 1 canonical JSON document | 0.168 |
| 660 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.175 |
| 661 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 662 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 663 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 664 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 665 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 666 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 667 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 668 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 669 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 670 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 671 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 672 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 673 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 674 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 675 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 676 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 677 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.080 |
| 678 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.080 |
| 679 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.070 |
| 680 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 681 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.070 |
| 682 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.073 |
| 683 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.150 |
| 684 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.140 |
| 685 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | partial; 1 canonical JSON document | 0.157 |
| 686 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 687 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.071 |
| 688 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 689 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 690 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 691 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 692 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 693 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 694 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.069 |
| 695 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 696 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.073 |
| 697 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 698 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 699 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.076 |
| 700 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.071 |
| 701 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | complete; 1 canonical JSON document | 0.066 |
| 702 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.067 |
| 703 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.068 |
| 704 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.057 |
| 705 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.066 |
| 706 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.064 |
| 707 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.061 |
| 708 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.057 |
| 709 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.062 |
| 710 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | partial; 1 canonical JSON document | 0.115 |
| 711 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.141 |
| 712 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | partial; 1 canonical JSON document | 0.156 |
| 713 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.159 |
| 714 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 715 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 716 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 717 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 718 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 719 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 720 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 721 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 722 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 723 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 724 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 725 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 726 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.042 |
| 727 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 728 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 729 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 730 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.063 |
| 731 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.063 |
| 732 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.064 |
| 733 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.067 |
| 734 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.066 |
| 735 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.064 |
| 736 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.140 |
| 737 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.117 |
| 738 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | partial; 1 canonical JSON document | 0.145 |
| 739 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | unsupported; 1 canonical JSON document | 0.040 |
| 740 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.066 |
| 741 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.069 |
| 742 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 743 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 744 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 745 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 746 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 747 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.064 |
| 748 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.066 |
| 749 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial; 1 canonical JSON document | 0.116 |
| 750 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 751 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 752 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 753 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 754 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | partial; 1 canonical JSON document | 0.093 |
| 755 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial; 1 canonical JSON document | 0.081 |
| 756 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial; 1 canonical JSON document | 0.073 |
| 757 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete; 1 canonical JSON document | 0.088 |
| 758 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | partial; 1 canonical JSON document | 0.246 |
| 759 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | partial; 1 canonical JSON document | 0.336 |
| 760 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial; 1 canonical JSON document | 0.366 |
| 761 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | partial; 1 canonical JSON document | 0.350 |
| 762 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial; 1 canonical JSON document | 0.098 |
| 763 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial; 1 canonical JSON document | 0.092 |
| 764 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 765 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 766 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 767 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 768 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | partial; 1 canonical JSON document | 0.315 |
| 769 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | complete; 1 canonical JSON document | 0.245 |
| 770 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | partial; 1 canonical JSON document | 0.334 |
| 771 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 772 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 773 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 774 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 775 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | invalid; 1 canonical JSON document | 0.057 |
| 776 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 777 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported; 1 canonical JSON document | 0.056 |
| 778 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.055 |
| 779 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | partial; 1 canonical JSON document | 0.055 |
| 780 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.062 |
| 781 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.055 |
| 782 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.056 |
| 783 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | partial; 1 canonical JSON document | 0.056 |
| 784 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | partial; 1 canonical JSON document | 0.053 |
| 785 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | partial; 1 canonical JSON document | 0.052 |
| 786 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.054 |
| 787 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | partial; 1 canonical JSON document | 0.081 |
| 788 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | partial; 1 canonical JSON document | 0.092 |
| 789 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | partial; 1 canonical JSON document | 0.107 |
| 790 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | partial; 1 canonical JSON document | 0.110 |
| 791 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 792 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 793 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 794 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 795 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.053 |
| 796 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 797 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 798 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 799 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 800 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 801 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 802 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 803 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 804 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 805 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 806 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 807 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | partial; 1 canonical JSON document | 0.057 |
| 808 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | partial; 1 canonical JSON document | 0.057 |
| 809 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.056 |
| 810 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 811 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.055 |
| 812 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 813 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | partial; 1 canonical JSON document | 0.094 |
| 814 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.086 |
| 815 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | partial; 1 canonical JSON document | 0.096 |
| 816 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | unsupported; 1 canonical JSON document | 0.040 |
| 817 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.056 |
| 818 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 819 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 820 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 821 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 822 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 823 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 824 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.048 |
| 825 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 826 | `1ddebca` | workspace root | `node --version` | 0 | v24.22.0 | 0.003 |
| 827 | `1ddebca` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed, 0 failed, 0 ignored; harness 4.95 s | 5.912 |
| 828 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | partial; 1 canonical JSON document | 0.535 |
| 829 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- compare answers-working-61 answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.242 |
| 830 | `1ddebca` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 1.573 |
| 831 | `1ddebca` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed, 0 failed, 0 ignored | 4.644 |
| 832 | `1ddebca` | workspace root | `node --version` | 0 | v24.22.0 | 0.005 |
| 833 | `1ddebca` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | passed | 0.095 |
| 834 | `1ddebca` | apps/web | `node --version` | 0 | v24.22.0 | 0.003 |
| 835 | `1ddebca` | apps/web | `corepack --version` | 0 | 0.36.0 | 0.035 |
| 836 | `1ddebca` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 | 0.048 |
| 837 | `1ddebca` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | 383 policy entries passed; frozen lockfile | 0.124 |
| 838 | `1ddebca` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 839 | `1ddebca` | apps/web | `corepack pnpm run build:engine` | 0 | passed | 0.234 |
| 840 | `1ddebca` | apps/web | `corepack pnpm run types` | 0 | passed | 0.322 |
| 841 | `1ddebca` | apps/web | `corepack pnpm run typecheck` | 0 | passed | 1.719 |
| 842 | `1ddebca` | apps/web | `corepack pnpm run lint` | 0 | passed | 2.361 |
| 843 | `1ddebca` | apps/web | `corepack pnpm run format:check` | 0 | passed | 0.605 |
| 844 | `1ddebca` | apps/web | `corepack pnpm test` | 0 | 72 passed / 13 files; 0 failed | 4.870 |
| 845 | `1ddebca` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 846 | `1ddebca` | apps/web | `corepack pnpm run build` | 0 | passed | 1.997 |
| 847 | `1ddebca` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | three matched browser binaries installed | 0.304 |
| 848 | `1ddebca` | apps/web | `corepack pnpm run e2e` | 0 | 36 passed; 12 projects; 960 captures; 0 unexpected/skipped/flaky | 1506.323 |
| 849 | `1ddebca` | apps/web | `corepack pnpm run licenses` | 0 | 4 shipped / 358 full package versions passed | 0.296 |
| 850 | `1ddebca` | workspace root | `git diff --exit-code main HEAD -- packages Cargo.toml Cargo.lock rust-toolchain.toml deny.toml docs/model docs/briefs/assets apps/web/package.json apps/web/pnpm-lock.yaml` | 0 | 0 protected source/dependency/asset changes | 0.014 |

Release levers completed in 0.414 s after the release build (required under 2 s), expected exit 3. The isolated WebAssembly levers harness duration is recorded in its command row.

#### Diagnostic runs and limits

- Before the initial source revision: the first typecheck required generated engine bindings; `build:engine` resolved it. New test compilation initially rejected ES2023 `findLast` and non-tuple mock signatures; tests now use the existing target and typed rest arguments. A Vite raw import was also removed from the Node-run browser harness after an initial no-tests import error. One unit stub omitted its summary object; correcting the stub yielded 72/72 passing tests.
- The first release levers invocation took 5.192 s including 4.70 s of package-specific compilation after the workspace release build. A package-specific release build and a fresh timed invocation resolved the measurement; both attempts are recorded in the table.
- The first Chromium comparison smoke command failed because native comparison JSON exceeded Node's default subprocess output buffer. The harness now permits 16 MiB. The corrected Chromium 375-light smoke command passed all nine comparison cases before the ordered run. A chart-label collision found in that evidence was corrected before the source revision above.
- The first full browser run encountered Firefox's 32,767-pixel screenshot limit with the 618-row ledger. It was stopped after 18 expected / 2 unexpected / 16 skipped tests (exit 130). The table now scrolls vertically inside its own bounded container, and the suite asserts keyboard vertical scrolling in every project. A corrected Firefox phone smoke run passed before the final complete validation rerun.
- macOS execution is not observed: this task ran in the supplied Linux container. The tests preserve the existing macOS WebKit keyboard traversal and Firefox launch fixture; a macOS pass cannot be claimed from Linux.
- Independent review remains a separate maintainer/reviewer step; this implementation does not claim to review itself.

Additional diagnostic command observations (before the final source revision):

| Command in `apps/web` | Exit | Observation |
| --- | --- | --- |
| `corepack pnpm run typecheck` | 2, then 0 | Missing generated engine binding first; later ES2023/mock signature errors; generated binding and corrected tests resolved these. |
| `corepack pnpm test` | 1, then 0 | 71 passed / 1 failed with the incomplete comparison stub; then 72 passed / 0 failed across 13 files. |
| `corepack pnpm exec playwright test e2e/compare.spec.ts --project=chromium-375-light` | 1, then 1, then 0 | First no tests executed due to the raw import; then 1 failed due to the native subprocess buffer; corrected smoke: 1 passed, 0 failed (99.354 s total). |
| `corepack pnpm exec playwright test e2e/compare.spec.ts --project=firefox-375-light` | 0 | 1 passed, 0 failed after bounding the ledger; 119.700 s total. |

#### Open requirement

- V1 requires the baseline tab to show its retirement age, and forbids deriving figures in the interface. The engine also accepts a retirement year outside its projected years, where no `age_on_december_31` is supplied for that retirement year. For example, the committed `answers-working-61` fixture with only `household.persons[0].plan_end_age` changed to 65 produces years 2026–2030 while retirement remains 2031-03-10. Fresh native `run` and `levers` probes both exit 3 (Partial); five levers are offered. The baseline retirement-age lookup is absent for this valid input.
- No fallback wording is defined by v1. AGENTS.md requires stopping and reporting missing requirements; a maintainer choice between an entered-date label and a retirement-outside-plan label is pending. This case remains unimplemented; no passing comparison coverage is claimed for it. The complete prescribed reference/browser matrix above does not exercise it.

#### Exclusions

- Editing entries within a copy or combining changes: excluded by the brief; each copy uses exactly one engine lever's changes.
- Naming, saving, deleting, or comparing two copies: excluded by the brief; copies stay in memory and compare only with the baseline.
- Comparison export: deferred to plan 0005; the button and Export step remain unavailable.
- Baseline labels when retirement lies outside the projection: unresolved because v1 supplies neither an engine age nor a fallback rule; awaiting maintainer clarification as documented above.
- Engine levers/comparison output, dependencies, schemas and goldens: unchanged as required. No persistence, hosted route or authorization surface was introduced.
