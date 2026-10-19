// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import {
  countWord,
  flagWords,
  formatDollars,
  sampleIntroduction,
  statusWord,
} from "./format";
import raw from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
import type { Result } from "./Answer";
describe("engine presentation", () => {
  it("formats whole dollars without calculating financial values", () => {
    expect(formatDollars(64994)).toBe("$64,994");
    expect(formatDollars(0)).toBe("$0");
    expect(formatDollars(-12000)).toBe("-$12,000");
  });
  it("spells out status and omission count", () => {
    expect(statusWord("complete")).toBe("Supported");
    expect(statusWord("partial")).toBe("Partial");
    expect(statusWord("partial", 0)).toBe("Partial (0 omissions)");
    expect(statusWord("partial", 7)).toBe("Partial (7 omissions)");
    expect(statusWord("unsupported")).toBe("Unsupported");
    expect(statusWord("invalid")).toBe("Invalid");
  });
  it("spells out both spending flags", () => {
    expect(flagWords("shortfall_with_no_retirement_spending")).toBe(
      "Shortfall even with no retirement spending.",
    );
    expect(flagWords("at_or_above_cap")).toBe(
      "No shortfall at or above the spending search cap.",
    );
  });
});

it("spells out counts from zero to ten and uses digits above ten", () => {
  expect(Array.from({ length: 12 }, (_, count) => countWord(count))).toEqual([
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
    "11",
  ]);
});
it("derives the intro from statuses and names the single unsupported sample", () => {
  const partial = JSON.parse(raw) as Result;
  const complete = { ...partial, status: "complete" } as Result;
  const unsupported = {
    status: "unsupported",
    code: "MULTIPLE_PERSONS_UNSUPPORTED",
    message: "Only one person is supported.",
  } as const;
  expect(
    sampleIntroduction([
      { label: "Working", result: partial },
      { label: "Retired", result: complete },
      { label: "Small savings", result: complete },
      { label: "Underfunded", result: partial },
      { label: "Couple", result: unsupported },
    ]),
  ).toBe(
    "The engine gives a full result for two of these five sample households, a partial one for two, and none for the couple (only one person is supported).",
  );
  expect(
    sampleIntroduction([
      {
        label: "ANOTHER SAMPLE",
        result: { ...unsupported, message: "US rules are missing" },
      },
    ]),
  ).toBe(
    "The engine gives a full result for zero of these one sample households, a partial one for zero, and none for the another sample (uS rules are missing).",
  );
  expect(
    sampleIntroduction([
      { label: "One", result: unsupported },
      { label: "Two", result: unsupported },
    ]),
  ).toBe(
    "The engine gives a full result for zero of these two sample households, a partial one for zero, and none for two.",
  );
  expect(sampleIntroduction([{ label: "Supported", result: complete }])).toBe(
    "The engine gives a full result for one of these one sample households, a partial one for zero, and none for zero.",
  );
});
