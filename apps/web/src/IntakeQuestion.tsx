// SPDX-License-Identifier: AGPL-3.0-only
import { useId } from "react";
import {
  months,
  kinds,
  blankAccount,
  moneyAnswer,
  moneyWords,
  enteredDollars,
  hasAccountEntry,
  questions,
  type Fields,
  type MoneyField,
  type MoneyKey,
} from "./intake-fields";
export function DateFields({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
}) {
  const id = useId();
  const [year = "", month = "", day = ""] = value.split("-");
  const part = (index: number, text: string) => {
    const parts = [year, month, day];
    parts[index] = text;
    change(parts.join("-"));
  };
  return (
    <fieldset className="date-fields">
      <legend>{label}</legend>
      <label htmlFor={`${id}-month`}>
        Month
        <select
          id={`${id}-month`}
          value={month}
          onChange={(event) => part(1, event.target.value)}
        >
          <option value="">Choose month</option>
          {months.map((name, i) => (
            <option key={name} value={String(i + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${id}-day`}>
        Day
        <input
          id={`${id}-day`}
          inputMode="numeric"
          value={day.replace(/^0(?=\d)/, "")}
          onChange={(event) =>
            part(
              2,
              event.target.value ? event.target.value.padStart(2, "0") : "",
            )
          }
        />
      </label>
      <label htmlFor={`${id}-year`}>
        Year
        <input
          id={`${id}-year`}
          inputMode="numeric"
          placeholder="e.g. 1965"
          value={year}
          onChange={(event) => part(0, event.target.value)}
        />
      </label>
    </fieldset>
  );
}
export function Options<T extends string>({
  label,
  value,
  options,
  change,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  change: (value: T) => void;
}) {
  const id = useId();
  return (
    <fieldset className="intake-options">
      <legend className="sr-only">{label}</legend>
      {Object.entries<string>(options).map(([key, text]) => (
        <label className="choice" key={key}>
          <input
            type="radio"
            name={id}
            value={key}
            checked={key === value}
            onChange={() => change(key as T)}
          />
          {text}
        </label>
      ))}
    </fieldset>
  );
}
export function AgeField({
  label,
  value,
  placeholder,
  change,
}: {
  label: string;
  value: string;
  placeholder?: string;
  change: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="field-row age-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => change(event.target.value)}
      />
    </div>
  );
}
export function MoneyControl({
  label,
  field,
  change,
  balance = false,
}: {
  label: string;
  field: MoneyField;
  change: (field: MoneyField) => void;
  balance?: boolean;
}) {
  const id = useId();
  let echo = "";
  try {
    const answer = moneyAnswer(field);
    if (!("later" in answer))
      echo = `${"cents" in answer ? enteredDollars(answer.cents) : `${enteredDollars(answer.range.low_cents)} to ${enteredDollars(answer.range.high_cents)}`}${balance ? "" : ` a ${field.per}`}.${field.range ? " Your results will show how much this range could change your plan." : ""}`;
  } catch {
    /* Question validation explains the entry. */
  }
  const input = (name: "text" | "low" | "high", text: string) => (
    <label className="money-input" htmlFor={`${id}-${name}`}>
      <span className="sr-only">{text}</span>
      <span className="dollar-field">
        <span aria-hidden="true">$</span>
        <input
          id={`${id}-${name}`}
          inputMode="decimal"
          value={field[name]}
          onChange={(event) =>
            change({ ...field, [name]: event.target.value, later: false })
          }
        />
      </span>
    </label>
  );
  return (
    <div className={`money-control${field.notSure ? " rough" : ""}`}>
      {field.range && <strong>Somewhere between</strong>}
      <div className="money-line">
        {field.range ? (
          <>
            {input("low", `${label}, lower amount`)}
            <span>and</span>
            {input("high", `${label}, higher amount`)}
          </>
        ) : (
          input("text", label)
        )}
        {!balance && (
          <div
            className="period-switch"
            role="group"
            aria-label={`${label} period`}
          >
            {(["year", "month"] as const).map((per) => (
              <button
                type="button"
                aria-pressed={field.per === per}
                key={per}
                onClick={() => change({ ...field, per })}
              >
                a {per}
              </button>
            ))}
          </div>
        )}
      </div>
      {echo && <p className="muted money-echo">{echo}</p>}
      <button
        type="button"
        className="link-button"
        onClick={() => change({ ...field, range: !field.range, later: false })}
      >
        {field.range
          ? "Give one figure instead"
          : balance
            ? "Not sure how much? Give a range"
            : "Not sure? Give a range instead"}
      </button>
    </div>
  );
}
export function IntakeQuestion({
  q,
  fields: f,
  change,
}: {
  q: number;
  fields: Fields;
  change: (fields: Fields) => void;
}) {
  const update = (patch: Partial<Fields>) => change({ ...f, ...patch });
  const setMoney = (key: MoneyKey, value: MoneyField) =>
    update({ money: { ...f.money, [key]: value } });
  const key = (
    {
      6: "pay",
      10: "social_security",
      12: "pension",
      13: "savings",
      14: "spending_now",
      15: "spending_in_retirement",
    } as Record<number, MoneyKey>
  )[q];
  const money = key && f.money[key];
  const later = () => key && setMoney(key, { ...money, later: true });
  return (
    <div className="question-controls">
      {q === 1 && (
        <>
          <Options
            label={questions[0][0]}
            value={f.planning}
            options={{ alone: "Just me", partner: "With a partner" }}
            change={(planning) => update({ planning })}
          />
          {f.planning === "partner" && (
            <p className="intake-tip">
              Horizon can plan for one person only so far. You can carry on for
              yourself; the result will not include your partner.
            </p>
          )}
        </>
      )}
      {q === 2 && (
        <>
          {f.birthMode === "later" && (
            <>
              <p className="intake-tip">
                Fine. Horizon needs this for any plan; you can add it from your
                results.
              </p>
              <button
                type="button"
                className="link-button"
                onClick={() => update({ birthMode: "date" })}
              >
                Answer it now instead
              </button>
            </>
          )}
          {f.birthMode === "age" ? (
            <AgeField
              label="Your age"
              value={f.age}
              change={(age) => update({ age })}
            />
          ) : (
            <DateFields
              label="Date of birth"
              value={f.birth}
              change={(birth) => update({ birth, birthMode: "date" })}
            />
          )}
          <div className="intake-links">
            <button
              type="button"
              className="link-button"
              onClick={() =>
                update({ birthMode: f.birthMode === "age" ? "date" : "age" })
              }
            >
              {f.birthMode === "age"
                ? "I'd rather give my date of birth"
                : "I'd rather give my age"}
            </button>
            {f.birthMode !== "later" && (
              <button
                type="button"
                className="link-button"
                onClick={() => update({ birthMode: "later" })}
              >
                I'll add this later
              </button>
            )}
          </div>
        </>
      )}
      {q === 3 && (
        <Options
          label={questions[2][0]}
          value={f.retired ? "yes" : "no"}
          options={{ no: "Not yet", yes: "Yes, I have" }}
          change={(value) => update({ retired: value === "yes" })}
        />
      )}
      {q === 4 && (
        <>
          {f.retirementMode === "later" ? (
            <p className="intake-tip">
              You can add this later. Horizon can work out a retirement age when
              you give your pay, savings and spending.
            </p>
          ) : f.retirementMode === "age" ? (
            <AgeField
              label="Retirement age"
              value={f.retirementAge}
              change={(retirementAge) => update({ retirementAge })}
            />
          ) : (
            <DateFields
              label="Retirement date"
              value={f.retirementDate}
              change={(retirementDate) => update({ retirementDate })}
            />
          )}
          <div className="intake-links">
            <button
              type="button"
              className="link-button"
              onClick={() =>
                update({
                  retirementMode: f.retirementMode === "date" ? "age" : "date",
                })
              }
            >
              {f.retirementMode === "date"
                ? "I know the age instead"
                : "I know the date instead"}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() =>
                update({
                  retirementMode:
                    f.retirementMode === "later" ? "age" : "later",
                })
              }
            >
              {f.retirementMode === "later"
                ? "Answer it now instead"
                : "I'll add this later"}
            </button>
          </div>
        </>
      )}
      {q === 5 && (
        <AgeField
          label="Plan to age"
          placeholder="95"
          value={f.endAge}
          change={(endAge) => update({ endAge })}
        />
      )}
      {q === 7 && (
        <>
          <Options
            label={questions[6][0]}
            value={f.working ? "yes" : "no"}
            options={{ yes: "Yes", no: "No, my work ends earlier" }}
            change={(value) => update({ working: value === "yes" })}
          />
          {!f.working && (
            <DateFields
              label="Work end date"
              value={f.workEnd}
              change={(workEnd) => update({ workEnd })}
            />
          )}
        </>
      )}
      {q === 8 && (
        <Options
          label={questions[7][0]}
          value={f.social}
          options={{ yes: "Yes", no: "No", not_sure: "Not sure" }}
          change={(social) => update({ social })}
        />
      )}
      {q === 9 && (
        <>
          <AgeField
            label="Social Security start age"
            placeholder="67"
            value={f.socialAge}
            change={(socialAge) => update({ socialAge })}
          />
          <p className="intake-tip">
            Not sure? Start with 67. You can try other ages later.
          </p>
        </>
      )}
      {q === 11 && (
        <Options
          label={questions[10][0]}
          value={f.pension}
          options={{ no: "No", yes: "Yes" }}
          change={(pension) => update({ pension })}
        />
      )}
      {key && (
        <>
          {q === 13 ? (
            <>
              {f.accounts.map((account, index) => (
                <div
                  className={`saved-account${money.notSure ? " rough" : ""}`}
                  key={index}
                >
                  <strong>{kinds[account.kind]}</strong>
                  <p>
                    {(() => {
                      try {
                        return moneyWords(
                          "cents" in moneyAnswer(account.balance)
                            ? {
                                cents: (
                                  moneyAnswer(account.balance) as {
                                    cents: number;
                                  }
                                ).cents,
                              }
                            : {
                                range: (
                                  moneyAnswer(account.balance) as {
                                    range: {
                                      low_cents: number;
                                      high_cents: number;
                                    };
                                  }
                                ).range,
                              },
                        );
                      } catch {
                        return "To add later";
                      }
                    })()}
                  </p>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      update({
                        editingAccount: index,
                        account,
                        savingsMode: "accounts",
                      })
                    }
                  >
                    Change account {index + 1}
                  </button>
                </div>
              ))}
              <label className="field-row">
                Kind of account
                <select
                  value={f.account.kind}
                  onChange={(event) =>
                    update({
                      account: {
                        ...f.account,
                        kind: event.target.value as typeof f.account.kind,
                        basis: "",
                      },
                      savingsMode: "accounts",
                    })
                  }
                >
                  {Object.entries(kinds).map(([value, text]) => (
                    <option value={value} key={value}>
                      {text}
                    </option>
                  ))}
                </select>
              </label>
              <MoneyControl
                label="Account balance"
                field={{ ...f.account.balance, notSure: money.notSure }}
                balance
                change={(balance) =>
                  update({
                    account: { ...f.account, balance },
                    savingsMode: "accounts",
                    money: { ...f.money, savings: { ...money, later: false } },
                  })
                }
              />
              {f.account.kind === "taxable" && (
                <>
                  <label className="field-row">
                    About how much of that did you put in yourself?
                    <span className="dollar-field">
                      <span aria-hidden="true">$</span>
                      <input
                        inputMode="decimal"
                        value={f.account.basis}
                        onChange={(event) =>
                          update({
                            account: {
                              ...f.account,
                              basis: event.target.value,
                            },
                          })
                        }
                      />
                    </span>
                  </label>
                  <p className="intake-tip">
                    Horizon does not yet count dividends and interest inside a
                    brokerage account.
                  </p>
                </>
              )}
              <div className="actions">
                <button
                  type="button"
                  disabled={!hasAccountEntry(f.account)}
                  onClick={() => {
                    try {
                      moneyAnswer(f.account.balance);
                      update({
                        accounts:
                          f.editingAccount == null
                            ? [...f.accounts, f.account]
                            : f.accounts.map((account, index) =>
                                index === f.editingAccount
                                  ? f.account
                                  : account,
                              ),
                        editingAccount: undefined,
                        account: blankAccount(),
                        savingsMode: "accounts",
                      });
                    } catch {
                      /* Continue explains invalid balances. */
                    }
                  }}
                >
                  Add this account
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    update({
                      savingsMode: "none",
                      editingAccount: undefined,
                      accounts: [],
                      account: blankAccount(),
                      money: {
                        ...f.money,
                        savings: { ...money, later: false },
                      },
                    })
                  }
                >
                  I don't have any savings yet
                </button>
              </div>
              {f.savingsMode === "none" && <p>No savings yet.</p>}
            </>
          ) : (
            !((q === 15 && f.same) || money.later) && (
              <MoneyControl
                label={q === 12 ? "Pension amount" : questions[q - 1][0]}
                field={money}
                change={(value) => setMoney(key, value)}
              />
            )
          )}
          {q === 6 && (
            <p className="intake-tip gap-tip">
              Horizon does not yet count money you add to your savings from your
              pay.
            </p>
          )}
          {q === 10 && (
            <p className="intake-tip">
              Your estimate is on your Social Security statement at ssa.gov.
              Horizon cannot estimate it for you yet; a best guess is fine for
              now.
            </p>
          )}
          {q === 12 && (
            <>
              <AgeField
                label="Pension start age"
                value={f.pensionAge}
                change={(pensionAge) => update({ pensionAge })}
              />
              <p>Does it rise with prices?</p>
              <Options
                label="Does it rise with prices?"
                value={f.rises}
                options={{
                  yes: "Yes",
                  no: "No, it stays the same",
                  not_sure: "Not sure",
                }}
                change={(rises) => update({ rises })}
              />
            </>
          )}
          {q === 15 && !f.retired && (
            <label className="wage-link">
              <input
                type="checkbox"
                checked={f.same}
                onChange={(event) => update({ same: event.target.checked })}
              />
              About the same as now
            </label>
          )}
          <label className="wage-link">
            <input
              type="checkbox"
              checked={money.notSure}
              onChange={(event) =>
                setMoney(key, { ...money, notSure: event.target.checked })
              }
            />
            I'm not sure of this
          </label>
          {(money.later ||
            (money.notSure &&
              !money.text &&
              !money.low &&
              !money.high &&
              q !== 13)) && (
            <p className="intake-tip">You can come back to this later.</p>
          )}
          <button
            type="button"
            className="link-button add-later"
            onClick={() =>
              money.later ? setMoney(key, { ...money, later: false }) : later()
            }
          >
            {money.later ? "Answer it now instead" : "I'll add this later"}
          </button>
        </>
      )}
    </div>
  );
}
