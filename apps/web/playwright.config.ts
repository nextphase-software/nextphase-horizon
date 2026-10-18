// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: true,
  workers: 3,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command:
      "corepack pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
  projects: (["chromium", "firefox", "webkit"] as const).flatMap(
    (browserName) =>
      [
        { width: 375, height: 812 },
        { width: 1280, height: 800 },
      ].flatMap((viewport) =>
        (["light", "dark"] as const).map((colorScheme) => ({
          name: `${browserName}-${viewport.width}-${colorScheme}`,
          use: { browserName, viewport, colorScheme },
        })),
      ),
  ),
});
