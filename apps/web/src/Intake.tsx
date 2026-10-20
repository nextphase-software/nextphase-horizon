// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { IntakeQuestion, AgeField } from "./IntakeQuestion";
import {
  answerWords,
  buildAnswers,
  fieldsFromAnswers,
  visibleQuestions,
  questions,
  sections,
  sectionOf,
  questionError,
  moneyKeys,
  moneyQuestion,
  parseRate,
  dateWords,
  type Fields,
  type Style,
  type Place,
} from "./intake-fields";
import {
  savedNotice,
  unavailableNotice,
  type SavedIntake,
} from "./intake-storage";
export function Intake({
  saved,
  update,
  forget,
  unavailable,
  plan,
}: {
  saved: SavedIntake;
  update: (saved: SavedIntake) => void;
  forget: () => void;
  unavailable: boolean;
  plan: (saved: SavedIntake) => void;
}) {
  const [fields, setFields] = useState(() => {
    const f = fieldsFromAnswers(saved.answers);
    const current = Number(saved.place);
    if (current < 2) f.birthMode = "date";
    if (current < 4) f.retirementMode = "age";
    for (const key of moneyKeys)
      if (current < moneyQuestion[key]) f.money[key].later = false;
    return f;
  });
  const [place, setPlace] = useState<Place>(
    saved.place === "results" ? "review" : saved.place,
  );
  const [style, setStyle] = useState<Style>(saved.style);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [rates, setRates] = useState(fields.rates);
  const [rateError, setRateError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const visible = visibleQuestions(fields);
  const q = place === "review" ? 15 : Number(place);
  const section = sectionOf(q);
  useEffect(() => {
    heading.current?.focus();
  }, [place, style]);
  function document(
    f: Fields = fields,
    next: Place = place,
    nextStyle: Style = style,
  ) {
    return {
      ...saved,
      answers: buildAnswers(f),
      style: nextStyle,
      place: next,
    };
  }
  function navigate(next: Place, f = fields, nextStyle = style) {
    setPlace(next);
    setStyle(nextStyle);
    let value = { ...saved, place: next, style: nextStyle };
    try {
      const currentQuestions =
        style === "guided_page"
          ? visible.filter((n) => sectionOf(n) === section)
          : [q];
      if (!currentQuestions.some((n) => questionError(f, n)))
        value = document(f, next, nextStyle);
    } catch {
      /* Unconfirmed invalid text stays in the editor, not in saved answers. */
    }
    update(value);
    if (next === "review") setFields(fieldsFromAnswers(value.answers));
  }

  function change(f: Fields) {
    setFields(f);
  }
  function confirm() {
    if (style === "guided_page") {
      const next = visible.find((n) => sectionOf(n) > section);
      navigate(next ? (String(next) as Place) : "review");
    } else {
      const next = visible[visible.indexOf(q) + 1];
      navigate(next ? (String(next) as Place) : "review");
    }
  }
  const errors =
    style === "guided_page"
      ? visible
          .filter((n) => sectionOf(n) === section)
          .map((n) => questionError(fields, n))
          .filter(Boolean)
      : [questionError(fields, q)].filter(Boolean);
  const confirmed = saved.answers;
  let answers = confirmed;
  try {
    answers = buildAnswers(fields);
  } catch {
    /* Keep the last confirmed answers while an entry is being edited. */
  }
  const marked = (n: number) =>
    moneyKeys.find(
      (key) => moneyQuestion[key] === n && answers.not_sure?.includes(key),
    );
  const row = (n: number, action = "Change") => (
    <div className="intake-review-row" key={n}>
      <span>{questions[n - 1][0]}</span>
      <span>
        <strong>{answerWords(answers, n)}</strong>
        {marked(n) && <span className="rough-label">not sure</span>}{" "}
        <button
          type="button"
          className="link-button"
          aria-label={`${action}: ${questions[n - 1][0]}`}
          onClick={() => navigate(String(n) as Place)}
        >
          {action}
        </button>
      </span>
    </div>
  );
  const review = place === "review";
  return (
    <div className={`intake intake-${style}${review ? " intake-review" : ""}`}>
      {review ? (
        <>
          <p className="eyebrow">Review</p>
          <h1 ref={heading} tabIndex={-1}>
            Here's what you told us
          </h1>
          <p>Figures are as of {dateWords(answers.valuation_date)}</p>
          <p className="help">
            {unavailable ? unavailableNotice : savedNotice}{" "}
            <button className="link-button" onClick={forget}>
              Forget my answers
            </button>
          </p>
          {visible.some((n) =>
            answerWords(answers, n).includes("To add later"),
          ) && (
            <section className="card still-to-add">
              <h2>Still to add</h2>
              <p>
                You can see your plan now. Horizon will say what it could work
                out without these, and what each would add.
              </p>
              {visible
                .filter((n) => answerWords(answers, n).includes("To add later"))
                .map((n) => row(n, "Add now"))}
            </section>
          )}
          {sections.map((name, index) => (
            <section className="card" key={name}>
              <h2>{name}</h2>
              {visible.filter((n) => sectionOf(n) === index).map((n) => row(n))}
            </section>
          ))}
          {!!answers.not_sure?.length && (
            <section className="card">
              <h2>Answers you're not sure of</h2>
              <ul>
                {answers.not_sure.map((key) => (
                  <li key={key}>
                    {
                      questions[
                        moneyQuestion[key as keyof typeof moneyQuestion] - 1
                      ][0]
                    }
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card">
            <h2>What Horizon assumes</h2>
            <ul>
              <li>Prices rise {fields.rates.inflation ?? "2.5"}% a year</li>
              <li>
                Investments grow {fields.rates.investment_return ?? "5"}% a
                year; cash earns {fields.rates.cash_return ?? "2"}%
              </li>
              <li>
                Federal tax thresholds rise {fields.rates.tax_indexing ?? "2.5"}
                % a year
              </li>
            </ul>
            <button
              className="link-button"
              onClick={() => setRatesOpen(!ratesOpen)}
            >
              Change these
            </button>
            {ratesOpen && (
              <div>
                {Object.entries({
                  inflation: "Prices rise",
                  investment_return: "Investments grow",
                  cash_return: "Cash earns",
                  tax_indexing: "Federal tax thresholds rise",
                }).map(([key, label]) => (
                  <AgeField
                    key={key}
                    label={`${label}, percent a year`}
                    value={
                      rates[key] ??
                      {
                        inflation: "2.5",
                        investment_return: "5",
                        cash_return: "2",
                        tax_indexing: "2.5",
                      }[key as "inflation"]
                    }
                    change={(value) => setRates({ ...rates, [key]: value })}
                  />
                ))}
                {rateError && <p role="alert">{rateError}</p>}
                <button
                  onClick={() => {
                    try {
                      Object.values(rates).forEach(parseRate);
                      const next = { ...fields, rates };
                      setFields(next);
                      setRateError("");
                      setRatesOpen(false);
                      update(document(next));
                    } catch (error) {
                      setRateError((error as Error).message);
                    }
                  }}
                >
                  Use these rates
                </button>
              </div>
            )}
          </section>
          <section className="card">
            <h2>What Horizon doesn't count yet</h2>
            <ul>
              {[
                "State income tax",
                "Money you add to your savings from now on",
                "Dividends and interest inside a brokerage account",
                "Itemized deductions and tax credits",
                "The alternative minimum tax",
                ...(fields.planning === "partner" ? ["Your partner"] : []),
              ].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </section>
          <button
            className="primary"
            onClick={() => plan(document(fields, "results"))}
          >
            See my plan
          </button>
        </>
      ) : (
        <>
          <details key={style} className="style-switch">
            <summary>Answer in a different style</summary>
            <div className="actions">
              {Object.entries({
                one_question: "One question at a time",
                conversation: "Conversation",
                guided_page: "Guided page",
              }).map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={style === key}
                  onClick={() => navigate(place, fields, key as Style)}
                >
                  {label}
                </button>
              ))}
            </div>
          </details>
          {style === "one_question" && (
            <>
              <ol className="intake-progress">
                {sections.map((name, index) => (
                  <li
                    key={name}
                    aria-current={section === index ? "step" : undefined}
                  >
                    {section > index ? "✓ " : ""}
                    {name}
                    {section === index
                      ? ` · ${visible.filter((n) => sectionOf(n) === index).indexOf(q) + 1} of ${visible.filter((n) => sectionOf(n) === index).length}`
                      : ""}
                  </li>
                ))}
              </ol>
              <progress
                aria-label="Questions answered"
                max={visible.length}
                value={visible.indexOf(q)}
              />
            </>
          )}
          <div className="intake-layout">
            {style === "guided_page" && (
              <nav className="card section-list" aria-label="Answer sections">
                {[...sections, "Review"].map((name, index) => (
                  <button
                    className="link"
                    key={name}
                    aria-current={section === index ? "step" : undefined}
                    onClick={() =>
                      navigate(
                        index === 4
                          ? "review"
                          : (String(
                              visible.find((n) => sectionOf(n) === index),
                            ) as Place),
                      )
                    }
                  >
                    {index < section ? "✓ " : ""}
                    {name}
                  </button>
                ))}
              </nav>
            )}
            <div className="intake-body">
              {style === "conversation" && (
                <div className="conversation-thread">
                  {visible
                    .filter((n) => n < q)
                    .map((n) => (
                      <div key={n}>
                        <div className="card">
                          <strong>{questions[n - 1][0]}</strong>
                        </div>
                        <div
                          className={`thread-answer${marked(n) ? " rough" : ""}`}
                        >
                          {answerWords(answers, n)}{" "}
                          <button
                            className="link-button"
                            onClick={() => navigate(String(n) as Place)}
                          >
                            Change
                            <span className="sr-only">
                              : {questions[n - 1][0]}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {style === "guided_page" &&
                sections.map(
                  (name, index) =>
                    index < section && (
                      <section className="card folded-section" key={name}>
                        <span className="eyebrow">{name}</span>
                        {index < section && (
                          <>
                            <p>
                              {visible
                                .filter((n) => sectionOf(n) === index)
                                .map((n) => answerWords(answers, n))
                                .join(" · ")}
                            </p>
                            <button
                              className="link-button"
                              onClick={() =>
                                navigate(
                                  String(
                                    visible.find((n) => sectionOf(n) === index),
                                  ) as Place,
                                )
                              }
                            >
                              Change<span className="sr-only"> {name}</span>
                            </button>
                          </>
                        )}
                      </section>
                    ),
                )}
              <section className="card active-question">
                {(style === "guided_page"
                  ? visible.filter((n) => sectionOf(n) === section)
                  : [q]
                ).map((n, index) => (
                  <div className="intake-question" key={n}>
                    {index === 0 ? (
                      <h1 ref={heading} tabIndex={-1}>
                        {questions[n - 1][0]}
                      </h1>
                    ) : (
                      <h2>{questions[n - 1][0]}</h2>
                    )}
                    {questions[n - 1][1] && (
                      <p className="muted why">{questions[n - 1][1]}</p>
                    )}
                    <IntakeQuestion q={n} fields={fields} change={change} />
                  </div>
                ))}
                <div className="actions">
                  <button
                    className="primary"
                    disabled={errors.length > 0}
                    aria-describedby={
                      errors.length ? "continue-reason" : undefined
                    }
                    onClick={confirm}
                  >
                    {style === "guided_page"
                      ? section === 3
                        ? "Review my answers"
                        : `Next: ${sections[section + 1]}`
                      : "Continue"}
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        visible.indexOf(q) > 0
                          ? (String(visible[visible.indexOf(q) - 1]) as Place)
                          : "review",
                      )
                    }
                  >
                    Back
                  </button>
                </div>
                {errors.length > 0 && (
                  <p className="help" id="continue-reason">
                    {errors[0]}
                  </p>
                )}
              </section>
              {style === "guided_page" &&
                sections.map(
                  (name, index) =>
                    index > section && (
                      <section className="card folded-section" key={name}>
                        <span className="eyebrow">{name}</span>
                      </section>
                    ),
                )}
            </div>
            {style === "conversation" && (
              <aside className="card so-far">
                <h2>So far</h2>
                <progress
                  aria-label="Questions answered"
                  max={visible.length}
                  value={visible.indexOf(q)}
                />
                {visible
                  .filter((n) => n < q)
                  .map((n) => (
                    <div key={n}>
                      <p className="muted">{questions[n - 1][0]}</p>
                      <strong>{answerWords(answers, n)}</strong>
                      {marked(n) && (
                        <span className="rough-label">not sure</span>
                      )}
                    </div>
                  ))}
              </aside>
            )}
          </div>
          <button className="link-button" onClick={() => navigate("review")}>
            Review my answers
          </button>
        </>
      )}
    </div>
  );
}
