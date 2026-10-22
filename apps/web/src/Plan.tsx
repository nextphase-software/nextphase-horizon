// SPDX-License-Identifier: AGPL-3.0-only
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import type { Failure } from "./Answer";
import { usePlanResults, type PlanCache } from "./plan-results";
import { followOn, movesMost } from "./plan-answers";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import {
  amountsNote,
  estimatesNote,
  plainLeftOut,
  whyShort,
} from "./plain-results";
import { formatDollars, statusWord } from "./format";
import { percentEntry } from "./entry";
import { serializeDraft, type Draft } from "./setup";
import {
  assumptionNames,
  centsDollars,
  direction,
  endAge,
  firstDistribution,
  firstShortfall,
  ledgerNotes,
  leverLabel,
  planHeadline,
  signedEffect,
  withdrawalWords,
  yearAtDate,
} from "./plan-display";
import { FlowDrawing, SavingsDrawing } from "./PlanCharts";
import type { Baseline } from "./plan-copies";
import { Overview, type OverviewActions } from "./Overview";
import { SavingsChart } from "./SavingsChart";
import { CopyBanner, ThisYear } from "./PlanShell";
import { headlineFigures, shellNote } from "./shell-display";
type LayoutProps = {
  overview?: OverviewActions;
  copy?: { name: string; back: () => void; compare: () => void };
  focusChart?: boolean;
  whatIf?: boolean;
};

export function Calculating() {
  return <p role="status">Calculating…</p>;
}
export function Detail({
  title,
  hint,
  children,
  detailRef,
  initiallyOpen = false,
}: {
  title: string;
  hint: string;
  children: ReactNode;
  detailRef?: RefObject<HTMLDetailsElement | null>;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      open={open}
      className={`card plan-detail${title === "Details for experts" ? " experts" : ""}`}
      ref={detailRef}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="detail-title">{title}</span>
        <span className="help">{hint}</span>
        <span className="detail-action">
          {open ? "Hide" : "Show"}
          <span aria-hidden="true"> {open ? "⌃" : "⌄"}</span>
        </span>
      </summary>
      <div className="detail-body">{children}</div>
    </details>
  );
}
function Views({
  name,
  chart,
  table,
}: {
  name: string;
  chart: ReactNode;
  table: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <>
      <div className="view-switch" role="group" aria-label={`${name} view`}>
        <button aria-pressed={!asTable} onClick={() => setAsTable(false)}>
          Chart
        </button>
        <button aria-pressed={asTable} onClick={() => setAsTable(true)}>
          Table
        </button>
      </div>
      {asTable ? table : chart}
    </>
  );
}
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Focus lets keyboard users scroll wide tables. */
export function ScrollTable({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={`${label} table, scrollable`}
    >
      {children}
    </div>
  );
}
/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
function LeverViews({ levers, run }: { levers: Levers; run: Run }) {
  const ranked = levers.ranking.map((id) =>
    levers.levers.find((lever) => lever.id === id)!,
  );
  const max = Math.max(1, ...ranked.map((lever) => Math.abs(lever.effect)));
  return (
    <>
      <Views
        name="What would help"
        chart={
          <div className="lever-chart">
            <p className="help">
              How much more or less you could spend each year after one change
            </p>
            {ranked.map((lever) => {
              const width = (Math.abs(lever.effect) / max) * 145;
              return (
                <div className="lever-row" key={lever.id}>
                  <span>{leverLabel(lever, run)}</span>
                  <svg aria-hidden="true" viewBox="0 0 320 30">
                    <line
                      className="event-line"
                      x1="160"
                      x2="160"
                      y1="0"
                      y2="30"
                    />
                    {lever.effect !== 0 && (
                      <rect
                        className="lever-bar"
                        x={lever.effect < 0 ? 160 - width : 160}
                        y="6"
                        width={width}
                        height="18"
                      />
                    )}
                  </svg>
                  <strong>
                    {lever.effect === 0
                      ? "No change"
                      : `${lever.effect > 0 ? "▲" : "▼"} ${formatDollars(Math.abs(lever.effect))} a year ${lever.effect > 0 ? "more" : "less"} you could spend`}
                  </strong>
                </div>
              );
            })}
          </div>
        }
        table={
          <ScrollTable label="What would help">
            <table>
              <caption>What would help</caption>
              <thead>
                <tr>
                  <th>Change</th>
                  <th>Savings</th>
                  <th>
                    How much more or less you could spend each year after one
                    change
                  </th>
                  <th>Better/Worse</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((lever) => (
                  <tr key={lever.id}>
                    <th scope="row">{leverLabel(lever, run)}</th>
                    <td>
                      {lever.first_shortfall_age == null
                        ? `lasts to ${endAge(run)}`
                        : `runs short at ${lever.first_shortfall_age}`}
                    </td>
                    <td className="amount">{signedEffect(lever.effect)}</td>
                    <td>{direction(lever.effect)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        }
      />
      <p className="help">
        Claiming Social Security later isn't shown yet: Horizon doesn't include
        the rules for claiming age.
      </p>
    </>
  );
}
function Ledger({ run, retirementDate }: { run: Run; retirementDate: string }) {
  const retired = yearAtDate(run, retirementDate);
  const distributions = firstDistribution(run);
  const short = firstShortfall(run);
  return (
    <Views
      name="Year by year"
      chart={
        <figure>
          <p>Savings at year end · dollars of each year</p>
          <SavingsDrawing run={run} retirementDate={retirementDate} nominal />
          <SavingsDrawing
            run={run}
            retirementDate={retirementDate}
            nominal
            compact
          />
          <p className="ledger-events">
            {[
              retired && `Retires at ${retired.age_on_december_31}`,
              distributions &&
                `Distributions from ${distributions.age_on_december_31}`,
              short &&
                `Runs short ${short.year} (age ${short.age_on_december_31})`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="flow-key">
            <span className="key-income">In: income</span>
            <span className="key-withdrawals">In: withdrawals</span>
            <span className="key-shortfall">Dashed box: shortfall</span>
            <span className="key-spending">Out: spending</span>
            <span className="key-tax">Out: federal tax</span>
          </div>
          <FlowDrawing run={run} />
          <FlowDrawing run={run} compact />
          <figcaption>
            Dollars of each year, not today's dollars. Each pair of columns is
            the money in and out that year; a dashed box is money short. The
            table lists every amount.
          </figcaption>
        </figure>
      }
      table={
        <ScrollTable label="Year by year">
          <table className="ledger-table">
            <caption>Year by year, dollars of each year</caption>
            <thead>
              <tr>
                {[
                  "Year",
                  "Age",
                  "Income",
                  "Spending",
                  "Withdrawals",
                  "Required distributions",
                  "Federal tax",
                  "Shortfall",
                  "Savings at year end",
                  "Note",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {run.years.map((row) => (
                <tr
                  key={row.year}
                  className={
                    row.ledger.shortfall.cents > 0 ? "shortfall-row" : undefined
                  }
                >
                  <th scope="row">{row.year}</th>
                  <td>{row.age_on_december_31}</td>
                  {[
                    row.ledger.income_total,
                    row.ledger.spending,
                    row.ledger.withdrawals_total,
                    row.ledger.rmd_total,
                    row.ledger.federal_tax?.paid,
                    row.ledger.shortfall,
                    row.ledger.total_closing,
                  ].map((line, index) => (
                    <td className="amount" key={index}>
                      {line ? centsDollars(line.cents) : "Unavailable"}
                    </td>
                  ))}
                  <td>{ledgerNotes(run, retirementDate, row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      }
    />
  );
}

export function Plan({
  sample,
  draft,
  back,
  tryChange,
  exportPlan,
  cache,
  intake = false,
  answerResult,
  overview,
  copy,
  focusChart,
  whatIf,
}: LayoutProps & {
  sample: { label: string };
  draft: Draft;
  back: () => void;
  tryChange?: (baseline: Baseline) => void;
  exportPlan?: () => void;
  cache?: PlanCache;
  intake?: boolean;
  answerResult?: AnswersPlanV2;
}) {
  return (
    <PlanResult
      key={`${overview ? "overview" : "plan"}:${serializeDraft(draft)}`}
      sample={sample}
      draft={draft}
      back={back}
      tryChange={tryChange}
      exportPlan={exportPlan}
      cache={cache}
      intake={intake}
      answerResult={answerResult}
      overview={overview}
      copy={copy}
      focusChart={focusChart}
      whatIf={whatIf}
    />
  );
}
function PlanResult({
  sample,
  draft,
  back,
  tryChange,
  exportPlan,
  cache,
  intake = false,
  answerResult,
  overview,
  copy,
  focusChart,
  whatIf,
}: LayoutProps & {
  sample: { label: string };
  draft: Draft;
  back: () => void;
  tryChange?: (baseline: Baseline) => void;
  exportPlan?: () => void;
  cache?: PlanCache;
  intake?: boolean;
  answerResult?: AnswersPlanV2;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const leversRef = useRef<HTMLDetailsElement>(null);
  const input = serializeDraft(draft);
  const { results, transport } = usePlanResults(input, cache);
  const isOverview = !!overview;
  const error = Object.values(results).find(
    (result): result is Failure => "code" in result,
  );
  const failed = !!error || !!transport;
  useEffect(() => {
    if (!intake && !focusChart) heading.current?.focus();
  }, [intake, isOverview, focusChart, failed]);
  if (error || transport)
    return (
      <div className="plan-screen">
        <h1 ref={heading} tabIndex={-1}>
          Plan
        </h1>
        {!intake && sample.label !== "Your figures" && (
          <p className="sample">
            {sample.label === "Opened plan file"
              ? "Opened plan file"
              : "◇ Example household — invented figures"}
          </p>
        )}
        <section className="card" role="alert">
          <h2 className="status unsupported">
            <span aria-hidden="true">!</span>{" "}
            {error ? statusWord(error.status) : "Calculation unavailable"}
          </h2>
          <p>{error?.message ?? transport}</p>
        </section>
        {!intake && <button onClick={back}>Back to household</button>}
      </div>
    );
  const run = results.run as Run | undefined;
  const spending = results.spending as SustainableSpending | undefined;
  const levers = results.levers as Levers | undefined;
  const fixture = JSON.parse(input);
  const household = fixture.household;
  const retirementDate: string = household.persons[0].retirement_date;
  const isRetired = retirementDate <= household.valuation_date;
  const retirement = run && yearAtDate(run, retirementDate);
  const short = run && firstShortfall(run);
  const distributions = run && firstDistribution(run);
  const inflation = run?.assumptions_used.find(
    (rate) => rate.identifier === "inflation",
  );
  return (
    <div className="plan-screen">
      {!intake && (
        <>
          <p className="eyebrow">
            {overview ? "OVERVIEW · " : ""}
            {copy
              ? `${sample.label.toUpperCase()} · COPY: ${copy.name.toUpperCase()}`
              : sample.label.toUpperCase()}
            {!overview &&
              !copy &&
              (isRetired
                ? " · RETIRED"
                : retirement
                  ? ` · RETIRE AT ${retirement.age_on_december_31}`
                  : "")}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {run ? planHeadline(run) : "Plan"}
          </h1>
          {sample.label !== "Your figures" && (
            <p className="sample">
              <span aria-hidden="true">◇</span>{" "}
              {sample.label === "Opened plan file"
                ? "Opened plan file"
                : "Example household — invented figures"}
            </p>
          )}
          {copy && <CopyBanner {...copy} />}
          {run && !overview ? (
            <div className="card plan-status" aria-live="polite">
              <div>
                <span className={`status ${run.status}`}>
                  <span aria-hidden="true">
                    {run.status === "complete" ? "✓" : "△"}
                  </span>{" "}
                  {statusWord(run.status, run.omissions.length)}
                </span>{" "}
              </div>
              <details>
                <summary>What this result doesn't count</summary>
                <ul>
                  {!run.omissions.length && <li>Nothing is left out.</li>}
                  {run.omissions.map((omission) => (
                    <li key={omission}>{plainLeftOut(omission)}</li>
                  ))}
                </ul>
              </details>
              <p className="help">{estimatesNote}</p>
            </div>
          ) : !run ? (
            <Calculating />
          ) : null}
        </>
      )}
      {overview ? (
        run && spending && levers ? (
          <Overview
            baseline={{ run, spending, levers }}
            figures={headlineFigures(
              run,
              spending,
              retirementDate,
              answerResult,
            )}
            name={
              copy ? `Copy: ${copy.name}` : whatIf ? "What if" : "Your plan"
            }
            note={shellNote(run, !!answerResult?.bounds)}
            retirement={retirementDate}
            answer={answerResult}
            intake={intake}
            copy={!!copy}
            actions={{
              ...overview,
              tryChange: () => tryChange?.({ run, spending, levers }),
            }}
          />
        ) : (
          <Calculating />
        )
      ) : (
        <>
          {run ? (
            <SavingsChart run={run} input={fixture} focus={focusChart} />
          ) : (
            <Calculating />
          )}
          <div className="card plan-answer">
            {run && spending ? (
              followOn(run, spending, retirementDate, answerResult) && (
                <p className="follow-on">
                  {followOn(run, spending, retirementDate, answerResult)}
                </p>
              )
            ) : (
              <Calculating />
            )}
            {levers ? (
              movesMost(levers) && (
                <p className="moves-most">
                  {movesMost(levers)}{" "}
                  <a
                    href="#plan-levers"
                    onClick={(event) => {
                      event.preventDefault();
                      if (leversRef.current) {
                        leversRef.current.open = true;
                        leversRef.current.querySelector("summary")?.focus();
                      }
                    }}
                  >
                    See what would help
                  </a>
                </p>
              )
            ) : (
              <Calculating />
            )}
            {run && (
              <p className="help amounts-note">
                {amountsNote(run.valuation_date)}
              </p>
            )}
          </div>
          <div id="plan-levers">
            <Detail
              title="What would help"
              hint={`One change at a time · ${levers ? `${levers.ranking.length} changes, ranked` : "Calculating…"}`}
              detailRef={leversRef}
            >
              {levers && run ? (
                <LeverViews levers={levers} run={run} />
              ) : (
                <Calculating />
              )}
            </Detail>
          </div>
          {run && whyShort(run, retirementDate, answerResult) && (
            <section className="card why-short">
              <h2>Why savings run short</h2>
              <p>{whyShort(run, retirementDate, answerResult)}</p>
            </section>
          )}
          {run && <ThisYear run={run} />}
          <Detail
            title="Details for experts"
            hint="Year by year, the arithmetic and the assumptions · dollars of each year"
          >
            <section className="expert-section">
              <h2>Year by year</h2>
              {run ? (
                <Ledger run={run} retirementDate={retirementDate} />
              ) : (
                <Calculating />
              )}
            </section>
            {run && short && (
              <section className="expert-section">
                <h2>Why savings run short: the arithmetic</h2>
                {spending ? (
                  <p>
                    {short.year < Number(retirementDate.slice(0, 4)) ? (
                      <>
                        In {short.year}, before retiring, spending is{" "}
                        {centsDollars(short.ledger.spending.cents)} in{" "}
                        {short.year} dollars.
                      </>
                    ) : (
                      <>
                        After retiring, spending of{" "}
                        {formatDollars(spending.entered)} a year in today's
                        dollars rises with prices (
                        {percentEntry(inflation!.value)}% a year) to{" "}
                        {centsDollars(short.ledger.spending.cents)} in{" "}
                        {short.year} dollars.
                      </>
                    )}{" "}
                    That year income brings in{" "}
                    {centsDollars(short.ledger.income_total.cents)} and savings
                    supply {centsDollars(short.ledger.withdrawals_total.cents)},
                    leaving {centsDollars(short.ledger.shortfall.cents)} not
                    covered, all in {short.year} dollars.
                  </p>
                ) : (
                  <Calculating />
                )}
                {distributions && (
                  <p>
                    Required withdrawals from age{" "}
                    {distributions.age_on_december_31} don't add money; they
                    move it out of the tax-deferred account earlier, and it is
                    taxed.
                  </p>
                )}
              </section>
            )}
            <section className="expert-section">
              <h2>Assumptions</h2>
              {run ? (
                <>
                  <ScrollTable label="Assumptions">
                    <table>
                      <caption>Assumptions</caption>
                      <thead>
                        <tr>
                          <th>Assumption</th>
                          <th>
                            Value <small>percent a year</small>
                          </th>
                          <th>Source</th>
                          <th>From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.assumptions_used.map((rate) => (
                          <tr
                            key={rate.identifier}
                            className={
                              draft.rough.includes(
                                `/assumptions/${rate.identifier}/value`,
                              )
                                ? "rough"
                                : undefined
                            }
                          >
                            <th scope="row">
                              {assumptionNames[rate.identifier]}
                            </th>
                            <td className="amount">
                              {percentEntry(rate.value)}%
                              {draft.rough.includes(
                                `/assumptions/${rate.identifier}/value`,
                              ) && (
                                <small className="rough-label">
                                  ≈ Rough value
                                </small>
                              )}
                            </td>
                            <td>
                              {rate.value ===
                              draft.input.assumptions[rate.identifier].value
                                ? intake || sample.label === "Your figures"
                                  ? "Your figures"
                                  : sample.label === "Opened plan file"
                                    ? "Opened plan file"
                                    : "Example household"
                                : "Changed by you"}
                            </td>
                            <td>{rate.effective_year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                  <p className="help">
                    Estimates, not facts: change any of them in a copy to see
                    how the plan moves.
                  </p>
                </>
              ) : (
                <Calculating />
              )}
            </section>
            {run && (
              <p className="help">
                Federal tax rules for {run.metadata.rule_set_year} for one
                person, with tax brackets rising each year after · Withdrawals
                come from {withdrawalWords[run.withdrawal_order_used]}.
              </p>
            )}
          </Detail>
          {copy ? (
            <div className="actions">
              <button onClick={copy.back}>Back to your plan</button>
              <button onClick={copy.compare}>Compare with your plan</button>
            </div>
          ) : (
            <div className="actions">
              <div>
                <button
                  className="primary"
                  disabled={!run || !spending || !levers}
                  onClick={() => {
                    if (run && spending && levers)
                      tryChange?.({ run, spending, levers });
                  }}
                >
                  Try a change
                </button>
              </div>
              <div>
                <button onClick={exportPlan}>Summary</button>
              </div>
              {!intake && <button onClick={back}>Back to household</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
