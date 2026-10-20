BRIEF VERSION: 0002-W6 v1.1 (2026-10-20)

# 0002-W6 — Intake screens: your own figures, in your own words

## Outcome

A person starts Horizon with their own figures by answering plain questions, one at a time or in one of two other styles. Any amount can be a single figure, a range, or "not sure". Any question can be left for later, and nothing blocks the person from seeing a plan. Their answers are kept on their device until they choose to forget them. The results open with a plain headline from the engine:
- a plan;
- a worked-out savings, spending or retirement age when one of those was left for later;
- a range when answers are ranges;
- or what is still needed.

The status words of decision 0016 replace "Supported" and "Partial" everywhere. Example households still open directly. Today's guided household setup is removed. The browser tests run in Chromium and WebKit only.

## Deliverables

1. **Welcome screen** (design reference 1), replacing today's start screen:
   - **Text:** a heading, "See whether your savings can carry your retirement"; a paragraph on what Horizon does; and "It takes about 10 minutes. Rough figures are fine; you can mark anything you're unsure of, give a range, or add it later."
   - **Buttons:** **Start with my own figures** and **Try an example household**.
   - **Question choice:** "What would you like to find out?", with the same three choices as today. The claiming question stays disabled.
   - **Saved answers:** decision 0018's notice and **Forget my answers**. When saved own answers exist, the first button reads **Continue with my answers**.
   - **Try an example household** shows today's five sample households as a choice and opens the chosen one directly on the plan screen, exactly as today's start screen does. Its label changes from "Sample household — invented data" to "Example household — invented figures" (decision 0016 item 4).
   - Every way to open a plan file that exists today stays.
2. **The questions,** in this order. Each has its heading, its "why" line, and a control, and maps to `answers.v2` (brief 0002-W5) as stated. "Hidden" means not asked, and the field is omitted.

   | # | Heading | Why line | Control | Maps to |
   | --- | --- | --- | --- | --- |
   | 1 | Are you planning alone or with a partner? | Horizon plans for one person for now. | Just me · With a partner. A partner shows: "Horizon can plan for one person only so far. You can carry on for yourself; the result will not include your partner." | `planning` `alone` · `partner` |
   | 2 | When were you born? | Your age decides when income starts and when withdrawals become required. | Month (by name) · Day · Year (no native date picker); **I'd rather give my age** (a whole number); **I'll add this later** | `birth_date` `{date}` · `{age}` · `{later}` |
   | 3 | Have you already retired? | It changes which questions follow. | Not yet · Yes, I have | `retired` |
   | 4 | At what age do you plan to retire? (hidden when retired) | Most results turn on this. You can try other ages later. | An age; **I know the date instead** (Month · Day · Year); **I'll add this later** | `retirement` `{age}` · `{date}` · `{later}` |
   | 5 | How long should the plan last? | Running short late in life is the main risk, so the plan runs to 95 unless you choose otherwise. | An age field, empty, with "95" as its placeholder | `plan_end_age` when typed; omitted when empty |
   | 6 | What do you earn now, before tax? (hidden when retired) | Your pay covers your spending until you retire. Note: "Horizon does not yet count money you add to your savings from your pay." | Money | `pay` |
   | 7 | Will you keep working until you retire? (hidden when retired) | Your pay stops when your work does. | Yes · No, my work ends earlier (then Month · Day · Year) | `pay_ends` `{at_retirement: true}` · `{date}` |
   | 8 | Do you expect Social Security? | For most people it is the largest income in retirement. | Yes · No · Not sure | `social_security.expects` |
   | 9 | At what age do you plan to start it? (hidden for "No") | The amount depends on when you start. Tip: "Not sure? Start with 67. You can try other ages later." | An age field, empty, with "67" as its placeholder | `social_security.start_age` when typed; omitted when empty |
   | 10 | About how much will you get, in today's money? (hidden for "No") | Use the amount for the age you just gave. Tip: "Your estimate is on your Social Security statement at ssa.gov. Horizon cannot estimate it for you yet; a best guess is fine for now." | Money | `social_security.amount` |
   | 11 | Will you get a pension? | It is income you can count on. | No · Yes | `pension.expects` |
   | 12 | About how much a year, and from what age? (only for "Yes") | — | Money; a start age; "Does it rise with prices?" Yes · No, it stays the same · Not sure | `pension.amount`, `start_age`, `rises_with_prices` |
   | 13 | Where do you keep your savings? | Add each account. The kind matters because each is taxed differently. | One account at a time: the kind (Bank or cash savings · Regular investment (brokerage) account · Workplace plan, such as a 401(k) or 403(b) · Traditional IRA · Roth IRA or Roth 401(k)), its balance (money, no per), and for a brokerage account "About how much of that did you put in yourself?" (optional; note: "Horizon does not yet count dividends and interest inside a brokerage account."). **Add this account**; a typed account not yet added is kept on Continue; **I don't have any savings yet** | `savings.accounts` (`cash`, `taxable`, `employer_plan`, `traditional_ira`, `roth`; `cost_basis` when given) · `{none}` · `{later}` |
   | 14 | About how much do you spend now, including everything? (hidden when retired) | Your pay covers it until you retire. | Money | `spending_now` |
   | 15 | How much do you expect to spend once you retire, in today's money? | This is what your savings and income must pay for. | Money; **About the same as now** (not shown when retired) | `spending_in_retirement` money · `{same_as_now}` |

   - **Always set:** `format` `"horizon-answers"` and `version` 2.
   - **`valuation_date`:** the person's local date when they first choose **Start with my own figures**. It is kept with the answers, and the review page shows it as "Figures are as of <day month year>".
   - **`assumptions`:** always present: an object with only the rates the person changed on the review page, empty when none.
   - **Money answers** always carry `per`. Questions hidden for a retired person (4, 6, 7, 14) are omitted from the document. **(v1.1)**
   - **`not_sure`:** always present, empty when none: the names of the answers marked "not sure", in question order: `pay`, `spending_now`, `social_security`, `pension`, `savings`, `spending_in_retirement`.
3. **Answer controls:**
   - **Money:** accepts `85000`, `85,000`, `$85,000`, `85k` and `1.2m`. The typed text is converted to whole cents exactly as text: no floating point, at most two decimal places after any suffix, and no minus sign. A **a year · a month** switch sets `per`. The echo under the field repeats the entry in its own unit ("$5,000 a month."), and the screen never converts a month to a year.
   - **I'm not sure of this:** shown on questions 6, 10, 12, 13, 14 and 15. With an amount, it keeps the amount and adds the answer to `not_sure`. With no amount, the answer is `{later}`, and a tip says the person can come back to it. Ticking it always lets the person continue.
   - **Not sure? Give a range instead** (money questions), and **Not sure how much? Give a range** (a balance): "Somewhere between $__ and $__", in the same unit. The echo reads "$80,000 to $90,000 a year. Your results will show how much this range could change your plan." A range with its higher amount first blocks Continue with "Put the lower amount first, then the higher one." **Give one figure instead** goes back.
   - **I'll add this later:** on questions 2 and 4 the answer becomes `{later}`.
   - **Dates:** a date must exist. A birth date must give an age from 18 to 110, as must a typed age. A retirement date or work end date must be after the valuation date.
   - **Continue:** when Continue is switched off, it looks faded and one line under it says why. Every question's reason is in design references 2 and 5. "Not sure" and "add later" always switch it on.
4. **Three styles and the switcher** (design references 2–4):
   - **A, one question at a time:** section names with "n of m" and a thin progress bar; Back and Continue.
   - **B, conversation:** each question and its answer stay in a thread, with **Change** beside each answer and a "So far" panel on wide screens.
   - **C, guided page:** a section list, with finished sections folded to one line with **Change**.

   Everyone starts in A. **Answer in a different style** on every question switches style and keeps every answer and the current question. The sections are About you (1–5), Income (6–12), Savings (13) and Spending (14–15).
5. **Answers kept on the device:** exactly decision 0018, items 1–9.
   - **Saved item:** the `answers` field is the `answers.v2` document above. `style` is `one_question`, `conversation` or `guided_page`. `place` is the question number as text ("1"–"15"), or "review" or "results".
   - **On load:** the item is validated through `plan_from_answers`, as 0018 item 5 says.
   - **Footer:** "Open source (AGPL-3.0-only) · Your answers stay on this device." with **Forget my answers**, followed by the model and tax-law note as today.
6. **Review page** (design reference 6):
   - **Header:** "Here's what you told us", then "Figures are as of …" and 0018's notice.
   - **Still to add:** shown when any answer is `{later}`. It lists them with **Add now** and says "You can see your plan now. Horizon will say what it could work out without these, and what each would add."
   - **Answers:** each section lists every answer in plain words with **Change**, ranges as "$70,000 to $90,000 a year", and a "not sure" tag where marked.
   - **Answers you're not sure of:** listed in a card of that name.
   - **What Horizon assumes:** "Prices rise 2.5% a year", "Investments grow 5% a year; cash earns 2%" and "Federal tax thresholds rise 2.5% a year", with **Change these**. A changed rate is typed as a percent with up to two decimals, from 0 to 20, and stored as a decimal string by moving the decimal point two places in the text, with no trailing zeros (2.75 → "0.0275", 2.5 → "0.025", 0 → "0").
   - **What Horizon doesn't count yet:** state income tax; money you add to your savings from now on; dividends and interest inside a brokerage account; itemized deductions and tax credits; the alternative minimum tax; and "your partner" when planning with one.
   - **See my plan** is never switched off.
7. **The results head** (design references 7–11). "See my plan" sends the answers to `plan_from_answers` through the worker; while it works, the head says "Working out your plan…". Everything in the head comes from the result; the interface never computes a figure:
   - **Headline (`h1`)** and the lines under it, by the result:
     - `incomplete`: needed is `birth_date` → "We need your age first."; needed is `retirement` alone → "We need to know when you plan to retire." with "Or tell us your pay, and Horizon works out the earliest age you could retire."; otherwise "Horizon can work out one of these for you." with "Give any of these, and Horizon works out the last one:". Then the list: "Your date of birth, or just your age", "When you plan to retire", "Your savings", "Your spending in retirement", each with **Add now**.
     - `unsupported`: "Horizon can't plan for this yet." with "! Horizon can't plan for this yet. Horizon plans for one person so far, and you're planning with a partner."
     - `invalid`: "Something in your answers needs another look." with **Back to my answers**. (The controls above prevent every invalid answer they can.)
     - `solved` spending: "You could spend up to $X a year in retirement." and "Your savings would then last to E, the end of the plan."; flag `at_or_above_cap` → "You could spend at least $10,000,000 a year in retirement."; flag `shortfall_with_no_retirement_spending` → "Your savings run short before you retire, at A, even with no spending in retirement." (A is the central first shortfall age).
     - `solved` savings: "You'd need about $X saved to retire at R." (R is the answered retirement age; no "to retire at" when retired or when retirement was given as a date) and "With spending of $S a year in retirement, that would last to E."; `none_needed` → "You don't need savings for this plan: your income covers your spending to E."; `unreachable` → "No amount of savings up to $100,000,000 would last to E with this spending."
     - `solved` retirement: "The earliest you could retire is R." and "With spending of $S a year in retirement, your savings would last to E."; `unreachable` → "Your savings wouldn't last to E at any retirement age before E."
     - Any `solved`: the tag "Worked out for you"; with `bounds` and `ordered`, "Given your ranges, somewhere between L and H." (L and H the two bound values in increasing order; when one bound is null, "Given your ranges, from L; at the other end, none works."); with `bounds` not ordered, "Your ranges pull this in different directions, so Horizon shows the middle of each range."
     - Nothing solved, with `bounds` ordered: worse bound lasts → "Your savings last to E, the end of the plan, at both ends of your ranges."; better bound lasts → "Savings last to somewhere between W and E."; both short at the same age → "Savings run short at W at both ends of your ranges."; otherwise "Savings run short somewhere between W and B." (W and B the bounds' first shortfall ages). Not ordered: today's plan headline for the central run, then "Your ranges pull the result in different directions, so this uses the middle of each range."
     - Nothing solved, no bounds: today's plan headline (`plan-display.ts`) for the central run.

     In these, $X, $S are the engine's cents shown as whole dollars with today's money formatter; E is the plan end age from the household input; S is its spending in retirement.
   - **Status statement** (decision 0016): `complete` → "✓ Covers your situation", with "What Horizon doesn't count" listing the central omissions when there are any; `partial` → "△ Leaves out N things", N being the central omissions plus the left-out answers, with "What this result leaves out" listing the left-out answers' texts and then the omissions.
   - **One line per left-out answer:** "This plan doesn't include your Social Security yet, so it is likely too pessimistic." (`social_security`), likewise "your pension", "your pay before you retire" and "your spending before you retire" ("so it may be too optimistic" for `too_optimistic`); `pay_and_spending_now` → "This plan doesn't include your pay or spending before you retire yet; it assumes your pay covers your spending until you retire." Each has **Add it for a better result**.
   - **Why this is a range** (when `bounds`): "Some of your answers are ranges: A and B." and "Narrowing A would narrow the result most. **Narrow it**", in the engine's `ranked` order, with the names "your pay", "your spending now", "your spending in retirement", "your Social Security", "your pension" and "the balance of your <kind> account" (bank or cash, brokerage, workplace plan, traditional IRA, Roth).
   - **Starting values Horizon used,** one item per `starting_values` entry, each with **Change**: "The plan runs to age N."; "Social Security starts at N."; "Your pension is taken as staying the same, not rising with prices, so the plan is likely too pessimistic."; "For your brokerage account, Horizon counts no gain to tax when you sell, so the plan may be too optimistic."; "Your birthday is counted as <day month>."; "Your savings are counted as a brokerage account with no gain to tax, so the plan may be too optimistic."; and one line for the rates listed, in the order prices, investments, cash, tax thresholds ("Prices rise 2.5% a year; investments grow 5% a year; cash earns 2%; tax thresholds rise 2.5% a year."), each rate shown as a percent by moving the decimal point in the engine's string.

   The exact text for every version 2 reference case is in [the head sentences](0002-W6-head-sentences.json), derived by script from the engine's results; a test renders each and compares the text.
8. **Below the head, and around it:**
   - **When the result has a household input:** today's plan screen follows the head unchanged, from "Can you retire at …?" onwards, run on that household input. Compare and export work on it as today. The old status card ("This result leaves some things out…") is replaced by the head.
   - **Back to my answers** returns to the review page. For an example household, the plan screen is today's, with the new label and status words.
   - **Step bar:** for own figures, "Your answers · Plan · Compare · Export"; for examples, today's steps from Check onwards.
   - **Input check:** stays for example households, unchanged.
9. **Status words everywhere** (decision 0016 items 2 and 7): wherever a status shows (plan, compare, export, a reopened file), `complete` reads "Covers your situation" and `partial` reads "Leaves out N things". The icons, colours and token names stay. "Supported" no longer appears on screen.
10. **Engine access:**
    - **Worker protocol:** add `plan_from_answers(answers)` to the worker protocol (`protocol.ts`, its dispatch and its test), calling the `horizon-wasm` export.
    - **Types:** generate types for `answers.v2` and `answers-plan.v2` with `corepack pnpm run types`.
    - **Stale reply:** a reply that is no longer current is ignored, as today.
11. **Removed:** the start screen and the guided household setup screen (`GuidedSetup.tsx`), with their tests. Code the input check still needs stays.
12. **Browser tests** (decision 0011, amendment of 2026-10-20):
    - **Config:** `playwright.config.ts` runs Chromium and WebKit only, at 375 × 812 and 1280 × 800, in light and dark: 8 projects. `playwright install` installs `chromium webkit`.
    - **A new intake spec covers, in every project:**
      - each style, and switching styles with answers and place kept;
      - a range, "not sure" with and without an amount, and "add later";
      - the saved item: exactly `horizon.intake.v1`, equal to the answers entered; a reload resumes in the same style and place; Forget leaves storage empty; a corrupt item is deleted with the notice; an example stores nothing;
      - the results head for at least these cases: a plan, each worked-out answer, two needed, a range, and partner;
      - keyboard-only completion, axe with no violations, no horizontal overflow at 375 px, and no off-origin requests.
    - **Existing specs:** shell, plan, compare and export reach the examples through **Try an example household** and expect the new label and status words. Their other exact references are unchanged.
    - **Storage trap:** stays in every spec, now allowing only `horizon.intake.v1`, and only after own figures are entered.
13. **Documentation:**
    - **`docs/architecture/web-shell.md`:**
      - the intake, the storage item and its rules, and the nine engine exports;
      - remove the stale "There are no charts";
      - the browsers.
    - **`AGENTS.md` and `README.md`:** the web shell section names Chromium and WebKit and 8 projects.
    - **`docs/model/dependencies.md`:** stays accurate. No new dependency is expected; any new package needs escalation.

## Done when

1. **Flow:** a person can go from the welcome screen through every question in each style, to the review page and the results, by keyboard alone, with any answer left for later, and "See my plan" never switched off.
2. **Answers and head text:** for each of the 24 version 2 reference cases of brief 0002-W5, the results head rendered from its `result` shows the text in [the head sentences](0002-W6-head-sentences.json) exactly. For the 20 of them the questions can produce (all but the three with `what_if` and `v2-age-too-young`, which the controls prevent), a unit test builds the `answers` document from the corresponding control state, with that case's `valuation_date`, and **(v1.1)** `plan_from_answers` on it returns a result byte-identical to that case's `result`. The documents themselves may differ only where the engine treats both forms alike, for example an explicit `"per": "year"` or `"pay_ends": {"at_retirement": true}`.
3. **No interface arithmetic:** every figure in the head comes from the result; the only conversions are text-to-cents parsing of typed money, cents to whole dollars for display, and moving a decimal point for rates.
4. **Device storage:** decision 0018 items 1–9 hold, each with an end-to-end check.
5. **Examples:** each of the five examples opens on the plan screen as today, with the new label and status words, and every earlier plan, compare and export reference still matches apart from those words.
6. **Design:** the screens match design references 1–11 in layout and wording, at phone and desktop sizes and in light and dark, apart from the brief's own differences; any other difference is reported.
7. **Browsers:** 8 projects (Chromium and WebKit) pass; Firefox is not installed or run.
8. **Earlier guarantees hold:** every engine test, reference file, golden and schema is unchanged; the Content Security Policy is unchanged; the web unit tests, typecheck, lint, format, build and license checks pass.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0011-*` (with its amendments), `0016-*`, `0017-*`, `0018-*` and `0019-*`.
- Briefs `0002-W4-answers-to-plan.md` and `0002-W5-reverse-answers.md`, and their reference values.
- [Design references, version 2](assets/design-v2/README.md). Illustrative and not to ship: the figures shown are for the example household's answers; screens 3 and 4 show that household's answers as typed figures.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence, then the web shell, including `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects. Record:
- `node --version` and `corepack pnpm --version`;
- the Playwright browser versions from the e2e annotations;
- the e2e project and test counts.

Save screenshots of every screen in every project, and the Playwright report, outside the repository.

## Exclusions

- **The what-if panel** on the results: brief 0002-W7.
- **"Show all questions on one page":** not drawn; a later brief.
- **Plain words beyond status** on the plan, compare and export screens (amounts, planner terms, details layer): a later brief.
- **The input check for own figures:** ranges and "not sure" replace it; folding it into the plan is a later brief.
- **Firefox:** not tested (decision 0011 amendment).

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
