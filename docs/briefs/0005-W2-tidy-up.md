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
