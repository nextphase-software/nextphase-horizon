// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "font-license",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "licenses/plus-jakarta-sans-OFL-1.1.txt",
          source: readFileSync(
            new URL(
              "node_modules/@fontsource-variable/plus-jakarta-sans/LICENSE",
              import.meta.url,
            ),
            "utf8",
          ),
        });
      },
    },
  ],
  server: {
    fs: {
      allow: [
        new URL("./", import.meta.url).pathname,
        new URL("../../packages/", import.meta.url).pathname,
      ],
    },
  },
  build: { assetsInlineLimit: 0 },
  worker: { format: "es" },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
