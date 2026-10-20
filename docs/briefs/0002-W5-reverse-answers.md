BRIEF VERSION: 0002-W5 v1.2 (2026-10-20)

# 0002-W5 — Reverse answers and what-if (engine)

## Outcome

A person who does not know their savings, their spending in retirement or when they will retire still gets a plan. The engine works out the one they left for later instead of refusing: the savings they would need, what they could spend, or the earliest age they could retire. An age is enough in place of a date of birth. A what-if is a changed copy of the answers, so every figure a later screen shows comes from the engine, including a new total for savings shared among the person's accounts.

Version 1 answers keep their rules and results exactly. The engine core and the plan file are unchanged. No screen changes in this milestone.

Version 1.1 changes only Done when 8: one earlier unit test used version 2 as its example of an unsupported version, which this brief makes valid. Version 1.2 bounds the what-if total and says what a malformed version 2 document returns (deliverables 1 and 3).

## Deliverables

1. **`answers.v2`,** with a published schema: `answers.v1` with `version` `2` and two additions (decision 0019 items 1, 2 and 10):
   - `birth_date` may also be `{"age": n}`, a whole number;
   - an optional `what_if` object with one optional field, `savings_total_cents` (a whole number of cents). **(v1.2)** It must lie within ±9,007,199,254,740,991, the exact-integer limit of canonical JSON, and the schema states that range; a value outside it does not match `answers.v2`.
2. **`plan_from_answers` accepts version 1 and version 2.** A version 1 document follows brief 0002-W4 v2 and decision 0017 exactly and returns `answers-plan.v1`, byte for byte as today. A version 2 document follows these rules, in this order:
   1. **Unsupported:** `planning: "partner"`, as in version 1.
   2. **Needed:** if `birth_date` is later, `needed` is `["birth_date"]`. Otherwise list, in this order, the answers left for later among `retirement` (when not retired), `savings` and `spending_in_retirement` (later, or "same as now" while retired or with `spending_now` later). `savings` is not left for later when `what_if.savings_total_cents` is given. The result is `incomplete` with that list as `needed` when it has two or more entries, or when it is `["retirement"]` and `pay` is also later or absent.
   3. **Invalid,** in this order: `ANSWERS_RANGE_ORDER`, then `ANSWERS_NEGATIVE_AMOUNT` (both on the answers the plan uses, as in version 1, including `what_if.savings_total_cents`), then `ANSWERS_AGE_RANGE` (an age below 18 or above 110), then `ANSWERS_RETIREMENT_NOT_AFTER_VALUATION`.
   4. **An age:** the date of birth is the valuation date `n` years earlier, with 29 February becoming 28 February in a non-leap year. Starting value `{"answer": "birth_date", "value": "<that date>"}`, with no direction.
   5. **A what-if savings total** is shared among the accounts in proportion to their balances (a ranged balance counts at its middle), in answer order: each account gets ⌊total × balance ÷ sum⌋ cents, and the cents left over go one each to the largest remainders, ties to the earlier account. The shared balances replace the answers' balances and ranges. With no accounts, or balances summing to $0, the total becomes one account as in step 7 below, with its starting value.
   6. **Nothing left for later:** build and run exactly as version 1, including ranges (decision 0017 amendment A5), with `solved` null.
   7. **One left for later is worked out** (`solved`: `answer`, `value`, `unit` `"cents"` or `"age"`, `flag`):
      - **`spending_in_retirement`:** set it to $0, run the existing sustainable-spending operation, and use its `sustainable_spending` (in cents) and its `flag` (`at_or_above_cap` or `shortfall_with_no_retirement_spending`, else null). The household input and run use that amount.
      - **`savings`:** one account `taxable-1` (kind taxable, owner `person`, cost basis equal to its balance). Run at $0: no shortfall gives 0 with flag `none_needed`. Run at $100,000,000: a shortfall gives null with flag `unreachable`. Otherwise low = 0, high = 100,000,000 dollars; while high − low > 1, run at ⌊(low + high) ÷ 2⌋ dollars and set high to it when that run has no shortfall, low otherwise; the answer is high dollars, in cents. Starting value `{"answer": "savings", "value": "a brokerage account with no gain to tax", "direction": "too_optimistic"}`.
      - **`retirement`:** try each whole age `a` in order, from the first age whose birthday (decision 0017 item 3) falls after the valuation date up to `plan_end_age − 1`, retiring on that birthday; the answer is the first with no shortfall through the plan's end. None gives null with flag `unreachable`.
      - "No shortfall" means every projected year's ledger shortfall is zero. With `unreachable`, the household input and run are those at the search's limit (savings $100,000,000; retirement at `plan_end_age − 1`).
   8. **Ranges with a worked-out answer** (decision 0019 item 8): for each ranged answer in name order, with the others at their middle, work out the value at its low and at its high end. The worse end gives the worse value: lower spending, higher savings, a later age, and null is worse than any value; a tie takes the low end. `spread` is the absolute difference, or null when either is null. Work it out with every ranged answer at its worse end and at its better end. Each bound reports the version 1 bound fields plus `solved` (`value`, `flag`). `ordered` is true only when all three values are present and the central value is neither worse than the worse bound nor better than the better bound. `ranked` entries are `answer`, `worse_end`, `value_at_low`, `value_at_high`, `spread`, ranked by spread, largest first (null first), then answer name.
   9. **Status** is the run's, raised to `partial` when anything is left out, as in version 1. Starting values are version 1's in their order, then `birth_date` (from an age), then `savings` (from a worked-out answer or a what-if total).
3. **`answers-plan.v2`,** with a published schema: every `answers-plan.v1` field, plus `solved` (null or as above) and `what_if` (echoed as given, or null), in every result whatever its status. Field names and shapes as in the reference values.
   - **Malformed documents (v1.2):** a document whose `version` is `2` but which does not match `answers.v2` returns an `answers-plan.v2` result with status `invalid`, code `MALFORMED_INPUT`, `needed`, `left_out`, `starting_values` and `not_sure` empty, and every other field null, including `what_if`: nothing from a malformed document is echoed. Any other document that cannot be read keeps today's version 1 malformed result.
4. **Command line and browser module:** `horizon intake` and the `horizon-wasm` export take either version and print or return the same bytes; exit codes as today (0 complete, 3 partial, 4 incomplete, 1 invalid, 2 unsupported). Neither contains a rule.
5. **Error code:** `ANSWERS_AGE_RANGE` in `docs/model/error-codes.md`.
6. **Browser timing** (decision 0019 item 14): a WebAssembly test `intake_v2_timing` that runs `plan_from_answers` ten times on each of `v2-working-complete`, `v2-solve-spending`, `v2-solve-savings`, `v2-solve-retirement` and `v2-solve-savings-with-range`, and prints each case's mean time in milliseconds. Record its output, run with `--release` under Node.js 24.22.0, in the implementation record.
7. **Documentation:** `docs/model/answers.md` gains a version 2 section (worked-out answers, ages, what-if); `AGENTS.md` and `README.md` list the cumulative validation with the new commands; `docs/model/dependencies.md` stays accurate. No new dependency is expected; any new crate needs escalation.

## Done when

1. **Every reference case matches exactly:** for each of the 25 cases in `docs/briefs/0002-W5-reference-values.json`, `plan_from_answers` on its `answers` returns its `result`, field for field.
2. **Version 1 unchanged:** every 0002-W4 reference case still matches byte for byte, and `answers.v1` and `answers-plan.v1` schemas are unchanged.
3. **Rules:** unit tests cover the needed combinations (birth date first; two or three left; retirement without pay), each search with each flag, the savings boundary (no shortfall at the answer, a shortfall one dollar less), an age with a 29 February valuation date, the check order, the shared total with a remainder, and ranges with a worked-out value including a null.
4. **Bounds:** a test with a replaceable run function in which the central value falls outside the bounds gives `ordered: false`.
5. **Contracts:** both version 2 schemas are generated with `schemars`, published under `docs/model/schemas/`, and covered by drift tests; every version 2 result validates against `answers-plan.v2`.
6. **Command line:** `horizon intake` over every reference case of both milestones prints output byte-identical to the operation, with the stated exit code.
7. **WebAssembly parity:** the reference cases of both milestones pass on `wasm32-unknown-unknown` under Node.js 24.22.0, byte-identical to native; `intake_v2_timing` runs and its figures are recorded.
8. **Earlier guarantees hold:** every earlier test, reference file, golden and schema is unchanged, with one exception **(v1.1)**: in the unit test `intake_structural_and_arithmetic_errors_keep_one_result_shape`, the unsupported `version` input changes from `2` to `3`, and nothing else in that test changes; no floating-point or unchecked integer arithmetic; the engine uses no host facilities; the license checks pass; the web app's tests, build and end-to-end suite pass unchanged.

## Reference values

Derived independently from decision 0019 and decision 0017 with its two amendments: a separate program builds each household input by the rules above and runs the existing, reviewed `horizon run` and `horizon spend` on it. As cross-checks: a version 1 document gives the 0002-W4 result exactly; a worked-out spending equals the sustainable spending of the same plan; the worked-out savings lasts and one dollar less does not; the earliest retirement age matches a sweep of ages; a shared total adds up exactly; and the bounds with a worked-out value are ordered.

Commit the values exactly as given. If a value seems wrong, escalate; do not change it.

## Read first

- `DESIGN.md` and `AGENTS.md`.
- `docs/model/engine-foundations.md`, `docs/model/answers.md`, `docs/model/error-codes.md`.
- Decision records `docs/decisions/0003-*`, `0006-*`, `0007-*`, `0010-*`, `0012-*` (the sustainable-spending search), `0017-*` and `0019-*` (reverse answers and what-if), with their amendments.
- Brief `docs/briefs/0002-W4-answers-to-plan.md` v2, whose rules version 1 keeps.

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

The full sequence in `AGENTS.md` (Rust, then the web shell, including Playwright install and `corepack pnpm run e2e` in all three browsers), with these additions in the Rust part:

1. `cargo test -p horizon-app intake` — the unit tests, including the version 2 rules.
2. `cargo test -p horizon-app --test reference_values_intake` — every reference case of both milestones.
3. `cargo run -p horizon-cli -- intake <path>` over every reference case of both milestones, recording each exit status.
4. The WebAssembly parity command, which includes both milestones' cases; then `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture`. Record `node --version` with each.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Every screen,** including the what-if panel: a later milestone, which sets how the panel waits from the recorded timings.
- **Storage of answers** on the device: a later milestone.
- **Solving for two answers at once,** and solving for anything other than the three named answers.
- **The plan file format:** unchanged.
- **More than one person:** unsupported, as before.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, the timing output, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### Implementation record — 0002-W5 v1.2 (2026-10-20)

- Branch: `codex/0002-W5-reverse-answers`, rebased onto main `7a2ea89`, preserving the earlier implementation.
- Source/test revision validated: `432d339046efb046ac753ba4bf60dfac114377cb`. This record is committed afterward; the final branch tip is reported separately in the handoff.
- Version 2 includes reverse spending/savings/retirement searches, birthday-age conversion, proportional savings what-ifs and solved-value ranges. The empty retirement-search boundary returns the required unreachable result at the search limit. Version 1 retains its types, schemas and results; the only changed earlier assertion is the v1.1-authorized unsupported-version input, 2 to 3.
- V1.2 bounds the what-if total in parsing and both generated v2 schemas. Malformed version 2 documents return the full empty `MALFORMED_INPUT` envelope with nothing echoed, before planning/needed checks. Eighteen malformed cases prove native, schema, CLI and WebAssembly contracts, including both out-of-range signs, wrong types, missing/unknown fields and date shapes. Exact boundary totals retain their ordinary planning/sign outcomes and echo. Browser-binding tests cover the malformed envelope separately.
- Earlier references, goldens, schemas, engine core, Cargo.lock, web source and web tests are unchanged. New dependencies: none. No model/tax version, route, hosted authorization surface or plan-file format changed.
- Tools: Rust/cargo 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129, Node v24.22.0, corepack 0.36.0 and pnpm 12.9.1. Node was recorded immediately before every WebAssembly command, including web engine builds. WebAssembly execution used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`; harness timeout 600 seconds.

#### Cumulative Rust validation

Commands ran in the AGENTS order against the committed source. Counts sum all executed harnesses; filtered tests are not passes. A dash denotes a command without Rust test counts. Expected partial/incomplete/error CLI exits are recorded below.

| Command | Exit | Passed | Failed | Ignored | Filtered | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- |
| `rustc --version` | 0 | — | — | — | — | 0.027 |
| `cargo --version` | 0 | — | — | — | — | 0.021 |
| `cargo deny --version` | 0 | — | — | — | — | 0.021 |
| `wasm-bindgen-test-runner --version` | 0 | — | — | — | — | 0.005 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `cargo test -p horizon-app intake` | 0 | 28 | 0 | 0 | 42 | 44.927 |
| `cargo test -p horizon-app --test reference_values_intake` | 0 | 5 | 0 | 0 | 0 | 31.959 |
| `cargo test -p horizon-app answers` | 0 | 10 | 0 | 0 | 60 | 5.941 |
| `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 | 0 | 0 | 0 | 4.969 |
| `cargo test -p horizon-app compare` | 0 | 3 | 0 | 0 | 67 | 0.415 |
| `cargo test -p horizon-app immutability` | 0 | 1 | 0 | 0 | 69 | 0.139 |
| `cargo test -p horizon-app export` | 0 | 2 | 0 | 0 | 68 | 4.587 |
| `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 | 0 | 0 | 0 | 0.342 |
| `cargo test -p horizon-engine tax` | 0 | 2 | 0 | 0 | 8 | 0.056 |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 | 0 | 0 | 0 | 0.197 |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 | 0 | 0 | 0 | 0.117 |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 | 0 | 0 | 0 | 0.059 |
| `cargo test -p horizon-engine ledger` | 0 | 2 | 0 | 0 | 8 | 0.048 |
| `cargo test -p horizon-engine money` | 0 | 2 | 0 | 0 | 8 | 0.047 |
| `cargo test -p horizon-app validation` | 0 | 5 | 0 | 0 | 65 | 0.365 |
| `cargo test -p horizon-parity` | 0 | 18 | 0 | 0 | 0 | 43.007 |
| `cargo test --workspace` | 0 | 112 | 0 | 0 | 0 | 231.214 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — | — | — | — | 0.197 |
| `cargo fmt --all --check` | 0 | — | — | — | — | 0.1 |
| `cargo test --workspace --release` | 0 | 112 | 0 | 0 | 0 | 49.011 |
| `cargo build --workspace --release` | 0 | — | — | — | — | 3.285 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — | — | — | — | 1.047 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 18 | 0 | 0 | 0 | 151.275 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 1 | 0 | 0 | 2 | 12.995 |
| `cargo deny check licenses` | 0 | — | — | — | — | 0.199 |
| `cargo build -p horizon-cli --release` | 0 | — | — | — | — | 3.746 |
| `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | — | — | — | — | 0.451 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 | 0 | 0 | 14 | 6.535 |
| `cargo test -p horizon-wasm` | 0 | 5 | 0 | 0 | 0 | 4.152 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | — | — | — | 2.541 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `node --version` | 0 | — | — | — | — | 0.002 |
| `node --version` | 0 | — | — | — | — | 0.002 |
| `node --version` | 0 | — | — | — | — | 0.011 |
| `node --version` | 0 | — | — | — | — | 0.004 |

The CLI release target was explicitly built after the workspace release build, before timing levers: exit 3, 0.451 seconds wall time, below two seconds.
The isolated WebAssembly levers harness reported 5.11 seconds. Node v24.22.0 was recorded immediately before it.

Release WebAssembly intake timing output, under Node v24.22.0:

```text
v2-working-complete: mean 83.055 ms (10 runs)
v2-solve-spending: mean 160.508 ms (10 runs)
v2-solve-savings: mean 63.504 ms (10 runs)
v2-solve-retirement: mean 115.377 ms (10 runs)
v2-solve-savings-with-range: mean 302.745 ms (10 runs)
```

#### Expanded CLI validation

Each intake row expands `cargo run -p horizon-cli -- intake <case.answers.json>` using that reference case’s exact extracted answers. All 54 returned results matched their references. Integration tests also compare exact canonical CLI/application bytes and the trailing newline.

| Reference set / case | Exit | Result status |
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

The additional `cargo run -p horizon-cli -- intake <v12-out-of-range.json>` regression (the v2 working reference with total 9,007,199,254,740,992 cents and `not_sure: ["savings"]`) exited 1 with the complete v2 `MALFORMED_INPUT` result, empty lists and null `what_if`; canonical serialization succeeded. The CLI integration test repeats all 18 malformed-document cases.

Each fixture row expands seven commands: `cargo run -p horizon-cli -- spend <name>`, `levers <name>`, `impact <name> packages/app/test-data/empty-rough.json`, `run <name>`, `compare A-drawdown <name>`, `export <name>` and `dev-run <name>`. Cells are observed exits; dev-run retains 0 for partial, and export status is its embedded run status.

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

Additional reference comparisons, explicit rough inputs and all current golden/rejection imports:

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

Total explicit CLI invocations: 427. Every CLI invocation had its expected exit and canonical JSON output.

#### Web shell validation

The unchanged web suite ran after Rust/CLI validation, including frozen-lockfile installation, production build and all three Playwright browsers. The configured three-worker run with failure tracing returned 45 passed and 3 WebKit comparison timeouts (600 seconds each). Its report/traces were retained separately. The first isolated command used an anchored title filter that matched no tests (exit 1, zero executed); the filter was corrected without changing a test. A failing case then passed in isolation with one worker and tracing off; a complete fresh run with `--trace=off` passed all 48 tests at the original three-worker concurrency. Test source, assertions, projects, samples and screenshot capture were unchanged. Only diagnostic trace instrumentation was disabled for these retries.

| Command (from apps/web) | Exit | Wall seconds | Observed result |
| --- | --- | --- | --- |
| `node --version` | 0 | 0.003 | v24.22.0 |
| `corepack --version` | 0 | 0.038 | 0.36.0 |
| `corepack pnpm --version` | 0 | 0.075 | 12.9.1 |
| `corepack pnpm install --frozen-lockfile` | 0 | 6.268 | passed |
| `corepack pnpm run build:engine` | 0 | 0.207 | passed |
| `corepack pnpm run types` | 0 | 0.328 | passed |
| `corepack pnpm run typecheck` | 0 | 1.906 | passed |
| `corepack pnpm run lint` | 0 | 2.703 | passed |
| `corepack pnpm run format:check` | 0 | 0.733 | passed |
| `corepack pnpm test` | 0 | 6.059 | Test Files  14 passed (14); Tests  93 passed (93) |
| `corepack pnpm run build` | 0 | 2.407 | passed |
| `corepack pnpm exec playwright install chromium firefox webkit` | 0 | 0.461 | passed |
| `corepack pnpm run e2e` | 1 | 2486.586 | 45 passed; 3 WebKit comparison timeouts; 0 flaky/skipped; 12 projects |
| `corepack pnpm run licenses` | 0 | 0.55 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |
| `corepack pnpm run e2e --project=webkit-375-light --grep=^compare: --workers=1 --trace=off` | 1 | 1.492 | No tests found; zero tests executed; filter corrected below |
| `corepack pnpm run e2e --project=webkit-375-light --grep=compare: --workers=1 --trace=off` | 0 | 105.024 | 1 passed; webkit-375-light comparison; one worker; tracing off |
| `corepack pnpm run e2e --trace=off` | 0 | 1361.748 | 48 passed; 0 failed/flaky/skipped; 12 projects; three workers; tracing off |
| `corepack pnpm run licenses` | 0 | 0.419 | Shipped code: license policy passed (4 package versions).; All packages: license policy passed (358 package versions). |

Actual browser-version annotations: `chromium 153.0.8010.12`, `firefox 155.0`, `webkit 26.6`.

All 12 projects ran four tests each: 48 passed, 0 failed, 0 flaky, 0 skipped. All browsers ran at 375×812 and 1280×800 in light and dark, with every sample in every project. The suite saved 1,332 original full-page PNGs (111 states per project), plus attachment/report copies. HTML and JSON reports and screenshots are outside the repository. The unchanged suite checks rendered references, actual worker/native bytes, keyboard navigation, axe accessibility, status labels, overflow, setup/input-check/plan/compare/export views and privacy; no screen changed.

#### Preliminary checks and exclusions

Before the source commit, `cargo run -p horizon-app --example output-schemas` exited 0; `cargo test -p horizon-app --test reference_values_intake` passed 5 tests; `cargo test -p horizon-cli --test intake_v2` passed 2 tests; `cargo test -p horizon-wasm` passed 5 tests; `cargo test -p horizon-app intake --lib` passed 23 tests (0 failed/ignored, 3 filtered). Clippy, `cargo fmt --all --check` and `git diff --check` exited 0. These preliminary outputs were not counted as fresh cumulative passes; the full sequence above reran the committed source.

No test was excluded. The default traced browser run failed; the complete passing retry disabled tracing as documented above. Successful coverage therefore demonstrates the unchanged suite with that runtime instrumentation adjustment. Scope exclusions follow the brief: every screen, including the what-if panel (later milestone informed by the timings); device storage of answers (later milestone); solving two missing answers together or anything other than retirement, savings and retirement spending; the unchanged plan-file format; and partner planning, still unsupported. Existing engine omissions and assumptions remain. Independent review remains a maintainer handoff step; the implementer did not act as reviewer.
