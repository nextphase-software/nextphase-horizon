// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 240_000,
  outputDir: process.env.HORIZON_EVIDENCE_DIR
    ? `${process.env.HORIZON_EVIDENCE_DIR}/screenshots`
    : "test-results",
  reporter: [
    ["line"],
    [
      "html",
      {
        outputFolder: process.env.HORIZON_EVIDENCE_DIR
          ? `${process.env.HORIZON_EVIDENCE_DIR}/playwright-report`
          : "playwright-report",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: process.env.HORIZON_EVIDENCE_DIR
          ? `${process.env.HORIZON_EVIDENCE_DIR}/results.json`
          : "test-results/results.json",
      },
    ],
  ],
  fullyParallel: true,
  workers: 3,
  use: { baseURL: "http://127.0.0.1:4173", trace: "off" },
  webServer: {
    command:
      "corepack pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
  projects: (["chromium", "webkit"] as const).flatMap((browserName) =>
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
