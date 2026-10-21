// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { test } from "./fixtures";
import { storageTrap } from "./privacy";
import { keyboardTo } from "./keyboard";
import type { Request } from "../src/protocol";
import type { AnswersV2 } from "../src/generated/types/answers.v2";
import type { AnswersPlanV2 } from "../src/generated/types/answers-plan.v2";
const reference = JSON.parse(
  readFileSync(
    new URL("../../../docs/briefs/0002-W7-what-if-cases.json", import.meta.url),
    "utf8",
  ),
).cases as Record<
  string,
  { answers: AnswersV2; result: AnswersPlanV2; head: string[] }
>;
const w5 = JSON.parse(
  readFileSync(
    new URL(
      "../../../docs/briefs/0002-W5-reference-values.json",
      import.meta.url,
    ),
    "utf8",
  ),
).cases;
const key = "horizon.intake.v1";
async function prepare(page: Page) {
  await storageTrap(page);
  await page.addInitScript(() => {
    const probe = window as unknown as { sends: string[] };
    probe.sends = [];
    const Native = Worker;
    window.Worker = class extends Native {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        const post = this.postMessage.bind(this);
        this.postMessage = (request: Request) => {
          if (request.op === "plan_from_answers")
            probe.sends.push(request.args[0]);
          post(request);
        };
      }
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start with my own figures", exact: true })
    .click();
}
async function load(page: Page, answers: AnswersV2) {
  await page.evaluate(
    ({ key, answers }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          format: "horizon-saved-intake",
          version: 1,
          answers,
          style: "one_question",
          place: "results",
        }),
      ),
    { key, answers },
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Continue with my answers", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What if…", exact: true }),
  ).toBeVisible();
}
const stored = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), key);
const sends = (page: Page) =>
  page.evaluate(() => (window as unknown as { sends: string[] }).sends);
async function capture(page: Page, info: TestInfo, name: string) {
  await expect(
    page.getByRole("button", { name: "Try a change", exact: true }),
  ).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}
const changes: Record<string, Record<string, string>> = {
  "spending-80000": { spending: "80000" },
  "retire-at-70": { retire: "70" },
  "savings-total-1000000": { savings: "1000000" },
  "social-security-70-33000": {
    social_security: "33000",
    social_security_from: "70",
  },
  "growth-6-prices-3": { investments_grow: "6", prices_rise: "3" },
  "ranged-spending-70000": { spending: "70000" },
  "worked-out-savings-then-total-600000": { savings: "600000" },
};
test("what-if: reference documents, heads, reset, keep and saved-answer isolation", async ({
  page,
  context,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const outside: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      outside.push(request.url());
  });
  await prepare(page);
  for (const [name, values] of Object.entries(changes)) {
    const source =
      name === "ranged-spending-70000"
        ? w5["v2-range-nothing-solved"]
        : name === "worked-out-savings-then-total-600000"
          ? w5["v2-solve-savings"]
          : reference.start;
    await load(page, source.answers);
    const before = await stored(page);
    const originalHead = await page
      .getByTestId("intake-headline")
      .textContent();
    await capture(page, info, `${name}-start`);
    for (const [id, value] of Object.entries(values)) {
      const box = page.locator(`#what-if-number-${id}`);
      await box.fill(value);
      await box.press("Enter");
      await expect(page.getByTestId("intake-headline")).toBeVisible();
    }
    expect(JSON.parse((await sends(page)).at(-1)!)).toEqual(
      reference[name].answers,
    );
    await expect(page.getByTestId("intake-headline")).toHaveText(
      reference[name].head[0].slice(3),
    );
    await expect(
      page.getByText("What if: not your answers", { exact: true }),
    ).toBeVisible();
    expect(await stored(page)).toBe(before);
    await capture(page, info, name);
    if (name === "savings-total-1000000") {
      await page
        .getByRole("button", { name: "Keep these as my answers", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "What if…", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("What if: not your answers", { exact: true }),
      ).toHaveCount(0);
      const kept = JSON.parse((await stored(page))!).answers;
      expect(
        kept.savings.accounts.map(
          (account: { balance: { cents: number } }) => account.balance.cents,
        ),
      ).toEqual([2666667, 20000000, 69333333, 8000000]);
      expect(kept.savings.accounts[1].cost_basis).toEqual({ cents: 11000000 });
      expect(kept.what_if).toBeUndefined();
      await capture(page, info, "kept-savings");
    } else {
      await page
        .getByRole("button", { name: "Reset to my answers", exact: true })
        .click();
      await expect(page.getByTestId("intake-headline")).toHaveText(
        originalHead!,
      );
      expect(await stored(page)).toBe(before);
      await capture(page, info, `${name}-reset`);
    }
  }
  await page.getByRole("button", { name: "Horizon welcome" }).click();
  await page
    .getByRole("button", { name: "Try an example household", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open example plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What if…", exact: true }),
  ).toHaveCount(0);
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      keys: Object.keys(localStorage),
      session: sessionStorage.length,
      writes: (window as unknown as { writes: string[] }).writes,
    })),
  ).toEqual({ keys: [key], session: 0, writes: [] });
});
test("what-if: native drag release, every slider and box by keyboard, validation and zero-account keep", async ({
  page,
  context,
  browser,
  browserName,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const outside: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      outside.push(request.url());
  });
  await prepare(page);
  const answers = structuredClone(reference.start.answers);
  answers.pension = {
    expects: "yes",
    amount: { cents: 1200000, per: "year" },
    start_age: 65,
    rises_with_prices: "no",
  };
  await load(page, answers);
  await capture(page, info, "all-eight-controls");
  const before = await stored(page);
  const slider = page.locator("#what-if-spending");
  await slider.scrollIntoViewIfNeeded();
  const bounds = (await slider.boundingBox())!;
  const count = (await sends(page)).length;
  await page.mouse.move(
    bounds.x + bounds.width * 0.335,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.4,
    bounds.y + bounds.height / 2,
    { steps: 6 },
  );
  expect((await sends(page)).length).toBe(count);
  await page.mouse.up();
  await expect.poll(async () => (await sends(page)).length).toBe(count + 1);
  await expect(page.getByTestId("intake-headline")).toBeVisible();
  await capture(page, info, "native-drag-released");
  await page
    .getByRole("button", { name: "Reset to my answers", exact: true })
    .click();
  const traversal =
    process.platform === "darwin" && browserName === "webkit"
      ? "Alt+Tab"
      : "Tab";
  for (const id of [
    "retire",
    "spending",
    "savings",
    "social_security",
    "social_security_from",
    "pension",
    "investments_grow",
    "prices_rise",
  ]) {
    const control = page.locator(`#what-if-${id}`);
    await keyboardTo(page, control, traversal);
    await expect(control).toBeFocused();
    expect(
      await control.evaluate(
        (element) => getComputedStyle(element).outlineStyle,
      ),
    ).toBe("solid");
    for (const key of ["ArrowRight", "PageUp", "PageDown"]) {
      const count = (await sends(page)).length;
      await page.keyboard.down(key);
      expect((await sends(page)).length).toBe(count);
      await page.keyboard.up(key);
      await expect.poll(async () => (await sends(page)).length).toBe(count + 1);
      await expect(page.getByTestId("intake-headline")).toBeVisible();
    }
    const box = page.locator(`#what-if-number-${id}`);
    await keyboardTo(page, box, traversal);
    await expect(box).toBeFocused();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(
      id === "retire"
        ? "69"
        : id === "social_security_from"
          ? "69"
          : id === "investments_grow" || id === "prices_rise"
            ? "3.25"
            : id === "savings"
              ? "800000"
              : "30000",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("intake-headline")).toBeVisible();
    await capture(page, info, `keyboard-${id}`);
  }
  const box = page.locator("#what-if-number-spending");
  const calls = (await sends(page)).length;
  await box.fill("200001");
  await box.press("Enter");
  await expect(page.getByRole("alert")).toContainText("200,000");
  expect((await sends(page)).length).toBe(calls);
  expect(await stored(page)).toBe(before);
  await capture(page, info, "number-out-of-range");
  await page
    .getByRole("button", { name: "Reset to my answers", exact: true })
    .click();
  // All-zero original accounts are replaced by the engine's generated account.
  answers.savings = {
    accounts: [
      { kind: "cash", balance: { cents: 0 } },
      { kind: "roth", balance: { cents: 0 } },
    ],
  };
  await load(page, answers);
  await page.locator("#what-if-number-savings").fill("600000");
  await page.locator("#what-if-number-savings").press("Enter");
  await expect(page.getByTestId("intake-headline")).toBeVisible();
  await page
    .getByRole("button", { name: "Keep these as my answers", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What if…", exact: true }),
  ).toBeVisible();
  expect(JSON.parse((await stored(page))!).answers.savings).toEqual({
    accounts: [
      {
        kind: "taxable",
        balance: { cents: 60000000 },
        cost_basis: { cents: 60000000 },
      },
    ],
  });
  await capture(page, info, "kept-generated-account");
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
