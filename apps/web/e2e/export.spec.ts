// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { test } from "./fixtures";
import { storageTrap } from "./privacy";
import { keyboardTo } from "./keyboard";
import type { Request, Response } from "../src/protocol";
const root = new URL("../../../", import.meta.url);
function native(...args: string[]) {
  const result = spawnSync(
    "cargo",
    ["run", "-p", "horizon-cli", "--", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  expect([0, 3], result.stderr).toContain(result.status);
  expect(result.stdout.endsWith("\n")).toBe(true);
  return result.stdout.slice(0, -1);
}
const cases = [
  [
    "answers-working-61",
    "Single, 61, still working, plans to retire at 66",
    "Retiring at 66, savings run short at 93; spending $64,994 a year in today's dollars would make them last to 95.",
    "Leaves out 5 things",
    "0.65 MB (645,501 bytes)",
  ],
  [
    "synthetic-retired",
    "Single, 70, retired",
    "Savings last to 95; you could spend up to $87,061 a year in today's dollars.",
    "Covers your situation",
    "0.47 MB (473,538 bytes)",
  ],
  [
    "A-drawdown",
    "Single, 73, retired, small savings",
    "Savings run short at 76; spending $43,690 a year in today's dollars would make them last to 78.",
    "Covers your situation",
    "0.11 MB (112,373 bytes)",
  ],
  [
    "answers-underfunded",
    "Single, 61, spending more than income",
    "Savings run short at 61, even with no retirement spending.",
    "Leaves out 5 things",
    "0.64 MB (641,635 bytes)",
  ],
];
test("export: keyboard download/import, exact references, rough entries, copies, print, accessibility and privacy", async ({
  page,
  context,
  browser,
  browserName,
}, info) => {
  test.setTimeout(600_000);
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const offOrigin: string[] = [],
    errors: string[] = [];
  context.on("request", (request) => {
    if (
      !request.url().startsWith("blob:") &&
      new URL(request.url()).origin !== "http://127.0.0.1:4173"
    )
      offOrigin.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await storageTrap(page);
  await page.addInitScript(() => {
    const probe = window as unknown as {
      requests: Request[];
      replies: Record<number, string>;
      writes: string[];
      prints: number;
    };
    probe.requests = [];
    probe.replies = {};
    probe.writes = [];
    probe.prints = 0;
    window.print = () => {
      probe.prints++;
    };
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
    await keyboardTo(page, locator, traversal);
    await expect(locator).toBeFocused();
    expect(
      await locator.evaluate(
        (element) => getComputedStyle(element).outlineWidth,
      ),
    ).toBe("3px");
    await page.keyboard.press("Enter");
  }
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
  async function probe() {
    return page.evaluate(() => {
      const p = window as unknown as {
        requests: Request[];
        replies: Record<number, string>;
      };
      return { requests: p.requests, replies: p.replies };
    });
  }
  const planning = page.getByRole("navigation", { name: "Planning steps" });
  async function setup(index = 0) {
    await page.goto("/");
    await expect(
      page.getByRole("button", {
        name: "Try an example household",
        exact: true,
      }),
    ).toBeVisible();
    await activate(
      page.getByRole("button", {
        name: "Try an example household",
        exact: true,
      }),
    );
    await keyboardTo(
      page,
      page.getByRole("radio", { name: cases[0][1], exact: true }),
      traversal,
    );
    for (let n = 0; n < index; n++) await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("radio", { name: cases[index][1], exact: true }),
    ).toBeChecked();
    await activate(
      page.getByRole("button", { name: "Open example plan", exact: true }),
    );
    await expect(
      page.getByRole("button", { name: "Try a change" }),
    ).toBeEnabled();
  }
  async function exportFromPlan() {
    await activate(
      page
        .locator(".plan-screen")
        .getByRole("button", { name: "Export", exact: true }),
    );
    await expect(
      page.getByRole("link", { name: "Download plan file" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Print or save as PDF" }),
    ).toBeEnabled();
  }
  async function download() {
    const event = page.waitForEvent("download");
    await activate(page.getByRole("link", { name: "Download plan file" }));
    const file = await event;
    const path = await file.path();
    expect(path).toBeTruthy();
    return {
      name: file.suggestedFilename(),
      text: readFileSync(path!, "utf8"),
    };
  }
  async function open(text: string) {
    const event = page.waitForEvent("filechooser");
    await activate(
      page.getByRole("button", { name: "Open a plan file", exact: true }),
    );
    await (
      await event
    ).setFiles({
      name: "synthetic-plan.json",
      mimeType: "application/json",
      buffer: Buffer.from(text),
    });
  }
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Try an example household", exact: true }),
  ).toBeVisible();
  await activate(
    page.getByRole("button", { name: "Try an example household", exact: true }),
  );
  await page
    .getByRole("button", { name: "Horizon welcome", exact: true })
    .click();
  await activate(
    page.getByRole("button", { name: "Open a plan file", exact: true }),
  );
  await expect(
    page.getByText("Set up a household first to share or keep a plan."),
  ).toBeVisible();
  await expect(page.locator(".export-actions, .plan-detail")).toHaveCount(0);
  await capture("export-no-household");
  await open("not JSON");
  await expect(
    page.getByText(
      "This file did not pass the check of the file format, so Horizon did not open it.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("The file is not valid JSON.")).toBeVisible();
  await expect(page.locator('[role="alert"] [role="alert"]')).toHaveCount(0);
  expect((await probe()).requests.some((r) => r.op === "import_run")).toBe(
    false,
  );
  await capture("export-non-json");
  let original = "";
  for (let index = 0; index < cases.length; index++) {
    const [name, label, story, status, size] = cases[index];
    await setup(index);
    const before = await probe();
    await exportFromPlan();
    const after = await probe();
    expect(
      after.requests.filter((r) =>
        ["run", "levers", "sustainable_spending"].includes(r.op),
      ).length,
    ).toBe(
      before.requests.filter((r) =>
        ["run", "levers", "sustainable_spending"].includes(r.op),
      ).length,
    );
    await expect(page.locator(".eyebrow")).toHaveText(
      `EXPORT · ${label.toUpperCase()} · VALUES AS OF 2026-01-01`,
    );
    await expect(page.locator("h1")).toHaveText("Take your plan with you");
    await expect(
      page.getByRole("link", { name: "Download plan file" }),
    ).toHaveCSS(
      "background-color",
      await page
        .getByRole("button", { name: "Print or save as PDF" })
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    );
    await expect(page.locator(".export-story")).toHaveText(story);
    await expect(page.locator(".export-screen .status")).toHaveText(
      new RegExp(status.replace(/[()]/g, "\\$&")),
    );
    const details = page.locator(".export-screen > .plan-detail");
    await expect(details).toHaveCount(3);
    for (const detail of await details.all())
      await expect(detail).not.toHaveAttribute("open");
    await capture(`export-${name}-collapsed`);
    for (const detail of await details.all())
      await activate(detail.locator("summary"));
    await expect(page.locator(".file-details")).toContainText(size);
    const nativeText = native("export", name);
    const exported = await download();
    expect(exported.text).toBe(nativeText);
    const payload = JSON.parse(nativeText);
    expect(exported.name).toBe(
      `horizon-plan-${payload.hashes.export_content_hash.slice(0, 12)}.json`,
    );
    expect(
      after.replies[
        after.requests
          .slice()
          .reverse()
          .find((r) => r.op === "export_run")!.id
      ],
    ).toBe(nativeText);
    await expect(page.locator(".file-details dd")).toHaveText([
      "Horizon plan file, format 1 (JSON)",
      "horizon-engine-0.4.0",
      "us-single-federal-tax-v3, 2026",
      size,
      `${payload.hashes.export_content_hash}SHA-256`,
    ]);
    if (!index) {
      original = nativeText;
      const summary = page.locator(".plan-detail .plan-summary");
      await expect(summary.locator(":scope > .help").first()).toHaveText(
        "Example household · Single, 61, still working, plans to retire at 66 · values as of 2026-01-01 · horizon-engine-0.4.0",
      );
      for (const text of [
        "Not at $67,000 a year: savings run short at age 93 (2058).",
        "$64,994 a year in today's dollars lasts to 95: $2,006 less than you plan to spend.",
        "Investment returns, then spending, then the retirement date.",
        "Leaves out 5 things. What this result does not include: state tax not modeled; alternative minimum tax not modeled; taxable-account dividends and interest not modeled; itemized deductions and credits not modeled; contributions not modeled.",
        "No entries are marked rough.",
      ])
        await expect(summary.getByText(text, { exact: true })).toBeVisible();
      expect(payload.hashes.export_content_hash).toBe(
        "8cb745ed60a6ef924b261ed7cf7d43a65740d52fbc74caf0305bb9acb1843128",
      );
    }
    if (index === 3) {
      const summary = page.locator(".plan-detail .plan-summary");
      await expect(summary.locator(":scope > p").nth(1)).toHaveText(
        "No: savings run short at age 61 (2026), before you retire.",
      );
      await expect(summary.locator(":scope > p").nth(2)).toHaveText(
        "Savings run short even with no retirement spending.",
      );
    }
    await capture(`export-${name}-expanded`);
  }
  // Edit both outside-plan cases through setup; assert the shared answers on both screens.
  for (const index of [0, 3]) {
    await setup(index);
    const horizonInput = JSON.parse(
      readFileSync(
        new URL(`packages/app/fixtures/${cases[index][0]}.json`, root),
        "utf8",
      ),
    );
    horizonInput.household.persons[0].plan_end_age = 65;
    const horizonPath = info.outputPath(`short-horizon-${index}.json`);
    writeFileSync(horizonPath, JSON.stringify(horizonInput));
    await exportFromPlan();
    await open(native("export", horizonPath));
    await expect(page.locator(".plan-answers h2").first()).toHaveText(
      "Do your savings last?",
    );
    const answers = [
      index === 0
        ? "Retirement falls after the plan ends: savings last to 65."
        : "Retirement falls after the plan ends: savings run short at age 61 (2026).",
      "Retirement falls after the plan ends, so the plan has no retirement spending to test.",
    ];
    await expect(page.locator(".plan-answers > div > p").nth(0)).toHaveText(
      answers[0],
    );
    await expect(page.locator(".plan-answers > div > p").nth(1)).toHaveText(
      answers[1],
    );
    await capture(`plan-retirement-after-plan-${cases[index][0]}`);
    await exportFromPlan();
    await expect(page.locator(".export-story")).toHaveText(
      index === 0
        ? "Savings last to 65; retirement falls after the plan ends."
        : "Savings run short at 61; retirement falls after the plan ends.",
    );
    await expect(page.locator(".export-screen .status")).toHaveText(
      "△ Leaves out 5 things",
    );
    await activate(page.locator(".plan-detail").first().locator("summary"));
    const summary = page.locator(".plan-detail .plan-summary");
    await expect(summary.locator(":scope > p").nth(1)).toHaveText(answers[0]);
    await expect(summary.locator(":scope > p").nth(2)).toHaveText(answers[1]);
    if (index === 0) {
      await activate(page.locator(".plan-detail").nth(1).locator("summary"));
      await expect(page.locator(".file-details")).toContainText(
        "0.10 MB (95,758 bytes)",
      );
    }
    await capture(`export-retirement-after-plan-${cases[index][0]}`);
  }
  // All six copies and the three reference marks are included only in the summary.
  await setup(0);
  const changes = [
    "Retire a year later, at 67",
    "Retire a year earlier, at 65",
    "Spend 10% less in retirement ($60,300 a year)",
    "Spend 10% more in retirement ($73,700 a year)",
    "Investment returns 1 point lower (4%)",
    "Investment returns 1 point higher (6%)",
  ];
  for (let i = 0; i < changes.length; i++) {
    await activate(
      i
        ? page.getByRole("button", { name: "+ New copy", exact: true })
        : page.getByRole("button", { name: "Try a change" }),
    );
    const target = page.getByRole("radio", { name: changes[i], exact: true });
    await keyboardTo(
      page,
      page.getByRole("radio", { checked: true }),
      traversal,
    );
    for (let n = 0; n < 6 && !(await target.isChecked()); n++)
      await page.keyboard.press("ArrowDown");
    await expect(target).toBeChecked();
    await activate(page.getByRole("button", { name: "Make the copy" }));
    await expect(page.getByText("Calculating…", { exact: true })).toHaveCount(
      0,
    );
  }
  await activate(page.getByRole("button", { name: "Export this comparison" }));
  await expect(
    page.getByRole("button", { name: "Print or save as PDF" }),
  ).toBeEnabled();
  await activate(page.locator(".plan-detail").first().locator("summary"));
  const summary = page.locator(".plan-detail .plan-summary");
  await expect(summary.locator(".summary-rough li")).toHaveCount(0);

  await expect(
    summary.getByText(
      "Retiring at 67: savings last to 95 instead of running short at 93.",
      { exact: true },
    ),
  ).toBeVisible();
  const copyLines = [
    "Retiring at 67: savings last to 95 instead of running short at 93.",
    "Retiring at 65: savings run short at 90 instead of 93.",
    "Spending $60,300 a year in retirement: savings last to 95 instead of running short at 93.",
    "Spending $73,700 a year in retirement: savings run short at 88 instead of 93.",
    "With returns at 4%: savings run short at 88 instead of 93.",
    "With returns at 6%: savings last to 95 instead of running short at 93.",
  ];
  await expect(summary.locator(":scope > div > p")).toHaveText(copyLines);
  await expect(
    summary.locator(".rough-label > [aria-hidden='true']"),
  ).toHaveCount(0);
  expect((await download()).text).toBe(original);
  await capture("export-six-copies");
  await activate(page.getByRole("button", { name: "Print or save as PDF" }));
  expect(
    await page.evaluate(() => (window as unknown as { prints: number }).prints),
  ).toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Horizon plan summary",
  );
  await expect(page.locator("header")).toBeHidden();
  await expect(page.locator("footer")).toBeHidden();
  await expect(page.getByRole("button")).toHaveCount(0);
  await expect(page.locator(".print-summary")).toHaveCSS(
    "color",
    "rgb(27, 36, 51)",
  );
  expect(
    await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(
        [
          "canvas",
          "surface",
          "sunken",
          "ink",
          "muted",
          "line",
          "accent",
          "accent-text",
          "on-accent",
          "supported-text",
          "supported-bg",
          "partial-text",
          "partial-bg",
          "unsupported-text",
          "unsupported-bg",
          "estimate-text",
          "estimate-bg",
          "series-baseline",
          "series-scenario",
        ].map((token) => [
          token,
          style
            .getPropertyValue(`--color-${token}`)
            .trim()
            .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3"),
        ]),
      );
    }),
  ).toEqual({
    canvas: "#f4f6f9",
    surface: "#ffffff",
    sunken: "#eef1f5",
    ink: "#1b2433",
    muted: "#525d6c",
    line: "#d9dfe7",
    accent: "#306ce2",
    "accent-text": "#1853c6",
    "on-accent": "#f8fafd",
    "supported-text": "#1c6a49",
    "supported-bg": "#e2f2e9",
    "partial-text": "#8a5600",
    "partial-bg": "#fbeed2",
    "unsupported-text": "#a3302a",
    "unsupported-bg": "#fbe3e0",
    "estimate-text": "#5a3ea8",
    "estimate-bg": "#ece6fb",
    "series-baseline": "#7b8798",
    "series-scenario": "#306ce2",
  });
  if (browserName === "chromium") {
    const path = info.outputPath("summary-letter.pdf");
    const pdf = await page.pdf({
      path,
      preferCSSPageSize: true,
      printBackground: true,
    });
    expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
    await info.attach("summary-letter", {
      path,
      contentType: "application/pdf",
    });
  }
  await capture("export-print-summary");
  await page.emulateMedia({ media: "screen" });
  // Import errors keep the current input and export screen intact.
  for (const [file, check] of [
    ["tampered-export.json", "the fingerprint"],
    ["unknown-format-export.json", "the file format"],
    ["model-0.3.0.export.json", "the engine version"],
  ]) {
    const text = readFileSync(
      new URL(`packages/app/test-data/${file}`, root),
      "utf8",
    );
    await open(text);
    await expect(
      page.getByText(
        `This file did not pass the check of ${check}, so Horizon did not open it.`,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Take your plan with you" }),
    ).toBeVisible();
    expect((await download()).text).toBe(original);
    await capture(`export-rejected-${file}`);
  }
  await open("not JSON");
  await expect(
    page.getByText(
      "This file did not pass the check of the file format, so Horizon did not open it.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("The file is not valid JSON.")).toBeVisible();
  await expect(page.locator('[role="alert"] [role="alert"]')).toHaveCount(0);
  expect((await download()).text).toBe(original);
  await expect(summary.locator(":scope > div > p")).toHaveText(copyLines);
  await expect(summary.locator(".summary-rough li")).toHaveCount(0);
  await capture("export-rejected-non-json-with-household");
  await open(original);
  await expect(
    page.getByRole("heading", {
      name: "Savings run short at 93, two years before the plan ends.",
    }),
  ).toBeVisible();
  await expect(page.locator(".eyebrow")).toHaveText(
    "OPENED PLAN FILE · RETIRE AT 66",
  );
  const imported = await probe();
  const request = imported.requests
    .slice()
    .reverse()
    .find((r) => r.op === "import_run")!;
  const path = info.outputPath("round-trip.json");
  writeFileSync(path, original);
  expect(imported.replies[request.id]).toBe(native("import", path));
  await capture("export-reopened-plan");
  await exportFromPlan();
  await activate(page.locator(".plan-detail").first().locator("summary"));
  await expect(
    page.locator(".plan-detail .plan-summary > .help").first(),
  ).toHaveText(
    "Opened plan file · values as of 2026-01-01 · horizon-engine-0.4.0",
  );
  await expect(page.locator(".plan-detail .plan-summary")).toContainText(
    "No entries are marked rough.",
  );
  await expect(page.locator(".plan-detail .plan-summary")).not.toContainText(
    "Retiring at 67:",
  );
  expect((await download()).text).toBe(original);
  await capture("export-reopened-file");
  await activate(planning.getByRole("button", { name: "Plan", exact: true }));
  await activate(page.getByRole("button", { name: "Try a change" }));
  await expect(
    page.getByRole("radio", { name: changes[0], exact: true }),
  ).toBeEnabled();
  await activate(page.getByRole("button", { name: "Cancel", exact: true }));
  await activate(page.getByRole("button", { name: "Back to household" }));
  await expect(
    page.getByRole("heading", {
      name: "See whether your savings can carry your retirement",
      exact: true,
    }),
  ).toBeVisible();
  await capture("export-reopened-setup");
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { writes: string[] }).writes,
    ),
  ).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: await indexedDB.databases(),
      caches: await caches.keys(),
      registrations: (await navigator.serviceWorker.getRegistrations()).length,
    })),
  ).toEqual({
    local: 0,
    session: 0,
    databases: [],
    caches: [],
    registrations: 0,
  });
});
