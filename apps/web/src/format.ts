// SPDX-License-Identifier: AGPL-3.0-only
import type { Result } from "./Answer";
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
export function sampleIntroduction(
  samples: { label: string; result: Result }[],
): string {
  const complete = samples.filter(
    ({ result }) => result.status === "complete",
  ).length;
  const partial = samples.filter(
    ({ result }) => result.status === "partial",
  ).length;
  const unsupported = samples.filter(
    ({ result }) => result.status === "unsupported",
  );
  let none = countWord(unsupported.length);
  if (unsupported.length === 1) {
    const { label, result } = unsupported[0];
    if ("code" in result) {
      const message = result.message.replace(/\.$/, "");
      none = `the ${label.toLowerCase()} (${message.charAt(0).toLowerCase()}${message.slice(1)})`;
    }
  }
  return `The engine gives a full result for ${countWord(complete)} of these ${countWord(samples.length)} sample households, a partial one for ${countWord(partial)}, and none for ${none}.`;
}
export function statusWord(status: string, omissions?: number): string {
  switch (status) {
    case "complete":
      return "Supported";
    case "partial":
      return omissions === undefined
        ? "Partial"
        : `Partial (${omissions} omissions)`;
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
