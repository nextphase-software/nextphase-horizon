BRIEF VERSION: 0002-W5 v1.1 (2026-10-20)

# 0002-W5 — Reverse answers and what-if (engine)

## Outcome

A person who does not know their savings, their spending in retirement or when they will retire still gets a plan. The engine works out the one they left for later instead of refusing: the savings they would need, what they could spend, or the earliest age they could retire. An age is enough in place of a date of birth. A what-if is a changed copy of the answers, so every figure a later screen shows comes from the engine, including a new total for savings shared among the person's accounts.

Version 1 answers keep their rules and results exactly. The engine core and the plan file are unchanged. No screen changes in this milestone.

Version 1.1 changes only Done when 8: one earlier unit test used version 2 as its example of an unsupported version, which this brief makes valid.

## Deliverables

1. **`answers.v2`,** with a published schema: `answers.v1` with `version` `2` and two additions (decision 0019 items 1, 2 and 10):
   - `birth_date` may also be `{"age": n}`, a whole number;
   - an optional `what_if` object with one optional field, `savings_total_cents` (a whole number of cents).
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
