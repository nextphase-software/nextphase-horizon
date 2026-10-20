BRIEF VERSION: 0002-W6 v1.2 (2026-10-20)

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
     - Nothing solved, no bounds: today's plan headline (`planHeadline` in `plan-display.ts`) for the central run, word for word ("Savings last to 95.", "two years"). **(v1.2:** the head sentences now use it too.**)**

     In these, $X, $S are the engine's cents shown as whole dollars with today's `centsDollars` (half away from zero); E is the plan end age from the household input; S is its spending in retirement.
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

### Implementation record — 0002-W6 v1.2 (2026-10-20)

- Branch: `codex/0002-W6-intake-screens`, rebased onto main `0420fe1`.
- Source/test revisions: native validation began at `c4fd90e8b28618378d8521a862c2b12877f8fe25`; the first full web pass ran against `41a34d6747e6a44851ea9cf7b27ed4d75620427e`; the refreshed web pass ran against `dbe3803ac6794e48227fc04ed44a26b1f3a6a3e9`. Subsequent changes are confined to the front end and browser harness. Every Rust source/test file is identical between those revisions. This record is committed after validation; its own commit is not named here.
- Implemented Welcome, fifteen questions in three styles, exact money/rate parsing, review, one-item device storage, worker intake dispatch, all results-head variants, and returned-input plan/compare/export. Removed Start and GuidedSetup. Status words changed throughout the retained result flows. No dependency, engine, schema, golden, reference file, CSP, model/tax version, server route or hosted authorization surface changed. Every typed figure, fixture and screenshot is synthetic.
- Tools: Rust/cargo 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129, Node v24.22.0, corepack 0.36.0, pnpm 12.9.1. The installed Node executable directory was already selected. Node was recorded before each WebAssembly command, including web engine builds. WebAssembly uses `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`, with `WASM_BINDGEN_TEST_TIMEOUT=600`.
- New dependencies: none. Existing dependency versions, licenses, lockfiles and license policy are unchanged.

#### Cumulative Rust and web validation

Commands ran in the AGENTS order. Counts sum executed harnesses; filtered tests are not passes. Web commands run from `apps/web`; all other commands run from the workspace root. All Node version commands printed `v24.22.0`.

| Phase | Command | Exit | Passed | Failed | Ignored | Filtered | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cumulative | `rustc --version` | 0 | — | — | — | — | 0.028 |
| Cumulative | `cargo --version` | 0 | — | — | — | — | 0.02 |
| Cumulative | `cargo deny --version` | 0 | — | — | — | — | 0.022 |
| Cumulative | `wasm-bindgen-test-runner --version` | 0 | — | — | — | — | 0.002 |
| Cumulative | `cargo test -p horizon-app intake` | 0 | 28 | 0 | 0 | 42 | 45.859 |
| Cumulative | `cargo test -p horizon-app --test reference_values_intake` | 0 | 5 | 0 | 0 | 0 | 35.722 |
| Cumulative | `cargo test -p horizon-app answers` | 0 | 10 | 0 | 0 | 60 | 6.233 |
| Cumulative | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 | 0 | 0 | 0 | 5.606 |
| Cumulative | `cargo test -p horizon-app compare` | 0 | 3 | 0 | 0 | 67 | 0.535 |
| Cumulative | `cargo test -p horizon-app immutability` | 0 | 1 | 0 | 0 | 69 | 0.147 |
| Cumulative | `cargo test -p horizon-app export` | 0 | 2 | 0 | 0 | 68 | 5.317 |
| Cumulative | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 | 0 | 0 | 0 | 0.502 |
| Cumulative | `cargo test -p horizon-engine tax` | 0 | 2 | 0 | 0 | 8 | 3.034 |
| Cumulative | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 | 0 | 0 | 0 | 0.256 |
| Cumulative | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 | 0 | 0 | 0 | 0.158 |
| Cumulative | `cargo test -p horizon-app --test reference_values` | 0 | 7 | 0 | 0 | 0 | 0.08 |
| Cumulative | `cargo test -p horizon-engine ledger` | 0 | 2 | 0 | 0 | 8 | 0.049 |
| Cumulative | `cargo test -p horizon-engine money` | 0 | 2 | 0 | 0 | 8 | 0.045 |
| Cumulative | `cargo test -p horizon-app validation` | 0 | 5 | 0 | 0 | 65 | 0.464 |
| Cumulative | `cargo test -p horizon-parity` | 0 | 18 | 0 | 0 | 0 | 59.861 |
| Cumulative | `cargo test --workspace` | 0 | 112 | 0 | 0 | 0 | 275.306 |
| Cumulative | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — | — | — | — | 10.839 |
| Cumulative | `cargo fmt --all --check` | 0 | — | — | — | — | 0.116 |
| Cumulative | `cargo test --workspace --release` | 0 | 112 | 0 | 0 | 0 | 87.696 |
| Cumulative | `cargo build --workspace --release` | 0 | — | — | — | — | 4.84 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.006 |
| Cumulative | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — | — | — | — | 6.818 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.004 |
| Cumulative | `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 18 | 0 | 0 | 0 | 178.146 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.004 |
| Cumulative | `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 1 | 0 | 0 | 2 | 14.79 |
| Cumulative | `cargo deny check licenses` | 0 | — | — | — | — | 0.17 |
| Cumulative | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | — | — | — | — | 0.454 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.008 |
| Cumulative | `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 | 0 | 0 | 14 | 7.039 |
| Cumulative | `cargo test -p horizon-wasm` | 0 | 5 | 0 | 0 | 0 | 7.461 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.005 |
| Cumulative | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | — | — | — | 0.084 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.003 |
| Cumulative | `corepack --version` | 0 | — | — | — | — | 0.034 |
| Cumulative | `corepack pnpm --version` | 0 | — | — | — | — | 0.045 |
| Cumulative | `corepack pnpm install --frozen-lockfile` | 0 | — | — | — | — | 0.138 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.002 |
| Cumulative | `corepack pnpm run build:engine` | 0 | — | — | — | — | 0.248 |
| Cumulative | `corepack pnpm run types` | 0 | — | — | — | — | 0.366 |
| Cumulative | `corepack pnpm run typecheck` | 0 | — | — | — | — | 2.242 |
| Cumulative | `corepack pnpm run lint` | 0 | — | — | — | — | 2.439 |
| Cumulative | `corepack pnpm run format:check` | 0 | — | — | — | — | 0.768 |
| Cumulative | `corepack pnpm test` | 0 | 177 | 0 | 0 | — | 7.119 |
| Cumulative | `node --version` | 0 | — | — | — | — | 0.002 |
| Cumulative | `corepack pnpm run build` | 0 | — | — | — | — | 2.515 |
| Cumulative | `corepack pnpm exec playwright install chromium webkit` | 0 | — | — | — | — | 0.355 |
| Cumulative | `corepack pnpm run e2e` | 0 | 72 | 0 | 0 | — | 834.893 |
| Cumulative | `corepack pnpm run licenses` | 0 | — | — | — | — | 0.473 |
| Refreshed web | `cargo test -p horizon-wasm` | 0 | 5 | 0 | 0 | 0 | 4.083 |
| Refreshed web | `node --version` | 0 | — | — | — | — | 0.004 |
| Refreshed web | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | — | — | — | 0.07 |
| Refreshed web | `node --version` | 0 | — | — | — | — | 0.002 |
| Refreshed web | `corepack --version` | 0 | — | — | — | — | 0.031 |
| Refreshed web | `corepack pnpm --version` | 0 | — | — | — | — | 0.042 |
| Refreshed web | `corepack pnpm install --frozen-lockfile` | 0 | — | — | — | — | 0.095 |
| Refreshed web | `node --version` | 0 | — | — | — | — | 0.001 |
| Refreshed web | `corepack pnpm run build:engine` | 0 | — | — | — | — | 0.246 |
| Refreshed web | `corepack pnpm run types` | 0 | — | — | — | — | 0.315 |
| Refreshed web | `corepack pnpm run typecheck` | 0 | — | — | — | — | 2.113 |
| Refreshed web | `corepack pnpm run lint` | 0 | — | — | — | — | 2.542 |
| Refreshed web | `corepack pnpm run format:check` | 0 | — | — | — | — | 0.747 |
| Refreshed web | `corepack pnpm test` | 0 | 177 | 0 | 0 | — | 7.122 |
| Refreshed web | `node --version` | 0 | — | — | — | — | 0.002 |
| Refreshed web | `corepack pnpm run build` | 0 | — | — | — | — | 2.608 |
| Refreshed web | `corepack pnpm exec playwright install chromium webkit` | 0 | — | — | — | — | 0.348 |
| Refreshed web | `corepack pnpm run e2e` | 0 | 80 | 0 | 0 | — | 888.785 |
| Refreshed web | `corepack pnpm run licenses` | 0 | — | — | — | — | 0.757 |

Release WebAssembly intake timing, ten runs per case under Node v24.22.0:

```text
v2-working-complete: mean 74.342 ms (10 runs)
v2-solve-spending: mean 156.050 ms (10 runs)
v2-solve-savings: mean 63.152 ms (10 runs)
v2-solve-retirement: mean 143.565 ms (10 runs)
v2-solve-savings-with-range: mean 274.524 ms (10 runs)
```

The isolated WebAssembly levers harness reported 5.13 seconds; Node v24.22.0 was recorded immediately before it.

The release levers command exited 3 in 0.454 seconds after the release build, below two seconds.

The final `git diff --check` exited 0. `git diff --quiet 0420fe1..HEAD -- packages Cargo.lock rust-toolchain.toml docs/model/schemas docs/briefs/0002-W4-reference-values.json docs/briefs/0002-W5-reference-values.json docs/briefs/0002-W6-head-sentences.json apps/web/index.html` exited 0, confirming the unchanged engine/tests, references, schemas, toolchain/lockfile and CSP HTML.

#### Expanded CLI validation

Every intake reference document was extracted to its own JSON file. All 29 v1 and 25 reverse-answer reference results matched their exact canonical result bytes, including one trailing newline. CLI integration tests also compare command/application bytes. Expected nonzero exits are results, not failures: 3 leaves things out, 4 needs answers, 1 invalid, 2 unsupported. `dev-run` retains 0 when partial. Export uses its embedded run status; import prints the restored run.

| Intake reference | Exit | Engine status |
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

Each fixture row expands seven commands: `cargo run -p horizon-cli -- spend <name>`, `levers <name>`, `impact <name> packages/app/test-data/empty-rough.json`, `run <name>`, `compare A-drawdown <name>`, `export <name>` and `dev-run <name>`. Cells are observed exits. Every invocation produced canonical JSON plus one newline.

| Fixture | spend | levers | impact | run | compare | export | dev-run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `A-drawdown-pass-limit-1` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-roth_before_tax_deferred` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown-tax_deferred_first` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `A-drawdown` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `B-early-retiree` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `C-partial-base-year-no-taxable` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `D-still-working-rmd-surplus` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `E-senior-2028-loss-carry` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `answers-cap` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-underfunded` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61-retire-later` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
| `answers-working-61` | 3 | 3 | 3 | 3 | 3 | 3 | 0 |
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

Additional explicit rough-input, comparison-pair and current golden/rejection import commands:

| Command | Exit | Engine status |
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

Total explicit CLI invocations: 426. All had their expected exits and canonical JSON output.

Production and full dependency closures passed independently: 4 production package versions and 358 package versions in the full closure.

#### Browser evidence and design checks

First full pass: 72 passed, 0 failed, 0 flaky, 0 skipped, across 8 projects. 1208 original full-page PNG states, plus attachment/report copies. HTML and JSON reports and screenshots are outside the repository.

| Project | Tests |
| --- | --- |
| `chromium-1280-dark` | 9 |
| `chromium-1280-light` | 9 |
| `chromium-375-dark` | 9 |
| `chromium-375-light` | 9 |
| `webkit-1280-dark` | 9 |
| `webkit-1280-light` | 9 |
| `webkit-375-dark` | 9 |
| `webkit-375-light` | 9 |

Actual browser-version annotations: chromium 153.0.8010.12, webkit 26.6.

Refreshed full pass: 80 passed, 0 failed, 0 flaky, 0 skipped, across 8 projects. 1272 original full-page PNG states, plus attachment/report copies. HTML and JSON reports and screenshots are outside the repository.

| Project | Tests |
| --- | --- |
| `chromium-1280-dark` | 10 |
| `chromium-1280-light` | 10 |
| `chromium-375-dark` | 10 |
| `chromium-375-light` | 10 |
| `webkit-1280-dark` | 10 |
| `webkit-1280-light` | 10 |
| `webkit-375-dark` | 10 |
| `webkit-375-light` | 10 |

Actual browser-version annotations: chromium 153.0.8010.12, webkit 26.6.

The final suite checks all three styles with preserved answers/place, money ranges, uncertainty with and without amounts, later answers, exact saved envelopes, reload/resumption, unavailable/corrupt/older storage, example isolation, Forget confirmation/cancellation, every required result-head category, own-figure comparison/export, date digit entry, brokerage basis/ranges and changed assumptions. Every captured state gets axe and overflow checks. All specs retain the storage trap, cookie checks and off-origin/answer-traffic checks. The earlier plan/compare/export fixtures, native/worker bytes, file round-trips and printed summary checks remain. Firefox was neither installed nor run.

Diagnostic trace recording is disabled in the final default config. A preliminary WebKit comparison exceeded 600 seconds with tracing enabled; screenshots, reports, assertions, projects and three-worker concurrency remain. The complete passing final command is the unqualified `corepack pnpm run e2e`.


#### Preliminary checks, scope and exclusions

Development checks were not counted as fresh cumulative passes. The initial `corepack pnpm exec vitest run src/intake.test.ts src/IntakeHead.test.tsx src/App.test.tsx` run had 64 passed and 21 failures (one radio-label test and twenty native-call cwd errors); these were corrected. The first retained `corepack pnpm exec vitest run` had 163 passed and 7 failures in removed setup navigation/status expectations; the required setup tests were removed/replaced and status assertions updated. Later fresh unit runs passed 167, then 177 tests. All 24 exact rendered head tests also passed separately after error punctuation was made literal in the DOM.

Preliminary browser commands: `corepack pnpm run e2e --project=chromium-375-light --grep='intake: one_question'` exited 1 (one failure: the harness tried to Tab directly to an unchecked radio). `corepack pnpm run e2e --project=chromium-375-light` exited 1 with 8 passed and 1 failed because the unsupported couple has no run golden. `corepack pnpm run e2e --project=webkit-375-dark --project=chromium-375-light` exited 1 with 12 passed and 6 failed: two default-copy expectation failures, three WebKit radio-wrap assumptions, and the 600-second comparison timeout. These were corrected by selecting the intended copy, moving in the appropriate radio direction, asserting the couple error directly, and disabling diagnostic tracing.

An initial ordered validation process was interrupted while its first intake command was running so the corrected radio harness could be committed; it is not claimed as a pass. The complete ordered pass is the Cumulative phase above. `corepack pnpm run e2e e2e/intake-dates.spec.ts --project=chromium-375-light --project=webkit-375-dark` exited 1 (0 passed, 2 failed) because exact label lookup included select option text. A second preflight was interrupted (exit 130) at the same kind-of-account locator issue. After switching to combobox accessible names, the two-project preflight passed 2 tests in 10.0 seconds. A direct browser reproduction proved that typing day 10 had produced 010; the controlled field was corrected, and the final date test enters real consecutive keystrokes.

After that date control/evidence change, the entire web shell block was rerun against the final source/test revision, including native horizon-wasm tests, Node-recorded WebAssembly build, frozen install, engine/types generation, typecheck, lint, format, unit tests, production build, Chromium/WebKit installation, all 80 browser tests and both license closures. No prior output was relabeled as a new pass.


Exclusions follow the brief: the what-if panel (0002-W7); all questions on one page (not drawn); plain words beyond status on the original plan/compare/export detail layers (later brief); input check for own figures (ranges and uncertainty replace it here); Firefox (decision 0011 amendment). No cumulative engine/reference/CLI/web check was excluded. Removed Start/GuidedSetup navigation tests were replaced by intake tests. Their inaccessible rough-entry setup steps are removed from browser flows; exact impact/rough summary references remain in component tests. Outside-plan comparison/export browser references reopen the same synthetic input through the retained file flow.

Design references 1–11 were checked using the captured states at phone and desktop widths in light and dark. Brief-required differences from the illustrative images are retained: every-question style switching, additional later/review controls, retained plan-file access and model/tax footer; result text follows the v1.2 head references, without the drawn what-if sliders or invented coverage before a result. Account-specific range names and all returned starting rates follow the brief. The complete existing plan body follows the head at its existing width, rather than the drawings’ placeholder card. Review shows the stated retirement age/date without deriving a second retirement date in the interface. The progress indicator is a native continuous thin bar rather than the illustrative segmented bar; its question counts and accessible label carry the same completeness information. Date-part groups retain explicit legends for accessible naming. Independent review remains a maintainer handoff step; the implementer did not act as reviewer.
