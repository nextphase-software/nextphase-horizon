# 0005 — Tax rules across future years (three-part rule contract; base tax year 2026)

- Status: Accepted
- Date: 2026-10-16
- Related: [0003](0003-money-and-time-conventions.md) — rounding and rate-schedule arithmetic.

## Context

A projection covers 30 or more years, but tax law is known only for the present. Some current law already has future dates. For example, the IRS states that the additional deduction for seniors applies only to tax years 2025 through 2028 ([IRS](https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors), retrieved 2026-10-16). The general inflation-adjusted amounts for 2026 are published in [Rev. Proc. 2025-32](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf) (retrieved 2026-10-16). As of 2026-10-16, the IRS has published no general 2027 adjustments.

## Decision

1. **Every rule value belongs to one of three kinds:**
   - **(a) Enacted schedules:** law already in force with future start or end dates applies on those dates, including expirations.
   - **(b) Unknown future values:** brackets, deductions and limits not yet published are projected from the base year by a declared indexing assumption.
   - **(c) Hypothetical policy:** proposed or speculative changes are never applied by default. A user may opt in to a labeled alternative, including a frozen-law scenario.
2. **The base tax year is 2026,** the latest year whose general amounts are published.
3. **Every rule value carries its source (URL and retrieval date), its tax year and its kind.** Outputs show which kind each year's values are.
4. **The indexing assumption for kind (b) is a declared, sourced assumption,** never a hidden constant.
5. **Provisions that are not modeled are listed as omissions** in every run they could affect.

## Consequences

- Freezing current law would keep the senior deduction past 2028; guessing at legislation would present speculation as a result. This contract avoids both.
- Reference values cover a year inside and a year outside each year-limited provision.
- Each annual IRS adjustment becomes a versioned rule-set update with its own reference values.
- **Security:** none.
