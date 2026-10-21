// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import cases from "../../../docs/briefs/0002-W7-what-if-cases.json";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { WhatIfPlan } from "./WhatIfPlan";
import { IntakeHead } from "./IntakeHead";
import { engine } from "./engine";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const base = cases.cases.start;
function mount() {
  const keep = vi.fn(),
    onInput = vi.fn();
  const view = render(
    <WhatIfPlan
      result={base.result as unknown as AnswersPlanV2}
      answers={base.answers as AnswersV2}
      change={() => {}}
      keep={keep}
      onInput={onInput}
    >
      {(input) => <div data-testid="body">{JSON.stringify(input)}</div>}
    </WhatIfPlan>,
  );
  return { ...view, keep, onInput };
}
function release(name: string, value: string) {
  const slider = screen.getByRole("slider", { name });
  fireEvent.change(slider, { target: { value } });
  fireEvent.pointerUp(slider);
}
it("sends nothing during a drag, sends once on release, combines changes and ignores stale replies", async () => {
  const pending: ((value: string) => void)[] = [];
  vi.mocked(engine.call).mockImplementation(
    () => new Promise((done) => pending.push(done)),
  );
  mount();
  const spending = screen.getByRole("slider", {
    name: "Spending in retirement, a year",
  });
  fireEvent.pointerDown(spending);
  fireEvent.change(spending, { target: { value: "70000" } });
  fireEvent.change(spending, { target: { value: "80000" } });
  expect(engine.call).not.toHaveBeenCalled();
  fireEvent.pointerUp(spending);
  expect(engine.call).toHaveBeenCalledTimes(1);
  expect(JSON.parse(vi.mocked(engine.call).mock.calls[0][1])).toEqual(
    cases.cases["spending-80000"].answers,
  );
  expect(screen.getByText("Working out your plan…")).toBeTruthy();
  expect(screen.queryByTestId("body")).toBeNull();
  release("Retire at", "70");
  expect(engine.call).toHaveBeenCalledTimes(2);
  expect(JSON.parse(vi.mocked(engine.call).mock.calls[1][1])).toMatchObject({
    retirement: { age: 70 },
    spending_in_retirement: { cents: 8000000, per: "year" },
  });
  await act(async () =>
    pending[1](JSON.stringify(cases.cases["retire-at-70"].result)),
  );
  expect(screen.getByTestId("intake-headline").textContent).toBe(
    cases.cases["retire-at-70"].head[0].slice(3),
  );
  await act(async () =>
    pending[0](JSON.stringify(cases.cases["spending-80000"].result)),
  );
  expect(screen.getByTestId("intake-headline").textContent).toBe(
    cases.cases["retire-at-70"].head[0].slice(3),
  );
  expect(screen.getByTestId("body").textContent).toBe(
    JSON.stringify(cases.cases["retire-at-70"].result.household_input),
  );
});
it("resets sliders, invalid text and result, invalidates pending replies, and keeps returned savings", async () => {
  vi.mocked(engine.call).mockResolvedValue(
    JSON.stringify(cases.cases["savings-total-1000000"].result),
  );
  const { keep } = mount();
  release("Savings today", "1000000");
  await screen.findByTestId("intake-headline");
  fireEvent.click(
    screen.getByRole("button", { name: "Keep these as my answers" }),
  );
  const answers = keep.mock.calls[0][0] as AnswersV2;
  expect(
    "accounts" in answers.savings &&
      answers.savings.accounts.map(
        (account) => "cents" in account.balance && account.balance.cents,
      ),
  ).toEqual([2666667, 20000000, 69333333, 8000000]);
  let finish!: (value: string) => void;
  vi.mocked(engine.call).mockImplementationOnce(
    () =>
      new Promise((done) => {
        finish = done;
      }),
  );
  release("Retire at", "70");
  const box = screen.getByRole("spinbutton", {
    name: "Spending in retirement, a year, dollars",
  });
  fireEvent.change(box, { target: { value: "200001" } });
  fireEvent.blur(box);
  expect(screen.getByRole("alert").textContent).toContain("200,000");
  expect(engine.call).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Reset to my answers" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("What if: not your answers")).toBeNull();
  expect(
    screen.getByRole("spinbutton", { name: "Savings today, dollars" }),
  ).toHaveProperty("value", "750000");
  await act(async () =>
    finish(JSON.stringify(cases.cases["retire-at-70"].result)),
  );
  expect(screen.getByTestId("intake-headline").textContent).toBe(
    base.head[0].slice(3),
  );
});
it("commits exact numeric entries and keyboard releases, reports a failed calculation, and recovers", async () => {
  vi.mocked(engine.call).mockRejectedValueOnce(
    new Error("Synthetic worker failure"),
  );
  mount();
  const box = screen.getByRole("spinbutton", {
    name: "Investments grow, a year, percent",
  });
  fireEvent.change(box, { target: { value: "6.25" } });
  expect(engine.call).not.toHaveBeenCalled();
  fireEvent.keyDown(box, { key: "Enter" });
  expect(
    JSON.parse(vi.mocked(engine.call).mock.calls[0][1]).assumptions,
  ).toEqual({ investment_return: "0.0625" });
  await screen.findByText("Calculation unavailable");
  expect(screen.queryByTestId("body")).toBeNull();
  vi.mocked(engine.call).mockResolvedValueOnce(
    JSON.stringify(cases.cases["growth-6-prices-3"].result),
  );
  const prices = screen.getByRole("slider", {
    name: "Prices rise, a year",
  });
  fireEvent.change(prices, { target: { value: "3" } });
  fireEvent.keyUp(prices, { key: "ArrowRight" });
  await screen.findByTestId("intake-headline");
  expect(screen.getByText("What if: not your answers")).toBeTruthy();
});
it.each(Object.entries(cases.cases))(
  "renders the exact what-if head: %s",
  (name, c) => {
    const { container } = render(
      <IntakeHead
        result={c.result as unknown as AnswersPlanV2}
        answers={c.answers as AnswersV2}
        change={() => {}}
        whatIf={name !== "start"}
      />,
    );
    const text = (element: Element | null) =>
      element?.textContent?.trim().replace(/\s+/g, " ") ?? "";
    const actual = [`H: ${text(container.querySelector("h1"))}`];
    actual.push(
      ...[...container.querySelectorAll(".head-line")].map(
        (element) => `   ${text(element)}`,
      ),
    );
    if (c.result.solved) actual.push("   [Worked out for you]");
    actual.push(
      `   ${text(container.querySelector(".plan-status .status"))}  [details: ${text(container.querySelector(".plan-status summary"))}]`,
    );
    for (const line of container.querySelectorAll(".left-out-line"))
      actual.push(`   GAP: ${text(line)}`);
    if (c.result.bounds) {
      const narrow = container
        .querySelector(".range-narrow")!
        .cloneNode(true) as Element;
      narrow.querySelector("button")!.remove();
      actual.push(
        `   RANGE: ${text(container.querySelector(".range-names"))} ${text(narrow)}`,
      );
    }
    for (const item of container.querySelectorAll(".starting-text"))
      actual.push(`   START: ${text(item)}`);
    expect(actual).toEqual(c.head);
    expect(!!screen.queryByText("What if: not your answers")).toBe(
      name !== "start",
    );
  },
);

it("deduplicates Enter followed by blur and ignores a reply after unmount", async () => {
  let finish!: (value: string) => void;
  vi.mocked(engine.call).mockImplementation(
    () =>
      new Promise((done) => {
        finish = done;
      }),
  );
  const { unmount, onInput } = mount();
  const box = screen.getByRole("spinbutton", {
    name: "Savings today, dollars",
  });
  fireEvent.change(box, { target: { value: "1000000" } });
  fireEvent.keyDown(box, { key: "Enter" });
  fireEvent.blur(box);
  expect(engine.call).toHaveBeenCalledTimes(1);
  unmount();
  await act(async () =>
    finish(JSON.stringify(cases.cases["savings-total-1000000"].result)),
  );
  expect(onInput).not.toHaveBeenCalled();
});
