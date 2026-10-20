# 0019 — Reverse answers and what-if (when one of retirement age, savings or spending in retirement is left for later, the engine works it out instead of refusing; an age is enough in place of a date of birth; a what-if is a changed copy of the answers, so every figure comes from the engine)

- Status: Accepted
- Date: 2026-10-20
- Related:
  - [0017](0017-incomplete-answers-and-ranges.md), item 4 and amendments 1 and 2 — the "needed for any plan" group, which this record narrows for a new version of the answers, and the rules it keeps.
  - [0012](0012-application-operations-for-answers.md), items 1–2 and amendment A2 — the verified whole-dollar search for sustainable spending, reused here, and the pattern for the new searches.
  - [0011](0011-web-shell-stack.md), item 5 — the interface never computes financial values.
  - [0018](0018-answers-kept-on-the-device.md) — what is kept on the device; what-if values are not.
  - [0003](0003-money-and-time-conventions.md), [0006](0006-surplus-and-withdrawal-order.md), [0010](0010-comparison-export-and-command-line-conventions.md).

## Context

Under decision 0017, four answers stop a plan when they are left for later: the date of birth, retirement, savings and spending in retirement. The result then says the plan cannot be worked out yet. A person who does not know one of those figures gets nothing to explore.

Three of the four can be turned around. A person who knows their spending but not their savings can be told the savings they would need. One who knows their savings but not their spending can be told what they could spend. One who knows both but not when to retire can be told the earliest age that works. Only age cannot be turned around, because every other date depends on it, but an age is enough in place of a date.

Verified on 2026-10-20 at `0b6fa20` (engine 0.4.0, release build):

- **Spending is already solvable.** `sustainable_spending` (0012 items 1–2) returns the highest whole-dollar spending with no shortfall, with a verified boundary.
- **More savings never made a plan worse.** Five synthetic households were each given one taxable account whose cost basis equals its balance, swept from $0 to $3,000,000 in $50,000 steps: the working and retired examples, a high-spending working case, an early-retirement case with Social Security at 70, and a retired case with a pension that rises with prices. In 305 runs, total shortfall never rose as savings rose, and no plan stopped lasting. This is evidence, not proof, so the search verifies its own boundary.
- **Retiring later never stopped savings lasting** on the working example at spending of $50,000, $67,000, $80,000 and $100,000 a year, for ages 62 to 80 (76 runs). The search below does not rely on this: it tries every age in order.
- **Each run is fast natively** (about 6 ms including start-up, 0012). In the browser a run is slower, so the time is measured before a screen depends on it.

## Decision

**What can be left for later**

1. **Add version 2 of the answers document and of the result, `answers.v2` and `answers-plan.v2`.** Version 1 keeps its schemas and its rules (0017 with amendments 1 and 2) byte for byte, so every earlier result still reproduces. `plan_from_answers` accepts either version and answers in the same version.
2. **An age is enough.** In version 2, `birth_date` may be `{"age": n}`. The date of birth is then taken as the valuation date `n` years earlier, with 29 February becoming 28 February in a non-leap year. The result lists it as a starting value, with no direction stated. Ages under 18 or over 110 are invalid (`ANSWERS_AGE_RANGE`), checked after negative amounts and before the retirement date (0017 amendment 2, B3).
3. **Only age is needed for any plan.** In version 2 the result is `incomplete` only in two cases: the date of birth (or age) is left for later, or two or more of retirement, savings and spending in retirement are. `needed` then lists the date of birth if it is missing, and otherwise those answers, so the person can give any of them.
4. **Exactly one of the three left for later is worked out.** The result carries `solved`: the answer, its value and unit, and a flag for the edge cases below. The household input, the central run and every other figure are those at the worked-out value, so the result reproduces from the input it shows. When the value is null (`unreachable`), they are those at the search's limit: savings at the cap, or retirement at the last age tried.

**The three searches**

5. **Spending in retirement:** the existing sustainable-spending search (0012 items 1–2 and A2), unchanged, run on the household input with spending in retirement entered as $0. It returns the highest whole-dollar yearly spending in today's dollars with no shortfall through the plan's end. Its flags carry over: `at_or_above_cap` ($10,000,000 a year) and `shortfall_with_no_retirement_spending` (the value is then $0). "About the same as now" with spending now left for later counts as spending in retirement left for later. Spending before retirement is then left out, as 0017 item 5 already says.
6. **Savings:** the person's savings become one taxable account, `taxable-1`, owned by `person`, with its cost basis equal to its balance. The result is the smallest whole-dollar balance today with no shortfall through the plan's end, found exactly this way:
   - **Step 1:** run at $0. If it has no shortfall, the answer is $0, flagged `none_needed`.
   - **Step 2:** run at the cap, $100,000,000. If it has a shortfall, the value is null, flagged `unreachable`.
   - **Step 3:** otherwise set low = 0 and high = the cap. While high − low > 1, run at ⌊(low + high) ÷ 2⌋ dollars; set high to it when it has no shortfall, and low otherwise.

   The answer is high, so it is verified by construction: no shortfall at the answer, and a shortfall at one dollar less. The account kind is a starting value, "a brokerage account with no gain to tax", which may be too optimistic.
7. **Retirement age:** every whole age is tried in order, from the first birthday after the valuation date up to one year before the plan's end, retiring on that birthday (0017 item 3). The result is the first age with no shortfall through the plan's end. Pay ends at the tried retirement date unless `pay_ends` gives a date. The flag is `unreachable` when no age works, and the value is then null. The search needs pay: when pay is also left for later, retirement cannot be worked out and is listed in `needed`.
8. **Ranges with a worked-out answer are measured in that answer.**
   - **Each range:** with the other ranges at their middle, the worked-out value is found at the range's low end and at its high end. The worse end gives the worse value: less spending, more savings needed or a later age; a tie takes the low end. Spread is the absolute difference.
   - **Bounds:** the value is worked out with every ranged answer at its worse end, and again at its better end. `ordered` is true only when the central value lies between them.

   This is decision 0017 amendment A5 with the worked-out value in place of headroom. With nothing worked out, A5 applies unchanged.

**What if**

9. **A what-if is a changed copy of the answers.** A results screen may let a person change retirement age, spending, savings, the Social Security amount and start age, pension, investment growth and price rises. Each change is sent to `plan_from_answers` as a new answers document, and the screen shows what comes back. The interface computes nothing (0011 item 5).
10. **Total savings is the one what-if that is not an answer.**
    - **The field:** version 2 adds an optional `what_if` object with one field, `savings_total_cents`.
    - **How the total is shared:** the engine shares it among the person's accounts in proportion to their balances, counting a ranged balance at its middle. Shares are made in answer order; whole cents left over go by largest remainder, with ties to the earlier account.
    - **No accounts, or all at $0:** the total becomes one taxable account, as in item 6.
    - **Ranges and write-back:** a total set this way replaces any range on a balance. The result reports the shared balances in its household input, so keeping the what-if as the person's answers needs no arithmetic in the interface.
11. **What-if values are not saved.** Only the person's answers are kept on the device (0018). A what-if becomes an answer only when the person keeps it.

**Contracts and evidence**

12. **Result additions in version 2:**
    - **`solved`,** null when nothing is worked out, and `solved` in each bound;
    - **the new starting values;**
    - **`what_if`,** echoed when given.

    Every other field and rule is as in version 1. The command line (`horizon intake`) and `horizon-wasm` take either version, and the exit codes are as before (4 for incomplete).
13. **Reference values are derived independently before the brief,** from this record's text, on the existing `horizon run` and `horizon spend`. They cover:
    - each search, including each flag;
    - an age in place of a date, including 29 February;
    - every `needed` combination;
    - ranges with a worked-out answer;
    - the shared savings total;
    - version 1 documents, unchanged.
14. **The browser time is measured, not assumed.** The implementing milestone records the time `plan_from_answers` takes in the WebAssembly release build in four cases: nothing worked out, each search, and ranges. A screen that offers what-ifs then sets how it waits from those figures, for example by updating when a slider is released.

## Alternatives considered

- **Keep the four needed answers (0017 item 4).** Declined: it forces a number the person may not have.
- **Invent a starting figure for a missing savings or spending answer,** such as a typical balance. Declined: it would present an invented plan as the person's. Working out the missing value answers a real question instead.
- **Solve for two missing answers at once.** Declined: two unknowns have many answers. One is worked out, and the person gives the other.
- **Compute what-ifs in the interface.** Declined by 0011 item 5 and 0007 item 4.
- **Change version 1's rules in place.** Declined: earlier results and reference values must still reproduce.
- **Count a worked-out savings figure as cash or as a workplace plan.** Cash at 2% would overstate what is needed for most people, and a workplace plan would add income tax on every withdrawal. A brokerage account with no gain to tax is the simplest stated assumption, and the result says which way it leans.

## Consequences

- **Requires:** version 2 schemas, the two new searches, the age answer, the shared savings total, the flags and the new code, documentation, the measured browser time, and an engine milestone before any screen uses them.
- **Unchanged:** the engine core, the household input schema, version 1 answers and results, and the plan file format.
- **Cost:**
  - a worked-out savings answer takes about 30 runs;
  - a worked-out retirement age takes at most one run per year of age;
  - with ranges, each range adds two more searches, plus two for the bounds.

  Natively each run takes milliseconds. In the browser the time is measured before a what-if screen is built.
- **Security and privacy:** unchanged from 0017 and 0018. What-if values are never stored.
