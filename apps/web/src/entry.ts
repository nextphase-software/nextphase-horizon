// SPDX-License-Identifier: AGPL-3.0-only
export const dollarMessage = "Enter a whole-dollar amount, like 150,000";
export const percentMessage =
  "Enter a percent from 0 to 100, with up to two decimal places";
export function parseDollars(text: string): bigint {
  if (!/^\$?(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)$/.test(text))
    throw new Error(dollarMessage);
  return BigInt(text.replace(/[$,]/g, "") + "00");
}
export function parseWhole(text: string): bigint {
  if (!/^[0-9]+$/.test(text))
    throw new Error("Enter a whole number using digits only");
  return BigInt(text);
}
export function parsePercent(text: string): string {
  if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(text)) throw new Error(percentMessage);
  const [whole, fraction = ""] = text.split(".");
  const hundredths = BigInt(whole + fraction.padEnd(2, "0"));
  if (hundredths > 10000n) throw new Error(percentMessage);
  const digits = hundredths.toString().padStart(5, "0");
  return minimalDecimal(`${digits.slice(0, -4)}.${digits.slice(-4)}`);
}
function minimalDecimal(text: string): string {
  return text.replace(/0+$/, "").replace(/\.$/, "");
}
export function percentEntry(rate: string): string {
  const [whole, fraction = ""] = rate.split(".");
  const digits = whole + fraction.padEnd(2, "0");
  const shifted = `${BigInt(digits.slice(0, whole.length + 2))}.${fraction.slice(2)}`;
  return minimalDecimal(shifted);
}
export function dollarEntry(cents: number): string {
  // Samples use whole dollars. Formatting and parsing never use binary fractions.
  return (BigInt(cents) / 100n).toLocaleString("en-US");
}
export function exactJson(value: unknown): string {
  // Preserve integers beyond JS's safe range so the engine can reject their meaning.
  // The marker cannot occur in the sample's immutable strings or parsed entry values.
  return JSON.stringify(value, (_, item) =>
    typeof item === "bigint" ? `$horizon-integer:${item}` : item,
  ).replace(/"\$horizon-integer:([0-9]+)"/g, "$1");
}
