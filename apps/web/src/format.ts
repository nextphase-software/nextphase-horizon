// SPDX-License-Identifier: AGPL-3.0-only
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
export const formatDollars = (amount: number) => dollars.format(amount);
export function statusWord(status: string, omissions = 0): string {
  switch (status) {
    case "complete":
      return "Supported";
    case "partial":
      return `Partial (${omissions} omissions)`;
    case "unsupported":
      return "Unsupported";
    default:
      return "Invalid";
  }
}
export function flagWords(flag: string): string {
  switch (flag) {
    case "at_or_above_cap":
      return "No shortfall at or above the spending search cap.";
    case "shortfall_with_no_retirement_spending":
      return "Shortfall even with no retirement spending.";
    default:
      return flag.replaceAll("_", " ");
  }
}
