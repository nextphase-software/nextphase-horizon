// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { test } from "./fixtures";
import { storageTrap } from "./privacy";
const samples = [
  {
    name: "answers-working-61",
    label: "Single, 61, still working, plans to retire at 66",
  },
  { name: "synthetic-retired", label: "Single, 70, retired" },
  { name: "A-drawdown", label: "Single, 73, retired, small savings" },
  {
    name: "answers-underfunded",
    label: "Single, 61, spending more than income",
  },
  { name: "two-person", label: "Couple" },
].map((sample) => ({
  ...sample,
  json: readFileSync(
    new URL(
      `../../../packages/app/fixtures/${sample.name}.json`,
      import.meta.url,
    ),
    "utf8",
  ),
}));
import type { Request, Response } from "../src/protocol";
test("shell: welcome, all five examples, input check, theme, worker bytes and privacy", async ({
  page,
  context,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const outside: string[] = [];
  context.on("request", (r) => {
    if (new URL(r.url()).origin !== "http://127.0.0.1:4173")
      outside.push(r.url());
  });
  await storageTrap(page);
  await page.addInitScript(() => {
    const probe = window as unknown as { engineWorker: Worker };
    const Native = Worker;
    window.Worker = class extends Native {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        probe.engineWorker = this;
      }
    };
  });
  const capture = async (name: string) => {
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await info.attach(name, { path, contentType: "image/png" });
  };
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "See whether your savings can carry your retirement",
    }),
  ).toBeVisible();
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveAttribute(
    "content",
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'",
  );
  const original = await page.evaluate(
    () => getComputedStyle(document.documentElement).colorScheme,
  );
  await page.getByRole("button", { name: "Toggle theme" }).click();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).not.toBe(original);
  await page.reload();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe(original);
  await capture("01-welcome");
  await page
    .getByRole("button", { name: "Try an example household", exact: true })
    .click();
  await capture("examples");
  for (const sample of samples) {
    await page.getByRole("radio", { name: sample.label, exact: true }).check();
    await page.getByRole("button", { name: "Open example plan" }).click();
    if (sample.name === "two-person")
      await expect(
        page.getByText("Only one person is supported."),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("button", { name: "Try a change" }),
      ).toBeEnabled();
    const bytes = await page.evaluate(
      ({ json }) =>
        new Promise<string>((resolve) => {
          const worker = (window as unknown as { engineWorker: Worker })
            .engineWorker;
          const listener = ({ data }: MessageEvent<Response>) => {
            if (data.id === -1) {
              worker.removeEventListener("message", listener);
              resolve(data.json);
            }
          };
          worker.addEventListener("message", listener);
          worker.postMessage({
            id: -1,
            op: "run",
            args: [json],
          } satisfies Request);
        }),
      { json: sample.json },
    );
    if (sample.name === "two-person")
      expect(JSON.parse(bytes)).toMatchObject({
        status: "unsupported",
        code: "MULTIPLE_PERSONS_UNSUPPORTED",
      });
    else
      expect(bytes).toBe(
        readFileSync(
          new URL(
            `../../../packages/parity/golden/${sample.name}.run.json`,
            import.meta.url,
          ),
          "utf8",
        ).trimEnd(),
      );
    await capture(`example-${sample.name}`);
    if (sample.name !== "two-person") {
      await page
        .getByRole("navigation", { name: "Planning steps" })
        .getByRole("button", { name: "Check", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "No entries are marked rough." }),
      ).toBeVisible();
      await capture(`check-${sample.name}`);
    }
    await page.getByRole("button", { name: "Horizon welcome" }).click();
    await page
      .getByRole("button", { name: "Try an example household", exact: true })
      .click();
  }
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      writes: (window as unknown as { writes: string[] }).writes,
    })),
  ).toEqual({ local: 0, session: 0, writes: [] });
});
