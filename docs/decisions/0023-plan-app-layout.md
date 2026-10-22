# 0023 — Plan app layout (labelled navigation with a plan switcher and three headline figures; Overview first; a chart-first plan with life events in words and a year chooser; next steps as options, not advice; delivered in three builds)

- Status: Accepted (amendment accepted 2026-10-22)
- Date: 2026-10-21
- Related:
  - [0021](0021-plain-results.md) — today's dollars on plain screens and one experts layer. The year chooser and the first-year money card show only today's-dollar figures.
  - [0016](0016-plain-status-words.md) — status words, used unchanged on every new surface.
  - [0012](0012-application-operations-for-answers.md) — sustainable spending, levers and today's-dollar values, the source of every headline figure and option.
  - [0017](0017-incomplete-answers-and-ranges.md) and [0019](0019-reverse-answers-and-what-if.md) — ranges, worked-out answers and what-ifs, which decide what the headline figures show for a plan from a person's own figures.
  - [0011](0011-web-shell-stack.md), item 5 — the interface formats numbers but never computes financial values.
  - `DESIGN.md`, "Layout", "Financial content" and "Principles for screens".

## Context

**Results are reached as steps.** Plan, Compare and Export come in order under "Planning steps". Nothing stays on screen as a person moves between them, and the plan page ends on three buttons, with no summary of the answer or of what to do next.

Verified on 2026-10-21 at `ae6c658`, over every example household, every one-change copy of each, every 0002-W4, 0002-W5 and 0002-W7 reference case that shows a plan, and four engine fixtures opened as plan files:

- **The engine already returns today's dollars for every headline figure:**
  - year-end savings and the shortfall (`total_closing_today`, `shortfall_today`);
  - the most a person could spend (`sustainable_spending`, with `flag`, `cap`, `entered` and `headroom`);
  - what is left at the end (the last year's `total_closing_today`).
  
  Yearly income, withdrawals and tax exist only in the dollars of each year.
- **The first projection year is the valuation year,** so its amounts are today's dollars, and its ledger balances in every case: income, withdrawals, required withdrawals and any shortfall equal spending, federal tax and the amount added to savings. A valuation date after 1 January gives a part year (`period.start`).
- **Life events can be read from the run and the input:**
  - retirement from `retirement_date`;
  - Social Security and a pension from the first year each is paid (the input's start age in every case);
  - the shortfall from the first year short;
  - the end from the last year.
- **New savings while working are not modeled** (omission "contributions not modeled").

## Decision

1. **Labelled navigation on every plan screen.**
   - Five items: Overview, Plan, Compare, Summary, Your answers.
   - Shown as a side list from 900px wide and as a bar fixed to the bottom below that.
   - Labels are always shown, and the current item is marked with `aria-current`.
   - "Summary" opens the screen that shares and keeps a plan.
2. **A plan switcher** lists "Your plan" and each copy.
   - A copy can be viewed as a full plan, under a banner saying it is a copy and that your plan stays as it is.
   - A copy is not copied again.
3. **Three headline figures in today's dollars.**
   - The figures:
     - when savings run short or how long they last;
     - the most a person could spend a year;
     - what is left when the plan ends.
   - They appear as a strip on Plan, Compare and Summary, and as large figures with a one-line explanation on Overview.
   - They always describe the plan the switcher names.
   - None are shown without a result, or when a worked-out answer has no value, because that plan is only the search limit.
4. **Overview is where a plan opens,** from an example, a person's answers, an opened file or a restored session. It is a page of cards built from engine results:
   - the answer;
   - the savings chart;
   - this year's money;
   - what the result doesn't count;
   - what Horizon assumes;
   - what to do next.
5. **The Plan page opens with savings by age.**
   - Life events are marked on the line in words and repeated in the caption with their years.
   - A keyboard-operable year chooser shows that year's savings and money short in today's dollars, and the events that year.
   - That year's income, withdrawals and tax stay in "Details for experts" (0021 item 1).
6. **"Your money this year"** shows the first projection year only: money in and money out, each line with its amount, said in one sentence. A part year names its dates.
7. **Next steps are options, not advice.**
   - Each option is one change worked out by the engine (levers, sustainable spending), shown with its effect and a way to try it as a copy, and introduced as "options to explore, not advice".
   - No screen says "should", "recommend" or "we suggest".
   - Investment returns are shown as something a person can't choose.
   - Saving more is not offered until new savings while working are modeled.
8. **Delivered in three builds:**
   - 0003-W4: the layout, switcher, headline figures, Overview and chart-first Plan;
   - 0003-W5: the options, several copies compared side by side, and a printable one-page summary;
   - 0003-W6: the answers beside a live chart, with assumptions changed there.
   
   Until a later build replaces something, the earlier wording stays.

## Consequences

- **Every results screen changes.** It gains the navigation, the switcher and the headline strip, and the "Planning steps" navigation is removed.
- **No engine, schema or reference change.** The expected text of the new figures, events, year panels and first-year card is [0003-W4-shell-figures.json](../briefs/0003-W4-shell-figures.json), derived from engine output.
- **Engine work later:**
  - today's-dollar yearly income, withdrawals and tax;
  - one-off events;
  - new savings while working;
  - couples.

## Amendment — 2026-10-22: the printed summary and the spend-to-last copy

Accepted 2026-10-22.

1. **Printed summary.** In item 8, "a printable one-page summary" becomes "a printable summary".
   - It fits on one page when it can, and continues on a second page only when there is more to show (several copies, ranges, answers marked not sure).
   - The answer and the options always print on the first page.
2. **The spend-to-last copy.** The engine returns the most a person could spend in retirement (`sustainable_spending`, whole dollars, today's dollars), but it has no lever for that change.
   - The option "Spend {amount} a year in retirement" makes its copy with one change: `/household/spending/after_retirement/cents` set to `sustainable_spending × 100`.
   - The engine then runs the copy like any other: scenario, compare and sustainable spending.
   - Writing whole dollars as cents is an exact change of unit, not a calculation, so decision 0011 item 5 stands.
   - In every reference case where the option is offered ([0003-W5-options.json](../briefs/0003-W5-options.json)), the copy lasts to the plan end, and its sustainable spending reports exactly enough.
