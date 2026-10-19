BRIEF VERSION: 0004-W1 v1 (2026-10-18)

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
   3. **Tabs:** "Baseline · retire at <age>" (or "Baseline · retired" when the retirement date is on or before the valuation date), then one tab per copy by name, then "+ New copy". The selected copy's tab is marked current (`aria-current` or `aria-selected`). "+ New copy" opens the panel of deliverable 1 and is disabled with "(no more changes to try)" when every lever has a copy.
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
   - an engine error shows its status word and message, no figures, and "Back to plan".
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
