// SPDX-License-Identifier: AGPL-3.0-only
import type { Page } from "@playwright/test";
export async function storageTrap(page: Page) {
  await page.addInitScript(() => {
    const probe = window as unknown as {
      writes: string[];
      intakeEntered: boolean;
    };
    probe.writes = [];
    probe.intakeEntered = localStorage.getItem("horizon.intake.v1") !== null;
    document.addEventListener(
      "click",
      (event) => {
        const target = (event.target as Element).closest("button");
        if (
          target &&
          /^(Start with my own figures|Continue with my answers)$/.test(
            target.textContent ?? "",
          )
        )
          probe.intakeEntered = true;
      },
      true,
    );
    const set = Storage.prototype.setItem,
      remove = Storage.prototype.removeItem;
    const deny = (name: string): never => {
      probe.writes.push(name);
      throw new Error(`Forbidden storage: ${name}`);
    };
    Storage.prototype.setItem = function (key, value) {
      if (
        this !== localStorage ||
        key !== "horizon.intake.v1" ||
        !probe.intakeEntered
      )
        return deny(`setItem:${key}`);
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this !== localStorage || key !== "horizon.intake.v1")
        return deny(`removeItem:${key}`);
      return remove.call(this, key);
    };
    Storage.prototype.clear = () => deny("clear");
    indexedDB.open = () => deny("indexedDB.open");
    indexedDB.deleteDatabase = () => deny("indexedDB.deleteDatabase");
    Object.defineProperty(document, "cookie", {
      get: () => "",
      set: () => deny("cookie"),
    });
  });
}
