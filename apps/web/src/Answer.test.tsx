// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import raw from "../../../packages/parity/golden/answers-underfunded.spend.json?raw";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
import { Answer } from "./App";
afterEach(cleanup);
it("renders engine values, flags and every omission verbatim", () => {
  const answer = JSON.parse(raw) as SustainableSpending;
  render(<Answer answer={answer} />);
  expect(screen.getByTestId("spending").textContent).toBe("$0");
  expect(screen.getByTestId("entered").textContent).toBe(
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(answer.entered),
  );
  expect(
    screen.getByText("Shortfall even with no retirement spending."),
  ).toBeTruthy();
  for (const omission of answer.run.omissions)
    expect(screen.getByText(omission)).toBeTruthy();
  expect(screen.getAllByText("today's dollars, per year")).toHaveLength(3);
});
it("renders an error with its message and no figures", () => {
  render(
    <Answer
      answer={{
        status: "unsupported",
        code: "MULTIPLE_PERSONS_UNSUPPORTED",
        message: "Only one person is supported.",
      }}
    />,
  );
  expect(screen.getByRole("heading", { name: "Unsupported" })).toBeTruthy();
  expect(screen.getByText("Only one person is supported.")).toBeTruthy();
  expect(screen.queryByTestId("spending")).toBeNull();
});
