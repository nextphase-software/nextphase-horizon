// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { endAge, firstShortfall, yearAtDate } from "./plan-display";
import { wholeDollars } from "./compare-display";
export const outsidePlan = (run: Run, retirementDate: string) =>
  retirementDate > run.valuation_date && !yearAtDate(run, retirementDate);
export function followOn(run: Run, spending: SustainableSpending, retirementDate: string, result?: AnswersPlanV2) {
  if (result?.solved) return null;
  const end = endAge(run), entered = wholeDollars(spending.entered), sustainable = wholeDollars(spending.sustainable_spending);
  let text: string;
  if (outsidePlan(run, retirementDate)) text = "Your retirement falls after the plan ends, so there is no retirement spending to test.";
  else if (spending.flag === "shortfall_with_no_retirement_spending") text = (firstShortfall(run)?.year ?? Infinity) < Number(retirementDate.slice(0, 4))
    ? "Savings run short before you retire, so spending less in retirement can't fix this on its own."
    : "Savings run short even with no spending in retirement.";
  else if (spending.flag === "at_or_above_cap") text = `You could spend at least ${wholeDollars(spending.cap)} a year and savings would still last to ${end}.`;
  else if (spending.headroom < 0) text = `To make them last to ${end}, spend ${sustainable} a year instead of ${entered}.`;
  else if (spending.headroom > 0) text = `You could spend up to ${sustainable} a year, ${wholeDollars(spending.headroom)} more than the ${entered} you plan to spend.`;
  else text = `${entered} a year is exactly what you could spend for savings to last to ${end}.`;
  return result?.bounds ? `At the middle of your ranges, ${text[0].toLowerCase()}${text.slice(1)}` : text;
}
export function movesMost(levers: Levers) {
  const list = levers.what_moves_most.map((kind) => ({ return: "investment returns", spending: "spending", retirement_date: "the retirement date" })[kind as "return" | "spending" | "retirement_date"]).join(", then ");
  return list ? `What moves it most: ${list}.` : null;
}
