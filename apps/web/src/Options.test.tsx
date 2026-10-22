// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import expectedFile from "../../../docs/briefs/0003-W5-options.json";
import shell from "../../../docs/briefs/0003-W4-shell-figures.json";

import w4 from "../../../docs/briefs/0002-W4-reference-values.json";
import w5 from "../../../docs/briefs/0002-W5-reference-values.json";
import w7 from "../../../docs/briefs/0002-W7-what-if-cases.json";
import { App } from "./App";
import { planHeadline } from "./plan-display";
import { Plan } from "./Plan";
import { planOptions, type Options as OptionsData } from "./plan-options";

import { createDraft } from "./setup";
import { samples } from "./fixtures";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { Baseline } from "./plan-copies";
import { engine } from "./engine";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
const root = join(process.cwd(), "../..");
const waitFor = (assertion: () => void) =>
  vi.waitFor(assertion, { timeout: 10_000 });
const replies = new Map<string, string>();
function native(op: string, input: string) {
  const key = op + input;
  if (replies.has(key)) return replies.get(key)!;
  const dir = mkdtempSync(join(tmpdir(), "horizon-shell-")),
    path = join(dir, "input.json");
  writeFileSync(path, input);
  try {
    const result = spawnSync(join(root, "target/release/horizon"), [op, path], {
      encoding: "utf8",
      maxBuffer: 20_000_000,
    });
    expect([0, 1, 2, 3, 4]).toContain(result.status);
    replies.set(key, result.stdout.trim());
    return result.stdout.trim();
  } finally {
    rmSync(dir, { recursive: true });
  }
}
function stub() {
  vi.mocked(engine.call).mockImplementation(async (op, input, ...args) => {
    if (op === "scenario") {
      const fixture = JSON.parse(input);
      fixture.assumptions = Object.fromEntries(
        fixture.assumptions.map((rate: { identifier: string }) => [
          rate.identifier,
          rate,
        ]),
      );
      for (const change of JSON.parse(args[0])) {
        const parts = change.path.slice(1).split("/");
        let target = fixture;
        for (const part of parts.slice(0, -1)) target = target[part];
        target[parts.at(-1)!] = change.value;
      }
      fixture.assumptions = Object.values(fixture.assumptions);
      return JSON.stringify(fixture);
    }
    if (op === "compare") {
      const dir = mkdtempSync(join(tmpdir(), "horizon-shell-compare-"));
      writeFileSync(join(dir, "base.json"), input);
      writeFileSync(join(dir, "copy.json"), args[0]);
      try {
        return spawnSync(
          join(root, "target/release/horizon"),
          ["compare", join(dir, "base.json"), join(dir, "copy.json")],
          { encoding: "utf8", maxBuffer: 20_000_000 },
        ).stdout.trim();
      } finally {
        rmSync(dir, { recursive: true });
      }
    }
    return native(
      op === "sustainable_spending"
        ? "spend"
        : op === "plan_from_answers"
          ? "intake"
          : op,
      input,
    );
  });
}
const text = (node: Element | null) =>
  node?.textContent?.trim().replace(/\s+/g, " ") ?? "";
const texts = (node: ParentNode, selector: string) =>
  [...node.querySelectorAll(selector)].map(text);
const references = {
  "0002-W4": w4.cases,
  "0002-W5": w5.cases,
  "0002-W7": w7.cases,
} as unknown as Record<string, Record<string, { result: AnswersPlanV2 }>>;
type Expected = {
  options: OptionsData | null;
  overview_options: {
    heading: string;
    items: OptionsData["items"];
    none: string | null;
    footer: string[];
  } | null;
  answer_link: string | null;
  what_next: { plan: string[][]; overview: string[][] };
  copy_names: Record<string, { name: string; subject: string }>;
  shown?: string;
};
beforeAll(() => {
  const built = spawnSync(
    "cargo",
    ["build", "--release", "-p", "horizon-cli"],
    { cwd: root, encoding: "utf8" },
  );
  expect(built.status, built.stderr).toBe(0);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const forbidden =
  /\b(headroom|point|baseline|indexing|omissions?|rough|modeled|modelled|nominal|ledger|fingerprint|should|recommend)\b|we suggest|save more|dollars of each year/i;
function check(
  container: HTMLElement,
  expected: Expected,
  overview: boolean,
  copyCount = 0,
) {
  const section = container.querySelector(".plan-options");
  const value = overview ? expected.overview_options : expected.options;
  expect(!!section).toBe(!!value);
  if (section && value) {
    expect(text(section.querySelector("h2"))).toBe(value.heading);
    expect(texts(section, ".options-list h3")).toEqual(
      value.items.map((item) => item.title),
    );
    expect(texts(section, ".options-list p")).toEqual(
      value.items.map((item) =>
        [item.mark, item.effect].filter(Boolean).join(" "),
      ),
    );
    expect(text(section.querySelector(".options-none")) || null).toBe(
      ("none" in value && value.none) || null,
    );
    expect(
      [...section.querySelectorAll(".options-list button")].map((button) =>
        button.getAttribute("aria-label"),
      ),
    ).toEqual(
      value.items
        .filter((item) => item.try)
        .map((item) => `Try this: ${item.title}`),
    );
    if (!overview) {
      expect(text(section.querySelector(".options-intro"))).toBe(
        expected.options!.intro,
      );
      expect(texts(section, ".options-returns li")).toEqual(
        expected.options!.returns,
      );
      expect(text(section.querySelector(".options-returns h3"))).toBe(
        expected.options!.returns_heading,
      );
      expect(text(section.querySelector(".options-intro"))).toContain(
        "options to explore, not advice",
      );
    } else {
      expect(
        section.querySelector(".options-intro, .options-returns"),
      ).toBeNull();
      expect(text(section.lastElementChild)).toBe(
        expected.overview_options!.footer.join(" "),
      );
    }
    expect(text(section)).not.toMatch(forbidden);
    section
      .querySelectorAll(".option-supported,.option-partial")
      .forEach((mark) => expect(mark.getAttribute("aria-hidden")).toBe("true"));
  }
  if (!overview)
    expect(text(container.querySelector(".plan-answer a")) || null).toBe(
      expected.answer_link,
    );
  const next = expected.what_next[overview ? "overview" : "plan"].map(
    ([sentence, control]) =>
      [
        sentence,
        sentence === "Compare your plans side by side." && copyCount
          ? `Compare ${copyCount + 1} plans`
          : control,
      ].join(" "),
  );
  expect(texts(container, ".next-steps li")).toEqual(next);
  for (const name of [".next-steps", ".your-plans", ".overview-grid"])
    expect(text(container.querySelector(name))).not.toMatch(forbidden);
}
async function openExample(container: HTMLElement, id: string) {
  fireEvent.click(
    within(container).getByRole("button", { name: "Try an example household" }),
  );
  fireEvent.click(
    within(container).getByRole("radio", {
      name: samples.find((sample) => sample.name === id)!.label,
    }),
  );
  fireEvent.click(
    within(container).getByRole("button", { name: "Open example plan" }),
  );
  await waitFor(() =>
    expect(container.querySelector(".overview-assumptions")).toBeTruthy(),
  );
}
it.each(Object.entries(expectedFile.cases))(
  "renders every options reference on Plan and Overview: %s",
  async (key, raw) => {
    const expected = raw as unknown as Expected;
    const [group, id, leverId] = key.split("/");
    let input: string, answer: AnswersPlanV2 | undefined;
    if (references[group]) {
      answer = references[group][id].result;
      input = JSON.stringify(answer.household_input);
    } else if (group === "file")
      input = readFileSync(
        join(root, `packages/app/fixtures/${id}.json`),
        "utf8",
      );
    else if (id === "intake-spec-review") {
      // The synthetic review document constructed in e2e/intake.spec.ts.
      const answers = {
        format: "horizon-answers",
        version: 2,
        valuation_date: "2026-01-01",
        planning: "alone",
        birth_date: { age: 60 },
        retired: false,
        retirement: { age: 66 },
        plan_end_age: 95,
        pay: {
          range: { low_cents: 8000000, high_cents: 9000000 },
          per: "year",
        },
        pay_ends: { at_retirement: true },
        social_security: {
          expects: "yes",
          start_age: 67,
          amount: { later: true },
        },
        pension: {
          expects: "yes",
          amount: { cents: 1200000, per: "year" },
          start_age: 65,
          rises_with_prices: "no",
        },
        savings: { accounts: [{ kind: "cash", balance: { cents: 75000000 } }] },
        spending_now: { cents: 500000, per: "month" },
        spending_in_retirement: { later: true },
        assumptions: {},
        not_sure: ["pay", "social_security", "savings"],
      };
      answer = JSON.parse(native("intake", JSON.stringify(answers)));
      input = JSON.stringify(answer!.household_input);
    } else input = samples.find((s) => s.name === id)?.json ?? samples[0].json;
    if (id === "plain-results-outside") {
      const fixture = JSON.parse(input);
      fixture.household.persons[0].retirement_date = "2100-01-01";
      input = JSON.stringify(fixture);
    }

    const built: Baseline = {
      run: JSON.parse(native("run", input)),
      spending: JSON.parse(native("spend", input)),
      levers: JSON.parse(native("levers", input)),
    };
    if (id.endsWith("-cap")) built.spending.flag = "at_or_above_cap";
    if (id.endsWith("-exact")) built.spending.headroom = 0;
    stub();
    if (group === "copy") {
      const view = render(<App />);
      await openExample(view.container, id);
      if (leverId === "spend_to_last") {
        fireEvent.click(
          within(
            view.container.querySelector(".plan-options") as HTMLElement,
          ).getAllByRole("button", { name: /^Try this:/ })[0],
        );
      } else {
        fireEvent.click(
          within(
            view.container.querySelector(
              ".overview-assumptions",
            ) as HTMLElement,
          ).getByRole("button", { name: "Try a change" }),
        );
        const index = built.levers.levers.findIndex(
          (lever) => lever.id === leverId,
        );
        fireEvent.click(
          view.container.querySelectorAll(".copy-panel input")[index],
        );
        fireEvent.click(
          within(view.container).getByRole("button", { name: "Make the copy" }),
        );
      }
      await waitFor(() =>
        expect(
          view.container.querySelector(".headline-differences"),
        ).toBeTruthy(),
      );
      const nav = within(
        view.container.querySelector(
          'nav[aria-label="Plan sections"]',
        ) as HTMLElement,
      );
      fireEvent.click(nav.getByRole("button", { name: "Overview" }));
      await waitFor(() =>
        expect(
          view.container.querySelector(".overview-assumptions"),
        ).toBeTruthy(),
      );
      check(view.container, expected, true, 1);
      fireEvent.click(nav.getByRole("button", { name: "Plan" }));
      await waitFor(() =>
        expect(view.container.querySelector(".next-steps")).toBeTruthy(),
      );
      check(view.container, expected, false, 1);
      expect(
        text(
          view.container.querySelector(
            ".your-plans .plans-list > li:first-child > p",
          ),
        ),
      ).toBe(planHeadline(built.run));
      expect(view.container.querySelector(".plan-options button")).toBeNull();
      if (leverId === "spend_to_last") {
        expect(
          texts(view.container, ".headline-strip .figure-value"),
        ).toContain(`Last to ${built.run.years.at(-1)!.age_on_december_31}`);
        fireEvent.click(nav.getByRole("button", { name: "Overview" }));
        await waitFor(() =>
          expect(view.container.querySelector(".headline-tiles")).toBeTruthy(),
        );
        expect(text(view.container.querySelector(".headline-tiles"))).toContain(
          "Exactly what you plan to spend in retirement.",
        );
      } else {
        const reference = shell.cases[key as keyof typeof shell.cases] as {
          strip?: { figures: string[][] };
        };
        expect(
          [...view.container.querySelectorAll(".headline-strip dl > div")].map(
            (node) => [
              text(node.querySelector("dt")),
              text(node.querySelector("dd")),
            ],
          ),
        ).toEqual(reference.strip!.figures);
      }
      return;
    }
    vi.mocked(engine.call).mockImplementation(async (...[op]) =>
      JSON.stringify(
        op === "run"
          ? built.run
          : op === "sustainable_spending"
            ? built.spending
            : built.levers,
      ),
    );
    const options = expected.shown
      ? null
      : planOptions(
          built,
          JSON.parse(input).household.persons[0].retirement_date,
          answer,
        );
    if (options)
      expect({
        ...options,
        items: options.items.map((item) => ({
          ...item,
          try: item.try ? { id: item.try.id, changes: item.try.changes } : null,
        })),
      }).toEqual(expected.options);
    else if (!expected.shown) expect(expected.options).toBeNull();
    for (const overview of [false, true]) {
      const view = render(
        <Plan
          sample={{
            label: group === "file" ? "Opened plan file" : "Your figures",
          }}
          draft={createDraft(input)}
          back={() => {}}
          intake={!!answer}
          answerResult={answer}
          overview={
            overview
              ? {
                  plan: () => {},
                  compare: () => {},
                  summary: () => {},
                  changeAnswers: () => {},
                  tryChange: () => {},
                  copies: 0,
                }
              : undefined
          }
        />,
      );
      await waitFor(() =>
        expect(view.container.querySelectorAll('[role="status"]')).toHaveLength(
          0,
        ),
      );
      if (expected.shown)
        expect(
          view.container.querySelector(".plan-options,.next-steps"),
        ).toBeNull();
      else check(view.container, expected, overview);
      view.unmount();
    }
  },
);

it.each(
  Object.entries(expectedFile.cases).filter(
    ([key]) => key.startsWith("example/") && key !== "example/two-person",
  ),
)(
  "tries every offered option and reopens the same copy: %s",
  async (key, raw) => {
    const expected = raw as unknown as Expected;
    stub();
    const view = render(<App />);
    const id = key.split("/")[1];
    await openExample(view.container, id);
    const nav = within(
      view.container.querySelector(
        'nav[aria-label="Plan sections"]',
      ) as HTMLElement,
    );
    fireEvent.click(nav.getByRole("button", { name: "Plan" }));
    await waitFor(() =>
      expect(view.container.querySelector(".plan-options")).toBeTruthy(),
    );
    const before = native(
      "run",
      samples.find((sample) => sample.name === id)!.json,
    );
    for (const item of expected.options!.items.filter((item) => item.try)) {
      const named = expected.copy_names[item.try!.id];
      fireEvent.click(
        within(view.container).getByRole("button", {
          name: `Try this: ${item.title}`,
        }),
      );
      await waitFor(() =>
        expect(
          view.container.querySelector(".headline-differences"),
        ).toBeTruthy(),
      );
      expect(
        text(view.container.querySelector(".copy-tabs [aria-current]")),
      ).toBe(named.name);
      expect(text(view.container.querySelector(".compare-screen"))).toContain(
        named.subject,
      );
      const calls = vi.mocked(engine.call).mock.calls;
      const scenarioIndex = calls
        .map((call) => call[0])
        .lastIndexOf("scenario");
      expect(JSON.parse(calls[scenarioIndex][2]!)).toEqual(item.try!.changes);
      const scenarioBytes = await vi.mocked(engine.call).mock.results[
        scenarioIndex
      ].value;
      expect(
        calls.some(
          (call) => call[0] === "compare" && call[2] === scenarioBytes,
        ),
      ).toBe(true);
      expect(
        calls.some(
          (call) =>
            call[0] === "sustainable_spending" && call[1] === scenarioBytes,
        ),
      ).toBe(true);
      fireEvent.click(
        within(view.container).getByRole("button", { name: "Back to plan" }),
      );
      await waitFor(() =>
        expect(view.container.querySelector(".plan-options")).toBeTruthy(),
      );
      expect(text(view.container.querySelector(".your-plans"))).toContain(
        named.name,
      );
      fireEvent.click(
        within(view.container).getByRole("button", {
          name: `Open the copy: ${item.title}`,
        }),
      );
      await waitFor(() =>
        expect(view.container.querySelector(".compare-screen")).toBeTruthy(),
      );
      expect(
        vi
          .mocked(engine.call)
          .mock.calls.filter((call) => call[0] === "scenario"),
      ).toHaveLength(
        expected
          .options!.items.filter((item) => item.try)
          .findIndex((option) => option.title === item.title) + 1,
      );
      fireEvent.click(
        within(view.container).getByRole("button", { name: "Back to plan" }),
      );
      await waitFor(() =>
        expect(view.container.querySelector(".plan-options")).toBeTruthy(),
      );
    }
    expect(
      native("run", samples.find((sample) => sample.name === id)!.json),
    ).toBe(before);
  },
);

it("compares every copy in the table and tabs, while charting only the most recent three", async () => {
  stub();
  const view = render(<App />);
  await openExample(view.container, "answers-working-61");
  const expected = expectedFile.cases["example/answers-working-61"];
  for (const item of expected.options.items) {
    fireEvent.click(
      within(view.container).getByRole("button", {
        name: `Try this: ${item.title}`,
      }),
    );
    await waitFor(() =>
      expect(
        view.container.querySelector(".headline-differences"),
      ).toBeTruthy(),
    );
    if (item !== expected.options.items.at(-1)) {
      fireEvent.click(
        within(view.container).getByRole("button", { name: "Back to plan" }),
      );
      await waitFor(() =>
        expect(view.container.querySelector(".plan-options")).toBeTruthy(),
      );
    }
  }
  async function addCopy(radio: RegExp) {
    fireEvent.click(
      within(view.container).getByRole("button", { name: /New copy/ }),
    );
    fireEvent.click(within(view.container).getByRole("radio", { name: radio }));
    fireEvent.click(
      within(view.container).getByRole("button", { name: "Make the copy" }),
    );
    await waitFor(() =>
      expect(
        view.container.querySelector(".headline-differences"),
      ).toBeTruthy(),
    );
  }
  await addCopy(/^Returns 1% lower/);
  const reference = expected.side_by_side_with_returns;
  expect(text(view.container.querySelector(".compare-screen h1"))).toBe(
    reference.h1,
  );
  expect(text(view.container.querySelector(".side-by-side h2"))).toBe(
    reference.heading,
  );
  expect(texts(view.container, ".plans-table thead th")).toEqual([
    "Measure",
    ...reference.columns,
  ]);
  expect(
    [...view.container.querySelectorAll(".plans-table tbody tr")]
      .slice(0, 4)
      .map((row) => {
        const label = row.querySelector("th")!.cloneNode(true) as HTMLElement;
        const unit = label.querySelector("small");
        const unitText = text(unit) || null;
        unit?.remove();
        return [text(label), unitText, ...texts(row, "td")];
      }),
  ).toEqual(reference.rows);
  expect(text(view.container.querySelector(".side-by-side-note"))).toBe(
    reference.note,
  );
  fireEvent.click(
    within(view.container).getByRole("button", { name: "Open Retire at 67" }),
  );
  await waitFor(() =>
    expect(
      text(view.container.querySelector(".copy-tabs [aria-current]")),
    ).toBe("Retire at 67"),
  );
  await addCopy(/^Retire a year earlier/);
  expect(text(view.container.querySelector(".compare-screen h1"))).toBe(
    "Your plan and 4 copies, side by side",
  );
  expect(text(view.container.querySelector(".side-by-side"))).toContain(
    "The chart shows your plan and the 3 most recent copies. Every copy is in the table and the tabs.",
  );
  expect(
    texts(view.container, ".plans-key li").map((line) => line.split(" · ")[0]),
  ).toEqual(["Your plan", "Retire at 67", "Returns at 4%", "Retire at 65"]);
  for (const selector of [".chart-wide", ".chart-compact"])
    expect(
      [
        ...view.container.querySelectorAll(
          `.side-by-side ${selector} polyline`,
        ),
      ].map((line) => line.getAttribute("stroke-dasharray")),
    ).toEqual([null, "9 5", "2 4", "10 4 2 4"]);
  expect(view.container.querySelectorAll(".plans-table thead th")).toHaveLength(
    6,
  );
  expect(text(view.container.querySelector(".side-by-side"))).not.toMatch(
    forbidden,
  );
});
