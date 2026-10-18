// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from "react";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import { engine } from "./engine";
import { samples } from "./fixtures";
import { flagWords, formatDollars, statusWord } from "./format";
type Failure = {
  status: "invalid" | "unsupported";
  code: string;
  message: string;
};
type Result = SustainableSpending | Failure;
export function App() {
  const [selected, setSelected] = useState(samples[0].name);
  const [answer, setAnswer] = useState<Result | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    let active = true;
    const sample = samples.find((sample) => sample.name === selected)!;
    // A new worker request must clear its previous result, including errors.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading starts with this external request.
    setAnswer(null);
    setFailure(null);
    engine
      .call("sustainable_spending", sample.json)
      .then((json) => {
        if (active) setAnswer(JSON.parse(json) as Result);
      })
      .catch((error: Error) => {
        if (active) setFailure(error.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  function toggleTheme() {
    const current =
      theme ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(current === "dark" ? "light" : "dark");
  }
  return (
    <>
      <header>
        <strong>NextPhase Horizon</strong>
        <button onClick={toggleTheme}>Toggle theme</button>
      </header>
      <main>
        <h1>Explore a sample household</h1>
        <p className="sample">
          <span aria-hidden="true">◇</span> Sample household — invented data
        </p>
        <label htmlFor="household">Sample household</label>
        <select
          id="household"
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
          }}
        >
          {samples.map((sample) => (
            <option key={sample.name} value={sample.name}>
              {sample.label}
            </option>
          ))}
        </select>
        <div aria-live="polite" aria-atomic="true">
          {failure ? (
            <section>
              <h2>Calculation unavailable</h2>
              <p>{failure}</p>
            </section>
          ) : answer ? (
            <Answer answer={answer} />
          ) : (
            <p role="status">Calculating sample household…</p>
          )}
        </div>
      </main>
    </>
  );
}
export function Answer({ answer }: { answer: Result }) {
  if ("code" in answer)
    return (
      <section>
        <h2 className="status unsupported">
          <span aria-hidden="true">!</span> {statusWord(answer.status)}
        </h2>
        <p>{answer.message}</p>
      </section>
    );
  const omissions = answer.run.omissions;
  return (
    <section>
      <h2 className={`status ${answer.status}`}>
        <span aria-hidden="true">
          {answer.status === "complete" ? "✓" : "△"}
        </span>{" "}
        {statusWord(answer.status, omissions.length)}
      </h2>
      <dl>
        <Figure
          label="Most you can spend in retirement"
          amount={answer.sustainable_spending}
          testId="spending"
        />
        <Figure
          label="Entered after-retirement spending"
          amount={answer.entered}
          testId="entered"
        />
        <Figure label="Headroom" amount={answer.headroom} testId="headroom" />
      </dl>
      {answer.flag && <p className="flag">{flagWords(answer.flag)}</p>}
      <h3>What this result does not include</h3>
      {omissions.length ? (
        <ul>
          {omissions.map((omission) => (
            <li key={omission}>{omission}</li>
          ))}
        </ul>
      ) : (
        <p>No omissions reported.</p>
      )}
    </section>
  );
}
function Figure({
  label,
  amount,
  testId,
}: {
  label: string;
  amount: number;
  testId: string;
}) {
  return (
    <div className="figure">
      <dt>
        {label}
        <small>today's dollars, per year</small>
      </dt>
      <dd data-testid={testId}>{formatDollars(amount)}</dd>
    </div>
  );
}
