BRIEF VERSION: 0002-W4 v1 (2026-10-19)

# 0002-W4 — Answers to plan: incomplete answers and ranges

## Outcome

A person can answer Horizon's questions with a figure, a range, or "not yet", and still get an honest result. One application operation turns their answers into an engine run. It:
- says what is still needed when a plan cannot be worked out yet;
- runs without optional answers and says which way the result leans;
- uses stated starting values where a person gave none;
- turns ranges into a central result with a worse and a better bound.

The engine core is unchanged and still runs only on a complete input, which the operation also returns, so every result stays reproducible. The command line and the browser module return identical results. No screen changes in this milestone.

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
2. **The operation `plan_from_answers(answers)`** in `horizon-app` (decision 0017 items 1, 3–9, and amendment A1–A9). In order:
   1. **Unsupported:** `planning: "partner"` returns `unsupported` with `ANSWERS_ONE_PERSON_ONLY`; no run.
   2. **Needed for any plan** (item 4): if `birth_date` is later; or `retired` is false and `retirement` is later or absent; or `savings` is later; or `spending_in_retirement` is later, or is "same as now" while the person is retired or `spending_now` is later. The result is `incomplete`, with `needed` listing `birth_date`, `retirement`, `savings`, `spending_in_retirement` in that order, as they apply; no run.
   3. **Invalid answers:** a range whose low is above its high, `ANSWERS_RANGE_ORDER`; a negative amount, `ANSWERS_NEGATIVE_AMOUNT`; a retirement date not after `valuation_date` while `retired` is false, `ANSWERS_RETIREMENT_NOT_AFTER_VALUATION`. All `invalid`.
   4. **Build the household input** exactly as these rules say:
      - **Person:** id `person`; `retirement_date` is `valuation_date` when retired, else the birthday in the year of `retirement.age`, with 29 February becoming 28 February in a non-leap year, or `retirement.date`; `plan_end_age` as given, else 95 (a starting value).
      - **Money:** a monthly amount is twelve times its cents; a range's middle is (low + high) / 2, rounded half away from zero to the cent; every pay, spending and Social Security amount is in today's dollars.
      - **Pay:** one wage from `valuation_date` to the retirement date (or `pay_ends.date`), in today's dollars; none when retired or left out.
      - **Spending:** before retirement from `spending_now`; in retirement from `spending_in_retirement`, or the same answer as `spending_now` (one answer, so a range moves both); when retired, before-retirement spending equals spending in retirement.
      - **Social Security:** `expects: "no"` gives $0 at 67. Otherwise the amount, in today's dollars, from `start_age`, else 67 (a starting value); `not_sure` counts as yes.
      - **Pension:** `expects: "no"` gives $0, nominal, at 65. Otherwise the amount from `start_age`, in today's dollars when it rises with prices, nominal when it does not or when "not sure" (a starting value, likely too pessimistic).
      - **Accounts:** in answer order, ids `<kind>-<n>` with kinds `cash`, `taxable`, `employer-plan`, `traditional-ira`, `roth`; owner `person`; `employer_plan` and `traditional_ira` are tax-deferred with that plan kind. A taxable account with no cost basis uses its balance (it follows a ranged balance): a starting value, may be too optimistic. `savings: {"none": true}` gives no accounts.
      - **Assumptions:** each of the four identifiers, sorted, with `effective_year` the valuation year, unit `decimal_fraction_per_year`, source `user`, and `user_overrode_default` true only when overridden. Defaults: cash return 0.02, inflation 0.025, investment return 0.05, tax-threshold indexing 0.025 (starting values when not overridden).
   5. **Left out, with direction** (item 5): Social Security amount later (too pessimistic); pension amount later (too pessimistic); pay later with spending now given (no wage; too pessimistic); spending now later with pay given (before-retirement spending $0; too optimistic); both later (neither; `pay_and_spending_now`, direction not stated). Omission texts exactly as in the reference values.
   6. **Run** the household input with the existing run and sustainable-spending operations. The status is the run's, raised to `partial` when anything is left out.
   7. **Ranges** (amendment A5): for each ranged answer, with the others at their middle, compute headroom at its low and at its high; the worse end has the lower headroom (a tie takes the low end); spread = |headroom at high − headroom at low|. Run every ranged answer at its worse end, and at its better end. Each bound reports headroom, sustainable spending, first shortfall age (or null) and whether savings last to the plan's end. `ordered` is true only when the central headroom lies between the two bounds. Ranked by spread, largest first, then answer name.
3. **The result, `answers-plan.v1`,** with a published schema: `status`; `needed`; `code` (for unsupported and invalid); `household_input` (the complete generated input); `central` (run status, omissions, first shortfall age, lasts to the plan's end, headroom, sustainable spending); `bounds` (null without ranges); `left_out`; `starting_values`; `not_sure`. Field names and shapes as in the reference values.
4. **Command line:** `horizon intake <answers.json>` prints the result as canonical JSON and a newline. Exit codes: 0 complete, 3 partial, 4 incomplete, 1 invalid, 2 unsupported. The command line contains no rule.
5. **Browser module:** `horizon-wasm` exposes `plan_from_answers`, returning the same bytes as native.
6. **Error codes:** the four new codes in `docs/model/error-codes.md`.
7. **Documentation:** `docs/model/answers.md` gains a section on answers and ranges; `AGENTS.md` and `README.md` list the cumulative validation, including the new commands; `docs/model/dependencies.md` stays accurate. No new dependency is expected; any new crate needs escalation.

## Done when

1. **Every reference case matches exactly:** for each of the 22 cases in `docs/briefs/0002-W4-reference-values.json`, `plan_from_answers` on its `answers` returns its `result`, field for field, including the generated `household_input`, `central`, `bounds`, `left_out`, `starting_values` and `needed`.
2. **Samples reproduced:** answers describing `answers-working-61` and `synthetic-retired` give the same headroom, sustainable spending, first shortfall age and run status as those samples (cases `working-complete` and `already-retired`).
3. **Rules:** the 29 February rule, monthly amounts, "same as now" with a value and with a range, no savings, missing cost basis and a "not sure" pension each have a unit test.
4. **Bounds:** a test with a replaceable run function in which the central headroom falls outside the bounds gives `ordered: false`.
5. **Contracts:** both schemas are generated with `schemars`, published under `docs/model/schemas/`, and covered by drift tests; every result validates against `answers-plan.v1`.
6. **Command line:** `horizon intake` over every reference case prints output byte-identical to the operation, with the stated exit code.
7. **WebAssembly parity:** the reference cases pass on `wasm32-unknown-unknown` under Node.js 24.22.0, byte-identical to native.
8. **Earlier guarantees hold:** every earlier test, reference file, golden and v1/v2 schema is unchanged; no floating-point or unchecked integer arithmetic; the engine uses no host facilities; the license checks pass; the web app's tests, build and end-to-end suite pass unchanged.

## Reference values

Derived independently from decision 0017 and its amendment: a separate program builds each household input from the answers by the rules above and runs the existing, reviewed `horizon run` and `horizon spend` on it. As a cross-check, answers describing `answers-working-61` and `synthetic-retired` reproduce those samples' results exactly, and every stated direction was confirmed by comparing the result with and without the answer.

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

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
