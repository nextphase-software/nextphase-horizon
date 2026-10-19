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
