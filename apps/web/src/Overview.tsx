// SPDX-License-Identifier: AGPL-3.0-only
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
}: {
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
      <section className="card next-steps">
        <h2>What to do next</h2>
        <ol>
          <li>
            See each year. The chart marks what happens when; choose a year to
            see its numbers.{" "}
            <button className="link-button" onClick={() => actions.plan()}>
              Open the plan
            </button>
          </li>
          {!copy && (
            <li>
              Try a change. It opens as a copy; your plan stays as it is.{" "}
              <button className="link-button" onClick={actions.tryChange}>
                Try a change
              </button>
            </li>
          )}
          <li>
            Compare your plans side by side.{" "}
            {actions.copies > 0 ? (
              <button className="link-button" onClick={actions.compare}>
                Compare {actions.copies + 1} plans
              </button>
            ) : (
              <span className="help">Try a change first.</span>
            )}
          </li>
          <li>
            Keep a summary. Print it, save it as a PDF or keep a file Horizon
            can reopen.{" "}
            <button className="link-button" onClick={actions.summary}>
              Get the summary
            </button>
          </li>
          {intake && (
            <li>
              Change an answer. Your answers stay on this device.{" "}
              <button className="link-button" onClick={actions.changeAnswers}>
                Change your answers
              </button>
            </li>
          )}
        </ol>
      </section>
    </>
  );
}
