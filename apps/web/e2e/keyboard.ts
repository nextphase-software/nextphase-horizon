// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator, Page } from "@playwright/test";

export async function keyboardTo(
  page: Page,
  locator: Locator,
  traversal: "Tab" | "Alt+Tab",
) {
  const preferBackwards = await locator.evaluate(
    (target) =>
      !!document.activeElement &&
      !!(
        target.compareDocumentPosition(document.activeElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
      ),
  );
  // Native date sub-fields can trap reverse traversal on macOS WebKit.
  // Exhaust a bounded pass, then try the opposite direction without moving focus
  // programmatically or skipping the browser's native keyboard behavior.
  for (const backwards of [preferBackwards, !preferBackwards]) {
    const key = backwards
      ? traversal === "Alt+Tab"
        ? "Alt+Shift+Tab"
        : "Shift+Tab"
      : traversal;
    for (let count = 0; count <= 100; count++) {
      if (
        await locator.evaluate((element) => element === document.activeElement)
      )
        return;
      if (count < 100) await page.keyboard.press(key);
    }
  }
  throw new Error(
    `Cannot reach ${await locator.textContent()} by keyboard in either direction`,
  );
}
