# 0021 — Plain results (today's dollars wherever a person reads; one "Details for experts" layer for the dollars of each year and the mechanics; no separate input-check screen, the plan says which answers could change it)

- Status: Accepted
- Date: 2026-10-21
- Related:
  - [0016](0016-plain-status-words.md) — plain status words; its item 3 places the not-sure answers that could change a result, which this record moves onto the plan.
  - [0012](0012-application-operations-for-answers.md), amendment A6 — the today's-dollar values in the engine's output, which let every plain figure come from the engine.
  - [0017](0017-incomplete-answers-and-ranges.md) — the ranked ranges (`bounds.ranked`) and the `not_sure` list used by item 3.
  - [0011](0011-web-shell-stack.md), item 5 — the interface formats numbers but never computes financial values.
  - `DESIGN.md`, "Amounts", "Input completeness" and "Simple by default, detail on demand".

## Context

The plan, compare and export screens mix two kinds of dollars. The plan's "Savings by age" shows today's dollars while "Year by year" shows the dollars of each year, so the same savings appear as two amounts (in the working example, a peak of $934,687 and $1,031,719). Planner and engine terms (headroom, baseline, nominal, indexing, omissions) sit beside the answer; three answers at the top of the plan are each correct but take work to reconcile; dates appear as `2026-01-01`.

Verified on 2026-10-20 at `90938c7`:

- **The engine already returns today's dollars for every figure a plain reading needs:** year-end savings (`total_closing_today`), the shortfall (`shortfall_today`), spending (`entered`, `sustainable_spending`, `headroom`), levers (`effect`) and comparison end totals (`ending_total_today`). Yearly income, withdrawals and tax exist only in the dollars of each year.
- **The input-check screen ranks entries marked rough, and no screen marks an entry rough any more**, so it always reports none; a plan from a person's own figures does not link to it.
- **The comparison's every-line list labels all lines nominal**, though 79 of the 550 lines in the reference comparison (`answers-working-61` against `answers-working-61-retire-later`) carry `dollar_basis: today`.

## Decision

1. **Today's dollars wherever a person reads.** Plain screens show money only in today's dollars, stated once per screen with the base year ("Amounts are in today's dollars (2026 dollars)"). A figure the engine gives only in the dollars of each year, and any total added across years, is not shown on a plain screen.
2. **One "Details for experts" layer per screen,** closed by default and keyboard-operable: the year-by-year table and chart, the arithmetic of a shortfall year and the assumptions with their sources (plan); every line that differs and the totals added across years (comparison); file details and how opening a file works (export). Amounts there in the dollars of each year are labelled "dollars of each year", and a list that mixes bases labels each line from its own `dollar_basis`.
3. **No separate input-check screen.** A plan from a person's own figures has a section "Answers that could change this": their ranges, in the engine's ranking, then their not-sure answers. It stands apart from the answer and is never a probability or a score. Example households have no such answers and show no section. The engine's input-impact operation is unchanged.
4. **One answer first.** The plan opens with the headline, then at most two follow-ons: what would make the money last, then what moves the result most.
5. **Plain words and dates.** No planner or engine terms on a plain screen; the person's own plan is "Your plan"; dates read "1 January 2026"; the footer states the tax rules in a full sentence.

## Consequences

- `DESIGN.md` "Amounts" and "Input completeness" change to match items 1 and 3.
- The plan, compare and export screens and the footer change wording and layout, and the input-check screen and its step are removed. Every figure is still an engine value; figures in the dollars of each year move into the experts layer rather than being dropped.
- No engine, schema or reference change.
