// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import type { InputImpact } from "./generated/types/input-impact.v1";
import type { Failure } from "./Answer";
import { engine } from "./engine";
import { percentEntry } from "./entry";
import { countWord, statusWord } from "./format";
import { serializeDraft, setupSteps, type Draft } from "./setup";
import {
  barScale,
  entryDescription,
  inputHeadline,
  matters,
  onePercent,
  roughItems,
  setupFields,
  signedDollars,
} from "./input-check";

export function InputCheck({
  sample,
  draft,
  back,
  refine,
  plan,
}: {
  sample: { label: string };
  draft: Draft;
  back: () => void;
  refine: (step: number, path: string) => void;
  plan?: () => void;
}) {
  const [result, setResult] = useState<InputImpact | Failure | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    let active = true;
    engine
      .call(
        "input_impact",
        serializeDraft(draft),
        JSON.stringify(roughItems(draft)),
      )
      .then((json) => {
        if (active) setResult(JSON.parse(json) as InputImpact | Failure);
      })
      .catch((error: Error) => {
        if (active) setFailure(error.message);
      });
    return () => {
      active = false;
    };
  }, [draft]);
  const allFields = setupFields(draft);
  const success = result && "items" in result ? result : null;
  const spending = success?.baseline.sustainable_spending ?? 0;
  const threshold = onePercent(spending);
  const scale = barScale(
    Math.max(
      threshold,
      ...(success?.items.map((item) => Math.abs(item.impact)) ?? []),
    ),
  );
  return (
    <>
      <p className="eyebrow">INPUT CHECK · {sample.label}</p>
      <h1 ref={heading} tabIndex={-1}>
        {success
          ? inputHeadline(
              success.items.length,
              success.items.filter((item) => matters(spending, item.impact))
                .length,
            )
          : "Input check"}
      </h1>
      <p className="lede">
        Ranked by how much each could change your headroom. This shows how
        complete your inputs are, <strong>not</strong> how likely your plan is
        to work.
      </p>
      <div aria-live="polite" aria-atomic="true">
        {failure ? (
          <section className="card">
            <h2>Calculation unavailable</h2>
            <p>{failure}</p>
          </section>
        ) : result && "code" in result ? (
          <section className="card">
            <h2 className="status unsupported">
              <span aria-hidden="true">!</span> {statusWord(result.status)}
            </h2>
            <p>{result.message}</p>
          </section>
        ) : !result ? (
          <p role="status">Checking rough entries…</p>
        ) : null}
      </div>
      {success && (
        <>
          {success.items.map((item) => {
            const field = allFields.find((field) => field.path === item.path)!;
            const description = entryDescription(draft, field);
            const significant = matters(spending, item.impact);
            const isKept = kept.includes(item.path);
            const endpoint = (value: unknown) =>
              field.kind === "percent"
                ? `${percentEntry(String(value))}%`
                : signedDollars(Number(value) / 100);
            const marker = (threshold / scale) * 100;
            return (
              <section
                className="card check-item"
                key={item.path}
                aria-label={description.title}
              >
                <div className="check-title">
                  <h2>{description.title}</h2>
                  <span className="muted">{description.value}</span>
                </div>
                <span className="rough-label">
                  <span aria-hidden="true">≈ </span>Rough value
                </span>
                <div className="check-impact">
                  <p>
                    <strong className={significant ? "" : "muted"}>
                      {significant ? "Matters" : "Barely matters"}
                    </strong>{" "}
                    · could change your headroom by up to{" "}
                    <strong>{signedDollars(Math.abs(item.impact))}</strong> a
                    year
                  </p>
                  <svg className="impact-bar" height="45" aria-hidden="true">
                    <rect
                      className="bar-track"
                      x="0"
                      y="25"
                      width="100%"
                      height="12"
                      rx="3"
                    />
                    <rect
                      className={significant ? "bar-matters" : "bar-barely"}
                      x="0"
                      y="25"
                      width={`${(Math.abs(item.impact) / scale) * 100}%`}
                      height="12"
                      rx="3"
                    />
                    <line
                      className="bar-marker"
                      x1={`${marker}%`}
                      x2={`${marker}%`}
                      y1="19"
                      y2="43"
                    />
                    <text
                      x={`${marker}%`}
                      y="13"
                      textAnchor={
                        marker < 15 ? "start" : marker > 85 ? "end" : "middle"
                      }
                    >
                      1% · {signedDollars(threshold)}
                    </text>
                  </svg>
                  <p className="help">
                    Tested from {endpoint(item.low)} to {endpoint(item.high)}
                    {description.yearly ? " a year" : ""}; headroom{" "}
                    {signedDollars(item.headroom_low)} to{" "}
                    {signedDollars(item.headroom_high)} (today's dollars).
                  </p>
                </div>
                <div className="actions check-actions">
                  <button onClick={() => refine(field.step, field.path)}>
                    Refine
                  </button>
                  <button
                    className="link"
                    onClick={() =>
                      setKept(
                        isKept
                          ? kept.filter((path) => path !== item.path)
                          : [...kept, item.path],
                      )
                    }
                  >
                    {isKept ? "Undo" : "Keep as rough"}
                  </button>
                  {isKept && <span role="status">Kept as rough</span>}
                </div>
              </section>
            );
          })}
          <details className="card check-detail">
            <summary>
              How “matters” is decided
              <small>1% of {signedDollars(spending)} a year</small>
            </summary>
            <p>
              An entry matters when its nonzero impact could change your
              headroom by at least 1% of sustainable spending, including the
              exact boundary, compared in integers before rounding.
            </p>
          </details>
          <details className="card check-detail">
            <summary>
              How each entry was tested<small>Default ranges</small>
            </summary>
            <ul>
              <li>
                Account opening balances, income amounts and spending: 10%
                either side, rounded once half away from zero to cents.
              </li>
              <li>
                Taxable cost basis: 25% either side, with the high value capped
                at the account's opening value.
              </li>
              <li>
                Assumption rates: one percentage point either side in exact
                decimal arithmetic, never below zero.
              </li>
            </ul>
          </details>
          <details
            className="card check-detail"
            open={success.items.length === 0 ? true : undefined}
          >
            <summary>
              Entered without a rough mark
              <small>
                {countWord(setupSteps.length - 1).replace(/^./, (letter) =>
                  letter.toUpperCase(),
                )}{" "}
                groups of entries
              </small>
            </summary>
            <ul>
              {setupSteps.slice(0, 5).map((step, index) => (
                <li key={step}>
                  {step}:{" "}
                  {
                    allFields.filter(
                      (field) =>
                        field.step === index &&
                        !draft.rough.includes(field.path),
                    ).length
                  }{" "}
                  fields without a rough mark
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      <div className="actions">
        {success && (
          <button className="primary" onClick={plan}>
            See the plan
          </button>
        )}
        <button onClick={back}>Back to household</button>
      </div>
    </>
  );
}
