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
