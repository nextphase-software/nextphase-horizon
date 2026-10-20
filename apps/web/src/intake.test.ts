// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import reference from "../../../docs/briefs/0002-W5-reference-values.json";
import {
  buildAnswers,
  newFields,
  emptyMoney,
  parseMoney,
  parseRate,
  questionError,
  visibleQuestions,
  fieldsFromAnswers,
  type Fields,
} from "./intake-fields";
function working(): Fields {
  const f = newFields("2026-01-01");
  f.birth = "1965-03-10";
  f.retirementAge = "66";
  f.endAge = "95";
  f.social = "yes";
  f.socialAge = "67";
  f.money.pay.text = "85,000";
  f.money.social_security.text = "26,000";
  f.money.spending_now.text = "62,000";
  f.money.spending_in_retirement.text = "67,000";
  f.accounts = [
    { kind: "cash", balance: { ...emptyMoney(), text: "20,000" }, basis: "" },
    {
      kind: "taxable",
      balance: { ...emptyMoney(), text: "150,000" },
      basis: "110,000",
    },
    {
      kind: "employer_plan",
      balance: { ...emptyMoney(), text: "520,000" },
      basis: "",
    },
    { kind: "roth", balance: { ...emptyMoney(), text: "60,000" }, basis: "" },
  ];
  return f;
}
function controls(name: string): Fields {
  const f = working();
  if (name === "v2-age-instead-of-date") {
    f.birthMode = "age";
    f.age = "60";
  }
  if (name === "v2-age-leap-valuation") {
    f.birthMode = "age";
    f.age = "61";
    f.valuation = "2028-02-29";
  }
  if (name === "v2-needed-birth") {
    f.birthMode = "later";
    f.savingsMode = "later";
  }
  if (
    name.includes("solve-retirement") ||
    ["v2-needed-three", "v2-needed-retirement-without-pay"].includes(name)
  )
    f.retirementMode = "later";
  if (name === "v2-needed-retirement-without-pay") f.money.pay.later = true;
  if (
    name.includes("solve-savings") ||
    ["v2-needed-two", "v2-needed-three"].includes(name)
  )
    f.savingsMode = "later";
  if (
    name.includes("solve-spending") ||
    ["v2-needed-two", "v2-needed-three"].includes(name)
  )
    f.money.spending_in_retirement.later = true;
  if (name === "v2-partner") f.planning = "partner";
  if (name === "v2-range-nothing-solved") {
    f.accounts[2].balance = {
      ...emptyMoney(),
      range: true,
      low: "400k",
      high: "640k",
    };
    f.money.savings.notSure = true;
    f.money.spending_in_retirement = {
      ...emptyMoney(),
      range: true,
      low: "60k",
      high: "74k",
      notSure: true,
    };
  }
  if (name.endsWith("-with-range"))
    f.money.spending_in_retirement = {
      ...emptyMoney(),
      range: true,
      low: "60k",
      high: "74k",
    };
  if (name === "v2-solve-savings-none-needed")
    f.money.spending_in_retirement.text = "10k";
  if (name === "v2-solve-savings-unreachable")
    f.money.spending_in_retirement.text = "9m";
  if (name === "v2-solve-retirement-unreachable")
    f.money.spending_in_retirement.text = "5m";
  if (name === "v2-solve-spending-shortfall-at-zero") {
    f.money.pay.text = "30k";
    f.money.spending_now.text = "60k";
    f.savingsMode = "none";
    f.social = "no";
  }
  if (name === "v2-solve-spending-same-as-now-missing") {
    f.same = true;
    f.money.spending_now.later = true;
  }
  if (name === "v2-solve-savings-retired") {
    f.retired = true;
    f.birth = "1956-12-31";
    f.rates = { inflation: "0" };
    f.socialAge = "67";
    f.money.social_security.text = "30k";
    f.pension = "yes";
    f.pensionAge = "65";
    f.rises = "no";
    f.money.pension.text = "12k";
    f.money.spending_in_retirement.text = "50k";
  }
  return f;
}
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
const cases = Object.entries(reference.cases).filter(
  ([name]) =>
    name.startsWith("v2-") &&
    !name.includes("what-if") &&
    name !== "v2-age-too-young",
);
it("has exactly twenty reference control states", () =>
  expect(cases).toHaveLength(20));
it.each(cases)(
  "builds %s from controls, with engine bytes equal to its reference",
  (name, testCase) => {
    const f = controls(name),
      answers = buildAnswers(f);
    expect(
      visibleQuestions(f)
        .map((q) => questionError(f, q))
        .filter(Boolean),
    ).toEqual([]);
    const dir = mkdtempSync(join(tmpdir(), "horizon-intake-control-"));
    try {
      const path = join(dir, "answers.json");
      writeFileSync(path, JSON.stringify(answers));
      const result = spawnSync(
        "cargo",
        [
          "run",
          "--quiet",
          "--release",
          "-p",
          "horizon-cli",
          "--",
          "intake",
          path,
        ],
        {
          cwd: join(process.cwd(), "../.."),
          encoding: "utf8",
          maxBuffer: 5_000_000,
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.stdout).toBe(canonical(testCase.result) + "\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
  120_000,
);
it.each([
  ["85000", 8500000],
  ["85,000", 8500000],
  ["$85,000", 8500000],
  ["85k", 8500000],
  ["1.2m", 120000000],
  ["0.01", 1],
  ["1.23k", 123000],
  ["1.23m", 123000000],
])("parses %s as cents exactly", (text, cents) =>
  expect(parseMoney(String(text))).toBe(cents),
);
it.each(["-1", "1.001", "1.234k", "12,34", "1e6", "Infinity", ""])(
  "rejects malformed money %s",
  (text) => expect(() => parseMoney(text)).toThrow(),
);
it("shifts rates as text and rejects out of range or excess precision", () => {
  expect(["2.75", "2.5", "0", "20"].map(parseRate)).toEqual([
    "0.0275",
    "0.025",
    "0",
    "0.2",
  ]);
  for (const text of ["20.01", "2.751", "-1"])
    expect(() => parseRate(text)).toThrow();
});
it("keeps monthly units, uncertainty and hidden answers in their proper fields", () => {
  const f = working();
  f.money.pay = { ...emptyMoney(), text: "5k", per: "month", notSure: true };
  expect(buildAnswers(f).pay).toEqual({ cents: 500000, per: "month" });
  f.money.pay.text = "";
  expect(buildAnswers(f).pay).toEqual({ later: true });
  f.retired = true;
  const a = buildAnswers(f);
  for (const key of ["pay", "pay_ends", "retirement", "spending_now"])
    expect(a).not.toHaveProperty(key);
  expect(a.not_sure).toEqual([]);
});
it("prevents nonexistent dates, birth ages outside the supported interval, and reversed ranges", () => {
  const f = working();
  f.birth = "1965-02-29";
  expect(questionError(f, 2)).not.toBe("");
  f.birthMode = "age";
  f.age = "17";
  expect(questionError(f, 2)).not.toBe("");
  f.age = "110";
  expect(questionError(f, 2)).toBe("");
  f.money.pay = { ...emptyMoney(), range: true, low: "90k", high: "80k" };
  expect(questionError(f, 6)).toBe(
    "Put the lower amount first, then the higher one.",
  );
});
it.each(cases)(
  "restores confirmed %s without changing its document meaning",
  (name, testCase) => {
    const a = buildAnswers(controls(name));
    expect(buildAnswers(fieldsFromAnswers(a))).toEqual(a);
    expect(testCase.answers.version).toBe(2);
  },
);
it("keeps account order when an existing balance is edited and not added again", () => {
  const f = working();
  f.editingAccount = 1;
  f.account = { ...f.accounts[1], balance: { ...emptyMoney(), text: "160k" } };
  const answers = buildAnswers(f);
  expect("accounts" in answers.savings).toBe(true);
  if ("accounts" in answers.savings) {
    expect(answers.savings.accounts.map((account) => account.kind)).toEqual([
      "cash",
      "taxable",
      "employer_plan",
      "roth",
    ]);
    expect(answers.savings.accounts[1].balance).toEqual({ cents: 16000000 });
    expect(answers.savings.accounts[1].cost_basis).toEqual({ cents: 11000000 });
  }
});
