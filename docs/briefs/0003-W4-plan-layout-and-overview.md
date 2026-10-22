BRIEF VERSION: 0003-W4 v1 (2026-10-21)

# 0003-W4 — Plan layout: navigation, headline figures, Overview and a chart-first plan

## Outcome

A plan opens as a small app instead of a row of steps. Every plan screen shares:
- labelled navigation (Overview, Plan, Compare, Summary, Your answers);
- a plan switcher;
- three headline figures in today's dollars.

The plan opens on an Overview of cards. The Plan page opens with savings by age, with life events marked in words and a year chooser. A card says, in one sentence and two bars, where this year's money comes from and goes. Every figure is an engine value (decisions 0023 and 0021); the engine does not change.

## Deliverables

Throughout:
- **"Plan screens"** are Overview, Plan, Compare, Summary (the screen that shares and keeps a plan, today's Export screen) and Your answers.
- **Money** uses the 0002-W6 conversion to whole dollars (half up). The base year is the valuation year.
- **[The shell figures](0003-W4-shell-figures.json)** holds the expected text. A script made it from the release CLI's `run`, `spend`, `levers` and `intake` output by applying the rules of deliverables 3–6. Its cases are:
  - the example households, and every lever copy of the four supported ones. A copy is made by applying the lever's JSON Pointer changes, as the engine's scenario operation does.
  - every 0002-W4, 0002-W5 and 0002-W7 reference case that shows a plan;
  - four engine fixtures opened as plan files: `B-early-retiree`, `C-partial-base-year-no-taxable`, `D-still-working-rmd-surplus` and `E-senior-2028-loss-carry`;
  - households built inside existing web tests: the first example retiring in 2100, the stubbed cap and exact-spending replies, and the answers saved by `e2e/intake.spec.ts`.

1. **Navigation.**
   - **Where it appears:**
     - on Overview, Plan, Compare and Summary whenever a plan is open (an example, a person's own figures or an opened file);
     - on Your answers whenever it was reached from a plan screen in this session.
     
     The welcome screen, the example chooser, the open-file screen with no plan, and questions begun from the welcome screen have none.
   - **Desktop, from 900px:**
     - `<nav aria-label="Plan sections">`, a side list beside the main column, with buttons labelled Overview, Plan, Compare, Summary and Your answers;
     - each label has a small decorative line icon (`aria-hidden`);
     - the current item has `aria-current="page"`, the surface background and a 3px `color-accent` bar on its leading edge.
   - **Below 900px:** the same five items in a bar fixed to the bottom, each an icon above its label. The current item is shown in `color-accent-text` with a 3px bar on top. The page gets bottom padding so nothing is hidden behind the bar.
   - **Compare's count:** while copies exist, Compare shows the number of plans (copies + 1), with the screen-reader text " plans".
   - **What each item does:**

     | Item | Opens |
     | --- | --- |
     | Overview | Overview of the plan the switcher names |
     | Plan | The Plan page of that plan |
     | Compare | With copies: Compare, with the switcher's copy selected, or the most recent copy when the switcher names your plan. With none: an empty state, h1 "Compare your plans side by side", then "Compare shows your plan next to copies you make. Try a change: it opens as a copy, and your plan stays as it is." and a "Try a change" button that opens the one-change panel |
     | Summary | Today's Export screen, unchanged |
     | Your answers | **Own figures:** the review page ("Here's what you told us"). **Example:** h1 "This is an example household", then "Example households come with invented figures, so there are no answers to change. To see a plan from your own figures, answer a few questions. Your answers stay on this device." **Opened file:** h1 "This plan came from a file", then "A plan file holds figures, not answers, so there are no answers to change here." Both end with "Start with my own figures" and "Choose another example". |

   - **Removed:** the "Planning steps" navigation (Plan · Compare · Export, and its "Your answers" step for own figures).
2. **Plan switcher.**
   - **Where it sits:** in the header wherever the navigation is shown, between the brand and Theme. It is a labelled `<select>`: label "Plan", options "Your plan" then "Copy: {name}" for each copy in the order made. Names are the compare tab names ("Retire at 67", "Spend $60,300 a year", "Returns at 6%").
   - **With no copies,** the help text "No copies yet" sits beside it. When copies are cleared (a changed input or a kept what-if), it returns to "Your plan".
   - **Choosing on Overview or Plan** shows the chosen plan on that page.
   - **Choosing on Compare:** a copy selects that copy's tab, and "Your plan" opens Plan with your plan. Selecting a tab on Compare sets the switcher to that copy.
   - **Summary and Your answers** concern your plan: the switcher reads "Your plan" there, and choosing a copy opens Plan with that copy.
   - **A copy as a full plan** (Overview and Plan):
     - **Banner:** a card above the content: "You're looking at a copy: {name}. Your plan stays as it is.", with the buttons "Back to your plan" and "Compare with your plan".
     - **Content:** the copy's own `run`, `sustainable_spending` and `levers`.
     - **Eyebrow:**
       - "{EXAMPLE LABEL} · COPY: {NAME}" for an example;
       - "OPENED PLAN FILE · COPY: {NAME}" for an opened file;
       - "YOUR FIGURES · COPY: {NAME}" for own figures.
     - **Tag line:** the plan's own. Examples show "◇ Example household — invented figures", opened files "◇ Opened plan file", and own figures none.
     - **Not shown:** the own-figures head and what-if panel; "Answers that could change this"; any ranges wording; "Try a change" and the one-change panel. A copy is not copied again.
     - **Actions:** "Back to your plan" and "Compare with your plan" replace the Plan page's actions.
3. **Headline figures** (decision 0023 item 3), always for the plan the switcher names, in today's dollars. Each figure has a label, a value with an optional unit, and an explanation.
   - **Savings.**
     - With a shortfall (the first year with `ledger.shortfall` above zero): value "Run short at {age}", explanation "{shortfall_today} of spending isn't covered in {year}."
     - Otherwise: value "Last to {end}", explanation "The plan runs to {end}."
   - **Most you could spend,** from `sustainable_spending`, with the unit "a year" unless the value is "Not tested" or "None":
     - **Retirement after the plan ends:** "Not tested", explanation "Your retirement falls after the plan ends."
     - **Flag `shortfall_with_no_retirement_spending`:** "None", explanation as the 0003-W3 follow-on: "Savings run short before you retire, so spending less in retirement can't fix this on its own." when the first short year is before retirement, otherwise "Savings run short even with no spending in retirement."
     - **Otherwise:** "At least {cap}" for flag `at_or_above_cap`, else "{sustainable_spending}". The explanation is the first of these that applies:
       1. "Horizon worked this out from your other answers." when the worked-out answer is spending in retirement;
       2. "No spending in retirement is counted." when `entered` is 0;
       3. "Exactly what you plan to spend in retirement." when `headroom` is 0;
       4. "You plan {entered} a year in retirement."
   - **Left at {end}:** the last year's `total_closing_today`. Values under one dollar show "less than $1"; zero shows "$0". Explanation: "What savings would hold when the plan ends." when above zero, else "Nothing is left when the plan ends."
   - **The strip** on Plan, Compare and Summary:
     - A section sticky at the top of the main column, with the accessible name "{name}: headline figures". The name is "Your plan", "Copy: {name}", or "What if" while an own-figures plan shows a what-if (0002-W7).
     - It shows the name, the three labels and values (`dl`), and the note "Today's dollars ({year} dollars)". The note gains " · middle of your ranges" for an own-figures plan with ranges (not for copies).
     - Below 560px the figures sit in three equal columns, and the name and note are visually hidden but kept for assistive technology.
   - **On Overview:** the same three figures as large tiles, each with its explanation, then the note as a line below.
   - **When there are no figures:**
     - while results are calculating, a "Calculating…" status;
     - none when the result is unsupported or failed;
     - none when a worked-out answer has no value (flag `unreachable`), because its plan is only the search limit.
4. **Overview** (decision 0023 item 4).
   - **Opening a plan lands on Overview, with its h1 focused.** That covers "Open example plan", "See my plan", opening a plan file and restoring a saved session at its results.
   - **These open Plan instead:** the Plan navigation item; the links "See the plan", "Open the chart" and "Open the plan"; Compare's "Back to plan"; and choosing a copy on Compare, Summary or Your answers.
   - **Top, examples, opened files and copies:**
     - eyebrow "OVERVIEW · {LABEL}" (the example label, "OPENED PLAN FILE", or the copy eyebrow of deliverable 2);
     - h1 the plan headline (0003-W2);
     - the tag line;
     - for a copy, the copy banner.
   - **Top, own figures:** the 0002-W6 head exactly as on Plan, with its "What if: not your answers" tag while a what-if is shown, its status, gap cards, "Answers that could change this" and starting values. The what-if panel itself is not shown.
   - **Then** the tiles (deliverable 3), and cards in two columns from 900px (one column below), in this order:
     1. **"Your answer":** the 0003-W3 follow-on, the plain "why savings run short" and "What moves it most" lines (each only when present, the last without its link), and the amounts note. Then a "See the plan" button.
     2. **"Savings by age":** today's compact savings drawing with the figcaption "Savings at the end of each year, today's dollars.", then an "Open the chart" button (opens Plan with focus on the chart card's heading).
     3. **"Your money this year":** deliverable 5.
     4. **"What this result doesn't count"** (examples, opened files and copies; own figures have it in the head): the status chip and the full plain list, or "Nothing is left out." When the status is "✓ Covers your situation" and the list is not empty, the line "Your situation is covered, but Horizon doesn't count these yet:" comes between the chip and the list, so the chip and the list don't read as a contradiction. A complete result still carries the engine's general items (for example "State income tax isn't counted.").
     5. **"What Horizon assumes":** one line per `assumptions_used` entry, in the engine's order: "{Name}: {n}% a year". Names are Cash return, Inflation, Investment return and Tax brackets rise; the percent is written as the person would enter it. Then "Estimates, not facts." and a link button:
        - "Change these" for own figures: opens the review page;
        - "Try a change" for examples and opened files: opens the one-change panel;
        - none on a copy.
   - **"What to do next,"** a full-width card after the grid. A numbered list, each item a sentence and a control:
     1. "See each year. The chart marks what happens when; choose a year to see its numbers." — "Open the plan".
     2. "Try a change. It opens as a copy; your plan stays as it is." — "Try a change". Not on a copy.
     3. "Compare your plans side by side." — "Compare {n} plans" when copies exist, else the help text "Try a change first."
     4. "Keep a summary. Print it, save it as a PDF or keep a file Horizon can reopen." — "Get the summary".
     5. Own figures only: "Change an answer. Your answers stay on this device." — "Change your answers".
   - **An unsupported or failed result:** Overview shows the Plan page's message and no figures or cards.
5. **"Your money this year"** (decision 0023 item 6), from the first projection year, which is always the valuation year (`ledger` amounts in today's dollars), on Overview and on Plan.
   - **Lead:** "In {year}" when `period.start` is 1 January; otherwise "From {d Month} to 31 December {year}".
   - **Money in**, in this order, each only when above zero:
     - "Pay" for a wage line (`income.wages.N`). When more than one wage line is above zero, they read "Pay 1", "Pay 2" … in order;
     - "Social Security";
     - "Pension";
     - "Taken from savings" (`withdrawals_total`);
     - "Required withdrawals" (`rmd_total`);
     - "Money short" (`shortfall`).
   - **Money out:** "Spending", "Federal tax" (`federal_tax.paid`) and "Added to savings" (`surplus_deposit`), each only when above zero.
   - **Sentence.** Here I is `income_total`; "from savings" means `withdrawals_total` + `rmd_total` is above zero. {outs} joins "spending of {S}" and "{T} of federal tax" (each only when above zero) with " and ". Use the first case that applies:
     1. Nothing comes in, nothing goes out and nothing comes from savings: "{Lead}, no money comes in or goes out."
     2. A shortfall: "{Lead}, income of {I} and what's left in savings don't cover {outs}: {short} is short." With I zero: "{Lead}, what's left in savings doesn't cover {outs}: {short} is short."
     3. Otherwise, with {outs}: "{Lead}, {sources} {cover|covers} {outs}{saved}." Here {sources} is "income of {I}", "income of {I} and money taken from savings" ("cover"), or "money taken from savings". {saved} is ", and {added} left over is added to savings" when `surplus_deposit` is above zero.
     4. With no {outs}: "{Lead}, {I} comes in and is added to savings."
     
     Cases 2–4 end with " No spending is counted this year." when `spending` is zero.
   - **Note:** "{year} amounts, which are today's dollars. Savings also grow with returns; that isn't shown here." For a part year: "Amounts from {d Month} to 31 December {year}, which are today's dollars. Savings also grow with returns; that isn't shown here."
   - **Picture:** two horizontal bars, "Money in" and "Money out", each made of its lines in order and drawn to the scale of the larger total. Widths are drawing positions only, never shown as amounts. Below each bar, its lines as a text list with amounts, which is the accessible content; the bars are `aria-hidden`.
6. **Plan, chart-first** (decision 0023 item 5).
   - **Order:**
     - the top as today (examples, opened files and copies: eyebrow, headline, tag line, the copy banner for a copy, the status card; own figures: the head and the what-if panel);
     - then the chart card, the answer card, "What would help", "Why savings run short", "Your money this year", "Details for experts" and the actions.
   - **Chart card,** replacing "Savings by age":
     - **Heading and hint:** h2 "Savings by age", hint "Today's dollars ({year} dollars) · Age on the axis".
     - **Drawing:** an area chart of `total_closing_today` by `age_on_december_31`. A solid `color-series-baseline` line over a light fill of the same token, three gridlines, the highest year-end savings and $0 labelled, and ages along the bottom. A compact drawing replaces it below 560px.
     - **Events:** each is a dot on the line and a leader to its word label. Labels never overlap; use lanes. The "Savings run short" dot is filled and its leader dotted, and every event is in words, never shown by color alone.
     - **Figcaption:** "Total savings at the end of each year. Marked on the line: {label} ({year}) · …."
     - **Table:** "Show as a table", today's savings-by-age table, unchanged.
   - **Events,** in year order; within a year: retire, Social Security, pension, savings run short, plan ends.
     - "Retire at {age}": when `retirement_date` is after `valuation_date` and its year is a projection year. The age is the whole years on the retirement date, with a 29 February birthday falling on 28 February in common years.
     - "Social Security starts at {age}" and "Pension starts at {age}": the first projection year after the first in which `ledger.income.social_security` (or `.pension`) is above zero, aged by that year's `age_on_december_31`. Income already paid in the first year is not marked.
     - "Savings run short at {age}": the first year with a shortfall.
     - "Plan ends at {age}": the last year.
   - **Year chooser:**
     - **Control:** a native range input labelled "Choose a year", one step per projection year, starting at the first year, with `aria-valuetext` "{year}, age {n}". Arrows, Home and End work.
     - **Ends:** shown below it as "{year}, age {n}".
     - **On the chart:** the chosen year is drawn as a vertical `color-accent` line and dot.
   - **Chosen-year panel,** `aria-live="polite"`, beside the chart from 900px and below it on narrower screens:
     - the eyebrow "Chosen year" and the title "{year} · age {n}";
     - "Savings at year end" (`total_closing_today`);
     - "Money short that year" (`shortfall_today`, or "None");
     - "This year": that year's event labels, or "Nothing marked on the chart this year.";
     - the note "Today's dollars ({year} dollars). That year's income, withdrawals and tax are in Details for experts."
   - **Actions:** "Try a change", "Summary" and "Back to household" or "Back to my answers", in today's order. "Summary" is today's "Export" button renamed to match the navigation; it opens the Summary screen as before. A copy has its own actions (deliverable 2).
   - **Unchanged on Plan:** the answer card (with "See what would help"), "What would help", "Why savings run short" and "Details for experts".
7. **Expected text.** For every case of the shell figures, the screens show exactly the file's text:
   - the strip's name, figures and note;
   - the tiles;
   - the events, the caption and the slider ends;
   - every year's panel, reached with the chooser;
   - the first-year card's sentence, lists and note;
   - the assumption lines and their link.

   Cases marked `test/…-cap` and `test/…-exact` give only the tiles. The couple example has no figures. The 0002-W7 cases other than `start` are what-ifs of their starting answers, so their strip is named "What if". Overview's "Your answer" lines equal the 0003-W3 sentences file wherever both files hold the case.
8. **Documentation:**
   - `DESIGN.md`: the navigation, headline figures, chart-event, options and Overview text of decision 0023.
   - `docs/architecture/web-shell.md`: the navigation, switcher, strip, Overview, chart and year chooser, and the first-year card.
   - `docs/decisions/README.md`: decision 0023.

## Done when

1. **Text:** every case in the shell figures renders exactly that text, by unit test over the file. Copies are rendered through the copy flow, and the four file cases from their household input.
2. **Navigation:**
   - the five items in order, labelled, at 1280px and 375px, with `aria-current` on the current item;
   - "Planning steps" is gone;
   - Compare's count, the Compare empty state and the three kinds of Your answers behave as in deliverable 1.
3. **Landing:** every way of opening a plan in deliverable 4 lands on Overview with its h1 focused.
4. **Switcher:**
   - choosing a copy shows it as a full plan with the banner, without "Try a change";
   - the strip names and shows the switcher's plan;
   - Compare's tabs and the switcher stay in step.
5. **Year chooser:** Arrows, Home and End reach every year of every example. The panel and `aria-valuetext` follow.
6. **Plain screens:** no word from the 0003-W3 list, "should", "recommend", "we suggest" or "dollars of each year" appears on Overview, the strip, the chart card, the panel or the first-year card. The interface computes no financial figure beyond decision 0011's conversions.
7. **Design and browsers:**
   - The screens match design references 22–24 and 26 at phone and desktop sizes in light and dark, with the differences named in Read first.
   - The 8 projects (Chromium and WebKit) pass, with axe, keyboard use of the navigation, switcher and chooser, no horizontal overflow at 375px and no off-origin requests.
8. **Earlier guarantees hold:**
   - engine code, references, goldens and schemas are unchanged;
   - the 0003-W3 sentences file still passes;
   - 0002-W6 and 0002-W7 behave as before inside the new layout;
   - the Content Security Policy is unchanged;
   - unit tests, typecheck, lint, format, build and license checks pass.
9. **Tests updated:** tests that opened the Plan page, used "Planning steps" or the "Export" step, or pressed the Plan page's "Export" button (now "Summary") are updated. Expected: `e2e/shell.spec.ts`, `e2e/plan.spec.ts`, `e2e/compare.spec.ts`, `e2e/export.spec.ts`, `e2e/what-if.spec.ts`, `src/App.test.tsx`, `src/Export.test.tsx` and `src/Plan.test.tsx`; possibly `e2e/intake.spec.ts` and `e2e/intake-dates.spec.ts`. Each other changed test is named, with its reason, in the implementation record.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0023-*`, `0021-*`, `0016-*`, `0012-*`, `0017-*`, `0019-*` and `0011-*` (item 5).
- Briefs `0003-W2-plan-screen.md`, `0003-W3-plain-results.md`, `0004-W1-compare-screen.md`, `0005-W1-export-screen.md`, `0002-W6-intake-screens.md` and `0002-W7-what-if-panel.md`.
- [Design references, version 2](assets/design-v2/README.md), screens 22–24 and 26. They are illustrative; where they differ from this brief, the brief wins. Known differences:
  - **Screen 22:** the options section, "Your plans", "Every change Horizon tried" and "What to do next" on Plan come in a later build. Plan keeps "What would help" and its link, and the actions row in today's order, with "Summary" in place of "Export" (deliverable 6).
  - **Screens 22–24:** "Nothing changes this year." reads "Nothing marked on the chart this year."
  - **Screen 24:** the options card and the "Your plans" card come later. "What to do next" uses deliverable 4's items, and the assumptions link reads "Try a change", not "Try other returns".
  - **Screen 22b:** for a retired household only "Plan ends at 95" is marked, as deliverable 6 requires.
  - **Screen 26:** in `26-phone-nav.png` only the navigation bar, the switcher and the strip are the reference; the Compare content behind them (several copies side by side) comes in a later build.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.

## Validation

The full sequence in `AGENTS.md`:
- the Rust sequence;
- the web shell, with `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects;
- the deploy tooling checks.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions, and the e2e project and test counts. Save screenshots of every plan screen in every project (Overview, Plan with the chooser moved, a copy, Compare's empty state, each kind of Your answers), and the Playwright report, outside the repository.

## Exclusions

- **Later builds:** the options and their "Try this", Compare with several copies side by side, the printable one-page summary, the "Your plans" cards and the final "What to do next" wording come in a later build. So do the answers beside a live chart and assumptions changed on every question.
- **Engine changes:** none. That leaves out today's-dollar yearly income, withdrawals and tax, more event kinds (pay stopping on another date, required withdrawals starting, one-off events) and couples.
- **Unchanged here:** the Summary (Export) screen's content and eyebrow; Compare's "Export this comparison" button; the Plan page's actions row apart from the "Summary" label (deliverable 6); "What would help"; the example eyebrow ("… plans to retire at 66 · retire at 66").

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
