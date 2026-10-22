// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { AnswersPlanV2, Fixture } from "./generated/types/answers-plan.v2";
import { centsDollars, endAge, firstShortfall } from "./plan-display";
import { wholeDollars, compareAmount } from "./compare-display";
import { outsidePlan } from "./plan-answers";
import { ageOn } from "./what-if";
import { dateWords } from "./intake-fields";

export type Figure = [string, string, string | null, string];
export function headlineFigures(
  run: Run,
  spending: SustainableSpending,
  retirement: string,
  answer?: AnswersPlanV2,
): Figure[] | null {
  if (answer?.solved?.flag === "unreachable") return null;
  const short = firstShortfall(run),
    end = endAge(run);
  const left = run.years.at(-1)!.ledger.total_closing_today!.cents;
  let value: string,
    unit: string | null = "a year",
    explanation: string;
  if (outsidePlan(run, retirement)) {
    value = "Not tested";
    unit = null;
    explanation = "Your retirement falls after the plan ends.";
  } else if (spending.flag === "shortfall_with_no_retirement_spending") {
    value = "None";
    unit = null;
    explanation =
      (short?.year ?? Infinity) < Number(retirement.slice(0, 4))
        ? "Savings run short before you retire, so spending less in retirement can't fix this on its own."
        : "Savings run short even with no spending in retirement.";
  } else {
    value =
      spending.flag === "at_or_above_cap"
        ? `At least ${wholeDollars(spending.cap)}`
        : wholeDollars(spending.sustainable_spending);
    explanation =
      answer?.solved?.answer === "spending_in_retirement"
        ? "Horizon worked this out from your other answers."
        : spending.entered === 0
          ? "No spending in retirement is counted."
          : spending.headroom === 0
            ? "Exactly what you plan to spend in retirement."
            : `You plan ${wholeDollars(spending.entered)} a year in retirement.`;
  }
  return [
    [
      "Savings",
      short ? `Run short at ${short.age_on_december_31}` : `Last to ${end}`,
      null,
      short
        ? `${centsDollars(short.ledger.shortfall_today!.cents)} of spending isn't covered in ${short.year}.`
        : `The plan runs to ${end}.`,
    ],
    ["Most you could spend", value, unit, explanation],
    [
      `Left at ${end}`,
      compareAmount(left, true),
      null,
      left > 0
        ? "What savings would hold when the plan ends."
        : "Nothing is left when the plan ends.",
    ],
  ];
}
export const shellNote = (run: Run, ranged = false) =>
  `Today's dollars (${run.valuation_date.slice(0, 4)} dollars)${ranged ? " · middle of your ranges" : ""}`;
export type PlanEvent = {
  label: string;
  year: number;
  index: number;
  short: boolean;
};
export function planEvents(run: Run, input: Fixture): PlanEvent[] {
  const person = input.household.persons[0];
  const events: PlanEvent[] = [];
  const add = (label: string, index: number, short = false) =>
    events.push({ label, index, year: run.years[index].year, short });
  run.years.forEach((row, index) => {
    if (
      person.retirement_date > run.valuation_date &&
      row.year === Number(person.retirement_date.slice(0, 4))
    )
      add(
        `Retire at ${ageOn(person.birth_date, person.retirement_date)}`,
        index,
      );
    for (const [key, label] of [
      ["social_security", "Social Security"],
      ["pension", "Pension"],
    ] as const) {
      const first = run.years.findIndex(
        (y) => (y.ledger.income[key]?.cents ?? 0) > 0,
      );
      if (index > 0 && index === first)
        add(`${label} starts at ${row.age_on_december_31}`, index);
    }
    if (row === firstShortfall(run))
      add(`Savings run short at ${row.age_on_december_31}`, index, true);
    if (index === run.years.length - 1)
      add(`Plan ends at ${row.age_on_december_31}`, index);
  });
  return events;
}
export const chartCaption = (events: PlanEvent[]) =>
  `Total savings at the end of each year. Marked on the line: ${events.map((e) => `${e.label} (${e.year})`).join(" · ")}.`;
export const yearText = (row: Run["years"][number]) =>
  `${row.year}, age ${row.age_on_december_31}`;
export function firstYearMoney(run: Run) {
  const row = run.years[0],
    l = row.ledger;
  const wages = Object.entries(l.income).filter(
    ([key, value]) => key.startsWith("wages.") && value.cents > 0,
  );
  const moneyIn: [string, number][] = wages.map(([, value], i) => [
    wages.length > 1 ? `Pay ${i + 1}` : "Pay",
    value.cents,
  ]);
  moneyIn.push(
    ["Social Security", l.income.social_security?.cents ?? 0],
    ["Pension", l.income.pension?.cents ?? 0],
    ["Taken from savings", l.withdrawals_total.cents],
    ["Required withdrawals", l.rmd_total.cents],
    ["Money short", l.shortfall.cents],
  );
  const moneyOut: [string, number][] = [
    ["Spending", l.spending.cents],
    ["Federal tax", l.federal_tax?.paid.cents ?? 0],
    ["Added to savings", l.surplus_deposit.cents],
  ];
  const I = l.income_total.cents,
    S = l.spending.cents,
    T = l.federal_tax?.paid.cents ?? 0,
    A = l.surplus_deposit.cents;
  const savings = l.withdrawals_total.cents > 0 || l.rmd_total.cents > 0;
  const part = l.period.start.slice(5) !== "01-01";
  const dates = `${dateWords(l.period.start).replace(/ \d{4}$/, "")} to 31 December ${row.year}`;
  const lead = part ? `From ${dates}` : `In ${row.year}`;
  const outs = [
    S > 0 ? `spending of ${centsDollars(S)}` : "",
    T > 0 ? `${centsDollars(T)} of federal tax` : "",
  ]
    .filter(Boolean)
    .join(" and ");
  let sentence: string;
  if (!I && !S && !T && !A && !savings && !l.shortfall.cents)
    sentence = `${lead}, no money comes in or goes out.`;
  else {
    if (l.shortfall.cents > 0)
      sentence = `${lead}, ${I ? `income of ${centsDollars(I)} and what's left in savings don't` : "what's left in savings doesn't"} cover ${outs}: ${centsDollars(l.shortfall.cents)} is short.`;
    else if (outs)
      sentence = `${lead}, ${I ? `income of ${centsDollars(I)}${savings ? " and money taken from savings" : ""}` : "money taken from savings"} ${I && savings ? "cover" : "covers"} ${outs}${A > 0 ? `, and ${centsDollars(A)} left over is added to savings` : ""}.`;
    else
      sentence = `${lead}, ${centsDollars(I)} comes in and is added to savings.`;
    if (!S) sentence += " No spending is counted this year.";
  }
  return {
    sentence,
    moneyIn: moneyIn.filter(([, n]) => n > 0),
    moneyOut: moneyOut.filter(([, n]) => n > 0),
    note: `${part ? `Amounts from ${dates}` : `${row.year} amounts`}, which are today's dollars. Savings also grow with returns; that isn't shown here.`,
  };
}
