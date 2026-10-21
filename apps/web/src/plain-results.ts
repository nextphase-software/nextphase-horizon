// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { Run } from "./generated/types/run-output.v2";
import { wholeDollars } from "./compare-display";
import { dateWords } from "./intake-fields";
import { rangeName } from "./intake-head";
import { centsDollars, firstShortfall } from "./plan-display";

const leftOut: Record<string, string> = {
  "state tax not modeled": "State income tax isn't counted.",
  "alternative minimum tax not modeled":
    "The alternative minimum tax isn't counted.",
  "taxable-account dividends and interest not modeled":
    "Dividends and interest in a brokerage account aren't taxed each year.",
  "itemized deductions and credits not modeled":
    "Itemized deductions and tax credits aren't counted.",
  "federal income tax not modeled": "Federal income tax isn't counted.",
  "contributions not modeled": "New savings while you work aren't added.",
  "healthcare not modeled": "Healthcare costs aren't counted separately.",
  "tax funding did not converge":
    "In some years the tax on withdrawals couldn't be settled exactly.",
  "net investment income tax not modeled":
    "The 3.8% tax on investment income isn't counted.",
  "still-working distribution exception not modeled":
    "Required withdrawals aren't delayed while you still work.",
  "early-distribution exceptions not modeled":
    "Exceptions to the early-withdrawal penalty aren't applied.",
  "Roth early-withdrawal ordering not modeled":
    "Roth early-withdrawal rules aren't applied.",
};
export const plainLeftOut = (text: string) => leftOut[text] ?? text;
export const estimatesNote =
  "These are estimates from the figures and starting values shown, not predictions.";
export const amountsNote = (date: string) =>
  `Amounts are in today's dollars (${date.slice(0, 4)} dollars).`;
export const plainDate = dateWords;
export const footerRules = (year: number, version: string) =>
  `Federal tax rules for ${year}, with tax brackets rising each year after · Horizon engine ${version.replace(/^horizon-engine-/, "")}`;
export function whyShort(
  run: Run,
  retirementDate: string,
  result?: AnswersPlanV2,
) {
  if (result?.solved?.flag === "unreachable") return null;
  const short = firstShortfall(run);
  return short
    ? `In ${short.year}, at ${short.age_on_december_31}, ${short.year < Number(retirementDate.slice(0, 4)) ? "before you retire, " : ""}your savings run out: ${centsDollars(short.ledger.shortfall_today!.cents)} of that year's spending isn't covered.`
    : null;
}
export function answerName(answer: string, result: AnswersPlanV2) {
  return answer === "savings" ? "your savings" : rangeName(answer, result);
}
export function answersCouldChange(
  result: AnswersPlanV2,
  answers: AnswersV2,
  changed: string[] = [],
) {
  const ranked = result.bounds?.ranked ?? [];
  if (result.what_if?.savings_total_cents != null)
    changed = [...changed, "savings"];
  const ranges = ranked.map((item) => {
    const name = answerName(item.answer, result).replace(/^./, (c) =>
      c.toUpperCase(),
    );
    let effect: string;
    if (item.spread == null)
      return {
        answer: item.answer,
        text: `${name} (a range) could change this a lot: at one end, no ${result.solved?.answer === "retirement" ? "age" : "amount"} works.`,
      };
    switch (result.solved?.answer) {
      case "retirement":
        effect = `the earliest age by as much as ${item.spread} ${item.spread === 1 ? "year" : "years"}`;
        break;
      case "savings":
        effect = `the savings needed by as much as ${centsDollars(item.spread)}`;
        break;
      case "spending_in_retirement":
        effect = `what you could spend by as much as ${centsDollars(item.spread)} a year`;
        break;
      default:
        effect = `how much you're short or have to spare by as much as ${wholeDollars(item.spread)} a year`;
    }
    return {
      answer: item.answer,
      text: `${name} (a range) could change ${effect} between its low and high ends.`,
    };
  });
  const notSure = (answers.not_sure ?? [])
    .filter(
      (answer) =>
        !changed.some(
          (key) =>
            answer === key ||
            (key === "savings" && answer.startsWith("savings")),
        ) &&
        !ranked.some(
          (item) =>
            item.answer === answer ||
            (answer === "savings" && item.answer.startsWith("savings")),
        ),
    )
    .map((answer) => answerName(answer, result));
  const list =
    notSure.length < 2
      ? notSure[0]
      : `${notSure.slice(0, -1).join(", ")} and ${notSure.at(-1)}`;
  return {
    ranges,
    notSure: notSure.length
      ? `You weren't sure of ${list}. A closer figure would make the plan more certain.`
      : null,
  };
}
