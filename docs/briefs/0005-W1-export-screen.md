BRIEF VERSION: 0005-W1 v1 (2026-10-19)

# 0005-W1 — Export: share a summary, keep and reopen a plan file

## Outcome

A person can take their plan with them in two ways:
- **a one-page summary** they print or save as PDF, with the answers, the status, what is left out, their rough entries and any copies they tried;
- **a plan file**, the engine's versioned export, that Horizon reopens exactly.

Opening a plan file runs the engine's four import checks before anything is shown. A file that passes opens on its plan screen; a file that fails says which check failed and is not opened. The screen opens with one plain sentence and keeps the details one click away.

This milestone builds reference screen 6 (`docs/briefs/assets/design-v1/06-export.html`).

## Deliverables

1. **Reaching the export screen:**
   - the step bar's **Export** step is always operable;
   - the plan screen's "Export" button and the comparison screen's "Export this comparison" become operable and open it;
   - without a household (before a sample is chosen or a file is opened), the screen shows only "Open a plan file" and the line "Set up a household first to share or keep a plan."
2. **Engine calls,** through the worker:
   - `export_run(input)` for the household as entered: the plan file is exactly its output text;
   - the summary reuses the plan screen's `run`, `sustainable_spending` and `levers` results and the comparison results of any copies, and calls `input_impact(input, rough)` when entries are marked rough (as 0002-W3);
   - `import_run(file text)` to open a file.
   - Each part shows "Calculating…" until its data arrives; an error envelope shows its status word and message with no figures.
3. **Display rules** (as 0003-W2 and 0004-W1): whole dollars rounded half away from zero; "−" for minus; no financial value computed by the interface. The file size in megabytes is bytes ÷ 1,000,000 rounded half up to two decimals.
4. **Export screen** (reference screen 6). It must match the reference in the points under "Must-match points".
   1. **Eyebrow:** "Export · <label> · values as of <valuation date>" (capitals as the plan screen's eyebrow). `<label>` is the sample's label, or "Opened plan file".
   2. **Title:** "Take your plan with you".
   3. **Story sentence.** `<end>` is the plan-end age; `A` the age in the first year with `shortfall > 0`; `S` sustainable spending; `F` its flag. The lead is "Retiring at <age>, s" when the person is not retired, a projected year contains the retirement date and any shortfall comes in or after that year; otherwise the lead is "S". The outcome is "avings run short at <A>" or "avings last to <end>". Then, in this order of precedence:
      - no projected year contains the retirement date (not retired): "<lead><outcome>; retirement falls after the plan ends.";
      - `F` is `shortfall_with_no_retirement_spending`: "<lead><outcome>, even with no retirement spending.";
      - `F` is `at_or_above_cap`: "<lead><outcome>; the plan could carry at least $10,000,000 a year in today's dollars.";
      - a shortfall: "<lead><outcome>; spending $S a year in today's dollars would make them last to <end>.";
      - otherwise: "<lead><outcome>; you could spend up to $S a year in today's dollars."
   4. **Status chip** as on the plan screen.
   5. **Three actions:**
      - **Share a summary:** "A one-page summary of the answers, what's left out and your rough entries." and the button "Print or save as PDF", which opens the browser's print dialog for the summary.
      - **Keep your plan:** "A file Horizon can reopen exactly as it is." then "Rough marks and copies are not saved in the file; they are in the summary." and the button "Download plan file". The file's content is exactly the `export_run` output text, of type `application/json`, named `horizon-plan-<first 12 characters of the fingerprint>.json`.
      - **Open a plan file** (a smaller link-style control): "Horizon checks it and reruns it before showing it." It opens a file chooser for `.json` files (deliverable 6).
   6. **What's in the summary** (collapsed; hint "Answers, status, rough entries"), the same content as the printed page:
      - a header line "<Sample household|Opened plan file> · <label> · values as of <valuation date> · <model version>" (for an opened file: "Opened plan file · values as of <valuation date> · <model version>");
      - **Answers:** the plan screen's answer 1, answer 2 and answer 3 sentences (brief 0003-W2 v1.1, deliverable 5), then one line per copy with that copy's comparison headline (brief 0004-W1 v1.1, deliverable 6.2), in the order the copies were made;
      - **Status and what is not included:** "<status word>. What this result does not include: <omissions joined by '; '>." (the status word as on the chip, for example "Partial (5 omissions)");
      - **Rough entries:** one line per rough mark, in the engine's `input_impact` order, with the dashed "Rough value" tag: "<title>: could change your headroom by up to $<impact> a year (matters)" or "(barely matters)", using the titles and the matters rule of brief 0002-W3; then "An entry matters when it could change headroom by at least 1% of $<S> a year." With no rough marks: "No entries are marked rough.";
      - "The summary fits one printed page."
   7. **File details** (collapsed; hint "Format, engine, size, fingerprint"): Format "Horizon plan file, format <export_format_version> (JSON)"; Engine "<model_version>"; Tax law "<rule_set_identifier>, <rule_set_year>"; Size "<MB> MB (<bytes> bytes)" of the file; Fingerprint "<hashes.export_content_hash>" with "SHA-256"; then "The fingerprint shows whether the file was changed after it was saved. It does not show who made it."
   8. **How opening a file works** (collapsed; hint "Four checks before anything is shown"): the four checks in order, "Checks the file format.", "Checks the fingerprint.", "Checks the engine version.", "Reruns the plan and confirms the results match the file exactly."; then "If any check fails, Horizon says which one and does not open the plan."
   9. The footer and privacy note as in 0002-W2.
5. **Print:** a print stylesheet prints only the summary (deliverable 4.6 content, without its collapse control), on one US Letter portrait page, in light colours whatever the screen theme. No PDF library; the browser's print dialog saves PDFs.
6. **Opening a file:**
   - the chosen file's text is passed to `import_run`. Text that is not JSON counts as failing the file-format check without calling the engine;
   - error codes map to checks: `EXPORT_FORMAT_UNSUPPORTED` → "the file format"; `EXPORT_HASH_MISMATCH` → "the fingerprint"; `EXPORT_MODEL_VERSION_UNSUPPORTED` → "the engine version"; any other error → "the rerun". The screen shows "This file did not pass the check of <check>, so Horizon did not open it." and the engine's message, with no figures; the current household, if any, is unchanged;
   - on success, the household becomes the file's `input` exactly, labelled "Opened plan file"; existing copies and rough marks are cleared; the plan screen opens. From there the person can try a change, export or edit the household in the setup, as with a sample.

## Must-match points against reference screen 6

1. Eyebrow, title and story sentence as in deliverables 4.1–4.3.
2. The status chip.
3. The three actions in order: "Share a summary" with "Print or save as PDF", "Keep your plan" with "Download plan file", then the smaller "Open a plan file".
4. Three collapsed sections in this order, each with its hint: What's in the summary, File details, How opening a file works.
5. The footer.

**Intended differences from the reference:**
- The summary's answers reuse the plan screen's sentences, and a tried copy uses the comparison screen's headline, instead of the reference's illustrative phrasing.
- The status line reads "<status word>. What this result does not include: …".
- "Keep your plan" says that rough marks and copies are not saved in the file.
- Without a household, only "Open a plan file" is shown.

## Done when

1. **Reference case,** keyboard only: the working sample with no edits; Plan → Export.
   - **eyebrow:** "EXPORT · SINGLE, 61, STILL WORKING, PLANS TO RETIRE AT 66 · VALUES AS OF 2026-01-01";
   - **story:** "Retiring at 66, savings run short at 93; spending $64,994 a year in today's dollars would make them last to 95.";
   - **file details:** "Horizon plan file, format 1 (JSON)"; "horizon-engine-0.4.0"; "us-single-federal-tax-v3, 2026"; "0.65 MB (645,501 bytes)"; fingerprint "8cb745ed60a6ef924b261ed7cf7d43a65740d52fbc74caf0305bb9acb1843128";
   - **download:** the file is named `horizon-plan-8cb745ed60a6.json` and its bytes equal `horizon export answers-working-61` without the trailing newline;
   - **summary answers:** "Not at $67,000 a year: savings run short at age 93 (2058)."; "$64,994 a year in today's dollars lasts to 95: $2,006 less than you plan to spend."; "Investment returns, then spending, then the retirement date.";
   - **summary status:** "Partial (5 omissions). What this result does not include: state tax not modeled; alternative minimum tax not modeled; taxable-account dividends and interest not modeled; itemized deductions and credits not modeled; contributions not modeled.";
   - **summary rough entries:** "No entries are marked rough."

   All values come from native `horizon-engine-0.4.0` CLI output, verified 2026-10-19.
2. **With rough marks and a copy:** the working sample with the 0002-W3 reference marks (Social Security per year, spending per year before retirement, brokerage account cost basis) and the "Retire a year later, at 67" copy:
   - rough entries, in this order: "Social Security benefit: could change your headroom by up to $2,305 a year (matters)"; "Spending until you retire: could change your headroom by up to $1,624 a year (matters)"; "Brokerage account cost basis: could change your headroom by up to $8 a year (barely matters)"; then "An entry matters when it could change headroom by at least 1% of $64,994 a year.";
   - copy line: "Retiring at 67: savings last to 95 instead of running short at 93.";
   - the download is unchanged (rough marks and copies are not in the file).
3. **Other cases** (story sentence; status word; file size):

   | Case | Story | Status word | File |
   | --- | --- | --- | --- |
   | `synthetic-retired` | "Savings last to 95; you could spend up to $87,061 a year in today's dollars." | Supported | 0.47 MB (473,538 bytes) |
   | `A-drawdown` | "Savings run short at 76; spending $43,690 a year in today's dollars would make them last to 78." | Supported | 0.11 MB (112,373 bytes) |
   | `answers-underfunded` | "Savings run short at 61, even with no retirement spending." | Partial (5 omissions) | 0.64 MB (641,635 bytes) |
   | working sample with plan end age 65 (edited in the setup) | "Savings last to 65; retirement falls after the plan ends." | Partial (5 omissions) | 0.10 MB (95,758 bytes) |

4. **Opening files:**
   - **round trip:** the reference download, opened again, passes and shows the plan screen with "Savings run short at 93, two years before the plan ends." and the eyebrow "OPENED PLAN FILE · RETIRE AT 66"; the worker's `import_run` output for it is byte-identical to `horizon import <that file>`;
   - **rejections:** `packages/app/test-data/tampered-export.json` names "the fingerprint"; `unknown-format-export.json` names "the file format"; `model-0.3.0.export.json` names "the engine version"; a file that is not JSON names "the file format". None opens, and the previous household and screen are unchanged.
5. **Print:** with the six copies and the three rough marks of Done when 2, the printed summary is one US Letter page in Chromium, light colours in both themes, with no navigation or buttons.
6. **Keyboard, accessibility and privacy:** every control and section is operable by keyboard, including the file chooser and the download; axe reports no violations; no horizontal page scroll at 375 px; nothing stored or requested off-origin (a download link made from the export text is allowed). This holds in three browsers, both sizes and both themes, and the suite passes on Linux and on macOS.
7. **Earlier guarantees:** Rust validation and licences unchanged; no new dependency, schema, golden or engine change; no new top-level entry; the 0002-W1 to 0004-W1 checks still pass.

## Read first

- `DESIGN.md` (Visual language, version 1, including "Principles for screens"), `AGENTS.md`, decision records 0010 (export and import) and 0011 (item 5).
- `docs/briefs/assets/design-v1/06-export.html` (reference screen 6) and its README.
- `docs/model/scenario-diff-and-export.md` (export and import), `docs/model/answers.md`, `docs/architecture/web-shell.md`, and briefs 0002-W3, 0003-W2 and 0004-W1.
- Printing: MDN, "Printing", retrieved 2026-10-19: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0004-W1 sequence in `AGENTS.md`, including Playwright install and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- export answers-working-61` (expected exit 3; its output without the trailing newline must equal the downloaded file)
- `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` (exit 1), `… unknown-format-export.json` (exit 2), `… model-0.3.0.export.json` (exit 2)

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Saving rough marks or copies in the plan file:** later, with a new file format; this milestone keeps the engine's export unchanged.
- **A one-click PDF download or a PDF library:** declined; the browser's print dialog saves PDFs.
- **Sending a plan to another person from inside Horizon:** not part of this milestone; the person shares the printed summary or the file themselves.
- **Changing the engine's export or import:** none.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
