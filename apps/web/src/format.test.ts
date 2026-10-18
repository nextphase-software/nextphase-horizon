// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { flagWords, formatDollars, statusWord } from "./format";
describe("engine presentation", () => {
  it("formats whole dollars without calculating financial values", () => {
    expect(formatDollars(64994)).toBe("$64,994");
    expect(formatDollars(0)).toBe("$0");
    expect(formatDollars(-12000)).toBe("-$12,000");
  });
  it("spells out status and omission count", () => {
    expect(statusWord("complete")).toBe("Supported");
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
