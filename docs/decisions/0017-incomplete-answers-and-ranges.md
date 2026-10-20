# 0017 — Incomplete answers and ranges (an application operation turns a person's answers, each a figure, a range or "not yet", into an engine run: it reports what is still needed, runs without optional answers and says which way the result leans, uses stated starting values, and returns ranges as bounds; the engine core stays strict)

- Status: Accepted (amendments 1 and 2 accepted 2026-10-19)
- Date: 2026-10-19
- Related:
  - [0007](0007-rust-core-typescript-shell.md), item 4 — no adapter contains a calculation rule. Turning answers into an engine input is a rule, so it belongs in the Rust application layer and reaches the browser through `horizon-wasm`.
  - [0011](0011-web-shell-stack.md), item 5 — the interface never computes financial values; it sends answers and shows what comes back.
  - [0012](0012-application-operations-for-answers.md) — sustainable spending, levers and input impact. Input impact from a low and a high value (item 5) is reused here for ranges, and its amendment's headroom measure is used for them.
  - [0003](0003-money-and-time-conventions.md) — dollar basis, rounding half away from zero once, and conversion to today's dollars.
  - [0006](0006-surplus-and-withdrawal-order.md) — what happens to pay that is not spent (item 5).
  - [0010](0010-comparison-export-and-command-line-conventions.md) — schemas, canonical JSON, subcommands and exit codes.
  - [0016](0016-plain-status-words.md) — the plain words a result uses for its status.

## Context

A person starting a plan often does not have every figure to hand. Today the only way into the engine is a complete household input, so a single unknown figure stops the whole plan, and the interface may not fill the gap itself (0011 item 5).

Verified on public `main` `8601a85`, 2026-10-19:

- **The input is complete and strict.** `household-input.v2` requires `valuation_date`, exactly one person, `accounts`, `income` and `spending`. Every amount is a whole number of cents with a dollar basis. Wage entries may be absent, and the schema sets no minimum number of accounts.
- **No default is inserted silently** (`docs/model/engine-foundations.md`, "Assumptions and metadata"). Each assumption carries a source (`user` or a public HTTPS URL) and `user_overrode_default`.
- **Coverage is already reported.** A run carries a status and a list of omissions, which the screens show in the words of 0016.
- **Input impact (0012 item 5)** already reruns sustainable spending at a declared low and a declared high value for each input, and ranks the inputs by effect.

None of this accepts an unknown figure or a range.

## Decision

**Where it lives**

1. **Add one application operation, `plan_from_answers(answers)`, in the Rust application layer.** It turns an answers document into a household input, runs the existing operations and returns one result. The engine core is unchanged and still requires a complete, strict input, so every run stays reproducible from a complete input. The browser calls the operation through `horizon-wasm`; the command line gets `horizon intake <answers.json>`, with exit codes as in 0010 (see A7).
2. **Define an answers document, `answers.v1`, separate from the household input.** Each answer is a figure (money with `per` year or month), a range (low not above high, in the same unit) or "later" (not known yet), and any answer may be marked "not sure". Choices that are not figures, such as "about the same as now", "no savings yet" or giving a retirement date instead of an age, are explicit answer kinds and are never inferred. The exact fields are set by the brief that implements this record.

**Turning answers into an engine input**

3. **Every conversion is a stated rule in the application, proven by reference values:**
   - a monthly amount is twelve times the monthly cents (exact);
   - a retirement age becomes the birthday in that year; a 29 February birthday becomes 28 February in a non-leap year;
   - "about the same as now" for spending in retirement uses the before-retirement answer, figure or range;
   - "already retired" sets the retirement date to the valuation date;
   - the valuation date is the date the answers apply to.
4. **Needed for any plan: date of birth; retired, or a retirement age or date; savings; spending in retirement.** If any of these is "later", no run is made. The result has status `incomplete` and lists the missing answers as `needed`, in question order. "No savings yet" is an answer (no accounts), not a missing one (A3).
5. **The plan runs without it and says so: pay now, spending now, the Social Security amount, the pension amount.** A "later" answer is left out of the input as below, and each one is reported with the direction in which it moves the result:

   | Missing | Left out as | Reported as, with direction |
   | --- | --- | --- |
   | Social Security amount | no Social Security income | "Social Security not given yet"; likely too pessimistic |
   | Pension amount | no pension income | "Pension not given yet"; likely too pessimistic |
   | Pay now, with spending now given | no wages before retirement | "Pay before retirement not given yet"; likely too pessimistic |
   | Spending now, with pay now given | no spending before retirement (the surplus is saved under 0006) | "Spending before retirement not given yet"; may be too optimistic |
   | Both pay now and spending now | neither | "Pay and spending before retirement not given yet; the plan assumes your pay covers your spending until you retire"; direction not stated |

   A result with any of these is `partial`, so it can never read as complete. Each direction is a claim and is tested by comparing the result with the answer left out against the result with it given.
6. **Ranges become bounds.** The central run uses each ranged answer's middle (A9). Input impact (0012 item 5), with the person's low and high, finds which end of each range makes the result worse. Two more runs follow: every ranged answer at its worse end, and every one at its better end. The result reports the central run and the two bounds, and ranks the ranged answers by how much each widens the result. This rests on the monotonicity 0012 verified; when the central result does not lie between the bounds, the result says so rather than presenting them as a range (A5).
7. **Starting values: plan end age 95; Social Security from age 67; inflation 2.5%, investment return 5%, cash return 2%, tax-threshold indexing 2.5%.** They are inserted explicitly, never silently: each is listed in the result under `starting_values`, and the assumptions are recorded with `user_overrode_default: false` (A1, A2).

**The result**

8. **`plan_from_answers` returns** its status (`incomplete`, or the run's own status), `needed`, the generated household input (so anyone can see exactly what ran), the central run, `bounds` when there are ranges, `left_out` with the direction of each, `starting_values`, and the answers marked "not sure". It is published as `answers-plan.v1`, alongside `answers.v1`, both generated like the existing schemas.
9. **The interface only shows the result.** It never fills a gap, converts a unit, takes a middle or ranks anything (0011 item 5).
10. **Plan files keep their current format.** An export still holds the complete generated input and its run, so it reopens exactly. The answers document, with its ranges and "later" answers, is not stored in the file.
11. **Reference values are derived independently before the implementing brief:** each conversion in item 3; each left-out case in item 5 with its direction; the bounds of item 6 with one and with two ranged answers; and the `incomplete` result for each needed answer.

## Alternatives considered

- **Refuse to run until every answer is given.** Declined: a person who lacks one figure gets no plan at all.
- **Fill gaps in the interface.** Declined by 0011 item 5 and 0007 item 4.
- **Make the engine core accept optional fields.** Declined: the core's strict, complete input is what makes every run reproducible and checkable. The application produces a complete input and shows it.
- **Use only the middle of a range.** Declined: it hides the uncertainty the person stated.
- **Run every combination of range ends.** Declined: 2ⁿ runs, while under the monotonicity of item 6 the two extreme combinations already bound the result.
- **Treat a missing Social Security or pension amount as needed.** Declined: the plan is still useful without it, and saying that it is likely too pessimistic is accurate.

## Consequences

- **Requires:** the new operation, two schemas, a subcommand, a `horizon-wasm` export, four error codes and the reference values of item 11.
- **Unchanged:** the engine core, the household input schema, the run status logic and the plan file format.
- **Cost:** a ranged plan costs three runs plus two input-impact runs per ranged answer, each a few milliseconds (0012 measured about 6 ms per command-line run, including start-up).
- **Security:** the answers document is the person's data, like the household input; it stays in the page and is not sent anywhere.

## Amendment — 2026-10-19: open points settled and the rules made exact

Settled while deriving the reference values for brief [0002-W4](../briefs/0002-W4-answers-to-plan.md) ([reference values](../briefs/0002-W4-reference-values.json): 22 cases). A separate program built each household input from this record's text and ran it on the existing, reviewed `horizon run` and `horizon spend`. Answers that describe the `answers-working-61` and `synthetic-retired` samples reproduce their headroom, sustainable spending, first shortfall age and run status exactly, and every stated direction holds.

- **A1 — Starting assumptions.** Recorded as the samples already record them: source `user`, with `user_overrode_default` false (true when the person changed one), and listed in `starting_values`. No input-schema change.
- **A2 — Social Security from 67.** The full retirement age is 67 for anyone born in 1960 or later (<https://www.ssa.gov/benefits/retirement/planner/ageincrease.html>, retrieved 2026-10-19). It is a starting value.
- **A3 — No savings.** An empty account list runs end to end: verified 2026-10-19, the working household with no accounts runs as `partial`, with headroom −$38,768.
- **A4 — Two more starting values, each with a direction.** A taxable account with no cost basis uses its balance as the cost basis (following a ranged balance), so no gain is taxed: may be too optimistic. A pension whose rise with prices is "not sure" is taken as fixed in nominal dollars: likely too pessimistic. A "no" to Social Security or to a pension uses a zero amount (Social Security at 67, pension at 65) and is not listed.
- **A5 — Ranges are measured in headroom**, as 0012's amendment measures effects. For each ranged answer, with the others at their middle, the worse end is the one with the lower headroom (a tie takes the low end), and its spread is the absolute difference between the two. The bounds are the runs with every ranged answer at its worse end and at its better end, each reporting headroom, sustainable spending and the first shortfall age, or that savings last to the plan's end. `ordered` is false when the central headroom is not between them, and the result then says so instead of presenting the bounds as a range. Ranked by spread, then by answer name.
- **A6 — Already retired.** Spending before retirement equals spending in retirement, since no year uses it. "About the same as now" does not apply to someone already retired and, if sent, counts as missing.
- **A7 — Statuses, codes and exit codes.** `incomplete` when needed answers are missing (no run; command-line exit 4); otherwise the run's own status, raised to `partial` when anything is left out; `unsupported` with `ANSWERS_ONE_PERSON_ONLY` for a household of two (exit 2); `invalid` with `ANSWERS_RANGE_ORDER`, `ANSWERS_NEGATIVE_AMOUNT` or `ANSWERS_RETIREMENT_NOT_AFTER_VALUATION` (exit 1); complete 0 and partial 3, as in 0010.
- **A7b — One result shape.** Every result has the same fields: `status`, `code`, `needed`, `household_input`, `central`, `bounds`, `left_out`, `starting_values` and `not_sure`; those that do not apply are null or empty. Left-out answers are reported in `left_out`, beside the run's own omissions in `central`, rather than inside them.
- **A8 — Generated identifiers.** The person is `person`; accounts are `<kind>-<n>` in answer order (`cash-1`, `taxable-1`, `employer-plan-1`, `traditional-ira-1`, `roth-1`).
- **A9 — A range's middle** is (low + high) / 2, rounded half away from zero to the cent. "About the same as now" with a ranged spending-now answer moves both spending figures together, as one ranged answer.

## Amendment 2 — 2026-10-19: rules settled after the first implementation

The first implementation of brief 0002-W4 matched every reference case, but a check of random answer sets against an independent model of this record showed five places where the text allowed two readings. They are settled here, and brief 0002-W4 v2 adds seven [reference cases](../briefs/0002-W4-reference-values.json) for them (29 in all; the 22 earlier cases are unchanged).

- **B1 — A monthly range** is turned into yearly amounts first: each end is multiplied by twelve, and the middle, the worse end and the better end are taken from those yearly ends. The middle is then exact (six times the sum of the monthly ends), so no rounding is needed: $1.00–$1.01 a month is $12.00–$12.12 a year, middle $12.06. A9 still governs yearly ranges.
- **B2 — An answer the plan does not use is ignored:** never checked, never run as a range and never listed. These are the Social Security amount and start age when the person expects no Social Security, and pay, spending now, the end of pay and the retirement age or date when the person is already retired. A cost basis on an account other than a taxable one remains malformed input.
- **B3 — Check order.** One person only (`unsupported`), then the answers needed for any plan (`incomplete`), then, on the answers the plan uses, every range's order (`ANSWERS_RANGE_ORDER`), then every amount's sign (`ANSWERS_NEGATIVE_AMOUNT`), then the retirement date (`ANSWERS_RETIREMENT_NOT_AFTER_VALUATION`). The first failing check decides the result.
- **B4 — A pension left out** (amount "later") is a zero pension, nominal, at 65, exactly like a "no", whatever start age and rise with prices were given; it adds no starting value. It is still reported as left out, likely too pessimistic.
- **B5 — Answers marked "not sure"** are returned as given, in the person's order.
