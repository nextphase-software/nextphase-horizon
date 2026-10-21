// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from "react";
import type { Copies, PlanCopy } from "./plan-copies";
import type { Comparison } from "./generated/types/comparison.v2";
import { Calculating, Detail, ScrollTable } from "./Plan";
import { CompareDrawing } from "./CompareChart";
import { centsDollars, endAge, savingsRows, yearAtDate } from "./plan-display";
import { plainLeftOut, estimatesNote, amountsNote } from "./plain-results";
import { statusWord } from "./format";
import {
  amountChange,
  changedInputs,
  compareHeadline,
  savingsChange,
  savingsOutcome,
  signedCents,
  signedDollars,
  spendingValue,
  compareAmount,
  plannedSpending,
} from "./compare-display";

function RunStatus({
  run,
  name,
}: {
  run: Comparison["baseline"];
  name: string;
}) {
  return (
    <span>
      <span className="status-plan-name">{name}</span>{" "}
      <span className={`status ${run.status}`}>
        <span aria-hidden="true">
          {run.status === "complete"
            ? "✓"
            : run.status === "partial"
              ? "△"
              : "!"}
        </span>{" "}
        {statusWord(run.status, run.omissions.length)}
      </span>
    </span>
  );
}
function Omissions({ values }: { values: string[] }) {
  return values.length ? (
    <ul>
      {values.map((value) => (
        <li key={value}>{plainLeftOut(value)}</li>
      ))}
    </ul>
  ) : (
    <p>Nothing is left out.</p>
  );
}
export function Compare({
  sample,
  copies,
  copy,
  select,
  newCopy,
  back,
  exportPlan,
}: {
  sample: { label: string };
  copies: Copies;
  copy: PlanCopy;
  select: (id: string) => void;
  newCopy: () => void;
  back: () => void;
  exportPlan?: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const { comparison, spending, error, transport, name } = copy;
  const input = JSON.parse(copies.input);
  const retirementDate: string = input.household.persons[0].retirement_date;
  const copyRetirementDate: string = copy.input
    ? JSON.parse(copy.input).household.persons[0].retirement_date
    : retirementDate;
  const baseline = copies.baseline.run;
  const retirement = yearAtDate(baseline, retirementDate);
  const baselineName =
    retirementDate <= baseline.valuation_date
      ? "Your plan · retired"
      : retirement
        ? `Your plan · retire at ${retirement.age_on_december_31}`
        : "Your plan";
  const exhausted = copies.baseline.levers.levers.every((lever) =>
    copies.items.some((item) => item.lever.id === lever.id),
  );
  const tabs = (
    <div className="copy-tabs" role="group" aria-label="Plans">
      <button onClick={back}>{baselineName}</button>
      {copies.items.map((item) => (
        <button
          key={item.lever.id}
          aria-current={item.lever.id === copy.lever.id ? "page" : undefined}
          onClick={() => select(item.lever.id)}
        >
          {item.name}
        </button>
      ))}
      <button className="new-copy" disabled={exhausted} onClick={newCopy}>
        + New copy{exhausted ? " (no more changes to try)" : ""}
      </button>
    </div>
  );
  if (error || transport)
    return (
      <div className="plan-screen compare-screen">
        <h1 ref={heading} tabIndex={-1}>
          Compare
        </h1>
        {tabs}
        <section className="card" role="alert">
          <h2 className="status unsupported">
            <span aria-hidden="true">!</span>{" "}
            {error ? statusWord(error.status) : "Calculation unavailable"}
          </h2>
          <p>{error?.message ?? transport}</p>
        </section>
        <button onClick={back}>Back to plan</button>
      </div>
    );
  const sameOmissions =
    comparison &&
    JSON.stringify(comparison.baseline.omissions) ===
      JSON.stringify(comparison.scenario.omissions);
  const selectedYears =
    comparison &&
    new Set(
      [
        ...savingsRows(comparison.baseline, retirementDate),
        ...savingsRows(comparison.scenario, copyRetirementDate),
      ].map((row) => row.year),
    );
  const rows =
    comparison &&
    [
      ...new Map(
        [...comparison.baseline.years, ...comparison.scenario.years].map(
          (row) => [row.year, row],
        ),
      ).values(),
    ]
      .filter((row) => selectedYears!.has(row.year))
      .sort((a, b) => a.year - b.year);
  const b = comparison?.summary.baseline;
  const c = comparison?.summary.scenario;
  const difference = comparison?.summary.difference;
  const baseSpend = copies.baseline.spending;
  const lines = comparison?.line_differences;
  const measures =
    comparison && b && c && difference
      ? [
          {
            label: "Savings",
            before: savingsOutcome(comparison.baseline),
            after: savingsOutcome(comparison.scenario),
            change: savingsChange(comparison.baseline, comparison.scenario),
            difference: "—",
          },
          {
            label: "Most you could spend",
            unit: "a year",
            before: spendingValue(baseSpend),
            after: spending && spendingValue(spending),
            change:
              spending &&
              amountChange(
                baseSpend.sustainable_spending,
                spending.sustainable_spending,
              ),
            difference: "—",
          },
          {
            label: "Against your planned spending",
            unit: "a year",
            before: plannedSpending(baseSpend.headroom),
            after: spending && plannedSpending(spending.headroom),
            change:
              spending && amountChange(baseSpend.headroom, spending.headroom),
            difference: signedDollars(copy.lever.effect),
          },
          {
            label: `Left at ${endAge(comparison.scenario)}`,
            before: compareAmount(b.ending_total_today.cents, true),
            after: compareAmount(c.ending_total_today.cents, true),
            change:
              compareAmount(b.ending_total_today.cents, true) ===
              compareAmount(c.ending_total_today.cents, true)
                ? "Same"
                : amountChange(
                    b.ending_total_today.cents,
                    c.ending_total_today.cents,
                    true,
                  ),
            difference: "—",
          },
        ]
      : null;
  const totals =
    comparison && b && c && difference
      ? [
          {
            label: "Money short",
            unit: "dollars of each year, added up",
            before: centsDollars(b.total_shortfall.cents),
            after: centsDollars(c.total_shortfall.cents),
            change: amountChange(
              b.total_shortfall.cents,
              c.total_shortfall.cents,
              true,
              "shortfall",
            ),
            difference: signedCents(difference.total_shortfall.cents),
          },
          {
            label: "Federal tax",
            unit: "dollars of each year, added up",
            before: centsDollars(b.total_federal_tax_paid.cents),
            after: centsDollars(c.total_federal_tax_paid.cents),
            change: amountChange(
              b.total_federal_tax_paid.cents,
              c.total_federal_tax_paid.cents,
              true,
              "tax",
            ),
            difference: signedCents(difference.total_federal_tax_paid.cents),
          },
        ]
      : null;
  return (
    <div className="plan-screen compare-screen">
      <p className="eyebrow">
        Compare · {sample.label} · your plan stays as it is
      </p>
      <h1 ref={heading} tabIndex={-1} aria-live="polite">
        {comparison
          ? compareHeadline(
              copy.subject,
              comparison.baseline,
              comparison.scenario,
            )
          : "Compare"}
      </h1>
      {tabs}
      {comparison ? (
        <div className="card plan-status compare-status">
          <div className="compare-status-chips">
            <RunStatus run={comparison.baseline} name="Your plan" />
            <RunStatus run={comparison.scenario} name={name} />
          </div>
          {sameOmissions && (
            <p className="status-sentence">
              {comparison.baseline.omissions.length
                ? `Both leave out the same ${comparison.baseline.omissions.length} things.`
                : "Both cover your situation."}
            </p>
          )}
          <details>
            <summary>What these results don't count</summary>
            {sameOmissions ? (
              <Omissions values={comparison.baseline.omissions} />
            ) : (
              <>
                <h3>Your plan</h3>
                <Omissions values={comparison.baseline.omissions} />
                <h3>Copy</h3>
                <Omissions values={comparison.scenario.omissions} />
              </>
            )}
          </details>
          <p className="help">{estimatesNote}</p>
        </div>
      ) : (
        <Calculating />
      )}
      <div className="changed-inputs">
        {comparison ? (
          <p>
            {changedInputs(
              comparison,
              copyRetirementDate,
              input.household.persons[0].birth_date,
            )}
          </p>
        ) : (
          <Calculating />
        )}
      </div>
      <section
        className="card savings-card"
        aria-labelledby="compare-savings-title"
      >
        <h2 id="compare-savings-title">Savings by age</h2>
        {comparison ? (
          <>
            <figure>
              <CompareDrawing
                baseline={comparison.baseline}
                copy={comparison.scenario}
                name={name}
              />
              <CompareDrawing
                baseline={comparison.baseline}
                copy={comparison.scenario}
                name={name}
                compact
              />
              <figcaption>
                Total savings at the end of each year. Solid line: your plan.
                Dashed line: {name}.
              </figcaption>
            </figure>
            <details className="savings-table">
              <summary>Show as a table</summary>
              <ScrollTable label="Savings by age">
                <table>
                  <caption>Savings by age</caption>
                  <thead>
                    <tr>
                      <th>Age</th>
                      <th>Year</th>
                      <th className="amount">Your plan</th>
                      <th className="amount">{name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows!.map((row) => (
                      <tr key={row.year}>
                        <td>{row.age_on_december_31}</td>
                        <td>{row.year}</td>
                        {[comparison.baseline, comparison.scenario].map(
                          (run, index) => {
                            const value = run.years.find(
                              (entry) => entry.year === row.year,
                            )?.ledger.total_closing_today;
                            return (
                              <td className="amount" key={index}>
                                {value ? centsDollars(value.cents) : "—"}
                              </td>
                            );
                          },
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
            </details>
          </>
        ) : (
          <Calculating />
        )}
      </section>
      <Detail
        title="Headline differences"
        hint="4 measures · today's dollars"
        initiallyOpen
      >
        {measures ? (
          <>
            <ScrollTable label="Headline differences">
              <table className="headline-differences">
                <caption>Headline differences</caption>
                <thead>
                  <tr>
                    <th>Measure</th>
                    <th className="amount">Your plan</th>
                    <th className="amount">{name}</th>
                    <th>Change</th>
                    <th className="amount">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {measures.map((measure) => (
                    <tr key={measure.label}>
                      <th scope="row">
                        {measure.label}
                        {measure.unit && <small>{measure.unit}</small>}
                      </th>
                      <td className="amount">{measure.before}</td>
                      <td className="amount">
                        {measure.after ?? <Calculating />}
                      </td>
                      <td className="change-word">
                        {measure.change ?? <Calculating />}
                      </td>
                      <td className="amount">{measure.difference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <p className="help">
              {amountsNote(baseline.valuation_date)} Rows measure different
              things, so there is no chart here; the savings chart above is the
              picture. A dash means no single difference is shown.
            </p>
          </>
        ) : (
          <Calculating />
        )}
      </Detail>
      <Detail
        title="Details for experts"
        hint="Totals across years and every line that differs"
      >
        <h2>Totals across all years</h2>
        {totals ? (
          <ScrollTable label="Totals across all years">
            <table>
              <caption>
                Totals across all years · dollars of each year, added up
              </caption>
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Your plan</th>
                  <th>{name}</th>
                  <th>Change</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {totals?.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="amount">{row.before}</td>
                    <td className="amount">{row.after}</td>
                    <td>{row.change}</td>
                    <td className="amount">{row.difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        ) : (
          <Calculating />
        )}
        <section className="expert-section">
          <h2>Every line that differs</h2>
          {lines ? (
            <>
              <p>
                {lines.length
                  ? `${lines.length} lines differ, in years ${Math.min(...lines.map((line) => line.year))} to ${Math.max(...lines.map((line) => line.year))}; each shows both values and the difference. The Dollars column says which kind each line is.`
                  : "0 lines differ."}
              </p>
              <ScrollTable label="Every line that differs">
                <table className="line-differences">
                  <caption>Every line that differs</caption>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Line</th>
                      <th>Dollars</th>
                      <th className="amount">Your plan</th>
                      <th className="amount">{name}</th>
                      <th className="amount">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={`${line.year}:${line.path}`}>
                        <th scope="row">{line.year}</th>
                        <td>
                          <code>{line.path.slice(1)}</code>
                        </td>
                        <td>
                          {(line.difference ?? line.scenario ?? line.baseline)!
                            .dollar_basis === "today"
                            ? "today's"
                            : "of each year"}
                        </td>
                        <td className="amount">
                          {line.baseline
                            ? centsDollars(line.baseline.cents)
                            : "—"}
                        </td>
                        <td className="amount">
                          {line.scenario
                            ? centsDollars(line.scenario.cents)
                            : "—"}
                        </td>
                        <td className="amount">
                          {line.difference
                            ? signedCents(line.difference.cents)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
            </>
          ) : (
            <Calculating />
          )}
        </section>
      </Detail>
      <div className="actions">
        <div>
          <button onClick={exportPlan}>Export this comparison</button>
        </div>
        <button onClick={back}>Back to plan</button>
      </div>
    </div>
  );
}
