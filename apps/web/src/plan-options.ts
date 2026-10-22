// SPDX-License-Identifier: AGPL-3.0-only
import type { Baseline, CopyChange } from "./plan-copies";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import {
  centsDollars,
  endAge,
  firstShortfall,
  leverLabel,
} from "./plan-display";
import { outsidePlan } from "./plan-answers";
import { wholeDollars } from "./compare-display";
import { percentEntry } from "./entry";

export type PlanOption = {
  title: string;
  effect: string;
  mark: string;
  try: CopyChange | null;
};
export type Options = {
  heading: string;
  intro: string;
  items: PlanOption[];
  none?: string;
  returns_heading: string;
  returns: string[];
};
export function planOptions(
  { run, spending: s, levers }: Baseline,
  retirement: string,
  answer?: AnswersPlanV2,
  copy = false,
): Options | null {
  if (copy || answer?.solved || outsidePlan(run, retirement)) return null;
  const end = endAge(run),
    short = firstShortfall(run);
  const options: Options = {
    heading: "Ways to make your savings last",
    intro: `Each is one change, worked out by Horizon from your figures${answer?.bounds ? " at the middle of your ranges" : ""}. They are options to explore, not advice.`,
    items: [],
    returns_heading: "What you can't choose: investment returns",
    returns: [],
  };
  const lasts = (headroom: number) =>
    `savings last to ${end}${headroom > 0 ? `, with ${wholeDollars(headroom)} a year to spare` : ""}`;
  const base = percentEntry(
    run.assumptions_used.find((r) => r.identifier === "investment_return")!
      .value,
  );
  for (const id of ["return_lower", "return_higher"]) {
    const lever = levers.levers.find((l) => l.id === id);
    if (lever)
      options.returns.push(
        `If returns were ${percentEntry(String(lever.changes[0].value))}% a year instead of ${base}%: ${lever.first_shortfall_age == null ? lasts(lever.headroom) : `savings run short at ${lever.first_shortfall_age}`}.`,
      );
  }
  if (s.flag === "shortfall_with_no_retirement_spending") {
    options.none =
      short && short.year < Number(retirement.slice(0, 4))
        ? `None of the changes Horizon can try fixes this on its own. Savings run short at ${short.age_on_december_31}, before you retire, so a later retirement or lower retirement spending can't reach it.`
        : "None of the changes Horizon can try fixes this on its own: savings run short even with no spending in retirement.";
    return options;
  }
  const spend = (title: string, effect: string, mark = "") =>
    options.items.push({
      title,
      effect,
      mark,
      try: {
        id: "spend_to_last",
        changes: [
          {
            path: "/household/spending/after_retirement/cents",
            value: s.sustainable_spending * 100,
          },
        ],
      },
    });
  if (s.flag === "at_or_above_cap") {
    options.heading = "Your savings last. Ways to use the room";
    options.items.push({
      title: "Spend more in retirement",
      effect: `You could spend at least ${wholeDollars(s.cap)} a year and savings would still last to ${end}.`,
      mark: "",
      try: null,
    });
  } else if (s.headroom < 0) {
    spend(
      `Spend ${wholeDollars(s.sustainable_spending)} a year in retirement`,
      `Savings last to ${end}. That's ${wholeDollars(-s.headroom)} a year less than the ${wholeDollars(s.entered)} you plan.`,
      "✓",
    );
    for (const id of levers.ranking) {
      const lever = levers.levers.find((l) => l.id === id)!;
      if (
        lever.kind !== "retirement_date" ||
        lever.effect <= 0 ||
        (lever.first_shortfall_age != null &&
          lever.first_shortfall_age <= (short?.age_on_december_31 ?? Infinity))
      )
        continue;
      options.items.push({
        title: leverLabel(lever, run),
        effect:
          lever.first_shortfall_age == null
            ? `${lasts(lever.headroom).replace(/^s/, "S")}.`
            : `Savings run short later, at ${lever.first_shortfall_age} instead of ${short!.age_on_december_31}.`,
        mark: lever.first_shortfall_age == null ? "✓" : "△",
        try: lever,
      });
    }
    return options;
  } else {
    options.heading =
      s.headroom === 0
        ? "Your plan spends exactly what your savings can carry"
        : "Your savings last. Ways to use the room";
    if (s.headroom > 0)
      spend(
        `Spend up to ${wholeDollars(s.sustainable_spending)} a year in retirement`,
        `Savings would still last to ${end}, but only just. That's ${wholeDollars(s.headroom)} a year more than you plan.`,
      );
  }
  const earlier = levers.levers.find((l) => l.id === "retire_earlier");
  if (earlier && earlier.first_shortfall_age == null)
    options.items.push({
      title: leverLabel(earlier, run),
      effect: `Savings still last to ${end}${earlier.headroom > 0 ? `, with ${wholeDollars(earlier.headroom)} a year to spare` : ""}.`,
      mark: "",
      try: earlier,
    });
  const left = run.years.at(-1)!.ledger.total_closing_today!.cents;
  options.items.push({
    title: "Keep your plan as it is",
    effect:
      left > 0
        ? `${centsDollars(left)} would be left at ${end}, in today's dollars.`
        : `Savings last to ${end}.`,
    mark: "",
    try: null,
  });
  return options;
}
