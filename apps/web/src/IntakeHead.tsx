// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import {
  headText,
  neededLabels,
  leftOutText,
  rangeName,
  startingText,
  answerQuestion,
} from "./intake-head";
import { statusWord } from "./format";
import type { Place } from "./intake-fields";
export function IntakeHead({
  result,
  answers,
  change,
}: {
  result: AnswersPlanV2;
  answers: AnswersV2;
  change: (place: Place) => void;
}) {
  const { headline, lines } = headText(result, answers);
  const count =
    (result.central?.omissions.length ?? 0) + result.left_out.length;
  const starting = startingText(result);
  const ranges =
    result.bounds?.ranked.map((item) => rangeName(item.answer, result)) ?? [];
  return (
    <div className="intake-head">
      <p className="eyebrow">Your plan</p>
      <h1 tabIndex={-1} data-testid="intake-headline">
        {headline}
      </h1>
      {lines
        .filter(
          (line) =>
            !line.startsWith("Given your ranges") &&
            !line.startsWith("Your ranges pull"),
        )
        .map((line, i) => (
          <p key={i} className="head-line">
            {line}
          </p>
        ))}
      {result.solved && <span className="rough-label">Worked out for you</span>}
      {lines
        .filter(
          (line) =>
            line.startsWith("Given your ranges") ||
            line.startsWith("Your ranges pull"),
        )
        .map((line) => (
          <p className="head-line" key={line}>
            {line}
          </p>
        ))}
      {result.status === "invalid" && <p className="help">{result.code}</p>}
      {result.status === "incomplete" && (
        <section className="card still-to-add">
          <ul>
            {result.needed.map((answer) => (
              <li key={answer}>
                <span>{neededLabels[answer]}</span>{" "}
                <button
                  className="link-button"
                  onClick={() => change(answerQuestion(answer) as Place)}
                >
                  Add now
                  <span className="sr-only">: {neededLabels[answer]}</span>
                </button>
              </li>
            ))}
          </ul>
          {result.needed.length === 1 && result.needed[0] === "retirement" && (
            <p>
              Or tell us your pay, and Horizon works out the earliest age you
              could retire.
            </p>
          )}
        </section>
      )}
      {result.status === "unsupported" && (
        <div className="card">
          <span className="status unsupported">
            ! Horizon can't plan for this yet
          </span>
          <p>
            Horizon plans for one person so far, and you're planning with a
            partner.
          </p>
        </div>
      )}
      {result.central && (
        <div className="card plan-status">
          <span className={`status ${result.status}`}>
            {result.status === "complete" ? "✓" : "△"}{" "}
            {statusWord(result.status, count)}
          </span>
          {count > 0 && (
            <details>
              <summary>
                {result.status === "complete"
                  ? "What Horizon doesn't count"
                  : "What this result leaves out"}
              </summary>
              <ul>
                {result.left_out.map((item) => (
                  <li key={item.answer}>{leftOutText(item)}</li>
                ))}
                {result.central.omissions.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {result.left_out.map((item) => (
        <section className="card gap-card" key={item.answer}>
          <p className="left-out-line">{leftOutText(item)}</p>
          <button
            className="link-button"
            onClick={() => change(answerQuestion(item.answer) as Place)}
          >
            Add it for a better result
            <span className="sr-only">: {item.answer}</span>
          </button>
        </section>
      ))}
      {result.bounds && (
        <section className="card">
          <h2>Why this is a range</h2>
          <p className="range-names">
            Some of your answers are ranges:{" "}
            {new Intl.ListFormat("en", {
              style: "long",
              type: "conjunction",
            }).format(ranges)}
            .
          </p>
          <p className="range-narrow">
            Narrowing {ranges[0]} would narrow the result most.{" "}
            <button
              className="link-button"
              onClick={() =>
                change(answerQuestion(result.bounds!.ranked[0].answer) as Place)
              }
            >
              Narrow it
            </button>
          </p>
        </section>
      )}
      {!!starting.length && (
        <section className="card starting-values">
          <h2>Starting values Horizon used</h2>
          <ul>
            {starting.map((item, i) => (
              <li key={i}>
                <span className="starting-text">{item.text}</span>{" "}
                <button
                  className="link-button"
                  onClick={() => change(answerQuestion(item.answer) as Place)}
                >
                  Change<span className="sr-only">: {item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
