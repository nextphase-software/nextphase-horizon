# 0008 — Ledger and required-distribution conventions (IRS applicable age and Uniform Lifetime Table; day-based flow activation; mid-year events; simple half-year growth on net flows; cash first; average-cost basis)

- Status: Accepted
- Date: 2026-10-16
- Related: [0003](0003-money-and-time-conventions.md) — makes its item 5 mid-year timing computable, without changing it; [0004](0004-withdrawals-before-59-half.md) and [0006](0006-surplus-and-withdrawal-order.md) — the order and the pre-59½ rule this ledger applies.

## Context

A yearly ledger needs exact answers to questions the earlier records leave open:
- when wages, benefits and spending start and stop within a year;
- how investment growth treats money moved during the year;
- where cash sits in the withdrawal order;
- how required minimum distributions are computed.

Without exact answers, two correct implementations would produce different results, and no reference values could be derived.

Sources, all retrieved 2026-10-16:
- **Applicable age** ([26 CFR 1.401(a)(9)-2(b)(2)](https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.401(a)(9)-2)):
  - people born 1951–1958: 73;
  - people born 1960 or later: 75;
  - the paragraph for people born in 1959 is reserved.
- **The 1959 cohort.** The statute ([26 USC 401(a)(9)(C)(v)](https://www.law.cornell.edu/uscode/text/26/401)) describes the 1959 cohort under both ages. A proposed regulation ([Federal Register 2024-14543](https://www.federalregister.gov/documents/2024/07/19/2024-14543/required-minimum-distributions)) would set 73.
- **Uniform Lifetime Table.** [IRS Publication 590-B (2025)](https://www.irs.gov/publications/p590b), Appendix B, Table III, gives the divisors for unmarried owners, from age 72 to "120 and over".
- **Timing.** The [IRS required minimum distribution FAQs](https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs) say:
  - a distribution uses the prior 31 December balance;
  - the first may be delayed to 1 April of the next year;
  - workplace-plan participants who are not 5% owners may delay until they retire;
  - Roth accounts need no distributions during the owner's life.

## Decision

**Required minimum distributions**

1. **Applicable age:**
   - 73 for people born 1951–1959, with 1959 following the proposed regulation. Runs for that cohort record the assumption `rmd_applicable_age_1959` and its source.
   - 75 for people born 1960 or later.
   - Owners born before 1951 are past their applicable age in every projection year.
2. **A distribution is due in each year in which age on 31 December is at least the applicable age,** and is taken in that year. The 1 April deferral is not modeled.
3. **Amount, per tax-deferred account:** the prior year-end balance ÷ the table divisor for age on 31 December, computed exactly and rounded once.
   - The prior year-end balance is the previous ledger closing balance.
   - In the base year, the opening balance stands in for it and is labeled an estimate.
4. **Roth accounts have no owner distributions.**
5. **The still-working exception is not modeled.** An employer-plan distribution in a year with active wages marks the run partial.

**Ledger timing**

6. **Year period.** Each year runs from its period start (1 January, or the valuation date in the base year) to 31 December. The period fraction f is days in the period ÷ days in the year.
7. **Flow activation by days.** An annual amount is multiplied by active days ÷ days in the year, computed exactly with the index factor and rounded once:
   - **wages:** from the start date, inclusive, to the end date, exclusive;
   - **spending:** before or after the retirement date;
   - **Social Security and pensions:** from the first day of the month after the birth month, in the year the person reaches the start age.
8. **Event date.** Distributions, withdrawals and deposits occur on 1 July, or on the period start if later. A withdrawal is before 59½ if this date is earlier than the birth date plus 59 years and 6 months (the last day of the month when that day does not exist).
9. **Growth.** Per account, growth = opening × r × f + net flow × r × f ÷ 2, computed exactly and rounded once.
   - The rate r is the declared `investment_return` (taxable, tax-deferred and Roth accounts) or `cash_return` (cash). Both are required, with no silent default.
   - Both must be zero or greater; negative returns are unsupported.
   - Simple half-year growth on net flows keeps the arithmetic exact.
10. **Order of operations in a year:**
    1. opening balances;
    2. income and spending;
    3. required distributions;
    4. need = spending − income − distributions;
    5. withdrawals, or a surplus deposit;
    6. shortfall;
    7. growth;
    8. closing balance.
    An account supplies at most its opening balance less its distribution, so no balance can become negative.
11. **Conservation holds exactly.** Every line is rounded once, and closing balances are computed from rounded lines. Each year, income + distributions + withdrawals + shortfall = spending + surplus deposit.

**Withdrawal order and surplus**

12. **The withdrawal order:**
    - **Cash first,** in every order.
    - **The named orders:** `taxable_first` (the default), `tax_deferred_first`, `roth_before_tax_deferred` and `proportional_taxable_tax_deferred`.
    - **Within one account type,** accounts are drawn in input order.
    - **The proportional order** splits a withdrawal across the taxable and tax-deferred accounts by available balance. Each share is rounded once, and the last account in input order takes the remainder.
    - **Before 59½,** the order is cash, taxable, tax-deferred, then Roth, as decision 0004 requires.
    - **A surplus** goes to the first taxable account, or to a created account `surplus-taxable`, labeled as created.

**Basis, contributions and input**

13. **Average-cost basis for taxable accounts.**
    - A deposit adds to the basis.
    - A withdrawal W from opening value V with basis B removes W × B ÷ V, rounded once.
    - The realized gain is W minus the basis removed, and can be negative.
14. **Contributions are not modeled yet.** Savings while working appear as surplus deposits, and the run lists the omission.
15. **The withdrawal order is an optional household input field,** which makes the household input schema v2.

## Consequences

- The yearly ledger is fully specified, so its reference values can be derived independently of any implementation.
- The tax calculation receives realized gains, basis and early-distribution flags.
- The 1959 rule is rechecked when the regulation is finalized.
- **Security:** none.

## Amendment — 2026-10-16: Proportional draws are capped; distributions below age 72 are unsupported

1. **Proportional order: draws never exceed an account's available balance.** Item 12's rule says each share is rounded once and the last account takes the remainder. With three or more accounts, that remainder can exceed the last account's balance. The draw for each account in input order is therefore its rounded share, but never more than the account's available balance, and at least the amount the later accounts cannot cover. Wherever the original rule is valid, the results are identical. Example: drawing 5 cents from balances of 2, 2, 2 and 1 cents gives 1, 1, 2 and 1.
2. **A distribution due below age 72 is unsupported,** with its own code. The Uniform Lifetime Table begins at 72; this arises only with historical valuation dates.
