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

### Partial implementation — 0002-W5 v1.1 (2026-10-20)

- Branch: `codex/0002-W5-reverse-answers`, rebased onto main `20d486e`.
- Source/test revision validated: `147b4c5ad1067ff9a2312cfc7b2fac85b034a543`. This record is committed afterward; the final branch tip is reported separately in the handoff.
- Implemented version 2 alongside the original version 1 types and conversion. The only changed earlier assertion is the v1.1-authorized unsupported-version input, 2 to 3. Earlier reference files, goldens, schemas, engine core, Cargo.lock, web source and web tests are unchanged.
- New dependencies: none. No new crate, model/tax version, route, hosted authorization surface or plan-file format.
- Installed tools selected: Rust/cargo 1.99.1, cargo-deny 0.20.2, wasm-bindgen-test-runner 0.2.129, Node v24.22.0 from `/usr/local/bin`, corepack 0.36.0 and pnpm 12.9.1. Node was recorded immediately before every WebAssembly command, including web engine builds. All WebAssembly execution used `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner`; the harness timeout was 600 seconds.

#### Unresolved contract — stopped for clarification

Deliverable 3 requires `what_if` echoed as given in every version 2 result. The inherited monetary/canonical contract limits exact JSON integers to ±9,007,199,254,740,991 (`packages/engine/src/money.rs`, `JSON_CENT_LIMIT`; `packages/engine/src/canonical.rs`). On the synthetic v2 working reference with `what_if.savings_total_cents` set to 9,007,199,254,740,992, the application returns `invalid`, code `MONEY_OUTPUT_RANGE`, with that value echoed. Canonical serialization then fails, so `cargo run -p horizon-cli -- intake <what-if-out-of-range.json>` exits 1 and prints the generic `CANONICAL_JSON` status/code/message error, losing the required v2 fields. The current brief does not settle a representable echo for this invalid amount; changing the core canonical rules is excluded. Clarification was requested before choosing an output representation. The public reference values remain unchanged.

The direct native probe compiled with `rustc --edition=2024 <probe.rs> -L dependency=target/debug/deps --extern horizon_app=<current-rlib> -o <probe>` (exit 0), then ran (exit 0), observing `status=invalid code=Some("MONEY_OUTPUT_RANGE") what_if=Some(WhatIf { savings_total_cents: Some(9007199254740992) })`. The CLI probe exited 1 with `{"code":"CANONICAL_JSON","message":"Canonical JSON requires ASCII member names and exact JSON-safe integers.","status":"invalid"}`. No financial or serialization rule was chosen to resolve this conflict.

#### Cumulative validation

Commands ran in the AGENTS order from the committed source through browser installation. The subsequent browser run was stopped for the unresolved contract above; no full-validation pass is claimed. Counts sum all executed test harnesses (passed/failed/ignored/filtered); filtered tests are not passes. A dash denotes a command without Rust test counts. Expected partial/incomplete/error CLI exits are reported separately below.

| Command | Exit | Passed | Failed | Ignored | Filtered | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- |
| `rustc --version` | 0 | — | — | — | — | 0.058 |
| `cargo --version` | 0 | — | — | — | — | 0.02 |
| `cargo deny --version` | 0 | — | — | — | — | 0.061 |
| `wasm-bindgen-test-runner --version` | 0 | — | — | — | — | 0.011 |
| `node --version` | 0 | — | — | — | — | 0.006 |
| `cargo test -p horizon-app intake` | 0 | 26 | 0 | 0 | 42 | 45.966 |
| `cargo test -p horizon-app --test reference_values_intake` | 0 | 4 | 0 | 0 | 0 | 28.638 |
| `cargo test -p horizon-app answers` | 0 | 10 | 0 | 0 | 58 | 6.274 |
| `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 | 0 | 0 | 0 | 5.58 |
| `cargo test -p horizon-app compare` | 0 | 3 | 0 | 0 | 65 | 0.511 |
| `cargo test -p horizon-app immutability` | 0 | 1 | 0 | 0 | 67 | 0.153 |
| `cargo test -p horizon-app export` | 0 | 2 | 0 | 0 | 66 | 5.329 |
| `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 | 0 | 0 | 0 | 0.359 |
| `cargo test -p horizon-engine tax` | 0 | 2 | 0 | 0 | 8 | 0.071 |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 | 0 | 0 | 0 | 0.214 |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 | 0 | 0 | 0 | 0.138 |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 | 0 | 0 | 0 | 0.09 |
| `cargo test -p horizon-engine ledger` | 0 | 2 | 0 | 0 | 8 | 0.056 |
| `cargo test -p horizon-engine money` | 0 | 2 | 0 | 0 | 8 | 0.055 |
| `cargo test -p horizon-app validation` | 0 | 5 | 0 | 0 | 63 | 0.393 |
| `cargo test -p horizon-parity` | 0 | 17 | 0 | 0 | 0 | 52.409 |
| `cargo test --workspace` | 0 | 107 | 0 | 0 | 0 | 230.152 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — | — | — | — | 0.256 |
| `cargo fmt --all --check` | 0 | — | — | — | — | 0.117 |
| `cargo test --workspace --release` | 0 | 107 | 0 | 0 | 0 | 50.357 |
| `cargo build --workspace --release` | 0 | — | — | — | — | 3.282 |
| `node --version` | 0 | — | — | — | — | 0.006 |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — | — | — | — | 0.862 |
| `node --version` | 0 | — | — | — | — | 0.003 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 17 | 0 | 0 | 0 | 145.585 |
| `node --version` | 0 | — | — | — | — | 0.004 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 1 | 0 | 0 | 1 | 10.119 |
| `cargo deny check licenses` | 0 | — | — | — | — | 0.136 |
| `cargo build -p horizon-cli --release` | 0 | — | — | — | — | 2.782 |
| `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | — | — | — | — | 0.441 |
| `node --version` | 0 | — | — | — | — | 0.004 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 | 0 | 0 | 14 | 6.966 |
| `cargo test -p horizon-wasm` | 0 | 4 | 0 | 0 | 0 | 6.295 |
| `node --version` | 0 | — | — | — | — | 0.005 |
| `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | — | — | — | 2.607 |
| `node --version` | 0 | — | — | — | — | 0.002 |
| `node --version` | 0 | — | — | — | — | 0.003 |

The release levers command ran after the explicit CLI release build: exit 3, 0.441 seconds wall time, below two seconds.
The isolated WebAssembly levers harness reported 5.51 seconds (including zero-test harnesses where present).

Release WebAssembly timing output, with Node v24.22.0 recorded immediately before the command:

```text
v2-working-complete: mean 71.767 ms (10 runs)
v2-solve-spending: mean 141.526 ms (10 runs)
v2-solve-savings: mean 61.469 ms (10 runs)
v2-solve-retirement: mean 96.269 ms (10 runs)
v2-solve-savings-with-range: mean 251.882 ms (10 runs)
```

#### Expanded CLI validation

Each intake row expands `cargo run -p horizon-cli -- intake <case.answers.json>` with the exact extracted reference answers. All 54 commands matched the committed reference results; native integration tests additionally compare exact canonical application/CLI bytes and the trailing newline.

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

Each fixture row expands seven invocations: `cargo run -p horizon-cli -- spend <name>`, `levers <name>`, `impact <name> packages/app/test-data/empty-rough.json`, `run <name>`, `compare A-drawdown <name>`, `export <name>` and `dev-run <name>`. Cells are observed exits; legacy dev-run keeps exit 0 for partial. Export status is its embedded run status.

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

Additional reference pairs, the six-item rough reference, and every current golden/rejection import:

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

Cumulative CLI matrix invocations: 426, plus the separate unresolved-contract probe above. Every command had its expected exit and canonical JSON output; all reference intake results matched field for field.

#### Web shell validation

The unchanged web suite ran after Rust/CLI validation, including a frozen-lockfile install and all three browser binaries.

| Command (from apps/web) | Exit | Wall seconds | Observed result |
| --- | --- | --- | --- |
| `node --version` | 0 | 0.002 | v24.22.0 |
| `corepack --version` | 0 | 0.046 | 0.36.0 |
| `corepack pnpm --version` | 0 | 0.07 | 12.9.1 |
| `corepack pnpm install --frozen-lockfile` | 0 | 0.146 | passed |
| `corepack pnpm run build:engine` | 0 | 0.22 | passed |
| `corepack pnpm run types` | 0 | 0.33 | passed |
| `corepack pnpm run typecheck` | 0 | 1.832 | passed |
| `corepack pnpm run lint` | 0 | 2.52 | passed |
| `corepack pnpm run format:check` | 0 | 0.741 | passed |
| `corepack pnpm test` | 0 | 6.14 | Test Files  14 passed (14); Tests  93 passed (93) |
| `corepack pnpm run build` | 0 | 2.952 | passed |
| `corepack pnpm exec playwright install chromium firefox webkit` | 0 | 0.361 | passed |

| `corepack pnpm run e2e` | SIGTERM (stopped for clarification) | — | incomplete; no completed suite count |
| `corepack pnpm run licenses` | not run | — | pending clarification |

Browser execution started the 12-project, 48-test suite, then was deliberately terminated with SIGTERM after starting test 5 of 48 when the out-of-range what-if echo conflict was confirmed. No complete browser result, browser-version proof or project-coverage pass is claimed. The required web license command had not yet run. Partial screenshot evidence remains outside the repository; a completed Playwright report is still required.

#### Development checks and exclusions

During development, `cargo run -p horizon-app --example output-schemas` and `cargo test -p horizon-app --test reference_values_intake` initially exited 101 because a calendar helper was private; after using the existing public date-validation convention they exited 0 (schema generation; 4 reference/schema tests). `cargo test -p horizon-app intake --lib` initially exited 101 for an incorrectly typed injected-test shortfall assignment, then passed: 21 passed, 0 failed, 0 ignored, 3 filtered. `cargo test -p horizon-cli --test intake_v2` passed its 1 test. `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all --check` and `git diff --check` exited 0 before the source commit. A compile-only `cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing --no-run` exited 0, with Node v24.22.0 recorded; it was not counted as execution parity or timing evidence. After the retirement-search boundary correction, targeted `cargo test -p horizon-app intake --lib` passed 22 tests (0 failed/ignored, 3 filtered), and Clippy and `git diff --check` again exited 0. The complete sequence above reran the final committed source; development output was not counted as a new pass.

Required end-to-end browser execution/report and web license validation remain incomplete pending clarification; neither is counted as passed. Scope exclusions are the brief’s: every screen, including the what-if panel (later milestone informed by the measured timings); device storage of answers (later milestone); solving two missing answers together or anything beyond retirement, savings and retirement spending; changes to the plan-file format; and partner planning, which remains unsupported. The engine retains its earlier omissions and assumptions. Independent review remains a maintainer handoff step; the implementer did not act as reviewer.

#### Earlier validation attempt (superseded source)

An earlier attempt ran on `d123fcd8870dbe9c69687157eaa4d995d4a94222`. The retirement search could reject the generated limit when there were no eligible future birthdays before end age. That boundary was corrected and given a regression test in the final source revision above. The earlier browser run was deliberately terminated with SIGTERM after starting test 20 of 48; no browser pass is claimed for it. The complete final sequence above was restarted from Rust, including fresh browser execution, after the correction.

The earlier commands below all exited as shown. Counts are passed/failed/ignored/filtered; a dash means no Rust harness. Its 54 intake invocations and 371 expanded fixture/reference/import invocations repeated the same CLI commands and exits recorded in the final CLI tables; all 54 intake results matched their references. It also ran the release levers command twice (shown below), for 427 initial CLI invocations in total. The initial web unit suite passed 14 files / 93 tests, and browser installation passed; its web license command had not yet run when the attempt was stopped.

| Earlier command | Exit | Passed / failed / ignored / filtered | Wall seconds |
| --- | --- | --- | --- |
| `rustc --version` | 0 | — | 0.021 |
| `cargo --version` | 0 | — | 0.021 |
| `cargo deny --version` | 0 | — | 0.024 |
| `wasm-bindgen-test-runner --version` | 0 | — | 0.004 |
| `node --version` | 0 | — | 0.004 |
| `cargo test -p horizon-app intake` | 0 | 25 / 0 / 0 / 42 | 44.999 |
| `cargo test -p horizon-app --test reference_values_intake` | 0 | 4 / 0 / 0 / 0 | 29.815 |
| `cargo test -p horizon-app answers` | 0 | 10 / 0 / 0 / 57 | 6.098 |
| `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 / 0 / 0 / 0 | 5.139 |
| `cargo test -p horizon-app compare` | 0 | 3 / 0 / 0 / 64 | 0.435 |
| `cargo test -p horizon-app immutability` | 0 | 1 / 0 / 0 / 66 | 0.137 |
| `cargo test -p horizon-app export` | 0 | 2 / 0 / 0 / 65 | 4.58 |
| `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 / 0 / 0 / 0 | 0.346 |
| `cargo test -p horizon-engine tax` | 0 | 2 / 0 / 0 / 8 | 1.436 |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 / 0 / 0 / 0 | 0.23 |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 / 0 / 0 / 0 | 0.156 |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 / 0 / 0 / 0 | 0.077 |
| `cargo test -p horizon-engine ledger` | 0 | 2 / 0 / 0 / 8 | 0.042 |
| `cargo test -p horizon-engine money` | 0 | 2 / 0 / 0 / 8 | 0.051 |
| `cargo test -p horizon-app validation` | 0 | 5 / 0 / 0 / 62 | 0.39 |
| `cargo test -p horizon-parity` | 0 | 17 / 0 / 0 / 0 | 48.758 |
| `cargo test --workspace` | 0 | 106 / 0 / 0 / 0 | 240.468 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | — | 0.227 |
| `cargo fmt --all --check` | 0 | — | 0.099 |
| `cargo test --workspace --release` | 0 | 106 / 0 / 0 / 0 | 73.595 |
| `cargo build --workspace --release` | 0 | — | 5.497 |
| `node --version` | 0 | — | 0.004 |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | — | 5.918 |
| `node --version` | 0 | — | 0.004 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 17 / 0 / 0 / 0 | 154.994 |
| `node --version` | 0 | — | 0.003 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture` | 0 | 1 / 0 / 0 / 1 | 6.474 |
| `cargo deny check licenses` | 0 | — | 0.145 |
| `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | — | 6.168 |
| `cargo build -p horizon-cli --release` | 0 | — | 0.063 |
| `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | — | 0.431 |
| `node --version` | 0 | — | 0.004 |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 / 0 / 0 / 14 | 6.462 |
| `cargo test -p horizon-wasm` | 0 | 4 / 0 / 0 / 0 | 6.985 |
| `node --version` | 0 | — | 0.002 |
| `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | — | 3.567 |
| `node --version` | 0 | — | 0.002 |
| `corepack --version` | 0 | — | 0.042 |
| `corepack pnpm --version` | 0 | — | 0.072 |
| `corepack pnpm install --frozen-lockfile` | 0 | — | 23.773 |
| `node --version` | 0 | — | 0.006 |
| `corepack pnpm run build:engine` | 0 | — | 0.341 |
| `corepack pnpm run types` | 0 | — | 0.4 |
| `corepack pnpm run typecheck` | 0 | — | 1.972 |
| `corepack pnpm run lint` | 0 | — | 2.804 |
| `corepack pnpm run format:check` | 0 | — | 1.156 |
| `corepack pnpm test` | 0 | — | 6.043 |
| `node --version` | 0 | — | 0.002 |
| `corepack pnpm run build` | 0 | — | 2.367 |
| `corepack pnpm exec playwright install chromium firefox webkit` | 0 | — | 0.43 |
| `corepack pnpm run e2e` | SIGTERM (stopped for source correction) | no completed suite count | — |

The initial release levers invocation took 6.168 seconds, including 5.77 seconds of compilation triggered by CLI-only feature selection after the workspace build. Its expected exit was 3, but it was not a performance pass. After explicitly building the CLI release target, the repeat exited 3 in 0.431 seconds. The final attempt independently rebuilt and retimed the target as recorded above. Initial isolated WebAssembly levers harness: 1 passed, 0 failed/ignored, 14 filtered, 5.02 seconds; Node v24.22.0 was recorded immediately beforehand.

Initial release WebAssembly timing output (superseded-source evidence only; the figures above are the fresh final-source measurements):

```text
v2-working-complete: mean 65.427 ms (10 runs)
v2-solve-spending: mean 142.197 ms (10 runs)
v2-solve-savings: mean 58.645 ms (10 runs)
v2-solve-retirement: mean 96.591 ms (10 runs)
v2-solve-savings-with-range: mean 251.007 ms (10 runs)
```
