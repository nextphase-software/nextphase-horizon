// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { Comparison } from "./generated/types/comparison.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import { centsDollars, endAge, firstShortfall } from "./plan-display";
import { formatDollars } from "./format";
import { percentEntry } from "./entry";

export const wholeDollars = (value: number) =>
  formatDollars(value).replace("-", "−");
export const signedDollars = (value: number) =>
  `${value > 0 ? "+" : ""}${wholeDollars(value)}`;
export const signedCents = (value: number) =>
  `${value > 0 && centsDollars(value) !== "$0" ? "+" : ""}${centsDollars(value)}`;
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
  return (
    "What changed: " +
    comparison.changed_inputs
      .map((change) => {
        const before = change.baseline;
        const after = change.scenario;
        switch (change.path) {
          case "/household/persons/0/retirement_date":
            return `retirement date ${before} → ${after}`;
          case "/household/income/wages/0/end_date":
            return `wages end ${before} → ${after}${after === retirementDate ? " (follows the retirement date)" : ""}`;
          case "/household/spending/after_retirement/cents":
            return `spending after you retire ${centsDollars(Number(before))} a year → ${centsDollars(Number(after))} a year`;
          case "/assumptions/investment_return/value":
            return `investment return ${percentEntry(String(before))}% → ${percentEntry(String(after))}%`;
          default:
            return `${change.path} ${before} → ${after}`;
        }
      })
      .join("; ")
  );
}
