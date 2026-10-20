// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import raw from "../../../packages/parity/golden/answers-working-61.spend.json?raw";
import { App } from "./App";
import { engine } from "./engine";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.resetAllMocks();
});
it("welcomes own figures without coverage labels and starts the first question", async () => {
  vi.mocked(engine.call).mockResolvedValue(raw);
  render(<App />);
  const start = await screen.findByRole("button", {
    name: "Start with my own figures",
  });
  await vi.waitFor(() =>
    expect((start as HTMLButtonElement).disabled).toBe(false),
  );
  expect(screen.queryByText("Supported")).toBeNull();
  expect(
    screen.getByRole("radio", { name: "When should I claim Social Security?" }),
  ).toHaveProperty("disabled", true);
  fireEvent.click(start);
  expect(
    screen.getByRole("heading", {
      name: "Are you planning alone or with a partner?",
    }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(
    screen.getByRole("heading", { name: "When were you born?" }),
  ).toBeTruthy();
});
it("ignores an obsolete answers reply after returning to review", async () => {
  vi.mocked(engine.call).mockResolvedValue(raw);
  render(<App />);
  const start = await screen.findByRole("button", {
    name: "Start with my own figures",
  });
  await vi.waitFor(() =>
    expect((start as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(start);
  fireEvent.click(screen.getByRole("button", { name: "Review my answers" }));
  let resolve!: (value: string) => void;
  vi.mocked(engine.call).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.click(screen.getByRole("button", { name: "See my plan" }));
  expect(screen.getByText("Working out your plan…")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Back to my answers" }));
  resolve('{"status":"incomplete","needed":["birth_date"]}');
  expect(
    screen.getByRole("heading", { name: "Here's what you told us" }),
  ).toBeTruthy();
  expect(screen.queryByText("We need your age first.")).toBeNull();
});
