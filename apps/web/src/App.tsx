// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { engine } from "./engine";
import { samples } from "./fixtures";
import { footerRules } from "./plain-results";
import { statusWord } from "./format";
import type { Result } from "./Answer";
import { createDraft, serializeDraft, type Draft } from "./setup";
import { Plan } from "./Plan";
import { Export } from "./Export";
import { Compare } from "./Compare";
import { CopyPanel } from "./CopyPanel";
import {
  calculateCopy,
  copyLabels,
  type Baseline,
  type Copies,
} from "./plan-copies";
import type { PlanCache } from "./plan-results";
import type { Lever } from "./generated/types/levers.v1";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { Intake } from "./Intake";
import { WhatIfPlan } from "./WhatIfPlan";
import { buildAnswers, newFields, type Place } from "./intake-fields";
import {
  loadIntake,
  saveIntake,
  forgetIntake,
  savedNotice,
  corruptNotice,
  type SavedIntake,
} from "./intake-storage";
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
type View = "welcome" | "examples" | "intake" | "plan" | "compare" | "export";
export function App() {
  const [view, setView] = useState<View>("welcome");
  const [selected, setSelected] = useState(samples[0].name);
  const [question, setQuestion] = useState("retire");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<SavedIntake | null>(null);
  const [own, setOwn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [corrupt, setCorrupt] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [openedFile, setOpenedFile] = useState(false);
  const [exportAnswerResult, setExportAnswerResult] =
    useState<AnswersPlanV2 | null>(null);
  const [exportAnswers, setExportAnswers] = useState<AnswersV2 | undefined>();
  const [answerResult, setAnswerResult] = useState<AnswersPlanV2 | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [copies, setCopies] = useState<Copies | null>(null);
  const [currentCopy, setCurrentCopy] = useState("");
  const [panel, setPanel] = useState<Baseline | null>(null);
  const [planCache] = useState<PlanCache>(() => new Map());
  const trigger = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    heading.current?.focus();
  }, [view]);
  useEffect(() => {
    let active = true;
    loadIntake((json) => engine.call("plan_from_answers", json))
      .then((value) => {
        if (!active) return;
        setSaved(value.saved);
        setUnavailable(!!value.unavailable);
        setCorrupt(!!value.corrupt);
        setLoaded(true);
      })
      .catch((error: Error) => {
        if (active) {
          setFailure(error.message);
          setLoaded(true);
        }
      });
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
  const answersJson = saved ? JSON.stringify(saved.answers) : "";
  useEffect(() => {
    if (!own || view !== "plan") return;
    let active = true;
    engine
      .call("plan_from_answers", answersJson)
      .then((json) => {
        if (!active) return;
        const result = JSON.parse(json) as AnswersPlanV2;
        setAnswerResult(result);
        setExportAnswerResult(result);
        setExportAnswers(JSON.parse(answersJson) as AnswersV2);
        if (result.household_input) {
          const next = createDraft(JSON.stringify(result.household_input));
          next.visited = [0, 1, 2, 3, 4, 5];
          setDraft(next);
        } else setDraft(null);
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>('[data-testid="intake-headline"]')
            ?.focus(),
        );
      })
      .catch((error: Error) => {
        if (active) setFailure(error.message);
      });
    return () => {
      active = false;
    };
  }, [own, view, answersJson]);
  function update(value: SavedIntake) {
    if (JSON.stringify(value.answers) !== answersJson) {
      setCopies(null);
      planCache.clear();
    }
    setSaved(value);
    if (!saveIntake(value)) setUnavailable(true);
  }
  function forget() {
    if (
      !window.confirm(
        "Forget your answers on this device? This can't be undone.",
      )
    )
      return;
    forgetIntake();
    setSaved(null);
    setDraft(null);
    setAnswerResult(null);
    setOwn(false);
    setCopies(null);
    setPanel(null);
    planCache.clear();
    setView("welcome");
  }
  function welcome() {
    setView("welcome");
    setPanel(null);
  }
  function change(place: Place = "review") {
    if (!saved) return;
    setAnswerResult(null);
    setExportAnswerResult(null);
    setPanel(null);
    update({ ...saved, place });
    setView("intake");
  }
  function showPlan(value = saved) {
    setFailure(null);
    if (own && value) {
      update({ ...value, place: "results" });
      setAnswerResult(null);
    }
    setPanel(null);
    setView("plan");
  }
  function start() {
    setOwn(true);
    setOpenedFile(false);
    setCopies(null);
    setDraft(null);
    setFailure(null);
    if (saved) {
      setView(saved.place === "results" ? "plan" : "intake");
    } else {
      const next: SavedIntake = {
        format: "horizon-saved-intake",
        version: 1,
        answers: buildAnswers(newFields()),
        style: "one_question",
        place: "1",
      };
      update(next);
      setView("intake");
    }
  }
  function example() {
    const next = createDraft(samples.find((s) => s.name === selected)!.json);
    next.visited = [0, 1, 2, 3, 4, 5];
    setDraft(next);
    setOwn(false);
    setOpenedFile(false);
    setCopies(null);
    setPanel(null);
    planCache.clear();
    setView("plan");
  }
  function openFile(input: string) {
    const next = createDraft(input);
    next.visited = [0, 1, 2, 3, 4, 5];
    setDraft(next);
    setOwn(false);
    setOpenedFile(true);
    setCopies(null);
    setPanel(null);
    planCache.clear();
    setView("plan");
  }
  function showPanel(baseline: Baseline) {
    trigger.current = document.activeElement as HTMLElement;
    setPanel(baseline);
  }
  function makeCopy(lever: Lever) {
    if (
      !draft ||
      !panel ||
      copies?.items.some((copy) => copy.lever.id === lever.id)
    )
      return;
    const input = serializeDraft(draft),
      baseline = copies?.baseline ?? panel,
      copy = { lever, ...copyLabels(lever, baseline.run) };
    setCopies((previous) => ({
      input,
      baseline,
      items: [...(previous?.items ?? []), copy],
    }));
    setCurrentCopy(lever.id);
    setPanel(null);
    setView("compare");
    void calculateCopy(input, baseline, copy, setCopies);
  }
  const sample = own
    ? { label: "Your figures", name: "own", json: "" }
    : openedFile
      ? { label: "Opened plan file", name: "opened", json: "" }
      : samples.find((s) => s.name === selected)!;
  const metadata = Object.values(results).find((result) => "run" in result)?.run
    .metadata;
  const steps = own
    ? ["Your answers", "Plan", "Compare", "Export"]
    : ["Plan", "Compare", "Export"];
  function step(name: string) {
    if (name === "Your answers") change();
    else if (name === "Plan") showPlan();
    else setView(name.toLowerCase() as View);
  }
  return (
    <>
      <header>
        <button
          className="brand brand-button"
          onClick={welcome}
          aria-label="Horizon welcome"
        >
          <span className="brand-mark" aria-hidden="true" />
          <span>
            Horizon<small>NextPhase</small>
          </span>
        </button>
        {["plan", "compare", "export"].includes(view) && (
          <nav aria-label="Planning steps">
            <ol className="planning-steps">
              {steps.map((name) => (
                <li
                  key={name}
                  aria-current={
                    view === name.toLowerCase() ? "step" : undefined
                  }
                >
                  <button
                    disabled={
                      name === "Compare"
                        ? !copies?.items.length
                        : name === "Plan" && !draft && !own
                    }
                    onClick={() => step(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <button
          aria-label="Toggle theme"
          onClick={() => {
            const current =
              theme ??
              (matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light");
            setTheme(current === "dark" ? "light" : "dark");
          }}
        >
          Theme
        </button>
      </header>
      <main>
        {view === "intake" && saved ? (
          <Intake
            saved={saved}
            update={update}
            forget={forget}
            unavailable={unavailable}
            plan={showPlan}
          />
        ) : view === "plan" ? (
          <>
            {own &&
              (failure ? (
                <section role="alert">
                  <h1>Calculation unavailable</h1>
                  <p>{failure}</p>
                </section>
              ) : answerResult && saved ? (
                <WhatIfPlan
                  key={answersJson}
                  result={answerResult}
                  answers={saved.answers}
                  change={change}
                  keep={(answers) => {
                    setAnswerResult(null);
                    update({ ...saved, answers });
                  }}
                  onInput={(input, result, answers) => {
                    setExportAnswers(answers);
                    setExportAnswerResult(result);
                    setCopies(null);
                    setDraft(input ? createDraft(JSON.stringify(input)) : null);
                  }}
                >
                  {(input, result) => (
                    <Plan
                      key={JSON.stringify(input)}
                      sample={sample}
                      draft={createDraft(JSON.stringify(input))}
                      back={() => change()}
                      tryChange={showPanel}
                      exportPlan={() => setView("export")}
                      cache={planCache}
                      intake
                      answerResult={result}
                    />
                  )}
                </WhatIfPlan>
              ) : (
                <h1 role="status">Working out your plan…</h1>
              ))}
            {draft && !own && (
              <Plan
                key={serializeDraft(draft)}
                sample={sample}
                draft={draft}
                back={own ? () => change() : welcome}
                tryChange={showPanel}
                exportPlan={() => setView("export")}
                cache={planCache}
                intake={own}
              />
            )}
            {own && (
              <button onClick={() => change()}>Back to my answers</button>
            )}
          </>
        ) : view === "compare" && copies ? (
          <Compare
            key={currentCopy}
            sample={sample}
            copies={copies}
            copy={copies.items.find((c) => c.lever.id === currentCopy)!}
            select={setCurrentCopy}
            newCopy={() => showPanel(copies.baseline)}
            back={() => showPlan()}
            exportPlan={() => setView("export")}
          />
        ) : view === "export" ? (
          <Export
            sample={sample}
            draft={draft}
            copies={copies}
            cache={planCache}
            opened={openFile}
            answers={own ? saved?.answers : undefined}
            headAnswers={own ? (exportAnswers ?? saved?.answers) : undefined}
            answerResult={
              own
                ? (exportAnswerResult ?? answerResult ?? undefined)
                : undefined
            }
          />
        ) : view === "examples" ? (
          <div className="intake">
            <h1 ref={heading} tabIndex={-1}>
              Try an example household
            </h1>
            <p className="sample">◇ Example household — invented figures</p>
            <fieldset className="card choices">
              <legend>Choose an example household</legend>
              {samples.map((item) => (
                <label className="choice" key={item.name}>
                  <input
                    type="radio"
                    name="household"
                    checked={selected === item.name}
                    onChange={() => setSelected(item.name)}
                  />
                  <strong>{item.label}</strong>
                </label>
              ))}
            </fieldset>
            <button className="primary" onClick={example}>
              Open example plan
            </button>
            <button onClick={welcome}>Back</button>
          </div>
        ) : (
          <div className="intake welcome">
            <section className="card">
              <p className="eyebrow">Horizon</p>
              <h1 ref={heading} tabIndex={-1}>
                See whether your savings can carry your retirement
              </h1>
              <p>
                Answer a few questions about your age, income, savings and
                spending. Horizon works out, year by year, whether your money
                lasts, and shows what would change the answer.
              </p>
              <p className="muted">
                It takes about 10 minutes. Rough figures are fine; you can mark
                anything you're unsure of, give a range, or add it later.
              </p>
              <div className="actions">
                <button className="primary" disabled={!loaded} onClick={start}>
                  {saved
                    ? "Continue with my answers"
                    : "Start with my own figures"}
                </button>
                <button
                  onClick={() => {
                    setView("examples");
                    setOwn(false);
                  }}
                >
                  Try an example household
                </button>
              </div>
              <p className="help">
                {savedNotice}{" "}
                <button className="link-button" onClick={forget}>
                  Forget my answers
                </button>
              </p>
              {corrupt && <p role="status">{corruptNotice}</p>}
              {failure && (
                <p role="alert">Calculation unavailable: {failure}</p>
              )}
            </section>
            <fieldset className="card choices">
              <legend>What would you like to find out?</legend>
              {[
                {
                  id: "retire",
                  label: "Can I afford to retire when I want to?",
                },
                { id: "spend", label: "How much can I spend each year?" },
                { id: "claim", label: "When should I claim Social Security?" },
              ].map((item) => (
                <label className="choice" key={item.id}>
                  <input
                    type="radio"
                    name="question"
                    aria-label={item.label}
                    checked={question === item.id}
                    disabled={item.id === "claim"}
                    onChange={() => setQuestion(item.id)}
                  />
                  <span>
                    {item.label}
                    {item.id === "claim" && (
                      <small>Claiming-age rules are not modelled.</small>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              className="link-button"
              onClick={() => {
                setOwn(false);
                setDraft(null);
                setView("export");
              }}
            >
              Open a plan file
            </button>
          </div>
        )}
        {panel && (
          <CopyPanel
            key={copies?.items.length ?? 0}
            baseline={panel}
            copies={copies?.items ?? []}
            make={makeCopy}
            cancel={() => {
              setPanel(null);
              requestAnimationFrame(() => trigger.current?.focus());
            }}
          />
        )}
      </main>
      <footer>
        <p className="reference-footer">
          Open source (AGPL-3.0-only) · Your answers stay on this device.{" "}
          <button className="link-button" onClick={forget}>
            Forget my answers
          </button>
          {metadata && (
            <>
              {" "}
              · {footerRules(metadata.rule_set_year, metadata.model_version)}
            </>
          )}
        </p>
      </footer>
    </>
  );
}
