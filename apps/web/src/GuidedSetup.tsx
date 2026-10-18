// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountType } from "./generated/types/household-input.v2";
import { Answer, type Result } from "./Answer";
import { engine } from "./engine";
import {
  accountTypes,
  addAccount,
  changeAccountType,
  changeEntry,
  fieldErrors,
  fields,
  linkWages,
  serializeDraft,
  setupSteps,
  type Draft,
  type Field,
} from "./setup";
export function Setup({
  sample,
  draft,
  setDraft,
  backToStart,
}: {
  sample: { name: string; label: string };
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  backToStart: () => void;
}) {
  const [step, setStep] = useState(0);
  const visited = draft.visited;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingType, setEditingType] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Result | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const request = useRef(0);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function update(next: Draft) {
    request.current++;
    setPending(false);
    setAnswer(null);
    setFailure(null);
    setDraft(next);
  }
  function move(next: number) {
    if (next === 5) {
      for (let index = 0; index < 5; index++) {
        const errors = fieldErrors(draft, index);
        if (Object.keys(errors).length) {
          setErrors(errors);
          setStep(index);
          return;
        }
      }
    }
    request.current++;
    setPending(false);
    setAnswer(null);
    setFailure(null);
    setErrors({});
    setDraft({ ...draft, visited: [...new Set([...visited, next])] });
    setStep(next);
  }
  function next() {
    const errors = fieldErrors(draft, step);
    setErrors(errors);
    if (!Object.keys(errors).length) move(step + 1);
    else
      requestAnimationFrame(() =>
        document.getElementById(Object.keys(errors)[0])?.focus(),
      );
  }
  async function check() {
    for (let index = 0; index < 5; index++) {
      const errors = fieldErrors(draft, index);
      if (Object.keys(errors).length) {
        setErrors(errors);
        setStep(index);
        return;
      }
    }
    const id = ++request.current;
    setAnswer(null);
    setFailure(null);
    setPending(true);
    try {
      const json = await engine.call(
        "sustainable_spending",
        serializeDraft(draft),
      );
      if (id === request.current) setAnswer(JSON.parse(json) as Result);
    } catch (error) {
      if (id === request.current) setFailure((error as Error).message);
    } finally {
      if (id === request.current) setPending(false);
    }
  }
  function renderField(field: Field) {
    const rough = draft.rough.includes(field.path);
    const eligible = field.kind === "dollars" || field.kind === "percent";
    return (
      <div className={`field-row ${rough ? "rough" : ""}`} key={field.path}>
        <label htmlFor={field.path}>
          {field.label} {field.basis && <small>{field.basis}</small>}
        </label>
        {field.kind === "select" ? (
          <select
            id={field.path}
            value={field.value}
            onChange={(event) => {
              if (field.path.endsWith("/account_type"))
                update(
                  changeAccountType(
                    draft,
                    Number(field.path.split("/")[3]),
                    event.target.value as AccountType,
                  ),
                );
              else update(changeEntry(draft, field.path, event.target.value));
            }}
          >
            {Object.entries(field.options!).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.path}
            type={field.kind === "date" ? "date" : "text"}
            inputMode={
              field.kind === "date"
                ? undefined
                : field.kind === "percent"
                  ? "decimal"
                  : "numeric"
            }
            value={field.value}
            readOnly={field.readOnly}
            aria-invalid={!!errors[field.path]}
            aria-describedby={`${field.path}-help ${errors[field.path] ? `${field.path}-error` : ""}`.trim()}
            onChange={(event) => {
              update(changeEntry(draft, field.path, event.target.value));
              if (errors[field.path])
                setErrors((previous) => {
                  const next = { ...previous };
                  delete next[field.path];
                  return next;
                });
            }}
          />
        )}
        <p className="help" id={`${field.path}-help`}>
          {field.help}
        </p>
        {eligible && (
          <label className="rough-toggle">
            <input
              type="checkbox"
              aria-label={`${field.label}: Rough`}
              checked={rough}
              onChange={() =>
                update({
                  ...draft,
                  rough: rough
                    ? draft.rough.filter((path) => path !== field.path)
                    : [...draft.rough, field.path],
                  dirty: true,
                })
              }
            />{" "}
            Rough{rough && <span className="rough-label">≈ Rough value</span>}
          </label>
        )}
        {errors[field.path] && (
          <p className="field-error" id={`${field.path}-error`} role="alert">
            {errors[field.path]}
          </p>
        )}
      </div>
    );
  }
  return (
    <>
      <p className="eyebrow">Sample household</p>
      <h1>{sample.label}</h1>
      <p className="lede">
        Review the sample's answers, one short step at a time.
      </p>
      <div className="setup-layout">
        <aside className="card">
          <nav aria-label="Setup steps">
            <ol className="setup-steps">
              {setupSteps.map((label, index) => (
                <li key={label}>
                  {visited.includes(index) ? (
                    <button
                      className="link"
                      aria-current={step === index ? "step" : undefined}
                      onClick={() => move(index)}
                    >
                      {index !== step && <span aria-hidden="true">✓ </span>}
                      {label}
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div>
          <h2 ref={heading} tabIndex={-1}>
            {setupSteps[step]}
          </h2>
          {step < 5 ? (
            <form
              className="card"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
            >
              {step === 1 && draft.input.household.income.wages.length > 0 && (
                <label className="wage-link">
                  <input
                    type="checkbox"
                    checked={draft.linkedWages}
                    onChange={(event) =>
                      update(linkWages(draft, event.target.checked))
                    }
                  />{" "}
                  Wages end on my retirement date
                </label>
              )}
              {step === 1 && !draft.input.household.income.wages.length && (
                <p>This sample has no wage entry.</p>
              )}
              {step === 2 ? (
                <>
                  {draft.input.household.accounts.map((account) => (
                    <fieldset className="account" key={account.id}>
                      <legend>
                        {account.id === "401k" ? "401(k)" : account.id} —{" "}
                        {accountTypes[account.account_type]}
                      </legend>
                      <button
                        className="link"
                        type="button"
                        onClick={() =>
                          setEditingType((previous) => [
                            ...previous,
                            account.id,
                          ])
                        }
                      >
                        Edit type
                      </button>
                      {fields(draft, step)
                        .filter(
                          (field) =>
                            field.group === account.id &&
                            (!field.path.endsWith("/account_type") ||
                              editingType.includes(account.id)),
                        )
                        .map(renderField)}
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    onClick={() => update(addAccount(draft))}
                  >
                    + Add an account
                  </button>
                </>
              ) : (
                fields(draft, step).map(renderField)
              )}
              <div className="actions">
                <button
                  type="button"
                  onClick={() => (step === 0 ? backToStart() : move(step - 1))}
                >
                  Back
                </button>
                <button className="primary" type="submit">
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <>
              {setupSteps.slice(0, 5).map((label, index) => (
                <section
                  className="card review-group"
                  key={label}
                  aria-label={label}
                >
                  <div className="section-heading">
                    <h3>{label}</h3>
                    <a
                      href={`#setup-${index}`}
                      onClick={(event) => {
                        event.preventDefault();
                        move(index);
                      }}
                    >
                      Edit {label}
                    </a>
                  </div>
                  {index === 1 &&
                    draft.input.household.income.wages.length > 0 && (
                      <p>
                        Wages end on my retirement date:{" "}
                        {draft.linkedWages ? "Yes" : "No"}
                      </p>
                    )}
                  <dl>
                    {fields(draft, index).map((field) => (
                      <div
                        className={`review-field ${draft.rough.includes(field.path) ? "rough" : ""}`}
                        key={field.path}
                      >
                        <dt>
                          {field.group && `${field.group}: `}
                          {field.label}
                        </dt>
                        <dd>
                          {field.options
                            ? field.options[field.value]
                            : field.kind === "dollars"
                              ? `$${field.value.replace(/^\$/, "")}`
                              : field.value}
                          {field.basis && <small>{field.basis}</small>}
                          {draft.rough.includes(field.path) && (
                            <span className="rough-label">≈ Rough value</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <div className="actions">
                <button onClick={() => move(4)}>Back</button>
                <button
                  className="primary"
                  aria-disabled={pending}
                  aria-busy={pending}
                  onClick={() => {
                    if (!pending) void check();
                  }}
                >
                  Check this household
                </button>
              </div>
              <div aria-live="polite" aria-atomic="true">
                {pending ? (
                  <p role="status">Checking this household…</p>
                ) : failure ? (
                  <section className="card">
                    <h3>Calculation unavailable</h3>
                    <p>{failure}</p>
                  </section>
                ) : answer ? (
                  <div data-testid="checked-result">
                    <Answer answer={answer} />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
