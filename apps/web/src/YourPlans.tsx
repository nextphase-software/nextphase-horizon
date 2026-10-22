// SPDX-License-Identifier: AGPL-3.0-only
import type { Baseline, PlanCopy } from "./plan-copies";
import type { Run } from "./generated/types/run-output.v2";
import { firstShortfall, planHeadline } from "./plan-display";
import { statusWord } from "./format";
export function SavingsLine({ run }: { run: Run }) {
  const values = run.years.map((row) => row.ledger.total_closing_today!.cents);
  const max = Math.max(1, ...values);
  const x = (i: number) => 4 + (i * 252) / Math.max(1, values.length - 1);
  const y = (n: number) => 60 - (n * 52) / max;
  const short = firstShortfall(run);
  return (
    <svg className="small-savings" viewBox="0 0 260 64" aria-hidden="true">
      <polyline
        className="baseline-line"
        points={values.map((n, i) => `${x(i)},${y(n)}`).join(" ")}
      />
      {short && (
        <line
          className="shortfall-marker"
          x1={x(run.years.indexOf(short))}
          x2={x(run.years.indexOf(short))}
          y1="4"
          y2="60"
        />
      )}
    </svg>
  );
}
export function YourPlans({
  baseline,
  copies,
  select,
  looking = true,
}: {
  baseline: Baseline;
  copies: PlanCopy[];
  select?: (id: string) => void;
  looking?: boolean;
}) {
  return (
    <section className="card your-plans">
      <h2>Your plans</h2>
      <ul className="plans-list">
        <li>
          <h3>Your plan</h3>
          <SavingsLine run={baseline.run} />
          <p>{planHeadline(baseline.run)}</p>
          {looking && <p className="help">You're looking at it</p>}
        </li>
        {copies.map((copy) => (
          <li key={copy.lever.id}>
            <h3>Copy: {copy.name}</h3>
            {copy.error || copy.transport ? (
              <p role="alert">
                {copy.error
                  ? `${statusWord(copy.error.status)}: ${copy.error.message}`
                  : `Calculation unavailable: ${copy.transport}`}
              </p>
            ) : copy.comparison && copy.spending ? (
              <>
                <SavingsLine run={copy.comparison.scenario} />
                <p>{planHeadline(copy.comparison.scenario)}</p>
              </>
            ) : (
              <p role="status">Calculating…</p>
            )}
            <button
              aria-label={`Compare ${copy.name}`}
              onClick={() => select?.(copy.lever.id)}
            >
              Compare
            </button>
          </li>
        ))}
      </ul>
      {!copies.length && (
        <p className="help">
          Copies you try appear here, next to your plan. Your plan stays as it
          is.
        </p>
      )}
    </section>
  );
}
