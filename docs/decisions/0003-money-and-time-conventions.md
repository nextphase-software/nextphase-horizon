# 0003 — Money and time conventions (integer cents, round half up at line level, yearly steps with mid-year flows, exact-date ages)

- Status: Accepted
- Date: 2026-10-15
- Related: [0007](0007-rust-core-typescript-shell.md) — the stack that implements these rules.

## Context

Every projected value depends on how money is stored and rounded, and on when events happen within a year. Binary floating point cannot represent most decimal amounts exactly.

The IRS instructions for Form 1040 ([2025 edition](https://www.irs.gov/instructions/i1040gi), retrieved 2026-10-15) allow rounding to whole dollars by dropping amounts under 50 cents and raising amounts from 50 to 99 cents. They require the Tax Table for taxable income under $100,000 and the Tax Computation Worksheet at $100,000 or more. The table works in income bands; the worksheet applies exact rates. Federal income tax is computed per calendar year.

## Decision

1. **Store all money as integer cents of US dollars.** Arithmetic on cents is exact. Rates are applied to cents and the result is rounded.
2. **Round half up to the cent at the end of each ledger line and each tax line, never mid-formula.** Fixed rounding points make results reproducible and auditable. Half up matches the IRS whole-dollar convention for positive amounts.
3. **Compute federal tax with the exact rate schedules at all income levels, and state this in every tax output.** One method avoids the steps of the banded table.
4. **Project in yearly steps aligned to calendar (tax) years.** The ledger reconciles directly with annual tax and can be read line by line.
5. **Timing within a year:**
   - income, spending, contributions and withdrawals occur at mid-year;
   - investment growth applies to the opening balance for the full year and to the year's net flow for half a year;
   - required distributions occur in the year they are due.
   Each convention is named in the run metadata.
6. **Each age-based rule uses the person's exact birth date and defines its own test,** such as reaching an age on a given date or reaching it during the year. A birthday year is never treated as the whole year.
7. **Every monetary output carries a dollar basis.** Nominal is the default, and conversion to today's dollars uses the declared inflation assumption.

## Consequences

- Reference values exercise every rounding point and age boundary, including birthdays on 1 January and 31 December.
- For taxable income under $100,000, projected tax can differ by a few dollars from a filed return, which must use the Tax Table. Tax outputs state the method used.
- **Security:** none.

## Amendment — 2026-10-16: Rounding to the cent follows the IRS rule, including negative amounts

The IRS instructions for Form 1040 ([2025 edition](https://www.irs.gov/instructions/i1040gi), "Rounding Off to Whole Dollars", retrieved 2026-10-16) round whole dollars this way: drop amounts under 50 cents, and raise amounts from 50 to 99 cents to the next dollar. When several amounts are added to figure a line, the instructions include the cents while adding and round only the total. They do not state a rule for negative amounts. IRS forms show a negative amount as a positive figure in parentheses, so the rule is applied to the figure's size.

Item 2 is clarified to apply the same rule at cent precision:

1. **Round by size, to the nearest cent.** Drop less than half a cent; raise half a cent or more to the next cent. For example, $10.004 becomes $10.00 and $10.005 becomes $10.01.
2. **A negative amount is rounded by its size and keeps its sign.** For example, −$10.005 becomes −$10.01. This is rounding half away from zero, so equal and opposite amounts always round to equal and opposite cents.
3. **When a line adds several amounts, add them unrounded and round only the total,** as item 2 already requires.

Positive amounts round as before. Reference values include positive and negative half-cent cases and a line that sums several unrounded amounts.
