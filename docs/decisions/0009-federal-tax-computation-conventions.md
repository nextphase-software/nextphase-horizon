# 0009 — Federal income tax computation conventions (single filer; 2026 law from Rev. Proc. 2025-32; projected amounts indexed and rounded down to $50; tax paid in-year by fixed-point iteration)

- Status: Accepted
- Date: 2026-10-16
- Related: [0005](0005-tax-rule-contract-and-base-year.md) — the rule contract this applies; [0003](0003-money-and-time-conventions.md) — rounding; [0004](0004-withdrawals-before-59-half.md) — early distributions; [0008](0008-ledger-and-required-distribution-conventions.md) — the ledger that funds the tax.

## Context

Computing federal tax every projection year needs exact answers to several questions:
- which income is ordinary;
- how capital losses carry forward;
- which amounts are indexed and how they round;
- how a tax that depends on the year's own withdrawals is paid;
- when a result counts as complete.

Sources, all retrieved 2026-10-16:
- **2026 single-filer amounts** ([Rev. Proc. 2025-32](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf)):
  - brackets: 10% to $12,400; 12% to $50,400; 22% to $105,700; 24% to $201,775; 32% to $256,225; 35% to $640,600; 37% above;
  - standard deduction $16,100; additional amount $2,050 for an unmarried person 65 or over;
  - capital gains: 0% up to $49,450 and 15% up to $545,500 of taxable income.
- **Senior deduction** ([26 USC 151(d)(5)(C)](https://www.law.cornell.edu/uscode/text/26/151)): $6,000, reduced by 6% of modified AGI above $75,000, for tax years beginning before 2029.
- **Social Security** ([26 USC 86](https://www.law.cornell.edu/uscode/text/26/86)): the base amount is $25,000 and the adjusted base amount $34,000, not indexed.
- **Capital losses** ([26 USC 1211(b)](https://www.law.cornell.edu/uscode/text/26/1211)): up to $3,000 a year against other income.
- **Rounding of indexed increases** ([26 USC 1(f)(7)](https://www.law.cornell.edu/uscode/text/26/1), [63(c)](https://www.law.cornell.edu/uscode/text/26/63)): down to a multiple of $50.
- **Age 65** ([Form 1040 instructions](https://www.irs.gov/instructions/i1040gi)): someone born on 1 January is treated as 65 at the end of the preceding year.

## Decision

**What is taxed**

1. **Ordinary income:** wages, pensions, every tax-deferred distribution and withdrawal (fully taxable; nondeductible basis is not modeled), and cash-account growth as interest.
2. **Taxable-account growth is unrealized until withdrawn.** Dividends and interest inside taxable accounts are not modeled; this is named and listed as an omission.
3. **Capital gains:** realized gains are long-term. A net loss offsets up to $3,000 of other income, and the rest carries forward.
4. **Social Security** is taxed under 26 USC 86 exactly.

**Deductions**

5. **Standard deduction:** $16,100, plus $2,050 when 65 by year end (born on or before 1 January of the year minus 64). Itemized deductions are not modeled.
6. **Senior deduction:** $6,000 − 6% × max(0, AGI − $75,000), never negative, in tax years 2025–2028 only.

**Computing the tax**

7. **Tax:**
   - taxable income = max(0, AGI − deductions);
   - ordinary income is taxed by the brackets;
   - net capital gains are stacked above ordinary income at 0%, 15% and 20%;
   - 10% applies to tax-deferred withdrawals before 59½.
   Each tax line is rounded once.
8. **Years after 2026:** each indexed amount (bracket thresholds, standard deduction, age-65 amount, capital-gains thresholds) is the 2026 amount × (1 + `tax_indexing`)^(Y − 2026), rounded down to a multiple of $50.
   - `tax_indexing` is a required, sourced assumption, zero or greater.
   - Rates and the other statutory amounts are not indexed.
   - Tax years before 2026 are unsupported.
9. **Every rule value carries its source, tax year and kind** (published or projected).

**Paying the tax**

10. **Tax is paid in the same year,** funded through the withdrawal order.
    - Each year repeats from zero tax until a pass computes exactly the tax it paid.
    - If passes cycle through cent rounding, the year pays the highest amount in the cycle and shows the difference as a separate rounding-settlement line.
    - A year that neither settles nor cycles within 50 passes is marked partial.
    - Unpayable tax becomes shortfall.
    - Each year, income + distributions + withdrawals + shortfall = spending + tax paid + surplus.
11. **In the base year,** tax covers the projected period only; it is labeled an estimate when the period starts after 1 January.

**Status and omissions**

12. **A run is complete unless a partial flag applies:**
    - early distributions, early Roth withdrawals or the still-working exception (0004, 0008);
    - contributions, when wages are active in some year;
    - tax funding that does not converge;
    - modified AGI above $200,000, where the net investment income tax is not modeled.
    Always listed, without changing the status: state tax, the alternative minimum tax, taxable-account dividends and interest, itemized deductions and credits.
13. **The ledger without tax remains reproducible** against its earlier reference values.

## Consequences

- Every tax line can be defined exactly, so reference values can be derived independently of any implementation.
- Each IRS release replaces projected amounts with published ones, as a versioned rule-set update.
- **Security:** none.
