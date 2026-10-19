// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawnSync } from "node:child_process";
import { test } from "./fixtures";
import { keyboardTo as reachByKeyboard } from "./keyboard";
import type { Request, Response } from "../src/protocol";
import type { Run } from "../src/generated/types/run-output.v2";
const root = new URL("../../../", import.meta.url);
const samples = [
  {
    name: "answers-working-61",
    label: "Single, 61, still working, plans to retire at 66",
    headline: "Savings run short at 93, two years before the plan ends.",
    answer1: "Not at $67,000 a year: savings run short at age 93 (2058).",
    answer2:
      "$64,994 a year in today's dollars lasts to 95: $2,006 less than you plan to spend.",
    answer3: "Investment returns, then spending, then the retirement date.",
  },
  {
    name: "synthetic-retired",
    label: "Single, 70, retired",
    headline: "Savings last to 95.",
    answer1: "Yes: at $50,000 a year, savings last to 95.",
    answer2:
      "$87,061 a year in today's dollars lasts to 95: $37,061 more than you plan to spend.",
    answer3: "Spending, then investment returns.",
  },
  {
    name: "A-drawdown",
    label: "Single, 73, retired, small savings",
    headline: "Savings run short at 76, two years before the plan ends.",
    answer1: "No: at $60,000 a year, savings run short at age 76 (2029).",
    answer2:
      "$43,690 a year in today's dollars lasts to 78: $16,310 less than you plan to spend.",
    answer3: "Spending, then investment returns.",
  },
  {
    name: "answers-underfunded",
    label: "Single, 61, spending more than income",
    headline: "Savings run short at 61, 34 years before the plan ends.",
    answer1: "No: savings run short at age 61 (2026), before you retire.",
    answer2: "Savings run short even with no retirement spending.",
  },
];
function native(command: string, fixture: string) {
  const result = spawnSync(
    "cargo",
    ["run", "-p", "horizon-cli", "--", command, fixture],
    { cwd: root, encoding: "utf8" },
  );
  expect(
    [0, 3],
    `Native ${command} ${fixture}: status=${result.status}; signal=${result.signal ?? "none"}; error=${result.error?.stack ?? "none"}; stderr tail:\n${result.stderr?.slice(-4000) ?? ""}`,
  ).toContain(result.status);
  expect(result.stdout.endsWith("\n")).toBe(true);
  return result.stdout.slice(0, -1);
}
test("plan: rendered references, actual worker/native parity, keyboard, all views and privacy", async ({
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
      requests: Request[];
      replies: Record<number, string>;
      writes: string[];
    };
    probe.requests = [];
    probe.replies = {};
    probe.writes = [];
    const deny = (name: string) => () => {
      probe.writes.push(name);
      throw new Error(`Forbidden storage: ${name}`);
    };
    for (const name of ["setItem", "removeItem", "clear"] as const)
      Storage.prototype[name] = deny(name);
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
        const post = this.postMessage.bind(this);
        this.postMessage = (request: Request) => {
          probe.requests.push(request);
          post(request);
        };
        this.addEventListener("message", ({ data }: MessageEvent<Response>) => {
          probe.replies[data.id] = data.json;
        });
      }
    };
  });
  const traversal =
    process.platform === "darwin" && browserName === "webkit"
      ? "Alt+Tab"
      : "Tab";
  async function activate(locator: Locator) {
    await reachByKeyboard(page, locator, traversal);
    await expect(locator).toBeFocused();
    expect(
      await locator.evaluate(
        (element) => getComputedStyle(element).outlineWidth,
      ),
    ).toBe("3px");
    await page.keyboard.press("Enter");
  }
  const planning = page.getByRole("navigation", { name: "Planning steps" });
  async function evidence(name: string) {
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const svg of await page.locator(".plan-screen svg").all())
      await expect(svg).toHaveAttribute("aria-hidden", "true");
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
  async function probe() {
    return page.evaluate(() => {
      const probe = window as unknown as {
        requests: Request[];
        replies: Record<number, string>;
      };
      return { requests: probe.requests, replies: probe.replies };
    });
  }
  const dollars = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  for (const sample of samples) {
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeVisible();
    await page.getByRole("radio", { name: sample.label, exact: true }).check();
    for (let i = 0; i < 6; i++)
      await activate(
        page.getByRole("button", { name: "Continue", exact: true }),
      );
    await expect(
      planning.getByRole("button", { name: "Plan", exact: true }),
    ).toBeEnabled();
    await expect(planning.getByText("Not available yet")).toHaveCount(1);
    await activate(
      page.getByRole("button", { name: "Continue to the input check" }),
    );
    await expect(
      page.getByRole("heading", { name: "No entries are marked rough." }),
    ).toBeVisible();
    await expect(
      page.getByText("Five groups of entries", { exact: true }),
    ).toBeVisible();
    const before = (await probe()).requests.length;
    await activate(
      page.getByRole("button", { name: "See the plan", exact: true }),
    );
    await expect(
      page.getByRole("heading", { name: sample.headline, exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("link", { name: "See the levers" }),
    ).toBeVisible();
    await expect(
      page.locator(".plan-answers > div").nth(0).locator("h2"),
    ).toHaveText(
      sample.name === "answers-working-61" ||
        sample.name === "answers-underfunded"
        ? "Can you retire at 66?"
        : "Do your savings last?",
    );
    await expect(
      page.locator(".plan-answers > div").nth(0).locator("p"),
    ).toHaveText(sample.answer1);
    await expect(
      page.locator(".plan-answers > div").nth(1).locator("p"),
    ).toHaveText(sample.answer2);
    if (sample.answer3)
      await expect(
        page.locator(".plan-answers > div").nth(2).locator("p"),
      ).toHaveText(`${sample.answer3} See the levers`);
    await expect(
      page.getByText("Results are modeled annual amounts, not predictions."),
    ).toBeVisible();
    if (
      sample.name !== "answers-working-61" &&
      sample.name !== "answers-underfunded"
    )
      await expect(
        page.getByRole("heading", { name: "Do your savings last?" }),
      ).toBeVisible();
    const actual = await probe();
    const requests = actual.requests.slice(before);
    expect(requests.map((request) => request.op)).toEqual([
      "run",
      "sustainable_spending",
      "levers",
    ]);
    let run!: Run;
    for (const request of requests) {
      const expected = native(
        request.op === "sustainable_spending" ? "spend" : request.op,
        sample.name,
      );
      expect(actual.replies[request.id]).toBe(expected);
      if (request.op === "run") run = JSON.parse(expected);
    }
    await expect(page.locator(".plan-status .status")).toHaveText(
      run.status === "partial"
        ? `△ Partial (${run.omissions.length} omissions)`
        : "✓ Supported",
    );
    const details = page.locator(".plan-detail");
    await expect(details.locator(".detail-title")).toHaveText(
      run.years.some((year) => year.ledger.shortfall.cents > 0)
        ? ["Levers", "Why savings run short", "Year by year", "Assumptions"]
        : ["Levers", "Year by year", "Assumptions"],
    );
    for (const detail of await details.all())
      await expect(detail).not.toHaveAttribute("open");
    await expect(
      page.getByRole("button", { name: "Try a change" }),
    ).toBeEnabled();
    await expect(
      page
        .locator(".plan-screen")
        .getByRole("button", { name: "Export", exact: true }),
    ).toBeEnabled();
    if (sample.name === "answers-working-61") {
      await expect(page.locator(".eyebrow")).toHaveText(
        "SINGLE, 61, STILL WORKING, PLANS TO RETIRE AT 66 · RETIRE AT 66",
      );
    }
    const retired =
      sample.name === "synthetic-retired" || sample.name === "A-drawdown";
    if (retired) {
      await expect(page.locator(".eyebrow")).toHaveText(
        `${sample.label.toUpperCase()} · RETIRED`,
      );
      await expect(page.locator("#plan-levers summary .help")).toHaveText(
        "What moves the answer most · 4 changes, ranked",
      );
    }
    await evidence(`plan-${sample.name}-collapsed`);
    await activate(page.locator(".plan-status summary"));
    for (const omission of run.omissions)
      await expect(page.getByText(omission, { exact: true })).toBeVisible();
    await evidence(`plan-${sample.name}-omissions`);
    await activate(page.getByRole("link", { name: "See the levers" }));
    await expect(page.locator("#plan-levers summary")).toBeFocused();
    await expect(
      page
        .getByRole("group", { name: "Levers view" })
        .getByRole("button", { name: "Chart" }),
    ).toHaveAttribute("aria-pressed", "true");
    for (const detail of await details.all())
      if (!(await detail.getAttribute("open"))) {
        // An open attribute has an empty value; use the DOM property.
        if (
          !(await detail.evaluate(
            (element) => (element as HTMLDetailsElement).open,
          ))
        )
          await activate(detail.locator("summary"));
      }
    await expect(
      page
        .getByRole("group", { name: "Year by year view" })
        .getByRole("button", { name: "Chart" }),
    ).toHaveAttribute("aria-pressed", "true");
    if (sample.name === "answers-working-61") {
      const why = details.filter({
        has: page.locator(".detail-title", {
          hasText: "Why savings run short",
        }),
      });
      await expect(why.locator("p")).toHaveText([
        "After retiring, spending of $67,000 a year in today's dollars grows with inflation (2.5%) to $147,652 by 2058 (nominal). That year income brings in $57,298 and savings supply $78,085, leaving $12,269 not covered.",
        "Required distributions from age 75 don't add money; they move it out of the tax-deferred account earlier, and it is taxed.",
        "Rules used: 2026 federal tax law for a single filer, projected after 2026 with tax-threshold indexing · Withdrawal order: cash and taxable accounts first, then tax-deferred, then Roth.",
      ]);
      await expect(page.locator(".lever-row > span")).toHaveText([
        "Investment returns 1 point higher (6%)",
        "Spend 10% less in retirement ($60,300 a year)",
        "Spend 10% more in retirement ($73,700 a year)",
        "Investment returns 1 point lower (4%)",
        "Retire a year later, at 67",
        "Retire a year earlier, at 65",
      ]);
      await expect(page.locator(".lever-row strong")).toHaveText([
        "▲ Better +$6,749",
        "▲ Better +$6,700",
        "▼ Worse −$6,700",
        "▼ Worse −$6,336",
        "▲ Better +$3,622",
        "▼ Worse −$3,556",
      ]);
      await expect(page.locator(".ledger-events")).toHaveText(
        "Retires at 66 · Distributions from 75 · Runs short 2058 (age 93)",
      );
    }
    if (retired) {
      await expect(page.locator(".lever-row")).toHaveCount(4);
      await expect(
        page.locator(".lever-row").filter({ hasText: /Retire a year/ }),
      ).toHaveCount(0);
    }
    await expect(page.locator("#plan-levers .help li")).toHaveCount(0);
    if (sample.name === "answers-underfunded")
      await expect(
        details
          .filter({
            has: page.locator(".detail-title", {
              hasText: "Why savings run short",
            }),
          })
          .locator("p")
          .first(),
      ).toHaveText(
        "In 2026, before retiring, spending is $120,000 (nominal). That year income brings in $30,000 and savings supply $40,000, leaving $53,826 not covered.",
      );
    await evidence(`plan-${sample.name}-all-charts`);
    await activate(page.locator(".savings-table summary"));
    for (const name of ["Levers", "Year by year"])
      await activate(
        page
          .getByRole("group", { name: `${name} view` })
          .getByRole("button", { name: "Table", exact: true }),
      );
    const rows = page.locator(".ledger-table tbody tr");
    for (const row of await page.locator(".savings-table tbody tr").all()) {
      const year = Number(await row.locator("td").nth(1).textContent());
      const expected = run.years.find((entry) => entry.year === year)!;
      await expect(row.locator("td")).toHaveText([
        String(expected.age_on_december_31),
        String(expected.year),
        dollars(expected.ledger.total_closing_today!.cents),
      ]);
    }
    await expect(rows).toHaveCount(run.years.length);
    for (let i = 0; i < run.years.length; i++) {
      const row = run.years[i];
      const l = row.ledger;
      await expect(rows.nth(i).locator("td.amount")).toHaveText(
        [
          l.income_total,
          l.spending,
          l.withdrawals_total,
          l.rmd_total,
          l.federal_tax!.paid,
          l.shortfall,
          l.total_closing!,
        ].map((line) => dollars(line.cents)),
      );
      await expect(rows.nth(i).locator("td").first()).toHaveText(
        String(row.age_on_december_31),
      );
      if (l.shortfall.cents > 0)
        await expect(rows.nth(i)).toHaveClass("shortfall-row");
    }
    if (sample.name === "answers-working-61") {
      await expect(
        page.locator(".savings-table tbody tr td:first-child"),
      ).toHaveText([
        "61",
        "65",
        "66",
        "67",
        "70",
        "75",
        "80",
        "85",
        "90",
        "93",
        "95",
      ]);
      for (const [age, value] of [
        [61, "$800,268"],
        [65, "$934,687"],
        [66, "$905,702"],
        [93, "$886"],
        [95, "$1"],
      ] as const)
        await expect(
          page
            .locator(".savings-table tbody tr")
            .filter({
              has: page.locator("td:first-child", {
                hasText: new RegExp(`^${age}$`),
              }),
            })
            .locator("td")
            .nth(2),
        ).toHaveText(value);
      await expect(
        page.locator("#plan-levers tbody tr td:nth-child(2)"),
      ).toHaveText([
        "lasts to 95",
        "lasts to 95",
        "runs short at 88",
        "runs short at 88",
        "lasts to 95",
        "runs short at 90",
      ]);
      await expect(page.locator("#plan-levers tbody tr td.amount")).toHaveText([
        "+$6,749",
        "+$6,700",
        "−$6,700",
        "−$6,336",
        "+$3,622",
        "−$3,556",
      ]);
      for (const [year, note] of [
        [2031, "Retires"],
        [2032, "Social Security starts"],
        [2040, "Required distributions start"],
        [2058, "Savings run short"],
      ] as const)
        await expect(
          rows
            .filter({
              has: page.getByRole("rowheader", {
                name: String(year),
                exact: true,
              }),
            })
            .locator("td")
            .last(),
        ).toHaveText(note);
    }
    await evidence(`plan-${sample.name}-all-tables`);
    // A keyboard user can focus the ledger container and scroll its wide table.
    const scroll = page
      .locator(".table-scroll")
      .filter({ has: page.locator(".ledger-table") });
    await scroll.focus();
    await page.keyboard.press("ArrowRight");
    if (testInfo.project.use.viewport!.width === 375)
      expect(
        await scroll.evaluate(
          (element) => element.scrollWidth > element.clientWidth,
        ),
      ).toBe(true);
    await activate(page.getByRole("button", { name: "Back to household" }));
    await expect(
      page.getByRole("heading", { name: "Review your answers" }),
    ).toBeFocused();
  }
  // Edit the household, enter via the step bar, and compare all actual replies.
  await page.goto("/");
  await expect(page.getByTestId("intro")).toBeVisible();
  for (let i = 0; i < 6; i++)
    await activate(page.getByRole("button", { name: "Continue", exact: true }));
  await activate(
    page.getByRole("link", { name: "Edit Accounts", exact: true }),
  );
  await page
    .getByRole("group", { name: "Workplace plan Tax-deferred", exact: true })
    .getByRole("textbox", {
      name: "Balance today today's dollars",
      exact: true,
    })
    .fill("600,000");
  await activate(
    page.getByRole("button", { name: "Assumptions", exact: true }),
  );
  await page.getByLabel("Inflation percent per year").fill("3");
  const before = (await probe()).requests.length;
  await activate(planning.getByRole("button", { name: "Plan", exact: true }));
  await expect(page.getByText("$64,654", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See the levers" }),
  ).toBeVisible();
  const edited = await probe();
  expect(edited.requests.slice(before)).toHaveLength(3);
  for (const request of edited.requests.slice(before))
    expect(edited.replies[request.id]).toBe(
      native(
        request.op === "sustainable_spending" ? "spend" : request.op,
        "packages/app/test-data/web-edited-working-61.json",
      ),
    );
  await activate(
    page.locator(".plan-detail summary").filter({ hasText: "Assumptions" }),
  );
  await expect(
    page
      .getByRole("rowheader", { name: "Inflation", exact: true })
      .locator("..")
      .locator("th, td"),
  ).toHaveText(["Inflation", "3%", "Changed by you", "2026"]);
  await evidence("plan-edited-household");
  await activate(page.getByRole("button", { name: "Back to household" }));
  await activate(
    page.getByRole("link", { name: "Edit About you", exact: true }),
  );
  await page.getByLabel("Retirement date", { exact: true }).fill("2025-06-01");
  await page.keyboard.press("Escape");
  await activate(planning.getByRole("button", { name: "Plan", exact: true }));
  await expect(
    page.getByRole("heading", { name: "Invalid", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Wage end date precedes its start date."),
  ).toBeVisible();
  await expect(
    page.locator(".plan-screen svg, .plan-screen table, .plan-answers"),
  ).toHaveCount(0);
  await evidence("plan-engine-error");
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      writes: (window as unknown as { writes: string[] }).writes,
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ writes: [], local: 0, session: 0 });
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(async () =>
      typeof indexedDB.databases === "function"
        ? await indexedDB.databases()
        : [],
    ),
  ).toEqual([]);
});
