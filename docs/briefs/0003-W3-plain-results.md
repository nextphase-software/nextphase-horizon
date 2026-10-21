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

### Implementation checkpoint — 2026-10-21 (incomplete)

Historical checkpoint: v1.2 settles the case below. The completed implementation and fresh full validation are recorded after this checkpoint.

**Branch:** `codex/0003-W3-plain-results`. **Current source/test revision:** `02dc0057ef624685c8437e3ee68f521001429225`. The implementation record is committed after this revision; its own commit is not named here. The final branch tip is reported at handoff. The requested work-in-progress commit was made before rebasing onto current main; only this branch was committed, with public-boundary hooks enabled. No push was performed.

Plan, Compare and Export now present the engine’s existing today’s-dollar values and plain sentences. Each has one closed, keyboard-operable experts layer. The plan has one follow-on card, ranked range guidance and saved not-sure guidance; worked-out heads are preserved. The Check screen, its step, interface calls and tests are removed, while the engine operation, binding, protocol and CLI remain. Compare uses whole-year retirement-date ages, including leap birthdays and retirement after the plan ends. Export shares the plan’s answer lines, lists saved not-sure answers and retains exact engine file bytes. Dates and the footer use the brief’s words.

The sentence tests render all 51 committed cases against fresh native engine output, including the reference comparison’s 550 lines: 79 today’s-dollar lines and 471 lines in dollars of each year. Built-result edge tests cover the cap, exact spending, retirement outside the plan, singular/null spreads and an empty moves list. Earlier head-answer lines, what-if cases and slider starts remain covered; only superseded status-disclosure/range presentation expectations changed. Browser parity helpers use the release CLI; the separate cumulative CLI sequence below still uses the requested debug commands.

**Open brief case — implementation stopped:** deliverable 2 forbids “fingerprint” anywhere on a plain screen. The unchanged import-failure path in `apps/web/src/Export.tsx` maps `EXPORT_HASH_MISMATCH` to “the fingerprint” and renders “This file did not pass the check of the fingerprint, so Horizon did not open it.” outside the experts layer. The earlier export brief requires naming the failed check. Version 1.1 gives neither replacement failure wording nor an instruction to move that explanation into the experts layer. No new wording or error layout was chosen. Clarification is required before this checkpoint can be completed.

The full eight-project browser run was stopped deliberately on discovering that case. The current run reports 26 passed, 78 skipped, zero unexpected and zero flaky tests; it is **not** a complete browser pass. The web license command remains unrun because it follows e2e in the required sequence. The implementation and its source tests are committed; this record describes an incomplete checkpoint.

**Validation revisions:** the Rust sequence ran while the web work was being completed. Its recorded revisions are shown below; every Rust source/test, Cargo input, fixture, golden and schema is identical to the current source/test revision. All 426 expanded CLI invocations ran at `80a978e8c068078ac07dbeda6b5e62d3ce69a76f`, with those same unchanged Rust inputs. The latest ordered web sequence ran at the current source/test revision above. Outputs were freshly produced; earlier cached output is not counted as a pass.

**Cumulative Rust, WebAssembly and tool checks.** All commands below ran from the workspace root, in order. Counts aggregate the test executables selected by each command. WebAssembly test commands used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`; the immediately preceding Node check returned `v24.22.0`.

| # | Command | Exit | Seconds | Tests/result | Revision |
| --- | --- | ---: | ---: | --- | --- |
| 1 | `cargo test -p horizon-app intake` | 0 | 171.968 | 28 passed, 0 failed, 0 ignored | `e7fbedb` |
| 2 | `cargo test -p horizon-app --test reference_values_intake` | 0 | 103.094 | 5 passed, 0 failed, 0 ignored | `e7fbedb` |
| 3 | `cargo test -p horizon-app answers` | 0 | 17.716 | 10 passed, 0 failed, 0 ignored | `e7fbedb` |
| 4 | `cargo test -p horizon-app --test reference_values_answers` | 0 | 15.983 | 6 passed, 0 failed, 0 ignored | `e7fbedb` |
| 5 | `cargo test -p horizon-app compare` | 0 | 0.753 | 3 passed, 0 failed, 0 ignored | `e7fbedb` |
| 6 | `cargo test -p horizon-app immutability` | 0 | 0.417 | 1 passed, 0 failed, 0 ignored | `e7fbedb` |
| 7 | `cargo test -p horizon-app export` | 0 | 8.68 | 2 passed, 0 failed, 0 ignored | `e7fbedb` |
| 8 | `cargo test -p horizon-app --test reference_values_w4` | 0 | 0.634 | 1 passed, 0 failed, 0 ignored | `e7fbedb` |
| 9 | `cargo test -p horizon-engine tax` | 0 | 3.483 | 2 passed, 0 failed, 0 ignored | `e7fbedb` |
| 10 | `cargo test -p horizon-app --test reference_values_w3` | 0 | 0.383 | 4 passed, 0 failed, 0 ignored | `e7fbedb` |
| 11 | `cargo test -p horizon-app --test reference_values_w2` | 0 | 0.296 | 11 passed, 0 failed, 0 ignored | `e7fbedb` |
| 12 | `cargo test -p horizon-app --test reference_values` | 0 | 0.203 | 7 passed, 0 failed, 0 ignored | `e7fbedb` |
| 13 | `cargo test -p horizon-engine ledger` | 0 | 0.149 | 2 passed, 0 failed, 0 ignored | `af92baa` |
| 14 | `cargo test -p horizon-engine money` | 0 | 0.109 | 2 passed, 0 failed, 0 ignored | `af92baa` |
| 15 | `cargo test -p horizon-app validation` | 0 | 0.673 | 5 passed, 0 failed, 0 ignored | `af92baa` |
| 16 | `cargo test -p horizon-parity` | 0 | 70.762 | 18 passed, 0 failed, 0 ignored | `af92baa` |
| 17 | `cargo test --workspace` | 0 | 366.473 | 112 passed, 0 failed, 0 ignored | `d843286` |
| 18 | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | 15.225 | passed | `e270bf5` |
| 19 | `cargo fmt --all --check` | 0 | 0.173 | passed | `e270bf5` |
| 20 | `cargo test --workspace --release` | 0 | 86.783 | 112 passed, 0 failed, 0 ignored | `e270bf5` |
| 21 | `cargo build --workspace --release` | 0 | 6.44 | passed | `e270bf5` |
| 22 | `node --version` | 0 | 0.003 | passed | `e270bf5` |
| 23 | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | 7.222 | passed | `e270bf5` |
| 24 | `node --version` | 0 | 0.003 | passed | `e270bf5` |
| 25 | `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 179.461 | 18 passed, 0 failed, 0 ignored | `80a978e` |
| 26 | `node --version` | 0 | 0.002 | passed | `80a978e` |
| 27 | `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 17.599 | 1 passed, 0 failed, 0 ignored | `80a978e` |
| 28 | `cargo deny check licenses` | 0 | 0.199 | passed | `80a978e` |
| 455 | `node --version` | 0 | 0.003 | passed | `80a978e` |
| 456 | `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 7.045 | 1 passed, 0 failed, 0 ignored | `80a978e` |
| 457 | `cargo test -p horizon-wasm` | 0 | 7.668 | 5 passed, 0 failed, 0 ignored | `80a978e` |
| 458 | `node --version` | 0 | 0.002 | passed | `80a978e` |
| 459 | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | 0.081 | passed | `80a978e` |

**Release WebAssembly intake timing:** ten typed calls per case.

| Case | Mean (ms) |
| --- | ---: |
| `v2-working-complete` | 86.618 |
| `v2-solve-spending` | 197.439 |
| `v2-solve-savings` | 63.653 |
| `v2-solve-retirement` | 132.375 |
| `v2-solve-savings-with-range` | 304.038 |

The timed release command `cargo run --release -p horizon-cli -- levers answers-working-61` exited **3** (partial), printed one canonical JSON document plus one newline, and took **0.511 s**, below two seconds after the release build. The isolated WebAssembly levers test’s harness duration was **5.22 s** (command wall time 7.045 s).

**Expanded CLI checks.** Each invocation printed one canonical JSON document and exactly one newline. The runner parsed each document, checked its canonical byte representation and checked its exit against the returned status (export uses `run.status`; import prints the restored run; `dev-run` uses 0 for partial). Application/CLI byte equality is also proved by the unchanged workspace CLI suite. Status exits are 0 complete, 3 partial, 4 incomplete, 1 invalid and 2 unsupported. All 426 invocations passed these checks, including the timed release invocation above.

For the following 54 intake invocations, each committed reference case’s `answers` was extracted to a separate temporary JSON file. Each row expands `cargo run -p horizon-cli -- intake <that-file>`; the first column identifies that extracted document. Each command returned one document.

| Extracted answers | Exit | Status |
| --- | ---: | --- |
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

Each cell below is the observed exit of one command. For `spend`, `levers`, `run`, `export` and `dev-run`, the full command is `cargo run -p horizon-cli -- <column> <fixture>`. `impact` adds `packages/app/test-data/empty-rough.json`. `compare` is `cargo run -p horizon-cli -- compare A-drawdown <fixture>`. Every cell returned one canonical document; all exits matched the status mapping above.

| Fixture | spend | levers | impact | run | compare | export | dev-run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
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

Additional impact and reference comparison commands (one document each):

| Command | Exit | Status |
| --- | ---: | --- |
| `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
| `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |

Each import row expands `cargo run -p horizon-cli -- import <path>` and returned one document:

| Path | Exit | Status |
| --- | ---: | --- |
| `packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial |
| `packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete |
| `packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete |
| `packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete |
| `packages/parity/golden/A-drawdown.export.json` | 0 | complete |
| `packages/parity/golden/B-early-retiree.export.json` | 3 | partial |
| `packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial |
| `packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial |
| `packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete |
| `packages/parity/golden/answers-cap.export.json` | 3 | partial |
| `packages/parity/golden/answers-underfunded.export.json` | 3 | partial |
| `packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial |
| `packages/parity/golden/answers-working-61.export.json` | 3 | partial |
| `packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial |
| `packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial |
| `packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete |
| `packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete |
| `packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete |
| `packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete |
| `packages/parity/golden/synthetic-leap.export.json` | 3 | partial |
| `packages/parity/golden/synthetic-retired.export.json` | 0 | complete |
| `packages/parity/golden/synthetic-working.export.json` | 3 | partial |
| `packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete |
| `packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete |
| `packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete |
| `packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete |
| `packages/app/test-data/tampered-export.json` | 1 | invalid |
| `packages/app/test-data/unknown-format-export.json` | 2 | unsupported |
| `packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported |

**Web shell sequence.** Commands ran from `apps/web/`, in the order below. Fresh sequences and their stops are recorded below; none is represented as a complete web-shell pass. Node was recorded before each engine build, production build and browser run.

| # | Command | Exit | Seconds | Result | Revision |
| --- | --- | ---: | ---: | --- | --- |
| 460 | `node --version` | 0 | 0.004 | passed | `80a978e` |
| 461 | `corepack --version` | 0 | 0.042 | passed | `80a978e` |
| 462 | `corepack pnpm --version` | 0 | 0.05 | passed | `80a978e` |
| 463 | `corepack pnpm install --frozen-lockfile` | 0 | 7.14 | passed | `80a978e` |
| 464 | `node --version` | 0 | 0.002 | passed | `80a978e` |
| 465 | `corepack pnpm run build:engine` | 0 | 0.244 | passed | `80a978e` |
| 466 | `corepack pnpm run types` | 0 | 0.34 | passed | `80a978e` |
| 467 | `corepack pnpm run typecheck` | 0 | 2.151 | passed | `80a978e` |
| 468 | `corepack pnpm run lint` | 0 | 3.177 | passed | `80a978e` |
| 469 | `corepack pnpm run format:check` | 1 | 0.884 | failed (corrected below) | `80a978e` |
| 470 | `node --version` | 0 | 0.001 | passed | `f1b7b39` |
| 471 | `corepack --version` | 0 | 0.03 | passed | `f1b7b39` |
| 472 | `corepack pnpm --version` | 0 | 0.038 | passed | `f1b7b39` |
| 473 | `corepack pnpm install --frozen-lockfile` | 0 | 0.089 | passed | `f1b7b39` |
| 474 | `node --version` | 0 | 0.002 | passed | `f1b7b39` |
| 475 | `corepack pnpm run build:engine` | 0 | 0.229 | passed | `f1b7b39` |
| 476 | `corepack pnpm run types` | 0 | 0.324 | passed | `f1b7b39` |
| 477 | `corepack pnpm run typecheck` | 0 | 2.194 | passed | `f1b7b39` |
| 478 | `corepack pnpm run lint` | 0 | 2.799 | passed | `f1b7b39` |
| 479 | `corepack pnpm run format:check` | 0 | 0.842 | passed | `f1b7b39` |
| 480 | `corepack pnpm test` | 0 | 44.172 | 283 tests / 18 files passed | `f1b7b39` |
| 481 | `node --version` | 0 | 0.002 | passed | `f1b7b39` |
| 482 | `corepack pnpm run build` | 0 | 2.856 | passed | `f1b7b39` |
| 483 | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.347 | passed | `f1b7b39` |
| 484 | `node --version` | 0 | 0.001 | passed | `f1b7b39` |
| 485 | `corepack pnpm run e2e` | 130 | 478.476 | 54 passed, 50 skipped; intentionally interrupted | `f1b7b39` |
| 486 | `node --version` | 0 | 0.004 | passed | `02dc005` |
| 487 | `corepack --version` | 0 | 0.038 | passed | `02dc005` |
| 488 | `corepack pnpm --version` | 0 | 0.045 | passed | `02dc005` |
| 489 | `corepack pnpm install --frozen-lockfile` | 0 | 0.1 | passed | `02dc005` |
| 490 | `node --version` | 0 | 0.001 | passed | `02dc005` |
| 491 | `corepack pnpm run build:engine` | 0 | 0.264 | passed | `02dc005` |
| 492 | `corepack pnpm run types` | 0 | 0.355 | passed | `02dc005` |
| 493 | `corepack pnpm run typecheck` | 0 | 2.924 | passed | `02dc005` |
| 494 | `corepack pnpm run lint` | 0 | 2.996 | passed | `02dc005` |
| 495 | `corepack pnpm run format:check` | 0 | 0.811 | passed | `02dc005` |
| 496 | `corepack pnpm test` | 0 | 44.937 | 284 tests / 18 files passed | `02dc005` |
| 497 | `node --version` | 0 | 0.018 | passed | `02dc005` |
| 498 | `corepack pnpm run build` | 0 | 3.435 | passed | `02dc005` |
| 499 | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.346 | passed | `02dc005` |
| 500 | `node --version` | 0 | 0.002 | passed | `02dc005` |
| 501 | `corepack pnpm run e2e` | 130 | 238.245 | 26 passed, 78 skipped; stopped for clarification | `02dc005` |

The first ordered web run stopped at formatting after a one-line test-selector edit. Prettier corrected that assertion, it was committed, and the complete ordered web sequence was rerun. Preliminary development checks also caught and corrected stale UI expectations and test setup (comparison dollar-basis access, removed card/section selectors, Node JSON import attributes, and saved what-if uncertainty context). A preliminary Chromium launcher exited 143 before finalizing its report and is not counted as a pass. A focused WebKit run passed plan, export and range navigation but found an old `$0` expectation for sub-dollar balances; that assertion was changed to the brief’s “less than $1”, and the full comparison rerun passed. The first complete-matrix attempt was intentionally interrupted (exit 130) to correct an export context issue: a worked-out savings headline after a retirement what-if must use the displayed answers, while uncertainty lists use saved answers. A new unit and browser regression covers this case. The ordered web sequence was rerun on the corrected committed source. The restarted matrix was then stopped for the unresolved import-failure wording above. No complete eight-project pass or web license pass is claimed.

**Tools:** Rust/Cargo 1.99.1; cargo-deny 0.20.2; wasm-bindgen-test-runner 0.2.129, matching Cargo.lock; Node v24.22.0; corepack 0.36.0; pnpm 12.9.1; Playwright 1.63.0. No toolchain or dependency version changed.

**Browser evidence (incomplete):** versions below come from the latest e2e `browser-version` annotations. Chromium phone light/dark completed all 13 tests each, including the new displayed-answer export regression, axe, keyboard sections and experts, overflow, worker/native parity and privacy checks. The other 78 tests are skipped in the interrupted report; no complete matrix pass is claimed. The focused `corepack pnpm run e2e --project=webkit-375-dark --grep "plain results:|plan:|compare:|export:"` run exited 1 (3 passed, 1 failed); after the sub-dollar expectation correction, `corepack pnpm run e2e e2e/compare.spec.ts --project=webkit-375-dark` exited 0 (1 passed). Those annotations report WebKit **26.6**. Screenshots and the latest interrupted Playwright HTML/JSON report are saved outside the repository as requested.

| Project | Browser version | Passed tests | Screenshots |
| --- | --- | ---: | ---: |
| `chromium-1280-dark` | not run | 0 | 0 |
| `chromium-1280-light` | 153.0.8010.12 | 0 | 22 |
| `chromium-375-dark` | 153.0.8010.12 | 13 | 194 |
| `chromium-375-light` | 153.0.8010.12 | 13 | 194 |
| `webkit-1280-dark` | not run | 0 | 0 |
| `webkit-1280-light` | not run | 0 | 0 |
| `webkit-375-dark` | not run | 0 | 0 |
| `webkit-375-light` | not run | 0 | 0 |

Representative plan, compare, export, navigation and footer screenshots were checked against design references 14–18, with phone/desktop and light/dark evidence from the preliminary and interrupted runs. Full final browser evidence remains pending. The brief’s intentional adjustments apply: no redundant status sentence; ranged follow-ons name the middle; not-sure lists exclude ranged/changed answers on the plan and list saved answers on export; sub-dollar comparison values say “less than $1”; export uses the same headline and follow-on as the plan. The base-year money note is stated once on each screen; chart captions avoid repeating it. Keyboard focus remains visible in the evidence.

**New dependencies:** none. No new hosted route or authorization surface was introduced. The engine, schemas, fixtures, reference JSON, goldens, answer/head vectors, slider starts, dependency manifests/locks and CSP are unchanged. The final source-boundary check is recorded below. Independent review remains a separate maintainer gate; no self-review is claimed.

**Exclusions:** engine changes and new today’s-dollar values (excluded by the brief); later years’ shortfalls in plain words (only the first year is named); Welcome and intake questions (unchanged as required); the example eyebrow (unchanged as required). The complete eight-project browser pass and subsequent web license check are pending the import-failure clarification; this is an incomplete checkpoint, not an accepted exclusion from the brief.


Final read-only checks from the workspace root: `node --version` (exit 0, v24.22.0), `rustc --version` (exit 0, 1.99.1), `cargo --version` (exit 0, 1.99.1), `cargo deny --version` (exit 0, 0.20.2), `node --version` (exit 0, v24.22.0), and `wasm-bindgen-test-runner --version` (exit 0, 0.2.129).

`git diff --quiet main -- packages Cargo.toml Cargo.lock rust-toolchain.toml docs/model/schemas 'docs/briefs/*.json' docs/briefs/assets apps/web/index.html apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/Intake.tsx apps/web/src/IntakeQuestion.tsx apps/web/src/intake-fields.ts` exited 0: zero differences in protected engine/model inputs, references, designs, manifests, CSP and intake questions.

### Implementation record — v1.2 completed, 2026-10-21

**Branch:** `codex/0003-W3-plain-results`. **Source/test revision validated:** `a52bb4cb4cf4cdc2c2a708644b7aef334382bdff`. The ordered full validation below ran freshly against that revision. The later documentation commit records these results and updates the architecture section to v1.2; it changes no source or tests. Its own commit is not named here; the final branch tip is reported at handoff. The branch was rebased onto current main before implementing v1.2. Only this branch was committed, hooks remained enabled, and no push was performed.

Version 1.2 resolves the historical checkpoint’s import-wording case. All five failed checks now use its exact plain messages, without raw engine errors on the plain screen. Unit tests cover every message; each browser project checks all five failures, preserves the current household and exact download bytes, and captures the rerun mismatch as well. The rest of the implementation is described in the checkpoint above.

**Tools:** Node `v24.22.0`, corepack `0.36.0`, pnpm `12.9.1`, Rust and Cargo `1.99.1`, cargo-deny `0.20.2`, wasm-bindgen-test-runner `0.2.129`, Playwright `1.63.0`. Node’s version was recorded immediately before every WebAssembly build/test command, including web engine builds and the browser command. The WebAssembly tests used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`.

**Full cumulative root sequence.** Commands ran in AGENTS.md order. Tests/result aggregates all selected harnesses. CLI expansions are recorded separately below, at their required place between license checking and the isolated WebAssembly levers test.

| # | Command | Exit | Seconds | Tests/result |
| --- | --- | ---: | ---: | --- |
| 1 | `cargo test -p horizon-app intake` | 0 | 34.013 | 28 passed, 0 failed, 0 ignored |
| 2 | `cargo test -p horizon-app --test reference_values_intake` | 0 | 32.714 | 5 passed, 0 failed, 0 ignored |
| 3 | `cargo test -p horizon-app answers` | 0 | 7.555 | 10 passed, 0 failed, 0 ignored |
| 4 | `cargo test -p horizon-app --test reference_values_answers` | 0 | 5.755 | 6 passed, 0 failed, 0 ignored |
| 5 | `cargo test -p horizon-app compare` | 0 | 0.459 | 3 passed, 0 failed, 0 ignored |
| 6 | `cargo test -p horizon-app immutability` | 0 | 0.133 | 1 passed, 0 failed, 0 ignored |
| 7 | `cargo test -p horizon-app export` | 0 | 4.889 | 2 passed, 0 failed, 0 ignored |
| 8 | `cargo test -p horizon-app --test reference_values_w4` | 0 | 0.353 | 1 passed, 0 failed, 0 ignored |
| 9 | `cargo test -p horizon-engine tax` | 0 | 0.064 | 2 passed, 0 failed, 0 ignored |
| 10 | `cargo test -p horizon-app --test reference_values_w3` | 0 | 0.196 | 4 passed, 0 failed, 0 ignored |
| 11 | `cargo test -p horizon-app --test reference_values_w2` | 0 | 0.122 | 11 passed, 0 failed, 0 ignored |
| 12 | `cargo test -p horizon-app --test reference_values` | 0 | 0.064 | 7 passed, 0 failed, 0 ignored |
| 13 | `cargo test -p horizon-engine ledger` | 0 | 0.043 | 2 passed, 0 failed, 0 ignored |
| 14 | `cargo test -p horizon-engine money` | 0 | 0.051 | 2 passed, 0 failed, 0 ignored |
| 15 | `cargo test -p horizon-app validation` | 0 | 0.38 | 5 passed, 0 failed, 0 ignored |
| 16 | `cargo test -p horizon-parity` | 0 | 42.716 | 18 passed, 0 failed, 0 ignored |
| 17 | `cargo test --workspace` | 0 | 217.447 | 112 passed, 0 failed, 0 ignored |
| 18 | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | 0.218 | passed |
| 19 | `cargo fmt --all --check` | 0 | 0.112 | passed |
| 20 | `cargo test --workspace --release` | 0 | 30.658 | 112 passed, 0 failed, 0 ignored |
| 21 | `cargo build --workspace --release` | 0 | 0.098 | passed |
| 22 | `node --version` | 0 | 0.004 | v24.22.0 |
| 23 | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | 0.094 | passed |
| 24 | `node --version` | 0 | 0.003 | v24.22.0 |
| 25 | `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 151.541 | 18 passed, 0 failed, 0 ignored |
| 26 | `node --version` | 0 | 0.005 | v24.22.0 |
| 27 | `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 6.921 | 1 passed, 0 failed, 0 ignored |
| 28 | `cargo deny check licenses` | 0 | 0.163 | passed |
| 455 | `node --version` | 0 | 0.006 | v24.22.0 |
| 456 | `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 8.117 | 1 passed, 0 failed, 0 ignored |
| 457 | `cargo test -p horizon-wasm` | 0 | 10.7 | 5 passed, 0 failed, 0 ignored |
| 458 | `node --version` | 0 | 0.013 | v24.22.0 |
| 459 | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | 0.644 | passed |

**Release WebAssembly intake timing:** ten calls per case.

| Case | Mean (ms) |
| --- | ---: |
| `v2-working-complete` | 68.492 |
| `v2-solve-spending` | 143.657 |
| `v2-solve-savings` | 59.004 |
| `v2-solve-retirement` | 99.115 |
| `v2-solve-savings-with-range` | 282.693 |

The timed release `cargo run --release -p horizon-cli -- levers answers-working-61` exited **3** (partial), took **0.522 s** after the release build (under two seconds), and printed canonical JSON plus one newline. The isolated WebAssembly levers test’s harness duration was **6.52 s**, with command wall time 8.117 s.

**Expanded CLI sequence:** all 426 invocations passed their expected exit and canonical JSON/one-newline checks. Supported status exits were 0 complete, 3 partial, 4 incomplete, 1 invalid and 2 unsupported; `dev-run` kept 0 for partial. Export used embedded `run.status`; import returned the restored run. The unchanged workspace CLI tests additionally proved byte equality with application operations.

Each of the following 54 reference answers documents was extracted to its own JSON file. Each row records `cargo run -p horizon-cli -- intake <extracted-file>` with the named document and its observed exit/status; every invocation returned one document.

| Extracted answers | Exit | Status |
| --- | ---: | --- |
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

For each cell below, the full command is `cargo run -p horizon-cli -- <column> <fixture>`. `impact` additionally uses `packages/app/test-data/empty-rough.json`; `compare` uses `A-drawdown <fixture>`. Each cell is one invocation and its observed exit, with one canonical output document.

| Fixture | spend | levers | impact | run | compare | export | dev-run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
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

Additional explicit rough-range, five reference-comparison and 29 import invocations follow. Full commands are `cargo run -p horizon-cli -- <arguments>`; paths below are repository-relative. Each returned one canonical document.

| Arguments | Exit | Status |
| --- | ---: | --- |
| `impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
| `compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
| `compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |
| `import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial |
| `import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete |
| `import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete |
| `import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete |
| `import packages/parity/golden/A-drawdown.export.json` | 0 | complete |
| `import packages/parity/golden/B-early-retiree.export.json` | 3 | partial |
| `import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial |
| `import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial |
| `import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete |
| `import packages/parity/golden/answers-cap.export.json` | 3 | partial |
| `import packages/parity/golden/answers-underfunded.export.json` | 3 | partial |
| `import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial |
| `import packages/parity/golden/answers-working-61.export.json` | 3 | partial |
| `import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial |
| `import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial |
| `import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete |
| `import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete |
| `import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete |
| `import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete |
| `import packages/parity/golden/synthetic-leap.export.json` | 3 | partial |
| `import packages/parity/golden/synthetic-retired.export.json` | 0 | complete |
| `import packages/parity/golden/synthetic-working.export.json` | 3 | partial |
| `import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete |
| `import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete |
| `import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete |
| `import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete |
| `import packages/app/test-data/tampered-export.json` | 1 | invalid |
| `import packages/app/test-data/unknown-format-export.json` | 2 | unsupported |
| `import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported |

**Ordered web shell sequence**, from `apps/web/` after the full root sequence.

| # | Command | Exit | Seconds | Result |
| --- | --- | ---: | ---: | --- |
| 460 | `node --version` | 0 | 0.015 | v24.22.0 |
| 461 | `corepack --version` | 0 | 0.116 | 0.36.0 |
| 462 | `corepack pnpm --version` | 0 | 0.164 | 12.9.1 |
| 463 | `corepack pnpm install --frozen-lockfile` | 0 | 25.437 | passed |
| 464 | `node --version` | 0 | 0.015 | v24.22.0 |
| 465 | `corepack pnpm run build:engine` | 0 | 0.703 | passed |
| 466 | `corepack pnpm run types` | 0 | 0.617 | passed |
| 467 | `corepack pnpm run typecheck` | 0 | 3.523 | passed |
| 468 | `corepack pnpm run lint` | 0 | 3.814 | passed |
| 469 | `corepack pnpm run format:check` | 0 | 0.879 | passed |
| 470 | `corepack pnpm test` | 0 | 48.357 | 284 tests passed, 18 files |
| 471 | `node --version` | 0 | 0.004 | v24.22.0 |
| 472 | `corepack pnpm run build` | 0 | 3.576 | passed |
| 473 | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.417 | passed |
| 474 | `node --version` | 0 | 0.002 | v24.22.0 |
| 475 | `corepack pnpm run e2e` | 0 | 1130.206 | 104 passed; 8 projects; 0 failed, skipped or flaky |
| 476 | `corepack pnpm run licenses` | 0 | 0.417 | Production: 4 package versions passed; full closure: 358 package versions passed |

**Browser evidence:** every project ran all 13 tests, including every sample, axe, keyboard navigation and experts disclosure, status labels, overflow and privacy checks. Actual versions below come from test annotations, not installation output. Full-page screenshots of every captured screen/state and the complete Playwright HTML/JSON report were saved outside the repository. Screenshot counts below exclude duplicate report attachments.

| Project | Actual browser version | Passed tests | Screenshots |
| --- | --- | ---: | ---: |
| `chromium-1280-dark` | 153.0.8010.12 | 13 | 195 |
| `chromium-1280-light` | 153.0.8010.12 | 13 | 195 |
| `chromium-375-dark` | 153.0.8010.12 | 13 | 195 |
| `chromium-375-light` | 153.0.8010.12 | 13 | 195 |
| `webkit-1280-dark` | 26.6 | 13 | 195 |
| `webkit-1280-light` | 26.6 | 13 | 195 |
| `webkit-375-dark` | 26.6 | 13 | 195 |
| `webkit-375-light` | 26.6 | 13 | 195 |

The sentence tests render all 51 committed cases with fresh native results and scan the plain screens for banned terms. The reference comparison retains 550 differing lines, 79 labelled today’s dollars and 471 dollars of each year. Built-result tests cover spending at the cap, exactly enough, retirement after the plan, singular/null spreads and no moves; the displayed-head/export regression preserves saved uncertainty names. Earlier head sentences, what-if cases and slider starts pass unchanged. Before committing the source, `corepack pnpm exec vitest run src/Export.test.tsx` from `apps/web/` exited 0 (16 tests passed). A scratch rehashed export with a changed run status was also checked using `target/debug/horizon import <synthetic-rerun-file>` from the root: expected exit 1 and `EXPORT_RESULT_MISMATCH`. Two initial direct-binary probes used the crate name instead of the executable name and did not launch; they are not counted as passes.

Final screenshots were checked against design references 14–18 across phone/desktop and light/dark layouts. The brief’s named differences apply: redundant status prose is removed, ranged follow-ons name the middle, and saved not-sure answers appear on export. The footer, navigation, amounts notes and closed experts disclosures follow the brief.

**Scope check:** `git diff --quiet main -- packages Cargo.toml Cargo.lock rust-toolchain.toml docs/model/schemas 'docs/briefs/*.json' docs/briefs/assets apps/web/index.html apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/Intake.tsx apps/web/src/IntakeQuestion.tsx apps/web/src/intake-fields.ts` exited 0: zero changes to protected financial inputs/code, schemas, fixtures, goldens, references, dependencies, design assets, CSP or intake questions. `git diff --check` exited 0. Main is an ancestor of this branch. Independent review remains a separate maintainer step; no self-review is claimed.

**New dependencies:** none. **Exclusions:** engine changes and new today’s-dollar values (explicitly excluded); later years’ shortfalls in plain words (only the first is named); Welcome and intake questions (unchanged as required); example eyebrow (unchanged as required). No validation exclusions remain.
