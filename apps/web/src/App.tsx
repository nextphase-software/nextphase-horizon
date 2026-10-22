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
import { usePlanResults, type PlanCache } from "./plan-results";
import { HeadlineFigures, PlanNavigation, type Section } from "./PlanShell";
import { headlineFigures, shellNote } from "./shell-display";
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Lever } from "./generated/types/levers.v1";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import { Intake } from "./Intake";
import {
  WhatIfPlan,
  type WhatIfSession,
  type DisplayState,
} from "./WhatIfPlan";
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
type View =
  | "welcome"
  | "examples"
  | "intake"
  | "overview"
  | "plan"
  | "compare"
  | "export"
  | "answers";
function Strip({
  input,
  cache,
  name,
  answer,
  whatIf,
}: {
  input: string;
  cache: PlanCache;
  name: string;
  answer?: AnswersPlanV2;
  whatIf: boolean;
}) {
  const { results, transport } = usePlanResults(input, cache);
  if (transport || Object.values(results).some((value) => "code" in value))
    return null;
  if (!results.run || !results.spending || !results.levers)
    return <p role="status">Calculating…</p>;
  const run = results.run as Run,
    spending = results.spending as SustainableSpending;
  const figures = headlineFigures(
    run,
    spending,
    JSON.parse(input).household.persons[0].retirement_date,
    answer,
  );
  return (
    figures && (
      <HeadlineFigures
        figures={figures}
        name={whatIf ? "What if" : name}
        note={shellNote(run, !!answer?.bounds)}
      />
    )
  );
}
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
  const [planSession, setPlanSession] = useState(false);
  const [focusChart, setFocusChart] = useState(false);
  const [whatIfSession, setWhatIfSession] = useState<WhatIfSession>();
  const [ownDisplay, setOwnDisplay] = useState<DisplayState>("ready");
  const [panel, setPanel] = useState<Baseline | null>(null);
  const [planCache] = useState<PlanCache>(() => new Map());
  const trigger = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);
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
    if (!own || !["overview", "plan"].includes(view) || answerResult) return;
    let active = true;
    engine
      .call("plan_from_answers", answersJson)
      .then((json) => {
        if (!active) return;
        const result = JSON.parse(json) as AnswersPlanV2;
        setAnswerResult(result);
        setOwnDisplay("ready");
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
        if (active) {
          setFailure(error.message);
          setOwnDisplay("failed");
        }
      });
    return () => {
      active = false;
    };
  }, [own, view, answersJson, answerResult]);
  function update(value: SavedIntake) {
    if (JSON.stringify(value.answers) !== answersJson) {
      setCopies(null);
      setCurrentCopy("");
      setWhatIfSession(undefined);
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
    if (Object.keys(whatIfSession?.changes ?? {}).length) setCopies(null);
    setAnswerResult(null);
    setWhatIfSession(undefined);
    setExportAnswerResult(null);
    setPanel(null);
    update({ ...saved, place });
    setCurrentCopy("");
    setView("intake");
  }
  function showPlan(value = saved) {
    setFailure(null);
    if (own && value) {
      update({ ...value, place: "results" });
      setAnswerResult(null);
      setOwnDisplay("calculating");
    }
    setPanel(null);
    setPlanSession(true);
    setCurrentCopy("");
    setView("overview");
  }
  function start() {
    setOwn(true);
    setCurrentCopy("");
    setWhatIfSession(undefined);
    setAnswerResult(null);
    setExportAnswerResult(null);
    setExportAnswers(undefined);
    setPlanSession(saved?.place === "results");
    setOpenedFile(false);
    setCopies(null);
    setDraft(null);
    setFailure(null);
    if (saved) {
      setView(saved.place === "results" ? "overview" : "intake");
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
    setCurrentCopy("");
    setPlanSession(true);
    setView("overview");
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
    setCurrentCopy("");
    setPlanSession(true);
    setView("overview");
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
  const activeCopy = copies?.items.find((c) => c.lever.id === currentCopy);
  useEffect(() => {
    heading.current?.focus();
  }, [view, failure, currentCopy, activeCopy?.error, activeCopy?.transport]);
  const layout =
    ["overview", "plan", "compare"].includes(view) ||
    (view === "export" && !!draft) ||
    ((view === "intake" || view === "answers") && planSession);
  function compare() {
    if (copies?.items.length)
      setCurrentCopy(currentCopy || copies.items.at(-1)!.lever.id);
    setView("compare");
  }
  function plan(chart = false) {
    setFocusChart(chart);
    setView("plan");
  }
  function summary() {
    setCurrentCopy("");
    setView("export");
  }
  function navigate(name: Section) {
    setPanel(null);
    if (name === "Overview") setView("overview");
    else if (name === "Plan") plan();
    else if (name === "Compare") compare();
    else if (name === "Summary") summary();
    else {
      setCurrentCopy("");
      if (own) change();
      else setView("answers");
    }
  }
  function switchPlan(id: string) {
    setCurrentCopy(id);
    if (
      (view === "compare" && !id) ||
      view === "export" ||
      view === "answers" ||
      view === "intake"
    )
      plan();
  }
  const layoutCurrent: Section =
    view === "export"
      ? "Summary"
      : view === "intake" || view === "answers"
        ? "Your answers"
        : view === "overview"
          ? "Overview"
          : view === "compare"
            ? "Compare"
            : "Plan";
  const copyProps = activeCopy
    ? { name: activeCopy.name, back: () => setCurrentCopy(""), compare }
    : undefined;
  const overview =
    view === "overview"
      ? {
          plan,
          compare,
          summary,
          changeAnswers: () => change(),
          tryChange: () => {},
          copies: copies?.items.length ?? 0,
        }
      : undefined;
  const shownInput = activeCopy
    ? (activeCopy.input ?? "")
    : draft
      ? serializeDraft(draft)
      : "";
  const shownAnswer =
    !activeCopy && own
      ? (exportAnswerResult ?? answerResult ?? undefined)
      : undefined;
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
        {layout && (
          <div className="plan-switcher">
            <label htmlFor="plan-switcher">Plan</label>
            <select
              id="plan-switcher"
              value={currentCopy}
              onChange={(event) => switchPlan(event.target.value)}
            >
              <option value="">Your plan</option>
              {copies?.items.map((copy) => (
                <option key={copy.lever.id} value={copy.lever.id}>
                  Copy: {copy.name}
                </option>
              ))}
            </select>
            {!copies?.items.length && (
              <span className="help">No copies yet</span>
            )}
          </div>
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
      <div className={layout ? "plan-layout" : undefined}>
        {layout && (
          <PlanNavigation
            current={layoutCurrent}
            count={(copies?.items.length ?? 0) + 1}
            open={navigate}
          />
        )}
        <main>
          {layout &&
            ["plan", "compare", "export"].includes(view) &&
            (own && !activeCopy && ownDisplay !== "ready" ? (
              ownDisplay === "calculating" ? (
                <p role="status">Calculating…</p>
              ) : null
            ) : (
              shownInput && (
                <Strip
                  key={shownInput}
                  input={shownInput}
                  cache={planCache}
                  name={activeCopy ? `Copy: ${activeCopy.name}` : "Your plan"}
                  answer={shownAnswer}
                  whatIf={
                    own &&
                    !!Object.keys(whatIfSession?.changes ?? {}).length &&
                    !activeCopy
                  }
                />
              )
            ))}
          {view === "intake" && saved ? (
            <Intake
              saved={saved}
              update={update}
              forget={forget}
              unavailable={unavailable}
              plan={showPlan}
            />
          ) : view === "answers" ? (
            <div className="intake">
              <h1 ref={heading} tabIndex={-1}>
                {openedFile
                  ? "This plan came from a file"
                  : "This is an example household"}
              </h1>
              <p>
                {openedFile
                  ? "A plan file holds figures, not answers, so there are no answers to change here."
                  : "Example households come with invented figures, so there are no answers to change. To see a plan from your own figures, answer a few questions. Your answers stay on this device."}
              </p>
              <div className="actions">
                <button onClick={start}>Start with my own figures</button>
                <button onClick={() => setView("examples")}>
                  Choose another example
                </button>
              </div>
            </div>
          ) : view === "plan" || view === "overview" ? (
            <>
              {activeCopy ? (
                activeCopy.input ? (
                  <Plan
                    key={activeCopy.input}
                    sample={{ label: own ? "Your figures" : sample.label }}
                    draft={createDraft(activeCopy.input)}
                    back={() => setCurrentCopy("")}
                    cache={planCache}
                    copy={copyProps}
                    overview={overview}
                    focusChart={view === "plan" && focusChart}
                  />
                ) : activeCopy.error || activeCopy.transport ? (
                  <section role="alert">
                    <h1 ref={heading} tabIndex={-1}>
                      Plan
                    </h1>
                    <h2 className="status unsupported">
                      <span aria-hidden="true">!</span>{" "}
                      {activeCopy.error
                        ? statusWord(activeCopy.error.status)
                        : "Calculation unavailable"}
                    </h2>
                    <p>{activeCopy.error?.message ?? activeCopy.transport}</p>
                  </section>
                ) : (
                  <p role="status">Calculating…</p>
                )
              ) : (
                own &&
                (failure ? (
                  <section role="alert">
                    <h1 ref={heading} tabIndex={-1}>
                      Calculation unavailable
                    </h1>
                    <p>{failure}</p>
                  </section>
                ) : answerResult && saved ? (
                  <WhatIfPlan
                    key={answersJson}
                    hidePanel={view === "overview"}
                    session={whatIfSession}
                    onState={setOwnDisplay}
                    result={answerResult}
                    answers={saved.answers}
                    change={change}
                    keep={(answers) => {
                      setAnswerResult(null);
                      setWhatIfSession(undefined);
                      update({ ...saved, answers });
                    }}
                    onInput={(input, result, answers, changes) => {
                      setExportAnswers(answers);
                      setExportAnswerResult(result);
                      setCopies(null);
                      setCurrentCopy("");
                      setWhatIfSession({ result, answers, changes });
                      setDraft(
                        input ? createDraft(JSON.stringify(input)) : null,
                      );
                    }}
                  >
                    {(input, result, active) => (
                      <Plan
                        key={JSON.stringify(input)}
                        sample={sample}
                        draft={createDraft(JSON.stringify(input))}
                        back={() => change()}
                        tryChange={showPanel}
                        exportPlan={summary}
                        overview={overview}
                        focusChart={view === "plan" && focusChart}
                        cache={planCache}
                        intake
                        whatIf={active}
                        answerResult={result}
                      />
                    )}
                  </WhatIfPlan>
                ) : (
                  <h1 role="status">Working out your plan…</h1>
                ))
              )}
              {draft && !own && !activeCopy && (
                <Plan
                  key={serializeDraft(draft)}
                  sample={sample}
                  draft={draft}
                  back={own ? () => change() : welcome}
                  tryChange={showPanel}
                  exportPlan={summary}
                  overview={overview}
                  focusChart={view === "plan" && focusChart}
                  cache={planCache}
                  intake={own}
                />
              )}
              {own && !activeCopy && view === "plan" && (
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
              back={() => {
                setCurrentCopy("");
                plan();
              }}
              exportPlan={summary}
            />
          ) : view === "compare" ? (
            <div className="plan-screen">
              <h1 ref={heading} tabIndex={-1}>
                Compare your plans side by side
              </h1>
              <p>
                Compare shows your plan next to copies you make. Try a change:
                it opens as a copy, and your plan stays as it is.
              </p>
              <EmptyChange
                input={shownInput}
                cache={planCache}
                open={showPanel}
              />
            </div>
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
                  It takes about 10 minutes. Rough figures are fine; you can
                  mark anything you're unsure of, give a range, or add it later.
                </p>
                <div className="actions">
                  <button
                    className="primary"
                    disabled={!loaded}
                    onClick={start}
                  >
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
                  {
                    id: "claim",
                    label: "When should I claim Social Security?",
                  },
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
                  setCopies(null);
                  setCurrentCopy("");
                  setPlanSession(false);
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
      </div>
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

function EmptyChange({
  input,
  cache,
  open,
}: {
  input: string;
  cache: PlanCache;
  open: (baseline: Baseline) => void;
}) {
  const { results } = usePlanResults(input, cache);
  const ready =
    results.run &&
    results.spending &&
    results.levers &&
    !Object.values(results).some((result) => "code" in result);
  return (
    <button disabled={!ready} onClick={() => open(results as Baseline)}>
      Try a change
    </button>
  );
}
