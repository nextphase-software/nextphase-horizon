BRIEF VERSION: 0003-W5 v1.1 (2026-10-22)

# 0003-W5 — Options, side-by-side compare and a printable summary

## Outcome

The plan now ends with "Ways to make your savings last": options the engine has worked out, one change each, with their effect and a way to try them as a copy. Every option list says these are options to explore, not advice.
- **Overview** shows the first two options and a "Your plans" card.
- **Plan and Overview** end with a full "What to do next" list.
- **The old list of every change Horizon tried** moves into "Details for experts".
- **Compare** shows your plan and several copies side by side.
- **The Summary** prints the answer, the options, this year's money and the plans you tried. It fits one page when it can, with the answer and the options always on the first page.

Every figure is an engine value (decisions 0023 and 0021). The engine does not change.

## Deliverables

Throughout:
- **Money** uses the 0002-W6 conversion to whole dollars. Amounts are today's dollars.
- **"Shown plan"** is the plan on screen: your plan, a what-if of your answers (0002-W7), or an opened file. A copy viewed as a full plan (0003-W4) is not a shown plan for this brief; it has no options.
- **[The options file](0003-W5-options.json)** holds the expected text. A script made it from the release CLI's `run`, `spend`, `levers` and `intake` output by applying deliverables 1–5.
  - **Cases:** the 0003-W4 shell-figures cases (examples, their lever copies, the 0002-W4/W5/W7 reference cases that show a plan, four engine fixtures opened as files, and households built inside existing tests), plus each example's spend-to-last copy.
  - **Checking every option:** the script runs each option that has "Try this" as a copy, by the engine's scenario rule (JSON Pointer changes on the household input), and checks that the copy does what the option says. A spend-to-last copy lasts to the plan end with exactly enough. A retirement option's copy runs short at the stated age, or not at all.
  - **What each case holds:**
    - `options` for deliverable 1, or `null` where no section is shown;
    - `overview_options` for deliverable 3;
    - `answer_link`;
    - `what_next.plan` and `what_next.overview` for deliverable 5, with no copies yet;
    - `copy_names` for each option's copy.
  - **Example tables:** `side_by_side` (the option copies) and `side_by_side_with_returns` (the option copies, then "Returns 1% lower" made with "Try a change") for deliverable 6.
  - **Test stubs:** cases `test/plain-results-cap` and `-exact` put a stubbed spending flag on the first example's unchanged run, as `plain-results.test.tsx` does, so their "Keep your plan as it is" line reads that run.

1. **"Ways to make your savings last"** (decision 0023 item 7) on Plan, in place of "What would help".
   - **When it is shown:** for every shown plan, except:
     - a worked-out answer (the result has `solved`), where the plan ends with deliverable 5 only;
     - a retirement that falls after the plan ends.
     
     A copy has none.
   - **Card:** `section.card`, h2 = the heading (focusable with `tabIndex={-1}`), then the intro as help text, then the list (`ol`), then the returns. When focus moves to the heading, it is scrolled into view clear of the sticky headline strip.
   - **Intro:** "Each is one change, worked out by Horizon from your figures. They are options to explore, not advice." For an own-figures plan with ranges: "Each is one change, worked out by Horizon from your figures at the middle of your ranges. They are options to explore, not advice."
   - **Which options, from the shown plan's `sustainable_spending` (S) and `levers`.** The first case that applies:
     1. **Flag `shortfall_with_no_retirement_spending`:** heading "Ways to make your savings last", no list, and one larger line:
        - when the first short year is before the retirement year: "None of the changes Horizon can try fixes this on its own. Savings run short at {age}, before you retire, so a later retirement or lower retirement spending can't reach it.";
        - otherwise: "None of the changes Horizon can try fixes this on its own: savings run short even with no spending in retirement."
     2. **Flag `at_or_above_cap`:** heading "Your savings last. Ways to use the room", then:
        - "Spend more in retirement" — "You could spend at least {cap} a year and savings would still last to {end}." (no control);
        - the retire-earlier item and "Keep your plan as it is", as in case 4.
     3. **`headroom` below 0:** heading "Ways to make your savings last", then:
        - "Spend {sustainable_spending} a year in retirement" — "✓ Savings last to {end}. That's {−headroom} a year less than the {entered} you plan." with "Try this";
        - for each lever of kind `retirement_date`, in the engine's ranking, whose `effect` is above 0 and whose `first_shortfall_age` is `null` or later than the shown plan's: "Retire a year later, at {age}" (or "earlier"). Its line is "✓ Savings last to {end}." / "✓ Savings last to {end}, with {headroom} a year to spare." when `first_shortfall_age` is `null`, else "△ Savings run short later, at {first_shortfall_age} instead of {age now}." Each has "Try this".
        
        A retirement lever that raises spending but makes savings run short sooner is not listed (one 0002-W4 case). The ±10% spending levers are not listed: the spend-to-last option is the exact change.
     4. **Otherwise** (`headroom` 0 or above): heading "Your savings last. Ways to use the room", or "Your plan spends exactly what your savings can carry" when `headroom` is 0. Then:
        - when `headroom` is above 0: "Spend up to {sustainable_spending} a year in retirement" — "Savings would still last to {end}, but only just. That's {headroom} a year more than you plan." with "Try this";
        - when the `retire_earlier` lever has `first_shortfall_age` `null`: "Retire a year earlier, at {age}" — "Savings still last to {end}." / "Savings still last to {end}, with {headroom} a year to spare." with "Try this";
        - "Keep your plan as it is" — "{last year's total_closing_today} would be left at {end}, in today's dollars." when above zero, else "Savings last to {end}." (no control).
   - **{age} for a retirement option** is the copy-name age of 0004-W1: `age_on_december_31` of the year of the lever's date.
   - **Marks:** "✓" (savings last with this change) and "△" (savings still run short, later) are `aria-hidden`, coloured `color-supported-text` and `color-partial-text`. The words after them carry the meaning.
   - **Returns,** under h3 "What you can't choose: investment returns": "If returns were {r}% a year instead of {base}%: savings last to {end}[, with {headroom} a year to spare]." or "…: savings run short at {first_shortfall_age}." Lower first, then higher. Returns are never a "Try this".
   - **Controls.** "Try this" has the accessible name "Try this: {title}". When a copy with the same change already exists, the control is "Open the copy" (accessible name "Open the copy: {title}") and opens Compare on that copy.
   - **"Try this" makes a copy exactly as "Try a change" does today:** engine `scenario` with the option's changes, then `compare` and `sustainable_spending`, keeping the engine's scenario bytes. Then it opens Compare on the new copy.
     - **A retirement option's changes** are the lever's `changes`.
     - **The spend-to-last option's changes** are `[{"path": "/household/spending/after_retirement/cents", "value": sustainable_spending × 100}]`: the engine's whole dollars written as cents (decision 0023 amendment item 2). Its copy id is `spend_to_last`, its name "Spend {S} a year" and its subject "Spending {S} a year in retirement".
     - **On an own-figures what-if,** the copy is of the what-if's input, as "Try a change" is today.
   - **Answer card:** its link "See what would help" becomes "See your options" and moves focus to the section's h2. With no section there is no link; the "What moves it most" sentence stands alone.
2. **"Every change Horizon tried":** today's "What would help" moves unchanged (its chart and table views, ranking and labels) into "Details for experts".
   - It becomes an `expert-section` with h2 "Every change Horizon tried" and the help "One change at a time · {n} changes, ranked", placed after "Year by year".
   - The experts hint becomes "Year by year, every change Horizon tried, the arithmetic and the assumptions · dollars of each year".
   - "What would help" no longer appears on the plain page.
3. **Overview** (0003-W4 deliverable 4, extended).
   - **Options card:** after "Savings by age" in the grid, whenever deliverable 1 shows a section.
     - The same heading as h2, then the first two options with their controls, or the "None of the changes…" line.
     - Then the help line "They are options to explore, not advice." with a "See all options" button, which opens Plan with focus on the section's h2.
     - No intro and no returns on Overview.
   - **"Your plans" card:** deliverable 4, full width after the grid, on every Overview except a copy's.
   - **"What to do next":** deliverable 5.
4. **"Your plans."** h2 "Your plans", then a list of cards in the order made. Each card:
   - **"Your plan":** name, a small savings line, its headline (0003-W2), and "You're looking at it" when Overview or Plan shows your plan;
   - **each copy:** "Copy: {name}", its small savings line and headline once ready ("Calculating…" before), and a "Compare" button (accessible name "Compare {name}") that opens Compare on that copy.
   
   The small savings line is a decorative drawing (`aria-hidden`) of `total_closing_today` by year, with a dotted mark at the first short year; the headline carries the meaning. With no copies the card shows "Copies you try appear here, next to your plan. Your plan stays as it is."
   - **Where:** Overview always (not on a copy); Plan once a copy exists, after "Your money this year".
5. **"What to do next"** on Plan (after "Details for experts", before the actions) and Overview (replacing 0003-W4's list). It is a numbered list, each item a sentence and a control. With no copies, the items equal `what_next.plan` and `what_next.overview`:
   1. **With options** (not a copy): "Try an option. Each opens as a copy; your plan stays as it is." — "See the options". On Plan this moves focus to the section's h2; on Overview it opens Plan with focus there.
   2. **Without options** (worked-out answers, a retirement after the plan ends, and the no-fix case; not a copy): "Try a change. It opens as a copy; your plan stays as it is." — "Try a change".
   3. **Overview only:** "See each year. The chart marks what happens when; choose a year to see its numbers." — "Open the plan".
   4. "Compare your plans side by side." — "Compare {n} plans" (all plans, copies + 1) when copies exist, else the help text "Try an option first." (with options) or "Try a change first.".
   5. "Keep a summary. Print it, save it as a PDF or keep a file Horizon can reopen." — "Get the summary".
   6. **Own figures and their what-ifs only** (not a copy): "Change an answer. Your answers stay on this device." — "Change your answers".
6. **Compare, several copies side by side.** With two or more copies:
   - **h1:** "Your plan and {n} copies, side by side".
   - **Card after the tabs:** h2 "Your plans side by side · {n+1} plans", then a key naming each plan with its line style. Then one chart of `total_closing_today` by age, drawn as wide and compact versions like the other charts:
     - your plan: solid `color-series-baseline`;
     - copies: `color-series-scenario`, the same blue for every copy, told apart by dashed, dotted and dash-dot lines and the key, in the order made. No new colour tokens.
     - **More than three copies:** the chart and its key show your plan and the three most recent copies, oldest of the three first (dashed, dotted, dash-dot). Under the key, a line reads "The chart shows your plan and the 3 most recent copies. Every copy is in the table and the tabs." The table, the tabs and the h1 and h2 counts include every copy.
   - **Figcaption:** "Total savings at the end of each year, in today's dollars. Solid: your plan; dashed, dotted and dash-dot: copies, in the order of the key."
   - **Table** (`ScrollTable`; caption "Your plans side by side", visually hidden):
     - columns "Measure", "Your plan", then each copy's name;
     - rows "Savings", "Most you could spend" (unit "a year"), "Against your planned spending" (unit "a year") and "Left at {end}", with today's Compare helpers (`savingsOutcome`, `spendingValue`, `plannedSpending`, `compareAmount` of the last year's `total_closing_today` in cents);
     - a last row "Details" with "—" for your plan and "Open" (accessible name "Open {name}") for each copy, which selects that copy's tab.
     
     Values equal the file's `side_by_side` tables for the copies they name.
   - **Note:** "Amounts are in today's dollars ({year} dollars). Each copy is one change to your plan."
   - **Then** today's one-copy compare for the selected tab, its headline now an h2 (`compareHeadline`).
   
   With one copy, Compare is unchanged.
7. **Summary.**
   - **Screen:**
     - the "Share a summary" text becomes "A summary of the answer, the options, this year's money, the plans you tried and what's left out. It prints on one page, or two when there is more to show.";
     - the hint of "What's in the summary" becomes "The answer, the options, this year's money, plans you tried, what's left out and answers you weren't sure of", and the section shows the printed summary of deliverable 7.
   - **Printed summary, in this order:**
     - the title and the line under it, as today;
     - the savings drawing (wide), beside the answer;
     - "Answers" as today;
     - deliverable 1's section without controls, when shown, with its intro, options and returns;
     - "Your money this year": its sentence (0003-W4 deliverable 5);
     - "Plans you tried": deliverable 6's table without its Details row, when at least one copy is ready. It replaces the per-copy compare sentences; copies that failed keep their message;
     - the status, "What this result doesn't count" and "Answers you weren't sure of", as today;
     - the closing line "Made with Horizon, open-source retirement planning. These are estimates from the figures shown, not predictions or advice."
   - **Removed:** the help "The summary fits one printed page."
   - **Pages** (decision 0023 amendment item 1):
     - US Letter, the answer and the options on page 1;
     - the options section, each option and the table never split across pages;
     - a second page only when the content does not fit.
     
     The three-copy example fits on one page. An own-figures plan with ranges, three copies and two not-sure answers may take two.
8. **Documentation:** `docs/architecture/web-shell.md` covers the options, the spend-to-last copy, "Your plans", "What to do next", side-by-side Compare and the printed summary. Decision 0023's amendment is already in its record.

## Done when

1. **Text:** every case in the options file renders exactly that text on Plan and Overview, by unit test over the file:
   - the section or its absence;
   - the heading, intro and options;
   - each control's label;
   - the returns;
   - the answer link;
   - both "What to do next" lists.

   Copies go through the copy flow; the four file cases are opened from their household input.
2. **Options act:**
   - "Try this" on every option of the four examples makes the named copy (`copy_names`) and opens Compare on it;
   - a retirement option's copy shows the strip of the 0003-W4 file's matching `copy/…` case;
   - a spend-to-last copy shows "Last to {end}" and "Exactly what you plan to spend in retirement." (0003-W4 deliverable 3), and its options file case `copy/{example}/spend_to_last` has no section;
   - a second press shows "Open the copy";
   - no copy shows an options section or "Try this".
3. **Experts:** "Every change Horizon tried" sits in "Details for experts" with today's chart and table, and "What would help" is gone from the plain page.
4. **Your plans and What to do next** behave as deliverables 4–5, including "Compare {n} plans" after copies.
5. **Side by side:** with the first example's two option copies and its "Returns 1% lower" copy, Compare shows the h1, key, chart, table and note of deliverable 6, and the table equals `side_by_side_with_returns`. "Open" selects the tab.
6. **Print:** a Chromium print to PDF gives one Letter page for the first example with three copies, with the answer and options on page 1. For the own-figures 0002-W5 `v2-range-nothing-solved` plan with three copies, the answer and the options are on page 1. In WebKit, print-media emulation shows the same order.
7. **Plain screens:** no word from the 0003-W3 list, "should", "recommend", "we suggest", "save more" or "dollars of each year" appears in the options, Overview cards, "Your plans", "What to do next", side-by-side Compare or the printed summary. Every options intro contains "options to explore, not advice". The interface computes no financial figure beyond decision 0011's conversions and the whole-dollars-to-cents change of deliverable 1.
8. **Design and browsers:**
   - the screens match design references 29–34 at phone and desktop sizes in light and dark, with the differences named in Read first;
   - the 8 projects (Chromium and WebKit) pass, with axe, keyboard use of every new control (focus moves to the options heading), no horizontal overflow at 375px and no off-origin requests.
9. **Earlier guarantees hold:**
   - engine code, references, goldens and schemas are unchanged;
   - the 0003-W3 sentences and 0003-W4 shell figures still pass, apart from the answer link text named in test 10;
   - 0002-W6 and 0002-W7 behave as before;
   - the Content Security Policy is unchanged;
   - unit tests, typecheck, lint, format, build and license checks pass.
10. **Tests updated:** tests that read the answer card's link ("See what would help"), opened "What would help", counted Overview's "What to do next" items, expected Compare's h1 with several copies, or read the printed summary are updated.
    - **Expected:** `src/plain-results.test.tsx` (the moves-most line no longer ends in "See what would help"), `src/Plan.test.tsx` (levers now in the experts layer), `src/Export.test.tsx`, `src/Compare.test.tsx`, `src/App.test.tsx`, `e2e/plan.spec.ts`, `e2e/plan-layout.spec.ts`, `e2e/compare.spec.ts` and `e2e/export.spec.ts`.
    - **Possibly:** `src/shell-figures.test.tsx` (timing), `e2e/intake.spec.ts` and `e2e/what-if.spec.ts`.

    Each other changed test is named, with its reason, in the implementation record.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0023-*` (with the 2026-10-22 amendment), `0021-*`, `0012-*`, `0017-*`, `0019-*` and `0011-*` (item 5).
- Briefs `0003-W4-plan-layout-and-overview.md`, `0003-W3-plain-results.md`, `0004-W1-compare-screen.md`, `0005-W1-export-screen.md` and `0002-W7-what-if-panel.md`.
- [Design references, version 2](assets/design-v2/README.md), screens 29–34. They are illustrative; where they differ from this brief, the brief wins. Known differences:
  - **Screen 31:** the second and third copies' lines are drawn in green and brown. They use `color-series-scenario` with dotted and dash-dot patterns (deliverable 6); no new colour tokens.
  - **Screens 29, 29e and 30c:** "Open the copy" appears beside options already tried, as deliverable 1 requires.
  - **Screen 32b:** where a page breaks depends on the browser; only "answer and options on page 1" and "nothing split" are required.
  - **Screen 32 (`32-summary-screen.png`):** the "What's in the summary" hint still reads as before; deliverable 7 gives the new hint.
  - **`-phone-light-2` captures of 29 and 29b:** the options heading sits under the sticky strip. When focus moves there it must be clear of the strip (deliverable 1).
  - **None of 29–34 shows 0003-W6 content.** "Your answers" stays as 0003-W4 left it.

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

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions, and the e2e project and test counts. Save these outside the repository:
- screenshots of Plan and Overview with options, a no-fix plan, a worked-out answer, side-by-side Compare, and the printed summary as a PDF for both print cases, in every project;
- the Playwright report.

## Exclusions

- **Engine changes:** none. That leaves out a spend-to-last lever in the engine, combined options (two changes at once), "save more" (needs new savings while working), and today's-dollar yearly income, withdrawals and tax.
- **0003-W6:** the answers beside a live chart and assumptions changed there.
- **Unchanged here:**
  - the one-change panel ("Try a change") and its choices;
  - the copy banner;
  - the headline strip and tiles;
  - the chart-first Plan and year chooser;
  - the opening of the Summary screen and its file export;
  - Compare with one copy.
