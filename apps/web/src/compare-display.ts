// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { Comparison } from "./generated/types/comparison.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import { centsDollars, endAge, firstShortfall, yearAtDate } from "./plan-display";
import { formatDollars } from "./format";
import { percentEntry } from "./entry";

export const wholeDollars = (value: number) =>
  formatDollars(value).replace("-", "−");
export const compareAmount = (value: number, cents = false) => value !== 0 && Math.abs(value) < (cents ? 100 : 1) ? "less than $1" : (cents ? centsDollars(value) : wholeDollars(value));
export const signedDollars = (value: number) => value === 0 ? "Same" : `${value > 0 ? "+" : "−"}${compareAmount(Math.abs(value))}`;
export const signedCents = (value: number) => value === 0 ? "Same" : `${value > 0 ? "+" : "−"}${compareAmount(Math.abs(value), true)}`;
export const plannedSpending = (value: number) => value === 0 ? "exactly enough" : `${compareAmount(Math.abs(value))} ${value < 0 ? "short" : "to spare"}`;
export const savingsOutcome = (run: Run) => {
  const short = firstShortfall(run);
  return short
    ? `run short at ${short.age_on_december_31}`
    : `last to ${endAge(run)}`;
};
export function compareHeadline(subject: string, baseline: Run, copy: Run) {
  const b = firstShortfall(baseline)?.age_on_december_31;
  const c = firstShortfall(copy)?.age_on_december_31;
  const end = endAge(copy);
  if (b !== undefined && c === undefined)
    return `${subject}: savings last to ${end} instead of running short at ${b}.`;
  if (b === undefined && c !== undefined)
    return `${subject}: savings run short at ${c} instead of lasting to ${end}.`;
  if (b === undefined && c === undefined)
    return `${subject}: savings still last to ${end}.`;
  return b === c
    ? `${subject}: savings still run short at ${c}.`
    : `${subject}: savings run short at ${c} instead of ${b}.`;
}
export function savingsChange(baseline: Run, copy: Run) {
  const b = firstShortfall(baseline)?.age_on_december_31 ?? Infinity;
  const c = firstShortfall(copy)?.age_on_december_31 ?? Infinity;
  return c === b ? "Same" : c > b ? "▲ Better" : "▼ Worse";
}
// Compare rounded display values, without deriving a difference or new amount.
export function amountChange(
  before: number,
  after: number,
  cents = false,
  kind: "better" | "shortfall" | "tax" = "better",
) {
  const format = cents ? centsDollars : wholeDollars;
  if (format(before) === format(after)) return "Same";
  if (kind === "tax") return after > before ? "▲ Higher" : "▼ Lower";
  if (kind === "shortfall")
    return after > before ? "▲ Higher, worse" : "▼ Lower, better";
  return after > before ? "▲ Better" : "▼ Worse";
}
export function spendingValue(spending: SustainableSpending) {
  return spending.flag === "shortfall_with_no_retirement_spending"
    ? "none: short even with no retirement spending"
    : spending.flag === "at_or_above_cap"
      ? `at least ${wholeDollars(spending.cap)}`
      : wholeDollars(spending.sustainable_spending);
}
export function changedInputs(comparison: Comparison, retirementDate: string) {
  const retirementChanged = comparison.changed_inputs.some((c) => c.path === "/household/persons/0/retirement_date");
  return "What changed: " + comparison.changed_inputs.flatMap((change) => {
    const before = change.baseline, after = change.scenario;
    switch (change.path) {
      case "/household/persons/0/retirement_date": return [`Retire at ${yearAtDate(comparison.scenario, String(after))!.age_on_december_31} instead of ${yearAtDate(comparison.baseline, String(before))!.age_on_december_31}.`];
      case "/household/income/wages/0/end_date": return retirementChanged && after === retirementDate ? [] : [`Pay stops in ${String(after).slice(0, 4)} instead of ${String(before).slice(0, 4)}.`];
      case "/household/spending/after_retirement/cents": return [`Spend ${centsDollars(Number(after))} a year in retirement instead of ${centsDollars(Number(before))}.`];
      case "/assumptions/investment_return/value": return [`Returns of ${percentEntry(String(after))}% a year instead of ${percentEntry(String(before))}%.`];
      default: return [`${change.path} ${before} → ${after}`];
    }
  }).join(" ");
}
