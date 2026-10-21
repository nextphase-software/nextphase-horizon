BRIEF VERSION: 0002-W7 v1.2 (2026-10-20)

# 0002-W7 — What if: change any answer and see the plan again

## Outcome

On the results of a person's own figures, a "What if…" panel lets them change retirement age, spending in retirement, savings, Social Security, pension, investment growth and price rises with sliders, and see the plan again from the engine. Their answers stay as they are until they choose **Keep these as my answers**; **Reset to my answers** goes back. What-if values are never stored. Example households are unchanged.

## Deliverables

1. **The panel** (design references 12–13):
   - **Where:** on the results of the person's own figures, below "Starting values Horizon used" and above the plan body. It shows whenever the current result has a household input; never for an example household, nor for an `incomplete`, `unsupported` or `invalid` result.
   - **Text:** heading "What if…"; line "Move any of these to see how your plan changes. Your answers stay as they are until you choose to keep a change."
2. **The sliders,** each a native range input with a number box beside it in the same unit:

   | Label | Shown when | Range and step | Starts at | Sends |
   | --- | --- | --- | --- | --- |
   | Retire at | not retired | age 50 (or the first whole age after the valuation date, if higher) to 80, step 1 | the answered age; the worked-out age when `solved.answer` is `retirement`; for a date answer, the person's age in whole years on that date; when the worked-out age is null (flag `unreachable`), the person's age in whole years on the household input's retirement date, the search limit **(v1.1)**. Ages count a 29 February birthday as 28 February in common years (decision 0017 item 3) | `retirement: {"age": n}` |
   | Spending in retirement, a year | always | $0–$200,000, step $1,000 | the household input's `spending.after_retirement` cents | `spending_in_retirement: {"cents": c, "per": "year"}` |
   | Savings today | always | $0–$3,000,000, step $5,000 | the exact sum of the household input's account balances (decision 0011, amendment "one exact sum") | `what_if: {"savings_total_cents": c}` |
   | Social Security, a year | `expects` is not `no` | $0–$60,000, step $500 | the household input's Social Security amount cents | `social_security.amount: {"cents": c, "per": "year"}`, keeping `expects` and setting `start_age` to the household input's |
   | Social Security from | `expects` is not `no` | age 62–70, step 1 | the household input's start age | `social_security.start_age` |
   | Pension, a year | the pension answer is "yes" with an amount | $0–$60,000, step $500 | the household input's pension amount cents | `pension.amount: {"cents": c, "per": "year"}`, keeping `start_age` and `rises_with_prices` |
   | Investments grow, a year | always | 0–8%, step 0.25 | the household input's `investment_return`, as a percent by moving the decimal point in the text | `assumptions.investment_return` as a decimal string (the 0002-W6 rule) |
   | Prices rise, a year | always | 0–5%, step 0.25 | the household input's `inflation`, likewise | `assumptions.inflation` |

   - **Ranges:** when a starting value lies outside its range, the range extends to include it, to the next step.
   - **Display:** the value shows in plain words beside the label ("$80,000", "age 66", "2.5%"), with an accessible value text such as "$80,000 a year". A slider changed from its start shows the tag "what if".
   - **The line under each slider (v1.1)** says where its starting value came from, using the 0002-W6 conversions (whole dollars, half up):
     - "Your answer: …" when the person gave that value: a figure; an age or a date for retirement; savings given as a figure for every account (the exact sum), or "none" ($0); a rate given in `assumptions`.
     - "Your range: … to …" when the answer is a range (spending in retirement, a Social Security amount), with the range drawn as a band under the track.
     - "Worked out: …" for the worked-out answer; when its value is null (`unreachable`), "Worked out: no age works" (retirement) or "Worked out: no amount up to $100,000,000 works" (savings).
     - "Horizon used: …" for anything else: a value the person did not give (a rate not in `assumptions`, a Social Security start age not answered), spending "about the same as now", savings where any account is a range, or an amount left for later.
     - A mark under the track shows the value on that line; a range shows its band instead; a null worked-out value shows neither.
   - **Number box:** a typed value outside the range is not sent and says why under the box.
3. **Sending:**
   - **What is sent:** a what-if is the person's answers document with every changed slider's value applied, all changes at once (decision 0019 item 9). It is sent to `plan_from_answers` when a slider is released (pointer up, or a key released) or a number box is committed, never during a drag.
   - **While waiting:** the head says "Working out your plan…".
   - **Stale replies:** a reply that is no longer the latest request is ignored.
4. **Showing a what-if:**
   - **The head:** it re-renders by the rules of brief 0002-W6 deliverable 7 for the what-if result, with the tag "What if: not your answers" above the headline while any change is active.
   - **The plan body:** it follows the what-if result's household input.
   - **Expected text:** the head for each case in [the what-if cases](0002-W7-what-if-cases.json) equals that case's `head`.
5. **Reset and keep:**
   - **Reset to my answers** restores every slider and the result of the person's answers.
   - **Keep these as my answers** writes each changed value into the answers:
     - retirement as `{age}`;
     - spending in retirement as a figure in a year, replacing a range or "about the same as now";
     - Social Security amount and start age;
     - the pension amount;
     - the two rates in `assumptions`;
     - for a savings total, each account's balance is set to the balance the what-if result's household input gives that account, in the same order, replacing ranges and keeping each answered cost basis. When the person had no accounts, or every account was at $0 (decision 0019 item 10), the one generated account replaces them, kept with its balance and cost basis **(v1.2)**.

     Every kept answer leaves `not_sure`. The answers are then saved (decision 0018) and the panel starts again from them.
6. **Not stored:** what-if values never reach the stored item (decision 0018 item 1). The item changes only on **Keep these as my answers**.
7. **Accessibility:** every slider and box is reachable and operable by keyboard (arrows and Page Up/Down on the slider), labelled, with visible focus, and the panel passes axe.
8. **Documentation:** `docs/architecture/web-shell.md` gains a what-if section (the sliders, when a change is sent, reset and keep, nothing stored, and the one exact sum).

## Done when

1. **Starting values:** for each case of [the what-if cases](0002-W7-what-if-cases.json), the sliders' starting values computed from the `start` case's result are those in the table: retire 66, spending $67,000, savings $750,000, Social Security $26,000 from 67, investments 5%, prices 2.5%. For `worked-out-savings-then-total-600000`, the starting point is the result of its answers without the `what_if`. **(v1.1)** For each of the 34 cases in [the slider starts](0002-W7-slider-starts.json) (every 0002-W4 and 0002-W5 reference case whose result shows the panel), the sliders shown, their starting values and the line under each equal that file.
2. **What-if documents:** for each case other than `start`, moving the named slider from the starting values produces that case's `answers` exactly. The case names give the change: spending $80,000; retire at 70; savings $1,000,000; Social Security $33,000 from 70; investments 6% and prices 3%; spending $70,000 on the ranged answers; savings $600,000 after a worked-out savings.
3. **Head text:** the head rendered from each case's `result` equals its `head`, with the "What if: not your answers" tag for every case but `start`.
4. **No other arithmetic:** the only computations are the 0002-W6 conversions and the one exact sum; no figure on screen comes from anywhere but a result.
5. **Sending on release:** a test drags a slider and shows one `plan_from_answers` call after release and none during the drag; a stale reply is ignored.
6. **Keep and reset:** keeping a savings total writes the shared balances exactly (for `savings-total-1000000`: 2,666,667, 20,000,000, 69,333,333 and 8,000,000 cents) and stores the answers; reset restores the answers' result; what-ifs alone leave the stored item byte for byte unchanged.
7. **Design and browsers:** the panel matches design references 12–13 at phone and desktop sizes in light and dark. The 8 projects (Chromium and WebKit) pass, with axe, keyboard-only use of every slider, no horizontal overflow at 375 px and no off-origin requests. Examples show no panel.
8. **Earlier guarantees hold:** every engine test, reference file, golden and schema is unchanged, and so are the 0002-W6 head sentences and their tests; the Content Security Policy is unchanged; unit tests, typecheck, lint, format, build and license checks pass.

## Read first

- `DESIGN.md`, `AGENTS.md`, `docs/architecture/web-shell.md`.
- Decision records `0011-*` (with its amendments), `0018-*` and `0019-*` (items 9–11).
- Briefs `0002-W5-reverse-answers.md` and `0002-W6-intake-screens.md`.
- [Design references, version 2](assets/design-v2/README.md), screens 12–13. Illustrative and not to ship: the drawn plan body is a placeholder for today's plan body. Under v1.1, the two rate lines drawn as "Your answer: 5%" and "Your answer: 2.5%" read "Horizon used: 5%" and "Horizon used: 2.5%", because that household gave no rates.

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.

## Validation

The full sequence in `AGENTS.md`: the Rust sequence, then the web shell, with `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects. Record `node --version`, `corepack pnpm --version`, the Playwright browser versions, and the e2e project and test counts. Save screenshots of every screen in every project, and the Playwright report, outside the repository.

## Exclusions

- **Example households:** they keep "Try a change" and Compare; no panel.
- **Sliders for other answers** (pay, spending now, account kinds, plan length): a later brief if wanted.
- **Live updating during a drag:** excluded by decision 0019 item 14 and the recorded engine times.
- **Engine changes:** none.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### Implementation — 2026-10-21

- Branch: `codex/0002-W7-what-if-panel`.
- Source/test revision validated: `9a9d8b36b244edc6bc9618bec7394032837416b3`. This record is committed after that revision; the final branch tip is reported in the handoff.
- Implemented v1.2 only. No new dependencies. Engine sources/tests, schemas, reference files, goldens, the W6 head sentences and tests, and the CSP are unchanged.
- Toolchain: Rust 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129, Node v24.22.0, corepack 0.36.0 and pnpm 12.9.1. Node was recorded before every WebAssembly build/test, including web build:engine, build and e2e. The pinned toolchain and test tools were already installed.

The panel uses all changes in one answers document, ignores obsolete replies, and copies the returned account balances when keeping savings. Unit evidence covers all 34 slider-start/provenance cases, all seven changed documents and eight exact heads, leap-day ages, range extension, invalid entries, stale replies, reset, generated accounts, kept uncertainty and exact rates. Browser evidence exercises native dragging, release-only calls, every slider and number box by keyboard, all seven changed documents and heads, reset, keep, unchanged saved bytes, all-zero account replacement, example isolation, axe, overflow and origin restrictions.

#### Cumulative native, WebAssembly and web commands

Commands ran in the AGENTS sequence from the workspace root, then from `apps/web/` where indicated. Counts are fresh harness results; no cached test output is counted as a pass. For native commands that run several binaries, the counts below sum their executed tests. WebAssembly test commands used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`.

| Directory | Command | Exit | Seconds | Observed counts/result |
| --- | --- | --- | --- | --- |
| root | `rustup show active-toolchain` | 0 | 0.022 | passed |
| root | `wasm-bindgen-test-runner --version` | 0 | 0.001 | 0.2.129 |
| root | `cargo deny --version` | 0 | 0.023 | 0.20.2 |
| root | `cargo test -p horizon-app intake` | 0 | 64.853 | 28 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values_intake` | 0 | 31.486 | 5 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app answers` | 0 | 6.189 | 10 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 5.391 | 6 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app compare` | 0 | 0.431 | 3 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app immutability` | 0 | 0.128 | 1 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app export` | 0 | 4.588 | 2 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 0.341 | 1 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-engine tax` | 0 | 2.728 | 2 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 0.226 | 4 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 0.139 | 11 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app --test reference_values` | 0 | 0.113 | 7 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-engine ledger` | 0 | 0.067 | 2 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-engine money` | 0 | 0.083 | 2 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-app validation` | 0 | 0.417 | 5 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-parity` | 0 | 50.346 | 18 passed, 0 failed, 0 ignored |
| root | `cargo test --workspace` | 0 | 238.296 | 112 passed, 0 failed, 0 ignored |
| root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | 12.105 | passed |
| root | `cargo fmt --all --check` | 0 | 0.136 | passed |
| root | `cargo test --workspace --release` | 0 | 87.65 | 112 passed, 0 failed, 0 ignored |
| root | `cargo build --workspace --release` | 0 | 5.458 | passed |
| root | `node --version` | 0 | 0.005 | v24.22.0 |
| root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | 6.997 | passed |
| root | `node --version` | 0 | 0.005 | v24.22.0 |
| root | `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 176.987 | 18 passed, 0 failed, 0 ignored |
| root | `node --version` | 0 | 0.005 | v24.22.0 |
| root | `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 17.688 | 1 passed, 0 failed, 0 ignored |
| root | `cargo deny check licenses` | 0 | 0.167 | passed |
| root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | 0.5 | partial; under 2 seconds |
| root | `node --version` | 0 | 0.004 | v24.22.0 |
| root | `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 7.29 | 1 passed, 0 failed, 0 ignored |
| root | `cargo test -p horizon-wasm` | 0 | 9.09 | 5 passed, 0 failed, 0 ignored |
| root | `node --version` | 0 | 0.005 | v24.22.0 |
| root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | 0.066 | passed |
| apps/web | `node --version` | 0 | 0.002 | v24.22.0 |
| apps/web | `corepack --version` | 0 | 0.031 | 0.36.0 |
| apps/web | `corepack pnpm --version` | 0 | 0.042 | 12.9.1 |
| apps/web | `corepack pnpm install --frozen-lockfile` | 0 | 21.272 | passed |
| apps/web | `node --version` | 0 | 0.004 | v24.22.0 |
| apps/web | `corepack pnpm run build:engine` | 0 | 0.287 | passed |
| apps/web | `corepack pnpm run types` | 0 | 0.461 | passed |
| apps/web | `corepack pnpm run typecheck` | 0 | 2.284 | passed |
| apps/web | `corepack pnpm run lint` | 0 | 3.292 | passed |
| apps/web | `corepack pnpm run format:check` | 0 | 0.977 | passed |
| apps/web | `corepack pnpm test` | 0 | 9.766 |  Test Files  19 passed (19);       Tests  237 passed (237) |
| apps/web | `node --version` | 0 | 0.002 | v24.22.0 |
| apps/web | `corepack pnpm run build` | 0 | 3.009 | passed |
| apps/web | `corepack pnpm exec playwright install chromium webkit` | 0 | 0.536 | passed |
| apps/web | `node --version` | 0 | 0.002 | v24.22.0 |
| apps/web | `corepack pnpm run e2e` | 0 | 1058.776 |   96 passed (17.6m) |
| apps/web | `corepack pnpm run licenses` | 0 | 0.339 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| root | `git diff --check` | 0 | 0.015 | passed |

Release `intake_v2_timing` output (ten runs per case):

```text
v2-working-complete: mean 89.801 ms (10 runs)
v2-solve-spending: mean 168.519 ms (10 runs)
v2-solve-savings: mean 65.923 ms (10 runs)
v2-solve-retirement: mean 110.922 ms (10 runs)
v2-solve-savings-with-range: mean 286.153 ms (10 runs)
```

The isolated WebAssembly levers test harness reported: test result: ok. 1 passed; 0 failed; 0 ignored; 14 filtered out; finished in 5.59s.

#### Expanded CLI checks

All 426 CLI invocations had the expected exit and canonical JSON plus exactly one newline. The native CLI integration suites compare command bytes against application operations. The 54 separately extracted intake documents also matched their committed reference result objects.

Each intake command is `cargo run -p horizon-cli -- intake target/0002-W7-intake/<milestone>/<case>.json`, expanded once per row below. The generated input files are ignored build artifacts, not changes to references.

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

Each fixture row expands these seven commands once, in the displayed operation order: `cargo run -p horizon-cli -- spend <name>`, `levers <name>`, `impact <name> packages/app/test-data/empty-rough.json`, `run <name>`, `compare A-drawdown <name>`, `export <name>` and `dev-run <name>`. Each cell is the observed exit for one invocation. Status mapping is 0 complete, 3 partial, 1 invalid, 2 unsupported; dev-run retains 0 for partial. Export status is its embedded run status.

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

Additional reference pairs, explicit rough input and all committed golden/rejection imports:

| Command | Exit | Status |
| --- | --- | --- |
| `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial |
| `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete |
| `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial |
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

#### Browser evidence and design checks

Actual browser-version annotations: `chromium 153.0.8010.12`, `webkit 26.6`. Playwright 1.63.0 ran its matched browsers. 96 tests passed across 8 projects, with zero failed, flaky or skipped tests.

| Project | Passed |
| --- | --- |
| `chromium-1280-dark` | 12 |
| `chromium-1280-light` | 12 |
| `chromium-375-dark` | 12 |
| `chromium-375-light` | 12 |
| `webkit-1280-dark` | 12 |
| `webkit-1280-light` | 12 |
| `webkit-375-dark` | 12 |
| `webkit-375-light` | 12 |

The suite saved 1536 original full-page PNGs (excluding attachment copies), plus HTML/JSON reports outside the repository. Every project captured the existing screens and the new panel's starting, changed, reset, kept, keyboard and invalid-entry states. Both browser families ran at 375×812 and 1280×800 in light and dark. Captures were checked against design references 12–13; the brief controls the differences: Starting values Horizon used precedes the panel, and unspecified rates say Horizon used rather than Your answer. The actual plan body is retained instead of the illustrative placeholder. The retirement track follows the brief's minimum at the next birthday, rather than the illustrative track position. Native range controls keep the browser's platform appearance. No horizontal overflow or axe violations were observed. Existing e2e checks retain exact CSP, sample, comparison, export and privacy guarantees.

#### Preliminary runs and exclusions

Before the source revision, frozen dependency installation and type generation passed. Exploratory typecheck attempts exited 2 while generated engine types were absent and while test fixture casts/options were being corrected; subsequent typecheck, lint and format checks passed. Early unit runs passed 224, 235 and 236 tests as coverage was added; the last focused run passed 60 tests across the two new files. A build:engine attempt invoked from the workspace root selected pnpm 12.14.0 and was rejected (exit 1); it was rerun from apps/web with pinned pnpm 12.9.1 and Node v24.22.0, exit 0. Preliminary production builds passed with Node v24.22.0. Playwright install chromium webkit exited 0. The first two-project phone browser run exited 1 with 2 passed and 2 failed: a new test incorrectly expected reset to age 78 instead of the committed ranged baseline age 84. The test now compares reset with the original head. A fresh two-project run passed all 4 tests. The full cumulative sequence above then reran the final committed source and tests. Preliminary results are not substituted for any required cumulative command.

Scope exclusions are exactly the brief: example-household panels (examples retain Try a change and Compare); sliders for pay, spending now, account kinds and plan length (later brief); updating during a drag (decision 0019 item 14); and engine changes (none). No validation command or browser project was excluded. Independent review remains a maintainer handoff step; the implementer did not act as reviewer.
