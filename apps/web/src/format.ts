// SPDX-License-Identifier: AGPL-3.0-only
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
export const formatDollars = (amount: number) => dollars.format(amount);
export function countWord(count: number): string {
  return (
    [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
    ][count] ?? String(count)
  );
}
export function statusWord(status: string, omissions?: number): string {
  switch (status) {
    case "complete":
      return "Covers your situation";
    case "partial":
      return `Leaves out ${omissions ?? 0} things`;
    case "unsupported":
      return "Horizon can't plan for this yet";
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
