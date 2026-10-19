// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import working from "../../../packages/app/fixtures/answers-working-61.json?raw";
import rough from "../../../packages/app/test-data/web-input-check-rough.json?raw";
import { createDraft, changeEntry } from "./setup";
import {
  barScale,
  entryDescription,
  inputHeadline,
  matters,
  onePercent,
  roughItems,
  setupFields,
} from "./input-check";

it("compares nonzero impacts at the exact integer boundary, before display rounding", () => {
  expect(matters(64994, 650)).toBe(true);
  expect(matters(64994, 649)).toBe(false);
  expect(matters(65000, 650)).toBe(true);
  expect(matters(65000, -650)).toBe(true);
  expect(matters(65000, -649)).toBe(false);
  for (const spending of [0, 64994, 65000])
    expect(matters(spending, 0)).toBe(false);
  expect(matters(0, 1)).toBe(true);
  expect(matters(90071992547410001n, 900719925474100n)).toBe(false);
  expect(matters(90071992547410000n, 900719925474100n)).toBe(true);
  expect(onePercent(64994)).toBe(650);
  expect(onePercent(65049)).toBe(650);
  expect(onePercent(65050)).toBe(651);
});
it("uses every headline template and counts through ten in words", () => {
  for (const [total, count, expected] of [
    [0, 0, "No entries are marked rough."],
    [1, 1, "One entry is rough. It matters."],
    [1, 0, "One entry is rough. It barely matters."],
    [3, 2, "Three entries are rough. Two of them matter."],
    [2, 2, "Two entries are rough. All of them matter."],
    [2, 0, "Two entries are rough. None of them matter."],
    [10, 1, "Ten entries are rough. One of them matter."],
    [12, 11, "12 entries are rough. 11 of them matter."],
  ] as const)
    expect(inputHeadline(total, count)).toBe(expected);
});
it("chooses the smallest allowed shared bar maximum", () => {
  for (const [value, expected] of [
    [2305, 2500],
    [650, 1000],
    [0, 1],
    [1, 1],
    [2, 2],
    [2.1, 2.5],
    [5, 5],
    [6, 10],
    [2501, 5000],
    [10000, 10000],
  ])
    expect(barScale(value)).toBe(expected);
});
it("sends only default paths in setup order regardless of toggle order", () => {
  const draft = createDraft(working);
  draft.rough = JSON.parse(rough)
    .map((item: { path: string }) => item.path)
    .reverse();
  expect(roughItems(draft)).toEqual(JSON.parse(rough));
});
it("labels every eligible field with readable names, entered values, basis and ages", () => {
  let draft = createDraft(working);
  draft = changeEntry(
    draft,
    "/household/income/social_security/start_age",
    "68",
  );
  draft = changeEntry(
    draft,
    "/household/income/social_security/amount/cents",
    "$27,000",
  );
  const descriptions = setupFields(draft)
    .filter((field) => ["dollars", "percent"].includes(field.kind))
    .map((field) => entryDescription(draft, field));
  expect(descriptions.map(({ title, value }) => [title, value])).toEqual([
    ["Wages", "$85,000 a year, today's dollars"],
    ["Social Security benefit", "$27,000 a year from 68, today's dollars"],
    ["Pension", "$0 a year from 65, nominal dollars"],
    ["Cash savings balance", "$20,000, today's dollars"],
    ["Brokerage account balance", "$150,000, today's dollars"],
    ["Brokerage account cost basis", "$110,000"],
    ["Workplace plan balance", "$520,000, today's dollars"],
    ["Roth IRA balance", "$60,000, today's dollars"],
    ["Spending until you retire", "$62,000 a year, today's dollars"],
    ["Spending after you retire", "$67,000 a year, today's dollars"],
    ["Inflation", "2.5% a year"],
    ["Investment return", "5% a year"],
    ["Cash return", "2% a year"],
    ["Tax-threshold indexing", "2.5% a year"],
  ]);
});
