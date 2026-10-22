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

## Implementation record

- Brief implemented: **0003-W5 v1.1**.
- Branch: `codex/0003-W5-options-compare-and-summary`.
- Application source revision: `01d9365a563327ac8f3b23987e2ec4d903448ca9`. Rust validation began at this revision. Browser keyboard coverage was subsequently extended in `8ca4b519cd36f3366f33155fcbc0add948943e15`, changing only `e2e/options.spec.ts`; the cumulative web and deploy sequences validate that revision. Rust sources/tests and all application source are byte-identical between these revisions. The implementation record is committed afterward; the final branch tip is reported separately in the handoff.
- New dependencies: **none**. Existing exact versions, license policies, engine code, schemas, references, goldens, tokens and CSP are unchanged. The PDF text reader uses Node’s built-in `node:zlib`.

### Implementation and tests

Options are shared across Plan, Overview and Summary. Their copy controls keep the engine scenario bytes, reuse existing changes, and never derive financial effects. The spend-to-last change converts whole dollars to cents; its comparison uses a dash where no lever effect is supplied. The original lever chart/table now appears in the experts layer. Plan collections use the original baseline even when viewing a copy. Next actions, all-copy comparison, the three-most-recent chart/key rule and the printable summary follow deliverables 1–7.

`src/Options.test.tsx` renders all 80 options-file cases, including every copy through the copy flow and the four file households, and tests every example option, reopening copies, scenario-byte retention, unchanged original results, exact comparison tables, tab selection and the four-copy chart limit. The no-copy next-step references are adjusted only for the copies actually present in the integration flow, as deliverable 5 requires. `src/Export.test.tsx` adds summary order, drawing and control-absence assertions. `src/Plan.test.tsx`, `src/plain-results.test.tsx` and `src/Compare.test.tsx` update the answer link, expert lever access, repeated cap text and retention of the multi-plan card when a selected copy fails. Existing App tests passed without changes.

Browser tests updated: `e2e/plan.spec.ts` (options link and expert section), `e2e/plan-layout.spec.ts` and `e2e/intake.spec.ts` (the action target when next steps repeats Try a change), `e2e/compare.spec.ts` (selected h2, all-copy counts and chart scoping), and `e2e/export.spec.ts` (summary structure/table and content-dependent pagination). Other changed tests: `e2e/shell.spec.ts` and `e2e/what-if.spec.ts`, because the required next-step control repeats the existing Try a change action. New `e2e/options.spec.ts` covers new controls by keyboard, sticky-strip clearance, all example options, plan collections, worked-out/no-fix/ranged plans, comparison and both print cases. Its `e2e/pdf.ts` helper reads embedded Unicode maps to prove the actual PDF page-one text, without adding a package.

### Cumulative validation

All commands below ran freshly against the source/test revisions above, in the AGENTS sequence. Counts are executed harness tests, not cached passes. Toolchain and test tools were already installed at the required versions. Node was recorded before every WebAssembly build/test, including the engine builds inside app build commands; the deploy checks each record it before their three WebAssembly builds. CLI expected nonzero exits are successful validation of their declared statuses.

| Directory | Command | Exit | Seconds | Observed result/counts |
| --- | --- | --- | --- | --- |
| `.` | `rustup show active-toolchain` | 0 | 0.056 | 1.99.1-aarch64-unknown-linux-gnu (rust-toolchain.toml) |
| `.` | `cargo deny --version` | 0 | 0.052 | cargo-deny 0.20.2 |
| `.` | `wasm-bindgen-test-runner --version` | 0 | 0.006 | wasm-bindgen-test-runner 0.2.129 |
| `.` | `cargo test -p horizon-app intake` | 0 | 110.749 | 28 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values_intake` | 0 | 34.543 | 5 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app answers` | 0 | 6.571 | 10 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values_answers` | 0 | 5.718 | 6 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app compare` | 0 | 0.475 | 3 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app immutability` | 0 | 0.153 | 1 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app export` | 0 | 4.984 | 2 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values_w4` | 0 | 0.410 | 1 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-engine tax` | 0 | 4.121 | 2 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values_w3` | 0 | 0.268 | 4 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values_w2` | 0 | 0.165 | 11 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app --test reference_values` | 0 | 0.097 | 7 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-engine ledger` | 0 | 0.067 | 2 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-engine money` | 0 | 0.058 | 2 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-app validation` | 0 | 0.455 | 5 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-parity` | 0 | 57.609 | 18 passed, 0 failed, 0 ignored |
| `.` | `cargo test --workspace` | 0 | 277.156 | 112 passed, 0 failed, 0 ignored |
| `.` | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | 13.538 | passed |
| `.` | `cargo fmt --all --check` | 0 | 0.169 | passed |
| `.` | `cargo test --workspace --release` | 0 | 88.773 | 112 passed, 0 failed, 0 ignored |
| `.` | `cargo build --workspace --release` | 0 | 5.684 | passed |
| `.` | `node --version` | 0 | 0.028 | v24.22.0 |
| `.` | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | 7.625 | passed |
| `.` | `node --version` | 0 | 0.004 | v24.22.0 |
| `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 172.586 | 18 passed, 0 failed, 0 ignored |
| `.` | `node --version` | 0 | 0.002 | v24.22.0 |
| `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 15.306 | 1 passed, 0 failed, 0 ignored |
| `.` | `cargo deny check licenses` | 0 | 0.195 | passed |
| `.` | `node --version` | 0 | 0.003 | v24.22.0 |
| `.` | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 7.555 | 1 passed, 0 failed, 0 ignored |
| `.` | `cargo test -p horizon-wasm` | 0 | 9.162 | 5 passed, 0 failed, 0 ignored |
| `.` | `node --version` | 0 | 0.005 | v24.22.0 |
| `.` | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | 0.107 | passed |
| `apps/web` | `node --version` | 0 | 0.007 | v24.22.0 |
| `apps/web` | `corepack --version` | 0 | 0.062 | 0.36.0 |
| `apps/web` | `corepack pnpm --version` | 0 | 0.066 | 12.9.1 |
| `apps/web` | `corepack pnpm install --frozen-lockfile` | 0 | 0.203 | passed |
| `apps/web` | `node --version` | 0 | 0.002 | v24.22.0 |
| `apps/web` | `corepack pnpm run build:engine` | 0 | 0.419 | passed |
| `apps/web` | `corepack pnpm run types` | 0 | 0.410 | passed |
| `apps/web` | `corepack pnpm run typecheck` | 0 | 3.585 | passed |
| `apps/web` | `corepack pnpm run lint` | 0 | 3.843 | passed |
| `apps/web` | `corepack pnpm run format:check` | 0 | 1.127 | passed |
| `apps/web` | `corepack pnpm test` | 0 | 60.248 | 452 tests, 21 files passed |
| `apps/web` | `node --version` | 0 | 0.002 | v24.22.0 |
| `apps/web` | `corepack pnpm run build` | 0 | 3.376 | passed |
| `apps/web` | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.628 | passed |
| `apps/web` | `node --version` | 0 | 0.004 | v24.22.0 |
| `apps/web` | `corepack pnpm run e2e` | 0 | 2165.433 | 120 passed (36.0m) |
| `apps/web` | `corepack pnpm run licenses` | 0 | 0.681 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `infra/cloud/web` | `node --version` | 0 | 0.004 | v24.22.0 |
| `infra/cloud/web` | `corepack pnpm --version` | 0 | 0.066 | 12.9.1 |
| `infra/cloud/web` | `corepack pnpm install --frozen-lockfile` | 0 | 10.108 | passed |
| `infra/cloud/web` | `corepack pnpm run licenses` | 0 | 0.399 | Deploy tooling license policy passed (35 package versions). |
| `infra/cloud/web` | `corepack pnpm test` | 0 | 0.355 | 12 tests passed |
| `infra/cloud/web` | `corepack pnpm run check` | 0 | 10.630 | 5 responses; all 4 exact headers on each; release, SPA fallback and WASM verified |
| `infra/cloud/web` | `corepack pnpm run check` | 0 | 7.152 | 5 responses; all 4 exact headers on each; release, SPA fallback and WASM verified |
| `.` | `git diff --check` | 0 | 0.021 | passed |
| `.` | `git diff --exit-code 64c0232 -- packages Cargo.toml Cargo.lock apps/web/index.html apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/tokens.css docs/model/schemas 'docs/briefs/*.json'` | 0 | 0.014 | passed |
| `.` | `git diff --exit-code 01d9365 -- packages apps/web/src docs/model/schemas 'docs/briefs/*.json'` | 0 | 0.007 | passed |

Release `intake_v2_timing` (ten runs per case):

```text
v2-working-complete: mean 67.708 ms (10 runs)
v2-solve-spending: mean 156.330 ms (10 runs)
v2-solve-savings: mean 63.850 ms (10 runs)
v2-solve-retirement: mean 100.832 ms (10 runs)
v2-solve-savings-with-range: mean 267.613 ms (10 runs)
```

Isolated WebAssembly levers harness: test result: ok. 1 passed; 0 failed; 0 ignored; 14 filtered out; finished in 5.49s.

Timed release levers after the release build: `cargo run --release -p horizon-cli -- levers answers-working-61`, exit 3 (partial), 0.517 seconds, under two seconds.

### Expanded CLI checks

All 426 invocations had the expected exit and canonical JSON with exactly one trailing newline. The native CLI integration suites compare operation output bytes. Each of the 54 separately extracted intake documents also equaled its committed reference result. Each cell below represents one observed command/document; 0 complete, 3 partial, 4 incomplete, 1 invalid, 2 unsupported, with dev-run retaining 0 for partial. Export status is the embedded run status.

Intake: `cargo run -p horizon-cli -- intake target/0003-W5-intake/<milestone>/<case>.json`, one command per row.

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

Fixture expansion: `cargo run -p horizon-cli -- spend <name>`, `levers <name>`, `impact <name> packages/app/test-data/empty-rough.json`, `run <name>`, `compare A-drawdown <name>`, `export <name>` and `dev-run <name>`. Each operation was run over the entire corpus before the next operation, in the stated sequence.

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

Additional reference pairs, explicit rough input and all current golden/rejection imports:

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

### Browser, print and design evidence

Playwright 1.63.0 ran 120 tests in 8 projects. Report stats: {"duration": 2159393.825, "expected": 120, "flaky": 0, "skipped": 0, "startTime": "2026-10-22T13:32:40.670Z", "unexpected": 0}.

| Project | Passed |
| --- | --- |
| `chromium-1280-dark` | 15 |
| `chromium-1280-light` | 15 |
| `chromium-375-dark` | 15 |
| `chromium-375-light` | 15 |
| `webkit-1280-dark` | 15 |
| `webkit-1280-light` | 15 |
| `webkit-375-dark` | 15 |
| `webkit-375-light` | 15 |

Actual browser-version annotations: chromium 153.0.8010.12, webkit 26.6.

Saved outside the repository: 1992 original full-page PNGs, 20 original PDFs (plus report attachment copies), and the Playwright HTML/JSON report. Every project captured Plan and Overview with options, no-fix and worked-out plans, own ranges, copy plans, side-by-side Compare, Summary and Your answers. Both required print cases have a Letter PDF in every project. Chromium checks pagination and embedded PDF text directly. WebKit checks print-media order and break rules; its rendered DOM is printed by Chromium because WebKit has no PDF API, explicitly identified by the PDF-renderer annotation. The first three-copy example is one page; both cases put the answer and full options on page one.

Checked against references 29–34, at 375×812 and 1280×800 in light/dark, with existing 320px checks retained. The brief controls the differences: all copies use the scenario blue with line patterns; existing option copies say Open the copy; Summary has the new hint; focused options clear the sticky strip; the over-three-copy chart/key uses only the most recent three while counts/table/tabs include all. The real chart/table data and responsive control stacking are retained. The summary drawing uses the existing baseline token, as DESIGN.md requires, rather than the illustrative blue in screen 32. Axe, keyboard traversal, exact text, page overflow and off-origin checks passed in the browser suite. No 0003-W6 content was added.

Required Letter PDFs, observed page counts:

| Project | Example, three copies | Own ranges, three copies, two not-sure answers |
| --- | --- | --- |
| `chromium-1280-dark` | 1 | 2 |
| `chromium-1280-light` | 1 | 2 |
| `chromium-375-dark` | 1 | 2 |
| `chromium-375-light` | 1 | 2 |
| `webkit-1280-dark` | 1 | 2 |
| `webkit-1280-light` | 1 | 2 |
| `webkit-375-dark` | 1 | 2 |
| `webkit-375-light` | 1 | 2 |

Additional PDF artifact inspection from `apps/web`, with `HORIZON_EVIDENCE_DIR` set to the external evidence directory: `node --input-type=module` with the source below on stdin. Node v24.22.0, exit 0: 16 PDFs, complete answers/options on page one in all 16, and all 16 plans tables on a single page.

```js
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pdfPages } from './e2e/pdf.ts';
const root = join(process.env.HORIZON_EVIDENCE_DIR, 'screenshots');
const options = JSON.parse(readFileSync('../../docs/briefs/0003-W5-options.json')).cases;
const sentences = JSON.parse(readFileSync('../../docs/briefs/0003-W3-plain-sentences.json')).cases;
const files = readdirSync(root, { recursive: true }).filter(file =>
  !file.includes('/attachments/') && /(?:example|own-ranges)-three-copies-letter\.pdf$/.test(file));
assert.equal(files.length, 16);
for (const file of files) {
  const range = file.includes('own-ranges-three-copies-letter.pdf');
  const key = range ? '0002-W5/v2-range-nothing-solved' : 'example/answers-working-61';
  const pages = pdfPages(readFileSync(join(root, file)));
  if (range) assert.ok([1, 2].includes(pages.length)); else assert.equal(pages.length, 1);
  const expected = options[key].options;
  for (const text of [range ? 'Savings last to somewhere between 84 and 95.' : sentences[key].headline, sentences[key].follow_on, sentences[key].moves_most, expected.heading, expected.intro,
    ...expected.items.flatMap(item => [item.title, item.effect]), ...expected.returns])
    assert.ok(pages[0].includes(text), `${file}: missing first-page text: ${text}`);
  const tablePage = pages.find(page => page.includes('Plans you tried'));
  assert.ok(tablePage, `${file}: missing plans table`);
  for (const text of ['Measure', 'Savings', 'Most you could spend',
    'Against your planned spending', 'Left at 95',
    ...options['example/answers-working-61'].side_by_side_with_returns.columns])
    assert.ok(tablePage.includes(text), `${file}: table split or missing: ${text}`);
  console.log(`${file.split('/')[0]}: ${range ? 'ranges' : 'example'} ${pages.length} page(s); complete options on page 1; table together`);
}
console.log('16 PDFs checked; 16 complete first-page options; 16 unsplit plans tables; exit 0');
```

### Deploy reproducibility

Both clean-checkout deploy checks exited 0. The first staging tree was preserved outside the repository before the second run. Full relative file lists and every byte matched: 12 files, 1761236 bytes, comparison exit 0. Both releases identify `8ca4b519cd36f3366f33155fcbc0add948943e15`. Each dry-run/local check verified five responses, all four exact headers on each, release commit, navigation fallback and application/wasm. No login, real deploy or push occurred.

### Preliminary checks and exclusions

Exploratory validation during implementation is recorded separately from the cumulative passes. Initial typechecking identified missing generated artifacts, an import name and an ES2022 test-method mismatch; these were fixed. Early unit runs exposed old link/expert expectations and the new multi-plan failure card; subsequent runs passed 451 tests, then 116 focused tests after the summary regression addition. The options/reference-focused run passed 155 tests. The first phone browser run had 9 passed/6 failed (old selectors and inherited summary card spacing); the next had 14 passed/1 failed (a remaining expert-help selector). A two-browser focused run had 3 passed/1 failed because the test reloaded Welcome while WebKit was still initializing its worker; the fixture loader now reuses the already loaded page. The final preliminary options/PDF run passed both Chromium and WebKit. The cumulative commands above are fresh results for the revisions identified above and supersede all preliminary runs. One exploratory Prettier invocation also named a nonexistent app docs directory and exited 2; formatting the actual changed files succeeded, and the cumulative format check passed.

Exclusions are exactly the brief: engine changes; an engine spend-to-last lever; combined options; new savings while working; yearly income, withdrawals and tax in today’s dollars; and 0003-W6 answers/live-chart work. The one-change panel and its choices, copy banner, headline strip/tiles, chart-first Plan/year chooser, Summary opening/file export and one-copy comparison behavior remain as specified. No required validation command, browser project or requested evidence category was excluded. A different reviewer must evaluate the change; the implementer did not perform independent review.

### Review round 1 fixes

Branch: `codex/0003-W5-options-compare-and-summary`. New validated test-fix tip: `7eeaef7a60f5aaa6f05de0cbabb5df9a17a4a44f`. All final validation below ran against that source/test revision; this record is committed afterward, with the final branch tip reported separately in the handoff.

F1: the own-figures browser flow now places focus at the options heading after returning from the first copy. This avoids blurring an unchanged what-if number, which clears copies under the existing behavior. The test includes a short comment explaining that behavior. Every existing keyboard assertion remains. Before printing, it asserts the Compare heading is "Your plan and 3 copies, side by side" and the visible "Plans you tried" table has exactly Measure, Your plan, Spend $64,994 a year, Retire at 67 and Returns at 4% columns. Application code is unchanged.

Final web commands ran from `apps/web/`, with the evidence environment variable directed outside the checkout. The two evidence-inspection commands ran from the workspace root; their scripts also live outside the checkout.

| Command | Exit | Observed result |
| --- | --- | --- |
| `corepack pnpm run typecheck` | 0 | TypeScript check passed. |
| `corepack pnpm run lint` | 0 | ESLint passed. |
| `corepack pnpm run format:check` | 0 | All matched files passed Prettier. |
| `corepack pnpm test` | 0 | 452 tests passed in 21 files; harness duration 47.95 seconds. |
| `node --version` | 0 | `v24.22.0`, recorded immediately before the following build's WebAssembly command. |
| `corepack pnpm run build` | 0 | WebAssembly release build, schema generation, TypeScript and Vite passed; 59 modules transformed. |
| `corepack pnpm run e2e --workers=1` | 0 | 120 passed, 0 failed, 0 skipped, 0 flaky; 49.6 minutes. All 8 projects ran 15 tests each. |
| `node "$HORIZON_EVIDENCE_DIR/inspect-pdfs.mjs"` | 0 | All 8 own-figures PDFs checked: 2 Letter pages each, Your plan plus exactly 3 named copy columns, complete plans table on one page. |
| `python3 "$HORIZON_EVIDENCE_DIR/summarize-results.py"` | 0 | Report audit confirmed 120 passes across 8 projects, 1992 primary PNGs, 20 primary PDFs and the HTML report. |

The eight passing projects were `chromium-375-light`, `chromium-375-dark`, `chromium-1280-light`, `chromium-1280-dark`, `webkit-375-light`, `webkit-375-dark`, `webkit-1280-light` and `webkit-1280-dark`. Actual browser-version annotations recorded Chromium `153.0.8010.12` and WebKit `26.6`. WebKit's four own-figures PDFs use the unchanged WebKit print-media DOM capture and Chromium PDF renderer; its renderer annotation records Chromium `153.0.8010.12`.

PDF inspection decoded the actual PDF text using the committed `e2e/pdf.ts` helper. Each plans table contains the consecutive headers Measure, Your plan, Spend $64,994 a year, Retire at 67 and Returns at 4%, immediately followed by the Savings row. All four measure rows stay with those headers. The options remain on page 1. Fresh screenshots, PDFs, report, command logs and inspection results are retained outside the checkout; the own-figures evidence now includes all three copies.

Preliminary commands and failures are retained separately. `corepack pnpm exec prettier --check e2e/options.spec.ts` exited 0 for the changed file. Before the visible-table selector correction, the six pre-browser commands listed above also each exited 0 (452 unit tests in 21 files; 59 build modules; Node `v24.22.0` before WebAssembly). `corepack pnpm exec playwright test e2e/options.spec.ts --project=chromium-375-light --project=webkit-375-light` exited 1: 0 passed, 2 failed, because the new table selector included both the visible summary and its hidden print duplicate. Scoping it to the visible table fixed that assertion. The initial default `corepack pnpm run e2e` attempt encountered the existing five-second own-figures readiness timeout while the page still showed "Calculating…". That attempt was stopped and exited 130: 14 passed, 1 failed, 3 interrupted, 102 did not run. The complete single-worker run above then passed every case without changing application code, assertions or timeouts.

No dependencies were added. Validation scope follows the test-only review request: the cumulative Rust, CLI, license and deploy sequences were not repeated; their earlier implementation results remain recorded above. No requested web command, browser project or PDF inspection was excluded. No push occurred.
