// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import { centsDollars, firstShortfall } from "./plan-display";

// Arithmetic positions geometry only; labels use existing engine amounts/ages.
export function CompareDrawing({
  baseline,
  copy,
  name,
  compact = false,
}: {
  baseline: Run;
  copy: Run;
  name: string;
  compact?: boolean;
}) {
  const width = compact ? 320 : 960;
  const height = 310;
  const left = compact ? 10 : 85;
  const right = width - 15;
  const top = 90;
  const bottom = height - 35;
  const years = [
    ...new Set([...baseline.years, ...copy.years].map((row) => row.year)),
  ].sort((a, b) => a - b);
  const max = Math.max(
    ...[baseline, copy].flatMap((run) =>
      run.years.map((row) => row.ledger.total_closing_today!.cents),
    ),
  );
  const x = (year: number) =>
    left +
    (years.indexOf(year) * (right - left)) / Math.max(1, years.length - 1);
  const y = (value: number) => bottom - (value / (max || 1)) * (bottom - top);
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
        {centsDollars(max)} peak
      </text>
      <text x={left} y={bottom - 6}>
        $0
      </text>
      {[baseline, copy].map((run, index) => {
        const short = firstShortfall(run);
        const row =
          run.years[Math.floor(run.years.length * (index ? 0.78 : 0.28))];
        return (
          <g key={index}>
            {short && (
              <>
                <line
                  className="shortfall-marker"
                  x1={x(short.year)}
                  x2={x(short.year)}
                  y1={top}
                  y2={bottom}
                />
                <text
                  x={index ? right : left}
                  y={index ? 40 : 20}
                  textAnchor={index ? "end" : "start"}
                >
                  {index ? name : "Baseline"}: Runs short at{" "}
                  {short.age_on_december_31}
                </text>
              </>
            )}
            <polyline
              className={index ? "scenario-line" : "baseline-line"}
              points={run.years
                .map(
                  (row) =>
                    `${x(row.year)},${y(row.ledger.total_closing_today!.cents)}`,
                )
                .join(" ")}
            />
            <text
              className="series-label"
              x={x(row.year)}
              y={Math.min(
                bottom - (index ? 30 : 12),
                y(row.ledger.total_closing_today!.cents) + (index ? -12 : 22),
              )}
              textAnchor={index ? "end" : "start"}
            >
              {index ? name : "Baseline"}
            </text>
          </g>
        );
      })}
      {baseline.years
        .filter(
          (row, index) =>
            index === 0 ||
            index === baseline.years.length - 1 ||
            row.age_on_december_31 % (compact ? 10 : 5) === 0,
        )
        .map((row) => (
          <text
            key={row.year}
            x={x(row.year)}
            y={height - 12}
            textAnchor={
              row === baseline.years[0]
                ? "start"
                : row === baseline.years.at(-1)
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
