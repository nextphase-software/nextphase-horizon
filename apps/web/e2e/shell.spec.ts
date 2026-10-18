// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import type { SustainableSpending } from "../src/generated/types/sustainable-spending.v1";
import type { Operation, Request, Response } from "../src/protocol";
const names = [
  "answers-working-61",
  "synthetic-retired",
  "A-drawdown",
  "answers-underfunded",
  "two-person",
];
const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const reference = JSON.parse(read("docs/briefs/0003-W1-reference-values.json"));

test("sample households: keyboard, parity, accessibility and privacy", async ({
  page,
  context,
  browser,
}, testInfo) => {
  testInfo.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const offOrigin: string[] = [];
  const errors: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      offOrigin.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const probe = window as unknown as {
      writes: string[];
      engineWorker: Worker;
    };
    probe.writes = [];
    const deny = (name: string) => () => {
      probe.writes.push(name);
      throw new Error(`Forbidden storage write: ${name}`);
    };
    for (const method of ["setItem", "removeItem", "clear"] as const)
      Storage.prototype[method] = deny(method);
    indexedDB.open = deny("indexedDB.open");
    indexedDB.deleteDatabase = deny("indexedDB.deleteDatabase");
    Object.defineProperty(document, "cookie", {
      get: () => "",
      set: deny("cookie"),
    });
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        probe.engineWorker = this;
      }
    };
  });
  await page.goto("/");
  await expect(page.getByTestId("spending")).toBeVisible();
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveAttribute(
    "content",
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'",
  );
  const initialDark = testInfo.project.use.colorScheme === "dark";
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe(initialDark ? "dark" : "light");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Toggle theme" }),
  ).toBeFocused();
  expect(
    await page
      .getByRole("button")
      .evaluate((el) => getComputedStyle(el).outlineWidth),
  ).toBe("3px");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    initialDark ? "light" : "dark",
  );
  await page.emulateMedia({ colorScheme: initialDark ? "light" : "dark" });
  await page.emulateMedia({ colorScheme: initialDark ? "dark" : "light" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe(initialDark ? "light" : "dark");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(
    page.getByLabel("Sample household", { exact: true }),
  ).toBeFocused();
  for (const [index, name] of names.entries()) {
    // The native select stays focused; advance once from the previous choice.
    await page.keyboard.press(index === 0 ? "Home" : "ArrowDown");
    await page.keyboard.press("Enter");
    await expect(
      page.getByLabel("Sample household", { exact: true }),
    ).toHaveValue(name);
    if (index === 0)
      await page.screenshot({
        path: testInfo.outputPath("working-household.png"),
        fullPage: true,
      });
    const fixture = read(`packages/app/fixtures/${name}.json`);
    const call = async (op: Operation): Promise<string> =>
      page.evaluate(
        ({ op, fixture }) => {
          const probe = window as unknown as { engineWorker: Worker };
          return new Promise<string>((resolve) => {
            const id = -1;
            const listener = ({ data }: MessageEvent<Response>) => {
              if (data.id === id) {
                probe.engineWorker.removeEventListener("message", listener);
                resolve(data.json);
              }
            };
            probe.engineWorker.addEventListener("message", listener);
            probe.engineWorker.postMessage({
              id,
              op,
              args: [fixture],
            } as Request);
          });
        },
        { op, fixture },
      );
    if (name === "two-person") {
      await expect(
        page.getByRole("heading", { name: "Unsupported", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Only one person is supported."),
      ).toBeVisible();
      await expect(page.locator("dd")).toHaveCount(0);
      expect(JSON.parse(await call("sustainable_spending")).code).toBe(
        "MULTIPLE_PERSONS_UNSUPPORTED",
      );
    } else {
      expect(await call("run")).toBe(
        read(`packages/parity/golden/${name}.run.json`).trimEnd(),
      );
      const answer = JSON.parse(
        await call("sustainable_spending"),
      ) as SustainableSpending;
      const format = (amount: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(amount);
      await expect(page.getByTestId("spending")).toHaveText(
        format(answer.sustainable_spending),
      );
      await expect(page.getByTestId("entered")).toHaveText(
        format(answer.entered),
      );
      await expect(page.getByTestId("headroom")).toHaveText(
        format(answer.headroom),
      );
      const row = reference.sustainable_spending[name];
      expect(answer.sustainable_spending).toBe(row.sustainable_spending);
      await expect(
        page.getByRole("heading", {
          name:
            answer.status === "complete"
              ? "Supported"
              : `Partial (${answer.run.omissions.length} omissions)`,
          exact: true,
        }),
      ).toBeVisible();
      for (const omission of answer.run.omissions)
        await expect(page.getByText(omission, { exact: true })).toBeVisible();
      if (name === "answers-underfunded")
        await expect(
          page.getByText("Shortfall even with no retirement spending."),
        ).toBeVisible();
      await expect(
        page.getByText("today's dollars, per year", { exact: true }),
      ).toHaveCount(3);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByLabel("Sample household", { exact: true }),
    ).toBeFocused();
  }
  // Check the final stored state too, including databases a worker could have opened.
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  expect(
    await page.evaluate(async () =>
      typeof indexedDB.databases === "function"
        ? await indexedDB.databases()
        : [],
    ),
  ).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { writes: string[] }).writes,
    ),
  ).toEqual([]);
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.getByTestId("spending")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});
