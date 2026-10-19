// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Plan } from "./Plan";
import { App } from "./App";
import { createDraft, changeEntry, serializeDraft } from "./setup";
import { centsDollars, planHeadline } from "./plan-display";
import { samples } from "./fixtures";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
const goldens = import.meta.glob<string>(
  "../../../packages/parity/golden/{answers-working-61,synthetic-retired}.{run,spend,levers}.json",
  { query: "?raw", import: "default", eager: true },
);
const read = (name: string, op: string) =>
  goldens[`../../../packages/parity/golden/${name}.${op}.json`];
const run = JSON.parse(read(samples[0].name, "run"));
const draft = () => createDraft(samples[0].json);
const back = vi.fn();
function stub(name = samples[0].name) {
  vi.mocked(engine.call).mockImplementation(async (...args) =>
    read(
      args[0] === "levers" ? samples[0].name : name,
      args[0] === "sustainable_spending" ? "spend" : args[0],
    ),
  );
}
function show(value = draft()) {
  return render(<Plan sample={samples[0]} draft={value} back={back} />);
}
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("formats cents exactly, including signed halfway boundaries", () => {
  for (const [cents, expected] of [
    [49, "$0"],
    [50, "$1"],
    [149, "$1"],
    [150, "$2"],
    [-49, "$0"],
    [-50, "−$1"],
    [-150, "−$2"],
    [80026805, "$800,268"],
  ] as const)
    expect(centsDollars(cents)).toBe(expected);
});
it("uses engine ages for headlines, including one year, the last year and no shortfall", () => {
  expect(planHeadline(run)).toBe(
    "Savings run short at 93, two years before the plan ends.",
  );
  const changed = structuredClone(run);
  changed.years = changed.years.slice(0, -1);
  expect(planHeadline(changed)).toBe(
    "Savings run short at 93, one year before the plan ends.",
  );
  changed.years.pop();
  expect(planHeadline(changed)).toBe(
    "Savings run short at 93, in the plan's last year.",
  );
  changed.years.pop();
  expect(planHeadline(changed)).toBe("Savings last to 92.");
});
it("loads each section independently and sends the exact edited input to all three operations", async () => {
  const pending: Record<string, (json: string) => void> = {};
  vi.mocked(engine.call).mockImplementation(
    (...args) =>
      new Promise((resolve) => {
        pending[args[0]] = resolve;
      }),
  );
  const edited = changeEntry(draft(), "/assumptions/inflation/value", "3");
  show(edited);
  expect(screen.getAllByText("Calculating…").length).toBeGreaterThan(3);
  expect(engine.call).toHaveBeenCalledTimes(3);
  for (const [op, input] of vi.mocked(engine.call).mock.calls) {
    expect(["run", "sustainable_spending", "levers"]).toContain(op);
    expect(input).toBe(serializeDraft(edited));
  }
  await act(async () => pending.run(JSON.stringify(run)));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Savings run short at 93",
  );
  expect(screen.queryByText("$64,994")).toBeNull();
  await act(async () =>
    pending.sustainable_spending(read(samples[0].name, "spend")),
  );
  expect(screen.getByText("$64,994")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "See the levers" })).toBeNull();
  await act(async () => pending.levers(read(samples[0].name, "levers")));
  expect(screen.getByRole("link", { name: "See the levers" })).toBeTruthy();
});
it.each(["run", "sustainable_spending", "levers"])(
  "removes all figures on an error from %s, including late success replies",
  async (operation) => {
    vi.mocked(engine.call).mockImplementation(async (...args) =>
      args[0] === operation
        ? '{"status":"unsupported","code":"SYNTHETIC","message":"Synthetic failure"}'
        : read(
            samples[0].name,
            args[0] === "sustainable_spending" ? "spend" : args[0],
          ),
    );
    const view = show();
    await screen.findByText("Synthetic failure");
    expect(screen.getByRole("heading", { name: "Unsupported" })).toBeTruthy();
    expect(
      view.container.querySelector("svg, table, .plan-answers"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to household" }));
    expect(back).toHaveBeenCalledOnce();
  },
);
it("clears old figures and ignores obsolete requests when input changes", async () => {
  stub();
  const view = show();
  await screen.findByText("$64,994");
  const pending: ((json: string) => void)[] = [];
  vi.mocked(engine.call).mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  view.rerender(
    <Plan
      sample={samples[0]}
      draft={changeEntry(draft(), "/assumptions/inflation/value", "3")}
      back={back}
    />,
  );
  expect(screen.queryByText("$64,994")).toBeNull();
  stub("synthetic-retired");
  view.rerender(
    <Plan
      sample={samples[1]}
      draft={createDraft(samples[1].json)}
      back={back}
    />,
  );
  await screen.findByText("$87,061");
  await act(async () => {
    for (const resolve of pending)
      resolve('{"status":"invalid","code":"OLD","message":"Obsolete failure"}');
  });
  expect(screen.queryByText("Obsolete failure")).toBeNull();
  expect(screen.getByText("$87,061")).toBeTruthy();
});
it("reports transport failure and suppresses figures", async () => {
  vi.mocked(engine.call).mockRejectedValue(new Error("Worker unavailable"));
  const view = show();
  await screen.findByText("Worker unavailable");
  expect(
    screen.getByRole("heading", { name: "Calculation unavailable" }),
  ).toBeTruthy();
  expect(view.container.querySelector("svg, table")).toBeNull();
});
it("opens and focuses Levers, switches to its table and preserves engine ranking and savings outcomes", async () => {
  stub();
  const view = show();
  fireEvent.click(await screen.findByRole("link", { name: "See the levers" }));
  const detail = view.container.querySelector("#plan-levers details")!;
  expect(detail.hasAttribute("open")).toBe(true);
  expect(document.activeElement).toBe(detail.querySelector("summary"));
  const group = within(detail as HTMLElement);
  expect(
    group.getByRole("button", { name: "Chart" }).getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(group.getByRole("button", { name: "Table" }));
  const rows = detail.querySelectorAll("tbody tr");
  expect(rows).toHaveLength(6);
  expect([...rows].map((row) => row.children[2].textContent)).toEqual([
    "+$6,749",
    "+$6,700",
    "−$6,700",
    "−$6,336",
    "+$3,622",
    "−$3,556",
  ]);
  expect([...rows].map((row) => row.children[1].textContent)).toEqual([
    "lasts to 95",
    "lasts to 95",
    "runs short at 88",
    "runs short at 88",
    "lasts to 95",
    "runs short at 90",
  ]);
});
it.each([
  [
    "at_or_above_cap",
    "At least $10,000,000 a year in today's dollars; the search stops there.",
  ],
  [null, "exactly what you plan to spend."],
])("renders the spending edge case %s", async (flag, text) => {
  vi.mocked(engine.call).mockImplementation(async (...args) => {
    const json = read(
      samples[0].name,
      args[0] === "sustainable_spending" ? "spend" : args[0],
    );
    return args[0] === "sustainable_spending"
      ? JSON.stringify({ ...JSON.parse(json), flag, headroom: 0 })
      : json;
  });
  show();
  await screen.findByText(
    (_, node) => node?.tagName === "P" && !!node.textContent?.includes(text),
  );
});
it("activates Plan after Review and returns to Review with edits preserved", async () => {
  stub();
  render(<App />);
  await screen.findByTestId("intro");
  expect(screen.queryByRole("button", { name: "Plan" })).toBeNull();
  for (let i = 0; i < 6; i++)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Plan" }));
  await screen.findByText("$64,994");
  fireEvent.click(screen.getByRole("button", { name: "Back to household" }));
  expect(document.activeElement).toBe(
    screen.getByRole("heading", { name: "Review your answers" }),
  );
});
