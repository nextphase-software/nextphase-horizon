# 0006 — Surplus and withdrawal order (surplus to a named taxable account; taxable, then tax-deferred, then Roth by default, with named alternatives)

- Status: Accepted
- Date: 2026-10-16
- Related: [0004](0004-withdrawals-before-59-half.md) — adjusts the order before 59½; [0003](0003-money-and-time-conventions.md) — money and time rules.

## Context

Every projected year either has money left over or needs money from savings. Where a surplus goes and which account covers a gap change every later balance and, once taxes are modeled, the tax owed. A result is only explainable if both rules are explicit and shown line by line.

## Decision

1. **A surplus goes to a named taxable investment account and appears as its own ledger line.** If the household has none, one is created and labeled as such. Treating a surplus as spent would understate wealth, and hiding where it went would make the ledger unexplainable.
2. **The default withdrawal order is taxable, then tax-deferred, then Roth.** It is conventional and easy to explain, and it keeps tax-free money for last.
3. **A small named set of alternatives is offered:**
   - tax-deferred first;
   - Roth before tax-deferred;
   - proportional across taxable and tax-deferred accounts.
   The order used is named in every result.
4. **Required minimum distributions are taken before the order applies.** They are mandatory; any amount beyond what the year needs counts as surplus.
5. **No balance ever goes below zero, and no borrowing is ever created.** An amount no eligible account can cover is recorded as that year's shortfall.

## Consequences

- The yearly ledger implements the order and the surplus rule. Reference values cover each named order.
- Every withdrawal and surplus line names the rule that caused it.
- **Security:** none.
