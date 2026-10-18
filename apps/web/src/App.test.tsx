// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import raw from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
import { App } from "./App";
import { samples } from "./fixtures";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function stub() {
  vi.mocked(engine.call).mockImplementation(async (...args) => {
    const json = args[1];
    const input = JSON.parse(json as string);
    if (input.household.persons.length > 1)
      return JSON.stringify({
        status: "unsupported",
        code: "MULTIPLE_PERSONS_UNSUPPORTED",
        message: "Only one person is supported.",
      });
    if (input.household.persons[0].id === "synthetic-person") {
      const result = JSON.parse(raw);
      result.status = "complete";
      return JSON.stringify(result);
    }
    return raw;
  });
}
it("loads each status exactly once, derives the introduction and prevents unsupported choices", async () => {
  stub();
  render(<App />);
  expect((await screen.findByTestId("intro")).textContent).toContain(
    "a full result for 2 of these 5 sample households, a partial one for 2, and none for 1",
  );
  expect(engine.call).toHaveBeenCalledTimes(5);
  expect(
    (
      screen.getByRole("radio", {
        name: "When should I claim Social Security?",
      }) as HTMLInputElement
    ).disabled,
  ).toBe(true);
  const group = screen.getByRole("group", {
    name: "Start from a sample household",
  });
  expect(group.querySelectorAll('input[type="radio"]')).toHaveLength(5);
  fireEvent.click(screen.getByRole("radio", { name: samples[0].label }));
  expect(engine.call).toHaveBeenCalledTimes(5);
  fireEvent.click(screen.getByRole("radio", { name: "Couple" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Continue",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getByText("Horizon plans for one person only.")).toBeTruthy();
  for (const name of ["Check", "Plan", "Compare", "Export"])
    expect(screen.queryByRole("button", { name })).toBeNull();
});
it("checks the edited household, retains rough marks and requires confirmation before discarding edits", async () => {
  stub();
  render(<App />);
  await screen.findByTestId("intro");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  const next = () =>
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  next();
  next();
  const account = screen.getByRole("group", { name: "401(k) — Tax-deferred" });
  fireEvent.change(account.querySelector('input[type="text"]')!, {
    target: { value: "600,000" },
  });
  fireEvent.click(account.querySelector('input[type="checkbox"]')!);
  next();
  next();
  fireEvent.change(screen.getByLabelText("Inflation percent per year"), {
    target: { value: "3" },
  });
  next();
  expect(screen.getByText("$600,000")).toBeTruthy();
  expect(screen.getByText("≈ Rough value")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Check this household" }));
  await screen.findByTestId("spending");
  const sent = JSON.parse(
    vi.mocked(engine.call).mock.calls.at(-1)![1] as string,
  );
  expect(sent.household.accounts[2].opening_balance_cents).toBe(60000000);
  expect(
    sent.assumptions.find(
      (item: { identifier: string }) => item.identifier === "inflation",
    ).value,
  ).toBe("0.03");
  fireEvent.click(screen.getByRole("button", { name: "Household" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Review your answers" }));
  expect(screen.getByText("$600,000")).toBeTruthy();
  expect(screen.getByText("≈ Rough value")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Household" }));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("radio", { name: samples[1].label }));
  expect(confirm).toHaveBeenCalledWith(
    expect.stringContaining("edited answers, added accounts and Rough marks"),
  );
  expect(
    (screen.getByRole("radio", { name: samples[0].label }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("radio", { name: samples[1].label }));
  expect(
    (screen.getByRole("radio", { name: samples[1].label }) as HTMLInputElement)
      .checked,
  ).toBe(true);
});
it("blocks malformed entries, but sends meaningful validation to the engine", async () => {
  stub();
  render(<App />);
  await screen.findByTestId("intro");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Plan to age"), {
    target: { value: "95.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert").textContent).toContain("whole number");
  expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Plan to age"), {
    target: { value: "95" },
  });
  fireEvent.change(screen.getByLabelText("Retirement date"), {
    target: { value: "2025-06-01" },
  });
  for (let i = 0; i < 5; i++)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  vi.mocked(engine.call).mockResolvedValueOnce(
    '{"status":"invalid","code":"END_BEFORE_START","message":"Wage end date precedes its start date."}',
  );
  fireEvent.click(screen.getByRole("button", { name: "Check this household" }));
  await screen.findByText("Wage end date precedes its start date.");
  expect(screen.queryByTestId("spending")).toBeNull();
  expect(screen.getAllByRole("link", { name: /^Edit / })).toHaveLength(5);
  await waitFor(() => expect(engine.call).toHaveBeenCalledTimes(6));
});
it("ignores a completed check after navigation and reports worker failure without figures", async () => {
  stub();
  render(<App />);
  await screen.findByTestId("intro");
  for (let index = 0; index < 6; index++)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  let resolve!: (json: string) => void;
  vi.mocked(engine.call).mockImplementationOnce(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
  );
  const checkButton = screen.getByRole("button", {
    name: "Check this household",
  });
  checkButton.focus();
  fireEvent.click(checkButton);
  await screen.findByText("Checking this household…");
  expect(document.activeElement).toBe(checkButton);
  expect(checkButton.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(checkButton);
  expect(engine.call).toHaveBeenCalledTimes(6);
  fireEvent.click(screen.getByRole("link", { name: "Edit About you" }));
  resolve(raw);
  fireEvent.click(screen.getByRole("button", { name: "Review your answers" }));
  expect(screen.queryByTestId("spending")).toBeNull();
  vi.mocked(engine.call).mockRejectedValueOnce(
    new Error("Worker initialization failed"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Check this household" }));
  await screen.findByText("Calculation unavailable");
  expect(screen.queryByTestId("spending")).toBeNull();
});
it("disables setup when initial worker requests fail", async () => {
  vi.mocked(engine.call).mockRejectedValue(
    new Error("Worker initialization failed"),
  );
  render(<App />);
  await screen.findByText("Calculation unavailable");
  expect(
    (screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.queryByTestId("spending")).toBeNull();
});
