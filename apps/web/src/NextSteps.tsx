// SPDX-License-Identifier: AGPL-3.0-only
export type NextActions = {
  plan: (chart?: boolean) => void;
  options: () => void;
  compare: () => void;
  summary: () => void;
  changeAnswers: () => void;
  tryChange: () => void;
};
export function NextSteps({
  actions,
  hasOptions,
  copies,
  overview = false,
  own = false,
  copy = false,
}: {
  actions: NextActions;
  hasOptions: boolean;
  copies: number;
  overview?: boolean;
  own?: boolean;
  copy?: boolean;
}) {
  return (
    <section className="card next-steps">
      <h2>What to do next</h2>
      <ol>
        {!copy && (
          <li>
            {hasOptions
              ? "Try an option. Each opens as a copy; your plan stays as it is."
              : "Try a change. It opens as a copy; your plan stays as it is."}{" "}
            <button
              className="link-button"
              onClick={hasOptions ? actions.options : actions.tryChange}
            >
              {hasOptions ? "See the options" : "Try a change"}
            </button>
          </li>
        )}
        {overview && (
          <li>
            See each year. The chart marks what happens when; choose a year to
            see its numbers.{" "}
            <button className="link-button" onClick={() => actions.plan()}>
              Open the plan
            </button>
          </li>
        )}
        <li>
          Compare your plans side by side.{" "}
          {copies ? (
            <button className="link-button" onClick={actions.compare}>
              Compare {copies + 1} plans
            </button>
          ) : (
            <span className="help">
              Try {hasOptions ? "an option" : "a change"} first.
            </span>
          )}
        </li>
        <li>
          Keep a summary. Print it, save it as a PDF or keep a file Horizon can
          reopen.{" "}
          <button className="link-button" onClick={actions.summary}>
            Get the summary
          </button>
        </li>
        {own && !copy && (
          <li>
            Change an answer. Your answers stay on this device.{" "}
            <button className="link-button" onClick={actions.changeAnswers}>
              Change your answers
            </button>
          </li>
        )}
      </ol>
    </section>
  );
}
