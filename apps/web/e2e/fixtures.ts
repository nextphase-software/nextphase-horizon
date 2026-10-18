// SPDX-License-Identifier: AGPL-3.0-only
import { test as base } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const test = base.extend({
  // One default browser launch per worker, including replacement/retry workers.
  launchOptions: [
    async ({ browserName, launchOptions }, provide) => {
      if (process.platform !== "darwin" || browserName !== "firefox") {
        await provide(launchOptions);
        return;
      }
      const firefoxHome = mkdtempSync(join(tmpdir(), "horizon-firefox-home-"));
      try {
        await provide({
          ...launchOptions,
          env: {
            ...process.env,
            ...launchOptions.env,
            CFFIXED_USER_HOME: firefoxHome,
          },
        });
      } finally {
        // The dependent browser fixture shuts down before launchOptions teardown.
        rmSync(firefoxHome, { recursive: true, force: true });
      }
    },
    { scope: "worker" },
  ],
});
