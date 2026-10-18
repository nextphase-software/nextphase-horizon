# 0012 — Application operations for answers (sustainable spending by whole-dollar search with a verified boundary; one-change levers ranked by their effect on headroom; input impact from low and high values; today's-dollar values for balances and shortfalls)

- Status: Accepted (amendment accepted 2026-10-18)
- Date: 2026-10-17
- Related: [0003](0003-money-and-time-conventions.md) — dollar basis and conversion to today's dollars; [0007](0007-rust-core-typescript-shell.md) — no adapter contains a calculation rule; [0009](0009-federal-tax-computation-conventions.md) — the run each operation repeats; [0010](0010-comparison-export-and-command-line-conventions.md) — change lists, canonical JSON, schemas and the command line.

## Context

A planning interface needs answers that a single run does not give:
- the most a household can spend in retirement without a shortfall;
- which single change moves the result most;
- which rough inputs matter.

Balances also come out only in nominal dollars, while results are easier to read in today's dollars. Computing any of this in an adapter would put calculation rules outside the core, which 0007 forbids.

Verified on 2026-10-17:
- **Monotonicity:** 405 runs across five synthetic households (`answers-working-61`, `A-drawdown`, `synthetic-retired`, `E-senior-2028-loss-carry` and `A-drawdown-tax_deferred_first`), sweeping after-retirement spending from $0 to twice the entered amount.
  - Total shortfall never decreased as spending rose.
  - The amounts with no shortfall always formed one unbroken range starting at $0.

  This is evidence, not proof, so every search verifies its own boundary.
- **Speed:** a command-line run took about 6 ms including process start-up.
- **Today's dollars:** `docs/model/engine-foundations.md` defines the conversion: divide by (1 + inflation)^(Y − B), then round once.

## Decision

**Sustainable spending**

1. **`sustainable_spending(input)` returns the highest whole-dollar after-retirement spending, in today's dollars, at which the run has no shortfall through the plan's end.**
   - Only that amount varies.
   - The result comes with the run at that amount, so its status, omissions and flags come with it.
2. **The search is a whole-dollar bisection, capped at $10,000,000 a year, whose answer is verified** (amendment A2). It flags two edge cases: no shortfall even at the cap, and a shortfall even at $0. It also records its run count.

**Levers**

3. **`levers(input)` reruns the plan with exactly one change at a time,** from a fixed set:
   - retirement date one year earlier and one year later;
   - after-retirement spending 10% lower and 10% higher;
   - investment return one percentage point lower and higher.

   Each change is a JSON Pointer change list under 0010.
4. **Each lever reports:**
   - its sustainable spending, first shortfall age, ending total in today's dollars, and status;
   - its effect: the change in headroom (amendment A1).

   Levers are ranked by the size of the effect; "what moves it most" names up to three kinds of change. **Social Security claiming age is excluded** until claiming rules are modeled, because the entered benefit is used as-is.

**Input impact**

5. **`input_impact(input, rough)` tries a low and a high value for each input marked rough.** An input's impact is the larger change in headroom, in whole dollars a year, and items are ranked by impact. The result describes how complete the inputs are, never a probability or a score.

**Today's dollars**

6. **The run output adds today's-dollar values alongside the nominal ones,** for account closing balances, the year's total closing balance and the year's shortfall, and for comparison summaries. Totals summed across years stay nominal only, labeled as such.

**Contracts**

7. **Contract changes:**
   - **Model version:** `horizon-engine-0.4.0`; earlier exports are rejected on import as 0010 requires.
   - **Schemas:** run output, comparison and export schemas move to version 2, with the export envelope keeping format version 1. The three operations get their own schemas.
   - **Command line:** new subcommands `horizon spend`, `horizon levers` and `horizon impact`, with the exit codes of 0010.
8. **Reference values are derived independently** for sustainable spending (including both edge cases), levers, input impact and today's values.

## Amendment — 2026-10-17: effects measured as change in headroom; the search and new fields specified exactly

Accepted 2026-10-18.

A1. **Effects are measured as the change in headroom.** Headroom H is sustainable spending S minus the entered after-retirement spending E, in whole dollars a year. A lever's effect, or an input's impact, is the change in H against the baseline.
   - **Why:** S alone does not depend on the entered amount, so spending levers would otherwise always show no effect.
   - **Retirement-date and return levers:** E is unchanged, so the effect equals the change in S.
   - **Spending levers:** S is unchanged, so the effect is the change in E.

A2. **The search algorithm:**
1. Let E = min(⌊entered cents ÷ 100⌋, cap). Run at E.
2. **If E has no shortfall:**
   - set lo = E; if lo is the cap, return the cap, flagged `at_or_above_cap`;
   - otherwise set hi = min(max(1, 2E), cap) and repeat: run at hi; if it has no shortfall, set lo = hi, return the cap (flagged) if hi is the cap, else hi = min(2·hi, cap); stop at the first shortfall.
3. **If E has a shortfall:** set hi = E and run at 0. If 0 also has a shortfall, return 0, flagged `shortfall_with_no_retirement_spending`; otherwise set lo = 0.
4. While hi − lo > 1, run at ⌊(lo + hi) ÷ 2⌋ and move lo or hi.
5. The answer is S = lo. Verify it by rerunning S (no shortfall) and S + 1 (a shortfall); otherwise return `SPENDING_SEARCH_NOT_MONOTONIC` (invalid).

The run count includes every run, both verification runs included. The run function is replaceable in tests.

A3. **The after-retirement amount must be in today's dollars;** otherwise the result is `SPENDING_BASIS_UNSUPPORTED` (unsupported).

A4. **Input-impact ranges.** Each item may give `low` and `high`. Otherwise defaults apply by path:
   - account balances, income amounts and spending: ±10%, rounded half away from zero to the cent;
   - cost basis: ±25%, the high value capped at the account's balance;
   - assumption rates: ±0.01 as exact decimals, never below 0.

   Any other path without a range returns `IMPACT_RANGE_REQUIRED` (invalid); a malformed pointer returns `SCENARIO_POINTER_INVALID`. Ties keep the input order.

A5. **Levers:**
   - **Retirement date:** moves to the same day one year earlier or later, with 29 February becoming 28 February. It is offered only if the household is not yet retired and the new date falls after the valuation date and by the plan's last 31 December. A wage ending on the old retirement date moves with it.
   - **Spending:** multiplied by 9/10 and 11/10, rounded half away from zero.
   - **Returns:** change by ±0.01 as exact decimals; the lower one is skipped below 0.
   - **Order:** `retire_earlier`, `retire_later`, `spend_lower`, `spend_higher`, `return_lower`, `return_higher`; ties keep this order.

A6. **Today's-dollar fields, in the federal-tax run only:**
   - each account gains `closing_today`;
   - each year gains `total_closing`, `total_closing_today` and `shortfall_today`;
   - comparison summaries gain `ending_total_today`, and each ending balance gains `balance_today`.

   Each value is converted with its own year's factor (the last projected year for summaries) and carries `dollar_basis: today`. The pre-tax ledger used by earlier reference values is unchanged.

## Consequences

- An interface can show these answers using engine values only, identical across the command line, WebAssembly and later adapters.
- The model version and output schemas change, by design. Golden outputs are regenerated by their generator.
- **Performance:** about 25 runs per search, and a few hundred for a full set of levers and input impacts. These run off the interface's main thread.
- **Security:** none new. The operations take the same inputs as a run.
