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
import { Export, exportStory, fileSize, importCheck } from "./Export";
import { App } from "./App";
import { createDraft, serializeDraft, changeEntry } from "./setup";
import { Plan } from "./Plan";
import { samples } from "./fixtures";
import type { PlanCache } from "./plan-results";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
const goldens = import.meta.glob<string>(
  "../../../packages/parity/golden/*.json",
  { query: "?raw", import: "default", eager: true },
);
const read = (name: string, op: string) =>
  goldens[`../../../packages/parity/golden/${name}.${op}.json`];
const run = JSON.parse(read(samples[0].name, "run"));
const spending = JSON.parse(read(samples[0].name, "spend"));
function stub() {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:synthetic"),
    revokeObjectURL: vi.fn(),
  });
  vi.mocked(engine.call).mockImplementation(async (...args) =>
    read(
      samples[0].name,
      (
        { export_run: "export", sustainable_spending: "spend" } as Record<
          string,
          string
        >
      )[args[0]] ?? args[0],
    ),
  );
}
function show(
  draft = createDraft(samples[0].json),
  cache: PlanCache = new Map(),
) {
  return render(
    <Export
      sample={samples[0]}
      draft={draft}
      copies={null}
      cache={cache}
      opened={vi.fn()}
    />,
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it("formats the declared file-size rounding boundaries", () => {
  for (const [bytes, expected] of [
    [4999, "0.00"],
    [5000, "0.01"],
    [645501, "0.65"],
    [995000, "1.00"],
  ] as const)
    expect(fileSize(bytes)).toBe(
      `${expected} MB (${bytes.toLocaleString("en-US")} bytes)`,
    );
});
it("uses the brief's story precedence, including before-retirement shortfall and the cap", () => {
  const date = "2031-03-10";
  expect(exportStory(run, spending, date)).toBe(
    "Retiring at 66, savings run short at 93; spending $64,994 a year in today's dollars would make them last to 95.",
  );
  expect(
    exportStory(run, { ...spending, flag: "at_or_above_cap" }, date),
  ).toContain("at least $10,000,000");
  expect(
    exportStory(
      run,
      { ...spending, flag: "shortfall_with_no_retirement_spending" },
      "2100-01-01",
    ),
  ).toBe("Savings run short at 93; retirement falls after the plan ends.");
  const under = JSON.parse(read("answers-underfunded", "run"));
  expect(
    exportStory(
      under,
      { ...spending, flag: "shortfall_with_no_retirement_spending" },
      date,
    ),
  ).toBe("Savings run short at 61, even with no retirement spending.");
});
it("reuses plan calls, downloads exact engine bytes, releases the blob and opens native print", async () => {
  stub();
  const cache: PlanCache = new Map();
  const plan = render(
    <Plan
      sample={samples[0]}
      draft={createDraft(samples[0].json)}
      back={vi.fn()}
      cache={cache}
    />,
  );
  await screen.findByText("$64,994");
  plan.unmount();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const view = show(undefined, cache);
  const link = await screen.findByRole("link", { name: "Download plan file" });
  expect(link.getAttribute("download")).toBe("horizon-plan-8cb745ed60a6.json");
  expect(engine.call).toHaveBeenCalledTimes(4);
  expect(engine.call).toHaveBeenLastCalledWith(
    "export_run",
    serializeDraft(createDraft(samples[0].json)),
  );
  const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
  expect(blob.type).toBe("application/json");
  expect(await blob.text()).toBe(read(samples[0].name, "export"));
  const details = view.container.querySelectorAll("details");
  expect(details).toHaveLength(3);
  for (const detail of details) expect(detail.open).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Print or save as PDF" }));
  expect(print).toHaveBeenCalledOnce();
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:synthetic");
});
it.each(["run", "sustainable_spending", "levers", "export_run"])(
  "suppresses all figures on a %s error",
  async (operation) => {
    stub();
    const original = vi.mocked(engine.call).getMockImplementation()!;
    vi.mocked(engine.call).mockImplementation((...args) =>
      args[0] === operation
        ? Promise.resolve(
            '{"status":"unsupported","code":"SYNTHETIC","message":"Synthetic failure"}',
          )
        : original(...args),
    );
    const view = show();
    await screen.findByText("Synthetic failure");
    expect(screen.getByText("Unsupported")).toBeTruthy();
    expect(
      view.container.querySelector(
        ".plan-summary, .export-story, .file-details",
      ),
    ).toBeNull();
  },
);
it("shows loading without old results and ignores replies after unmount", async () => {
  stub();
  const pending: ((text: string) => void)[] = [];
  vi.mocked(engine.call).mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  const view = show();
  expect(screen.getAllByText("Calculating…").length).toBeGreaterThan(2);
  expect(
    screen
      .getByRole("button", { name: "Print or save as PDF" })
      .hasAttribute("disabled"),
  ).toBe(true);
  view.unmount();
  await act(async () => pending[3](read(samples[0].name, "export")));
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it.each([
  "EXPORT_FORMAT_UNSUPPORTED",
  "EXPORT_HASH_MISMATCH",
  "EXPORT_MODEL_VERSION_UNSUPPORTED",
  "EXPORT_RESULT_MISMATCH",
])("keeps the household and screen on %s", async (code) => {
  stub();
  const opened = vi.fn();
  render(
    <Export
      sample={samples[0]}
      draft={null}
      copies={null}
      cache={new Map()}
      opened={opened}
    />,
  );
  vi.mocked(engine.call).mockResolvedValue(
    JSON.stringify({
      status: "unsupported",
      code,
      message: "Synthetic rejection",
    }),
  );
  const input = screen.getByLabelText("Choose a plan file");
  fireEvent.change(input, {
    target: { files: [{ text: async () => read(samples[0].name, "export") }] },
  });
  await screen.findByText(
    `This file did not pass the check of ${importCheck(code)}, so Horizon did not open it.`,
  );
  expect(opened).not.toHaveBeenCalled();
  expect(engine.call).toHaveBeenCalledWith(
    "import_run",
    read(samples[0].name, "export"),
  );
});
it("rejects non-JSON before calling the worker", async () => {
  stub();
  render(
    <Export
      sample={samples[0]}
      draft={null}
      copies={null}
      cache={new Map()}
      opened={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Choose a plan file"), {
    target: { files: [{ text: async () => "not JSON" }] },
  });
  await screen.findByText("The file is not valid JSON.");
  expect(engine.call).not.toHaveBeenCalled();
});
it("opens the exact imported input, clears copies/rough marks and permits setup and export", async () => {
  stub();
  render(<App />);
  await screen.findByTestId("intro");
  fireEvent.click(screen.getByRole("button", { name: "Export" }));
  expect(
    screen.getByText("Set up a household first to share or keep a plan."),
  ).toBeTruthy();
  vi.mocked(engine.call).mockImplementation(async (...args) =>
    args[0] === "import_run"
      ? JSON.stringify(run)
      : read(
          samples[0].name,
          (
            { export_run: "export", sustainable_spending: "spend" } as Record<
              string,
              string
            >
          )[args[0]] ?? args[0],
        ),
  );
  fireEvent.change(screen.getByLabelText("Choose a plan file"), {
    target: { files: [{ text: async () => read(samples[0].name, "export") }] },
  });
  await screen.findByRole("heading", {
    name: "Savings run short at 93, two years before the plan ends.",
  });
  expect(screen.getByText("OPENED PLAN FILE · RETIRE AT 66")).toBeTruthy();
  const expected = JSON.parse(read(samples[0].name, "export")).input;
  for (const [op, input] of vi
    .mocked(engine.call)
    .mock.calls.filter(([op]) => ["run", "levers"].includes(op))) {
    expect(op).toBeTruthy();
    expect(JSON.parse(input)).toEqual(expected);
  }
  fireEvent.click(
    within(document.querySelector(".plan-screen")!).getByRole("button", {
      name: "Export",
    }),
  );
  await screen.findByRole("link", { name: "Download plan file" });
  expect(document.querySelector(".plan-summary")!.textContent).toContain(
    "No entries are marked rough.",
  );
});
it("preserves unedited cents in opened files even after another field is edited", () => {
  const input = JSON.parse(samples[0].json);
  input.household.accounts[0].opening_balance_cents += 37;
  input.household.spending.after_retirement.cents += 49;
  const draft = createDraft(JSON.stringify(input));
  expect(JSON.parse(serializeDraft(draft))).toEqual(input);
  const changed = JSON.parse(
    serializeDraft(
      changeEntry(draft, "/household/persons/0/plan_end_age", "94"),
    ),
  );
  expect(changed.household.accounts).toEqual(input.household.accounts);
  expect(changed.household.spending).toEqual(input.household.spending);
});
