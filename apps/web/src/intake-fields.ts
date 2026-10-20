// SPDX-License-Identifier: AGPL-3.0-only
import type {
  AnswersV2,
  AnswerAccount,
  MoneyAnswer,
  Balance,
} from "./generated/types/answers.v2";
import { percentEntry, parsePercent } from "./entry";
import { centsDollars } from "./plan-display";
export type Style = "one_question" | "conversation" | "guided_page";
export type Place = `${number}` | "review" | "results";
export const sections = ["About you", "Income", "Savings", "Spending"];
export const questions = [
  [
    "Are you planning alone or with a partner?",
    "Horizon plans for one person for now.",
  ],
  [
    "When were you born?",
    "Your age decides when income starts and when withdrawals become required.",
  ],
  ["Have you already retired?", "It changes which questions follow."],
  [
    "At what age do you plan to retire?",
    "Most results turn on this. You can try other ages later.",
  ],
  [
    "How long should the plan last?",
    "Running short late in life is the main risk, so the plan runs to 95 unless you choose otherwise.",
  ],
  [
    "What do you earn now, before tax?",
    "Your pay covers your spending until you retire.",
  ],
  [
    "Will you keep working until you retire?",
    "Your pay stops when your work does.",
  ],
  [
    "Do you expect Social Security?",
    "For most people it is the largest income in retirement.",
  ],
  [
    "At what age do you plan to start it?",
    "The amount depends on when you start.",
  ],
  [
    "About how much will you get, in today's money?",
    "Use the amount for the age you just gave.",
  ],
  ["Will you get a pension?", "It is income you can count on."],
  ["About how much a year, and from what age?", ""],
  [
    "Where do you keep your savings?",
    "Add each account. The kind matters because each is taxed differently.",
  ],
  [
    "About how much do you spend now, including everything?",
    "Your pay covers it until you retire.",
  ],
  [
    "How much do you expect to spend once you retire, in today's money?",
    "This is what your savings and income must pay for.",
  ],
];
export const sectionOf = (q: number) =>
  q <= 5 ? 0 : q <= 12 ? 1 : q === 13 ? 2 : 3;
export const moneyKeys = [
  "pay",
  "spending_now",
  "social_security",
  "pension",
  "savings",
  "spending_in_retirement",
] as const;
export type MoneyKey = (typeof moneyKeys)[number];
export const moneyQuestion: Record<MoneyKey, number> = {
  pay: 6,
  social_security: 10,
  pension: 12,
  savings: 13,
  spending_now: 14,
  spending_in_retirement: 15,
};
export type MoneyField = {
  text: string;
  low: string;
  high: string;
  range: boolean;
  per: "year" | "month";
  later: boolean;
  notSure: boolean;
};
export const emptyMoney = (): MoneyField => ({
  text: "",
  low: "",
  high: "",
  range: false,
  per: "year",
  later: false,
  notSure: false,
});
export const kinds = {
  cash: "Bank or cash savings",
  taxable: "Regular investment (brokerage) account",
  employer_plan: "Workplace plan, such as a 401(k) or 403(b)",
  traditional_ira: "Traditional IRA",
  roth: "Roth IRA or Roth 401(k)",
};
export type AccountField = {
  kind: AnswerAccount["kind"];
  balance: MoneyField;
  basis: string;
};
export type Fields = {
  valuation: string;
  planning: "alone" | "partner";
  birthMode: "date" | "age" | "later";
  birth: string;
  age: string;
  retired: boolean;
  retirementMode: "age" | "date" | "later";
  retirementAge: string;
  retirementDate: string;
  endAge: string;
  working: boolean;
  workEnd: string;
  social: "yes" | "no" | "not_sure";
  socialAge: string;
  pension: "yes" | "no";
  pensionAge: string;
  rises: "yes" | "no" | "not_sure";
  money: Record<MoneyKey, MoneyField>;
  accounts: AccountField[];
  editingAccount?: number;
  account: AccountField;
  savingsMode: "accounts" | "none" | "later";
  same: boolean;
  rates: Record<string, string>;
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const blankAccount = (): AccountField => ({
  kind: "cash",
  balance: emptyMoney(),
  basis: "",
});
export function newFields(valuation = localDate()): Fields {
  return {
    valuation,
    planning: "alone",
    birthMode: "date",
    birth: "",
    age: "",
    retired: false,
    retirementMode: "age",
    retirementAge: "",
    retirementDate: "",
    endAge: "",
    working: true,
    workEnd: "",
    social: "not_sure",
    socialAge: "",
    pension: "no",
    pensionAge: "",
    rises: "not_sure",
    money: Object.fromEntries(
      moneyKeys.map((key) => [key, emptyMoney()]),
    ) as Fields["money"],
    accounts: [],
    account: blankAccount(),
    savingsMode: "accounts",
    same: false,
    rates: {},
  };
}
export function visibleQuestions(fields: Fields) {
  return questions
    .map((_, i) => i + 1)
    .filter(
      (q) =>
        !(fields.retired && [4, 6, 7, 14].includes(q)) &&
        !(fields.social === "no" && [9, 10].includes(q)) &&
        !(fields.pension === "no" && q === 12),
    );
}
export const moneyError =
  "Enter an amount, like 85,000, 85k or 1.2m, with up to two decimal places.";
// USD text to whole cents. All scaling is integer arithmetic, including k/m suffixes.
export function parseMoney(text: string): number {
  const match = /^\$?((?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?)([km])?$/i.exec(
    text.trim(),
  );
  if (!match) throw new Error(moneyError);
  const [whole, fraction = ""] = match[1].replaceAll(",", "").split(".");
  const cents =
    BigInt(whole + fraction.padEnd(2, "0")) *
    (match[2]?.toLowerCase() === "k"
      ? 1000n
      : match[2]?.toLowerCase() === "m"
        ? 1000000n
        : 1n);
  if (cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      "Enter a smaller amount that can be represented exactly in the plan file.",
    );
  return Number(cents);
}
export function moneyAnswer(field: MoneyField): MoneyAnswer {
  if (field.later || (!field.text && !field.low && !field.high))
    return { later: true };
  if (field.range) {
    const low_cents = parseMoney(field.low),
      high_cents = parseMoney(field.high);
    if (low_cents > high_cents)
      throw new Error("Put the lower amount first, then the higher one.");
    return { range: { low_cents, high_cents }, per: field.per };
  }
  return { cents: parseMoney(field.text), per: field.per };
}
function balance(field: MoneyField): Balance {
  const value = moneyAnswer(field);
  if ("later" in value)
    throw new Error("Give a balance or add your savings later.");
  return "cents" in value ? { cents: value.cents } : { range: value.range };
}
function accountAnswer(account: AccountField): AnswerAccount {
  return {
    kind: account.kind,
    balance: balance(account.balance),
    ...(account.kind === "taxable" && account.basis
      ? { cost_basis: { cents: parseMoney(account.basis) } }
      : {}),
  };
}
export function hasAccountEntry(account: AccountField) {
  return !!(
    account.balance.text ||
    account.balance.low ||
    account.balance.high ||
    account.basis
  );
}
export function buildAnswers(f: Fields): AnswersV2 {
  const answer: AnswersV2 = {
    format: "horizon-answers",
    version: 2,
    valuation_date: f.valuation,
    planning: f.planning,
    birth_date:
      f.birthMode === "age" && f.age
        ? { age: Number(f.age) }
        : f.birthMode === "date" && f.birth
          ? { date: f.birth }
          : { later: true },
    retired: f.retired,
    social_security: {
      expects: f.social,
      ...(f.social !== "no"
        ? {
            ...(f.socialAge ? { start_age: Number(f.socialAge) } : {}),
            amount: moneyAnswer(f.money.social_security),
          }
        : {}),
    },
    pension:
      f.pension === "no"
        ? { expects: "no" }
        : {
            expects: "yes",
            amount: moneyAnswer(f.money.pension),
            ...(f.pensionAge ? { start_age: Number(f.pensionAge) } : {}),
            rises_with_prices: f.rises,
          },
    savings:
      f.savingsMode === "none"
        ? { none: true }
        : f.savingsMode === "later" ||
            f.money.savings.later ||
            (!f.accounts.length && !hasAccountEntry(f.account))
          ? { later: true }
          : {
              accounts: [
                ...f.accounts.map((account, index) =>
                  f.editingAccount === index && hasAccountEntry(f.account)
                    ? f.account
                    : account,
                ),
                ...(f.editingAccount == null && hasAccountEntry(f.account)
                  ? [f.account]
                  : []),
              ].map(accountAnswer),
            },
    spending_in_retirement:
      f.same && !f.retired
        ? { same_as_now: true }
        : moneyAnswer(f.money.spending_in_retirement),
    assumptions: Object.fromEntries(
      Object.entries(f.rates).map(([key, value]) => [key, parseRate(value)]),
    ),
    not_sure: moneyKeys.filter(
      (key) =>
        f.money[key].notSure &&
        !(f.retired && ["pay", "spending_now"].includes(key)) &&
        !(f.social === "no" && key === "social_security") &&
        !(f.pension === "no" && key === "pension"),
    ),
    ...(f.endAge ? { plan_end_age: Number(f.endAge) } : {}),
    ...(!f.retired
      ? {
          retirement:
            f.retirementMode === "age" && f.retirementAge
              ? { age: Number(f.retirementAge) }
              : f.retirementMode === "date" && f.retirementDate
                ? { date: f.retirementDate }
                : { later: true },
          pay: moneyAnswer(f.money.pay),
          pay_ends: f.working ? { at_retirement: true } : { date: f.workEnd },
          spending_now: moneyAnswer(f.money.spending_now),
        }
      : {}),
  };
  return answer;
}
export function parseRate(value: string) {
  const parsed = parsePercent(value);
  if (Number(value) > 20)
    throw new Error("Enter a percent from 0 to 20, with up to two decimals.");
  return parsed;
}
export const months = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, i, 1)),
  ),
);
export function dateWords(date: string, year = true) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${months[m - 1]}${year ? ` ${y}` : ""}`;
}
export function validDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === text
  );
}
function whole(text: string, optional = false) {
  return (!text && optional) || (/^\d+$/.test(text) && BigInt(text) <= 65535n);
}
export function questionError(f: Fields, q: number): string {
  if (q === 2) {
    if (f.birthMode === "later") return "";
    if (f.birthMode === "age")
      return /^\d+$/.test(f.age) && Number(f.age) >= 18 && Number(f.age) <= 110
        ? ""
        : "Give an age from 18 to 110, or add it later.";
    if (!validDate(f.birth)) return "Give a date that exists, or add it later.";
    const age =
      Number(f.valuation.slice(0, 4)) -
      Number(f.birth.slice(0, 4)) -
      (f.valuation.slice(5) < f.birth.slice(5) ? 1 : 0);
    return age >= 18 && age <= 110
      ? ""
      : "Give a birth date for an age from 18 to 110, or add it later.";
  }
  if (q === 4 && f.retirementMode !== "later")
    return f.retirementMode === "age"
      ? whole(f.retirementAge)
        ? ""
        : "Give a whole retirement age, or add it later."
      : validDate(f.retirementDate) && f.retirementDate > f.valuation
        ? ""
        : "Give a retirement date after the date of your figures, or add it later.";
  if (q === 7 && !f.working)
    return validDate(f.workEnd) && f.workEnd > f.valuation
      ? ""
      : "Give a work end date after the date of your figures.";
  if (q === 5 || q === 9)
    return whole(q === 5 ? f.endAge : f.socialAge, true)
      ? ""
      : "Give a whole age, or leave it empty.";
  const key = moneyKeys.find((key) => moneyQuestion[key] === q);
  if (key) {
    const field = f.money[key];
    if (field.later) return "";
    if (key === "spending_in_retirement" && f.same) return "";
    try {
      if (key === "savings") {
        if (f.savingsMode !== "accounts") return "";
        if (!hasAccountEntry(f.account) && (f.accounts.length || field.notSure))
          return "";
        accountAnswer(f.account);
      } else {
        if (!field.text && !field.low && !field.high && !field.notSure)
          return "Give an amount, mark it not sure, or add it later.";
        moneyAnswer(field);
      }
      if (q === 12 && !whole(f.pensionAge, true))
        return "Give a whole pension start age, or leave it empty.";
    } catch (error) {
      return (error as Error).message;
    }
  }
  return "";
}
const rawDollars = (cents: number) => {
  const value = BigInt(cents);
  return `${value / 100n}${value % 100n ? `.${String(value % 100n).padStart(2, "0")}` : ""}`;
};
function restoreMoney(
  value: MoneyAnswer | Balance | null | undefined,
  notSure = false,
): MoneyField {
  return {
    ...emptyMoney(),
    notSure,
    ...(!value || "later" in value
      ? { later: true }
      : "cents" in value
        ? { text: rawDollars(value.cents) }
        : {
            range: true,
            low: rawDollars(value.range.low_cents),
            high: rawDollars(value.range.high_cents),
          }),
    ...(value && "per" in value ? { per: value.per } : {}),
  };
}
export function fieldsFromAnswers(a: AnswersV2): Fields {
  const f = newFields(a.valuation_date);
  f.planning = a.planning;
  f.retired = a.retired;
  f.endAge = a.plan_end_age == null ? "" : String(a.plan_end_age);
  if ("age" in a.birth_date) {
    f.birthMode = "age";
    f.age = String(a.birth_date.age);
  } else if ("date" in a.birth_date) f.birth = a.birth_date.date;
  else f.birthMode = "later";
  if (a.retirement && "age" in a.retirement)
    f.retirementAge = String(a.retirement.age);
  else if (a.retirement && "date" in a.retirement) {
    f.retirementMode = "date";
    f.retirementDate = a.retirement.date;
  } else f.retirementMode = "later";
  f.working = !a.pay_ends || "at_retirement" in a.pay_ends;
  if (a.pay_ends && "date" in a.pay_ends) f.workEnd = a.pay_ends.date;
  f.social = a.social_security.expects;
  f.socialAge =
    a.social_security.start_age == null
      ? ""
      : String(a.social_security.start_age);
  f.pension = a.pension.expects;
  if (a.pension.expects === "yes") {
    f.pensionAge =
      a.pension.start_age == null ? "" : String(a.pension.start_age);
    f.rises = a.pension.rises_with_prices ?? "not_sure";
  }
  for (const key of moneyKeys) {
    const value =
      key === "social_security"
        ? a.social_security.amount
        : key === "pension"
          ? a.pension.expects === "yes"
            ? a.pension.amount
            : undefined
          : key === "savings"
            ? undefined
            : key === "spending_in_retirement"
              ? "same_as_now" in a.spending_in_retirement
                ? undefined
                : a.spending_in_retirement
              : a[key];
    f.money[key] = restoreMoney(value, a.not_sure?.includes(key));
  }
  f.same = "same_as_now" in a.spending_in_retirement;
  f.savingsMode =
    "none" in a.savings ? "none" : "later" in a.savings ? "later" : "accounts";
  f.money.savings.later = f.savingsMode === "later";
  if ("accounts" in a.savings)
    f.accounts = a.savings.accounts.map((a) => ({
      kind: a.kind,
      balance: restoreMoney(a.balance),
      basis:
        a.cost_basis && "cents" in a.cost_basis
          ? rawDollars(a.cost_basis.cents)
          : "",
    }));
  f.rates = Object.fromEntries(
    Object.entries(a.assumptions ?? {})
      .filter((entry): entry is [string, string] => entry[1] != null)
      .map(([key, value]) => [key, percentEntry(value)]),
  );
  return f;
}
export function enteredDollars(cents: number) {
  const value = BigInt(cents),
    fraction = value % 100n;
  return `$${(value / 100n).toLocaleString("en-US")}${fraction ? `.${String(fraction).padStart(2, "0")}` : ""}`;
}
export function moneyWords(answer: MoneyAnswer | Balance) {
  if ("later" in answer) return "To add later";
  return `${"cents" in answer ? centsDollars(answer.cents) : `${centsDollars(answer.range.low_cents)} to ${centsDollars(answer.range.high_cents)}`}${"per" in answer ? ` a ${answer.per}` : ""}`;
}
export function answerWords(a: AnswersV2, q: number): string {
  switch (q) {
    case 1:
      return a.planning === "alone" ? "Just me" : "With a partner";
    case 2:
      return "date" in a.birth_date
        ? dateWords(a.birth_date.date)
        : "age" in a.birth_date
          ? `Age ${a.birth_date.age}`
          : "To add later";
    case 3:
      return a.retired ? "Yes, I have" : "Not yet";
    case 4:
      return !a.retirement || "later" in a.retirement
        ? "To add later"
        : "age" in a.retirement
          ? `At ${a.retirement.age}`
          : dateWords(a.retirement.date);
    case 5:
      return a.plan_end_age == null
        ? "To age 95 (starting value)"
        : `To age ${a.plan_end_age}`;
    case 6:
      return moneyWords(a.pay ?? { later: true });
    case 7:
      return a.pay_ends && "date" in a.pay_ends
        ? dateWords(a.pay_ends.date)
        : "Yes";
    case 8:
      return { yes: "Yes", no: "No", not_sure: "Not sure" }[
        a.social_security.expects
      ];
    case 9:
      return a.social_security.start_age == null
        ? "At 67 (starting value)"
        : `At ${a.social_security.start_age}`;
    case 10:
      return moneyWords(a.social_security.amount ?? { later: true });
    case 11:
      return a.pension.expects === "yes" ? "Yes" : "No";
    case 12:
      return a.pension.expects === "yes"
        ? `${moneyWords(a.pension.amount)}${a.pension.start_age == null ? "" : `, from age ${a.pension.start_age}`}; ${a.pension.rises_with_prices === "yes" ? "rises with prices" : a.pension.rises_with_prices === "no" ? "stays the same" : "not sure whether it rises with prices"}`
        : "No";
    case 13:
      return "accounts" in a.savings
        ? a.savings.accounts
            .map(
              (account) =>
                `${kinds[account.kind]}: ${moneyWords(account.balance)}${account.cost_basis && "cents" in account.cost_basis ? `; put in ${centsDollars(account.cost_basis.cents)}` : ""}`,
            )
            .join("; ")
        : "none" in a.savings
          ? "No savings yet"
          : "To add later";
    case 14:
      return moneyWords(a.spending_now ?? { later: true });
    default:
      return "same_as_now" in a.spending_in_retirement
        ? "About the same as now"
        : moneyWords(a.spending_in_retirement);
  }
}
