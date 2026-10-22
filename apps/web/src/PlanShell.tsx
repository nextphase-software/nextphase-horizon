// SPDX-License-Identifier: AGPL-3.0-only
import type { Run } from "./generated/types/run-output.v2";
import { centsDollars } from "./plan-display";
import { firstYearMoney, type Figure } from "./shell-display";
export const sections = [
  "Overview",
  "Plan",
  "Compare",
  "Summary",
  "Your answers",
] as const;
export type Section = (typeof sections)[number];
const icons = [
  "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z",
  "M3 18l6-7 5 3 7-10",
  "M3 15l6-5 5 2 7-8 M3 20l6-5 5 2 7-8",
  "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4",
  "M8 5h13 M8 12h13 M8 19h13 M3 5h1 M3 12h1 M3 19h1",
];
export function PlanNavigation({
  current,
  count,
  open,
}: {
  current: Section;
  count: number;
  open: (section: Section) => void;
}) {
  return (
    <nav className="plan-navigation" aria-label="Plan sections">
      <ul>
        {sections.map((label, i) => (
          <li key={label}>
            <button
              aria-current={current === label ? "page" : undefined}
              onClick={() => open(label)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={icons[i]} />
              </svg>
              <span>
                {label}
                {label === "Compare" && count > 1 && (
                  <span className="plan-count">
                    {count}
                    <span className="sr-only"> plans</span>
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
export function HeadlineFigures({
  figures,
  name,
  note,
  tiles = false,
}: {
  figures: Figure[];
  name: string;
  note: string;
  tiles?: boolean;
}) {
  return (
    <section
      className={tiles ? "headline-tiles" : "headline-strip"}
      aria-label={`${name}: headline figures`}
    >
      {!tiles && <p className="figure-plan-name eyebrow">{name}</p>}
      <dl>
        {figures.map(([label, value, unit, explanation]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <span className="figure-value">
                {value}
                {unit && <small> {unit}</small>}
              </span>
              {tiles && <p>{explanation}</p>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="headline-note help">{note}</p>
    </section>
  );
}
export function CopyBanner({
  name,
  back,
  compare,
}: {
  name: string;
  back: () => void;
  compare: () => void;
}) {
  return (
    <section className="card copy-banner">
      <p>You're looking at a copy: {name}. Your plan stays as it is.</p>
      <div className="actions">
        <button onClick={back}>Back to your plan</button>
        <button onClick={compare}>Compare with your plan</button>
      </div>
    </section>
  );
}
export function ThisYear({ run }: { run: Run }) {
  const money = firstYearMoney(run);
  // Sums and ratios only position the two drawings; displayed amounts are engine values.
  const total = (lines: [string, number][]) =>
    lines.reduce((sum, [, n]) => sum + n, 0);
  const scale = Math.max(1, total(money.moneyIn), total(money.moneyOut));
  return (
    <section className="card this-year" aria-label="Your money this year">
      <h2>Your money this year</h2>
      <p className="money-sentence">{money.sentence}</p>
      {[
        ["Money in", money.moneyIn],
        ["Money out", money.moneyOut],
      ].map(([label, raw]) => {
        const lines = raw as [string, number][];
        return (
          <div className="money-group" key={String(label)}>
            <h3>{String(label)}</h3>
            <svg
              className="money-bar"
              aria-hidden="true"
              viewBox="0 0 1000 28"
              preserveAspectRatio="none"
            >
              {lines.map(([name, n], i) => (
                <rect
                  key={name}
                  className={`money-segment money-${name.toLowerCase().replaceAll(" ", "-")}`}
                  x={(total(lines.slice(0, i)) / scale) * 1000}
                  y="1"
                  width={(n / scale) * 1000}
                  height="26"
                />
              ))}
            </svg>
            <ul>
              {lines.map(([name, n]) => (
                <li key={name}>
                  <span>{name}</span> <strong>{centsDollars(n)}</strong>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="help money-note">{money.note}</p>
    </section>
  );
}
