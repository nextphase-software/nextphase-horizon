// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import working from "../../../packages/app/fixtures/answers-working-61.json?raw";
import spending from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
import rough from "../../../packages/app/test-data/web-input-check-rough.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
import { InputCheck } from "./InputCheck";
import { createDraft } from "./setup";
const sample = { label: "Working sample" };
const result = {
  baseline: JSON.parse(spending),
  items: [
    {
      path: "/household/income/social_security/amount/cents",
      impact: 2305,
      low: 2340000,
      high: 2860000,
      headroom_low: -4311,
      headroom_high: 274,
    },
    {
      path: "/household/spending/before_retirement/cents",
      impact: 1624,
      low: 5580000,
      high: 6820000,
      headroom_low: -430,
      headroom_high: -3630,
    },
    {
      path: "/household/accounts/1/cost_basis_cents",
      impact: 8,
      low: 8250000,
      high: 13750000,
      headroom_low: -2014,
      headroom_high: -1998,
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("makes one impact call with edited input, displays engine order, keeps marks and refines the exact field", async () => {
  vi.mocked(engine.call).mockResolvedValue(JSON.stringify(result));
  const draft = createDraft(working);
  draft.rough = JSON.parse(rough)
    .map((item: { path: string }) => item.path)
    .reverse();
  const refine = vi.fn();
  render(
    <InputCheck sample={sample} draft={draft} refine={refine} back={vi.fn()} />,
  );
  await screen.findByText("Three entries are rough. Two of them matter.");
  expect(engine.call).toHaveBeenCalledTimes(1);
  const [op, fixture, items] = vi.mocked(engine.call).mock.calls[0];
  expect(op).toBe("input_impact");
  expect(JSON.parse(fixture)).toEqual(JSON.parse(working));
  expect(JSON.parse(items!)).toEqual(JSON.parse(rough));
  expect(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((node) => node.textContent),
  ).toEqual([
    "Social Security benefit",
    "Spending until you retire",
    "Brokerage account cost basis",
  ]);
  expect(
    screen.getByText(
      "Tested from $23,400 to $28,600 a year; headroom −$4,311 to $274 (today's dollars).",
    ),
  ).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: "Keep as rough" })[0]);
  expect(screen.getByText("Kept as rough")).toBeTruthy();
  expect(draft.rough).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.queryByText("Kept as rough")).toBeNull();
  fireEvent.click(screen.getAllByRole("button", { name: "Refine" })[0]);
  expect(refine).toHaveBeenCalledWith(1, result.items[0].path);
  expect(engine.call).toHaveBeenCalledTimes(1);
});
it("opens the unmarked section for empty rough inputs", async () => {
  vi.mocked(engine.call).mockResolvedValue(
    JSON.stringify({ ...result, items: [] }),
  );
  render(
    <InputCheck
      sample={sample}
      draft={createDraft(working)}
      refine={vi.fn()}
      back={vi.fn()}
    />,
  );
  await screen.findByText("No entries are marked rough.");
  expect(
    screen.getByText("Entered without a rough mark").closest("details")!.open,
  ).toBe(true);
  expect(
    screen.getByText("About you: 4 fields without a rough mark"),
  ).toBeTruthy();
  expect(
    screen.getByText("Accounts: 10 fields without a rough mark"),
  ).toBeTruthy();
});
it("shows engine or transport failure without figures and allows returning", async () => {
  const back = vi.fn();
  for (const message of ["envelope", "transport"]) {
    vi.mocked(engine.call).mockImplementation(async () => {
      if (message === "transport") throw new Error("Worker unavailable");
      return '{"status":"unsupported","code":"EXAMPLE","message":"Synthetic unsupported input"}';
    });
    const view = render(
      <InputCheck
        sample={sample}
        draft={createDraft(working)}
        refine={vi.fn()}
        back={back}
      />,
    );
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(
      view.container.querySelector(".check-item, .impact-bar, dd"),
    ).toBeNull();
    expect(
      screen.getByText(
        message === "envelope"
          ? "Synthetic unsupported input"
          : "Worker unavailable",
      ),
    ).toBeTruthy();
    if (message === "envelope")
      expect(
        screen.getByRole("heading", {
          name: "Horizon can't plan for this yet",
        }),
      ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to household" }));
    view.unmount();
  }
  expect(back).toHaveBeenCalledTimes(2);
});
