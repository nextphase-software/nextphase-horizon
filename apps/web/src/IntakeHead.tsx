// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import {
  headText,
  neededLabels,
  leftOutText,
  startingText,
  answerQuestion,
} from "./intake-head";
import { answersCouldChange, plainLeftOut } from "./plain-results";
import { statusWord } from "./format";
import type { Place } from "./intake-fields";
export function IntakeHead({
  result,
  answers,
  change,
  whatIf = false,
  savedAnswers = answers,
  changed = [],
}: {
  result: AnswersPlanV2;
  answers: AnswersV2;
  change: (place: Place) => void;
  whatIf?: boolean;
  savedAnswers?: AnswersV2;
  changed?: string[];
}) {
  const { headline, lines } = headText(result, answers);
  const count =
    (result.central?.omissions.length ?? 0) + result.left_out.length;
  const starting = startingText(result);
  const uncertainty = answersCouldChange(result, savedAnswers, changed);
  return (
    <div className="intake-head">
      <p className="eyebrow">Your plan</p>
      {whatIf && (
        <span className="rough-label what-if-tag">
          What if: not your answers
        </span>
      )}
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
      {result.status === "invalid" && <p className="help">({result.code})</p>}
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
            ! Horizon can't plan for this yet.
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
              <summary>What this result doesn't count</summary>
              <ul>
                {result.left_out.map((item) => (
                  <li key={item.answer}>{leftOutText(item)}</li>
                ))}
                {result.central.omissions.map((text) => (
                  <li key={text}>{plainLeftOut(text)}</li>
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
      {(uncertainty.ranges.length > 0 || uncertainty.notSure) && (
        <section className="card answers-could-change">
          <h2>Answers that could change this</h2>
          {uncertainty.ranges.length > 0 && (
            <ul>
              {uncertainty.ranges.map((item) => (
                <li key={item.answer}>
                  <span>{item.text}</span>{" "}
                  <button
                    className="link-button"
                    onClick={() => change(answerQuestion(item.answer) as Place)}
                  >
                    Narrow it
                  </button>
                </li>
              ))}
            </ul>
          )}
          {uncertainty.notSure && (
            <p className="not-sure-line">{uncertainty.notSure}</p>
          )}
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
