// SPDX-License-Identifier: AGPL-3.0-only
import { countWord, formatDollars } from "./format";
import { parseDollars } from "./entry";
import { fields, type Draft, type Field } from "./setup";

export function matters(
  spending: number | bigint,
  impact: number | bigint,
): boolean {
  const i = BigInt(impact);
  return i !== 0n && 100n * (i < 0n ? -i : i) >= BigInt(spending);
}
export function onePercent(spending: number): number {
  return Number((BigInt(spending) + 50n) / 100n);
}
export function barScale(maximum: number): number {
  for (let power = 1; ; power *= 10)
    for (const coefficient of [1, 2, 2.5, 5])
      if (coefficient * power >= maximum) return coefficient * power;
}
export function inputHeadline(total: number, significant: number): string {
  if (!total) return "No entries are marked rough.";
  if (total === 1)
    return `One entry is rough. It ${significant ? "matters" : "barely matters"}.`;
  const count = countWord(total);
  const ending = !significant
    ? "None of them matter."
    : significant === total
      ? "All of them matter."
      : `${countWord(significant)} of them matter.`;
  return `${count.charAt(0).toUpperCase()}${count.slice(1)} entries are rough. ${ending.charAt(0).toUpperCase()}${ending.slice(1)}`;
}
export function setupFields(draft: Draft): (Field & { step: number })[] {
  return [0, 1, 2, 3, 4].flatMap((step) =>
    fields(draft, step).map((field) => ({ ...field, step })),
  );
}
export function roughItems(draft: Draft): { path: string }[] {
  return setupFields(draft)
    .filter((field) => draft.rough.includes(field.path))
    .map(({ path }) => ({ path }));
}
export const signedDollars = (value: number) =>
  formatDollars(value).replace("-", "−");
export function entryDescription(
  draft: Draft,
  field: Field,
): { title: string; value: string; yearly: boolean } {
  const path = field.path;
  const yearly = path.includes("/income/") || path.includes("/spending/");
  const amount =
    field.kind === "percent"
      ? `${field.value}%`
      : `$${(parseDollars(field.value) / 100n).toLocaleString("en-US")}`;
  let title = field.label;
  let from = "";
  if (path.includes("/social_security/")) {
    title = "Social Security benefit";
    from = ` from ${fields(draft, 1).find((f) => f.path === "/household/income/social_security/start_age")!.value}`;
  } else if (path.includes("/pension/")) {
    title = "Pension";
    from = ` from ${fields(draft, 1).find((f) => f.path === "/household/income/pension/start_age")!.value}`;
  } else if (path.includes("/wages/")) title = "Wages";
  else if (path.includes("/accounts/"))
    title = `${field.group} ${path.endsWith("cost_basis_cents") ? "cost basis" : "balance"}`;
  else if (path.includes("/spending/"))
    title = path.includes("/before_retirement/")
      ? "Spending until you retire"
      : "Spending after you retire";
  const costBasis = path.endsWith("cost_basis_cents");
  return {
    title,
    yearly,
    value:
      field.kind === "percent"
        ? `${amount} a year`
        : `${amount}${yearly ? " a year" : ""}${from}${!costBasis && field.basis ? `, ${field.basis}` : ""}`,
  };
}
