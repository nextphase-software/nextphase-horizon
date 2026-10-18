// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import working from "../../../packages/app/fixtures/answers-working-61.json?raw";
import edited from "../../../packages/app/test-data/web-edited-working-61.json?raw";
import { samples } from "./fixtures";
import {
  accountNames,
  addAccount,
  changeAccountType,
  changeEntry,
  createDraft,
  fieldErrors,
  fields,
  linkWages,
  retirementPath,
  serializeDraft,
  wageEndPath,
} from "./setup";
it("preserves all unedited sample values, dollar bases and run options", () => {
  for (const sample of samples)
    expect(JSON.parse(serializeDraft(createDraft(sample.json)))).toEqual(
      JSON.parse(sample.json),
    );
});
it("preserves every sample value and writes exactly the two edited values", () => {
  const draft = createDraft(working);
  expect(JSON.parse(serializeDraft(draft))).toEqual(JSON.parse(working));
  const changed = changeEntry(
    changeEntry(
      draft,
      "/household/accounts/2/opening_balance_cents",
      "600,000",
    ),
    "/assumptions/inflation/value",
    "3",
  );
  expect(JSON.parse(serializeDraft(changed))).toEqual(JSON.parse(edited));
  expect(JSON.parse(working).household.accounts[2].opening_balance_cents).toBe(
    52000000,
  );
});
it("links wage end date until unchecked and preserves the independent date", () => {
  let draft = changeEntry(createDraft(working), retirementPath, "2025-06-01");
  expect(
    JSON.parse(serializeDraft(draft)).household.income.wages[0].end_date,
  ).toBe("2025-06-01");
  draft = linkWages(draft, false);
  draft = changeEntry(draft, retirementPath, "2032-01-01");
  expect(
    JSON.parse(serializeDraft(draft)).household.income.wages[0].end_date,
  ).toBe("2025-06-01");
  draft = changeEntry(draft, wageEndPath, "2035-01-01");
  expect(
    JSON.parse(serializeDraft(draft)).household.income.wages[0].end_date,
  ).toBe("2035-01-01");
  expect(
    JSON.parse(serializeDraft(linkWages(draft, true))).household.income.wages[0]
      .end_date,
  ).toBe("2032-01-01");
});
it("changes account-dependent fields and removes hidden rough marks", () => {
  let draft = createDraft(working);
  const path = "/household/accounts/1/cost_basis_cents";
  draft = { ...changeEntry(draft, path, "100,000"), rough: [path] };
  draft = changeAccountType(draft, 1, "tax_deferred");
  const account = JSON.parse(serializeDraft(draft)).household.accounts[1];
  expect(account).toMatchObject({
    account_type: "tax_deferred",
    cost_basis_cents: null,
    tax_deferred_kind: "employer_plan",
  });
  expect(draft.rough).toEqual([]);
  for (const type of ["cash", "roth"] as const)
    expect(
      changeAccountType(draft, 1, type).input.household.accounts[1],
    ).toMatchObject({ cost_basis_cents: null, tax_deferred_kind: null });
  draft = changeAccountType(draft, 1, "taxable");
  expect(draft.input.household.accounts[1]).toMatchObject({
    cost_basis_cents: 0,
    tax_deferred_kind: null,
  });
});
it("appends zero-balance owned cash accounts with collision-free identifiers", () => {
  let draft = addAccount(createDraft(working));
  draft.input.household.accounts[0].id = "account-2";
  draft = addAccount(draft);
  expect(draft.input.household.accounts.at(-1)).toEqual({
    id: "account-3",
    owner: "sample-person",
    account_type: "cash",
    opening_balance_cents: 0,
    cost_basis_cents: null,
    tax_deferred_kind: null,
  });
  expect(draft.input.household.withdrawal_order).toBeUndefined();
});
it("limits rough candidates to amounts and rates; formatting errors remain separate from engine meaning", () => {
  let draft = createDraft(working);
  draft = changeEntry(
    draft,
    "/household/accounts/2/opening_balance_cents",
    "1.50",
  );
  expect(Object.keys(fieldErrors(draft, 2))).toEqual([
    "/household/accounts/2/opening_balance_cents",
  ]);
  expect(
    fields(draft, 0).every(
      (field) => !["dollars", "percent"].includes(field.kind),
    ),
  ).toBe(true);
  expect(
    fieldErrors(
      changeEntry(createDraft(working), retirementPath, "2025-06-01"),
      0,
    ),
  ).toEqual({});
});
it("names accounts by type and plan kind, numbering duplicate names in account order", () => {
  const draft = createDraft(working);
  const [cash, taxable, workplace, roth] = draft.input.household.accounts;
  draft.input.household.accounts = [
    cash,
    taxable,
    workplace,
    roth,
    { ...workplace, id: "internal-ira", tax_deferred_kind: "traditional_ira" },
    { ...cash, id: "internal-cash-2" },
    { ...taxable, id: "internal-taxable-2" },
    { ...cash, id: "internal-cash-3" },
    { ...workplace, id: "internal-workplace-2" },
    { ...roth, id: "internal-roth-2" },
    {
      ...workplace,
      id: "internal-ira-2",
      tax_deferred_kind: "traditional_ira",
    },
  ];
  const expected = [
    "Cash savings",
    "Brokerage account",
    "Workplace plan",
    "Roth IRA",
    "Traditional IRA",
    "Cash savings 2",
    "Brokerage account 2",
    "Cash savings 3",
    "Workplace plan 2",
    "Roth IRA 2",
    "Traditional IRA 2",
  ];
  expect(accountNames(draft)).toEqual(expected);
  draft.input.household.accounts.forEach((account, index) => {
    account.id = `changed-id-${index}`;
  });
  expect(accountNames(draft)).toEqual(expected);
  expect(
    fields(draft, 2)
      .filter((field) => field.label === "Balance today")
      .map((field) => field.group),
  ).toEqual(expected);
});
it("updates names and duplicate numbering when account type or plan kind changes", () => {
  let draft = addAccount(createDraft(working));
  expect(accountNames(draft)).toEqual([
    "Cash savings",
    "Brokerage account",
    "Workplace plan",
    "Roth IRA",
    "Cash savings 2",
  ]);
  draft = changeAccountType(draft, 0, "tax_deferred");
  expect(accountNames(draft)).toEqual([
    "Workplace plan",
    "Brokerage account",
    "Workplace plan 2",
    "Roth IRA",
    "Cash savings",
  ]);
  draft = changeEntry(
    draft,
    "/household/accounts/0/tax_deferred_kind",
    "traditional_ira",
  );
  expect(accountNames(draft)).toEqual([
    "Traditional IRA",
    "Brokerage account",
    "Workplace plan",
    "Roth IRA",
    "Cash savings",
  ]);
});
