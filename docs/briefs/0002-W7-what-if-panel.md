BRIEF VERSION: 0002-W7 v1.2 (2026-10-20)

# 0002-W7 — What if: change any answer and see the plan again

## Outcome

On the results of a person's own figures, a "What if…" panel lets them change retirement age, spending in retirement, savings, Social Security, pension, investment growth and price rises with sliders, and see the plan again from the engine. Their answers stay as they are until they choose **Keep these as my answers**; **Reset to my answers** goes back. What-if values are never stored. Example households are unchanged.

## Deliverables

1. **The panel** (design references 12–13):
   - **Where:** on the results of the person's own figures, below "Starting values Horizon used" and above the plan body. It shows whenever the current result has a household input; never for an example household, nor for an `incomplete`, `unsupported` or `invalid` result.
   - **Text:** heading "What if…"; line "Move any of these to see how your plan changes. Your answers stay as they are until you choose to keep a change."
2. **The sliders,** each a native range input with a number box beside it in the same unit:

   | Label | Shown when | Range and step | Starts at | Sends |
   | --- | --- | --- | --- | --- |
   | Retire at | not retired | age 50 (or the first whole age after the valuation date, if higher) to 80, step 1 | the answered age; the worked-out age when `solved.answer` is `retirement`; for a date answer, the person's age in whole years on that date; when the worked-out age is null (flag `unreachable`), the person's age in whole years on the household input's retirement date, the search limit **(v1.1)**. Ages count a 29 February birthday as 28 February in common years (decision 0017 item 3) | `retirement: {"age": n}` |
   | Spending in retirement, a year | always | $0–$200,000, step $1,000 | the household input's `spending.after_retirement` cents | `spending_in_retirement: {"cents": c, "per": "year"}` |
   | Savings today | always | $0–$3,000,000, step $5,000 | the exact sum of the household input's account balances (decision 0011, amendment "one exact sum") | `what_if: {"savings_total_cents": c}` |
   | Social Security, a year | `expects` is not `no` | $0–$60,000, step $500 | the household input's Social Security amount cents | `social_security.amount: {"cents": c, "per": "year"}`, keeping `expects` and setting `start_age` to the household input's |
   | Social Security from | `expects` is not `no` | age 62–70, step 1 | the household input's start age | `social_security.start_age` |
   | Pension, a year | the pension answer is "yes" with an amount | $0–$60,000, step $500 | the household input's pension amount cents | `pension.amount: {"cents": c, "per": "year"}`, keeping `start_age` and `rises_with_prices` |
   | Investments grow, a year | always | 0–8%, step 0.25 | the household input's `investment_return`, as a percent by moving the decimal point in the text | `assumptions.investment_return` as a decimal string (the 0002-W6 rule) |
   | Prices rise, a year | always | 0–5%, step 0.25 | the household input's `inflation`, likewise | `assumptions.inflation` |

   - **Ranges:** when a starting value lies outside its range, the range extends to include it, to the next step.
   - **Display:** the value shows in plain words beside the label ("$80,000", "age 66", "2.5%"), with an accessible value text such as "$80,000 a year". A slider changed from its start shows the tag "what if".
   - **The line under each slider (v1.1)** says where its starting value came from, using the 0002-W6 conversions (whole dollars, half up):
     - "Your answer: …" when the person gave that value: a figure; an age or a date for retirement; savings given as a figure for every account (the exact sum), or "none" ($0); a rate given in `assumptions`.
     - "Your range: … to …" when the answer is a range (spending in retirement, a Social Security amount), with the range drawn as a band under the track.
     - "Worked out: …" for the worked-out answer; when its value is null (`unreachable`), "Worked out: no age works" (retirement) or "Worked out: no amount up to $100,000,000 works" (savings).
     - "Horizon used: …" for anything else: a value the person did not give (a rate not in `assumptions`, a Social Security start age not answered), spending "about the same as now", savings where any account is a range, or an amount left for later.
     - A mark under the track shows the value on that line; a range shows its band instead; a null worked-out value shows neither.
   - **Number box:** a typed value outside the range is not sent and says why under the box.
3. **Sending:**
   - **What is sent:** a what-if is the person's answers document with every changed slider's value applied, all changes at once (decision 0019 item 9). It is sent to `plan_from_answers` when a slider is released (pointer up, or a key released) or a number box is committed, never during a drag.
   - **While waiting:** the head says "Working out your plan…".
   - **Stale replies:** a reply that is no longer the latest request is ignored.
4. **Showing a what-if:**
   - **The head:** it re-renders by the rules of brief 0002-W6 deliverable 7 for the what-if result, with the tag "What if: not your answers" above the headline while any change is active.
   - **The plan body:** it follows the what-if result's household input.
   - **Expected text:** the head for each case in [the what-if cases](0002-W7-what-if-cases.json) equals that case's `head`.
5. **Reset and keep:**
   - **Reset to my answers** restores every slider and the result of the person's answers.
   - **Keep these as my answers** writes each changed value into the answers:
     - retirement as `{age}`;
     - spending in retirement as a figure in a year, replacing a range or "about the same as now";
     - Social Security amount and start age;
     - the pension amount;
     - the two rates in `assumptions`;
     - for a savings total, each account's balance is set to the balance the what-if result's household input gives that account, in the same order, replacing ranges and keeping each answered cost basis. When the person had no accounts, or every account was at $0 (decision 0019 item 10), the one generated account replaces them, kept with its balance and cost basis **(v1.2)**.

     Every kept answer leaves `not_sure`. The answers are then saved (decision 0018) and the panel starts again from them.
6. **Not stored:** what-if values never reach the stored item (decision 0018 item 1). The item changes only on **Keep these as my answers**.
7. **Accessibility:** every slider and box is reachable and operable by keyboard (arrows and Page Up/Down on the slider), labelled, with visible focus, and the panel passes axe.
8. **Documentation:** `docs/architecture/web-shell.md` gains a what-if section (the sliders, when a change is sent, reset and keep, nothing stored, and the one exact sum).

## Done when

1. **Starting values:** for each case of [the what-if cases](0002-W7-what-if-cases.json), the sliders' starting values computed from the `start` case's result are those in the table: retire 66, spending $67,000, savings $750,000, Social Security $26,000 from 67, investments 5%, prices 2.5%. For `worked-out-savings-then-total-600000`, the starting point is the result of its answers without the `what_if`. **(v1.1)** For each of the 34 cases in [the slider starts](0002-W7-slider-starts.json) (every 0002-W4 and 0002-W5 reference case whose result shows the panel), the sliders shown, their starting values and the line under each equal that file.
2. **What-if documents:** for each case other than `start`, moving the named slider from the starting values produces that case's `answers` exactly. The case names give the change: spending $80,000; retire at 70; savings $1,000,000; Social Security $33,000 from 70; investments 6% and prices 3%; spending $70,000 on the ranged answers; savings $600,000 after a worked-out savings.
3. **Head text:** the head rendered from each case's `result` equals its `head`, with the "What if: not your answers" tag for every case but `start`.
4. **No other arithmetic:** the only computations are the 0002-W6 conversions and the one exact sum; no figure on screen comes from anywhere but a result.
5. **Sending on release:** a test drags a slider and shows one `plan_from_answers` call after release and none during the drag; a stale reply is ignored.
6. **Keep and reset:** keeping a savings total writes the shared balances exactly (for `savings-total-1000000`: 2,666,667, 20,000,000, 69,333,333 and 8,000,000 cents) and stores the answers; reset restores the answers' result; what-ifs alone leave the stored item byte for byte unchanged.
7. **Design and browsers:** the panel matches design references 12–13 at phone and desktop sizes in light and dark. The 8 projects (Chromium and WebKit) pass, with axe, keyboard-only use of every slider, no horizontal overflow at 375 px and no off-origin requests. Examples show no panel.
8. **Earlier guarantees hold:** every engine test, reference file, golden and schema is unchanged, and so are the 0002-W6 head sentences and their tests; the Content Security Policy is unchanged; unit tests, typecheck, lint, format, build and license checks pass.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0011-*` (with its amendments), `0018-*` and `0019-*` (items 9–11).
- Briefs `0002-W5-reverse-answers.md` and `0002-W6-intake-screens.md`.
- [Design references, version 2](assets/design-v2/README.md), screens 12–13. Illustrative and not to ship: the drawn plan body is a placeholder for today's plan body. Under v1.1, the two rate lines drawn as "Your answer: 5%" and "Your answer: 2.5%" read "Horizon used: 5%" and "Horizon used: 2.5%", because that household gave no rates.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence, then the web shell, with `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions, and the e2e project and test counts. Save screenshots of every screen in every project, and the Playwright report, outside the repository.

## Exclusions

- **Example households:** they keep "Try a change" and Compare; no panel.
- **Sliders for other answers** (pay, spending now, account kinds, plan length): a later brief if wanted.
- **Live updating during a drag:** excluded by decision 0019 item 14 and the recorded engine times.
- **Engine changes:** none.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
