BRIEF VERSION: 0003-W4 v1.1 (2026-10-21)

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
  - the example households, and every lever copy of the four supported ones. A copy is made by applying the lever's JSON Pointer changes, as the engine's scenario operation does. A copy's `assumptions_link` is `null`: a copy has no link under "What Horizon assumes" (deliverable 4).
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

### 0003-W4 v1.1 — implementation and validation (2026-10-22)

- Branch: `codex/0003-W4-plan-layout-and-overview`.
- Final source/test revision: `ebb80bd4f1865add02f832b5d8f845c786a88448` (`fix(web): preserve overview focus after opening a chart`). Initial native/release/WebAssembly/timing/license checks ran at `b4c1c6d8cc76ac872cd23587e6ec0068d5d47adc`; remaining CLI, web and deploy checks ran at `ebb80bd4f1865add02f832b5d8f845c786a88448`. The intervening fix changes only web source/tests. `git diff --exit-code b4c1c6d -- Cargo.toml Cargo.lock rust-toolchain.toml packages` exited 0: all Rust source, tests and build inputs are identical. The table identifies each revision. The record is committed after validation and does not name its own commit.
- Implemented the five-section layout, switcher, copy views, headline figures, Overview, chart events and chooser, and valuation-year money card. The own-figures head and what-if controls remain shared; settled what-ifs stay consistent across plan screens, and stale/loading/failed results do not supply headline figures.
- New dependencies: none. Existing package versions, licenses, engine code, schemas, references, goldens and CSP are unchanged from `d5855d4`.
- Documentation: the architecture describes the new layout and updates the earlier navigation description. `DESIGN.md` already contains decision 0023's navigation, figures, chart events, options and Overview rules; `docs/decisions/README.md` already lists 0023, so those files need no change.
- New tests: `src/shell-figures.test.tsx` renders all 78 shell cases, every chooser year, all 20 copies through the app copy flow, the four file inputs and the existing intake-review household. It also checks settled/pending what-ifs, copy provenance, reset/keep and screen transitions. `e2e/plan-layout.spec.ts` proves the new navigation, switcher, Overview landings, chooser, copy views and all three answer origins with axe and keyboard use. Existing test changes are the brief's named navigation/landing/label updates, including `e2e/intake.spec.ts`; `src/Plan.test.tsx` additionally verifies transport recovery when changing between Plan and Overview. No other existing test file changed.

#### Cumulative validation

Commands ran freshly in the required order, against the revisions identified above. Node.js is `v24.22.0`, corepack `0.36.0`, pnpm `12.9.1`, Rust `1.99.1` with the pinned components and target, cargo-deny `0.20.2`, and wasm-bindgen-test-runner `0.2.129` (matching Cargo.lock). Each WebAssembly command had a fresh `node --version`; the deploy checks also print it before each nested WebAssembly build. WebAssembly tests used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`.

CLI placeholder expansions are detailed below. Every other cumulative command is listed in order here. Test counts sum the executed harness results; filtered-out tests are not counted as passes.

| Revision | Directory | Command | Exit | Seconds | Observed result |
| --- | --- | --- | --- | --- | --- |
| `b4c1c6d` | `.` | `rustup show active-toolchain` | 0 | 0.05 | passed |
| `b4c1c6d` | `.` | `wasm-bindgen-test-runner --version` | 0 | 0.02 | passed |
| `b4c1c6d` | `.` | `cargo deny --version` | 0 | 0.072 | passed |
| `b4c1c6d` | `.` | `cargo test -p horizon-app intake` | 0 | 97.393 | 28 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values_intake` | 0 | 39.812 | 5 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app answers` | 0 | 7.415 | 10 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6.225 | 6 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app compare` | 0 | 0.603 | 3 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app immutability` | 0 | 0.312 | 1 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app export` | 0 | 5.44 | 2 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values_w4` | 0 | 0.585 | 1 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-engine tax` | 0 | 6.022 | 2 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values_w3` | 0 | 0.417 | 4 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values_w2` | 0 | 0.262 | 11 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app --test reference_values` | 0 | 0.119 | 7 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-engine ledger` | 0 | 0.074 | 2 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-engine money` | 0 | 0.069 | 2 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-app validation` | 0 | 0.441 | 5 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test -p horizon-parity` | 0 | 122.661 | 18 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo test --workspace` | 0 | 509.395 | 112 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | 25.035 | passed |
| `b4c1c6d` | `.` | `cargo fmt --all --check` | 0 | 0.198 | passed |
| `b4c1c6d` | `.` | `cargo test --workspace --release` | 0 | 176.833 | 112 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo build --workspace --release` | 0 | 14.125 | passed |
| `b4c1c6d` | `.` | `node --version` | 0 | 0.072 | v24.22.0 |
| `b4c1c6d` | `.` | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | 17.662 | passed |
| `b4c1c6d` | `.` | `node --version` | 0 | 0.022 | v24.22.0 |
| `b4c1c6d` | `.` | `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 313.87 | 18 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `node --version` | 0 | 0.017 | v24.22.0 |
| `b4c1c6d` | `.` | `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 28.608 | 1 passed, 0 failed, 0 ignored |
| `b4c1c6d` | `.` | `cargo deny check licenses` | 0 | 0.659 | licenses ok |
| `b4c1c6d` | `.` | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 0.904 | partial; under 2 seconds |
| `ebb80bd` | `.` | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 0.508 | partial; under 2 seconds |
| `ebb80bd` | `.` | `node --version` | 0 | 0.006 | v24.22.0 |
| `ebb80bd` | `.` | `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 9.573 | 1 passed, 0 failed, 0 ignored |
| `ebb80bd` | `.` | `cargo test -p horizon-wasm` | 0 | 8.22 | 5 passed, 0 failed, 0 ignored |
| `ebb80bd` | `.` | `node --version` | 0 | 0.009 | v24.22.0 |
| `ebb80bd` | `.` | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | 0.091 | passed |
| `ebb80bd` | `apps/web` | `node --version` | 0 | 0.005 | v24.22.0 |
| `ebb80bd` | `apps/web` | `corepack --version` | 0 | 0.047 | 0.36.0 |
| `ebb80bd` | `apps/web` | `corepack pnpm --version` | 0 | 0.057 | 12.9.1 |
| `ebb80bd` | `apps/web` | `corepack pnpm install --frozen-lockfile` | 0 | 7.383 | passed |
| `ebb80bd` | `apps/web` | `node --version` | 0 | 0.005 | v24.22.0 |
| `ebb80bd` | `apps/web` | `corepack pnpm run build:engine` | 0 | 0.252 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm run types` | 0 | 0.357 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm run typecheck` | 0 | 2.594 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm run lint` | 0 | 3.548 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm run format:check` | 0 | 0.973 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm test` | 0 | 47.922 | 20 files, 366 tests passed |
| `ebb80bd` | `apps/web` | `node --version` | 0 | 0.007 | v24.22.0 |
| `ebb80bd` | `apps/web` | `corepack pnpm run build` | 0 | 3.133 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.541 | passed |
| `ebb80bd` | `apps/web` | `corepack pnpm run e2e` | 0 | 1856.586 | 112 passed in 8 projects; 0 failed, 0 flaky, 0 skipped |
| `ebb80bd` | `apps/web` | `corepack pnpm run licenses` | 0 | 0.47 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `ebb80bd` | `infra/cloud/web` | `node --version` | 0 | 0.005 | v24.22.0 |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm --version` | 0 | 0.047 | 12.9.1 |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm install --frozen-lockfile` | 0 | 10.222 | passed |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm run licenses` | 0 | 0.189 | Deploy tooling license policy passed (35 package versions). |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm test` | 0 | 0.656 | ℹ tests 12; ℹ pass 12; ℹ fail 0 |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm run check` | 0 | 7.489 | 5 responses, all four exact headers, release commit, SPA fallback and application/wasm passed |
| `ebb80bd` | `infra/cloud/web` | `corepack pnpm run check` | 0 | 4.545 | 5 responses, all four exact headers, release commit, SPA fallback and application/wasm passed |
| `ebb80bd` | `.` | `git diff --check` | 0 | 0.017 | passed |

Release `intake_v2_timing` means (ten runs per case):

```text
v2-working-complete: mean 99.023 ms (10 runs)
v2-solve-spending: mean 209.487 ms (10 runs)
v2-solve-savings: mean 68.242 ms (10 runs)
v2-solve-retirement: mean 114.836 ms (10 runs)
v2-solve-savings-with-range: mean 415.152 ms (10 runs)
```

The isolated WebAssembly levers harness reported: test result: ok. 1 passed; 0 failed; 0 ignored; 14 filtered out; finished in 5.38s.

#### Expanded CLI checks

All 425 placeholder-expanded CLI invocations had the expected status/exit, canonical JSON and exactly one trailing newline. The separately timed release levers command is listed above. The native CLI integration suites compare command bytes against application operations; all 54 separately extracted intake outputs also matched their committed reference result objects. Exits are 0 complete, 3 partial, 1 invalid, 2 unsupported and 4 incomplete; `dev-run` keeps exit 0 for partial. Export status comes from the embedded run; import returns the restored run.

Each intake row ran `cargo run -p horizon-cli -- intake target/0003-W4-intake/<milestone>/<case>.json`:

| Milestone/case | Exit | Status |
| --- | --- | --- |
| `0002-W4/already-retired` | 0 | complete |
| `0002-W4/invalid-negative-before-retirement` | 1 | invalid |
| `0002-W4/invalid-range-order` | 1 | invalid |
| `0002-W4/invalid-range-order-before-negative` | 1 | invalid |
| `0002-W4/invalid-retirement-not-after-valuation` | 1 | invalid |
| `0002-W4/left-out-pay` | 3 | partial |
| `0002-W4/left-out-pay-and-spending-now` | 3 | partial |
| `0002-W4/left-out-pension` | 3 | partial |
| `0002-W4/left-out-social-security` | 3 | partial |
| `0002-W4/left-out-spending-now` | 3 | partial |
| `0002-W4/monthly-and-leap-birthday` | 3 | partial |
| `0002-W4/monthly-range-odd` | 3 | partial |
| `0002-W4/needed-all-four` | 4 | incomplete |
| `0002-W4/needed-birth-date` | 4 | incomplete |
| `0002-W4/needed-retirement` | 4 | incomplete |
| `0002-W4/needed-same-as-now-without-now` | 4 | incomplete |
| `0002-W4/needed-savings` | 4 | incomplete |
| `0002-W4/needed-spending-in-retirement` | 4 | incomplete |
| `0002-W4/no-savings` | 3 | partial |
| `0002-W4/partner` | 2 | unsupported |
| `0002-W4/pension-later-rises-not-sure` | 3 | partial |
| `0002-W4/pension-later-rises-yes` | 3 | partial |
| `0002-W4/range-one-savings` | 3 | partial |
| `0002-W4/range-same-as-now` | 3 | partial |
| `0002-W4/range-two` | 3 | partial |
| `0002-W4/starting-values` | 3 | partial |
| `0002-W4/unused-pay-when-retired` | 0 | complete |
| `0002-W4/unused-social-security-amount` | 3 | partial |
| `0002-W4/working-complete` | 3 | partial |
| `0002-W5/v1-working-complete-unchanged` | 3 | partial |
| `0002-W5/v2-age-instead-of-date` | 3 | partial |
| `0002-W5/v2-age-leap-valuation` | 3 | partial |
| `0002-W5/v2-age-too-young` | 1 | invalid |
| `0002-W5/v2-needed-birth` | 4 | incomplete |
| `0002-W5/v2-needed-retirement-without-pay` | 4 | incomplete |
| `0002-W5/v2-needed-three` | 4 | incomplete |
| `0002-W5/v2-needed-two` | 4 | incomplete |
| `0002-W5/v2-partner` | 2 | unsupported |
| `0002-W5/v2-range-nothing-solved` | 3 | partial |
| `0002-W5/v2-solve-retirement` | 3 | partial |
| `0002-W5/v2-solve-retirement-unreachable` | 3 | partial |
| `0002-W5/v2-solve-retirement-with-range` | 3 | partial |
| `0002-W5/v2-solve-savings` | 3 | partial |
| `0002-W5/v2-solve-savings-none-needed` | 3 | partial |
| `0002-W5/v2-solve-savings-retired` | 0 | complete |
| `0002-W5/v2-solve-savings-unreachable` | 3 | partial |
| `0002-W5/v2-solve-savings-with-range` | 3 | partial |
| `0002-W5/v2-solve-spending` | 3 | partial |
| `0002-W5/v2-solve-spending-same-as-now-missing` | 3 | partial |
| `0002-W5/v2-solve-spending-shortfall-at-zero` | 3 | partial |
| `0002-W5/v2-what-if-savings-total` | 3 | partial |
| `0002-W5/v2-what-if-savings-total-fills-savings` | 3 | partial |
| `0002-W5/v2-what-if-total-with-range` | 3 | partial |
| `0002-W5/v2-working-complete` | 3 | partial |

Each fixture row expands `cargo run -p horizon-cli -- <operation> <name>` for spend, levers, run, export and dev-run; `impact <name> packages/app/test-data/empty-rough.json`; and `compare A-drawdown <name>`. The commands ran by operation in the required order, over every fixture. Cells are observed exits for each invocation.

| Fixture | spend | levers | impact | run | compare | export | dev-run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `A-drawdown` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-pass-limit-1` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-roth_before_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-tax_deferred_first` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `B-early-retiree` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `C-partial-base-year-no-taxable` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `D-still-working-rmd-surplus` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `E-senior-2028-loss-carry` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `answers-cap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-underfunded` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61-retire-later` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `invalid-account-type` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-cost-basis` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-date` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-end-before-start` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-assumption` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-cash-return` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-field` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-investment-return` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-missing-tax-indexing` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-negative-balance` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-negative-tax-indexing` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-output-range` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-owner` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-plan-end-age` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-rate` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `invalid-tax-pass-limit` | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `retirement-date-baseline` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `retirement-date-scenario` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `return-assumption-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `return-assumption-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `spending-amount-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `spending-amount-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `synthetic-leap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `synthetic-retired` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `synthetic-working` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `two-person` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unchanged-copy-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `unchanged-copy-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `unsupported-healthcare` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-negative-cash-return` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-negative-investment-return` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-state-tax` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `unsupported-tax-year` | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `withdrawal-order-baseline` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `withdrawal-order-scenario` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Explicit rough input, reference comparison pairs and imports:

| Command | Exit | Status |
| --- | --- | --- |
| `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
| `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | partial |
| `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete |
| `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | invalid |
| `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | unsupported |
| `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported |

#### Browser and design evidence

Playwright 1.63.0 ran 112 passing tests in 8 projects, with 0 failed, 0 flaky and 0 skipped. Actual browser-version annotations: chromium 153.0.8010.12; webkit 26.6.

| Project | Passed |
| --- | --- |
| `chromium-1280-dark` | 14 |
| `chromium-1280-light` | 14 |
| `chromium-375-dark` | 14 |
| `chromium-375-light` | 14 |
| `webkit-1280-dark` | 14 |
| `webkit-1280-light` | 14 |
| `webkit-375-dark` | 14 |
| `webkit-375-light` | 14 |

The suite saved 1824 original PNG screenshots (excluding attachment copies), plus the HTML and JSON Playwright reports, outside the repository. Every project includes Overview, Plan with the chooser moved, a copy on Overview and Plan, Compare's empty state, Summary, and the example, opened-file and own-figures answer screens. Both browser families ran at 375×812 and 1280×800 in light and dark; the phone projects also checked 320px. The suite found no axe violations or horizontal overflow, retained exact CSP and origin/privacy checks, and operated navigation, the switcher and every example's chooser years by keyboard.

Screens were checked against references 22–24 and 26. The brief governs its listed differences: Plan retains What would help and the existing actions with Summary; the later options and Your plans cards are absent; the event-empty sentence is Nothing marked on the chart this year; Overview uses the specified five cards and next actions, with Try a change under assumptions only on the original example/file plan. Native controls retain their browser rendering, and keyboard captures retain visible focus. No additional design exclusion was taken.

#### Deploy repeatability

Both deploy checks exited 0 on the clean validated commit, used local-only dry runs, and verified five HTTP responses apiece, all four exact headers, release commit, SPA navigation fallback and `application/wasm`. The first staging tree was preserved outside the repository before the second check. Complete file-list comparison and every byte comparison exited 0: 12 files, 1743147 bytes identical. No login or real deploy ran.

#### Scope and supplementary checks

Exclusions are exactly the brief: later option controls and multi-copy comparison, the redesigned printable one-page summary, Your plans cards and later next-action wording; answers beside a live chart and assumptions on every question; engine changes, additional event kinds and couples. Summary content/eyebrow, comparison export, What would help and the expert details remain as specified. No cumulative validation command or browser project was excluded. Independent review remains a maintainer handoff step; the implementer did not act as reviewer.

Exploratory checks preceded the source revision. They exposed and corrected the mock assumption-array conversion, invalid description-list children, updated navigation/copy-request expectations, asynchronous test waits, and a Chromium capture/blur scroll interaction. Captures now leave committed number fields with Tab before axe/full-page screenshots. Unit typechecks and formatting were rerun after corrections. The last complete preliminary unit run passed 364 tests in 20 files; the added transport-recovery test then passed with all 15 Plan tests. The final focused browser run passed all 8 selected tests across Chromium phone/light and WebKit desktop/dark; an earlier overlapping browser launch was rejected because the local test port was occupied, and one superseded exploratory run was interrupted after its known failures. These exploratory results do not substitute for the fresh cumulative commands above.

Supplementary command outcomes before the source revision (not cumulative proof):

| Command | Exits / observed outcomes |
| --- | --- |
| `corepack pnpm run typecheck` | Initial test-typing errors exited 2; corrected runs exited 0. |
| `corepack pnpm run lint` | An initial misplaced lint suppression exited 1; corrected runs exited 0. |
| `corepack pnpm run format:check` / `corepack pnpm exec prettier --check .` | Unformatted edits exited 1; formatting corrections and subsequent checks exited 0. |
| `node --version`; `corepack pnpm run build` | Node v24.22.0 before each preliminary WebAssembly build; production builds exited 0. |
| `corepack pnpm exec playwright install chromium webkit` | Exit 0. |
| `corepack pnpm exec vitest run src/shell-figures.test.tsx` | First: exit 1, 70 passed / 8 failed. Next: exit 1, 78 passed / 1 failed. The asynchronous session test was corrected afterward. |
| `corepack pnpm exec vitest run src/shell-figures.test.tsx -t 'keeps the displayed what-if'` | An initial missing enabled-button wait failed; the next run passed 1 test with 78 unselected. A later loaded-environment wait failed and was corrected to a bounded 10-second asynchronous wait. |
| `corepack pnpm test` / `corepack pnpm exec vitest run` | Complete preliminary runs exited 0 with 363 tests, then 364 tests; all 20 files passed. |
| `corepack pnpm exec vitest run src/Plan.test.tsx` | Exit 0, all 15 tests passed after adding transport recovery. |

All selected browser commands below used `--project=chromium-375-light --project=webkit-1280-dark`.

| Command | Exit | Observed outcomes |
| --- | --- | --- |
| `corepack pnpm exec playwright test e2e/plan-layout.spec.ts` | 1 | 0 passed, 2 failed |
| `corepack pnpm exec playwright test e2e/plan-layout.spec.ts` | 1 | 0 passed, 2 failed |
| `corepack pnpm exec playwright test` | 1 | 22 passed, 6 failed |
| `corepack pnpm exec playwright test e2e/compare.spec.ts e2e/export.spec.ts e2e/shell.spec.ts e2e/what-if.spec.ts` | 1 | 9 passed, 3 failed |
| `corepack pnpm exec playwright test e2e/compare.spec.ts e2e/what-if.spec.ts` | 130 | 5 passed, 2 failed; interrupted after known failures |
| `corepack pnpm exec playwright test e2e/plan-layout.spec.ts e2e/what-if.spec.ts` | 1 | 0 passed, 0 failed; local port already occupied; no tests ran |
| `corepack pnpm exec playwright test e2e/plan-layout.spec.ts e2e/what-if.spec.ts` | 0 | 8 passed, 0 failed |

The final focus regression was reproduced before correction (2 failed, 80 unselected); after confining chart focus to Plan and waiting for asynchronous Overview/copy details, both regression tests passed (2 passed, 80 unselected). The browser layout test also covers chart focus on own figures and reopening an Overview after chart navigation. A validation-log scanning stall caused one harness interruption: the completed first release benchmark measured 0.904 seconds, and six intake prefix checks had passed. The release benchmark and every required intake/fixture expansion were rerun freshly at the final source revision; the final release benchmark was 0.508 seconds. Both benchmark commands and all six prefix commands are recorded here; no interrupted invocation is counted as a pass.

| Supplementary prefix command (b4c1c6d) | Exit | Status |
| --- | --- | --- |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/already-retired.json` | 0 | complete |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/invalid-negative-before-retirement.json` | 1 | invalid |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/invalid-range-order.json` | 1 | invalid |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/invalid-range-order-before-negative.json` | 1 | invalid |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/invalid-retirement-not-after-valuation.json` | 1 | invalid |
| `cargo run -p horizon-cli -- intake target/0003-W4-intake/0002-W4/left-out-pay.json` | 3 | partial |

### Review round 1 fixes

- Branch: `codex/0003-W4-plan-layout-and-overview`. New source/test tip validated: `2f341059ee96a8a2d80e256355a52da1abf565de`. This record follows that revision; the final branch tip is reported separately in the handoff.
- F1: `e2e/plan-layout.spec.ts` still reaches the Plan switcher by keyboard and asserts focus. Only macOS WebKit uses `selectOption`; every other platform retains Home/End and Enter. All five switcher changes assert the selected value and retain their screen/banner outcomes.
- F2: `e2e/compare.spec.ts` records the original input, run and headline before making copies. After returning to Your plan, the latest run request matching the original input must have the original reply, any new run request must use that input, and the Plan headline must equal the original headline. Reusing the saved baseline does not require a new engine request. The assertion no longer reads the first request of the session.
- F3: only the shell-figure copy flow's comparison-render wait increases from 10 to 30 seconds, within its existing 60-second case limit. Other waits are unchanged.
- F4: the Compare count has a visually hidden separating space. The layout browser test now requires the exact accessible name `Compare 2 plans`.
- No dependencies were added. No other product behavior, engine, schema, fixture, reference, golden, dependency configuration or CSP changed. Changes are limited to the four finding locations and this record.

All commands below ran from `apps/web/`. Validation ran on Linux using Node.js `v24.22.0`, corepack `0.36.0` and pnpm `12.9.1`. Node's version was recorded immediately before the build's WebAssembly command. The macOS-only native-select fallback cannot execute on Linux; the Linux Chromium and WebKit runs exercised the retained keyboard path. No browser project or requested validation command was excluded. The earlier cumulative Rust/deploy record remains above; this review round reran the web checks requested for these four fixes.

Preparation: `corepack pnpm exec prettier --write e2e/compare.spec.ts e2e/plan-layout.spec.ts src/shell-figures.test.tsx src/PlanShell.tsx` exited 0 (4 files processed). The first typecheck exposed an unsupported `Array.findLast` lookup; the corrected source uses the existing reverse-and-find pattern without changing the pinned target. The first full browser attempt passed 104 tests and failed all 8 Compare tests because the new assertion incorrectly required a fresh run when returning to the cached baseline. That extra requirement was removed while retaining the requested input, reply and headline checks. The failed attempts and the fresh successful sequence are recorded below. A later `corepack pnpm exec prettier --write e2e/compare.spec.ts` also exited 0 (1 file processed).

| Revision | Command | Exit | Seconds | Observed result |
| --- | --- | --- | --- | --- |
| `d18bdb7` | `node --version` | 0 | 0.003 | v24.22.0 |
| `d18bdb7` | `corepack --version` | 0 | 0.028 | 0.36.0 |
| `d18bdb7` | `corepack pnpm --version` | 0 | 0.038 | 12.9.1 |
| `d18bdb7` | `corepack pnpm run typecheck` | 2 | 2.053 | 2 TypeScript diagnostics; corrected before the successful sequence |
| `63ba7b7` | `node --version` | 0 | 0.003 | v24.22.0 |
| `63ba7b7` | `corepack --version` | 0 | 0.028 | 0.36.0 |
| `63ba7b7` | `corepack pnpm --version` | 0 | 0.034 | 12.9.1 |
| `63ba7b7` | `corepack pnpm run typecheck` | 0 | 1.822 | passed |
| `63ba7b7` | `corepack pnpm run lint` | 0 | 3.087 | passed |
| `63ba7b7` | `corepack pnpm run format:check` | 0 | 0.815 | passed |
| `63ba7b7` | `corepack pnpm test` | 0 | 41.967 | 20 files, 366 tests passed |
| `63ba7b7` | `corepack pnpm test` | 0 | 43.611 | 20 files, 366 tests passed |
| `63ba7b7` | `node --version` | 0 | 0.009 | v24.22.0 |
| `63ba7b7` | `corepack pnpm run build` | 0 | 2.706 | passed |
| `63ba7b7` | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.378 | passed |
| `63ba7b7` | `corepack pnpm run e2e` | 1 | 951.245 | 104 passed, 8 failed; incorrect fresh-run requirement corrected |
| `2f34105` | `node --version` | 0 | 0.002 | v24.22.0 |
| `2f34105` | `corepack --version` | 0 | 0.025 | 0.36.0 |
| `2f34105` | `corepack pnpm --version` | 0 | 0.035 | 12.9.1 |
| `2f34105` | `corepack pnpm run typecheck` | 0 | 2.428 | passed |
| `2f34105` | `corepack pnpm run lint` | 0 | 2.966 | passed |
| `2f34105` | `corepack pnpm run format:check` | 0 | 0.81 | passed |
| `2f34105` | `corepack pnpm test` | 0 | 41.934 | 20 files, 366 tests passed |
| `2f34105` | `corepack pnpm test` | 0 | 43.247 | 20 files, 366 tests passed |
| `2f34105` | `node --version` | 0 | 0.012 | v24.22.0 |
| `2f34105` | `corepack pnpm run build` | 0 | 2.738 | passed |
| `2f34105` | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.301 | passed |
| `2f34105` | `corepack pnpm run e2e` | 0 | 1061.643 | 112 passed; 0 failed, 0 flaky, 0 skipped |

Both final full web unit runs passed all 366 tests in 20 files; the two earlier full unit runs also passed 366 tests each. Playwright 1.63.0 ran all 112 tests across 8 projects. Actual browser-version annotations: chromium 153.0.8010.12; webkit 26.6.

| Project | Passed |
| --- | --- |
| `chromium-1280-dark` | 14 |
| `chromium-1280-light` | 14 |
| `chromium-375-dark` | 14 |
| `chromium-375-light` | 14 |
| `webkit-1280-dark` | 14 |
| `webkit-1280-light` | 14 |
| `webkit-375-dark` | 14 |
| `webkit-375-light` | 14 |

The new HTML/JSON Playwright reports and 1824 original PNG screenshots (excluding attachment copies) are saved outside the repository. Every project contains the changed layout captures, including Overview, Plan with its chooser moved, a copy on Overview and Plan, Compare's empty state, Summary and each answer origin. The existing keyboard, axe, responsive, exact CSP and privacy assertions passed. `git diff --check` exited 0 before each fix commit. All three fix commits passed the public-boundary hooks. No required check was skipped.
