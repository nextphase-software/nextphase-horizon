// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Comparison } from "./generated/types/comparison.v2";
import { Compare } from "./Compare";
import {
  amountChange,
  compareHeadline,
  signedCents,
  spendingValue,
} from "./compare-display";
import {
  calculateCopy,
  copyLabels,
  type Baseline,
  type Copies,
  type PlanCopy,
} from "./plan-copies";
import { samples } from "./fixtures";
import spendingJson from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
import leversJson from "../../../packages/parity/golden/answers-working-61.levers.json?raw";
import runJson from "../../../packages/parity/golden/answers-working-61.run.json?raw";
import laterJson from "../../../packages/parity/golden/answers-working-61-retire-later.run.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
const baseline: Baseline = {
  run: JSON.parse(runJson),
  spending: JSON.parse(spendingJson),
  levers: JSON.parse(leversJson),
};
const lever = baseline.levers.levers.find(
  (lever) => lever.id === "retire_later",
)!;
const fresh = (): PlanCopy => ({ lever, ...copyLabels(lever, baseline.run) });
const error = {
  status: "unsupported" as const,
  code: "SYNTHETIC",
  message: "Synthetic comparison failure",
};
const store = (): Copies => ({
  input: samples[0].json,
  baseline,
  items: [fresh()],
});
const show = (copy: PlanCopy) =>
  render(
    <Compare
      sample={samples[0]}
      copies={store()}
      copy={copy}
      select={vi.fn()}
      newCopy={vi.fn()}
      back={vi.fn()}
    />,
  );
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("compares whole displayed dollars, including negative zero and half-away rounding", () => {
  for (const [before, after, expected] of [
    [1, 49, "Same"],
    [-49, 49, "Same"],
    [-50, 49, "▲ Better"],
    [49, 50, "▲ Better"],
    [149, 50, "Same"],
    [150, 149, "▼ Worse"],
  ] as const)
    expect(amountChange(before, after, true)).toBe(expected);
  expect(amountChange(49, 1, true, "shortfall")).toBe("Same");
  expect(amountChange(50, 1, true, "shortfall")).toBe("▼ Lower, better");
  expect(amountChange(0, 50, true, "tax")).toBe("▲ Higher");
  expect(signedCents(-49)).toBe("$0");
  expect(signedCents(-50)).toBe("−$1");
  expect(signedCents(50)).toBe("+$1");
});
it("covers all five factual headline branches with engine ages", () => {
  const short = baseline.run;
  const lasts = JSON.parse(laterJson);
  expect(compareHeadline("Change", short, lasts)).toBe(
    "Change: savings last to 95 instead of running short at 93.",
  );
  expect(compareHeadline("Change", lasts, short)).toBe(
    "Change: savings run short at 93 instead of lasting to 95.",
  );
  expect(compareHeadline("Change", lasts, lasts)).toBe(
    "Change: savings still last to 95.",
  );
  expect(compareHeadline("Change", short, short)).toBe(
    "Change: savings still run short at 93.",
  );
  const earlier = structuredClone(short);
  earlier.years.find(
    (row) => row.age_on_december_31 === 90,
  )!.ledger.shortfall.cents = 1;
  expect(compareHeadline("Change", short, earlier)).toBe(
    "Change: savings run short at 90 instead of 93.",
  );
});
it("uses engine flags for both sustainable-spending edge cases", () => {
  expect(spendingValue({ ...baseline.spending, flag: "at_or_above_cap" })).toBe(
    "at least $10,000,000",
  );
  expect(
    spendingValue({
      ...baseline.spending,
      flag: "shortfall_with_no_retirement_spending",
    }),
  ).toBe("none: short even with no retirement spending");
});
it("loads sections without stale figures and focuses the headline", () => {
  const view = show(fresh());
  expect(screen.getByRole("heading", { level: 1 })).toBe(
    document.activeElement,
  );
  expect(screen.getAllByText("Calculating…").length).toBeGreaterThan(3);
  expect(view.container.querySelector("svg, table")).toBeNull();
});
it.each(["scenario", "compare", "sustainable_spending"] as const)(
  "suppresses figures on %s error even after other calls succeed",
  async (operation) => {
    let copies: Copies | null = store();
    vi.mocked(engine.call).mockImplementation(async (...[op]) =>
      op === operation
        ? JSON.stringify(error)
        : op === "scenario"
          ? samples[0].json
          : op === "compare"
            ? '{"status":"partial"}'
            : spendingJson,
    );
    await calculateCopy(copies.input, baseline, copies.items[0], (change) => {
      copies = typeof change === "function" ? change(copies) : change;
    });
    expect(copies!.items[0].error).toEqual(error);
    const view = show(copies!.items[0]);
    expect(screen.getByRole("heading", { name: "Unsupported" })).toBeTruthy();
    expect(screen.getByText(error.message)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to plan" })).toBeTruthy();
    expect(view.container.querySelector("svg, table, .copy-tabs")).toBeNull();
    expect(vi.mocked(engine.call).mock.calls.map(([op]) => op)).toEqual(
      operation === "scenario"
        ? ["scenario"]
        : ["scenario", "compare", "sustainable_spending"],
    );
  },
);
it("does not restore removed copies when an obsolete request finishes", async () => {
  let resolve!: (value: string) => void;
  vi.mocked(engine.call).mockImplementation((...[op]) =>
    op === "scenario"
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve(
          op === "compare" ? '{"status":"partial"}' : spendingJson,
        ),
  );
  let copies: Copies | null = store();
  const pending = calculateCopy(
    copies.input,
    baseline,
    copies.items[0],
    (change) => {
      copies = typeof change === "function" ? change(copies) : change;
    },
  );
  copies = null;
  resolve(samples[0].json);
  await pending;
  expect(copies).toBeNull();
});
it("shows a transport failure with no figures", async () => {
  vi.mocked(engine.call).mockRejectedValue(new Error("Worker unavailable"));
  let copies: Copies | null = store();
  await calculateCopy(copies.input, baseline, copies.items[0], (change) => {
    copies = typeof change === "function" ? change(copies) : change;
  });
  const view = show(copies!.items[0]);
  expect(screen.getByText("Worker unavailable")).toBeTruthy();
  expect(view.container.querySelector("svg, table")).toBeNull();
});
it("keeps unequal omissions separate and renders null ledger sides as dashes", () => {
  const comparison = {
    baseline: baseline.run,
    scenario: {
      ...JSON.parse(laterJson),
      status: "complete",
      omissions: ["Synthetic omission"],
    },
    summary: {},
    changed_inputs: [],
    line_differences: [
      {
        year: 2031,
        path: "/synthetic/line",
        baseline: null,
        scenario: { cents: 50 },
        difference: null,
      },
    ],
  } as unknown as Comparison;
  const view = show({ ...fresh(), comparison });
  expect(
    screen.getByText("The baseline is Partial; the copy is Supported."),
  ).toBeTruthy();
  expect(
    view.container.querySelector(".compare-status details")!.textContent,
  ).toContain("Baseline");
  expect(screen.getByText("Synthetic omission")).toBeTruthy();
  expect(
    [...view.container.querySelectorAll(".line-differences tbody tr > *")].map(
      (cell) => cell.textContent,
    ),
  ).toEqual(["2031", "synthetic/line", "—", "$1", "—"]);
});
