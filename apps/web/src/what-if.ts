// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersV2, MoneyAnswer } from "./generated/types/answers.v2";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { parsePercent, percentEntry } from "./entry";
import { centsDollars } from "./plan-display";
import { dateWords, enteredDollars } from "./intake-fields";

export type SliderId =
  | "retire"
  | "spending"
  | "savings"
  | "social_security"
  | "social_security_from"
  | "pension"
  | "investments_grow"
  | "prices_rise";
const uncertaintyKey: Partial<Record<SliderId, string>> = {
  spending: "spending_in_retirement",
  social_security_from: "social_security",
};
export type Changes = Partial<Record<SliderId, string>>;
export type Slider = {
  id: SliderId;
  label: string;
  unit: "age" | "money" | "rate";
  start: number | string;
  entry: string;
  min: number;
  max: number;
  step: number;
  note: string;
  marker: boolean;
  notSure: boolean;
  band?: [number, number];
};
// Display conversions only: cents stay integers and rates move their decimal point.
export const dollarsText = (cents: number) =>
  enteredDollars(cents).replace(/[$,]/g, "");
export function ageOn(birth: string, date: string) {
  const year = Number(date.slice(0, 4));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const birthday =
    birth.slice(5) === "02-29" && !leap ? "02-28" : birth.slice(5);
  return year - Number(birth.slice(0, 4)) - (date.slice(5) < birthday ? 1 : 0);
}
export function sliderText(slider: Slider, entry: string, accessible = false) {
  if (slider.unit === "age") return `age ${entry}`;
  if (slider.unit === "rate") return `${entry}%${accessible ? " a year" : ""}`;
  return `${centsDollars(Number(decimalCents(entry)))}${accessible && slider.id !== "savings" ? " a year" : ""}`;
}
function decimalCents(entry: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(entry))
    throw new Error("Enter a number with up to two decimal places.");
  const [whole, fraction = ""] = entry.split(".");
  return BigInt(whole + fraction.padEnd(2, "0"));
}
export function sliderError(slider: Slider, entry: string) {
  try {
    decimalCents(entry);
    if (slider.unit === "age" && !/^\d+$/.test(entry))
      return "Enter a whole age.";
    if (Number(entry) < slider.min || Number(entry) > slider.max)
      return `Enter a value from ${slider.min.toLocaleString("en-US")} to ${slider.max.toLocaleString("en-US")}.`;
  } catch (error) {
    return (error as Error).message;
  }
  return "";
}
export function sliderStarts(a: AnswersV2, r: AnswersPlanV2): Slider[] {
  if (!r.household_input || !["complete", "partial"].includes(r.status))
    return [];
  const { household: h, assumptions } = r.household_input;
  const person = h.persons[0];
  const result: Slider[] = [];
  function add(
    id: SliderId,
    label: string,
    unit: Slider["unit"],
    start: number | string,
    min: number,
    max: number,
    step: number,
    origin: "Your answer" | "Horizon used",
    answer?: MoneyAnswer | null,
    solvedAnswer?: string,
  ) {
    const entry = unit === "money" ? dollarsText(Number(start)) : String(start);
    const slider: Slider = {
      id,
      label,
      unit,
      start,
      entry,
      min: Math.min(min, Math.floor(Number(entry) / step) * step),
      max: Math.max(max, Math.ceil(Number(entry) / step) * step),
      step,
      note: "",
      marker: true,
      notSure: (a.not_sure ?? []).includes(uncertaintyKey[id] ?? id),
    };
    if (solvedAnswer && r.solved?.answer === solvedAnswer) {
      slider.note = `Worked out: ${r.solved.value == null ? (id === "retire" ? "no age works" : "no amount up to $100,000,000 works") : sliderText(slider, entry)}`;
      slider.marker = r.solved.value != null;
    } else if (answer && "range" in answer) {
      slider.note = `Your range: ${centsDollars(answer.range.low_cents)} to ${centsDollars(answer.range.high_cents)}`;
      slider.band = [
        Number(dollarsText(answer.range.low_cents)),
        Number(dollarsText(answer.range.high_cents)),
      ];
      slider.marker = false;
    } else slider.note = `${origin}: ${sliderText(slider, entry)}`;
    result.push(slider);
  }
  if (!a.retired) {
    const age =
      a.retirement && "age" in a.retirement
        ? a.retirement.age
        : r.solved?.answer === "retirement" && r.solved.value != null
          ? r.solved.value
          : ageOn(person.birth_date, person.retirement_date);
    add(
      "retire",
      "Retire at",
      "age",
      age,
      Math.max(50, ageOn(person.birth_date, h.valuation_date) + 1),
      80,
      1,
      "Your answer",
      undefined,
      "retirement",
    );
    if (a.retirement && "date" in a.retirement)
      result[result.length - 1].note =
        `Your answer: ${dateWords(a.retirement.date)}`;
  }
  const spending = a.spending_in_retirement;
  add(
    "spending",
    "Spending in retirement, a year",
    "money",
    h.spending.after_retirement.cents,
    0,
    200000,
    1000,
    "cents" in spending ? "Your answer" : "Horizon used",
    "same_as_now" in spending ? undefined : spending,
    "spending_in_retirement",
  );
  // The sole permitted sum: exact integer cents from the returned household input.
  const savings = Number(
    h.accounts.reduce(
      (sum, account) => sum + BigInt(account.opening_balance_cents),
      0n,
    ),
  );
  add(
    "savings",
    "Savings today",
    "money",
    savings,
    0,
    3000000,
    5000,
    "none" in a.savings ||
      ("accounts" in a.savings &&
        a.savings.accounts.every((account) => "cents" in account.balance))
      ? "Your answer"
      : "Horizon used",
    undefined,
    "savings",
  );
  if (a.social_security.expects !== "no") {
    const ss = a.social_security;
    add(
      "social_security",
      "Social Security, a year",
      "money",
      h.income.social_security.amount.cents,
      0,
      60000,
      500,
      ss.amount && !("later" in ss.amount) ? "Your answer" : "Horizon used",
      ss.amount,
    );
    add(
      "social_security_from",
      "Social Security from",
      "age",
      h.income.social_security.start_age,
      62,
      70,
      1,
      ss.start_age == null ? "Horizon used" : "Your answer",
    );
  }
  if (a.pension.expects === "yes" && !("later" in a.pension.amount))
    add(
      "pension",
      "Pension, a year",
      "money",
      h.income.pension.amount.cents,
      0,
      60000,
      500,
      "Your answer",
      a.pension.amount,
    );
  for (const [id, label, rate, max] of [
    ["investments_grow", "Investments grow, a year", "investment_return", 8],
    ["prices_rise", "Prices rise, a year", "inflation", 5],
  ] as const) {
    add(
      id,
      label,
      "rate",
      percentEntry(assumptions.find((item) => item.identifier === rate)!.value),
      0,
      max,
      0.25,
      a.assumptions?.[rate] == null ? "Horizon used" : "Your answer",
    );
  }
  return result;
}
export function changedAnswers(
  a: AnswersV2,
  r: AnswersPlanV2,
  changes: Changes,
): AnswersV2 {
  const next = structuredClone(a);
  for (const [id, entry] of Object.entries(changes)) {
    const cents = () => Number(decimalCents(entry));
    switch (id as SliderId) {
      case "retire":
        next.retirement = { age: Number(entry) };
        break;
      case "spending":
        next.spending_in_retirement = { cents: cents(), per: "year" };
        break;
      case "savings":
        next.what_if = { savings_total_cents: cents() };
        break;
      case "social_security":
        next.social_security.amount = { cents: cents(), per: "year" };
        next.social_security.start_age = Number(
          changes.social_security_from ??
            r.household_input!.household.income.social_security.start_age,
        );
        break;
      case "social_security_from":
        next.social_security.start_age = Number(entry);
        break;
      case "pension":
        if (next.pension.expects === "yes")
          next.pension.amount = { cents: cents(), per: "year" };
        break;
      case "investments_grow":
        next.assumptions = {
          ...next.assumptions,
          investment_return: parsePercent(entry),
        };
        break;
      case "prices_rise":
        next.assumptions = {
          ...next.assumptions,
          inflation: parsePercent(entry),
        };
        break;
    }
  }
  return next;
}
export function keptAnswers(
  a: AnswersV2,
  baseline: AnswersPlanV2,
  shown: AnswersPlanV2,
  changes: Changes,
): AnswersV2 {
  const next = changedAnswers(a, baseline, changes);
  if (changes.savings != null) {
    const accounts = shown.household_input!.household.accounts;
    const original = "accounts" in a.savings ? a.savings.accounts : [];
    const zero = baseline.household_input!.household.accounts.every(
      (account) => account.opening_balance_cents === 0,
    );
    next.savings = {
      accounts:
        !original.length || zero
          ? accounts.map((account) => ({
              kind: "taxable",
              balance: { cents: account.opening_balance_cents },
              cost_basis: { cents: account.cost_basis_cents! },
            }))
          : original.map((account, i) => ({
              ...account,
              balance: { cents: accounts[i].opening_balance_cents },
            })),
    };
  }
  delete next.what_if;
  const keys: Record<string, string> = {
    spending: "spending_in_retirement",
    savings: "savings",
    social_security: "social_security",
    social_security_from: "social_security",
    pension: "pension",
  };
  const kept = Object.keys(changes).map((id) => keys[id] ?? id);
  next.not_sure = (next.not_sure ?? []).filter((key) => !kept.includes(key));
  return next;
}
