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
import { engine } from "./engine";
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
  savingsRows,
  signedEffect,
  withdrawalWords,
  yearAtDate,
} from "./plan-display";
import { FlowDrawing, SavingsDrawing } from "./PlanCharts";

function Calculating() {
  return <p role="status">Calculating…</p>;
}
function Detail({
  title,
  hint,
  children,
  detailRef,
}: {
  title: string;
  hint: string;
  children: ReactNode;
  detailRef?: RefObject<HTMLDetailsElement | null>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="card plan-detail"
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
function ScrollTable({
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
      aria-label={`${label} table, scroll horizontally`}
    >
      {children}
    </div>
  );
}
/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
function Savings({
  run,
  retirementDate,
}: {
  run: Run;
  retirementDate: string;
}) {
  return (
    <section className="card savings-card" aria-labelledby="savings-title">
      <h2 id="savings-title">Savings by age</h2>
      <figure>
        <SavingsDrawing run={run} retirementDate={retirementDate} />
        <SavingsDrawing run={run} retirementDate={retirementDate} compact />
        <figcaption>
          Total savings at the end of each year, in today's dollars (
          {run.valuation_date.slice(0, 4)} dollars). Solid line: savings by age.
        </figcaption>
      </figure>
      <details className="savings-table">
        <summary>Show as a table</summary>
        <ScrollTable label="Savings by age">
          <table>
            <caption>
              Savings by age, today's dollars ({run.valuation_date.slice(0, 4)}{" "}
              dollars)
            </caption>
            <thead>
              <tr>
                <th>Age</th>
                <th>Year</th>
                <th>Savings</th>
              </tr>
            </thead>
            <tbody>
              {savingsRows(run, retirementDate).map((row) => (
                <tr key={row.year}>
                  <td>{row.age_on_december_31}</td>
                  <td>{row.year}</td>
                  <td className="amount">
                    {centsDollars(row.ledger.total_closing_today!.cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </details>
    </section>
  );
}
function LeverViews({ levers, run }: { levers: Levers; run: Run }) {
  const ranked = levers.ranking.map((id) =>
    levers.levers.find((lever) => lever.id === id)!,
  );
  const max = Math.max(1, ...ranked.map((lever) => Math.abs(lever.effect)));
  return (
    <>
      <Views
        name="Levers"
        chart={
          <div className="lever-chart">
            <p className="help">
              Change in headroom, today's dollars a year · zero at the center
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
                      : `${direction(lever.effect)} ${signedEffect(lever.effect)}`}
                  </strong>
                </div>
              );
            })}
          </div>
        }
        table={
          <ScrollTable label="Levers">
            <table>
              <caption>Levers, today's dollars a year</caption>
              <thead>
                <tr>
                  <th>Change</th>
                  <th>Savings</th>
                  <th>
                    Change in headroom <small>today's dollars a year</small>
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
        Claiming Social Security later isn't offered: claiming-age rules are not
        modeled yet.
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
          <p>Savings at year end · nominal dollars</p>
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
            Nominal dollars (the dollars of each year). Paired columns show
            money in and out; shortfall years have a sunken fill and a dashed
            shortfall box. The table lists every amount, required distribution
            and event.
          </figcaption>
        </figure>
      }
      table={
        <ScrollTable label="Year by year">
          <table className="ledger-table">
            <caption>Year by year, nominal dollars</caption>
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

type Results = {
  run?: Run | Failure;
  spending?: SustainableSpending | Failure;
  levers?: Levers | Failure;
};
export function Plan({
  sample,
  draft,
  back,
}: {
  sample: { label: string };
  draft: Draft;
  back: () => void;
}) {
  return (
    <PlanResult
      key={serializeDraft(draft)}
      sample={sample}
      draft={draft}
      back={back}
    />
  );
}
function PlanResult({
  sample,
  draft,
  back,
}: {
  sample: { label: string };
  draft: Draft;
  back: () => void;
}) {
  const [results, setResults] = useState<Results>({});
  const [transport, setTransport] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const leversRef = useRef<HTMLDetailsElement>(null);
  const input = serializeDraft(draft);
  useEffect(() => {
    heading.current?.focus();
    let active = true;
    for (const [key, op] of [
      ["run", "run"],
      ["spending", "sustainable_spending"],
      ["levers", "levers"],
    ] as const) {
      engine
        .call(op, input)
        .then((json) => {
          const result = JSON.parse(json);
          if (active)
            setResults((previous) => ({
              ...previous,
              [key]: result,
            }));
        })
        .catch((error: Error) => {
          if (active) setTransport(error.message);
        });
    }
    return () => {
      active = false;
    };
  }, [input]);
  const error = Object.values(results).find(
    (result): result is Failure => "code" in result,
  );
  if (error || transport)
    return (
      <div className="plan-screen">
        <h1 ref={heading} tabIndex={-1}>
          Plan
        </h1>
        <section className="card" role="alert">
          <h2 className="status unsupported">
            <span aria-hidden="true">!</span>{" "}
            {error ? statusWord(error.status) : "Calculation unavailable"}
          </h2>
          <p>{error?.message ?? transport}</p>
        </section>
        <button onClick={back}>Back to household</button>
      </div>
    );
  const run = results.run as Run | undefined;
  const spending = results.spending as SustainableSpending | undefined;
  const levers = results.levers as Levers | undefined;
  const household = JSON.parse(input).household;
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
      <p className="eyebrow">
        {sample.label.toUpperCase()}
        {isRetired
          ? " · RETIRED"
          : retirement
            ? ` · RETIRE AT ${retirement.age_on_december_31}`
            : ""}
      </p>
      <h1 ref={heading} tabIndex={-1}>
        {run ? planHeadline(run) : "Plan"}
      </h1>
      <p className="sample">
        <span aria-hidden="true">◇</span> Sample household — invented data
      </p>
      {run ? (
        <div className="card plan-status" aria-live="polite">
          <div>
            <span className={`status ${run.status}`}>
              <span aria-hidden="true">
                {run.status === "complete" ? "✓" : "△"}
              </span>{" "}
              {statusWord(run.status, run.omissions.length)}
            </span>{" "}
            This result leaves some things out.
          </div>
          <details>
            <summary>What this result does not include</summary>
            <ul>
              {run.omissions.map((omission) => (
                <li key={omission}>{omission}</li>
              ))}
            </ul>
          </details>
          <p className="help">
            Results are modeled annual amounts, not predictions.
          </p>
        </div>
      ) : (
        <Calculating />
      )}
      <div className="card plan-answers">
        <div>
          <h2>
            {isRetired
              ? "Do your savings last?"
              : retirement
                ? `Can you retire at ${retirement.age_on_december_31}?`
                : "Can you retire when you want?"}
          </h2>
          {run && spending ? (
            <>
              <p>
                {short
                  ? `${isRetired ? "No: at" : "Not at"} ${formatDollars(spending.entered)} a year${isRetired ? "," : ":"} savings run short at age ${short.age_on_december_31} (${short.year}).`
                  : `Yes: at ${formatDollars(spending.entered)} a year, savings last to ${endAge(run)}.`}
              </p>
              <small>Spending in today's dollars</small>
            </>
          ) : (
            <Calculating />
          )}
        </div>
        <div>
          <h2>What can you spend?</h2>
          {spending && run ? (
            <p>
              {spending.flag === "shortfall_with_no_retirement_spending" ? (
                "Savings run short even with no retirement spending."
              ) : spending.flag === "at_or_above_cap" ? (
                `At least ${formatDollars(spending.cap)} a year in today's dollars; the search stops there.`
              ) : (
                <>
                  <strong className="answer-amount">
                    {formatDollars(spending.sustainable_spending)}
                  </strong>{" "}
                  a year in today's dollars lasts to {endAge(run)}:{" "}
                  {spending.headroom === 0
                    ? "exactly what you plan to spend."
                    : `${formatDollars(Math.abs(spending.headroom))} ${spending.headroom < 0 ? "less" : "more"} than you plan to spend.`}
                </>
              )}
            </p>
          ) : (
            <Calculating />
          )}
        </div>
        <div>
          <h2>What moves it most?</h2>
          {levers ? (
            <p>
              {levers.what_moves_most
                .map(
                  (kind) =>
                    ({
                      return: "investment returns",
                      spending: "spending",
                      retirement_date: "the retirement date",
                    })[kind as "return" | "spending" | "retirement_date"],
                )
                .join(", then ")
                .replace(/^./, (letter) => letter.toUpperCase())}
              .{" "}
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
                See the levers
              </a>
            </p>
          ) : (
            <Calculating />
          )}
        </div>
      </div>
      {run ? (
        <Savings run={run} retirementDate={retirementDate} />
      ) : (
        <section className="card">
          <h2>Savings by age</h2>
          <Calculating />
        </section>
      )}
      <div id="plan-levers">
        <Detail
          title="Levers"
          hint={`What moves the answer most · ${levers ? `${levers.ranking.length} changes, ranked` : "Calculating…"}`}
          detailRef={leversRef}
        >
          {levers && run ? (
            <LeverViews levers={levers} run={run} />
          ) : (
            <Calculating />
          )}
        </Detail>
      </div>
      {run && short && (
        <Detail
          title="Why savings run short"
          hint={`In ${short.year}, at ${short.age_on_december_31}`}
        >
          {spending ? (
            <p>
              {short.year < Number(retirementDate.slice(0, 4)) ? (
                <>
                  In {short.year}, before retiring, spending is{" "}
                  {centsDollars(short.ledger.spending.cents)} (nominal).
                </>
              ) : (
                <>
                  After retiring, spending of {formatDollars(spending.entered)}{" "}
                  a year in today's dollars grows with inflation (
                  {percentEntry(inflation!.value)}%) to{" "}
                  {centsDollars(short.ledger.spending.cents)} by {short.year}{" "}
                  (nominal).
                </>
              )}{" "}
              That year income brings in{" "}
              {centsDollars(short.ledger.income_total.cents)} and savings supply{" "}
              {centsDollars(short.ledger.withdrawals_total.cents)}, leaving{" "}
              {centsDollars(short.ledger.shortfall.cents)} not covered.
            </p>
          ) : (
            <Calculating />
          )}
          {distributions && (
            <p>
              Required distributions from age {distributions.age_on_december_31}{" "}
              don't add money; they move it out of the tax-deferred account
              earlier, and it is taxed.
            </p>
          )}
          <p className="help">
            Rules used: {run.metadata.rule_set_year} federal tax law for a
            single filer, projected after {run.metadata.rule_set_year} with
            tax-threshold indexing · Withdrawal order:{" "}
            {withdrawalWords[run.withdrawal_order_used]}.
          </p>
        </Detail>
      )}
      <Detail
        title="Year by year"
        hint={`Nominal dollars · ${run ? `${run.years.length} years` : "Calculating…"}`}
      >
        {run ? (
          <Ledger run={run} retirementDate={retirementDate} />
        ) : (
          <Calculating />
        )}
      </Detail>
      <Detail
        title="Assumptions"
        hint={
          run
            ? `${run.assumptions_used.length} rates, each with a source`
            : "Calculating…"
        }
      >
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
                    <th>From-year</th>
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
                      <th scope="row">{assumptionNames[rate.identifier]}</th>
                      <td className="amount">
                        {percentEntry(rate.value)}%
                        {draft.rough.includes(
                          `/assumptions/${rate.identifier}/value`,
                        ) && (
                          <small className="rough-label">≈ Rough value</small>
                        )}
                      </td>
                      <td>
                        {rate.value ===
                        draft.input.assumptions[rate.identifier].value
                          ? "Sample household"
                          : "Changed by you"}
                      </td>
                      <td>{rate.effective_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <p className="help">
              Estimates, not facts: change any of them in a copy to see how the
              plan moves.
            </p>
          </>
        ) : (
          <Calculating />
        )}
      </Detail>
      <div className="actions">
        <div>
          <button disabled>Try a change</button>
          <small>Not available yet</small>
        </div>
        <div>
          <button disabled>Export</button>
          <small>Not available yet</small>
        </div>
        <button onClick={back}>Back to household</button>
      </div>
    </div>
  );
}
