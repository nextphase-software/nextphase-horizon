// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import shell from "../../../docs/briefs/0003-W4-shell-figures.json";
import sentences from "../../../docs/briefs/0003-W3-plain-sentences.json";
import w4 from "../../../docs/briefs/0002-W4-reference-values.json";
import w5 from "../../../docs/briefs/0002-W5-reference-values.json";
import w7 from "../../../docs/briefs/0002-W7-what-if-cases.json";
import { App } from "./App";
import { Plan } from "./Plan";
import { HeadlineFigures } from "./PlanShell";
import { headlineFigures, shellNote, planEvents } from "./shell-display";
import { createDraft } from "./setup";
import { samples } from "./fixtures";
import type { AnswersPlanV2, Fixture } from "./generated/types/answers-plan.v2";
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
  tiles: [string, string, string | null, string][] | null;
  strip: { name: string; note: string; figures: string[][] } | null;
  events: [string, number][];
  chart_caption: string;
  chart_note: string;
  panel_note: string;
  panels: [string, string, string, string[]][];
  slider: { label: string; start: string; ends: string[] };
  this_year: {
    sentence: string;
    money_in: string[][];
    money_out: string[][];
    note: string;
  };
  assumptions: string[];
  assumptions_link: string | null;
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
it.each(Object.entries(shell.cases))(
  "renders every shell figure and chooser year: %s",
  async (key, raw) => {
    const expected = raw as unknown as Expected,
      [group, id, leverId] = key.split("/");
    let input: string,
      answer: AnswersPlanV2 | undefined,
      baseline: Baseline | undefined;
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
    const built = {
      run: JSON.parse(native("run", input)),
      spending: JSON.parse(native("spend", input)),
      levers: JSON.parse(native("levers", input)),
    } as Baseline;
    if (id.endsWith("-cap")) built.spending.flag = "at_or_above_cap";
    if (id.endsWith("-exact")) built.spending.headroom = 0;
    stub();
    let view: ReturnType<typeof render>;
    if (group === "copy") {
      baseline = built;
      view = render(<App />);
      fireEvent.click(
        within(view.container).getByRole("button", {
          name: "Try an example household",
        }),
      );
      fireEvent.click(
        within(view.container).getByRole("radio", {
          name: samples.find((s) => s.name === id)!.label,
        }),
      );
      fireEvent.click(
        within(view.container).getByRole("button", {
          name: "Open example plan",
        }),
      );
      await waitFor(() =>
        expect(
          view.container.querySelector(".overview-assumptions"),
        ).toBeTruthy(),
      );
      fireEvent.click(
        within(
          view.container.querySelector(".overview-assumptions") as HTMLElement,
        ).getByRole("button", { name: "Try a change" }),
      );
      const lever = baseline.levers.levers.find((l) => l.id === leverId)!;
      const radios = view.container.querySelectorAll<HTMLInputElement>(
        '.copy-panel input[type="radio"]',
      );
      const index = baseline.levers.levers.findIndex((l) => l.id === lever.id);
      fireEvent.click(radios[index]);
      fireEvent.click(
        within(view.container).getByRole("button", { name: "Make the copy" }),
      );
      await vi.waitFor(
        () =>
          expect(
            view.container.querySelector(
              ".compare-screen .headline-differences",
            ),
          ).toBeTruthy(),
        { timeout: 30_000 },
      );
      fireEvent.click(
        within(
          view.container.querySelector(
            'nav[aria-label="Plan sections"]',
          ) as HTMLElement,
        ).getByRole("button", { name: "Overview" }),
      );
      await waitFor(() =>
        expect(view.container.querySelector(".copy-banner")).toBeTruthy(),
      );
      const scenario = vi
        .mocked(engine.call)
        .mock.results.find(
          (_, i) => vi.mocked(engine.call).mock.calls[i][0] === "scenario",
        )!;
      input = await scenario.value;
    } else {
      vi.mocked(engine.call).mockImplementation(async (...[op]) =>
        JSON.stringify(
          op === "run"
            ? built.run
            : op === "sustainable_spending"
              ? built.spending
              : built.levers,
        ),
      );
      view = render(
        <Plan
          sample={{
            label:
              group === "file"
                ? "Opened plan file"
                : (samples.find((s) => s.name === id)?.label ?? "Your figures"),
          }}
          draft={createDraft(input)}
          back={() => {}}
          intake={!!answer}
          answerResult={answer}
          overview={{
            plan: () => {},
            compare: () => {},
            summary: () => {},
            changeAnswers: () => {},
            tryChange: () => {},
            copies: 0,
          }}
        />,
      );
    }
    await waitFor(() =>
      expect(view.container.querySelectorAll('[role="status"]')).toHaveLength(
        0,
      ),
    );
    const tiles = [
      ...view.container.querySelectorAll(".headline-tiles dl > div"),
    ].map((node) => [
      text(node.querySelector("dt")),
      text(node.querySelector(".figure-value")).replace(/ a year$/, ""),
      text(node.querySelector("small")) || null,
      text(node.querySelector("p")),
    ]);
    expect(tiles.length ? tiles : null).toEqual(expected.tiles ?? null);
    if (id.endsWith("-cap") || id.endsWith("-exact") || id === "two-person")
      return;
    expect(text(view.container.querySelector(".money-sentence"))).toBe(
      expected.this_year.sentence,
    );
    expect(text(view.container.querySelector(".money-note"))).toBe(
      expected.this_year.note,
    );
    const groups = view.container.querySelectorAll(".money-group");
    for (const [i, list] of [
      expected.this_year.money_in,
      expected.this_year.money_out,
    ].entries())
      expect(
        [...groups[i].querySelectorAll("li")].map((li) => [
          text(li.querySelector("span")),
          text(li.querySelector("strong")),
        ]),
      ).toEqual(list);
    expect(texts(view.container, ".overview-assumptions li")).toEqual(
      expected.assumptions,
    );
    expect(
      text(view.container.querySelector(".overview-assumptions button")) ||
        null,
    ).toBe(expected.assumptions_link);
    const plain = sentences.cases[key as keyof typeof sentences.cases] as
      | { follow_on?: string; moves_most?: string; why_short?: string }
      | undefined;
    if (plain) {
      expect(text(view.container.querySelector(".follow-on")) || null).toBe(
        plain.follow_on,
      );
      expect(text(view.container.querySelector(".moves-most")) || null).toBe(
        plain.moves_most,
      );
      expect(text(view.container.querySelector(".why-short")) || null).toBe(
        plain.why_short,
      );
    }
    const forbidden =
      /\b(headroom|point|baseline|indexing|omissions?|rough|modeled|modelled|nominal|ledger|fingerprint|should|recommend)\b|we suggest|us-single-federal-tax|dollars of each year/i;
    expect(text(view.container.querySelector(".overview-grid"))).not.toMatch(
      forbidden,
    );
    expect(text(view.container.querySelector(".headline-tiles"))).not.toMatch(
      forbidden,
    );
    view.unmount();
    const run = JSON.parse(native("run", input)),
      spending = JSON.parse(native("spend", input));
    const figures = headlineFigures(
      run,
      spending,
      JSON.parse(input).household.persons[0].retirement_date,
      answer,
    );
    const strip = render(
      figures && (
        <HeadlineFigures
          figures={figures}
          name={expected.strip!.name}
          note={shellNote(run, !!answer?.bounds)}
        />
      ),
    );
    expect(
      figures
        ? texts(strip.container, "dl > div").map((_, i) => [
            text(strip.container.querySelectorAll("dt")[i]),
            text(strip.container.querySelectorAll("dd")[i]),
          ])
        : null,
    ).toEqual(expected.strip?.figures ?? null);
    if (expected.strip)
      expect(text(strip.container.querySelector(".headline-note"))).toBe(
        expected.strip.note,
      );
    strip.unmount();
    stub();
    const plan = render(
      <Plan
        sample={{ label: "Opened plan file" }}
        draft={createDraft(input)}
        back={() => {}}
        answerResult={answer}
      />,
    );
    await waitFor(() =>
      expect(plan.container.querySelector(".year-chooser")).toBeTruthy(),
    );
    expect(
      planEvents(run, JSON.parse(input) as Fixture).map((e) => [
        e.label,
        e.year,
      ]),
    ).toEqual(expected.events);
    expect(text(plan.container.querySelector(".savings-card figcaption"))).toBe(
      expected.chart_caption,
    );
    expect(text(plan.container.querySelector(".chart-note"))).toBe(
      expected.chart_note,
    );
    const slider = within(plan.container).getByRole("slider", {
      name: expected.slider.label,
    });
    expect(slider.getAttribute("aria-valuetext")).toBe(expected.slider.start);
    expect(texts(plan.container, ".year-ends span")).toEqual(
      expected.slider.ends,
    );
    for (const [i, panel] of expected.panels.entries()) {
      fireEvent.change(slider, { target: { value: i } });
      const chosen = plan.container.querySelector(".chosen-year")!;
      expect([
        text(chosen.querySelector("h3")),
        ...texts(chosen, "dd"),
        texts(chosen, "li"),
      ]).toEqual(panel);
      expect(text(chosen.querySelector(".help"))).toBe(expected.panel_note);
    }
  },
  60000,
);

it("keeps the displayed what-if and headline figures in step through Overview, Plan, copies and Summary", async () => {
  const answers = w7.cases.start.answers;
  localStorage.setItem(
    "horizon.intake.v1",
    JSON.stringify({
      format: "horizon-saved-intake",
      version: 1,
      answers,
      style: "one_question",
      place: "results",
    }),
  );
  stub();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:synthetic");
      static revokeObjectURL = vi.fn();
    },
  );
  const view = render(<App />),
    page = within(view.container);
  const start = await page.findByRole("button", {
    name: "Continue with my answers",
  });
  await waitFor(() => expect(start).toHaveProperty("disabled", false));
  fireEvent.click(start);
  await waitFor(() =>
    expect(view.container.querySelector(".headline-tiles")).toBeTruthy(),
  );
  expect(document.activeElement).toBe(view.container.querySelector("h1"));
  expect(view.container.querySelector(".what-if-panel")).toBeNull();
  const nav = within(page.getByRole("navigation", { name: "Plan sections" }));
  fireEvent.click(page.getByRole("button", { name: "Open the chart" }));
  await waitFor(() =>
    expect(document.activeElement).toBe(
      view.container.querySelector("#savings-title"),
    ),
  );
  await waitFor(() =>
    expect(view.container.querySelector(".headline-strip")).toBeTruthy(),
  );
  const call = vi.mocked(engine.call).getMockImplementation()!;
  let finish!: (reply: string) => void;
  vi.mocked(engine.call).mockImplementation((...args) =>
    args[0] === "plan_from_answers"
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : call(...args),
  );
  const number = view.container.querySelector<HTMLInputElement>(
    "#what-if-number-spending",
  )!;
  fireEvent.change(number, { target: { value: "80000" } });
  fireEvent.keyDown(number, { key: "Enter" });
  expect(view.container.querySelector(".headline-strip")).toBeNull();
  expect(page.getByText("Calculating…")).toBeTruthy();
  finish(JSON.stringify(w7.cases["spending-80000"].result));
  await waitFor(() =>
    expect(page.getByText("What if: not your answers")).toBeTruthy(),
  );
  vi.mocked(engine.call).mockImplementation(call);
  await waitFor(() =>
    expect(view.container.querySelector(".headline-strip")).toBeTruthy(),
  );
  const expected = (
    shell.cases["0002-W7/spending-80000"] as unknown as Expected
  ).strip!;
  const assertStrip = () => {
    expect(
      view.container
        .querySelector(".headline-strip")!
        .getAttribute("aria-label"),
    ).toBe("What if: headline figures");
    expect(
      [...view.container.querySelectorAll(".headline-strip dl > div")].map(
        (node) => [
          text(node.querySelector("dt")),
          text(node.querySelector("dd")),
        ],
      ),
    ).toEqual(expected.figures);
  };
  assertStrip();
  fireEvent.click(nav.getByRole("button", { name: "Overview" }));
  expect(view.container.querySelector(".what-if-panel")).toBeNull();
  await waitFor(() =>
    expect(
      text(view.container.querySelector(".headline-tiles .headline-note")),
    ).toBe(expected.note),
  );
  fireEvent.click(nav.getByRole("button", { name: "Summary" }));
  await waitFor(assertStrip);
  fireEvent.click(nav.getByRole("button", { name: "Plan" }));
  await waitFor(assertStrip);
  expect(
    view.container.querySelector<HTMLInputElement>("#what-if-number-spending")!
      .value,
  ).toBe("80000");
  const tryChange = page.getByRole("button", { name: "Try a change" });
  await waitFor(() => expect(tryChange).toHaveProperty("disabled", false));
  fireEvent.click(tryChange);
  fireEvent.click(page.getByRole("button", { name: "Make the copy" }));
  await waitFor(() =>
    expect(view.container.querySelector(".headline-differences")).toBeTruthy(),
  );
  const switcher = page.getByRole("combobox", { name: "Plan" });
  expect(switcher).not.toHaveProperty("value", "");
  fireEvent.click(nav.getByRole("button", { name: "Overview" }));
  await waitFor(() =>
    expect(view.container.querySelector(".copy-banner")).toBeTruthy(),
  );
  expect(
    view.container.querySelector(
      ".intake-head, .answers-could-change, .what-if-panel",
    ),
  ).toBeNull();
  expect(view.container.querySelector(".sample")).toBeNull();
  expect(page.queryByRole("button", { name: "Try a change" })).toBeNull();
  fireEvent.click(nav.getByRole("button", { name: "Plan" }));
  await waitFor(() =>
    expect(view.container.querySelector(".experts")).toBeTruthy(),
  );
  fireEvent.click(view.container.querySelector(".experts > summary")!);
  await waitFor(() =>
    expect(
      texts(
        view.container,
        ".experts .expert-section:last-of-type tbody td:nth-child(3)",
      ),
    ).toEqual(Array(4).fill("Your figures")),
  );
  fireEvent.click(nav.getByRole("button", { name: "Overview" }));
  fireEvent.click(page.getByRole("button", { name: "Back to your plan" }));
  await waitFor(() =>
    expect(page.getByText("What if: not your answers")).toBeTruthy(),
  );
  fireEvent.click(nav.getByRole("button", { name: "Plan" }));
  fireEvent.click(
    page.getByRole("button", { name: "Keep these as my answers" }),
  );
  await waitFor(() =>
    expect(page.queryByText("What if: not your answers")).toBeNull(),
  );
  expect(within(switcher).getAllByRole("option")).toHaveLength(1);
  expect(page.getByText("No copies yet")).toBeTruthy();
  expect(
    JSON.parse(localStorage.getItem("horizon.intake.v1")!).answers
      .spending_in_retirement.cents,
  ).toBe(8000000);
  vi.unstubAllGlobals();
}, 60000);
