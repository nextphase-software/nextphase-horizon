// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { test } from "./fixtures";
import { keyboardTo } from "./keyboard";
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
];
import shell from "../../../docs/briefs/0003-W4-shell-figures.json" with { type: "json" };
import w5 from "../../../docs/briefs/0002-W5-reference-values.json" with { type: "json" };

test("plan layout: Overview landing, navigation, copy switcher, every year and answer origins", async ({
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
  const errors: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      outside.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const traversal =
    process.platform === "darwin" && browserName === "webkit"
      ? "Alt+Tab"
      : "Tab";
  async function activate(locator: Locator) {
    await keyboardTo(page, locator, traversal);
    await expect(locator).toBeFocused();
    await page.keyboard.press("Enter");
  }
  const nav = page.getByRole("navigation", { name: "Plan sections" });
  async function section(name: string) {
    await activate(nav.getByRole("button", { name, exact: true }));
    await expect(
      nav.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  async function capture(name: string) {
    await page.evaluate(() => scrollTo(0, 0));
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
  for (const sample of samples) {
    await page.goto("/");
    await expect(nav).toHaveCount(0);
    await activate(
      page.getByRole("button", {
        name: "Try an example household",
        exact: true,
      }),
    );
    await expect(nav).toHaveCount(0);
    await page.getByRole("radio", { name: sample.label, exact: true }).check();
    await activate(
      page.getByRole("button", { name: "Open example plan", exact: true }),
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(nav.getByRole("button")).toHaveText([
      "Overview",
      "Plan",
      "Compare",
      "Summary",
      "Your answers",
    ]);
    await expect(
      nav.getByRole("button", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("navigation", { name: "Planning steps" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Plan", exact: true }),
    ).toHaveValue("");
    await expect(page.getByText("Calculating…", { exact: true })).toHaveCount(
      0,
    );
    await capture(`overview-${sample.name}`);
    if (sample.name === "two-person") {
      await expect(page.locator(".headline-tiles")).toHaveCount(0);
      continue;
    }
    await activate(
      page.getByRole("button", { name: "Open the chart", exact: true }),
    );
    await expect(
      page.getByRole("heading", { name: "Savings by age", exact: true }),
    ).toBeFocused();
    const expected =
      shell.cases[`example/${sample.name}` as "example/answers-working-61"];
    const chooser = page.getByRole("slider", { name: "Choose a year" });
    await keyboardTo(page, chooser, traversal);
    await chooser.press("Home");
    for (const [i, panel] of expected.panels.entries()) {
      if (i) await chooser.press("ArrowRight");
      await expect(chooser).toHaveAttribute(
        "aria-valuetext",
        String(panel[0]).replace(" · age ", ", age "),
      );
      await expect(page.locator(".chosen-year h3")).toHaveText(
        String(panel[0]),
      );
      await expect(page.locator(".chosen-year dd")).toHaveText(
        panel.slice(1, 3) as string[],
      );
      await expect(page.locator(".chosen-year li")).toHaveText(
        panel[3] as string[],
      );
    }
    await chooser.press("Home");
    await expect(chooser).toHaveValue("0");
    await chooser.press("End");
    await expect(chooser).toHaveValue(String(expected.panels.length - 1));
    await chooser.press("ArrowLeft");
    await capture(`plan-chooser-moved-${sample.name}`);
    await section("Compare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Compare your plans side by side",
    );
    await capture(`compare-empty-${sample.name}`);
    await section("Your answers");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This is an example household",
    );
    await capture(`answers-example-${sample.name}`);
    if (sample.name !== samples[0].name) continue;
    await section("Plan");
    await activate(
      page.getByRole("button", { name: "Try a change", exact: true }),
    );
    await page
      .getByRole("radio", { name: "Retire a year later, at 67", exact: true })
      .check();
    await activate(
      page.getByRole("button", { name: "Make the copy", exact: true }),
    );
    await expect(page.locator(".compare-screen h1")).toContainText(
      "Retiring at 67",
    );
    await expect(
      nav.getByRole("button", { name: "Compare 2 plans", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("combobox", { name: "Plan", exact: true }),
    ).toHaveValue("retire_later");
    await capture("compare-copy");
    await section("Overview");
    await expect(page.locator(".copy-banner")).toContainText(
      "You're looking at a copy: Retire at 67. Your plan stays as it is.",
    );
    await expect(
      page.getByRole("button", { name: "Try a change", exact: true }),
    ).toHaveCount(0);
    await capture("copy-overview");
    await section("Plan");
    await expect(
      page.getByRole("region", {
        name: "Copy: Retire at 67: headline figures",
      }),
    ).toBeVisible();
    await capture("copy-plan");
    const switcher = page.getByRole("combobox", { name: "Plan", exact: true });
    async function choosePlan(value: "" | "retire_later") {
      await keyboardTo(page, switcher, traversal);
      await expect(switcher).toBeFocused();
      if (process.platform === "darwin" && browserName === "webkit")
        await switcher.selectOption(value);
      else {
        await switcher.press(value === "" ? "Home" : "End");
        await switcher.press("Enter");
      }
      await expect(switcher).toHaveValue(value);
    }
    await choosePlan("");
    await expect(page.locator(".copy-banner")).toHaveCount(0);
    await section("Summary");
    await expect(
      page.getByRole("link", { name: "Download plan file" }),
    ).toBeVisible();
    await capture("summary");
    await choosePlan("retire_later");
    await expect(
      nav.getByRole("button", { name: "Plan", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await section("Overview");
    await choosePlan("");
    await expect(page.locator(".copy-banner")).toHaveCount(0);
    await choosePlan("retire_later");
    await expect(
      nav.getByRole("button", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".copy-banner")).toBeVisible();
    await section("Your answers");
    await expect(switcher).toHaveValue("");
    await choosePlan("retire_later");
    await expect(
      nav.getByRole("button", { name: "Plan", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await activate(
      page
        .getByRole("button", { name: "Compare with your plan", exact: true })
        .first(),
    );
    await expect(page.locator(".copy-tabs [aria-current]")).toHaveText(
      "Retire at 67",
    );
  }
  // Opened files land on Overview and have their own answers explanation.
  await page.goto("/");
  await activate(
    page.getByRole("button", { name: "Open a plan file", exact: true }),
  );
  await expect(nav).toHaveCount(0);
  await page.getByLabel("Choose a plan file").setInputFiles({
    name: "synthetic-plan.json",
    mimeType: "application/json",
    buffer: readFileSync(
      new URL(
        "../../../packages/parity/golden/E-senior-2028-loss-carry.export.json",
        import.meta.url,
      ),
    ),
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(
    nav.getByRole("button", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".overview-assumptions")).toBeVisible();
  await capture("overview-opened-file");
  await section("Your answers");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This plan came from a file",
  );
  await capture("answers-opened-file");
  // Restoring saved own figures at results also lands on Overview.
  await page.evaluate(
    (answers) =>
      localStorage.setItem(
        "horizon.intake.v1",
        JSON.stringify({
          format: "horizon-saved-intake",
          version: 1,
          answers,
          style: "one_question",
          place: "results",
        }),
      ),
    w5.cases["v2-working-complete"].answers,
  );
  await page.reload();
  await activate(
    page.getByRole("button", { name: "Continue with my answers", exact: true }),
  );
  await expect(page.getByTestId("intake-headline")).toBeFocused();
  await expect(
    nav.getByRole("button", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "What if…", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".overview-assumptions")).toBeVisible();
  await capture("overview-own-figures");
  await section("Your answers");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Here's what you told us",
  );
  await capture("answers-own-figures");
  if (info.project.use.viewport!.width === 375) {
    await page.setViewportSize({ width: 320, height: 812 });
    await section("Plan");
    await expect(
      page.getByRole("button", { name: "Try a change", exact: true }),
    ).toBeEnabled();
    await capture("plan-320");
    await section("Overview");
    await capture("overview-320");
  }
  await section("Overview");
  await activate(
    page.getByRole("button", { name: "Open the chart", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Savings by age", exact: true }),
  ).toBeFocused();
  await capture("own-plan-chart-focused");
  await activate(
    page.getByRole("button", { name: "Horizon welcome", exact: true }),
  );
  await activate(
    page.getByRole("button", { name: "Try an example household", exact: true }),
  );
  await activate(
    page.getByRole("button", { name: "Open example plan", exact: true }),
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator(".overview-assumptions")).toBeVisible();
  await capture("overview-reopened-after-chart");
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});
