// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator } from "@playwright/test";
import { test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import type { SustainableSpending } from "../src/generated/types/sustainable-spending.v1";
import type { Operation, Request, Response } from "../src/protocol";
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
import { countWord, flagWords, statusWord } from "../src/format";
const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const reference = JSON.parse(read("docs/briefs/0003-W1-reference-values.json"));
const metadata = JSON.parse(
  read("packages/parity/golden/answers-working-61.spend.json"),
).run.metadata;
const footer = `Open source (AGPL-3.0-only) · Sample data only; nothing you enter is stored · Model ${metadata.model_version} · Federal tax law ${metadata.rule_set_year}, projected after`;

test("start and guided setup: keyboard, native parity, accessibility and privacy", async ({
  page,
  context,
  browser,
  browserName,
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
  await expect(page.getByTestId("intro")).toBeVisible();
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveAttribute(
    "content",
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'",
  );
  const traversal =
    process.platform === "darwin" && browserName === "webkit"
      ? "Alt+Tab"
      : "Tab";
  async function keyboardTo(locator: Locator) {
    // Stay inside the document when the target precedes the current focus.
    const backwards = await locator.evaluate(
      (target) =>
        !!document.activeElement &&
        !!(
          target.compareDocumentPosition(document.activeElement) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    );
    const key = backwards
      ? traversal === "Alt+Tab"
        ? "Alt+Shift+Tab"
        : "Shift+Tab"
      : traversal;
    for (let count = 0; count < 90; count++) {
      if (
        await locator.evaluate((element) => element === document.activeElement)
      )
        return;
      await page.keyboard.press(key);
    }
    throw new Error(`Keyboard could not reach ${await locator.textContent()}`);
  }
  async function activate(locator: Locator) {
    await keyboardTo(locator);
    await expect(locator).toBeFocused();
    expect(
      await locator.evaluate(
        (element) => getComputedStyle(element).outlineWidth,
      ),
    ).toBe("3px");
    await page.keyboard.press("Enter");
  }
  async function type(locator: Locator, text: string) {
    await keyboardTo(locator);
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(text);
  }
  async function evidence(name: string) {
    await expect(page.locator(".reference-footer")).toHaveText(footer);
    for (const field of await page.locator(".dollar-field").all()) {
      await expect(field.locator("span")).toHaveText("$");
      await expect(field.locator("span")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(field.locator("input")).not.toHaveValue(/^\$/);
      expect(
        await field.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const prefix = element.querySelector("span")!.getBoundingClientRect();
          const input = element.querySelector("input")!.getBoundingClientRect();
          return (
            prefix.left >= box.left &&
            prefix.right < input.left &&
            input.right <= box.right
          );
        }),
      ).toBe(true);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
  async function call(op: Operation, fixture: string): Promise<string> {
    return page.evaluate(
      ({ op, fixture }) =>
        new Promise<string>((resolve) => {
          const worker = (window as unknown as { engineWorker: Worker })
            .engineWorker;
          const id = -1;
          const listener = ({ data }: MessageEvent<Response>) => {
            if (data.id === id) {
              worker.removeEventListener("message", listener);
              resolve(data.json);
            }
          };
          worker.addEventListener("message", listener);
          worker.postMessage({ id, op, args: [fixture] } as Request);
        }),
      { op, fixture },
    );
  }
  const initialDark = testInfo.project.use.colorScheme === "dark";
  const scheme = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(await scheme()).toBe(initialDark ? "dark" : "light");
  const theme = page.getByRole("button", { name: "Toggle theme" });
  await activate(theme);
  expect(await scheme()).toBe(initialDark ? "light" : "dark");
  await page.emulateMedia({ colorScheme: initialDark ? "light" : "dark" });
  await page.emulateMedia({ colorScheme: initialDark ? "dark" : "light" });
  expect(await scheme()).toBe(initialDark ? "light" : "dark");
  await page.keyboard.press("Enter");
  const questions = page.getByRole("group", { name: "Your question" });
  await expect(questions.getByRole("radio").first()).toBeChecked();
  await expect(questions.getByRole("radio").last()).toBeDisabled();
  await keyboardTo(questions.getByRole("radio").first());
  await page.keyboard.press("ArrowDown");
  await expect(questions.getByRole("radio").nth(1)).toBeChecked();
  await page.keyboard.press("ArrowUp");
  await expect(questions.getByRole("radio").first()).toBeChecked();
  const planning = page.getByRole("navigation", { name: "Planning steps" });
  await expect(planning.getByRole("button")).toHaveCount(2);
  await expect(planning.getByText("Not available yet")).toHaveCount(4);
  await expect(planning.getByRole("link")).toHaveCount(0);
  const households = page.getByRole("group", {
    name: "Start from a sample household",
  });
  await keyboardTo(households.getByRole("radio").first());
  const statuses: string[] = [];
  const answerByName: Record<string, SustainableSpending> = {};
  for (const [index, sample] of samples.entries()) {
    if (index) await page.keyboard.press("ArrowDown");
    const radio = households.getByRole("radio", {
      name: sample.label,
      exact: true,
    });
    await expect(radio).toBeFocused();
    await expect(radio).toBeChecked();
    const fixture = read(`packages/app/fixtures/${sample.name}.json`);
    const result = JSON.parse(await call("sustainable_spending", fixture));
    statuses.push(result.status);
    const choice = radio.locator("..");
    await expect(choice.locator(".status")).toHaveText(
      new RegExp(
        statusWord(result.status, result.run?.omissions.length).replace(
          /[()]/g,
          "\\$&",
        ),
      ),
    );
    if (result.code) {
      expect(result.code).toBe("MULTIPLE_PERSONS_UNSUPPORTED");
      expect(JSON.parse(await call("run", fixture)).code).toBe(
        "MULTIPLE_PERSONS_UNSUPPORTED",
      );
      await expect(
        page.getByRole("button", { name: "Continue", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByText("Horizon plans for one person only."),
      ).toBeVisible();
    } else {
      answerByName[sample.name] = result;
      expect(await call("run", fixture)).toBe(
        read(`packages/parity/golden/${sample.name}.run.json`).trimEnd(),
      );
      expect(result.sustainable_spending).toBe(
        reference.sustainable_spending[sample.name].sustainable_spending,
      );
      if (result.flag)
        await expect(choice).toContainText(flagWords(result.flag));
    }
    await evidence(`01-start-${sample.name}`);
  }
  await expect(page.getByTestId("intro")).toContainText(
    `The engine gives a full result for ${countWord(statuses.filter((status) => status === "complete").length)} of these five sample households, a partial one for ${countWord(statuses.filter((status) => status === "partial").length)}, and none for the couple (only one person is supported).`,
  );
  for (let index = 1; index < samples.length; index++)
    await page.keyboard.press("ArrowUp");
  await expect(households.getByRole("radio").first()).toBeChecked();
  const omissions = page.getByText(
    "What the selected household's result leaves out",
    { exact: true },
  );
  await activate(omissions);
  for (const omission of answerByName[samples[0].name].run.omissions)
    await expect(page.getByText(omission, { exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await activate(page.getByRole("button", { name: "Continue", exact: true }));
  await expect(
    page.getByRole("heading", { name: "About you", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText(
      "Your answers stay in this page only. Reload or close it and they're gone.",
    ),
  ).toBeVisible();
  await evidence("02-about-you");
  const next = () =>
    activate(page.getByRole("button", { name: "Continue", exact: true }));
  await next();
  await expect(
    page.getByLabel("Wages end on my retirement date", { exact: true }),
  ).toBeChecked();
  await evidence("03-income");
  await next();
  const account = page.getByRole("group", {
    name: "Workplace plan Tax-deferred",
    exact: true,
  });
  await type(
    account.getByRole("textbox", {
      name: "Balance today today's dollars",
      exact: true,
    }),
    "600,000",
  );
  const rough = account.getByRole("checkbox", {
    name: "Balance today: Rough",
    exact: true,
  });
  await keyboardTo(rough);
  await page.keyboard.press("Space");
  await expect(rough).toBeChecked();
  await evidence("04-accounts");
  await next();
  await evidence("05-spending");
  await next();
  await type(page.getByLabel("Inflation percent per year"), "3");
  await evidence("06-assumptions");
  await next();
  await expect(
    page.getByRole("heading", { name: "Review your answers", exact: true }),
  ).toBeFocused();
  const accountsReview = page.getByRole("region", {
    name: "Accounts",
    exact: true,
  });
  await expect(accountsReview).toContainText("$600,000");
  await expect(accountsReview.locator("dt")).toHaveText([
    "Cash savings: Account type",
    "Cash savings: Balance today",
    "Brokerage account: Account type",
    "Brokerage account: Balance today",
    "Brokerage account: Cost basis",
    "Workplace plan: Account type",
    "Workplace plan: Balance today",
    "Workplace plan: Plan kind",
    "Roth IRA: Account type",
    "Roth IRA: Balance today",
  ]);
  await expect(accountsReview.getByText("≈ Rough value")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Assumptions", exact: true }),
  ).toContainText("3percent per year");
  await expect(page.getByRole("link", { name: /^Edit / })).toHaveCount(5);
  await evidence("07-review");
  await activate(page.getByRole("button", { name: "Check this household" }));
  const resultView = page.getByTestId("checked-result");
  await expect(resultView.getByTestId("spending")).toHaveText("$64,654");
  await expect(resultView.getByTestId("entered")).toHaveText("$67,000");
  await expect(resultView.getByTestId("headroom")).toHaveText("-$2,346");
  await expect(
    resultView.getByRole("heading", {
      name: "Partial (5 omissions)",
      exact: true,
    }),
  ).toBeVisible();
  const editedFixture = read(
    "packages/app/test-data/web-edited-working-61.json",
  );
  const editedResult = JSON.parse(
    await call("sustainable_spending", editedFixture),
  );
  expect([
    editedResult.sustainable_spending,
    editedResult.entered,
    editedResult.headroom,
    editedResult.flag,
  ]).toEqual([64654, 67000, -2346, null]);
  await evidence("08-checked-edited-household");
  await activate(
    page.getByRole("link", { name: "Edit About you", exact: true }),
  );
  await page.getByLabel("Retirement date", { exact: true }).fill("2025-06-01");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Income", exact: true }).click();
  await expect(page.getByLabel("Wages end on", { exact: true })).toHaveValue(
    "2025-06-01",
  );
  await page
    .getByRole("button", { name: "Review your answers", exact: true })
    .click();
  await page.getByRole("button", { name: "Check this household" }).click();
  await expect(
    resultView.getByRole("heading", { name: "Invalid", exact: true }),
  ).toBeVisible();
  await expect(resultView).toContainText(
    "Wage end date precedes its start date.",
  );
  await expect(resultView.locator("dd")).toHaveCount(0);
  const invalid = JSON.parse(editedFixture);
  invalid.household.persons[0].retirement_date =
    invalid.household.income.wages[0].end_date = "2025-06-01";
  expect(
    JSON.parse(await call("sustainable_spending", JSON.stringify(invalid)))
      .code,
  ).toBe("END_BEFORE_START");
  await evidence("09-engine-error");
  // Switching samples keeps edits when cancelled and discards them only after confirmation.
  await planning
    .getByRole("button", { name: "Household", exact: true })
    .click();
  let cancelled = false;
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain(
      "edited answers, added accounts and Rough marks",
    );
    cancelled = true;
    await dialog.dismiss();
  });
  await households.getByRole("radio").nth(1).click();
  expect(cancelled).toBe(true);
  await expect(households.getByRole("radio").first()).toBeChecked();
  page.once("dialog", (dialog) => dialog.accept());
  await households.getByRole("radio").nth(1).click();
  // Preserve the W1 result and reference checks for every supported sample.
  for (const sample of samples.filter(
    (sample) => sample.name !== "two-person",
  )) {
    await households
      .getByRole("radio", { name: sample.label, exact: true })
      .check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    for (let step = 0; step < 5; step++)
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Check this household" }).click();
    const result = answerByName[sample.name];
    const format = (value: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    await expect(resultView.getByTestId("spending")).toHaveText(
      format(result.sustainable_spending),
    );
    await expect(resultView.getByTestId("entered")).toHaveText(
      format(result.entered),
    );
    await expect(resultView.getByTestId("headroom")).toHaveText(
      format(result.headroom),
    );
    for (const omission of result.run.omissions)
      await expect(
        resultView.getByText(omission, { exact: true }),
      ).toBeVisible();
    if (result.flag)
      await expect(resultView).toContainText(flagWords(result.flag));
    await expect(
      resultView.getByText("today's dollars, per year", { exact: true }),
    ).toHaveCount(3);
    await evidence(`10-result-${sample.name}`);
    await planning
      .getByRole("button", { name: "Household", exact: true })
      .click();
  }
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
  await expect(page.getByTestId("intro")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await expect(households.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: "Workplace plan Tax-deferred", exact: true })
      .getByRole("textbox", {
        name: "Balance today today's dollars",
        exact: true,
      }),
  ).toHaveValue("520,000");
  await expect(
    page
      .getByRole("checkbox", { name: "Balance today: Rough", exact: true })
      .first(),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "+ Add an account", exact: true })
    .click();
  await page
    .getByRole("button", { name: "+ Add an account", exact: true })
    .click();
  await expect(page.locator("fieldset.account legend")).toHaveText([
    "Cash savings Cash",
    "Brokerage account Brokerage (taxable)",
    "Workplace plan Tax-deferred",
    "Roth IRA Roth",
    "Cash savings 2 Cash",
    "Cash savings 3 Cash",
  ]);
  await expect(page.locator("fieldset.account legend small")).toHaveText([
    "Cash",
    "Brokerage (taxable)",
    "Tax-deferred",
    "Roth",
    "Cash",
    "Cash",
  ]);
  await evidence("11-accounts-duplicate-names");
  const cash = page.getByRole("group", {
    name: "Cash savings Cash",
    exact: true,
  });
  await cash.getByRole("button", { name: "Edit type", exact: true }).click();
  await cash.getByLabel("Account type", { exact: true }).selectOption("roth");
  await expect(
    page.getByRole("group", { name: "Roth IRA 2 Roth", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Workplace plan Tax-deferred", exact: true })
    .getByLabel("Plan kind", { exact: true })
    .selectOption("traditional_ira");
  await expect(
    page.getByRole("group", {
      name: "Traditional IRA Tax-deferred",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("fieldset.account legend")).toHaveText([
    "Roth IRA Roth",
    "Brokerage account Brokerage (taxable)",
    "Traditional IRA Tax-deferred",
    "Roth IRA 2 Roth",
    "Cash savings Cash",
    "Cash savings 2 Cash",
  ]);
  await evidence("12-accounts-type-and-plan-kind-names");
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Roth IRA 2: Balance today", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Traditional IRA: Plan kind", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Cash savings 2: Balance today", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Accounts", exact: true }),
  ).not.toContainText(/401k:|roth-ira:|account-[0-9]+:/);
  await evidence("13-review-readable-account-names");
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { writes: string[] }).writes,
    ),
  ).toEqual([]);
});
