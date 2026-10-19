// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
];
import type { Request, Response } from "../src/protocol";
import type { Comparison } from "../src/generated/types/comparison.v2";
import type { Levers } from "../src/generated/types/levers.v1";
const root = new URL("../../../", import.meta.url);
function native(...args: string[]) {
  const result = spawnSync(
    "cargo",
    ["run", "-p", "horizon-cli", "--", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  expect([0, 3], `${args.join(" ")}: ${result.stderr}`).toContain(
    result.status,
  );
  expect(result.stdout.endsWith("\n")).toBe(true);
  return result.stdout.slice(0, -1);
}
// Independent display oracle: cents are exact integers; half away from zero.
const dollars = (cents: number) => {
  const n = BigInt(cents);
  const rounded = ((n < 0n ? -n : n) + 50n) / 100n;
  return `${n < 0n && rounded !== 0n ? "−" : ""}$${rounded.toLocaleString("en-US")}`;
};
const signed = (cents: number) =>
  `${cents > 0 && dollars(cents) !== "$0" ? "+" : ""}${dollars(cents)}`;
const cases = [
  {
    sample: 0,
    id: "retire_later",
    label: "Retire a year later, at 67",
    name: "Retire at 67",
    headline:
      "Retiring at 67: savings last to 95 instead of running short at 93.",
    lines: 550,
    spending: ["$64,994", "$68,616", "▲ Better", "—"],
  },
  {
    sample: 0,
    id: "retire_earlier",
    label: "Retire a year earlier, at 65",
    name: "Retire at 65",
    headline: "Retiring at 65: savings run short at 90 instead of 93.",
    lines: 562,
    spending: ["$64,994", "$61,438", "▼ Worse", "—"],
  },
  {
    sample: 0,
    id: "spend_lower",
    label: "Spend 10% less in retirement ($60,300 a year)",
    name: "Spend $60,300 a year",
    headline:
      "Spending $60,300 a year in retirement: savings last to 95 instead of running short at 93.",
    lines: 618,
    spending: ["$64,994", "$64,994", "Same", "—"],
  },
  {
    sample: 0,
    id: "spend_higher",
    label: "Spend 10% more in retirement ($73,700 a year)",
    name: "Spend $73,700 a year",
  },
  {
    sample: 0,
    id: "return_lower",
    label: "Investment returns 1 point lower (4%)",
    name: "Returns at 4%",
  },
  {
    sample: 0,
    id: "return_higher",
    label: "Investment returns 1 point higher (6%)",
    name: "Returns at 6%",
  },
  {
    sample: 1,
    id: "spend_lower",
    label: "Spend 10% less in retirement ($45,000 a year)",
    name: "Spend $45,000 a year",
    headline:
      "Spending $45,000 a year in retirement: savings still last to 95.",
    lines: 528,
    spending: ["$87,061", "$87,061", "Same", "—"],
  },
  {
    sample: 2,
    id: "spend_higher",
    label: "Spend 10% more in retirement ($66,000 a year)",
    name: "Spend $66,000 a year",
    headline:
      "Spending $66,000 a year in retirement: savings run short at 75 instead of 76.",
    lines: 144,
    spending: ["$43,690", "$43,690", "Same", "—"],
  },
  {
    sample: 3,
    id: "retire_later",
    label: "Retire a year later, at 67",
    name: "Retire at 67",
    headline: "Retiring at 67: savings still run short at 61.",
    lines: 19,
    spending: [
      "none: short even with no retirement spending",
      "none: short even with no retirement spending",
      "Same",
      "—",
    ],
  },
];

test("compare: exact rendered references, worker/native bytes, copy lifecycle, keyboard, accessibility and privacy", async ({
  page,
  context,
  browser,
  browserName,
}, testInfo) => {
  test.setTimeout(600_000);
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
      failOperation?: string;
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
          if (request.op === probe.failOperation) {
            queueMicrotask(() =>
              this.dispatchEvent(
                new MessageEvent("message", {
                  data: {
                    id: request.id,
                    json: '{"status":"unsupported","code":"SYNTHETIC","message":"Synthetic comparison failure"}',
                  },
                }),
              ),
            );
          } else post(request);
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
  async function reach(locator: Locator) {
    await keyboardTo(page, locator, traversal);
    await expect(locator).toBeFocused();
    expect(
      await locator.evaluate(
        (element) => getComputedStyle(element).outlineWidth,
      ),
    ).toBe("3px");
  }
  async function activate(locator: Locator) {
    await reach(locator);
    await page.keyboard.press("Enter");
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
  async function evidence(name: string) {
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const svg of await page.locator(".compare-screen svg").all())
      await expect(svg).toHaveAttribute("aria-hidden", "true");
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
  const planning = page.getByRole("navigation", { name: "Planning steps" });
  async function openPlan(index: number) {
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeVisible();
    // Choose the household through the native radio group using only keys.
    const radio = page.getByRole("radio", {
      name: samples[0].label,
      exact: true,
    });
    await reach(radio);
    for (let i = 0; i < index; i++) await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("radio", { name: samples[index].label, exact: true }),
    ).toBeChecked();
    for (let i = 0; i < 6; i++)
      await activate(
        page.getByRole("button", { name: "Continue", exact: true }),
      );
    await activate(planning.getByRole("button", { name: "Plan", exact: true }));
    await expect(
      page.getByRole("button", { name: "Try a change", exact: true }),
    ).toBeEnabled();
    await expect(page.getByText("Calculating…", { exact: true })).toHaveCount(
      0,
    );
  }
  const temp = mkdtempSync(join(tmpdir(), "horizon-compare-"));
  let previousSample = -1;
  let originalRun = "";
  let offered: Levers;
  const created: string[] = [];
  try {
    for (const item of cases) {
      const sample = samples[item.sample];
      const first = previousSample !== item.sample;
      if (first) {
        await openPlan(item.sample);
        const actual = await probe();
        originalRun =
          actual.replies[
            [...actual.requests]
              .reverse()
              .find((request) => request.op === "run")!.id
          ];
        offered = JSON.parse(
          actual.replies[
            [...actual.requests]
              .reverse()
              .find((request) => request.op === "levers")!.id
          ],
        );
        created.length = 0;
        await activate(
          page.getByRole("button", { name: "Try a change", exact: true }),
        );
      } else
        await activate(
          page.getByRole("button", { name: "+ New copy", exact: true }),
        );
      previousSample = item.sample;
      const panel = page.getByRole("region", {
        name: "Try one change in a copy",
      });
      await expect(panel).toBeVisible();
      await expect(panel.getByRole("radio")).toHaveCount(
        item.sample === 1 || item.sample === 2 ? 4 : 6,
      );
      // Engine offering order, rather than ranked effects; skipped choices absent.
      const ids = offered!.levers.map((lever) => lever.id);
      const names = await panel
        .getByRole("radio")
        .evaluateAll((elements) =>
          elements.map((element) => element.parentElement!.textContent!),
        );
      expect(names).toHaveLength(ids.length);
      if (item.sample === 0)
        expect(
          names.map((name) => name.replace(" (already a copy)", "")),
        ).toEqual([
          "Retire a year earlier, at 65",
          "Retire a year later, at 67",
          "Spend 10% less in retirement ($60,300 a year)",
          "Spend 10% more in retirement ($73,700 a year)",
          "Investment returns 1 point lower (4%)",
          "Investment returns 1 point higher (6%)",
        ]);
      for (const id of created)
        await expect(
          panel.getByRole("radio").nth(ids.indexOf(id)),
        ).toBeDisabled();
      await expect(
        panel.getByText("Your plan stays as it is.", { exact: true }),
      ).toBeVisible();
      await evidence(`copy-panel-${sample.name}-${item.id}`);
      const choice = panel.getByRole("radio", {
        name: item.label,
        exact: true,
      });
      // Arrow keys traverse available radio options and skip disabled copies.
      for (let attempt = 0; attempt < offered!.levers.length; attempt++) {
        if (await choice.isChecked()) break;
        await page.keyboard.press("ArrowDown");
      }
      await expect(choice).toBeChecked();
      const before = (await probe()).requests.length;
      await activate(panel.getByRole("button", { name: "Make the copy" }));
      created.push(item.id);
      const heading = page.locator(".compare-screen h1");
      await expect(heading).toBeFocused();
      await expect(
        page
          .locator(".compare-screen")
          .getByText("Calculating…", { exact: true }),
      ).toHaveCount(0);
      if (item.headline) await expect(heading).toHaveText(item.headline);
      const actual = await probe();
      const calls = actual.requests.slice(before);
      expect(calls.map((call) => call.op)).toEqual([
        "scenario",
        "compare",
        "sustainable_spending",
      ]);
      const copyJson = actual.replies[calls[0].id];
      const file = join(temp, "copy.json");
      writeFileSync(file, copyJson);
      expect(calls[0].args).toEqual([
        calls[1].args[0],
        JSON.stringify(
          offered!.levers.find((lever) => lever.id === item.id)!.changes,
        ),
      ]);
      expect(calls[1].args[1]).toBe(copyJson);
      expect(calls[2].args[0]).toBe(copyJson);
      const comparison: Comparison = JSON.parse(actual.replies[calls[1].id]);
      expect(actual.replies[calls[1].id]).toBe(
        native("compare", sample.name, file),
      );
      expect(actual.replies[calls[2].id]).toBe(native("spend", file));
      expect(JSON.stringify(comparison.baseline)).toBe(originalRun);
      const word =
        item.sample === 0 || item.sample === 3 ? "Partial" : "Supported";
      await expect(page.locator(".status-sentence")).toHaveText(
        `Both results are ${word} and leave out the same things.`,
      );
      await expect(page.locator(".compare-status .status")).toHaveText(
        [comparison.baseline, comparison.scenario].map((run) =>
          run.status === "partial"
            ? `△ Partial (${run.omissions.length} omissions)`
            : "✓ Supported",
        ),
      );
      await expect(page.locator(".eyebrow")).toHaveText(
        `Compare · ${sample.label} · the baseline is protected`,
      );
      const tabs = page.getByRole("group", { name: "Plans", exact: true });
      await expect(tabs.getByRole("button").first()).toHaveText(
        item.sample === 1 || item.sample === 2
          ? "Baseline · retired"
          : "Baseline · retire at 66",
      );
      await expect(
        tabs.getByRole("button", { name: item.name, exact: true }),
      ).toHaveAttribute("aria-current", "page");
      const headlineTable = page.locator(".headline-differences");
      await expect(page.locator(".plan-detail").first()).toHaveAttribute(
        "open",
      );
      await expect(page.locator(".plan-detail").last()).not.toHaveAttribute(
        "open",
      );
      await expect(headlineTable.locator("thead th")).toHaveText([
        "Measure",
        "Baseline",
        item.name,
        "Change",
        "Difference",
      ]);
      if (item.spending)
        await expect(
          headlineTable.locator("tbody tr").nth(1).locator("td"),
        ).toHaveText(item.spending);
      if (item.sample === 0 && item.id === "retire_later") {
        expect(actual.replies[calls[1].id]).toBe(
          native(
            "compare",
            "answers-working-61",
            "answers-working-61-retire-later",
          ),
        );
        expect(actual.replies[calls[2].id]).toBe(
          native("spend", "answers-working-61-retire-later"),
        );
        await expect(tabs.getByRole("button")).toHaveText([
          "Baseline · retire at 66",
          "Retire at 67",
          "+ New copy",
        ]);
        await expect(page.locator(".changed-inputs p")).toHaveText(
          "What changed: wages end 2031-03-10 → 2032-03-10 (follows the retirement date); retirement date 2031-03-10 → 2032-03-10",
        );
        const expected = [
          ["Savings", "run short at 93", "last to 95", "▲ Better", "—"],
          [
            "Spending the plan can carrytoday's dollars a year",
            "$64,994",
            "$68,616",
            "▲ Better",
            "—",
          ],
          [
            "Headroomtoday's dollars a year",
            "−$2,006",
            "$1,616",
            "▲ Better",
            "+$3,622",
          ],
          ["Left at 95today's dollars", "$1", "$75,045", "▲ Better", "—"],
          [
            "Shortfallnominal, summed across years",
            "$197,809",
            "$0",
            "▼ Lower, better",
            "−$197,809",
          ],
          [
            "Federal taxnominal, summed across years",
            "$230,814",
            "$267,784",
            "▲ Higher",
            "+$36,970",
          ],
        ];
        expect(
          await headlineTable
            .locator("tbody tr")
            .evaluateAll((rows) =>
              rows.map((row) =>
                [...row.children].map((cell) => cell.textContent),
              ),
            ),
        ).toEqual(expected);
      }
      if (item.sample === 2)
        await expect(
          headlineTable.locator("tbody tr").nth(3).locator("td"),
        ).toHaveText(["$0", "$0", "Same", "—"]);
      await expect(
        page.getByRole("button", { name: "Export this comparison" }),
      ).toBeDisabled();
      await evidence(`compare-${sample.name}-${item.id}-default`);
      await activate(page.locator(".compare-status summary"));
      await activate(page.locator(".savings-table summary"));
      await activate(page.locator(".plan-detail").last().locator("summary"));
      for (const omission of comparison.baseline.omissions)
        await expect(page.getByText(omission, { exact: true })).toBeVisible();
      const lines = page.locator(".line-differences tbody tr");
      await expect(lines).toHaveCount(
        item.lines ?? comparison.line_differences.length,
      );
      expect(
        await lines.evaluateAll((rows) =>
          rows.map((row) => [...row.children].map((cell) => cell.textContent)),
        ),
      ).toEqual(
        comparison.line_differences.map((line) => [
          String(line.year),
          line.path.slice(1),
          line.baseline ? dollars(line.baseline.cents) : "—",
          line.scenario ? dollars(line.scenario.cents) : "—",
          line.difference ? signed(line.difference.cents) : "—",
        ]),
      );
      const years = comparison.line_differences.map((line) => line.year);
      await expect(
        page.locator(".plan-detail").last().locator(".detail-body > p"),
      ).toHaveText(
        `${years.length} ledger lines differ, in years ${Math.min(...years)} to ${Math.max(...years)}. All are nominal dollars, each with both values and the difference.`,
      );
      if (item.sample === 0 && item.id === "retire_later") {
        expect(
          await lines.evaluateAll((rows) =>
            rows
              .slice(0, 3)
              .map((row) => [...row.children].map((cell) => cell.textContent)),
          ),
        ).toEqual([
          [
            "2031",
            "accounts/brokerage/basis_removed",
            "$23,095",
            "$0",
            "−$23,095",
          ],
          [
            "2031",
            "accounts/brokerage/closing",
            "$247,243",
            "$298,503",
            "+$51,260",
          ],
          [
            "2031",
            "accounts/brokerage/closing_basis",
            "$155,932",
            "$194,285",
            "+$38,353",
          ],
        ]);
        expect(
          await page
            .locator(".savings-table tbody tr")
            .evaluateAll((rows) =>
              rows.map((row) =>
                [...row.children].map((cell) => cell.textContent),
              ),
            ),
        ).toEqual([
          ["61", "2026", "$800,268", "$800,268"],
          ["65", "2030", "$934,687", "$934,687"],
          ["66", "2031", "$905,702", "$970,721"],
          ["67", "2032", "$879,139", "$962,588"],
          ["68", "2033", "$858,556", "$944,038"],
          ["70", "2035", "$815,873", "$905,575"],
          ["75", "2040", "$677,433", "$793,621"],
          ["80", "2045", "$511,739", "$642,806"],
          ["85", "2050", "$324,844", "$472,694"],
          ["90", "2055", "$115,682", "$280,782"],
          ["93", "2058", "$886", "$154,057"],
          ["95", "2060", "$1", "$75,045"],
        ]);
      }
      for (const row of await page.locator(".savings-table tbody tr").all()) {
        const cells = await row.locator("td").allTextContents();
        const year = Number(cells[1]);
        expect(cells.slice(2)).toEqual(
          [comparison.baseline, comparison.scenario].map((run) =>
            dollars(
              run.years.find((entry) => entry.year === year)!.ledger
                .total_closing_today!.cents,
            ),
          ),
        );
      }
      await evidence(`compare-${sample.name}-${item.id}-all-open`);
      const scroll = page.getByRole("region", {
        name: "Every line that differs table, scroll horizontally",
      });
      await reach(scroll);
      await page.keyboard.press("ArrowRight");
      if (testInfo.project.use.viewport!.width === 375)
        expect(
          await scroll.evaluate(
            (element) => element.scrollWidth > element.clientWidth,
          ),
        ).toBe(true);
      if (item.id === "return_higher") {
        await expect(tabs.getByRole("button").last()).toHaveText(
          "+ New copy (no more changes to try)",
        );
        await expect(tabs.getByRole("button").last()).toBeDisabled();
        await activate(
          tabs.getByRole("button", { name: "Retire at 67", exact: true }),
        );
        await expect(page.locator(".compare-screen h1")).toHaveText(
          cases[0].headline!,
        );
        await activate(tabs.getByRole("button").first());
        await expect(
          page.getByRole("button", { name: "Try a change" }),
        ).toBeEnabled();
        const after = await probe();
        expect(
          after.replies[
            [...after.requests]
              .reverse()
              .find((request) => request.op === "run")!.id
          ],
        ).toBe(originalRun);
        await activate(
          planning.getByRole("button", { name: "Compare", exact: true }),
        );
        await expect(page.locator(".compare-screen h1")).toHaveText(
          cases[0].headline!,
        );
        await activate(page.getByRole("button", { name: "Back to plan" }));
        await activate(page.getByRole("button", { name: "Try a change" }));
        await expect(panel.getByRole("radio", { checked: false })).toHaveCount(
          6,
        );
        await expect(
          panel.getByRole("button", { name: "Make the copy" }),
        ).toBeDisabled();
        await activate(panel.getByRole("button", { name: "Cancel" }));
        await expect(
          page.getByRole("button", { name: "Try a change" }),
        ).toBeFocused();
        await activate(page.getByRole("button", { name: "Back to household" }));
        await activate(
          page.getByRole("link", { name: "Edit Accounts", exact: true }),
        );
        await page
          .getByRole("group", {
            name: "Workplace plan Tax-deferred",
            exact: true,
          })
          .getByRole("textbox", {
            name: "Balance today today's dollars",
            exact: true,
          })
          .fill("600,000");
        await expect(
          planning.getByRole("button", { name: "Compare", exact: true }),
        ).toHaveCount(0);
        await activate(
          planning.getByRole("button", { name: "Plan", exact: true }),
        );
        await expect(
          page.getByText(
            "Your copies were removed because the household changed.",
            { exact: true },
          ),
        ).toBeVisible();
        await expect(
          page.getByText("Calculating…", { exact: true }),
        ).toHaveCount(0);
        await evidence("plan-copies-removed");
      }
    }
    // Synthetic error envelope from the actual worker boundary after a valid copy.
    await activate(
      page.getByRole("button", { name: "+ New copy", exact: true }),
    );
    await page.evaluate(() => {
      (window as unknown as { failOperation: string }).failOperation =
        "compare";
    });
    await activate(page.getByRole("button", { name: "Make the copy" }));
    await expect(
      page.getByRole("heading", { name: "Unsupported", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic comparison failure", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".compare-screen svg, .compare-screen table"),
    ).toHaveCount(0);
    await evidence("compare-error");
    await activate(page.getByRole("button", { name: "Back to plan" }));
    await expect(
      page.getByRole("button", { name: "Try a change" }),
    ).toBeEnabled();
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
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
