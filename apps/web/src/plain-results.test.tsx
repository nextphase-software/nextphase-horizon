// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, fireEvent, within } from "@testing-library/react";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sentences from "../../../docs/briefs/0003-W3-plain-sentences.json";
import w4 from "../../../docs/briefs/0002-W4-reference-values.json";
import w5 from "../../../docs/briefs/0002-W5-reference-values.json";
import w7 from "../../../docs/briefs/0002-W7-what-if-cases.json";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2, Fixture } from "./generated/types/answers-plan.v2";
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import type { Comparison } from "./generated/types/comparison.v2";
import { Plan } from "./Plan";
import { IntakeHead } from "./IntakeHead";
import { Export } from "./Export";
import { Compare } from "./Compare";
import { createDraft } from "./setup";
import { samples } from "./fixtures";
import { answersCouldChange, footerRules, plainLeftOut } from "./plain-results";
import {
  changedInputs,
  compareAmount,
  plannedSpending,
  signedCents,
  signedDollars,
} from "./compare-display";
import { copyLabels } from "./plan-copies";
import { engine } from "./engine";
vi.mock("./engine", () => ({ engine: { call: vi.fn() } }));
const text = (node: Element | null) =>
  node?.textContent?.trim().replace(/\s+/g, " ") ?? "";
const root = join(process.cwd(), "../..");
const forbidden =
  /\b(headroom|point|baseline|indexing|omissions?|rough|modeled|modelled|nominal|ledger|fingerprint)\b|us-single-federal-tax|dollars of each year/i;
function plain(container: HTMLElement) {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".experts").forEach((node) => node.remove());
  expect(text(clone)).not.toMatch(forbidden);
  expect(
    clone.querySelector(".ledger-table, .line-differences, .file-details"),
  ).toBeNull();
}
function native(op: string, ...args: string[]) {
  const reply = spawnSync(
    "cargo",
    ["run", "--quiet", "--release", "-p", "horizon-cli", "--", op, ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 20_000_000 },
  );
  expect([0, 1, 2, 3, 4]).toContain(reply.status);
  expect(reply.stdout.endsWith("\n")).toBe(true);
  return reply.stdout.trim();
}
function build(input: Fixture | string) {
  const dir = mkdtempSync(join(tmpdir(), "horizon-plain-")),
    path = join(dir, "input.json");
  writeFileSync(
    path,
    typeof input === "string" ? input : JSON.stringify(input),
  );
  try {
    const replies = Object.fromEntries(
      ["run", "spend", "levers", "export"].map((op) => [op, native(op, path)]),
    );
    return {
      run: JSON.parse(replies.run) as Run,
      spending: JSON.parse(replies.spend) as SustainableSpending,
      levers: JSON.parse(replies.levers) as Levers,
      replies,
    };
  } finally {
    rmSync(dir, { recursive: true });
  }
}
function stub(built: ReturnType<typeof build>) {
  vi.mocked(engine.call).mockImplementation(
    async (...[op]) =>
      built.replies[
        (
          { sustainable_spending: "spend", export_run: "export" } as Record<
            string,
            string
          >
        )[op] ?? op
      ],
  );
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:synthetic");
      static revokeObjectURL = vi.fn();
    },
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
type Expected = {
  amounts_note?: string;
  follow_on?: string | null;
  moves_most?: string | null;
  why_short?: string | null;
  left_out?: string[];
  answers_could_change?: string[] | null;
  headline?: string;
  status?: string;
  export_date?: string;
  export_summary_date?: string;
  export_lines?: string[];
  footer?: string;
};
type Reference = { answers: AnswersV2; result: AnswersPlanV2 };
const references: Record<string, Record<string, Reference>> = {
  "0002-W4": w4.cases as unknown as Record<string, Reference>,
  "0002-W5": w5.cases as unknown as Record<string, Reference>,
  "0002-W7": w7.cases as unknown as Record<string, Reference>,
};
it.each(
  Object.entries(sentences.cases).filter(
    ([key]) => !key.startsWith("compare/"),
  ),
)(
  "renders every plain sentence and scans Plan and Export: %s",
  async (key, rawExpected) => {
    const expected = rawExpected as Expected;
    const [group, id] = key.split("/");
    const reference = references[group]?.[id];
    const sample = samples.find((sample) => sample.name === id) ?? {
      label: "Your figures",
      json: JSON.stringify(reference.result.household_input),
    };
    const input = reference ? reference.result.household_input! : sample.json;
    const built = build(input);
    stub(built);
    const draft = createDraft(
      typeof input === "string" ? input : JSON.stringify(input),
    );
    const plan = render(
      <>
        {reference && (
          <IntakeHead
            result={reference.result}
            answers={reference.answers}
            change={() => {}}
            changed={
              group === "0002-W7" && id === "ranged-spending-70000"
                ? ["spending_in_retirement"]
                : []
            }
          />
        )}
        <Plan
          sample={sample}
          draft={draft}
          back={() => {}}
          intake={!!reference}
          answerResult={reference?.result}
        />
      </>,
    );
    await vi.waitFor(() =>
      expect(plan.container.querySelectorAll('[role="status"]')).toHaveLength(
        0,
      ),
    );
    if (expected.headline)
      expect(text(plan.container.querySelector("h1"))).toBe(expected.headline);
    if (expected.status)
      expect(text(plan.container.querySelector(".status"))).toBe(
        expected.status,
      );
    if (id === "two-person") {
      plain(plan.container);
      return;
    }
    expect(text(plan.container.querySelector(".amounts-note"))).toBe(
      expected.amounts_note,
    );
    expect(text(plan.container.querySelector(".follow-on")) || null).toBe(
      expected.follow_on,
    );
    expect(
      text(plan.container.querySelector(".moves-most"))?.replace(
        / See what would help$/,
        "",
      ) || null,
    ).toBe(expected.moves_most);
    expect(text(plan.container.querySelector(".why-short p")) || null).toBe(
      expected.why_short,
    );
    expect(
      [...plan.container.querySelectorAll(".plan-status li")]
        .map(text)
        .filter((line) => !line.startsWith("This plan")),
    ).toEqual(expected.left_out);
    const uncertainty = [
      ...plan.container.querySelectorAll(
        ".answers-could-change li, .not-sure-line",
      ),
    ].map(text);
    if ("answers_could_change" in expected)
      expect(uncertainty.length ? uncertainty : null).toEqual(
        expected.answers_could_change,
      );
    if (reference)
      expect(plan.container.querySelectorAll(".status")).toHaveLength(1);
    plain(plan.container);
    const metadata = built.run.metadata;
    expect(
      `Open source (AGPL-3.0-only) · Your answers stay on this device. Forget my answers · ${footerRules(metadata.rule_set_year, metadata.model_version)}`,
    ).toBe(expected.footer);
    plan.unmount();
    const exported = render(
      <Export
        sample={sample}
        draft={draft}
        copies={null}
        cache={new Map()}
        opened={() => {}}
        answers={reference?.answers}
        answerResult={reference?.result}
      />,
    );
    await vi.waitFor(() =>
      expect(exported.container.querySelector(".download-button")).toBeTruthy(),
    );
    expect(text(exported.container.querySelector(".eyebrow"))).toContain(
      expected.export_date,
    );
    expect(
      text(exported.container.querySelector(".plan-summary > .help")),
    ).toContain(expected.export_summary_date);
    const lines = [
      ...exported.container.querySelectorAll(
        ".export-story > p:not(.amounts-note)",
      ),
    ].map(text);
    if (expected.export_lines) expect(lines).toEqual(expected.export_lines);
    else
      expect(
        lines.at(-1) === expected.follow_on || expected.follow_on == null,
      ).toBe(true);
    plain(exported.container);
    expect(
      vi.mocked(engine.call).mock.calls.some(([op]) => op === "input_impact"),
    ).toBe(false);
  },
  60000,
);
it("renders the reference comparison, all 550 line bases and yearly totals", () => {
  const base = build(samples[0].json),
    laterPath = join(
      root,
      "packages/app/fixtures/answers-working-61-retire-later.json",
    ),
    later = build(
      laterPath.startsWith("{")
        ? laterPath
        : JSON.parse(readFixture(laterPath)),
    );
  const comparison = JSON.parse(
    native("compare", "answers-working-61", "answers-working-61-retire-later"),
  ) as Comparison;
  const lever = base.levers.levers.find((l) => l.id === "retire_later")!;
  const copy = {
    lever,
    ...copyLabels(lever, base.run),
    comparison,
    spending: later.spending,
    input: readFixture(laterPath),
  };
  const { container } = render(
    <Compare
      sample={samples[0]}
      copies={{ input: samples[0].json, baseline: base, items: [copy] }}
      copy={copy}
      select={() => {}}
      newCopy={() => {}}
      back={() => {}}
    />,
  );
  const expected =
    sentences.cases["compare/answers-working-61-vs-retire-later"];
  expect(text(container.querySelector(".changed-inputs p"))).toBe(
    expected.what_changed,
  );
  expect(
    text(container.querySelector(".plan-detail:not(.experts) summary .help")),
  ).toBe(expected.differences_hint);
  for (const [i, row] of [
    ...container.querySelectorAll(".headline-differences tbody tr"),
  ].entries()) {
    const cells = [...row.children].map(text);
    expect(cells[0].replace(/a year$/, "")).toBe(expected.differences[i][0]);
    expect(cells.slice(1, 3)).toEqual(expected.differences[i].slice(1, 3));
    if (expected.differences[i][3])
      expect(cells[4]).toBe(expected.differences[i][3]);
  }
  expect(
    [
      ...container.querySelectorAll(
        ".experts > .detail-body > .table-scroll tbody tr",
      ),
    ].map((row) => [
      text(row.children[0]),
      text(row.children[1]),
      text(row.children[2]),
      text(row.children[4]),
    ]),
  ).toEqual(expected.totals_across_years);
  expect(text(container.querySelector(".expert-section > p"))).toBe(
    expected.every_line,
  );
  const bases = [
    ...container.querySelectorAll(".line-differences tbody tr"),
  ].map((row) => text(row.children[2]));
  expect(bases.filter((v) => v === "today's")).toHaveLength(
    expected.every_line_today,
  );
  expect(bases.filter((v) => v === "of each year")).toHaveLength(
    expected.every_line_of_each_year,
  );
  plain(container);
}, 60000);
const readFixture = (path: string) => readFileSync(path, "utf8");
it("covers spending cap, exact spending, retirement beyond the plan and an empty moves list on rendered results", async () => {
  for (const kind of ["cap", "exact", "outside", "empty"] as const) {
    const built = build(samples[0].json);
    if (kind === "cap") built.spending.flag = "at_or_above_cap";
    if (kind === "exact") built.spending.headroom = 0;
    if (kind === "empty") built.levers.what_moves_most = [];
    built.replies.spend = JSON.stringify(built.spending);
    built.replies.levers = JSON.stringify(built.levers);
    const input = JSON.parse(samples[0].json);
    if (kind === "outside")
      input.household.persons[0].retirement_date = "2100-01-01";
    stub(built);
    const { container, unmount } = render(
      <Plan
        sample={samples[0]}
        draft={createDraft(JSON.stringify(input))}
        back={() => {}}
      />,
    );
    await vi.waitFor(() =>
      expect(container.querySelector(".amounts-note")).toBeTruthy(),
    );
    if (kind === "cap")
      expect(text(container.querySelector(".follow-on"))).toBe(
        "You could spend at least $10,000,000 a year and savings would still last to 95.",
      );
    if (kind === "exact")
      expect(text(container.querySelector(".follow-on"))).toBe(
        "$67,000 a year is exactly what you could spend for savings to last to 95.",
      );
    if (kind === "outside")
      expect(text(container.querySelector(".follow-on"))).toBe(
        "Your retirement falls after the plan ends, so there is no retirement spending to test.",
      );
    if (kind === "empty")
      expect(container.querySelector(".moves-most")).toBeNull();
    unmount();
    vi.restoreAllMocks();
  }
}, 60000);
it("covers singular and null spreads, spending spreads and saved not-sure filtering", () => {
  const source = w5.cases[
    "v2-solve-retirement-with-range"
  ] as unknown as Reference;
  for (const spread of [1, null]) {
    const result = structuredClone(source.result);
    result.bounds!.ranked[0].spread = spread;
    const change = vi.fn();
    const { container, unmount } = render(
      <IntakeHead result={result} answers={source.answers} change={change} />,
    );
    const expected =
      spread === 1
        ? "Your spending in retirement (a range) could change the earliest age by as much as 1 year between its low and high ends."
        : "Your spending in retirement (a range) could change this a lot: at one end, no age works.";
    expect(
      text(container.querySelector(".answers-could-change li > span")),
    ).toBe(expected);
    fireEvent.click(
      within(container.querySelector(".answers-could-change")!).getByRole(
        "button",
        { name: "Narrow it" },
      ),
    );
    expect(change).toHaveBeenCalledWith("15");
    unmount();
  }
  const result = structuredClone(source.result);
  result.solved!.answer = "spending_in_retirement";
  result.bounds!.ranked[0].spread = 123450;
  expect(answersCouldChange(result, source.answers).ranges[0].text).toBe(
    "Your spending in retirement (a range) could change what you could spend by as much as $1,235 a year between its low and high ends.",
  );
  const ranged = w5.cases["v2-range-nothing-solved"] as unknown as Reference;
  const answers = {
    ...ranged.answers,
    not_sure: [
      "savings",
      "spending_in_retirement",
      "pay",
      "pension",
      "social_security",
    ],
  };
  expect(answersCouldChange(ranged.result, answers, ["pay"]).notSure).toBe(
    "You weren't sure of your pension and your Social Security. A closer figure would make the plan more certain.",
  );
});
it("formats comparison boundaries and whole-year retirement ages, including leap days and dates beyond the plan", () => {
  expect(compareAmount(53, true)).toBe("less than $1");
  expect(compareAmount(0, true)).toBe("$0");
  expect(plannedSpending(0)).toBe("exactly enough");
  expect(signedCents(0)).toBe("Same");
  expect(signedDollars(0)).toBe("Same");
  const comparison = {
    changed_inputs: [
      {
        path: "/household/persons/0/retirement_date",
        baseline: "2031-02-27",
        scenario: "2031-02-28",
      },
    ],
  } as unknown as Comparison;
  expect(changedInputs(comparison, "2031-02-28", "1964-02-29")).toBe(
    "What changed: Retire at 67 instead of 66.",
  );
  comparison.changed_inputs[0] = {
    path: "/household/persons/0/retirement_date",
    baseline: "2030-03-10",
    scenario: "2031-03-10",
    change: "modified",
  };
  expect(changedInputs(comparison, "2031-03-10", "1965-03-10")).toBe(
    "What changed: Retire at 66 instead of 65.",
  );
  expect(plainLeftOut("An unknown synthetic item")).toBe(
    "An unknown synthetic item",
  );
});

it("exports the displayed worked-out headline while retaining saved not-sure answers", async () => {
  const original = structuredClone(
    w5.cases["v2-solve-savings"].answers,
  ) as AnswersV2;
  original.not_sure = ["pay"];
  const shown = { ...original, retirement: { age: 70 }, not_sure: [] };
  const dir = mkdtempSync(join(tmpdir(), "horizon-plain-answers-"));
  const path = join(dir, "answers.json");
  writeFileSync(path, JSON.stringify(shown));
  let result: AnswersPlanV2;
  try {
    result = JSON.parse(native("intake", path));
  } finally {
    rmSync(dir, { recursive: true });
  }
  const built = build(result.household_input!);
  stub(built);
  const { container } = render(
    <>
      <IntakeHead
        result={result}
        answers={shown}
        savedAnswers={original}
        change={() => {}}
      />
      <Export
        sample={{ label: "Your figures" }}
        draft={createDraft(JSON.stringify(result.household_input))}
        copies={null}
        cache={new Map()}
        opened={() => {}}
        answers={original}
        headAnswers={shown}
        answerResult={result}
      />
    </>,
  );
  await vi.waitFor(() =>
    expect(container.querySelector(".download-button")).toBeTruthy(),
  );
  const headline = text(
    container.querySelector('[data-testid="intake-headline"]'),
  );
  expect(headline).toMatch(/ saved to retire at 70\.$/);
  expect(text(container.querySelector(".export-story > p"))).toBe(headline);
  expect(
    [...container.querySelectorAll(".plan-detail .summary-not-sure li")].map(
      text,
    ),
  ).toEqual(["your pay"]);
}, 60000);
