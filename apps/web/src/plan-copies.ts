// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import type { Levers, Lever } from "./generated/types/levers.v1";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Comparison } from "./generated/types/comparison.v2";
import type { Failure } from "./Answer";
import type { Dispatch, SetStateAction } from "react";
import { engine } from "./engine";
import { centsDollars, yearAtDate } from "./plan-display";
import { percentEntry } from "./entry";

export type Baseline = {
  run: Run;
  spending: SustainableSpending;
  levers: Levers;
};
export type PlanCopy = {
  lever: Lever;
  name: string;
  subject: string;
  input?: string;
  comparison?: Comparison;
  spending?: SustainableSpending;
  error?: Failure;
  transport?: string;
};
export type Copies = { input: string; baseline: Baseline; items: PlanCopy[] };

export function copyLabels(lever: Lever, run: Run) {
  const value = lever.changes[0].value;
  switch (lever.id) {
    case "retire_earlier":
    case "retire_later": {
      const age = yearAtDate(run, String(value))!.age_on_december_31;
      return { name: `Retire at ${age}`, subject: `Retiring at ${age}` };
    }
    case "spend_lower":
    case "spend_higher": {
      const amount = centsDollars(Number(value));
      return {
        name: `Spend ${amount} a year`,
        subject: `Spending ${amount} a year in retirement`,
      };
    }
    default: {
      const rate = percentEntry(String(value));
      return {
        name: `Returns at ${rate}%`,
        subject: `With returns at ${rate}%`,
      };
    }
  }
}

// Store the engine's scenario bytes, never apply a financial patch in the UI.
// Identity checks keep late replies from restoring copies after an input edit.
export async function calculateCopy(
  input: string,
  baseline: Baseline,
  copy: PlanCopy,
  setCopies: Dispatch<SetStateAction<Copies | null>>,
) {
  function update(patch: Partial<PlanCopy>) {
    setCopies((previous) =>
      previous?.baseline === baseline
        ? {
            ...previous,
            items: previous.items.map((item) =>
              item.lever.id === copy.lever.id ? { ...item, ...patch } : item,
            ),
          }
        : previous,
    );
  }
  try {
    const scenario = await engine.call(
      "scenario",
      input,
      JSON.stringify(copy.lever.changes),
    );
    const result = JSON.parse(scenario);
    if ("code" in result) {
      update({ error: result });
      return;
    }
    update({ input: scenario });
    await Promise.all([
      engine.call("compare", input, scenario).then((json) => {
        const result = JSON.parse(json);
        update("code" in result ? { error: result } : { comparison: result });
      }),
      engine.call("sustainable_spending", scenario).then((json) => {
        const result = JSON.parse(json);
        update("code" in result ? { error: result } : { spending: result });
      }),
    ]);
  } catch (error) {
    update({ transport: (error as Error).message });
  }
}
