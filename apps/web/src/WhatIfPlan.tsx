// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState, type ReactNode } from "react";
import { engine } from "./engine";
import { IntakeHead } from "./IntakeHead";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { AnswersPlanV2, Fixture } from "./generated/types/answers-plan.v2";
import type { Place } from "./intake-fields";
import {
  changedAnswers,
  keptAnswers,
  sliderError,
  sliderStarts,
  sliderText,
  type Changes,
  type Slider,
} from "./what-if";

function Control({
  slider,
  value,
  edit,
  commit,
}: {
  slider: Slider;
  value: string;
  edit: (value: string) => void;
  commit: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const [error, setError] = useState("");
  const changed = Number(value) !== Number(slider.entry);
  const position = (n: number) =>
    Math.max(
      0,
      Math.min(100, ((n - slider.min) / (slider.max - slider.min)) * 100),
    );
  function numberCommit() {
    const reason = sliderError(slider, text);
    setError(reason);
    if (!reason) commit(text);
  }
  return (
    <div className="what-if-control">
      <div className="what-if-label">
        <label htmlFor={`what-if-${slider.id}`}>{slider.label}</label>
        <strong>{sliderText(slider, value)}</strong>
      </div>
      <input
        id={`what-if-${slider.id}`}
        type="range"
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={value}
        aria-valuetext={sliderText(slider, value, true)}
        aria-describedby={`what-if-note-${slider.id}`}
        onChange={(event) => {
          const next = event.target.value;
          edit(next);
          setText(next);
          setError("");
        }}
        onPointerUp={(event) => commit(event.currentTarget.value)}
        onKeyUp={(event) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "PageUp",
              "PageDown",
              "Home",
              "End",
            ].includes(event.key)
          )
            commit(event.currentTarget.value);
        }}
      />
      <svg
        className="what-if-marks"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {slider.band ? (
          <line
            className="what-if-band"
            x1={position(slider.band[0])}
            x2={position(slider.band[1])}
            y1="3"
            y2="3"
          />
        ) : slider.marker ? (
          <line
            x1={position(Number(slider.entry))}
            x2={position(Number(slider.entry))}
            y1="1"
            y2="6"
          />
        ) : null}
      </svg>
      <label className="sr-only" htmlFor={`what-if-number-${slider.id}`}>
        {slider.label},{" "}
        {slider.unit === "money"
          ? "dollars"
          : slider.unit === "rate"
            ? "percent"
            : "age"}
      </label>
      <input
        id={`what-if-number-${slider.id}`}
        type="number"
        min={slider.min}
        max={slider.max}
        step={slider.unit === "age" ? 1 : "any"}
        value={text}
        aria-invalid={!!error}
        aria-describedby={`${error ? `what-if-error-${slider.id} ` : ""}what-if-note-${slider.id}`}
        onChange={(event) => {
          setText(event.target.value);
          setError(sliderError(slider, event.target.value));
        }}
        onBlur={numberCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            numberCommit();
          }
        }}
      />
      {error && (
        <p
          className="help field-error"
          id={`what-if-error-${slider.id}`}
          role="alert"
        >
          {error}
        </p>
      )}
      <p
        className={`help${slider.notSure ? " rough" : ""}`}
        aria-label={slider.notSure ? `${slider.note}; not sure` : undefined}
        id={`what-if-note-${slider.id}`}
      >
        {slider.note}
        {changed && (
          <>
            {" "}
            · <span className="rough-label">what if</span>
          </>
        )}
      </p>
    </div>
  );
}

export function WhatIfPlan({
  result,
  answers,
  change,
  keep,
  onInput,
  children,
}: {
  result: AnswersPlanV2;
  answers: AnswersV2;
  change: (place: Place) => void;
  keep: (answers: AnswersV2) => void;
  onInput: (input: Fixture | null, result: AnswersPlanV2) => void;
  children: (input: Fixture, result: AnswersPlanV2) => ReactNode;
}) {
  const sliders = sliderStarts(answers, result);
  const [changes, setChanges] = useState<Changes>({});
  const changesRef = useRef<Changes>({});
  const [shown, setShown] = useState(result);
  const [document, setDocument] = useState(answers);
  const [working, setWorking] = useState(false);
  const [settled, setSettled] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const request = useRef(0);
  const lastSent = useRef(JSON.stringify(answers));
  const lastSentId = useRef(-1);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const active = Object.keys(changes).length > 0;
  function edit(slider: Slider, value: string) {
    const next = { ...changesRef.current };
    if (Number(value) === Number(slider.entry)) delete next[slider.id];
    else next[slider.id] = value;
    if (JSON.stringify(next) !== JSON.stringify(changesRef.current)) {
      request.current++;
      setSettled(false);
    }
    changesRef.current = next;
    setChanges(next);
    return next;
  }
  function restore() {
    request.current++;
    changesRef.current = {};
    setChanges({});
    setShown(result);
    setDocument(answers);
    setWorking(false);
    setSettled(true);
    setFailure(null);
    lastSent.current = JSON.stringify(answers);
    setReset((value) => value + 1);
    onInput(result.household_input ?? null, result);
  }
  function commit(slider: Slider, value: string) {
    if (sliderError(slider, value)) return;
    const next = edit(slider, value);
    if (!Object.keys(next).length) {
      restore();
      return;
    }
    const changed = changedAnswers(answers, result, next);
    const json = JSON.stringify(changed);
    if (
      json === lastSent.current &&
      !failure &&
      (settled || lastSentId.current === request.current)
    )
      return;
    lastSent.current = json;
    const id = ++request.current;
    lastSentId.current = id;
    setWorking(true);
    setSettled(false);
    setFailure(null);
    engine
      .call("plan_from_answers", json)
      .then((reply) => {
        if (id !== request.current) return;
        const value = JSON.parse(reply) as AnswersPlanV2;
        setShown(value);
        setDocument(changed);
        setWorking(false);
        setSettled(true);
        onInput(value.household_input ?? null, value);
      })
      .catch((error: Error) => {
        if (id !== request.current) return;
        setFailure(error.message);
        setWorking(false);
      });
  }
  return (
    <>
      {working || failure ? (
        <div className="intake-head" aria-live="polite">
          {active && (
            <span className="rough-label">What if: not your answers</span>
          )}
          <h1 role={failure ? "alert" : "status"}>
            {failure ? "Calculation unavailable" : "Working out your plan…"}
          </h1>
          {failure && <p>{failure}</p>}
        </div>
      ) : (
        <IntakeHead
          result={shown}
          answers={document}
          change={change}
          whatIf={active}
          savedAnswers={answers}
          changed={Object.keys(changes).map(
            (id) =>
              ({
                retire: "retirement",
                spending: "spending_in_retirement",
                social_security_from: "social_security",
                investments_grow: "assumptions.investment_return",
                prices_rise: "assumptions.inflation",
              })[id as "retire"] ?? id,
          )}
        />
      )}
      {!!sliders.length &&
        (working || failure || !!sliderStarts(document, shown).length) && (
          <section
            className="card what-if-panel"
            aria-labelledby="what-if-heading"
          >
            <h2 id="what-if-heading">What if…</h2>
            <p>
              Move any of these to see how your plan changes. Your answers stay
              as they are until you choose to keep a change.
            </p>
            <p className="help">Money amounts are in today's dollars.</p>
            <div className="what-if-grid">
              {sliders.map((slider) => (
                <Control
                  key={`${reset}-${slider.id}`}
                  slider={slider}
                  value={changes[slider.id] ?? slider.entry}
                  edit={(value) => edit(slider, value)}
                  commit={(value) => commit(slider, value)}
                />
              ))}
            </div>
            <div className="actions">
              <button onClick={restore}>Reset to my answers</button>
              <button
                disabled={
                  !active ||
                  working ||
                  !settled ||
                  !!failure ||
                  !shown.household_input
                }
                onClick={() =>
                  keep(keptAnswers(answers, result, shown, changesRef.current))
                }
              >
                Keep these as my answers
              </button>
            </div>
          </section>
        )}
      {!working &&
        !failure &&
        shown.household_input &&
        children(shown.household_input, shown)}
    </>
  );
}
