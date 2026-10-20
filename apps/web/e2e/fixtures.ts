// SPDX-License-Identifier: AGPL-3.0-only
import { test as base, expect } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const test = base.extend({
  context: async ({ context }, provide) => {
    const traffic: string[] = [];
    context.on("request", (request) => {
      const url = new URL(request.url());
      if (
        request.postData() !== null ||
        url.search ||
        !["GET", "HEAD"].includes(request.method())
      )
        traffic.push(`${request.method()} ${request.url()}`);
    });
    await provide(context);
    expect(traffic, "No request carries answers or other page state").toEqual(
      [],
    );
  },
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
        try {
          rmSync(firefoxHome, {
            recursive: true,
            force: true,
            maxRetries: 10,
            retryDelay: 200,
          });
        } catch {
          // Firefox can keep writing after close; OS-temp cleanup is best effort.
        }
      }
    },
    { scope: "worker" },
  ],
});
