// SPDX-License-Identifier: AGPL-3.0-only
import type { Options as OptionsData } from "./plan-options";
import { Options } from "./Options";
import { YourPlans } from "./YourPlans";
import { NextSteps } from "./NextSteps";
import type { CopyChange, PlanCopy } from "./plan-copies";
import type { Baseline } from "./plan-copies";
import type { Figure } from "./shell-display";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { followOn, movesMost } from "./plan-answers";
import { whyShort, amountsNote, plainLeftOut } from "./plain-results";
import { statusWord } from "./format";
import { assumptionNames } from "./plan-display";
import { percentEntry } from "./entry";
import { SavingsDrawing } from "./PlanCharts";
import { HeadlineFigures, ThisYear } from "./PlanShell";
export type OverviewActions = {
  plan: (chart?: boolean) => void;
  compare: () => void;
  summary: () => void;
  changeAnswers: () => void;
  tryChange: () => void;
  copies: number;
  options?: () => void;
  openCopy?: (id: string) => void;
};
export function Overview({
  baseline,
  figures,
  note,
  name,
  retirement,
  answer,
  intake,
  copy,
  actions,
  options,
  copies = [],
  tryOption,
}: {
  options?: OptionsData | null;
  copies?: PlanCopy[];
  tryOption?: (change: CopyChange) => void;
  baseline: Baseline;
  figures: Figure[] | null;
  note: string;
  name: string;
  retirement: string;
  answer?: AnswersPlanV2;
  intake: boolean;
  copy: boolean;
  actions: OverviewActions;
}) {
  const { run, spending, levers } = baseline;
  return (
    <>
      {figures && (
        <HeadlineFigures figures={figures} name={name} note={note} tiles />
      )}
      <div className="overview-grid">
        <section className="card plan-answer">
          <h2>Your answer</h2>
          {followOn(run, spending, retirement, answer) && (
            <p className="follow-on">
              {followOn(run, spending, retirement, answer)}
            </p>
          )}
          {whyShort(run, retirement, answer) && (
            <p className="why-short">{whyShort(run, retirement, answer)}</p>
          )}
          {movesMost(levers) && (
            <p className="moves-most">{movesMost(levers)}</p>
          )}
          <p className="help amounts-note">{amountsNote(run.valuation_date)}</p>
          <button className="link-button" onClick={() => actions.plan()}>
            See the plan
          </button>
        </section>
        <section className="card overview-savings">
          <h2>Savings by age</h2>
          <figure>
            <SavingsDrawing run={run} retirementDate={retirement} compact />
            <figcaption>
              Savings at the end of each year, today's dollars.
            </figcaption>
          </figure>
          <button className="link-button" onClick={() => actions.plan(true)}>
            Open the chart
          </button>
        </section>
        {options && (
          <Options
            options={options}
            copies={copies}
            tryOption={tryOption}
            openCopy={actions.openCopy}
            overview
            seeAll={actions.options}
          />
        )}
        <ThisYear run={run} />
        {!intake && (
          <section className="card overview-left-out">
            <h2>What this result doesn't count</h2>
            <span className={`status ${run.status}`}>
              <span aria-hidden="true">
                {run.status === "complete" ? "✓" : "△"}
              </span>{" "}
              {statusWord(run.status, run.omissions.length)}
            </span>
            {run.status === "complete" && run.omissions.length > 0 && (
              <p>
                Your situation is covered, but Horizon doesn't count these yet:
              </p>
            )}
            {run.omissions.length ? (
              <ul>
                {run.omissions.map((item) => (
                  <li key={item}>{plainLeftOut(item)}</li>
                ))}
              </ul>
            ) : (
              <p>Nothing is left out.</p>
            )}
          </section>
        )}
        <section className="card overview-assumptions">
          <h2>What Horizon assumes</h2>
          <ul>
            {run.assumptions_used.map((rate) => (
              <li key={rate.identifier}>
                {assumptionNames[rate.identifier]}: {percentEntry(rate.value)}%
                a year
              </li>
            ))}
          </ul>
          <p>Estimates, not facts.</p>
          {!copy && (
            <button
              className="link-button"
              onClick={intake ? actions.changeAnswers : actions.tryChange}
            >
              {intake ? "Change these" : "Try a change"}
            </button>
          )}
        </section>
      </div>
      {!copy && (
        <YourPlans
          baseline={baseline}
          copies={copies}
          select={actions.openCopy}
        />
      )}
      <NextSteps
        actions={{ ...actions, options: actions.options ?? (() => {}) }}
        copies={actions.copies}
        hasOptions={!!options && !options.none}
        overview
        own={intake}
        copy={copy}
      />
    </>
  );
}
