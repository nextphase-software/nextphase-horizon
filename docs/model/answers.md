# Answer operations — 0003-W1 / model 0.4.0

The pure application operations `sustainable_spending(input)`, `levers(input)`
and `input_impact(input, rough)` supply deterministic answers from the same
federal-tax engine as `run`. Each host calls the application layer. The CLI
contains only file handling, dispatch and status mapping. There is no browser
module or UI in this milestone.

## Units, coverage and reproducibility

Answer amounts and headroom are integer **whole USD per year, in today's
dollars**, with the valuation base year and unit declared in `units`. Entered
spending is floored from cents to whole dollars; headroom is sustainable spending
minus that entered amount. Effects and impacts measure changes in headroom,
so spending levers retain their meaning even when sustainable spending is
unchanged. These are modeled annual amounts, not probabilities, success rates
or guarantees about future returns or law.

The spending answer embeds its full result run, run count, cap, optional flag
and original household input hash. The run carries model/rule versions, sourced
assumptions, input/assumption hashes, omissions and annual flags. Lever and
impact variants retain their statuses, omissions and annual flags. The operation
status is partial if the baseline or any offered/ranged result is partial;
unsupported and invalid inputs return the existing error envelope. Working
households remain partial because contributions are not modeled. Earlier
financial coverage and estimates remain documented in [federal-tax.md](federal-tax.md).

## Sustainable spending

The search varies only after-retirement spending, which must be in today's
dollars; nominal spending returns `SPENDING_BASIS_UNSUPPORTED`. Each trial uses
a copy. The cap is $10,000,000 per year. The returned entered amount is the
actual floored input; only the search's starting point is capped.

The whole-dollar search follows decision 0012 amendment A2 exactly: start at
the lesser of entered dollars and the cap; expand a feasible upper bound by
doubling, or check zero when the initial amount has a shortfall. Bisect until
adjacent whole dollars remain. Rerun S and S+1: S must have no shortfall, and
S+1 must have a shortfall. Otherwise return `SPENDING_SEARCH_NOT_MONOTONIC`.
Every calculation, including both verification runs, counts. The function
`sustainable_spending_with` exposes an injectable run function for tests.

A feasible cap returns `at_or_above_cap` immediately; a shortfall at zero
returns `shortfall_with_no_retirement_spending`. These edge results do not run
the normal two boundary verifications. Their full runs still expose all
shortfalls and coverage flags. Boundary verification is local evidence for
that answer, not proof of global monotonicity.

## Levers

The offered list stays in this order: retire_earlier, retire_later, spend_lower,
spend_higher, return_lower, return_higher. Skipped choices are separately named
with a reason. Each offered choice records its exact JSON Pointer changes,
sustainable spending/flag, headroom and effect, first shortfall age and ending
total in today's dollars, and coverage status/omissions/flags.

Retirement moves one year on the same month/day, with 29 February clamped to
28 February. It is offered only before retirement and only if the new date is
after valuation and within the plan's final 31 December. Wages ending on the
original retirement date move with it. Spending multiplies by 0.9 or 1.1 with
one half-away-from-zero cent rounding. Returns change by exactly 0.01, as
terminating decimal strings; a negative lower return is skipped.

Effects are variant headroom minus baseline headroom. The headline ranking
sorts by absolute effect; `what_moves_most` sorts kinds by their largest absolute
effect. Ties retain the fixed offering order. First shortfall age and ending
total describe the variant at its **entered amounts**, rather than at the
searched boundary. Each lever's coverage status describes its spending result.

## Rough-input impact

Each rough item is `{path, low?, high?}`, using the same strict JSON Pointer
syntax and keyed assumption document as scenario changes. Defaults are:

- Account opening balances, income amounts and spending: ±10%, rounded once
  half away from zero to cents.
- Taxable cost basis: ±25%, with the high value capped at account opening value.
- Assumption rates: ±0.01 in exact decimal arithmetic, bounded below at zero.

An explicit low or high replaces that endpoint's default. Other paths need both
endpoints (`IMPACT_RANGE_REQUIRED`); malformed pointers retain
`SCENARIO_POINTER_INVALID`. Existing validation applies to each changed input.
No unknown range is silently invented. Items report low/high, headroom at each,
coverage and impact: the larger absolute change from baseline headroom. Stable
sorting preserves rough-item order on ties. Input completeness is represented
by these declared ranges and their effects, not by a score.

## Today's-dollar fields and versioned contracts

Federal-tax runs add account `closing_today` and annual `total_closing`,
`total_closing_today`, and `shortfall_today`. Nominal totals sum finalized cent
lines; today's values divide by that year's exact inflation factor and round
once. The total is converted once, rather than summing separately rounded
converted balances. Comparison summaries add `ending_total_today` and each
balance adds `balance_today`, using the last projected year. Each converted
monetary line carries today's-dollar basis, units, currency, base year and year.
Cross-year shortfall and tax sums stay nominal and keep their explicit label.
The historical pre-tax ledger omits these new fields and remains unchanged.

Model metadata is `horizon-engine-0.4.0`; the rule set stays
`us-single-federal-tax-v3`. Run/comparison/export schemas move to v2. Export
format stays 1, embedding run v2; a valid-hash model 0.3.0 export is rejected
with `EXPORT_MODEL_VERSION_UNSUPPORTED`. The old v1 schema files remain unchanged
as the 0.3.0 record. New sustainable-spending, levers and input-impact schemas are
v1. All six current schemas are generated by:

```sh
cargo run -p horizon-app --example output-schemas
```

Tests check drift and validate outputs. All earlier reference artifacts and W1's
reference test source are unchanged. No dependency was added; the lockfile and
license policy, including the exact existing MIT-0 exception, are unchanged.

## Fixtures and validation

The four new `answers-*` fixtures come exactly from
[0003-W1 reference values](../briefs/0003-W1-reference-values.json): answers-working-61,
answers-working-61-retire-later, answers-underfunded and answers-cap. There are
48 run fixtures overall, 26 valid and 22 invalid/unsupported. The reference
checks cover all spending rows, both lever cases, all rough ranges, both full
yearly today's-value cases and the comparison summary.

```sh
cargo run -p horizon-cli -- spend answers-working-61
cargo run -p horizon-cli -- levers answers-working-61
cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json
```

Each command prints canonical JSON plus a newline. Exits remain 0 complete,
3 partial, 1 invalid, 2 unsupported. The other five commands retain their W4
behavior; model 0.3.0 import is deliberately unsupported. Names and file paths
are accepted. Rough JSON must be an array of the documented rough items.

For the cumulative CLI checks, run all eight commands as applicable across the
fixture corpus: spend/levers over every name, impact over every name with
`empty-rough.json`, plus the explicit six-item reference rough file for
answers-working-61. Existing run/export/dev-run use every name; compare uses
A-drawdown against every fixture and the five W4 reference pairs. Import every
current golden export and the tampered/unknown-format/model-0.3.0 rejection
fixtures. Record each observed exit, including expected partial/error exits.

The existing generator regenerates current run/export goldens and new full
answer goldens; none are hand-edited:

```sh
cargo run -p horizon-parity --example generate-golden
cargo fmt --all
```

The same reference-proof functions validate native output and WebAssembly,
including full canonical answer bytes and earlier numeric proofs. Compile-time
includes supply all fixtures and goldens to WebAssembly. Use the pinned Node.js
24.22.0 path and matching wasm-bindgen runner 0.2.129 from [README](../../README.md#setup).
The cumulative sequence records `node --version`, the release levers wall time
(must be under two seconds), and the isolated WebAssembly levers test duration.

The horizon-wasm browser binding and all screens are excluded. Social Security
claiming rules/levers, probability/success measures, contribution modeling,
persistence, accounts and sharing remain later work.

## Answers and ranges — 0002-W4 v1

`horizon_app::plan_from_answers(&Answers)` converts the separate
[answers.v1](schemas/answers.v1.schema.json) document into an
[answers-plan.v1](schemas/answers-plan.v1.schema.json) result. The JSON entry
point `plan_from_answers_json` also returns that shape for malformed documents.
Both schemas are generated with `cargo run -p horizon-app --example output-schemas`.
The conversion rules are [decision 0017 and its amendment](../decisions/0017-incomplete-answers-and-ranges.md).
The strict engine, model/tax versions, earlier schemas and export format stay unchanged.

Answers use integer USD cents, with `per` year (default) or month. Monthly cents
are multiplied by twelve exactly. A range's middle is computed with exact
rational arithmetic and rounded half away from zero to the cent before annual
conversion. Every supplied and generated amount must fit the exact JSON cent
range; checked arithmetic failures return the existing money error codes.
Pay, spending and Social Security are in valuation-year dollars. Pension is in
those dollars only when it rises with prices, otherwise nominal. Account
balances and cost basis are cents at valuation. Headroom and sustainable
spending are whole USD per year in valuation-year dollars, using the existing
spending search, its cap and boundary verification.

`planning: "partner"` is unsupported before any missing-answer check. Missing
birth date, future retirement age/date, savings, or retirement spending yields
`incomplete`, with `needed` in that order and no run. `same_as_now` uses the
spending-now answer, including its range, and is missing when that answer is
later or the person is already retired. `none` savings means an empty account
list and permits a run. Reversed ranges, negative money and a retirement date
not after valuation when working yield the four documented answers error codes
(including the unsupported partner code). Other input/engine errors keep their
existing codes, inside the same result shape, with no successful calculation.

The generated input is a complete `Fixture` containing `household` and sorted
`assumptions`. One person is named `person`; each account kind has its own
one-based counter in answer order. Age retirement uses the birthday, clamping
29 February to 28 February in a non-leap year. Already-retired inputs use the
valuation date and equal before/after spending. Wages run from valuation to
retirement or the explicit pay end. Optional unknown income is zero, unknown
spending before retirement is zero, and each omission appears in `left_out`
with its tested direction. When both pay and spending now are unknown the
direction is `not_stated`. The top-level status is the entered run's status,
raised to `partial` for any left-out answer; `central.run_status` and
`central.omissions` describe that entered run, rather than the search run.

Every default is listed in `starting_values`: end age 95, Social Security age
67 when expecting benefits, and cash return 0.02, inflation 0.025, investment
return 0.05 and tax indexing 0.025. Assumptions use source `user`, valuation
year, and `user_overrode_default` false unless overridden. Unknown taxable
cost basis follows the balance, even across a range (too optimistic); a pension
whose price adjustment is not sure is fixed nominal (too pessimistic). A no
answer to Social Security or pension uses zero at ages 67/65 without a starting
value. The person's `not_sure` list is preserved independently of coverage.

For each ranged answer, the other answers stay at their middles while the
operation measures headroom at low and high. The lower headroom is worse,
with low winning ties. Spread is the absolute difference. Ranges rank by
spread descending, then answer name. Two combined inputs put every range at
its worse or better end; shared spending and inferred cost basis move together.
Each bound reports the same summary as `central`. `ordered` is true only when
worse headroom ≤ central headroom ≤ better headroom; a replaceable calculation
test proves a result outside those bounds is explicitly unordered.

```sh
cargo test -p horizon-app intake
cargo test -p horizon-app --test reference_values_intake
cargo run -p horizon-cli -- intake <answers.json>
```

For cumulative command checks, extract each of the 22 cases' `answers` from
[the unchanged reference values](../briefs/0002-W4-reference-values.json) to a
separate JSON file and run `intake` on every file. Exits are 0 complete,
3 partial, 4 incomplete, 1 invalid, 2 unsupported. The CLI contains only file
reading, operation dispatch, canonical JSON/newline output and exit mapping.
The `horizon-wasm::plan_from_answers` binding returns identical canonical bytes.
Native, CLI and Node WebAssembly tests compare every reference result, including
complete generated inputs. Record Node v24.22.0 for each WebAssembly command.
No screen or web worker protocol changes are part of this operation.
