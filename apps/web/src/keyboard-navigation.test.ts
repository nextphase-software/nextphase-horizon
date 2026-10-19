// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from "vitest";
import type { Locator, Page } from "@playwright/test";
import { keyboardTo } from "../e2e/keyboard";

it.each(["Tab", "Alt+Tab"] as const)(
  "tries forward after native date sub-fields trap backward %s traversal",
  async (traversal) => {
    let forwardPresses = 0;
    const press = vi.fn(async (key: string) => {
      if (key === traversal) forwardPresses++;
    });
    const evaluate = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockImplementation(async () => forwardPresses === 9);
    await keyboardTo(
      { keyboard: { press } } as unknown as Page,
      { evaluate } as unknown as Locator,
      traversal,
    );
    const backwards = traversal === "Tab" ? "Shift+Tab" : "Alt+Shift+Tab";
    expect(press.mock.calls.map(([key]) => key)).toEqual([
      ...Array<string>(100).fill(backwards),
      ...Array<string>(9).fill(traversal),
    ]);
  },
);

it("tries backward after an unsuccessful forward pass and bounds both passes if the target is unreachable", async () => {
  const press = vi
    .fn<(key: string) => Promise<void>>()
    .mockResolvedValue(undefined);
  const locator = {
    evaluate: vi.fn().mockResolvedValue(false),
    textContent: vi.fn().mockResolvedValue("4 Plan"),
  };
  await expect(
    keyboardTo(
      { keyboard: { press } } as unknown as Page,
      locator as unknown as Locator,
      "Tab",
    ),
  ).rejects.toThrow("Cannot reach 4 Plan by keyboard in either direction");
  expect(press.mock.calls.map(([key]) => key)).toEqual([
    ...Array<string>(100).fill("Tab"),
    ...Array<string>(100).fill("Shift+Tab"),
  ]);
});
