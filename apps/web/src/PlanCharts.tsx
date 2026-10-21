// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import {
  centsDollars,
  firstDistribution,
  firstShortfall,
  yearAtDate,
} from "./plan-display";

// Arithmetic in this module positions SVG geometry only. No derived money
// amount or stack total is ever displayed as a figure.
export function SavingsDrawing({
  run,
  retirementDate,
  compact = false,
  nominal = false,
}: {
  run: Run;
  retirementDate: string;
  compact?: boolean;
  nominal?: boolean;
}) {
  const width = compact ? 320 : 960;
  const height = compact ? 245 : 290;
  const left = compact ? 10 : 85;
  const right = width - 15;
  const top = nominal ? 85 : 65;
  const bottom = height - 35;
  const values = run.years.map(
    ({ ledger }) =>
      (nominal ? ledger.total_closing : ledger.total_closing_today)!.cents,
  );
  const max = Math.max(...values);
  const x = (index: number) =>
    left + (index * (right - left)) / Math.max(1, values.length - 1);
  const y = (value: number) => bottom - (value / (max || 1)) * (bottom - top);
  const retirement = yearAtDate(run, retirementDate);
  const short = firstShortfall(run);
  const distributions = nominal && firstDistribution(run);
  const labelAnchor = (position: number) =>
    position > right - 120 ? "end" : "start";
  const ticks = run.years.filter(
    (row, index) =>
      index === 0 ||
      index === run.years.length - 1 ||
      row.age_on_december_31 % (compact ? 10 : 5) === 0,
  );
  return (
    <svg
      aria-hidden="true"
      className={compact ? "chart-compact" : "chart-wide"}
      viewBox={`0 0 ${width} ${height}`}
    >
      {[top, (top + bottom) / 2, bottom].map((position) => (
        <line
          key={position}
          className="chart-grid"
          x1={left}
          x2={right}
          y1={position}
          y2={position}
        />
      ))}
      <text x={left} y={top - 10}>
        {centsDollars(max)}
        {compact ? " peak" : ""}
      </text>
      <text x={left} y={bottom - 6}>
        $0
      </text>
      <polyline
        className="baseline-line"
        points={values
          .map((value, index) => `${x(index)},${y(value)}`)
          .join(" ")}
      />
      {retirement && (
        <>
          <line
            className="event-line"
            x1={x(run.years.indexOf(retirement))}
            x2={x(run.years.indexOf(retirement))}
            y1={top}
            y2={bottom}
          />
          <text
            x={x(run.years.indexOf(retirement))}
            y="20"
            textAnchor={labelAnchor(x(run.years.indexOf(retirement)))}
          >
            {nominal ? "Retires" : "Retire"} at {retirement.age_on_december_31}
          </text>
        </>
      )}
      {short && (
        <>
          <line
            className="shortfall-marker"
            x1={x(run.years.indexOf(short))}
            x2={x(run.years.indexOf(short))}
            y1={top}
            y2={bottom}
          />
          <text
            x={nominal ? right : x(run.years.indexOf(short))}
            y="40"
            textAnchor={
              nominal ? "end" : labelAnchor(x(run.years.indexOf(short)))
            }
          >
            {nominal
              ? `Runs short ${short.year} (age ${short.age_on_december_31})`
              : `Runs short at ${short.age_on_december_31}`}
          </text>
        </>
      )}
      {distributions && (
        <>
          <line
            className="event-line"
            x1={x(run.years.indexOf(distributions))}
            x2={x(run.years.indexOf(distributions))}
            y1={top}
            y2={bottom}
          />
          <text
            x={x(run.years.indexOf(distributions))}
            y="60"
            textAnchor={labelAnchor(x(run.years.indexOf(distributions)))}
          >
            Distributions from {distributions.age_on_december_31}
          </text>
        </>
      )}
      {ticks.map((row) => (
        <text
          key={row.year}
          x={x(run.years.indexOf(row))}
          y={height - 12}
          textAnchor={
            row === run.years[0]
              ? "start"
              : row === run.years.at(-1)
                ? "end"
                : "middle"
          }
        >
          {row.age_on_december_31}
        </text>
      ))}
    </svg>
  );
}

export function FlowDrawing({
  run,
  compact = false,
}: {
  run: Run;
  compact?: boolean;
}) {
  const width = compact ? 320 : 960;
  const left = 10;
  const right = width - 10;
  const top = 25;
  const bottom = 210;
  const step = (right - left) / run.years.length;
  const barWidth = step * 0.35;
  const max = Math.max(
    1,
    ...run.years.flatMap(({ ledger: l }) => [
      l.income_total.cents + l.withdrawals_total.cents + l.shortfall.cents,
      l.spending.cents + (l.federal_tax?.paid.cents ?? 0),
    ]),
  );
  const h = (cents: number) => (cents / max) * (bottom - top);
  return (
    <svg
      aria-hidden="true"
      className={compact ? "chart-compact flow-chart" : "chart-wide flow-chart"}
      viewBox={`0 0 ${width} 255`}
    >
      <text x={left} y="15">
        In | Out · dollars of each year
      </text>
      <line
        className="chart-grid"
        x1={left}
        x2={right}
        y1={bottom}
        y2={bottom}
      />
      {run.years.map((row, index) => {
        const l = row.ledger;
        const x = left + index * step;
        const income = h(l.income_total.cents);
        const withdrawals = h(l.withdrawals_total.cents);
        const short = h(l.shortfall.cents);
        const spending = h(l.spending.cents);
        const tax = h(l.federal_tax?.paid.cents ?? 0);
        return (
          <g key={row.year}>
            {short > 0 && (
              <rect
                className="shortfall-year"
                x={x}
                y={top}
                width={step}
                height={bottom - top}
              />
            )}
            <rect
              className="flow-income"
              x={x}
              y={bottom - income}
              width={barWidth}
              height={income}
            />
            <rect
              className="flow-withdrawals"
              x={x}
              y={bottom - income - withdrawals}
              width={barWidth}
              height={withdrawals}
            />
            {short > 0 && (
              <rect
                className="flow-shortfall"
                x={x}
                y={bottom - income - withdrawals - short}
                width={barWidth}
                height={short}
              />
            )}
            <rect
              className="flow-spending"
              x={x + step * 0.5}
              y={bottom - spending}
              width={barWidth}
              height={spending}
            />
            <rect
              className="flow-tax"
              x={x + step * 0.5}
              y={bottom - spending - tax}
              width={barWidth}
              height={tax}
            />
            {(index === 0 ||
              index === run.years.length - 1 ||
              row.age_on_december_31 % (compact ? 20 : 10) === 0) && (
              <>
                <text
                  x={x}
                  y="228"
                  textAnchor={index === run.years.length - 1 ? "end" : "start"}
                >
                  {row.year}
                </text>
                <text
                  x={x}
                  y="245"
                  textAnchor={index === run.years.length - 1 ? "end" : "start"}
                >
                  age {row.age_on_december_31}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
