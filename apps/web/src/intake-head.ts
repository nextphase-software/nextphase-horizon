// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersPlanV2, LeftOut } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import { centsDollars, planHeadline } from "./plan-display";
import { percentEntry } from "./entry";
import { dateWords } from "./intake-fields";
export const neededLabels: Record<string, string> = {
  birth_date: "Your date of birth, or just your age",
  retirement: "When you plan to retire",
  savings: "Your savings",
  spending_in_retirement: "Your spending in retirement",
};
export const answerQuestion = (answer: string) =>
  answer.startsWith("assumptions.")
    ? "review"
    : answer.startsWith("savings")
      ? "13"
      : ({
          birth_date: "2",
          retirement: "4",
          plan_end_age: "5",
          pay: "6",
          social_security: "10",
          pension: "12",
          spending_now: "14",
          pay_and_spending_now: "6",
          spending_in_retirement: "15",
        }[answer.split(".")[0]] ?? "review");
export function leftOutText(item: LeftOut) {
  if (item.answer === "pay_and_spending_now")
    return "This plan doesn't include your pay or spending before you retire yet; it assumes your pay covers your spending until you retire.";
  const name = {
    social_security: "your Social Security",
    pension: "your pension",
    pay: "your pay before you retire",
    spending_now: "your spending before you retire",
  }[item.answer as "pay"];
  return `This plan doesn't include ${name} yet, so it ${item.direction === "too_optimistic" ? "may be too optimistic" : "is likely too pessimistic"}.`;
}
export function rangeName(answer: string, result: AnswersPlanV2) {
  const names: Record<string, string> = {
    pay: "your pay",
    spending_now: "your spending now",
    spending_in_retirement: "your spending in retirement",
    social_security: "your Social Security",
    pension: "your pension",
  };
  if (answer.startsWith("savings.accounts.")) {
    const account =
      result.household_input!.household.accounts[Number(answer.split(".")[2])];
    const kind =
      account.account_type === "tax_deferred"
        ? account.tax_deferred_kind === "traditional_ira"
          ? "traditional IRA"
          : "workplace plan"
        : { cash: "bank or cash", taxable: "brokerage", roth: "Roth" }[
            account.account_type
          ];
    return `the balance of your ${kind} account`;
  }
  return names[answer.split(".")[0]] ?? answer;
}
export function headText(result: AnswersPlanV2, answers: AnswersV2) {
  const lines: string[] = [];
  let headline: string;
  const { solved, bounds, central, household_input: input } = result;
  const end = input?.household.persons[0].plan_end_age;
  if (result.status === "incomplete") {
    headline =
      result.needed[0] === "birth_date"
        ? "We need your age first."
        : result.needed.length === 1 && result.needed[0] === "retirement"
          ? "We need to know when you plan to retire."
          : "Horizon can work out one of these for you.";
    if (result.needed.length > 1)
      lines.push("Give any of these, and Horizon works out the last one:");
    return { headline, lines };
  }
  if (result.status === "unsupported")
    return {
      headline: "Horizon can't plan for this yet.",
      lines: [],
    };
  if (result.status === "invalid")
    return {
      headline: "Something in your answers needs another look.",
      lines: [],
    };
  if (!central || !input)
    throw new Error(
      "A successful answers result must include its household input and central result.",
    );
  const spending = centsDollars(
    input.household.spending.after_retirement.cents,
  );
  const plain = () =>
    planHeadline({
      first_shortfall_age: central.first_shortfall_age ?? null,
      plan_end_age: end!,
    });
  if (solved) {
    const value =
      solved.value == null
        ? ""
        : solved.unit === "age"
          ? String(solved.value)
          : centsDollars(solved.value);
    if (solved.answer === "spending_in_retirement") {
      if (solved.flag === "shortfall_with_no_retirement_spending")
        headline = `Your savings run short before you retire, at ${central.first_shortfall_age}, even with no spending in retirement.`;
      else {
        headline =
          solved.flag === "at_or_above_cap"
            ? "You could spend at least $10,000,000 a year in retirement."
            : `You could spend up to ${value} a year in retirement.`;
        lines.push(
          `Your savings would then last to ${end}, the end of the plan.`,
        );
      }
    } else if (solved.answer === "savings") {
      if (solved.flag === "none_needed")
        headline = `You don't need savings for this plan: your income covers your spending to ${end}.`;
      else if (solved.flag === "unreachable")
        headline = `No amount of savings up to $100,000,000 would last to ${end} with this spending.`;
      else {
        headline = `You'd need about ${value} saved${!answers.retired && answers.retirement && "age" in answers.retirement ? ` to retire at ${answers.retirement.age}` : ""}.`;
        lines.push(
          `With spending of ${spending} a year in retirement, that would last to ${end}.`,
        );
      }
    } else {
      headline =
        solved.flag === "unreachable"
          ? `Your savings wouldn't last to ${end} at any retirement age before ${end}.`
          : `The earliest you could retire is ${value}.`;
      if (solved.flag !== "unreachable")
        lines.push(
          `With spending of ${spending} a year in retirement, your savings would last to ${end}.`,
        );
    }
    if (bounds) {
      if (!bounds.ordered)
        lines.push(
          "Your ranges pull this in different directions, so Horizon shows the middle of each range.",
        );
      else if ("solved" in bounds.worse && "solved" in bounds.better) {
        const values = [
          bounds.worse.solved.value,
          bounds.better.solved.value,
        ].sort((a, b) => (a ?? Infinity) - (b ?? Infinity));
        const show = (v: number | null | undefined) =>
          solved.unit === "age" ? String(v) : centsDollars(v!);
        lines.push(
          values[1] == null
            ? `Given your ranges, from ${show(values[0])}; at the other end, none works.`
            : `Given your ranges, somewhere between ${show(values[0])} and ${show(values[1])}.`,
        );
      }
    }
  } else if (bounds?.ordered) {
    const w = bounds.worse.first_shortfall_age,
      b = bounds.better.first_shortfall_age;
    headline = bounds.worse.lasts_to_plan_end
      ? `Your savings last to ${end}, the end of the plan, at both ends of your ranges.`
      : bounds.better.lasts_to_plan_end
        ? `Savings last to somewhere between ${w} and ${end}.`
        : w === b
          ? `Savings run short at ${w} at both ends of your ranges.`
          : `Savings run short somewhere between ${w} and ${b}.`;
  } else {
    headline = plain();
    if (bounds)
      lines.push(
        "Your ranges pull the result in different directions, so this uses the middle of each range.",
      );
  }
  return { headline, lines };
}
export function startingText(
  result: AnswersPlanV2,
): { text: string; answer: string }[] {
  const values = result.starting_values
    .filter((item) => !item.answer.startsWith("assumptions."))
    .map((item) => {
      let text: string;
      if (item.answer === "plan_end_age")
        text = `The plan runs to age ${item.value}.`;
      else if (item.answer === "birth_date")
        text = `Your birthday is counted as ${dateWords(String(item.value), false)}.`;
      else if (item.answer === "savings")
        text =
          "Your savings are counted as a brokerage account with no gain to tax, so the plan may be too optimistic.";
      else if (item.answer.startsWith("social_security"))
        text = `Social Security starts at ${item.value}.`;
      else if (item.answer.startsWith("pension"))
        text =
          "Your pension is taken as staying the same, not rising with prices, so the plan is likely too pessimistic.";
      else
        text =
          "For your brokerage account, Horizon counts no gain to tax when you sell, so the plan may be too optimistic.";
      return { text, answer: item.answer };
    });
  const rates = [
    "inflation",
    "investment_return",
    "cash_return",
    "tax_indexing",
  ].flatMap((rate, index) => {
    const value = result.starting_values.find(
      (item) => item.answer === `assumptions.${rate}`,
    );
    return value
      ? [
          `${["Prices rise", "investments grow", "cash earns", "tax thresholds rise"][index]} ${percentEntry(String(value.value))}%${rate !== "cash_return" ? " a year" : ""}`,
        ]
      : [];
  });
  if (rates.length) {
    let text = rates.join("; ");
    text = text[0].toUpperCase() + text.slice(1);
    // Each printed rate is yearly; the group ends with the shared unit.
    if (!text.endsWith("a year")) text += " a year";
    values.push({ text: text + ".", answer: "assumptions.inflation" });
  }
  return values;
}
