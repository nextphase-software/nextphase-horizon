// SPDX-License-Identifier: AGPL-3.0-only
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import { flagWords, formatDollars, statusWord } from "./format";
export type Failure = {
  status: "invalid" | "unsupported";
  code: string;
  message: string;
};
export type Result = SustainableSpending | Failure;
export function Answer({ answer }: { answer: Result }) {
  if ("code" in answer)
    return (
      <section>
        <h2 className="status unsupported">
          <span aria-hidden="true">!</span> {statusWord(answer.status)}
        </h2>
        <p>{answer.message}</p>
      </section>
    );
  const omissions = answer.run.omissions;
  return (
    <section>
      <h2 className={`status ${answer.status}`}>
        <span aria-hidden="true">
          {answer.status === "complete" ? "✓" : "△"}
        </span>{" "}
        {statusWord(answer.status, omissions.length)}
      </h2>
      <dl>
        <Figure
          label="Most you can spend in retirement"
          amount={answer.sustainable_spending}
          testId="spending"
        />
        <Figure
          label="Entered after-retirement spending"
          amount={answer.entered}
          testId="entered"
        />
        <Figure label="Headroom" amount={answer.headroom} testId="headroom" />
      </dl>
      {answer.flag && <p className="flag">{flagWords(answer.flag)}</p>}
      <h3>What this result does not include</h3>
      {omissions.length ? (
        <ul>
          {omissions.map((omission) => (
            <li key={omission}>{omission}</li>
          ))}
        </ul>
      ) : (
        <p>No omissions reported.</p>
      )}
    </section>
  );
}
function Figure({
  label,
  amount,
  testId,
}: {
  label: string;
  amount: number;
  testId: string;
}) {
  return (
    <div className="figure">
      <dt>
        {label}
        <small>today's dollars, per year</small>
      </dt>
      <dd data-testid={testId}>{formatDollars(amount)}</dd>
    </div>
  );
}
