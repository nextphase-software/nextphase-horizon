// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import { endAge, firstShortfall, yearAtDate } from "./plan-display";
import { wholeDollars } from "./compare-display";
export function answerOne(
  run: Run,
  spending: SustainableSpending,
  retirementDate: string,
) {
  const short = firstShortfall(run);
  const retired = retirementDate <= run.valuation_date;
  if (outsidePlan(run, retirementDate))
    return short
      ? `Retirement falls after the plan ends: savings run short at age ${short.age_on_december_31} (${short.year}).`
      : `Retirement falls after the plan ends: savings last to ${endAge(run)}.`;
  if (!retired && short && short.year < Number(retirementDate.slice(0, 4)))
    return `No: savings run short at age ${short.age_on_december_31} (${short.year}), before you retire.`;
  return short
    ? `${retired ? "No: at" : "Not at"} ${wholeDollars(spending.entered)} a year${retired ? "," : ":"} savings run short at age ${short.age_on_december_31} (${short.year}).`
    : `Yes: at ${wholeDollars(spending.entered)} a year, savings last to ${endAge(run)}.`;
}
export const outsidePlan = (run: Run, retirementDate: string) =>
  retirementDate > run.valuation_date && !yearAtDate(run, retirementDate);
export function answerTwo(
  run: Run,
  spending: SustainableSpending,
  retirementDate: string,
) {
  if (outsidePlan(run, retirementDate))
    return "Retirement falls after the plan ends, so the plan has no retirement spending to test.";
  if (spending.flag === "shortfall_with_no_retirement_spending")
    return "Savings run short even with no retirement spending.";
  if (spending.flag === "at_or_above_cap")
    return `At least ${wholeDollars(spending.cap)} a year in today's dollars; the search stops there.`;
  return `${wholeDollars(spending.sustainable_spending)} a year in today's dollars lasts to ${endAge(run)}: ${spending.headroom === 0 ? "exactly what you plan to spend." : `${wholeDollars(Math.abs(spending.headroom))} ${spending.headroom < 0 ? "less" : "more"} than you plan to spend.`}`;
}
export function answerThree(levers: Levers) {
  return (
    levers.what_moves_most
      .map(
        (kind) =>
          ({
            return: "investment returns",
            spending: "spending",
            retirement_date: "the retirement date",
          })[kind as "return" | "spending" | "retirement_date"],
      )
      .join(", then ")
      .replace(/^./, (letter) => letter.toUpperCase()) + "."
  );
}
