// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { engine } from "./engine";
import type { Failure } from "./Answer";
import type { Run } from "./generated/types/run-output.v2";
import type { SustainableSpending } from "./generated/types/sustainable-spending.v1";
import type { Levers } from "./generated/types/levers.v1";
import type { InputImpact } from "./generated/types/input-impact.v1";
import type { Export as PlanExport } from "./generated/types/export.v2";
import { Calculating, Detail } from "./Plan";
import { usePlanResults, type PlanCache } from "./plan-results";
import { answerOne, answerTwo, answerThree } from "./plan-answers";
import { endAge, firstShortfall, yearAtDate } from "./plan-display";
import { compareHeadline, wholeDollars } from "./compare-display";
import { statusWord } from "./format";
import {
  entryDescription,
  matters,
  roughItems,
  setupFields,
} from "./input-check";
import { serializeDraft, type Draft } from "./setup";
import type { Copies } from "./plan-copies";
export function exportStory(
  run: Run,
  spending: SustainableSpending,
  date: string,
) {
  const short = firstShortfall(run),
    retirement = yearAtDate(run, date),
    future = date > run.valuation_date;
  const lead =
    future && retirement && (!short || short.year >= retirement.year)
      ? `Retiring at ${retirement.age_on_december_31}, s`
      : "S";
  const prefix =
    lead +
    (short
      ? `avings run short at ${short.age_on_december_31}`
      : `avings last to ${endAge(run)}`);
  if (future && !retirement)
    return `${prefix}; retirement falls after the plan ends.`;
  if (spending.flag === "shortfall_with_no_retirement_spending")
    return `${prefix}, even with no retirement spending.`;
  if (spending.flag === "at_or_above_cap")
    return `${prefix}; the plan could carry at least ${wholeDollars(spending.cap)} a year in today's dollars.`;
  return short
    ? `${prefix}; spending ${wholeDollars(spending.sustainable_spending)} a year in today's dollars would make them last to ${endAge(run)}.`
    : `${prefix}; you could spend up to ${wholeDollars(spending.sustainable_spending)} a year in today's dollars.`;
}
export function fileSize(bytes: number) {
  const hundredths = (BigInt(bytes) + 5000n) / 10000n;
  return `${hundredths / 100n}.${String(hundredths % 100n).padStart(2, "0")} MB (${bytes.toLocaleString("en-US")} bytes)`;
}
export function summaryStatus(run: Run) {
  return `${statusWord(run.status, run.omissions.length)}. ${run.omissions.length ? `What this result does not include: ${run.omissions.join("; ")}.` : "No omissions are listed."}`;
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
            EXPORT · {sample.label.toUpperCase()} · VALUES AS OF{" "}
            {draft.input.household.valuation_date}
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
}: Props & { draft: Draft }) {
  const input = serializeDraft(draft);
  const { results, transport } = usePlanResults(input, cache);
  const [file, setFile] = useState<{
    text: string;
    data: PlanExport;
    url: string;
  } | null>(null);
  const [error, setError] = useState<Failure | string | null>(null);
  const [impact, setImpact] = useState<InputImpact | Failure | null>(null);
  const [impactTransport, setImpactTransport] = useState<string | null>(null);
  const rough = JSON.stringify(roughItems(draft));
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
  useEffect(() => {
    if (rough === "[]") return;
    let active = true;
    engine
      .call("input_impact", input, rough)
      .then((json) => {
        if (active) setImpact(JSON.parse(json));
      })
      .catch((error: Error) => {
        if (active) setImpactTransport(error.message);
      });
    return () => {
      active = false;
    };
  }, [input, rough]);
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
    items = copies?.items ?? [],
    fields = setupFields(draft);
  const ready =
    run &&
    spending &&
    levers &&
    (rough === "[]" || impact || impactTransport) &&
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
            : `Example household · ${sample.label}`}{" "}
          · values as of{" "}
          {run?.valuation_date ?? draft.input.household.valuation_date} ·{" "}
          {run?.metadata.model_version ?? "Calculating…"}
        </p>
        <h2>Answers</h2>
        {run && spending ? (
          <>
            <p>{answerOne(run, spending, retirementDate)}</p>
            <p>{answerTwo(run, spending, retirementDate)}</p>
          </>
        ) : (
          <Calculating />
        )}
        {levers ? <p>{answerThree(levers)}</p> : <Calculating />}
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
        <h2>Status and what is not included</h2>
        {run ? <p>{summaryStatus(run)}</p> : <Calculating />}
        <h2>Rough entries</h2>
        {rough === "[]" ? (
          <p>No entries are marked rough.</p>
        ) : impactTransport || (impact && "code" in impact) ? (
          <ErrorMessage error={impactTransport ?? (impact as Failure)} />
        ) : impact && "items" in impact ? (
          <>
            <ul className="summary-rough">
              {impact.items.map((item) => (
                <li key={item.path}>
                  <span className="rough-label">
                    <span aria-hidden="true">≈</span> Rough value
                  </span>{" "}
                  {
                    entryDescription(
                      draft,
                      fields.find((field) => field.path === item.path)!,
                    ).title
                  }
                  : could change your headroom by up to{" "}
                  {wholeDollars(Math.abs(item.impact))} a year (
                  {matters(impact.baseline.sustainable_spending, item.impact)
                    ? "matters"
                    : "barely matters"}
                  )
                </li>
              ))}
            </ul>
            <p>
              An entry matters when it could change headroom by at least 1% of{" "}
              {wholeDollars(impact.baseline.sustainable_spending)} a year.
            </p>
          </>
        ) : (
          <Calculating />
        )}
        <p className="help">The summary fits one printed page.</p>
      </article>
    );
  };
  return (
    <>
      <div aria-live="polite">
        {run && spending ? (
          <p className="lede export-story">
            {exportStory(run, spending, retirementDate)}
          </p>
        ) : (
          <Calculating />
        )}
        {run ? (
          <p>
            <span className={`status ${run.status}`}>
              <span aria-hidden="true">
                {run.status === "complete" ? "✓" : "△"}
              </span>{" "}
              {statusWord(run.status, run.omissions.length)}
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
            A one-page summary of the answers, what's left out and your rough
            entries.
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
            Rough marks and copies are not saved in the file; they are in the
            summary.
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
        hint="Answers, status, rough entries"
      >
        {summary()}
      </Detail>
      <Detail title="File details" hint="Format, engine, size, fingerprint">
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
      </Detail>
      <Detail
        title="How opening a file works"
        hint="Four checks before anything is shown"
      >
        <ol>
          <li>Checks the file format.</li>
          <li>Checks the fingerprint.</li>
          <li>Checks the engine version.</li>
          <li>
            Reruns the plan and confirms the results match the file exactly.
          </li>
        </ol>
        <p>
          If any check fails, Horizon says which one and does not open the plan.
        </p>
      </Detail>
      <div className="print-summary">{summary(true)}</div>
    </>
  );
}
