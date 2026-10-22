// SPDX-License-Identifier: AGPL-3.0-only
import type { Baseline, PlanCopy } from "./plan-copies";
import type { Run } from "./generated/types/run-output.v2";
import { ScrollTable } from "./Plan";
import {
  compareAmount,
  plannedSpending,
  savingsOutcome,
  spendingValue,
} from "./compare-display";
import { centsDollars, endAge } from "./plan-display";
import { amountsNote } from "./plain-results";

const styles = ["solid", "dashed", "dotted", "dash-dot"];
const patterns = [undefined, "9 5", "2 4", "10 4 2 4"];
export function PlansTable({
  baseline,
  copies,
  select,
}: {
  baseline: Baseline;
  copies: PlanCopy[];
  select?: (id: string) => void;
}) {
  const plans = [
    { name: "Your plan", run: baseline.run, spending: baseline.spending },
    ...copies.map((copy) => ({
      name: copy.name,
      run: copy.error || copy.transport ? undefined : copy.comparison?.scenario,
      spending: copy.error || copy.transport ? undefined : copy.spending,
    })),
  ];
  const measures = [
    {
      name: "Savings",
      value: (p: (typeof plans)[number]) =>
        p.run ? savingsOutcome(p.run) : "Calculating…",
    },
    {
      name: "Most you could spend",
      unit: "a year",
      value: (p: (typeof plans)[number]) =>
        p.spending ? spendingValue(p.spending) : "Calculating…",
    },
    {
      name: "Against your planned spending",
      unit: "a year",
      value: (p: (typeof plans)[number]) =>
        p.spending ? plannedSpending(p.spending.headroom) : "Calculating…",
    },
    {
      name: `Left at ${endAge(baseline.run)}`,
      value: (p: (typeof plans)[number]) =>
        p.run
          ? compareAmount(
              p.run.years.at(-1)!.ledger.total_closing_today!.cents,
              true,
            )
          : "Calculating…",
    },
  ];
  return (
    <>
      <ScrollTable label="Your plans side by side">
        <table className="plans-table">
          <caption className="sr-only">Your plans side by side</caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {plans.map((plan, i) => (
                <th className="amount" scope="col" key={i}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measures.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  {row.name}
                  {row.unit && <small>{row.unit}</small>}
                </th>
                {plans.map((plan, i) => (
                  <td className="amount" key={i}>
                    {i > 0 && (copies[i - 1].error || copies[i - 1].transport)
                      ? "Calculation unavailable"
                      : row.value(plan)}
                  </td>
                ))}
              </tr>
            ))}
            {select && (
              <tr>
                <th scope="row">Details</th>
                <td className="amount">—</td>
                {copies.map((copy) => (
                  <td className="amount" key={copy.lever.id}>
                    <button
                      className="link-button"
                      aria-label={`Open ${copy.name}`}
                      onClick={() => select(copy.lever.id)}
                    >
                      Open
                    </button>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </ScrollTable>
      <p className="help side-by-side-note">
        {amountsNote(baseline.run.valuation_date)} Each copy is one change to
        your plan.
      </p>
    </>
  );
}
function Drawing({
  plans,
  compact = false,
}: {
  plans: { name: string; run?: Run }[];
  compact?: boolean;
}) {
  const width = compact ? 320 : 960,
    height = 290,
    left = compact ? 8 : 85,
    right = width - 15,
    top = 38,
    bottom = height - 35;
  const years = [
    ...new Set(
      plans.flatMap((plan) => plan.run?.years.map((row) => row.year) ?? []),
    ),
  ].sort((a, b) => a - b);
  const max = Math.max(
    0,
    ...plans.flatMap(
      (plan) =>
        plan.run?.years.map((row) => row.ledger.total_closing_today!.cents) ??
        [],
    ),
  );
  const x = (year: number) =>
    left +
    (years.indexOf(year) * (right - left)) / Math.max(1, years.length - 1);
  const y = (n: number) => bottom - (n * (bottom - top)) / (max || 1);
  return (
    <svg
      aria-hidden="true"
      className={compact ? "chart-compact" : "chart-wide"}
      viewBox={`0 0 ${width} ${height}`}
    >
      {[top, (top + bottom) / 2, bottom].map((n) => (
        <line
          className="chart-grid"
          key={n}
          x1={left}
          x2={right}
          y1={n}
          y2={n}
        />
      ))}
      <text x={left} y={top - 10}>
        {centsDollars(max)} peak
      </text>
      <text x={left} y={bottom - 6}>
        $0
      </text>
      {plans.map(
        (plan, i) =>
          plan.run && (
            <polyline
              key={i}
              data-plan={plan.name}
              className={i ? "multi-copy-line" : "baseline-line"}
              strokeDasharray={patterns[i]}
              points={plan.run.years
                .map(
                  (row) =>
                    `${x(row.year)},${y(row.ledger.total_closing_today!.cents)}`,
                )
                .join(" ")}
            />
          ),
      )}
      {plans[0]
        .run!.years.filter(
          (row, i, rows) =>
            i === 0 ||
            i === rows.length - 1 ||
            row.age_on_december_31 % (compact ? 10 : 5) === 0,
        )
        .map((row, i, rows) => (
          <text
            key={row.year}
            x={x(row.year)}
            y={height - 12}
            textAnchor={
              i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"
            }
          >
            {row.age_on_december_31}
          </text>
        ))}
    </svg>
  );
}
export function SideBySide({
  baseline,
  copies,
  select,
}: {
  baseline: Baseline;
  copies: PlanCopy[];
  select: (id: string) => void;
}) {
  const plans = [
    { name: "Your plan", run: baseline.run, state: undefined },
    ...copies.slice(-3).map((copy) => ({
      name: copy.name,
      run: copy.error || copy.transport ? undefined : copy.comparison?.scenario,
      state:
        copy.error || copy.transport
          ? "Calculation unavailable"
          : !copy.comparison
            ? "Calculating…"
            : undefined,
    })),
  ];
  return (
    <section className="card side-by-side">
      <h2>Your plans side by side · {copies.length + 1} plans</h2>
      <ul className="plans-key">
        {plans.map((plan, i) => (
          <li key={i}>
            <svg aria-hidden="true" viewBox="0 0 32 12">
              <line
                x1="0"
                x2="32"
                y1="6"
                y2="6"
                className={i ? "multi-copy-line" : "baseline-line"}
                strokeDasharray={patterns[i]}
              />
            </svg>
            {plan.name}
            <span className="sr-only"> · {styles[i]}</span>
            {plan.state && ` · ${plan.state}`}
          </li>
        ))}
      </ul>
      {copies.length > 3 && (
        <p className="help">
          The chart shows your plan and the 3 most recent copies. Every copy is
          in the table and the tabs.
        </p>
      )}
      <figure>
        <Drawing plans={plans} />
        <Drawing plans={plans} compact />
        <figcaption>
          Total savings at the end of each year, in today's dollars. Solid: your
          plan; dashed, dotted and dash-dot: copies, in the order of the key.
        </figcaption>
      </figure>
      <PlansTable baseline={baseline} copies={copies} select={select} />
    </section>
  );
}
