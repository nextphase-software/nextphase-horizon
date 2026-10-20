// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import reference from "../../../docs/briefs/0002-W5-reference-values.json";
import sentences from "../../../docs/briefs/0002-W6-head-sentences.json";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import { IntakeHead } from "./IntakeHead";
afterEach(cleanup);
const text = (element: Element | null) =>
  element?.textContent?.trim().replace(/\s+/g, " ") ?? "";
it.each(Object.entries(sentences.cases))(
  "renders the exact head sentences for %s",
  (name, expected) => {
    const c = reference.cases[name as keyof typeof reference.cases];
    const result = c.result as AnswersPlanV2;
    const { container } = render(
      <IntakeHead
        result={result}
        answers={c.answers as AnswersV2}
        change={() => {}}
      />,
    );
    const actual = [`H: ${text(container.querySelector("h1"))}`];
    const under = [...container.querySelectorAll(".head-line")].map(text);
    if (result.status === "incomplete") {
      if (result.needed.length > 1)
        actual.push(...under.map((line) => `   ${line}`));
      for (const li of container.querySelectorAll(".still-to-add li"))
        actual.push(`   - ${text(li.querySelector("span"))}`);
      if (result.needed.length === 1 && result.needed[0] === "retirement")
        actual.push(`   ${text(container.querySelector(".still-to-add > p"))}`);
    } else if (result.status === "unsupported")
      actual.push(
        `   ${text(container.querySelector(".status"))}. ${text(container.querySelector(".card > p"))}`,
      );
    else if (result.status === "invalid")
      actual.push(`   (${text(container.querySelector(".help"))})`);
    else {
      const bound = under.filter(
        (line) =>
          line.startsWith("Given your ranges") ||
          line.startsWith("Your ranges pull"),
      );
      actual.push(
        ...under
          .filter((line) => !bound.includes(line))
          .map((line) => `   ${line}`),
      );
      if (result.solved)
        actual.push(`   [${text(container.querySelector(".rough-label"))}]`);
      actual.push(...bound.map((line) => `   ${line}`));
      const status = text(container.querySelector(".plan-status .status"));
      actual.push(
        `   ${status}  [details: ${text(container.querySelector(".plan-status summary"))}${result.status === "complete" ? `: ${result.central!.omissions.length}` : ""}]`,
      );
      for (const line of container.querySelectorAll(".left-out-line"))
        actual.push(`   GAP: ${text(line)}`);
      if (result.bounds) {
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
    }
    expect(actual).toEqual(expected);
  },
);
