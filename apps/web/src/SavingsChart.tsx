// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import type { Run } from "./generated/types/run-output.v2";
import type { Fixture } from "./generated/types/answers-plan.v2";
import { centsDollars, savingsRows } from "./plan-display";
import {
  chartCaption,
  planEvents,
  shellNote,
  yearText,
  type PlanEvent,
} from "./shell-display";
function Drawing({
  run,
  events,
  chosen,
  compact = false,
}: {
  run: Run;
  events: PlanEvent[];
  chosen: number;
  compact?: boolean;
}) {
  const width = compact ? 340 : 760,
    left = compact ? 12 : 72,
    right = width - 20;
  const laneHeight = 20,
    top = 35 + events.length * laneHeight,
    bottom = top + (compact ? 145 : 210),
    height = bottom + 35;
  const values = run.years.map((y) => y.ledger.total_closing_today!.cents),
    max = Math.max(...values);
  const x = (i: number) =>
    left + (i * (right - left)) / Math.max(1, values.length - 1);
  const y = (n: number) => bottom - (n / Math.max(1, max)) * (bottom - top);
  const points = values.map((n, i) => `${x(i)},${y(n)}`).join(" ");
  return (
    <svg
      className={compact ? "chart-compact" : "chart-wide"}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {[0, 0.5, 1].map((n) => (
        <line
          className="chart-grid"
          key={n}
          x1={left}
          x2={right}
          y1={top + (bottom - top) * n}
          y2={top + (bottom - top) * n}
        />
      ))}
      <text
        x={compact ? left : left - 6}
        y={top - 9}
        textAnchor={compact ? "start" : "end"}
      >
        {centsDollars(max)}
      </text>
      <text
        x={compact ? left : left - 6}
        y={bottom - 5}
        textAnchor={compact ? "start" : "end"}
      >
        $0
      </text>
      <polygon
        className="savings-area"
        points={`${left},${bottom} ${points} ${right},${bottom}`}
      />
      <polyline className="baseline-line" points={points} />
      {events.map((e, i) => {
        const px = x(e.index),
          py = y(values[e.index]);
        // One lane per label guarantees no label overlap, including coincident events.
        const ly = 18 + i * laneHeight;
        const labelWidth = e.label.length * 7;
        const labelX = Math.max(left, Math.min(right - labelWidth, px));
        return (
          <g key={`${e.year}-${e.label}`}>
            <line
              className={e.short ? "shortfall-marker" : "event-line"}
              x1={px}
              x2={px}
              y1={ly + 5}
              y2={py}
            />
            <circle
              className={e.short ? "event-dot short-dot" : "event-dot"}
              cx={px}
              cy={py}
              r="4"
            />
            <text x={labelX} y={ly} textAnchor="start">
              {e.label}
            </text>
          </g>
        );
      })}
      <line
        className="chosen-line"
        x1={x(chosen)}
        x2={x(chosen)}
        y1={top}
        y2={bottom}
      />
      <circle
        className="chosen-dot"
        cx={x(chosen)}
        cy={y(values[chosen])}
        r="5"
      />
      {run.years.map(
        (row, i) =>
          (i === 0 ||
            i === values.length - 1 ||
            row.age_on_december_31 % (compact ? 10 : 5) === 0) && (
            <text
              key={row.year}
              x={x(i)}
              y={bottom + 23}
              textAnchor={
                i === 0 ? "start" : i === values.length - 1 ? "end" : "middle"
              }
            >
              {row.age_on_december_31}
            </text>
          ),
      )}
    </svg>
  );
}
export function SavingsChart({
  run,
  input,
  focus = false,
}: {
  run: Run;
  input: Fixture;
  focus?: boolean;
}) {
  const [chosen, setChosen] = useState(0),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) heading.current?.focus();
  }, [focus]);
  const events = planEvents(run, input),
    row = run.years[chosen],
    marked = events.filter((e) => e.year === row.year);
  return (
    <section className="card savings-card" aria-labelledby="savings-title">
      <div className="chart-heading">
        <h2 id="savings-title" ref={heading} tabIndex={-1}>
          Savings by age
        </h2>
        <p className="help chart-note">{shellNote(run)} · Age on the axis</p>
      </div>
      <div className="chart-and-year">
        <div>
          <figure>
            <Drawing run={run} events={events} chosen={chosen} />
            <Drawing run={run} events={events} chosen={chosen} compact />
            <figcaption>{chartCaption(events)}</figcaption>
          </figure>
          <label className="year-label" htmlFor="chosen-year">
            Choose a year
          </label>
          <input
            id="chosen-year"
            className="year-chooser"
            type="range"
            min={0}
            max={run.years.length - 1}
            step={1}
            value={chosen}
            aria-valuetext={yearText(row)}
            onChange={(e) => setChosen(Number(e.target.value))}
          />
          <div className="year-ends help">
            <span>{yearText(run.years[0])}</span>
            <span>{yearText(run.years.at(-1)!)}</span>
          </div>
        </div>
        <div className="chosen-year" aria-live="polite">
          <p className="eyebrow">Chosen year</p>
          <h3>
            {row.year} · age {row.age_on_december_31}
          </h3>
          <dl>
            <div>
              <dt>Savings at year end</dt>
              <dd>{centsDollars(row.ledger.total_closing_today!.cents)}</dd>
            </div>
            <div>
              <dt>Money short that year</dt>
              <dd>
                {row.ledger.shortfall_today!.cents > 0
                  ? centsDollars(row.ledger.shortfall_today!.cents)
                  : "None"}
              </dd>
            </div>
          </dl>
          <h4>This year</h4>
          <ul>
            {(marked.length
              ? marked.map((e) => e.label)
              : ["Nothing marked on the chart this year."]
            ).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <p className="help">
            {shellNote(run)}. That year's income, withdrawals and tax are in
            Details for experts.
          </p>
        </div>
      </div>
      <details className="savings-table">
        <summary>Show as a table</summary>
        <div
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users can scroll the table.
          tabIndex={0}
          className="table-scroll"
          role="region"
          aria-label="Savings by age table, scrollable"
        >
          <table>
            <caption>Savings by age</caption>
            <thead>
              <tr>
                <th>Age</th>
                <th>Year</th>
                <th>Savings</th>
              </tr>
            </thead>
            <tbody>
              {savingsRows(run, input.household.persons[0].retirement_date).map(
                (r) => (
                  <tr key={r.year}>
                    <td>{r.age_on_december_31}</td>
                    <td>{r.year}</td>
                    <td className="amount">
                      {centsDollars(r.ledger.total_closing_today!.cents)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
