BRIEF VERSION: 0002-W4 v2 (2026-10-19)

# 0002-W4 — Answers to plan: incomplete answers and ranges

## Outcome

A person can answer Horizon's questions with a figure, a range, or "not yet", and still get an honest result. One application operation turns their answers into an engine run. It:
- says what is still needed when a plan cannot be worked out yet;
- runs without optional answers and says which way the result leans;
- uses stated starting values where a person gave none;
- turns ranges into a central result with a worse and a better bound.

The engine core is unchanged and still runs only on a complete input, which the operation also returns, so every result stays reproducible. The command line and the browser module return identical results. No screen changes in this milestone.

Version 2 settles five rules that version 1 left open (decision 0017, amendment 2: B1–B5) and adds seven reference cases. Each is marked **(v2)** below; everything else is unchanged.

## Deliverables

1. **The answers document, `answers.v1`** (decision 0017, item 2), with a published schema. Top level:

   | Field | Content |
   | --- | --- |
   | `format`, `version` | `"horizon-answers"`, `1` |
   | `valuation_date` | The date the answers apply to (`YYYY-MM-DD`) |
   | `planning` | `"alone"` or `"partner"` |
   | `birth_date` | `{"date": "YYYY-MM-DD"}` or `{"later": true}` |
   | `retired` | `true` or `false` |
   | `retirement` | When `retired` is false: `{"age": n}`, `{"date": "YYYY-MM-DD"}` or `{"later": true}` |
   | `plan_end_age` | Whole number; optional |
   | `pay`, `spending_now` | Money answers; asked only when `retired` is false |
   | `pay_ends` | `{"at_retirement": true}` (the default) or `{"date": "YYYY-MM-DD"}` |
   | `social_security` | `{"expects": "yes" \| "no" \| "not_sure", "start_age"?: n, "amount"?: money}` |
   | `pension` | `{"expects": "no"}` or `{"expects": "yes", "amount": money, "start_age": n, "rises_with_prices": "yes" \| "no" \| "not_sure"}` |
   | `savings` | `{"none": true}`, `{"later": true}` or `{"accounts": [account, …]}` |
   | `spending_in_retirement` | A money answer, or `{"same_as_now": true}` |
   | `assumptions` | Optional overrides by identifier: `cash_return`, `inflation`, `investment_return`, `tax_indexing`, each a decimal string |
   | `not_sure` | Answer names the person marked "not sure" |

   - **A money answer** is `{"cents": n, "per": "year" | "month"}`, `{"range": {"low_cents": n, "high_cents": n}, "per": …}` or `{"later": true}`; `per` defaults to `"year"`.
   - **An account** is `{"kind": "cash" | "taxable" | "employer_plan" | "traditional_ira" | "roth", "balance": {"cents": n} | {"range": {…}}, "cost_basis"?: {"cents": n} | {"later": true}}`; `cost_basis` applies to `taxable` only.
2. **The operation `plan_from_answers(answers)`** in `horizon-app` (decision 0017 items 1, 3–9, amendment 1 A1–A9 and amendment 2 B1–B5). In order:
   1. **Unsupported:** `planning: "partner"` returns `unsupported` with `ANSWERS_ONE_PERSON_ONLY`; no run.
   2. **Needed for any plan** (item 4): if `birth_date` is later; or `retired` is false and `retirement` is later or absent; or `savings` is later; or `spending_in_retirement` is later, or is "same as now" while the person is retired or `spending_now` is later. The result is `incomplete`, with `needed` listing `birth_date`, `retirement`, `savings`, `spending_in_retirement` in that order, as they apply; no run.
   3. **Invalid answers,** checked only on answers the plan uses (see "Unused answers" in step 4) and in this order **(v2, B3)**: first any range whose low is above its high, `ANSWERS_RANGE_ORDER`; then any negative amount or range end, `ANSWERS_NEGATIVE_AMOUNT`; then a retirement date not after `valuation_date` while `retired` is false, `ANSWERS_RETIREMENT_NOT_AFTER_VALUATION`. All `invalid`. A pension with a given amount must also give `start_age` and `rises_with_prices`, and a cost basis is allowed only on a `taxable` account; otherwise the existing `MALFORMED_INPUT`.
   4. **Build the household input** exactly as these rules say:
      - **Unused answers (v2, B2):** an answer the plan does not use is ignored: never checked, never run as a range and never listed. These are the Social Security `amount` and `start_age` when `expects` is "no", and `pay`, `spending_now`, `pay_ends` and `retirement` when `retired` is true.
      - **Person:** id `person`; `retirement_date` is `valuation_date` when retired, else the birthday in the year of `retirement.age`, with 29 February becoming 28 February in a non-leap year, or `retirement.date`; `plan_end_age` as given, else 95 (a starting value).
      - **Money:** a monthly amount is twelve times its cents. A range's middle is (low + high) / 2, rounded half away from zero to the cent. **(v2, B1)** For a monthly range, each end is multiplied by twelve first, and the middle and the worse and better ends are taken from those yearly ends, so the middle is exact: $1.00–$1.01 a month is $12.00–$12.12 a year, middle $12.06. Every pay, spending and Social Security amount is in today's dollars.
      - **Pay:** one wage from `valuation_date` to the retirement date (or `pay_ends.date`), in today's dollars; none when retired or left out.
      - **Spending:** before retirement from `spending_now`; in retirement from `spending_in_retirement`, or the same answer as `spending_now` (one answer, so a range moves both); when retired, before-retirement spending equals spending in retirement.
      - **Social Security:** `expects: "no"` gives $0 at 67. Otherwise the amount, in today's dollars, from `start_age`, else 67 (a starting value); `not_sure` counts as yes.
      - **Pension:** `expects: "no"` gives $0, nominal, at 65. **(v2, B4)** So does an amount that is "later", whatever its `start_age` and `rises_with_prices`, and it adds no starting value. Otherwise the amount from `start_age`, in today's dollars when it rises with prices, nominal when it does not or when "not sure" (a starting value, likely too pessimistic).
      - **Accounts:** in answer order, ids `<kind>-<n>` with kinds `cash`, `taxable`, `employer-plan`, `traditional-ira`, `roth`; owner `person`; `employer_plan` and `traditional_ira` are tax-deferred with that plan kind. A taxable account with no cost basis uses its balance (it follows a ranged balance): a starting value, may be too optimistic. `savings: {"none": true}` gives no accounts.
      - **Assumptions:** each of the four identifiers, sorted, with `effective_year` the valuation year, unit `decimal_fraction_per_year`, source `user`, and `user_overrode_default` true only when overridden. Defaults: cash return 0.02, inflation 0.025, investment return 0.05, tax-threshold indexing 0.025 (starting values when not overridden).
   5. **Left out, with direction** (item 5): Social Security amount later (too pessimistic); pension amount later (too pessimistic); pay later with spending now given (no wage; too pessimistic); spending now later with pay given (before-retirement spending $0; too optimistic); both later (neither; `pay_and_spending_now`, direction not stated). Omission texts exactly as in the reference values.
   6. **Run** the household input with the existing run and sustainable-spending operations. The status is the run's, raised to `partial` when anything is left out.
   7. **Ranges** (amendment A5): for each ranged answer, with the others at their middle, compute headroom at its low and at its high; the worse end has the lower headroom (a tie takes the low end); spread = |headroom at high − headroom at low|. Run every ranged answer at its worse end, and at its better end. Each bound reports headroom, sustainable spending, first shortfall age (or null) and whether savings last to the plan's end. `ordered` is true only when the central headroom lies between the two bounds. Ranked by spread, largest first, then answer name.
3. **The result, `answers-plan.v1`,** with a published schema: `status`; `needed`; `code` (for unsupported and invalid); `household_input` (the complete generated input); `central` (run status, omissions, first shortfall age, lasts to the plan's end, headroom, sustainable spending); `bounds` (null without ranges); `left_out`; `starting_values`; `not_sure`, as given, in the person's order **(v2, B5)**. Field names and shapes as in the reference values.
4. **Command line:** `horizon intake <answers.json>` prints the result as canonical JSON and a newline. Exit codes: 0 complete, 3 partial, 4 incomplete, 1 invalid, 2 unsupported. The command line contains no rule.
5. **Browser module:** `horizon-wasm` exposes `plan_from_answers`, returning the same bytes as native.
6. **Error codes:** the four new codes in `docs/model/error-codes.md`.
7. **Documentation:** `docs/model/answers.md` gains a section on answers and ranges; `AGENTS.md` and `README.md` list the cumulative validation, including the new commands; `docs/model/dependencies.md` stays accurate. No new dependency is expected; any new crate needs escalation.

## Done when

1. **Every reference case matches exactly:** for each of the 29 cases (22 from v1, unchanged, and 7 added in v2) in `docs/briefs/0002-W4-reference-values.json`, `plan_from_answers` on its `answers` returns its `result`, field for field, including the generated `household_input`, `central`, `bounds`, `left_out`, `starting_values` and `needed`.
2. **Samples reproduced:** answers describing `answers-working-61` and `synthetic-retired` give the same headroom, sustainable spending, first shortfall age and run status as those samples (cases `working-complete` and `already-retired`).
3. **Rules:** the 29 February rule, monthly amounts, "same as now" with a value and with a range, no savings, missing cost basis and a "not sure" pension each have a unit test; so does each v2 rule: a monthly range with an odd sum (B1), each unused answer (B2), the check order (B3), a pension left out with each `rises_with_prices` value (B4) and `not_sure` order (B5).
4. **Bounds:** a test with a replaceable run function in which the central headroom falls outside the bounds gives `ordered: false`.
5. **Contracts:** both schemas are generated with `schemars`, published under `docs/model/schemas/`, and covered by drift tests; every result validates against `answers-plan.v1`.
6. **Command line:** `horizon intake` over every reference case prints output byte-identical to the operation, with the stated exit code.
7. **WebAssembly parity:** the reference cases pass on `wasm32-unknown-unknown` under Node.js 24.22.0, byte-identical to native.
8. **Earlier guarantees hold:** every earlier test, reference file, golden and v1/v2 schema is unchanged; no floating-point or unchecked integer arithmetic; the engine uses no host facilities; the license checks pass; the web app's tests, build and end-to-end suite pass unchanged.

## Reference values

Derived independently from decision 0017 and its two amendments: a separate program builds each household input from the answers by the rules above and runs the existing, reviewed `horizon run` and `horizon spend` on it. As a cross-check, answers describing `answers-working-61` and `synthetic-retired` reproduce those samples' results exactly, and every stated direction was confirmed by comparing the result with and without the answer.

Commit the values exactly as given. If a value seems wrong, escalate; do not change it.

## Read first

- `DESIGN.md` and `AGENTS.md`.
- `docs/model/engine-foundations.md`, `docs/model/answers.md`, `docs/model/error-codes.md`.
- Decision records `docs/decisions/0003-*` (money and time), `0006-*` (surplus), `0007-*` (layering), `0010-*` (command line), `0012-*` (answer operations) and `0017-*` (incomplete answers and ranges), with their amendments.

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

The full sequence in `AGENTS.md` (Rust, then the web shell, including Playwright install and `corepack pnpm run e2e` in all three browsers), with these additions in the Rust part:

1. `cargo test -p horizon-app intake` — the operation's unit tests, in a module named `intake`.
2. `cargo test -p horizon-app --test reference_values_intake` — every reference case.
3. `cargo run -p horizon-cli -- intake <path>` over every reference case's answers, recording each exit status.
4. The WebAssembly parity command, which now includes the intake reference cases; record `node --version`.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Every screen,** including the new intake and its results states: a later milestone.
- **The plan file format:** unchanged; an export holds the generated input and its run, not the answers document.
- **More than one person:** unsupported, as before.
- **Contribution modeling, state tax and the other listed omissions:** unchanged.
- **Spoken or free-text answers:** out of scope.

## Implementation record

Appended by the implementer before handoff, as **Implementation record — v2**, replacing any earlier record: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

## Implementation record — v2

- Branch: `codex/0002-W4-answers-to-plan`.
- Source/test revision validated: `21fe67e226792da796ed0cd970089ce30c996ecf`.
  This record is committed after that revision; the final branch tip is in the handoff.
- The branch was rebased onto main `fcf9feb`; main's v2 brief was kept and
  the v1 implementation record removed. This record replaces it.
- B1: monthly range ends are converted to checked yearly cents before taking
  the middle or running endpoint trials. The odd-sum example generates
  6,600,006 cents before retirement; $1.00–$1.01 monthly becomes $12.06 yearly.
- B2: unused pay, spending now, pay end and retirement answers when retired,
  and unused Social Security amount/start age when expecting none, produce no
  validation error, range trials, left-out entry or starting value.
- B3 and B5: the existing unsupported/needed/range-order/sign/retirement check
  order and the person's exact `not_sure` order are retained and tested.
- B4: a pension amount left for later is zero nominal dollars at 65, with no
  pension starting value, for every price adjustment and start-age choice.
- All 29 reference cases match field for field and as canonical bytes. The
  original 22 cases remain unchanged. Sixteen intake unit tests include the
  seven v2 tests for annual middles/trials, each unused answer, validation
  precedence, every pension price choice, `not_sure` order and malformed fields.
- New dependencies: none. Both answers schemas, all earlier schemas, golden
  files, engine core, lockfiles and web source/tests are unchanged from the
  implementation carried into this rebase. The v2 reference JSON is exactly main's.
- Tools: Rust/cargo 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner
  0.2.129, Node v24.22.0 from `/usr/local/bin`, corepack 0.36.0 and pnpm
  12.9.1 selected by `apps/web/package.json`. `node --version` printed
  v24.22.0 before every WebAssembly validation command and every web command.
  WebAssembly tests used
  `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`.

### Cumulative Rust validation

These commands ran from the workspace root in the required order. Counts sum
all executed harnesses; filtered tests are not passes. Commands with no test
harness show a dash. Version commands exited 0: `rustc --version`,
`cargo --version`, `wasm-bindgen-test-runner --version`, and `cargo deny --version`.

| Command | Exit | Passed | Failed | Ignored | Filtered |
| --- | --- | --- | --- | --- | --- |
| `cargo test -p horizon-app intake` | 0 | 18 | 0 | 0 | 42 |
| `cargo test -p horizon-app --test reference_values_intake` | 0 | 2 | 0 | 0 | 0 |
| `cargo test -p horizon-app answers` | 0 | 10 | 0 | 0 | 50 |
| `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 | 0 | 0 | 0 |
| `cargo test -p horizon-app compare` | 0 | 3 | 0 | 0 | 57 |
| `cargo test -p horizon-app immutability` | 0 | 1 | 0 | 0 | 59 |
| `cargo test -p horizon-app export` | 0 | 2 | 0 | 0 | 58 |
| `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 | 0 | 0 | 0 |
| `cargo test -p horizon-engine tax` | 0 | 2 | 0 | 0 | 8 |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 | 0 | 0 | 0 |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 | 0 | 0 | 0 |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 | 0 | 0 | 0 |
| `cargo test -p horizon-engine ledger` | 0 | 2 | 0 | 0 | 8 |
| `cargo test -p horizon-engine money` | 0 | 2 | 0 | 0 | 8 |
| `cargo test -p horizon-app validation` | 0 | 5 | 0 | 0 | 55 |
| `cargo test -p horizon-parity` | 0 | 16 | 0 | 0 | 0 |
| `cargo test --workspace` | 0 | 96 | 0 | 0 | 0 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — | — | — | — |
| `cargo fmt --all --check` | 0 | — | — | — | — |
| `cargo test --workspace --release` | 0 | 96 | 0 | 0 | 0 |
| `cargo build --workspace --release` | 0 | — | — | — | — |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — | — | — | — |
| `cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 15 | 0 | 0 | 0 |
| `cargo deny check licenses` | 0 | — | — | — | — |
| `cargo build -p horizon-cli --release` | 0 | — | — | — | — |
| `cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 | 0 | 0 | 14 |
| `cargo test -p horizon-wasm` | 0 | 3 | 0 | 0 | 0 |
| `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | — | — | — |

The release CLI was explicitly built with `cargo build -p horizon-cli --release`
before timing `cargo run --release -p horizon-cli -- levers answers-working-61`:
exit 3 (partial), 0.503 seconds wall time, under two seconds.
The isolated WebAssembly levers test passed in 5.00 seconds according to
its harness, with Node v24.22.0 recorded immediately before the command.

### Expanded command-line validation

Every invocation emitted canonical JSON and exactly one newline, with the
expected complete/partial/incomplete/invalid/unsupported exit. Integration
tests additionally compare CLI bytes with the application operations.

Each row is `cargo run -p horizon-cli -- intake <case.answers.json>`, using
that reference case's exact answers. All 29 returned results matched the
reference result as well as their canonical byte and exit contracts.

| Case | Exit | Result status |
| --- | --- | --- |
| `already-retired` | 0 | complete |
| `invalid-negative-before-retirement` | 1 | invalid |
| `invalid-range-order` | 1 | invalid |
| `invalid-range-order-before-negative` | 1 | invalid |
| `invalid-retirement-not-after-valuation` | 1 | invalid |
| `left-out-pay` | 3 | partial |
| `left-out-pay-and-spending-now` | 3 | partial |
| `left-out-pension` | 3 | partial |
| `left-out-social-security` | 3 | partial |
| `left-out-spending-now` | 3 | partial |
| `monthly-and-leap-birthday` | 3 | partial |
| `monthly-range-odd` | 3 | partial |
| `needed-all-four` | 4 | incomplete |
| `needed-birth-date` | 4 | incomplete |
| `needed-retirement` | 4 | incomplete |
| `needed-same-as-now-without-now` | 4 | incomplete |
| `needed-savings` | 4 | incomplete |
| `needed-spending-in-retirement` | 4 | incomplete |
| `no-savings` | 3 | partial |
| `partner` | 2 | unsupported |
| `pension-later-rises-not-sure` | 3 | partial |
| `pension-later-rises-yes` | 3 | partial |
| `range-one-savings` | 3 | partial |
| `range-same-as-now` | 3 | partial |
| `range-two` | 3 | partial |
| `starting-values` | 3 | partial |
| `unused-pay-when-retired` | 0 | complete |
| `unused-social-security-amount` | 3 | partial |
| `working-complete` | 3 | partial |

Each fixture row expands seven commands, one invocation per cell:
`cargo run -p horizon-cli -- spend <name>`, `levers <name>`,
`impact <name> packages/app/test-data/empty-rough.json`, `run <name>`,
`compare A-drawdown <name>`, `export <name>`, and `dev-run <name>`.
Cells contain observed exits: 0 complete, 3 partial, 1 invalid and 2 unsupported;
`dev-run` retains 0 for partial. Export status comes from its embedded run.

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

Additional reference comparisons, the explicit rough-input reference, and all
26 current golden exports plus three rejected exports were checked as follows.

| Command | Exit | Result status |
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

Total explicit CLI invocations: 401, each with its expected exit and canonical newline output.

### Web shell validation

The unchanged web suite ran after the Rust/CLI sequence, from `apps/web`,
including the frozen-lockfile installation and all three Playwright browsers.

| Command | Exit | Observed result |
| --- | --- | --- |
| `node --version` | 0 | v24.22.0 |
| `corepack --version` | 0 | 0.36.0 |
| `corepack pnpm --version` | 0 | 12.9.1 |
| `corepack pnpm install --frozen-lockfile` | 0 | passed |
| `corepack pnpm run build:engine` | 0 | passed |
| `corepack pnpm run types` | 0 | passed |
| `corepack pnpm run typecheck` | 0 | passed |
| `corepack pnpm run lint` | 0 | passed |
| `corepack pnpm run format:check` | 0 | passed |
| `corepack pnpm test` | 0 | 14 passed (14); 93 passed (93) |
| `corepack pnpm run build` | 0 | passed |
| `corepack pnpm exec playwright install chromium firefox webkit` | 0 | passed |
| `corepack pnpm run e2e` | 0 | 48 passed, 0 failed, 0 flaky, 0 skipped; 12 projects; 1991.117s wall time |
| `corepack pnpm run licenses` | 0 | 4 shipped package versions and 358 full-closure package versions passed |

Actual browser-version annotations: `chromium 153.0.8010.12`, `firefox 155.0`, `webkit 26.6`.
All three browsers ran at 375×812 and 1280×800, in light and dark themes,
with every sample in every project. Each of the 12 projects saved the same
111 screenshot states: 1,332 original full-page PNGs, plus report attachment
copies. The HTML/JSON reports and screenshots are outside the repository.
The existing suite checks keyboard access, axe, status labels, overflow,
setup/input-check/plan/compare/export views and privacy; no screen changed.

### Other checks and exclusions

Before the source/test commit, targeted `cargo test -p horizon-app intake --lib`
passed all 16 intake unit tests (exit 0),
`cargo test -p horizon-app --test reference_values_intake` passed both tests
including all 29 cases and schema drift/output validation (exit 0), and
`cargo clippy --workspace --all-targets -- -D warnings` exited 0.
`git diff --check` passed before committing the source changes and this record.
The full sequence above reran the committed source; earlier output was not
counted as a fresh pass. No required validation was excluded.

Exclusions follow v2: every screen and the worker protocol remain for later
work; exports continue to hold generated input/run, leaving the plan file
format unchanged; partner planning remains unsupported; contribution modeling,
state tax and all earlier omissions stay unchanged; spoken and free-text
answers are out of scope. No dependency, route, authorization surface, model
version, tax rule or host facility was added. Independent review remains a
maintainer handoff step; the implementer did not act as reviewer.
