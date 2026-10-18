// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { engine } from "./engine";
import { samples } from "./fixtures";
import { flagWords, sampleIntroduction, statusWord } from "./format";
import type { Result } from "./Answer";
import { Setup } from "./GuidedSetup";
import { createDraft, type Draft } from "./setup";
export { Answer } from "./Answer";
export function Status({ result }: { result: Result }) {
  return (
    <span
      className={`status ${result.status === "invalid" ? "unsupported" : result.status}`}
    >
      <span aria-hidden="true">
        {result.status === "complete"
          ? "✓"
          : result.status === "partial"
            ? "△"
            : "!"}
      </span>{" "}
      {statusWord(
        result.status,
        "run" in result ? result.run.omissions.length : 0,
      )}
    </span>
  );
}
function SampleNote({ result }: { result: Result }) {
  return "code" in result ? (
    <small>{result.message}</small>
  ) : result.flag ? (
    <small>{flagWords(result.flag)}</small>
  ) : null;
}
export function App() {
  const [selected, setSelected] = useState(samples[0].name);
  const [question, setQuestion] = useState("retire");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [inSetup, setInSetup] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const householdRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    let active = true;
    Promise.all(
      samples.map(
        async (sample) =>
          [
            sample.name,
            JSON.parse(
              await engine.call("sustainable_spending", sample.json),
            ) as Result,
          ] as const,
      ),
    )
      .then((entries) => {
        if (active) setResults(Object.fromEntries(entries));
      })
      .catch((error: Error) => {
        if (active) setFailure(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function toggleTheme() {
    const current =
      theme ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(current === "dark" ? "light" : "dark");
  }
  function chooseHousehold(name: string) {
    if (name === selected) return;
    if (
      draft?.dirty &&
      !window.confirm(
        "Choosing a different household will discard your edited answers, added accounts and Rough marks. Continue?",
      )
    )
      return;
    setSelected(name);
    setDraft(null);
  }
  function openStart(part: "question" | "household") {
    setInSetup(false);
    // Focus after React has restored the Start screen.
    requestAnimationFrame(() =>
      (part === "question" ? questionRef : householdRef).current?.focus(),
    );
  }
  const sample = samples.find((sample) => sample.name === selected)!;
  const result = results[selected];
  const allResults = Object.values(results);
  const metadata =
    result && "run" in result
      ? result.run.metadata
      : allResults.find((result) => "run" in result)?.run.metadata;
  return (
    <>
      <header>
        <strong className="brand">
          <span className="brand-mark" aria-hidden="true">
            ☰
          </span>
          <span>
            Horizon<small>NextPhase</small>
          </span>
        </strong>
        <nav aria-label="Planning steps">
          <ol className="planning-steps">
            <li aria-current={!inSetup ? "step" : undefined}>
              <button onClick={() => openStart("question")}>
                <span aria-hidden="true">1</span> Question
              </button>
            </li>
            <li aria-current={inSetup ? "step" : undefined}>
              <button onClick={() => openStart("household")}>
                <span aria-hidden="true">2</span> Household
              </button>
            </li>
            {["Check", "Plan", "Compare", "Export"].map((step, i) => (
              <li key={step}>
                <span>
                  {i + 3} {step}
                  <small>Not available yet</small>
                </span>
              </li>
            ))}
          </ol>
        </nav>
        <button onClick={toggleTheme}>Toggle theme</button>
      </header>
      <main>
        {inSetup && draft ? (
          <Setup
            sample={sample}
            draft={draft}
            setDraft={setDraft}
            backToStart={() => openStart("household")}
          />
        ) : (
          <>
            <h1>What would you like to find out?</h1>
            <div aria-live="polite">
              {failure ? (
                <section>
                  <h2>Calculation unavailable</h2>
                  <p>{failure}</p>
                </section>
              ) : allResults.length === samples.length ? (
                <p className="lede" data-testid="intro">
                  {sampleIntroduction(
                    samples.map((sample) => ({
                      label: sample.label,
                      result: results[sample.name],
                    })),
                  )}
                </p>
              ) : (
                <p role="status">Calculating sample households…</p>
              )}
            </div>
            <p className="sample">
              <span aria-hidden="true">◇</span> Sample household — invented data
            </p>
            <div className="start-grid">
              <fieldset className="card choices">
                <legend>Your question</legend>
                {[
                  {
                    id: "retire",
                    label: "Can I afford to retire when I want to?",
                  },
                  { id: "spend", label: "How much can I spend each year?" },
                  {
                    id: "claim",
                    label: "When should I claim Social Security?",
                  },
                ].map((item, i) => (
                  <label className="choice" key={item.id}>
                    <input
                      ref={question === item.id ? questionRef : undefined}
                      type="radio"
                      name="question"
                      value={item.id}
                      checked={question === item.id}
                      disabled={i === 2}
                      onChange={() => setQuestion(item.id)}
                      aria-label={item.label}
                    />
                    <span>
                      <strong>{item.label}</strong>
                      {i === 2 && (
                        <small>Claiming-age rules are not modelled.</small>
                      )}
                    </span>
                    {i === 2 ? (
                      <span className="muted">Not available yet</span>
                    ) : (
                      <span className="status complete">
                        <span aria-hidden="true">✓</span> Supported
                      </span>
                    )}
                  </label>
                ))}
              </fieldset>
              <fieldset className="card choices">
                <legend>Start from a sample household</legend>
                {samples.map((item) => (
                  <label className="choice" key={item.name}>
                    <input
                      ref={selected === item.name ? householdRef : undefined}
                      type="radio"
                      name="household"
                      value={item.name}
                      checked={selected === item.name}
                      onChange={() => chooseHousehold(item.name)}
                      aria-label={item.label}
                    />
                    <span>
                      <strong>{item.label}</strong>
                      {results[item.name] && (
                        <SampleNote result={results[item.name]} />
                      )}
                    </span>
                    {results[item.name] && (
                      <Status result={results[item.name]} />
                    )}
                  </label>
                ))}
              </fieldset>
            </div>
            <details className="card">
              <summary>What the statuses mean</summary>
              <p>
                ✓ Supported: a full result within the engine's declared
                coverage.
              </p>
              <p>△ Partial: a result with the named omissions.</p>
              <p>! Unsupported: no result is produced.</p>
            </details>
            <details className="card">
              <summary>What the selected household's result leaves out</summary>
              {result ? (
                "run" in result ? (
                  result.run.omissions.length ? (
                    <ul>
                      {result.run.omissions.map((omission) => (
                        <li key={omission}>{omission}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No omissions reported.</p>
                  )
                ) : (
                  <p>{result.message}</p>
                )
              ) : (
                <p>Waiting for the engine.</p>
              )}
            </details>
            <div className="actions">
              <button
                className="primary"
                disabled={!result || "code" in result || !!failure}
                onClick={() => {
                  if (!draft) setDraft(createDraft(sample.json));
                  setInSetup(true);
                }}
              >
                Continue
              </button>
              <p className="help">
                Setup goes step by step and ends with a review of every answer.
              </p>
            </div>
            {result && "code" in result && (
              <p role="status">Horizon plans for one person only.</p>
            )}
          </>
        )}
      </main>
      <footer>
        Your answers stay in this page only. Reload or close it and they're
        gone.
        <p className="reference-footer">
          Open source (AGPL-3.0-only) · Sample data only; nothing you enter is
          stored
          {metadata && (
            <>
              {" "}
              · Model {metadata.model_version} · Federal tax law{" "}
              {metadata.rule_set_year}, projected after
            </>
          )}
        </p>
      </footer>
    </>
  );
}
