// SPDX-License-Identifier: AGPL-3.0-only
import { chromium, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { test } from "./fixtures";
import { keyboardTo } from "./keyboard";
import { pdfPages } from "./pdf";
import options from "../../../docs/briefs/0003-W5-options.json" with { type: "json" };
import w5 from "../../../docs/briefs/0002-W5-reference-values.json" with { type: "json" };

test("options, plan collections, all-copy comparison and Letter summaries", async ({
  page,
  context,
  browser,
  browserName,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const outside: string[] = [],
    errors: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
      outside.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const traversal =
    process.platform === "darwin" && browserName === "webkit"
      ? "Alt+Tab"
      : "Tab";
  async function activate(target: Locator) {
    await keyboardTo(page, target, traversal);
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
  }
  const nav = page.getByRole("navigation", { name: "Plan sections" });
  const section = (name: string) =>
    activate(nav.getByRole("button", { name, exact: true }));
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
  async function focusedOptions() {
    const heading = page.locator("#plan-options-heading");
    await expect(heading).toBeFocused();
    expect(
      await heading.evaluate(
        (element) =>
          element.getBoundingClientRect().top >=
          (document.querySelector(".headline-strip")?.getBoundingClientRect()
            .bottom ?? 0),
      ),
    ).toBe(true);
  }
  async function example(label: string) {
    await page.goto("/");
    await activate(
      page.getByRole("button", {
        name: "Try an example household",
        exact: true,
      }),
    );
    await page.getByRole("radio", { name: label, exact: true }).check();
    await activate(
      page.getByRole("button", { name: "Open example plan", exact: true }),
    );
    await expect(page.locator(".overview-assumptions")).toBeVisible();
  }
  async function own(caseName: keyof typeof w5.cases, uncertain = false) {
    await page.evaluate(
      ({ answers, uncertain }) =>
        localStorage.setItem(
          "horizon.intake.v1",
          JSON.stringify({
            format: "horizon-saved-intake",
            version: 1,
            answers: {
              ...answers,
              ...(uncertain
                ? { not_sure: ["savings", "spending_in_retirement"] }
                : {}),
            },
            style: "one_question",
            place: "results",
          }),
        ),
      { answers: w5.cases[caseName].answers, uncertain },
    );
    await page.reload();
    await activate(
      page.getByRole("button", {
        name: "Continue with my answers",
        exact: true,
      }),
    );
    await expect(page.locator(".overview-assumptions")).toBeVisible();
  }
  async function readyCopy() {
    await expect(page.locator(".headline-differences")).toBeVisible();
    await expect(page.getByText("Calculating…", { exact: true })).toHaveCount(
      0,
    );
  }
  async function lowerReturns() {
    await activate(
      page.getByRole("button", { name: "+ New copy", exact: true }),
    );
    const radio = page.getByRole("radio", { name: /^Returns 1% lower/ });
    await keyboardTo(
      page,
      page.locator(".copy-panel input:not([disabled])").first(),
      traversal,
    );
    for (let n = 0; n < 6 && !(await radio.isChecked()); n++)
      await page.keyboard.press("ArrowDown");
    await expect(radio).toBeChecked();
    await activate(
      page.getByRole("button", { name: "Make the copy", exact: true }),
    );
    await readyCopy();
  }
  async function summaryPDF(name: string, onePage: boolean) {
    await section("Summary");
    await expect(
      page.getByRole("button", { name: "Print or save as PDF" }),
    ).toBeEnabled();
    await activate(
      page.locator(".export-screen > .plan-detail:not(.experts) > summary"),
    );
    if (name === "own-ranges-three-copies")
      await expect(
        page.locator(".export-screen .summary-plans:visible thead th"),
      ).toHaveText([
        "Measure",
        "Your plan",
        "Spend $64,994 a year",
        "Retire at 67",
        "Returns at 4%",
      ]);
    await capture(`${name}-summary-screen`);
    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 720, height: 960 });
    const summary = page.locator(".print-summary .plan-summary");
    await expect(summary).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
    const layout = await summary.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        optionsBottom:
          element.querySelector(".options-summary")!.getBoundingClientRect()
            .bottom - rect.top,
        answerBottom:
          element.querySelector(".summary-answer")!.getBoundingClientRect()
            .bottom - rect.top,
        sections: [...element.querySelectorAll("h2")].map((h) => h.textContent),
        avoid: [
          ...element.querySelectorAll(
            ".options-summary, .options-summary li, .summary-plans",
          ),
        ].map((node) => getComputedStyle(node).breakInside),
      };
    });
    expect(layout.answerBottom).toBeLessThan(960);
    expect(layout.optionsBottom).toBeLessThan(960);
    expect(layout.sections).toEqual([
      "Answers",
      "Ways to make your savings last",
      "Your money this year",
      "Plans you tried",
      "What this result doesn't count",
      "Answers you weren't sure of",
    ]);
    expect(layout.avoid.every((value) => value === "avoid")).toBe(true);
    await capture(`${name}-print-media`);
    const path = info.outputPath(`${name}-letter.pdf`);
    let pdf: Buffer;
    if (browserName === "chromium")
      pdf = await page.pdf({
        path,
        preferCSSPageSize: true,
        printBackground: true,
      });
    else {
      // WebKit exposes print media, but no PDF API. Preserve its rendered
      // summary DOM and print that static document with Chromium.
      const html = (await page.content()).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        "",
      );
      const printer = await chromium.launch();
      try {
        const printPage = await printer.newPage({
          viewport: { width: 720, height: 960 },
        });
        await printPage.route("http://127.0.0.1:4173/print-evidence", (route) =>
          route.fulfill({ contentType: "text/html", body: html }),
        );
        await printPage.goto("http://127.0.0.1:4173/print-evidence");
        await printPage.evaluate(() => document.fonts.ready);
        pdf = await printPage.pdf({
          path,
          preferCSSPageSize: true,
          printBackground: true,
        });
        info.annotations.push({
          type: "pdf-renderer",
          description: `WebKit print-media DOM; PDF rendered by Chromium ${printer.version()}`,
        });
      } finally {
        await printer.close();
      }
    }
    expect(pdf.toString("latin1")).toMatch(/\/MediaBox\s*\[0 0 612 792\]/);
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length;
    if (onePage) expect(pages).toBe(1);
    else expect([1, 2]).toContain(pages);
    const text = pdfPages(pdf);
    expect(text).toHaveLength(pages!);
    for (const sentence of [
      "Answers",
      "Ways to make your savings last",
      "Spend $64,994 a year in retirement",
      "Retire a year later, at 67",
      "What you can't choose: investment returns",
      "If returns were 6% a year instead of 5%: savings last to 95, with $4,743 a year to spare.",
    ])
      expect(text[0]).toContain(sentence);
    await info.attach(`${name}-letter`, {
      path,
      contentType: "application/pdf",
    });
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize(info.project.use.viewport!);
  }
  const examples = [
    ["answers-working-61", "Single, 61, still working, plans to retire at 66"],
    ["synthetic-retired", "Single, 70, retired"],
    ["A-drawdown", "Single, 73, retired, small savings"],
    ["answers-underfunded", "Single, 61, spending more than income"],
  ];
  for (const [id, label] of examples) {
    await example(label);
    await capture(`${id}-overview-options`);
    await activate(
      page.getByRole("button", { name: "See all options", exact: true }),
    );
    await focusedOptions();
    await capture(`${id}-plan-options`);
    await activate(
      page.getByRole("link", { name: "See your options", exact: true }),
    );
    await focusedOptions();
    const expected =
      options.cases[`example/${id}` as "example/answers-working-61"];
    for (const item of expected.options.items.filter((item) => item.try)) {
      await activate(
        page.getByRole("button", {
          name: `Try this: ${item.title}`,
          exact: true,
        }),
      );
      await readyCopy();
      await expect(page.locator(".copy-tabs [aria-current]")).toHaveText(
        expected.copy_names[item.try.id as "spend_to_last"].name,
      );
      await activate(
        page.getByRole("button", { name: "Back to plan", exact: true }),
      );
      await activate(
        page.getByRole("button", {
          name: `Open the copy: ${item.title}`,
          exact: true,
        }),
      );
      await readyCopy();
      await section("Plan");
      await expect(page.locator(".copy-banner")).toBeVisible();
      await expect(page.locator(".plan-options")).toHaveCount(0);
      await activate(
        page
          .getByRole("button", { name: "Back to your plan", exact: true })
          .first(),
      );
      await expect(page.locator(".plan-options")).toBeVisible();
    }
    if (id === "answers-working-61") {
      await activate(
        page
          .locator(".your-plans")
          .getByRole("button", { name: "Compare Retire at 67", exact: true }),
      );
      await lowerReturns();
      await expect(page.locator(".side-by-side h2")).toHaveText(
        expected.side_by_side_with_returns.heading,
      );
      await capture("three-copies-side-by-side");
      await activate(
        page.getByRole("button", { name: "Open Retire at 67", exact: true }),
      );
      await expect(page.locator(".copy-tabs [aria-current]")).toHaveText(
        "Retire at 67",
      );
      await activate(
        page.getByRole("button", { name: "Back to plan", exact: true }),
      );
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "See the options", exact: true }),
      );
      await focusedOptions();
      await capture("plan-with-three-copies");
      await section("Overview");
      await capture("overview-with-three-copies");
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "Compare 4 plans", exact: true }),
      );
      await readyCopy();
      await activate(
        page.getByRole("button", { name: "Back to plan", exact: true }),
      );
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "Compare 4 plans", exact: true }),
      );
      await readyCopy();
      await section("Overview");
      await activate(
        page
          .getByRole("button", { name: "Back to your plan", exact: true })
          .first(),
      );
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "See the options", exact: true }),
      );
      await focusedOptions();
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "Get the summary", exact: true }),
      );
      await expect(page.locator(".export-screen")).toBeVisible();
      await summaryPDF("example-three-copies", true);
    }
    if (id === "answers-underfunded") {
      await activate(
        page
          .locator(".next-steps")
          .getByRole("button", { name: "Try a change", exact: true }),
      );
      await expect(page.locator(".copy-panel")).toBeVisible();
      await activate(page.getByRole("button", { name: "Cancel", exact: true }));
    }
  }
  await own("v2-solve-retirement");
  await expect(page.locator(".plan-options")).toHaveCount(0);
  await capture("worked-out-overview");
  await section("Plan");
  await expect(page.locator(".plan-options")).toHaveCount(0);
  await capture("worked-out-plan");
  await activate(
    page
      .locator(".next-steps")
      .getByRole("button", { name: "Try a change", exact: true }),
  );
  await expect(page.locator(".copy-panel")).toBeVisible();
  await activate(page.getByRole("button", { name: "Cancel", exact: true }));
  await own("v2-range-nothing-solved", true);
  await capture("own-ranges-overview");
  await activate(
    page.getByRole("button", { name: "See all options", exact: true }),
  );
  await focusedOptions();
  await capture("own-ranges-plan");
  for (const title of [
    "Spend $64,994 a year in retirement",
    "Retire a year later, at 67",
  ]) {
    await activate(
      page.getByRole("button", { name: `Try this: ${title}`, exact: true }),
    );
    await readyCopy();
    if (title.startsWith("Spend")) {
      await activate(
        page.getByRole("button", { name: "Back to plan", exact: true }),
      );
      await expect(page.locator(".plan-options")).toBeVisible();
      // Blurring an unchanged what-if number clears copies; resume at options.
      await page.locator("#plan-options-heading").focus();
      await focusedOptions();
    }
  }
  await lowerReturns();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your plan and 3 copies, side by side",
  );
  await capture("own-ranges-side-by-side");
  await summaryPDF("own-ranges-three-copies", false);
  await section("Plan");
  await activate(
    page
      .locator(".next-steps")
      .getByRole("button", { name: "Change your answers", exact: true }),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Here's what you told us",
  );
  await capture("own-ranges-your-answers");
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});
