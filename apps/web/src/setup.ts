// SPDX-License-Identifier: AGPL-3.0-only
import type {
  AccountType,
  Household,
} from "./generated/types/household-input.v2";
import {
  dollarEntry,
  exactJson,
  parseDollars,
  parsePercent,
  parseWhole,
  percentEntry,
} from "./entry";
export const setupSteps = [
  "About you",
  "Income",
  "Accounts",
  "Spending",
  "Assumptions",
  "Review your answers",
];
type Assumption = { identifier: string; value: string; [key: string]: unknown };
export type Input = {
  household: Household;
  assumptions: Record<string, Assumption>;
  pass_limit?: number;
};
export type Draft = {
  input: Input;
  entries: Record<string, string>;
  rough: string[];
  visited: number[];
  linkedWages: boolean;
  dirty: boolean;
};
export type Field = {
  path: string;
  label: string;
  kind: "dollars" | "percent" | "whole" | "date" | "select";
  value: string;
  basis?: string;
  help?: string;
  readOnly?: boolean;
  options?: Record<string, string>;
  group?: string;
};
export const accountTypes = {
  cash: "Cash",
  taxable: "Brokerage (taxable)",
  tax_deferred: "Tax-deferred",
  roth: "Roth",
};
const planKinds = {
  employer_plan: "Workplace plan, such as a 401(k)",
  traditional_ira: "Traditional IRA",
};
export function accountNames(draft: Draft): string[] {
  const counts = new Map<string, number>();
  return draft.input.household.accounts.map((account, index) => {
    const kind =
      draft.entries[`/household/accounts/${index}/tax_deferred_kind`] ??
      account.tax_deferred_kind;
    const name = {
      cash: "Cash savings",
      taxable: "Brokerage account",
      tax_deferred:
        kind === "traditional_ira" ? "Traditional IRA" : "Workplace plan",
      roth: "Roth IRA",
    }[account.account_type];
    const count = (counts.get(name) ?? 0) + 1;
    counts.set(name, count);
    return count === 1 ? name : `${name} ${count}`;
  });
}
export const retirementPath = "/household/persons/0/retirement_date";
export const wageEndPath = "/household/income/wages/0/end_date";
export function createDraft(json: string): Draft {
  const fixture = JSON.parse(json);
  const input: Input = {
    ...fixture,
    assumptions: Object.fromEntries(
      fixture.assumptions.map((item: Assumption) => [item.identifier, item]),
    ),
  };
  return {
    input,
    entries: {},
    rough: [],
    visited: [0],
    linkedWages:
      input.household.income.wages[0]?.end_date ===
      input.household.persons[0].retirement_date,
    dirty: false,
  };
}
function get(input: Input, path: string): unknown {
  return path
    .slice(1)
    .split("/")
    .reduce<unknown>(
      (value, key) => (value as Record<string, unknown>)[key],
      input,
    );
}
function set(input: Input, path: string, value: unknown) {
  const keys = path.slice(1).split("/");
  const leaf = keys.pop()!;
  const parent = keys.reduce<unknown>(
    (value, key) => (value as Record<string, unknown>)[key],
    input,
  ) as Record<string, unknown>;
  parent[leaf] = value;
}
export function fields(draft: Draft, step: number): Field[] {
  const h = draft.input.household;
  const field = (
    path: string,
    label: string,
    kind: Field["kind"],
    extra: Partial<Field> = {},
  ): Field => {
    const raw = get(draft.input, path);
    return {
      path,
      label,
      kind,
      value:
        draft.entries[path] ??
        (kind === "dollars"
          ? dollarEntry(raw as number)
          : kind === "percent"
            ? percentEntry(raw as string)
            : String(raw)),
      ...extra,
    };
  };
  const amount = (path: string, label: string) =>
    field(`${path}/cents`, label, "dollars", {
      basis:
        get(draft.input, `${path}/dollar_basis`) === "today"
          ? "today's dollars"
          : "nominal dollars",
    });
  switch (step) {
    case 0:
      return [
        field("/household/persons/0/birth_date", "Birth date", "date"),
        field(retirementPath, "Retirement date", "date"),
        field("/household/persons/0/plan_end_age", "Plan to age", "whole", {
          help: "The age through which to project your household.",
        }),
        field("/household/valuation_date", "Values as of", "date", {
          readOnly: true,
          help: "The date the sample's balances and dollar values refer to.",
        }),
      ];
    case 1:
      return [
        ...(h.income.wages.length
          ? [
              amount("/household/income/wages/0/amount", "Wages per year"),
              field(
                wageEndPath,
                "Wages end on",
                "date",
                draft.linkedWages
                  ? {
                      readOnly: true,
                      value:
                        draft.entries[retirementPath] ??
                        h.persons[0].retirement_date,
                    }
                  : {},
              ),
            ]
          : []),
        amount(
          "/household/income/social_security/amount",
          "Social Security per year",
        ),
        field(
          "/household/income/social_security/start_age",
          "Social Security starts at age",
          "whole",
        ),
        amount("/household/income/pension/amount", "Pension per year"),
        field(
          "/household/income/pension/start_age",
          "Pension starts at age",
          "whole",
        ),
      ];
    case 2: {
      const names = accountNames(draft);
      return h.accounts.flatMap((account, index) => {
        const path = `/household/accounts/${index}`;
        const group = names[index];
        return [
          field(`${path}/account_type`, "Account type", "select", {
            options: accountTypes,
            group,
          }),
          field(`${path}/opening_balance_cents`, "Balance today", "dollars", {
            basis: "today's dollars",
            group,
          }),
          ...(account.account_type === "taxable"
            ? [
                field(`${path}/cost_basis_cents`, "Cost basis", "dollars", {
                  basis: "today's dollars",
                  help: "What you paid for the investments. It only affects tax when you sell. A rough value is fine.",
                  group,
                }),
              ]
            : []),
          ...(account.account_type === "tax_deferred"
            ? [
                field(`${path}/tax_deferred_kind`, "Plan kind", "select", {
                  options: planKinds,
                  group,
                  help: "The kind of retirement account determines the distribution rules.",
                }),
              ]
            : []),
        ];
      });
    }
    case 3:
      return [
        amount(
          "/household/spending/before_retirement",
          "Spending per year before retirement",
        ),
        amount(
          "/household/spending/after_retirement",
          "Spending per year after retirement",
        ),
      ];
    case 4:
      return Object.entries({
        inflation: ["Inflation", "How prices change each year."],
        investment_return: [
          "Investment return",
          "Annual return for invested accounts.",
        ],
        cash_return: ["Cash return", "Annual return for cash accounts."],
        tax_indexing: [
          "Tax-threshold indexing",
          "How federal tax thresholds change each year.",
        ],
      }).map(([id, [label, help]]) =>
        field(`/assumptions/${id}/value`, label, "percent", {
          help,
          basis: "percent per year",
        }),
      );
    default:
      return [];
  }
}
export function parseField(field: Field): string | bigint {
  if (field.kind === "dollars") return parseDollars(field.value);
  if (field.kind === "percent") return parsePercent(field.value);
  if (field.kind === "whole") return parseWhole(field.value);
  if (
    field.kind === "date" &&
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(field.value)
  )
    throw new Error("Enter a date in YYYY-MM-DD form");
  return field.value;
}
export function fieldErrors(
  draft: Draft,
  step: number,
): Record<string, string> {
  return Object.fromEntries(
    fields(draft, step).flatMap((field) => {
      try {
        parseField(field);
        return [];
      } catch (error) {
        return [[field.path, (error as Error).message]];
      }
    }),
  );
}
export function serializeDraft(draft: Draft): string {
  const input = structuredClone(draft.input);
  for (let step = 0; step < 5; step++)
    for (const field of fields(draft, step))
      // Keep unedited values (including cents) exactly as entered in a plan file.
      if (
        field.path in draft.entries ||
        (field.path === wageEndPath &&
          draft.linkedWages &&
          retirementPath in draft.entries)
      )
        set(input, field.path, parseField(field));
  return exactJson({ ...input, assumptions: Object.values(input.assumptions) });
}
export function changeEntry(draft: Draft, path: string, value: string): Draft {
  return {
    ...draft,
    entries: { ...draft.entries, [path]: value },
    dirty: true,
  };
}
export function linkWages(draft: Draft, linkedWages: boolean): Draft {
  return {
    ...changeEntry(
      draft,
      wageEndPath,
      fields(draft, 1).find((field) => field.path === wageEndPath)!.value,
    ),
    linkedWages,
  };
}
export function changeAccountType(
  draft: Draft,
  index: number,
  type: AccountType,
): Draft {
  const input = structuredClone(draft.input);
  const account = input.household.accounts[index];
  account.account_type = type;
  account.cost_basis_cents = type === "taxable" ? 0 : null;
  account.tax_deferred_kind = type === "tax_deferred" ? "employer_plan" : null;
  const removed = [
    `/household/accounts/${index}/cost_basis_cents`,
    `/household/accounts/${index}/tax_deferred_kind`,
  ];
  return {
    ...draft,
    input,
    entries: Object.fromEntries(
      Object.entries(draft.entries).filter(([key]) => !removed.includes(key)),
    ),
    rough: draft.rough.filter((path) => !removed.includes(path)),
    dirty: true,
  };
}
export function addAccount(draft: Draft): Draft {
  const input = structuredClone(draft.input);
  let number = 1;
  while (
    input.household.accounts.some(
      (account) => account.id === `account-${number}`,
    )
  )
    number++;
  input.household.accounts.push({
    id: `account-${number}`,
    owner: input.household.persons[0].id,
    account_type: "cash",
    opening_balance_cents: 0,
    cost_basis_cents: null,
    tax_deferred_kind: null,
  });
  return { ...draft, input, dirty: true };
}
