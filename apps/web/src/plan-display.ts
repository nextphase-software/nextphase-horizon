// SPDX-License-Identifier: AGPL-3.0-only
import type { Run, ProjectionYear } from "./generated/types/run-output.v2";
import type { Lever } from "./generated/types/levers.v1";
import { percentEntry } from "./entry";
import { countWord, formatDollars } from "./format";

// USD cents to whole USD for display only, exactly half away from zero.
export function centsDollars(cents: number): string {
  const integer = BigInt(cents);
  const magnitude = ((integer < 0n ? -integer : integer) + 50n) / 100n;
  return `${integer < 0n && magnitude !== 0n ? "−" : ""}$${magnitude.toLocaleString("en-US")}`;
}
export const firstShortfall = (run: Run) =>
  run.years.find((year) => year.ledger.shortfall.cents > 0);
export const firstDistribution = (run: Run) =>
  run.years.find((year) => year.ledger.rmd_total.cents > 0);
export const endAge = (run: Run) => run.years.at(-1)!.age_on_december_31;
export function yearAtDate(run: Run, date: string) {
  return run.years.find((year) => String(year.year) === date.slice(0, 4));
}
export function planHeadline(run: Run): string {
  const short = firstShortfall(run);
  if (!short) return `Savings last to ${endAge(run)}.`;
  const age = short.age_on_december_31;
  // The brief explicitly defines the headline's age interval; no money is derived.
  const remaining = endAge(run) - age;
  return remaining === 0
    ? `Savings run short at ${age}, in the plan's last year.`
    : `Savings run short at ${age}, ${countWord(remaining)} ${remaining === 1 ? "year" : "years"} before the plan ends.`;
}
export function savingsRows(run: Run, retirementDate: string) {
  const retirementYear = Number(retirementDate.slice(0, 4));
  const short = firstShortfall(run);
  const highest = run.years.reduce((best, year) =>
    year.ledger.total_closing_today!.cents >
    best.ledger.total_closing_today!.cents
      ? year
      : best,
  );
  return run.years.filter(
    (year, index, years) =>
      index === 0 ||
      index === years.length - 1 ||
      year.year === retirementYear ||
      year.year === retirementYear + 1 ||
      year.age_on_december_31 % 5 === 0 ||
      year === highest ||
      year === short,
  );
}
export function leverLabel(lever: Lever, run: Run): string {
  const value = lever.changes[0].value;
  switch (lever.id) {
    case "return_higher":
    case "return_lower":
      return `Investment returns 1 point ${lever.id === "return_higher" ? "higher" : "lower"} (${percentEntry(String(value))}%)`;
    case "spend_lower":
    case "spend_higher":
      return `Spend 10% ${lever.id === "spend_lower" ? "less" : "more"} in retirement (${centsDollars(Number(value))} a year)`;
    default:
      return `Retire a year ${lever.id === "retire_later" ? "later" : "earlier"}, at ${yearAtDate(run, String(value))!.age_on_december_31}`;
  }
}
export const direction = (effect: number) =>
  effect > 0 ? "▲ Better" : effect < 0 ? "▼ Worse" : "No change";
export const signedEffect = (effect: number) =>
  effect === 0
    ? "No change"
    : `${effect > 0 ? "+" : "−"}${formatDollars(Math.abs(effect))}`;
export const assumptionNames: Record<string, string> = {
  cash_return: "Cash return",
  inflation: "Inflation",
  investment_return: "Investment return",
  tax_indexing: "Tax-threshold indexing",
};
export const withdrawalWords: Record<string, string> = {
  taxable_first:
    "cash and taxable accounts first, then tax-deferred, then Roth",
  tax_deferred_first: "tax-deferred accounts first",
  roth_before_tax_deferred: "Roth before tax-deferred",
  proportional_taxable_tax_deferred: "taxable and tax-deferred in proportion",
};
export function ledgerNotes(
  run: Run,
  retirementDate: string,
  year: ProjectionYear,
) {
  const social = run.years.find(
    (row) => (row.ledger.income.social_security?.cents ?? 0) > 0,
  );
  return [
    year === yearAtDate(run, retirementDate) && "Retires",
    year === social && "Social Security starts",
    year === firstDistribution(run) && "Required distributions start",
    year === firstShortfall(run) && "Savings run short",
  ]
    .filter(Boolean)
    .join(" · ");
}
