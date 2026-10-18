// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import raw from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
import { App } from "./App";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("keeps the answer after a same-value household change event", async () => {
  vi.mocked(engine.call).mockResolvedValue(raw);
  render(<App />);
  expect((await screen.findByTestId("spending")).textContent).toBe("$64,994");
  fireEvent.change(screen.getByLabelText("Sample household", { exact: true }), {
    target: { value: "answers-working-61" },
  });
  expect(screen.getByTestId("spending").textContent).toBe("$64,994");
  expect(screen.queryByText("Calculating sample household…")).toBeNull();
  expect(engine.call).toHaveBeenCalledTimes(1);
});
it("clears the previous answer when the next household request starts", async () => {
  vi.mocked(engine.call)
    .mockResolvedValueOnce(raw)
    .mockImplementationOnce(() => new Promise(() => {}));
  render(<App />);
  await screen.findByTestId("spending");
  fireEvent.change(screen.getByLabelText("Sample household", { exact: true }), {
    target: { value: "synthetic-retired" },
  });
  expect(screen.getByText("Calculating sample household…")).toBeTruthy();
  expect(screen.queryByTestId("spending")).toBeNull();
  expect(engine.call).toHaveBeenCalledTimes(2);
});
