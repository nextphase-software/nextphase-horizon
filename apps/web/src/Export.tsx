// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { engine } from "./engine";
import type { Failure } from "./Answer";
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import type { AnswersPlanV2 } from "./generated/types/answers-plan.v2";
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { Export as PlanExport } from "./generated/types/export.v2";
import { Calculating, Detail } from "./Plan";
import { usePlanResults, type PlanCache } from "./plan-results";
import { followOn, movesMost } from "./plan-answers";
import {
  plainDate,
  plainLeftOut,
  amountsNote,
  answerName,
} from "./plain-results";
import { headText, leftOutText } from "./intake-head";
import { planHeadline } from "./plan-display";
import { compareHeadline } from "./compare-display";
import { statusWord } from "./format";
import { serializeDraft, type Draft } from "./setup";
import type { Copies } from "./plan-copies";
export function exportLines(
  run: Run,
  spending: SustainableSpending,
  date: string,
  result?: AnswersPlanV2,
  answers?: AnswersV2,
) {
  const head =
    result && answers
      ? headText(result, answers)
      : { headline: planHeadline(run), lines: [] };
  return [
    head.headline,
    ...head.lines,
    followOn(run, spending, date, result),
  ].filter((line): line is string => !!line);
}
export function exportStory(
  run: Run,
  spending: SustainableSpending,
  date: string,
) {
  return exportLines(run, spending, date).join(" ");
}
export function fileSize(bytes: number) {
  const hundredths = (BigInt(bytes) + 5000n) / 10000n;
  return `${hundredths / 100n}.${String(hundredths % 100n).padStart(2, "0")} MB (${bytes.toLocaleString("en-US")} bytes)`;
}
export function summaryStatus(run: Run) {
  return run.omissions.length
    ? run.omissions.map(plainLeftOut).join(" ")
    : "Nothing is left out.";
}
export const importCheck = (code: string) =>
  ({
    EXPORT_FORMAT_UNSUPPORTED: "the file format",
    EXPORT_HASH_MISMATCH: "the fingerprint",
    EXPORT_MODEL_VERSION_UNSUPPORTED: "the engine version",
  })[code] ?? "the rerun";
function ErrorMessage({
  error,
  alert = true,
}: {
  error: Failure | string;
  alert?: boolean;
}) {
  return (
    <section className="card" role={alert ? "alert" : undefined}>
      <h2 className="status unsupported">
        <span aria-hidden="true">!</span>{" "}
        {typeof error === "string"
          ? "Calculation unavailable"
          : statusWord(error.status)}
      </h2>
      <p>{typeof error === "string" ? error : error.message}</p>
    </section>
  );
}
function OpenFile({ opened }: { opened: (input: string) => void }) {
  const chooser = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{
    check: string;
    error: Failure | string;
  } | null>(null);
  const active = useRef(true),
    attempt = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function open(file: File) {
    const id = ++attempt.current;
    setBusy(true);
    setFailure(null);
    try {
      const text = await file.text();
      let document: PlanExport;
      try {
        document = JSON.parse(text);
      } catch {
        if (active.current && id === attempt.current)
          setFailure({
            check: "the file format",
            error: {
              status: "invalid",
              code: "NOT_JSON",
              message: "The file is not valid JSON.",
            },
          });
        return;
      }
      const result = JSON.parse(await engine.call("import_run", text)) as
        Run | Failure;
      if (!active.current || id !== attempt.current) return;
      if ("code" in result)
        setFailure({ check: importCheck(result.code), error: result });
      else opened(JSON.stringify(document.input));
    } catch (error) {
      if (active.current && id === attempt.current)
        setFailure({ check: "the rerun", error: (error as Error).message });
    } finally {
      if (active.current && id === attempt.current) setBusy(false);
    }
  }
  return (
    <div className="open-file">
      <button
        className="link-button"
        aria-busy={busy}
        aria-disabled={busy}
        onClick={() => {
          if (!busy) chooser.current?.click();
        }}
      >
        Open a plan file
      </button>
      <p className="help">Horizon checks it and reruns it before showing it.</p>
      <input
        ref={chooser}
        type="file"
        accept=".json,application/json"
        aria-label="Choose a plan file"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void open(file);
        }}
      />
      {busy && <Calculating />}
      {failure && (
        <div role="alert">
          <p>
            This file did not pass the check of {failure.check}, so Horizon did
            not open it.
          </p>
          <ErrorMessage error={failure.error} alert={false} />
        </div>
      )}
    </div>
  );
}
type Props = {
  sample: { label: string };
  draft: Draft | null;
  copies: Copies | null;
  cache: PlanCache;
  opened: (input: string) => void;
  answers?: AnswersV2;
  answerResult?: AnswersPlanV2;
};
export function Export(props: Props) {
  const { sample, draft, opened } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="export-screen">
      {draft ? (
        <>
          <p className="eyebrow">
            EXPORT · {sample.label.toUpperCase()} · FIGURES AS OF{" "}
            {plainDate(draft.input.household.valuation_date).toUpperCase()}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            Take your plan with you
          </h1>
          <ExportResult key={serializeDraft(draft)} {...props} draft={draft} />
        </>
      ) : (
        <>
          <h1 ref={heading} tabIndex={-1}>
            Open a plan file
          </h1>
          <p>Set up a household first to share or keep a plan.</p>
          <OpenFile opened={opened} />
        </>
      )}
    </div>
  );
}
function ExportResult({
  sample,
  draft,
  copies,
  cache,
  opened,
  answers,
  answerResult,
}: Props & { draft: Draft }) {
  const input = serializeDraft(draft);
  const { results, transport } = usePlanResults(input, cache);
  const [file, setFile] = useState<{
    text: string;
    data: PlanExport;
    url: string;
  } | null>(null);
  const [error, setError] = useState<Failure | string | null>(null);
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    engine
      .call("export_run", input)
      .then((text) => {
        if (!active) return;
        const data = JSON.parse(text);
        if ("code" in data) setError(data);
        else {
          url = URL.createObjectURL(
            new Blob([text], { type: "application/json" }),
          );
          setFile({ text, data, url });
        }
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [input]);
  const failure =
    error ??
    transport ??
    Object.values(results).find((value) => "code" in value);
  if (failure)
    return (
      <>
        <ErrorMessage error={failure} />
        <OpenFile opened={opened} />
      </>
    );
  const run = results.run as Run | undefined,
    spending = results.spending as SustainableSpending | undefined,
    levers = results.levers as Levers | undefined;
  const retirementDate = draft.input.household.persons[0].retirement_date,
    items = copies?.items ?? [];
  const ready =
    run &&
    spending &&
    levers &&
    items.every((item) => item.comparison || item.error || item.transport);
  const summary = (printed = false) => {
    const Title = printed ? "p" : "h2";
    return (
      <article className="plan-summary">
        <Title
          className="summary-title"
          role={printed ? "heading" : undefined}
          aria-level={printed ? 1 : undefined}
        >
          Horizon plan summary
        </Title>
        <p className="help">
          {sample.label === "Opened plan file"
            ? "Opened plan file"
            : sample.label === "Your figures"
              ? "Your figures"
              : `Example household · ${sample.label}`}{" "}
          · figures as of{" "}
          {plainDate(
            run?.valuation_date ?? draft.input.household.valuation_date,
          )}{" "}
          · amounts in today's dollars
        </p>
        <h2>Answers</h2>
        {run && spending ? (
          <>
            {exportLines(
              run,
              spending,
              retirementDate,
              answerResult,
              answers,
            ).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </>
        ) : (
          <Calculating />
        )}
        {levers ? (
          movesMost(levers) && <p>{movesMost(levers)}</p>
        ) : (
          <Calculating />
        )}
        {items.map((copy) => (
          <div key={copy.lever.id}>
            {copy.error || copy.transport ? (
              <ErrorMessage error={copy.error ?? copy.transport!} />
            ) : copy.comparison ? (
              <p>
                {compareHeadline(
                  copy.subject,
                  copy.comparison.baseline,
                  copy.comparison.scenario,
                )}
              </p>
            ) : (
              <Calculating />
            )}
          </div>
        ))}
        {run && (
          <p>
            <span className={`status ${answerResult?.status ?? run.status}`}>
              {(answerResult?.status ?? run.status) === "complete" ? "✓" : "△"}{" "}
              {statusWord(
                answerResult?.status ?? run.status,
                answerResult
                  ? (answerResult.central?.omissions.length ?? 0) +
                      answerResult.left_out.length
                  : run.omissions.length,
              )}
            </span>
          </p>
        )}
        <h2>What this result doesn't count</h2>
        {answerResult?.central ? (
          <ul>
            {answerResult.left_out.map((item) => (
              <li key={item.answer}>{leftOutText(item)}</li>
            ))}
            {answerResult.central.omissions.map((text) => (
              <li key={text}>{plainLeftOut(text)}</li>
            ))}
          </ul>
        ) : run ? (
          <p>{summaryStatus(run)}</p>
        ) : (
          <Calculating />
        )}
        <h2>Answers you weren't sure of</h2>
        {answers?.not_sure?.length && answerResult ? (
          <ul className="summary-not-sure">
            {answers.not_sure.map((answer) => (
              <li key={answer} className="rough">
                {answerName(answer, answerResult)}
              </li>
            ))}
          </ul>
        ) : (
          <p>None were marked as not sure.</p>
        )}
        <p className="help">The summary fits one printed page.</p>
      </article>
    );
  };
  return (
    <>
      <div aria-live="polite">
        {run && spending ? (
          <div className="lede export-story">
            {exportLines(
              run,
              spending,
              retirementDate,
              answerResult,
              answers,
            ).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <p className="help amounts-note">
              {amountsNote(run.valuation_date)}
            </p>
          </div>
        ) : (
          <Calculating />
        )}
        {run ? (
          <p>
            <span className={`status ${answerResult?.status ?? run.status}`}>
              <span aria-hidden="true">
                {(answerResult?.status ?? run.status) === "complete"
                  ? "✓"
                  : "△"}
              </span>{" "}
              {statusWord(
                answerResult?.status ?? run.status,
                answerResult
                  ? (answerResult.central?.omissions.length ?? 0) +
                      answerResult.left_out.length
                  : run.omissions.length,
              )}
            </span>
          </p>
        ) : (
          <Calculating />
        )}
      </div>
      <div className="export-actions">
        <section className="card">
          <h2>Share a summary</h2>
          <p>
            A one-page summary of the answers, what's left out and any answers
            you weren't sure of.
          </p>
          <button
            className="primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            Print or save as PDF
          </button>
        </section>
        <section className="card">
          <h2>Keep your plan</h2>
          <p>A file Horizon can reopen exactly as it is.</p>
          <p>
            Copies you tried are not saved in the file; they are in the summary.
          </p>
          {file ? (
            <a
              className="download-button primary"
              href={file.url}
              download={`horizon-plan-${file.data.hashes.export_content_hash.slice(0, 12)}.json`}
            >
              Download plan file
            </a>
          ) : (
            <Calculating />
          )}
        </section>
      </div>
      <OpenFile opened={opened} />
      <Detail
        title="What's in the summary"
        hint="Answers, what's left out, answers you weren't sure of"
      >
        {summary()}
      </Detail>
      <Detail
        title="Details for experts"
        hint="File format, engine, fingerprint and how opening works"
      >
        <section className="expert-section">
          <h2>File details</h2>
          {file ? (
            <>
              <dl className="file-details">
                <dt>Format</dt>
                <dd>
                  Horizon plan file, format {file.data.export_format_version}{" "}
                  (JSON)
                </dd>
                <dt>Engine</dt>
                <dd>{file.data.model_version}</dd>
                <dt>Tax law</dt>
                <dd>
                  {file.data.rule_set_identifier}, {file.data.rule_set_year}
                </dd>
                <dt>Size</dt>
                <dd>{fileSize(new TextEncoder().encode(file.text).length)}</dd>
                <dt>Fingerprint</dt>
                <dd>
                  {file.data.hashes.export_content_hash}
                  <small>SHA-256</small>
                </dd>
              </dl>
              <p className="help">
                The fingerprint shows whether the file was changed after it was
                saved. It does not show who made it.
              </p>
            </>
          ) : (
            <Calculating />
          )}
        </section>
        <section className="expert-section">
          <h2>How opening a file works</h2>
          <ol>
            <li>Checks the file format.</li>
            <li>Checks the fingerprint.</li>
            <li>Checks the engine version.</li>
            <li>
              Reruns the plan and confirms the results match the file exactly.
            </li>
          </ol>
          <p>
            If any check fails, Horizon says which one and does not open the
            plan.
          </p>
        </section>
      </Detail>
      <div className="print-summary">{summary(true)}</div>
    </>
  );
}
