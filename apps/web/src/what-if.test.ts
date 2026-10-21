// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import starts from "../../../docs/briefs/0002-W7-slider-starts.json";
import w4 from "../../../docs/briefs/0002-W4-reference-values.json";
import w5 from "../../../docs/briefs/0002-W5-reference-values.json";
import cases from "../../../docs/briefs/0002-W7-what-if-cases.json";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import {
  ageOn,
  changedAnswers,
  keptAnswers,
  sliderError,
  sliderStarts,
  type Changes,
} from "./what-if";
const base = cases.cases.start;
const changesByCase: Record<string, Changes> = {
  "growth-6-prices-3": { investments_grow: "6", prices_rise: "3" },
  "ranged-spending-70000": { spending: "70000" },
  "retire-at-70": { retire: "70" },
  "savings-total-1000000": { savings: "1000000" },
  "social-security-70-33000": {
    social_security: "33000",
    social_security_from: "70",
  },
  "spending-80000": { spending: "80000" },
  "worked-out-savings-then-total-600000": { savings: "600000" },
};
it.each(Object.entries(starts.cases))(
  "matches every slider start and provenance: %s",
  (name, expected) => {
    const [brief, id] = name.split("/");
    const source = (brief === "0002-W4" ? w4 : w5).cases;
    const c = source[id as keyof typeof source] as unknown as {
      answers: AnswersV2;
      result: AnswersPlanV2;
    };
    expect(
      Object.fromEntries(
        sliderStarts(c.answers, c.result).map(({ id, start, note }) => [
          id,
          { start, note },
        ]),
      ),
    ).toEqual(expected);
  },
);
it.each(Object.entries(changesByCase))(
  "applies all changes together to reproduce %s",
  (name, changes) => {
    const expected = cases.cases[name as keyof typeof cases.cases].answers;
    const source =
      name === "ranged-spending-70000"
        ? w5.cases["v2-range-nothing-solved"]
        : name === "worked-out-savings-then-total-600000"
          ? w5.cases["v2-solve-savings"]
          : base;
    expect(
      changedAnswers(
        source.answers as AnswersV2,
        source.result as unknown as AnswersPlanV2,
        changes,
      ),
    ).toEqual(expected);
  },
);
it("keeps exact shared cents and answered basis, removes only kept uncertainty and what_if", () => {
  const a = {
    ...base.answers,
    not_sure: ["pay", "savings", "social_security", "spending_in_retirement"],
  } as AnswersV2;
  const kept = keptAnswers(
    a,
    base.result as unknown as AnswersPlanV2,
    cases.cases["savings-total-1000000"].result as unknown as AnswersPlanV2,
    { savings: "1000000" },
  );
  expect(kept.savings).toEqual({
    accounts: [
      { kind: "cash", balance: { cents: 2666667 } },
      {
        kind: "taxable",
        balance: { cents: 20000000 },
        cost_basis: { cents: 11000000 },
      },
      { kind: "employer_plan", balance: { cents: 69333333 } },
      { kind: "roth", balance: { cents: 8000000 } },
    ],
  });
  expect(kept.not_sure).toEqual([
    "pay",
    "social_security",
    "spending_in_retirement",
  ]);
  expect(kept).not.toHaveProperty("what_if");
  expect(base.answers.savings.accounts[0].balance.cents).toBe(2000000);
});
it("keeps the generated taxable account when savings were absent or every account was zero", () => {
  const shown = cases.cases["worked-out-savings-then-total-600000"]
    .result as unknown as AnswersPlanV2;
  const generated = {
    accounts: [
      {
        kind: "taxable",
        balance: { cents: 60000000 },
        cost_basis: { cents: 60000000 },
      },
    ],
  };
  for (const savings of [
    { later: true },
    { none: true },
    {
      accounts: [
        { kind: "cash", balance: { cents: 0 } },
        { kind: "roth", balance: { cents: 0 } },
      ],
    },
  ] as AnswersV2["savings"][]) {
    const baseline = structuredClone(base.result) as unknown as AnswersPlanV2;
    baseline.household_input!.household.accounts.forEach((account) => {
      account.opening_balance_cents = 0;
    });
    expect(
      keptAnswers({ ...base.answers, savings } as AnswersV2, baseline, shown, {
        savings: "600000",
      }).savings,
    ).toEqual(generated);
  }
});
it("keeps changed answers as annual figures, exact text rates and clear uncertainty", () => {
  const changes: Changes = {
    retire: "70",
    spending: "80000",
    social_security: "33000",
    social_security_from: "70",
    investments_grow: "6",
    prices_rise: "3",
  };
  const kept = keptAnswers(
    {
      ...base.answers,
      not_sure: ["pay", "social_security", "spending_in_retirement"],
    } as AnswersV2,
    base.result as unknown as AnswersPlanV2,
    base.result as unknown as AnswersPlanV2,
    changes,
  );
  expect(kept.retirement).toEqual({ age: 70 });
  expect(kept.spending_in_retirement).toEqual({ cents: 8000000, per: "year" });
  expect(kept.social_security).toEqual({
    expects: "yes",
    start_age: 70,
    amount: { cents: 3300000, per: "year" },
  });
  expect(kept.assumptions).toEqual({
    investment_return: "0.06",
    inflation: "0.03",
  });
  expect(kept.not_sure).toEqual(["pay"]);
});
it("extends ranges to the next step, validates boxes and retains null provenance without a mark", () => {
  const c = w5.cases["v2-solve-retirement-unreachable"];
  const sliders = sliderStarts(
    c.answers as AnswersV2,
    c.result as unknown as AnswersPlanV2,
  );
  expect(sliders.find((s) => s.id === "retire")).toMatchObject({
    max: 94,
    marker: false,
    start: 94,
  });
  const spending = sliders.find((s) => s.id === "spending")!;
  expect(spending.max).toBe(5000000);
  expect(sliderError(spending, "5000000.01")).toContain("5,000,000");
  expect(sliderError(spending, "80000.25")).toBe("");
  const r = structuredClone(base.result) as unknown as AnswersPlanV2;
  r.household_input!.household.spending.after_retirement.cents = 20000101;
  expect(
    sliderStarts(base.answers as AnswersV2, r).find((s) => s.id === "spending")!
      .max,
  ).toBe(201000);
});
it("uses whole ages with a February 28 anniversary for leap birthdays", () => {
  expect(ageOn("1964-02-29", "2027-02-27")).toBe(62);
  expect(ageOn("1964-02-29", "2027-02-28")).toBe(63);
  expect(ageOn("1964-02-29", "2028-02-28")).toBe(63);
  expect(ageOn("1964-02-29", "2028-02-29")).toBe(64);
});
it("has no controls for results without an input or unsuccessful results", () => {
  for (const status of ["incomplete", "unsupported", "invalid"])
    expect(
      sliderStarts(
        base.answers as AnswersV2,
        { ...base.result, status } as unknown as AnswersPlanV2,
      ),
    ).toEqual([]);
});

it("keeps only a pension amount change while preserving its age and price adjustment", () => {
  const answers: AnswersV2 = {
    ...base.answers,
    pension: {
      expects: "yes",
      amount: { cents: 100000, per: "month" },
      start_age: 65,
      rises_with_prices: "not_sure",
    },
    not_sure: ["pension", "pay"],
  } as AnswersV2;
  const kept = keptAnswers(
    answers,
    base.result as unknown as AnswersPlanV2,
    base.result as unknown as AnswersPlanV2,
    { pension: "18000" },
  );
  expect(kept.pension).toEqual({
    expects: "yes",
    amount: { cents: 1800000, per: "year" },
    start_age: 65,
    rises_with_prices: "not_sure",
  });
  expect(kept.not_sure).toEqual(["pay"]);
});
