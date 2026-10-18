// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import raw from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { engine } from "./engine";
import { App } from "./App";
import { samples } from "./fixtures";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("keeps the answer when the checked household is selected again", async () => {
  vi.mocked(engine.call).mockResolvedValue(raw);
  render(<App />);
  expect((await screen.findByTestId("spending")).textContent).toBe("$64,994");
  fireEvent.click(screen.getByRole("radio", { name: samples[0].label }));
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
  const next = screen.getByRole("radio", {
    name: samples[1].label,
  }) as HTMLInputElement;
  fireEvent.click(next);
  expect(next.checked).toBe(true);
  expect(screen.getByText("Calculating sample household…")).toBeTruthy();
  expect(screen.queryByTestId("spending")).toBeNull();
  expect(engine.call).toHaveBeenCalledTimes(2);
});

it("labels and orders all five household radios with the first checked", async () => {
  vi.mocked(engine.call).mockResolvedValue(raw);
  render(<App />);
  await screen.findByTestId("spending");
  expect(screen.getByRole("group", { name: "Sample household" })).toBeTruthy();
  const radios = screen.getAllByRole("radio") as HTMLInputElement[];
  expect(radios).toHaveLength(5);
  for (const [index, sample] of samples.entries()) {
    expect(screen.getByRole("radio", { name: sample.label })).toBe(
      radios[index],
    );
    expect(radios[index].name).toBe("household");
    expect(radios[index].value).toBe(sample.name);
    expect(radios[index].checked).toBe(index === 0);
  }
});
