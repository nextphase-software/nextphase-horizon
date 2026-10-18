// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import {
  dollarEntry,
  exactJson,
  parseDollars,
  parsePercent,
  parseWhole,
  percentEntry,
} from "./entry";
it("parses whole dollars by appending exactly two zeroes", () => {
  for (const text of ["150000", "150,000", "$150,000", "$150000", "0150000"])
    expect(parseDollars(text)).toBe(15000000n);
  expect(parseDollars("0")).toBe(0n);
  expect(exactJson({ cents: parseDollars("9007199254740991") })).toBe(
    '{"cents":900719925474099100}',
  );
  expect(dollarEntry(15000000)).toBe("150,000");
});
it("rejects decimals, signs, spaces, misplaced dollar signs and malformed commas", () => {
  for (const text of [
    "",
    "1.00",
    "-1",
    "+1",
    " 1",
    "1 ",
    "1$",
    "$ 1",
    "1,00",
    "1,,000",
    "1,000,",
    "12,3456",
    "1e3",
    "NaN",
  ])
    expect(() => parseDollars(text)).toThrow(
      "Enter a whole-dollar amount, like 150,000",
    );
});
it("shifts percentages using minimal exact decimal strings", () => {
  for (const [text, decimal] of [
    ["0", "0"],
    ["2.5", "0.025"],
    ["3", "0.03"],
    ["12.25", "0.1225"],
    ["100", "1"],
    ["0.01", "0.0001"],
    ["02.50", "0.025"],
    ["0.00", "0"],
    ["100.00", "1"],
  ]) {
    expect(parsePercent(text)).toBe(decimal);
    expect(exactJson({ value: parsePercent(text) })).toBe(
      `{"value":"${decimal}"}`,
    );
    expect(parsePercent(percentEntry(decimal))).toBe(decimal);
  }
});
it("rejects percent signs, signs, excess precision and values above 100", () => {
  for (const text of [
    "",
    "-1",
    "+2",
    "101",
    "100.01",
    "2.555",
    "2%",
    "2,5",
    ".5",
    "2.",
    " 2",
    "1e1",
    "Infinity",
  ])
    expect(() => parsePercent(text)).toThrow();
});
it("accepts only whole-number digits and preserves large integers", () => {
  expect(parseWhole("095")).toBe(95n);
  expect(parseWhole("9007199254740993")).toBe(9007199254740993n);
  for (const text of ["", "1.0", "-1", "+1", "1e2", " 95"])
    expect(() => parseWhole(text)).toThrow();
});
