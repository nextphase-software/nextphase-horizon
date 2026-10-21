BRIEF VERSION: 0003-W3 v1.2 (2026-10-21)

# 0003-W3 — Plain results: one kind of dollars, plain words, the answer first

## Outcome

The plan, compare and export screens read plainly for a first-time reader. Every amount a person reads is in today's dollars; the dollars of each year and the mechanics sit in one "Details for experts" layer per screen; planner and engine words are gone from the plain screens; the plan opens with one answer and at most two follow-ons; dates are plain and the footer is a full sentence. The separate Check screen goes: a plan from a person's own figures says which of their answers could change it. Every figure is still an engine value (decision 0021).

## Deliverables

Throughout: "plain screen" means everything on the plan, compare and export screens outside "Details for experts"; money uses the 0002-W6 conversion to whole dollars (half up); the base year is the valuation year.

1. **One kind of dollars.**
   - **Plan:** under the answer, "Amounts are in today's dollars ({year} dollars)." "Savings by age" keeps `total_closing_today`, with the caption "Total savings at the end of each year. Solid line: savings by age." and table caption "Savings by age".
   - **Why savings run short** (only with a shortfall, and not when a worked-out answer has no value, flag `unreachable`, whose plan is the search limit; the arithmetic stays in the experts layer), plain: "In {year}, at {age}, your savings run out: {shortfall_today} of that year's spending isn't covered." When that year is before retirement: "In {year}, at {age}, before you retire, your savings run out: {shortfall_today} of that year's spending isn't covered." The year is the first year with a shortfall; nothing is said about later years.
   - **Compare, "Headline differences":** hint "{n} measures · today's dollars"; rows Savings ("run short at N" / "last to N"), "Most you could spend" (a year), "Against your planned spending" (a year: "{$X} short", "{$X} to spare" or "exactly enough"), "Left at {end}". Every difference shows its sign ("+$3,622", "−$197,809"); a zero difference shows "Same". An amount under one dollar shows "less than $1". Note: "Amounts are in today's dollars ({year} dollars). Rows measure different things, so there is no chart here; the savings chart above is the picture. A dash means no single difference is shown."
   - **No dollars of each year and no totals added across years on a plain screen.**
2. **Plain words.**

   | Was | Now |
   | --- | --- |
   | Baseline (compare tabs, chart labels, table headers) | Your plan ("Your plan · retire at 66") |
   | "Compare · {label} · the baseline is protected" | "Compare · {label} · your plan stays as it is" |
   | Spending the plan can carry | Most you could spend |
   | Headroom | Against your planned spending |
   | Levers; "What moves the answer most" | What would help; "One change at a time · {n} changes, ranked" |
   | Change in headroom | "How much more or less you could spend each year after one change"; "▲ {$X} a year more you could spend" / "▼ {$X} a year less you could spend" / "No change" |
   | Investment returns 1 point higher/lower ({r}%) | Returns 1% higher/lower ({r}% a year) |
   | Tax-threshold indexing; From-year | Tax brackets rise; From |
   | "Results are modeled annual amounts, not predictions." | "These are estimates from the figures and starting values shown, not predictions." |
   | What this result does not include; No omissions reported. | What this result doesn't count; Nothing is left out. (compare: "What these results don't count", "Both leave out the same {n} things." / "Both cover your situation.") |
   | "Claiming Social Security later isn't offered: claiming-age rules are not modeled yet." | "Claiming Social Security later isn't shown yet: Horizon doesn't include the rules for claiming age." |

   - **Left-out items in plain sentences**, from the engine's text: state tax not modeled → "State income tax isn't counted."; alternative minimum tax not modeled → "The alternative minimum tax isn't counted."; taxable-account dividends and interest not modeled → "Dividends and interest in a brokerage account aren't taxed each year."; itemized deductions and credits not modeled → "Itemized deductions and tax credits aren't counted."; federal income tax not modeled → "Federal income tax isn't counted."; contributions not modeled → "New savings while you work aren't added."; healthcare not modeled → "Healthcare costs aren't counted separately."; tax funding did not converge → "In some years the tax on withdrawals couldn't be settled exactly."; net investment income tax not modeled → "The 3.8% tax on investment income isn't counted."; still-working distribution exception not modeled → "Required withdrawals aren't delayed while you still work."; early-distribution exceptions not modeled → "Exceptions to the early-withdrawal penalty aren't applied."; Roth early-withdrawal ordering not modeled → "Roth early-withdrawal rules aren't applied." An unknown item shows the engine's text.
   - **What this result doesn't count** shows whenever the engine lists anything left out, under either chip (a complete result can still list items such as state tax).
   - **On a plan from a person's own figures,** the status chip and the left-out list are the head's (0002-W6) only; the plan body shows no second status. The plain sentences above apply to the head's list too (`central.omissions`).
   - **Status:** the chip only ("✓ Covers your situation" / "△ Leaves out N things" / "! Horizon can't plan for this yet"); the old sentence "This result leaves some things out." is removed everywhere.
   - **No plain screen shows** headroom, point, baseline, indexing, omission(s), rough, modeled/modelled, nominal, ledger, fingerprint or a rule-set identifier.
3. **One "Details for experts" layer**, a closed section after the plain content on each screen, opened by keyboard:
   - **Plan** (hint "Year by year, the arithmetic and the assumptions · dollars of each year"): "Year by year" (today's chart and table, relabelled "dollars of each year": "Savings at year end · dollars of each year", "In | Out · dollars of each year", caption "Year by year, dollars of each year", figcaption "Dollars of each year, not today's dollars. Each pair of columns is the money in and out that year; a dashed box is money short. The table lists every amount."); "Why savings run short: the arithmetic" ("After retiring, spending of {entered} a year in today's dollars rises with prices ({inflation}% a year) to {spending} in {year} dollars. That year income brings in {income} and savings supply {withdrawals}, leaving {shortfall} not covered, all in {year} dollars.", with today's before-retirement variant "In {year}, before retiring, spending is {spending} in {year} dollars." and the required-withdrawals sentence "Required withdrawals from age {n} don't add money; they move it out of the tax-deferred account earlier, and it is taxed."); "Assumptions" (today's table, with the wording of deliverable 2) and "Federal tax rules for {year} for one person, with tax brackets rising each year after · Withdrawals come from {order}."
   - **Compare** (hint "Totals across years and every line that differs"): "Totals across all years" (rows "Money short" and "Federal tax", unit "dollars of each year, added up"); "Every line that differs" ("{n} lines differ, in years {a} to {b}; each shows both values and the difference. The Dollars column says which kind each line is.") with a "Dollars" column from each line's own `dollar_basis`: "today's" or "of each year".
   - **Export** (hint "File format, engine, fingerprint and how opening works"): "File details" and "How opening a file works", as today.
4. **No Check screen.**
   - The Check screen, its step, `InputCheck.tsx`, `input-check.ts`, the `input_impact` call from the interface and their tests are removed. Example and opened-file navigation is Plan · Compare · Export. The engine operation and its CLI command stay.
   - **"Answers that could change this"**, on a plan from a person's own figures only, as its own section after the head: for each entry of `bounds.ranked`, in order, "{Name} (a range) could change how much you're short or have to spare by as much as {spread} a year between its low and high ends." followed by "Narrow it"; when something was worked out, the ending is "could change the earliest age by as much as {n} years between its low and high ends." ("1 year" when n is 1; retirement), "could change the savings needed by as much as {$X} between its low and high ends." (savings) or "could change what you could spend by as much as {$X} a year between its low and high ends." (spending); when `spread` is null, "{Name} (a range) could change this a lot: at one end, no {age|amount} works." Then, when the not-sure list is not empty: "You weren't sure of {list}. A closer figure would make the plan more certain." The not-sure list is the saved answers' `not_sure`, leaving out answers a what-if changed and answers already listed as a range ("savings" covers any account balance). Names are the 0002-W6 range names, with "your savings" for `savings`; the list joins with commas and "and". With neither, there is no section.
   - **Opening a plan file that fails a check (v1.2):** the message on the export screen names the failed check in plain words: file format → "This isn't a plan file this version of Horizon can read, so Horizon did not open it."; fingerprint → "This file was changed after it was saved, so Horizon did not open it."; engine version → "This file was made with a different version of Horizon's engine, so Horizon did not open it."; rerun → "Rerunning this plan didn't give the same results as the file, so Horizon did not open it."; not valid JSON → "This file couldn't be read as a plan file." The words "fingerprint" and "JSON" stay inside "Details for experts" ("How opening a file works", "File details").
   - **Export:** "Rough entries" becomes "Answers you weren't sure of", listing the saved answers' `not_sure` names for a person's own figures, and "None were marked as not sure." otherwise; share card "A one-page summary of the answers, what's left out and any answers you weren't sure of."; keep card "Copies you tried are not saved in the file; they are in the summary."; hint "Answers, what's left out, answers you weren't sure of".
5. **The answer first.** The three answer cards are replaced by one card under the headline:
   - **Follow-on**, from `sustainable_spending` (S, `entered` E, `headroom` H): shortfall "To make them last to {end}, spend {S} a year instead of {E}."; room to spare "You could spend up to {S} a year, {H} more than the {E} you plan to spend."; exact "{E} a year is exactly what you could spend for savings to last to {end}."; at the cap "You could spend at least {cap} a year and savings would still last to {end}."; short with no retirement spending "Savings run short even with no spending in retirement." (before retirement: "Savings run short before you retire, so spending less in retirement can't fix this on its own."); retirement after the plan "Your retirement falls after the plan ends, so there is no retirement spending to test."
   - **With ranges** (`bounds` present), the follow-on starts "At the middle of your ranges, " with its first letter lowercased.
   - **With a worked-out answer** (`solved` present), the head already gives the answer, so there is no follow-on.
   - **Then** "What moves it most: {list}." (the 0003-W2 mapping, joined with ", then ") and the link "See what would help"; with an empty list, no line.
   - **Export** uses the same headline and follow-on lines.
6. **Plain dates and the footer.**
   - Dates read "1 January 2026": the export eyebrow "EXPORT · {LABEL} · FIGURES AS OF 1 JANUARY 2026" and the summary "… · figures as of 1 January 2026 · amounts in today's dollars".
   - **Compare "What changed":** "Retire at 67 instead of 66." (each age is the person's age in whole years on that plan's retirement date, counting a 29 February birthday as 28 February in common years, as in brief 0002-W7; this holds when retirement falls after the plan ends; the pay end that follows retirement is not repeated) **(v1.1)**; "Spend {$X} a year in retirement instead of {$Y}."; "Returns of {r}% a year instead of {q}%."; "Pay stops in {year} instead of {year}."
   - **Footer:** "Open source (AGPL-3.0-only) · Your answers stay on this device. Forget my answers · Federal tax rules for {year}, with tax brackets rising each year after · Horizon engine {version}" (version without the `horizon-engine-` prefix).
7. **Expected text.** For every case of [the plain sentences](0003-W3-plain-sentences.json) the screen's text equals the file's: the four example households, the reference comparison, and every 0002-W4, 0002-W5 and 0002-W7 reference case whose result shows a plan.
8. **Documentation:** `DESIGN.md` "Amounts" and "Input completeness" as in decision 0021; `docs/architecture/web-shell.md` (screens, the experts layer, Check removed).

## Done when

1. **Sentences:** every case in the plain sentences renders exactly that text, by unit test over the file. Rules no reference case reaches (spending at the cap, retirement after the plan ends, exactly enough, a spread of 1 year, a null spread, an empty "what moves it most" list) are each covered by a unit test on a built result.
2. **Dollars:** no plain screen of any example or reference case shows "nominal", "dollars of each year" or a total added across years; the reference comparison's every-line list labels 79 of its 550 lines "today's".
3. **Words:** a test scans each plain screen of every example and the reference comparison for the words of deliverable 2 and finds none.
4. **Check removed:** no Check step or screen; the interface makes no `input_impact` call; the engine operation, its CLI command and their tests are unchanged.
5. **Figures unchanged:** every figure shown before this milestone is still an engine value; figures in the dollars of each year appear only inside "Details for experts".
6. **Design and browsers:** the screens match design references 14–18 at phone and desktop sizes in light and dark (with the adjustments named in Read first). The 8 projects (Chromium and WebKit) pass, with axe, keyboard use of every section and the experts layer, no horizontal overflow at 375 px and no off-origin requests.
7. **Earlier guarantees hold:** engine code, references, goldens and schemas unchanged; the 0002-W6 head sentences, 0002-W7 cases and slider starts unchanged; the Content Security Policy unchanged; unit tests, typecheck, lint, format, build and license checks pass.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0021-*`, `0016-*`, `0012-*` (item A6), `0017-*` and `0011-*` with its amendments.
- Briefs `0003-W2-plan-screen.md`, `0004-W1-compare-screen.md`, `0005-W1-export-screen.md`, `0002-W6-intake-screens.md` and `0002-W7-what-if-panel.md`.
- [Design references, version 2](assets/design-v2/README.md), screens 14–18. Illustrative: where they differ from this brief, the brief wins. Known differences: screens 14 and 17 still show "This result leaves some things out." beside the status (removed, deliverable 2); screen 17's follow-on lacks "At the middle of your ranges, " (deliverable 5); screen 16 always shows "None were marked as not sure." (deliverable 4).

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence, then the web shell, with `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions, and the e2e project and test counts. Save screenshots of every screen in every project, and the Playwright report, outside the repository.

## Exclusions

- **Engine changes:** none; no new today's-dollar values.
- **Later years' shortfalls in plain words:** the plain "why" names the first year only.
- **The start screen and the intake questions:** unchanged (0002-W6).
- **The example eyebrow** ("… plans to retire at 66 · retire at 66"): unchanged.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
