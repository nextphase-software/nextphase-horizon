// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { test } from "./fixtures";
import { storageTrap } from "./privacy";
test("intake: dates, add later, brokerage ranges, assumptions and Forget cancellation", async ({
  page,
  browser,
  context,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await storageTrap(page);
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
  const outside: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      outside.push(request.url());
  });
  async function capture(name: string) {
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
  const next = () =>
    page.getByRole("button", { name: "Continue", exact: true }).click();
  async function date(month: string, day: string, year: string) {
    await page.getByLabel("Month", { exact: true }).selectOption(month);
    await page.getByLabel("Day", { exact: true }).fill(day);
    await page.getByLabel("Year", { exact: true }).fill(year);
  }
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("horizon.intake.v1")!));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start with my own figures", exact: true })
    .click();
  await next();
  await capture("02-birth-date-empty");
  await page
    .getByRole("button", { name: "I'll add this later", exact: true })
    .click();
  await expect(page.getByLabel("Month", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  await capture("05-birth-add-later");
  await next();
  expect((await saved()).answers.birth_date).toEqual({ later: true });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await date("02", "29", "1965");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Give a date that exists, or add it later.", {
      exact: true,
    }),
  ).toBeVisible();
  await date("03", "10", "1965");
  await capture("02-birth-date-entered");
  await next();
  await next();
  await page
    .getByRole("button", { name: "I know the date instead", exact: true })
    .click();
  await date("03", "10", "2031");
  await capture("04-retirement-date");
  await next();
  await next();
  await page
    .getByRole("checkbox", { name: "I'm not sure of this", exact: true })
    .check();
  await next();
  await page
    .getByRole("radio", { name: "No, my work ends earlier", exact: true })
    .check();
  await date("06", "01", "2030");
  await capture("07-work-end-date");
  await next();
  await page.getByRole("radio", { name: "No", exact: true }).check();
  await next();
  await next();
  await expect(
    page.getByRole("heading", {
      name: "Where do you keep your savings?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Kind of account", { exact: true })
    .selectOption("taxable");
  await page
    .getByRole("button", {
      name: "Not sure how much? Give a range",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", {
      name: "Account balance, lower amount",
      exact: true,
    })
    .fill("70k");
  await page
    .getByRole("textbox", {
      name: "Account balance, higher amount",
      exact: true,
    })
    .fill("90k");
  await page
    .getByRole("textbox", {
      name: "About how much of that did you put in yourself?",
      exact: true,
    })
    .fill("50k");
  await page
    .getByRole("checkbox", { name: "I'm not sure of this", exact: true })
    .check();
  await capture("13-brokerage-balance-range-basis");
  await page
    .getByRole("button", { name: "Add this account", exact: true })
    .click();
  await next();
  await page
    .getByRole("button", { name: "I'll add this later", exact: true })
    .click();
  await next();
  await page
    .getByRole("checkbox", { name: "About the same as now", exact: true })
    .check();
  await next();
  const before = await saved();
  expect(before.answers.birth_date).toEqual({ date: "1965-03-10" });
  expect(before.answers.retirement).toEqual({ date: "2031-03-10" });
  expect(before.answers.pay_ends).toEqual({ date: "2030-06-01" });
  expect(before.answers.savings).toEqual({
    accounts: [
      {
        kind: "taxable",
        balance: { range: { low_cents: 7000000, high_cents: 9000000 } },
        cost_basis: { cents: 5000000 },
      },
    ],
  });
  expect(before.answers.spending_in_retirement).toEqual({ same_as_now: true });
  expect(before.answers.not_sure).toEqual(["pay", "savings"]);
  await page.getByRole("button", { name: "Change these", exact: true }).click();
  const rate = page.getByRole("textbox", {
    name: "Prices rise, percent a year",
    exact: true,
  });
  await rate.fill("20.01");
  await page
    .getByRole("button", { name: "Use these rates", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("0 to 20");
  await expect(
    page.getByRole("button", { name: "See my plan", exact: true }),
  ).toBeEnabled();
  await rate.fill("2.75");
  await page
    .getByRole("button", { name: "Use these rates", exact: true })
    .click();
  expect((await saved()).answers.assumptions).toEqual({ inflation: "0.0275" });
  await capture("06-review-changed-assumptions");
  const keep = await saved();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(
      "Forget your answers on this device? This can't be undone.",
    );
    await dialog.dismiss();
  });
  await page
    .getByRole("button", { name: "Forget my answers", exact: true })
    .first()
    .click();
  expect(await saved()).toEqual(keep);
  await page.getByRole("button", { name: "See my plan", exact: true }).click();
  await expect(page.getByTestId("intake-headline")).toContainText(
    "You could spend up to",
  );
  await capture("dates-result");
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { writes: string[] }).writes,
    ),
  ).toEqual([]);
});
