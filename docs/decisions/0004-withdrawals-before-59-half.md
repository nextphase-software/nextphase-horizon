# 0004 — Withdrawals before age 59½ (taxable and cash first; additional tax on the taxable portion only; exceptions not modeled, so the result is partial)

- Status: Accepted
- Date: 2026-10-16
- Related: [0006](0006-surplus-and-withdrawal-order.md) — the withdrawal order this rule adjusts before 59½; [0003](0003-money-and-time-conventions.md) — exact-date age tests.

## Context

A distribution from a tax-deferred account before age 59½ generally incurs an additional tax. Several exceptions apply. A projection must handle early withdrawals without overstating or silently understating that tax.

The IRS describes the additional tax as 10% of the part of an early distribution that must be included in gross income ([Topic 557](https://www.irs.gov/taxtopics/tc557) and [Topic 558](https://www.irs.gov/taxtopics/tc558), retrieved 2026-10-15). Exceptions include separation from service in or after the year of reaching 55 (for plans other than IRAs) and substantially equal periodic payments, among others.

## Decision

1. **Before the person reaches 59½, draw cash and taxable accounts first.** This avoids the additional tax whenever other money is available.
2. **If a tax-deferred account must be drawn before 59½, apply the 10% additional tax only to the taxable portion of the distribution.** This follows the IRS rule exactly. It is never applied to the whole withdrawal.
3. **Do not model the exceptions yet.** A run that relies on a tax-deferred withdrawal before 59½ is marked partial, with the omission "early-distribution exceptions not modeled".
4. **A Roth withdrawal before 59½ also marks the result partial:** "Roth early-withdrawal ordering not modeled". Contribution basis and the five-year rules are not yet modeled.
5. **Retirement before 59½ is allowed, not blocked.** A clearly labeled partial result is more useful than none.

## Consequences

- The ledger applies the order and flags each affected year. The tax calculation applies the additional tax to the taxable portion.
- Reference values cover a partly taxable and a fully taxable early distribution.
- **Security:** none.
