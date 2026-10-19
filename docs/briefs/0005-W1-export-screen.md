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


### 2026-10-19 — implementation and Linux validation

- Branch: `codex/0005-W1-export-screen`.
- Implementation source/test revision: `ab2040ffedeaa038bdc17a1707a1ed8e1107a325`. Validation commands 1–22 began against that revision. The subsequent browser-expectation-only revision, `7ed0d139475c5e2eaab653b754dc3456d68f6d4e`, updates earlier navigation counts for the now-operable Export step; commands 23 onward ran against it. Rust, model, schema, golden, design-asset and dependency inputs are identical between those revisions. The final handoff names the separate record commit.
- Export uses the existing worker operations. Plan answers and their pending/completed requests are shared with Export; comparison headlines reuse the existing comparison formatter. Opening a file waits for successful engine import before replacing the household, clearing copies and rough marks, and opening Plan. Unedited input values, including cents, survive setup serialization.
- Reference screen 6 was checked at phone and desktop sizes. The brief's intended differences are implemented, including summary answer/comparison sentences and the file's exclusion of rough marks/copies. Existing shell navigation, theme controls and privacy footer are retained. All three collapsed sections have their required hints and order. The summary has its own document heading for print accessibility.
- Tool versions: Rust 1.99.1; cargo-deny 0.20.2; wasm-bindgen / wasm-bindgen-test-runner 0.2.129; Node v24.22.0; corepack 0.36.0; pnpm 12.9.1 selected by `apps/web/package.json`; Playwright 1.63.0. Node was recorded before each WebAssembly validation/build. A preliminary workspace-root pnpm probe selected 12.14.0 outside the web manifest; all web installation, build and validation commands below used the manifest-selected 12.9.1.
- Browser versions from actual e2e annotations: chromium 153.0.8010.12, firefox 155.0, webkit 26.6.
- Browser evidence: 48 tests passed across 12 browser/size/theme projects, with 1272 attached screenshots and 4 Chromium Letter PDFs. Screenshots and HTML/JSON reports were saved outside the repository. The six-copy, three-rough-mark summary prints on one page in Chromium in both themes and at both sizes. Axe, keyboard focus/traversal, overflow, no off-origin requests and no stored state are checked throughout the matrix.
- New dependencies: none; production and full dependency licences passed unchanged. No new schema, golden, engine change or top-level entry.
- Financial values remain engine outputs: the interface selects and formats them. File sizes use UTF-8 bytes and decimal megabytes rounded half up to two places. Export/download bytes and import output are compared directly with native CLI output in each browser project.
- Native CLI commands below expand all 48 fixtures, five comparison reference pairs, all 26 current golden exports, the three committed import rejections, empty rough inputs and the explicit rough reference. Each CLI invocation checked its observed status, exit code and canonical JSON plus exactly one newline; the Rust CLI suite separately proves application byte parity.
- Release timing: the first timed invocation rebuilt the CLI and its local dependencies despite the preceding workspace release build and included 5.70 s compilation, taking 6.116 s overall. After an explicit release CLI build, the timed command exited 3 in 0.477 s, meeting the under-two-second requirement. The isolated WebAssembly levers test passed in 5.02 s from its harness (6.262 s wall time).

#### Ordered validation commands

Every row reports a newly executed command. Expected partial/invalid/unsupported exits are recorded as observed. Counts combine the harnesses run by that command; “passed” on a non-test command means exit 0. Wall time includes command startup and any compilation.

| # | Revision | Directory | Command | Exit | Observed result | Wall seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `ab2040f` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 2 | `ab2040f` | workspace root | `rustc --version` | 0 | rustc 1.99.1 (58cf8f9c3 2026-10-13) | 0.024 |
| 3 | `ab2040f` | workspace root | `cargo deny --version` | 0 | cargo-deny 0.20.2 | 0.025 |
| 4 | `ab2040f` | workspace root | `wasm-bindgen-test-runner --version` | 0 | wasm-bindgen-test-runner 0.2.129 | 0.001 |
| 5 | `ab2040f` | workspace root | `cargo test -p horizon-app answers` | 0 | 9 passed, 0 failed, 0 ignored | 43.449 |
| 6 | `ab2040f` | workspace root | `cargo test -p horizon-app --test reference_values_answers` | 0 | 6 passed, 0 failed, 0 ignored | 5.921 |
| 7 | `ab2040f` | workspace root | `cargo test -p horizon-app compare` | 0 | 3 passed, 0 failed, 0 ignored | 0.458 |
| 8 | `ab2040f` | workspace root | `cargo test -p horizon-app immutability` | 0 | 1 passed, 0 failed, 0 ignored | 0.162 |
| 9 | `ab2040f` | workspace root | `cargo test -p horizon-app export` | 0 | 2 passed, 0 failed, 0 ignored | 5.130 |
| 10 | `ab2040f` | workspace root | `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 passed, 0 failed, 0 ignored | 0.350 |
| 11 | `ab2040f` | workspace root | `cargo test -p horizon-engine tax` | 0 | 2 passed, 0 failed, 0 ignored | 1.732 |
| 12 | `ab2040f` | workspace root | `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 passed, 0 failed, 0 ignored | 0.240 |
| 13 | `ab2040f` | workspace root | `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 passed, 0 failed, 0 ignored | 0.142 |
| 14 | `ab2040f` | workspace root | `cargo test -p horizon-app --test reference_values` | 0 | 7 passed, 0 failed, 0 ignored | 0.084 |
| 15 | `ab2040f` | workspace root | `cargo test -p horizon-engine ledger` | 0 | 2 passed, 0 failed, 0 ignored | 0.065 |
| 16 | `ab2040f` | workspace root | `cargo test -p horizon-engine money` | 0 | 2 passed, 0 failed, 0 ignored | 0.088 |
| 17 | `ab2040f` | workspace root | `cargo test -p horizon-app validation` | 0 | 5 passed, 0 failed, 0 ignored | 0.450 |
| 18 | `ab2040f` | workspace root | `cargo test -p horizon-parity` | 0 | 15 passed, 0 failed, 0 ignored | 18.780 |
| 19 | `ab2040f` | workspace root | `cargo test --workspace` | 0 | 75 passed, 0 failed, 0 ignored | 127.235 |
| 20 | `ab2040f` | workspace root | `cargo clippy --workspace --all-targets -- -D warnings` | 0 | passed | 10.968 |
| 21 | `ab2040f` | workspace root | `cargo fmt --all --check` | 0 | passed | 0.089 |
| 22 | `ab2040f` | workspace root | `cargo test --workspace --release` | 0 | 75 passed, 0 failed, 0 ignored | 56.498 |
| 23 | `7ed0d13` | workspace root | `cargo build --workspace --release` | 0 | passed | 5.154 |
| 24 | `7ed0d13` | workspace root | `node --version` | 0 | v24.22.0 | 0.004 |
| 25 | `7ed0d13` | workspace root | `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | passed | 5.899 |
| 26 | `7ed0d13` | workspace root | `node --version` | 0 | v24.22.0 | 0.004 |
| 27 | `7ed0d13` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 14 passed, 0 failed, 0 ignored | 33.229 |
| 28 | `7ed0d13` | workspace root | `cargo deny check licenses` | 0 | passed | 0.159 |
| 29 | `7ed0d13` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document; includes 5.70 s compilation; timing gate failed | 6.116 |
| 30 | `7ed0d13` | workspace root | `cargo build --release -p horizon-cli` | 0 | passed | 0.067 |
| 31 | `7ed0d13` | workspace root | `cargo run --release -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 0.477 |
| 32 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown` | 0 | complete; 1 canonical JSON document | 0.120 |
| 33 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.078 |
| 34 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.070 |
| 35 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.081 |
| 36 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.070 |
| 37 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.106 |
| 38 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.110 |
| 39 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.080 |
| 40 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.112 |
| 41 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend answers-cap` | 3 | partial; 1 canonical JSON document | 0.197 |
| 42 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.098 |
| 43 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61` | 3 | partial; 1 canonical JSON document | 0.426 |
| 44 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.495 |
| 45 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.056 |
| 46 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 47 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-date` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 48 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 49 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 50 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 51 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 52 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 53 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 54 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.056 |
| 55 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 56 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.040 |
| 57 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 58 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.062 |
| 59 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 60 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 61 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.107 |
| 62 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.103 |
| 63 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.078 |
| 64 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 65 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.074 |
| 66 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 67 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.492 |
| 68 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.288 |
| 69 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend synthetic-working` | 3 | partial; 1 canonical JSON document | 0.555 |
| 70 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend two-person` | 2 | unsupported; 1 canonical JSON document | 0.087 |
| 71 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.082 |
| 72 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.083 |
| 73 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.054 |
| 74 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 75 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 76 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 77 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 78 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.073 |
| 79 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.067 |
| 80 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown` | 0 | complete; 1 canonical JSON document | 0.171 |
| 81 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.124 |
| 82 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.129 |
| 83 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.199 |
| 84 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.142 |
| 85 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.381 |
| 86 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.278 |
| 87 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.255 |
| 88 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.344 |
| 89 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers answers-cap` | 3 | partial; 1 canonical JSON document | 0.500 |
| 90 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.217 |
| 91 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61` | 3 | partial; 1 canonical JSON document | 2.828 |
| 92 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 2.951 |
| 93 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 94 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 95 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-date` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 96 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 97 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 98 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 99 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 100 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 101 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 102 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 103 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 104 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 105 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 106 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 107 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 108 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 109 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.399 |
| 110 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.453 |
| 111 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.171 |
| 112 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.174 |
| 113 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.167 |
| 114 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.168 |
| 115 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers synthetic-leap` | 3 | partial; 1 canonical JSON document | 2.967 |
| 116 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers synthetic-retired` | 0 | complete; 1 canonical JSON document | 1.171 |
| 117 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers synthetic-working` | 3 | partial; 1 canonical JSON document | 3.231 |
| 118 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers two-person` | 2 | unsupported; 1 canonical JSON document | 0.056 |
| 119 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.182 |
| 120 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.169 |
| 121 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.052 |
| 122 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 123 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 124 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 125 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 126 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.168 |
| 127 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- levers withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.143 |
| 128 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.083 |
| 129 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-pass-limit-1 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.071 |
| 130 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-proportional_taxable_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.069 |
| 131 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-roth_before_tax_deferred packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.083 |
| 132 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact A-drawdown-tax_deferred_first packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.072 |
| 133 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact B-early-retiree packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.108 |
| 134 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact C-partial-base-year-no-taxable packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.078 |
| 135 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact D-still-working-rmd-surplus packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.078 |
| 136 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact E-senior-2028-loss-carry packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.111 |
| 137 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact answers-cap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.156 |
| 138 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact answers-underfunded packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.103 |
| 139 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.424 |
| 140 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61-retire-later packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.502 |
| 141 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-account-type packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 142 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-cost-basis packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 143 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-date packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 144 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-end-before-start packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 145 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-assumption packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 146 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-cash-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 147 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-field packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 148 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-investment-return packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 149 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-missing-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 150 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-balance packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 151 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-negative-tax-indexing packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.064 |
| 152 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-output-range packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.072 |
| 153 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-owner packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 154 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-plan-end-age packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 155 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-rate packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 156 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact invalid-tax-pass-limit packages/app/test-data/empty-rough.json` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 157 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-baseline packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.108 |
| 158 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact retirement-date-scenario packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.110 |
| 159 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.080 |
| 160 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact return-assumption-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 161 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.075 |
| 162 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact spending-amount-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.076 |
| 163 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact synthetic-leap packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.491 |
| 164 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact synthetic-retired packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.292 |
| 165 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact synthetic-working packages/app/test-data/empty-rough.json` | 3 | partial; 1 canonical JSON document | 0.532 |
| 166 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact two-person packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 167 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.074 |
| 168 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unchanged-copy-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.077 |
| 169 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unsupported-healthcare packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.052 |
| 170 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-cash-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 171 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unsupported-negative-investment-return packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 172 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unsupported-state-tax packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 173 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact unsupported-tax-year packages/app/test-data/empty-rough.json` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 174 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-baseline packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 175 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact withdrawal-order-scenario packages/app/test-data/empty-rough.json` | 0 | complete; 1 canonical JSON document | 0.068 |
| 176 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- impact answers-working-61 packages/app/test-data/answers-working-61-rough.json` | 3 | partial; 1 canonical JSON document | 4.800 |
| 177 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.064 |
| 178 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.055 |
| 179 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.054 |
| 180 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.054 |
| 181 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.058 |
| 182 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.055 |
| 183 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.052 |
| 184 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.051 |
| 185 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.053 |
| 186 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run answers-cap` | 3 | partial; 1 canonical JSON document | 0.080 |
| 187 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.093 |
| 188 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run answers-working-61` | 3 | partial; 1 canonical JSON document | 0.110 |
| 189 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.116 |
| 190 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 191 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.053 |
| 192 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 193 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 194 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 195 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 196 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.042 |
| 197 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 198 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 199 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 200 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 201 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 202 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 203 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 204 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.040 |
| 205 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 206 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.059 |
| 207 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.061 |
| 208 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.059 |
| 209 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.057 |
| 210 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.060 |
| 211 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.059 |
| 212 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.095 |
| 213 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.082 |
| 214 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run synthetic-working` | 3 | partial; 1 canonical JSON document | 0.096 |
| 215 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run two-person` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 216 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.055 |
| 217 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.054 |
| 218 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 219 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.041 |
| 220 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 221 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 222 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 223 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.059 |
| 224 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.058 |
| 225 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown` | 0 | complete; 1 canonical JSON document | 0.071 |
| 226 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.076 |
| 227 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.075 |
| 228 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.072 |
| 229 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.073 |
| 230 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.075 |
| 231 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.073 |
| 232 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.069 |
| 233 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.074 |
| 234 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-cap` | 3 | partial; 1 canonical JSON document | 0.127 |
| 235 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.153 |
| 236 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61` | 3 | partial; 1 canonical JSON document | 0.166 |
| 237 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.189 |
| 238 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 239 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 240 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-date` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 241 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 242 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.041 |
| 243 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 244 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 245 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 246 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 247 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.051 |
| 248 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 249 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 250 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 251 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 252 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 253 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 254 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.081 |
| 255 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.076 |
| 256 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.069 |
| 257 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.073 |
| 258 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.069 |
| 259 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.074 |
| 260 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.158 |
| 261 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.128 |
| 262 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown synthetic-working` | 3 | partial; 1 canonical JSON document | 0.158 |
| 263 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown two-person` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 264 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.065 |
| 265 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.075 |
| 266 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 267 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 268 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.052 |
| 269 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 270 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.053 |
| 271 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.074 |
| 272 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare A-drawdown withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.079 |
| 273 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare retirement-date-baseline retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.077 |
| 274 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare spending-amount-baseline spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.076 |
| 275 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare return-assumption-baseline return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.077 |
| 276 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.077 |
| 277 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare unchanged-copy-baseline unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.072 |
| 278 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export A-drawdown` | 0 | complete; 1 canonical JSON document | 0.072 |
| 279 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-pass-limit-1` | 3 | partial; 1 canonical JSON document | 0.066 |
| 280 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.064 |
| 281 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.064 |
| 282 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.063 |
| 283 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export B-early-retiree` | 3 | partial; 1 canonical JSON document | 0.063 |
| 284 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export C-partial-base-year-no-taxable` | 3 | partial; 1 canonical JSON document | 0.059 |
| 285 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export D-still-working-rmd-surplus` | 3 | partial; 1 canonical JSON document | 0.057 |
| 286 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.057 |
| 287 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export answers-cap` | 3 | partial; 1 canonical JSON document | 0.119 |
| 288 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export answers-underfunded` | 3 | partial; 1 canonical JSON document | 0.142 |
| 289 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export answers-working-61` | 3 | partial; 1 canonical JSON document | 0.156 |
| 290 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.162 |
| 291 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 292 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 293 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-date` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 294 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 295 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 296 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 297 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 298 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 299 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 300 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 301 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 302 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 303 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 304 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.060 |
| 305 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 306 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 307 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export retirement-date-baseline` | 3 | partial; 1 canonical JSON document | 0.066 |
| 308 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export retirement-date-scenario` | 3 | partial; 1 canonical JSON document | 0.065 |
| 309 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.067 |
| 310 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.063 |
| 311 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.064 |
| 312 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.065 |
| 313 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export synthetic-leap` | 3 | partial; 1 canonical JSON document | 0.142 |
| 314 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.119 |
| 315 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export synthetic-working` | 3 | partial; 1 canonical JSON document | 0.147 |
| 316 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export two-person` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 317 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.064 |
| 318 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.068 |
| 319 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 320 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 321 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.046 |
| 322 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.046 |
| 323 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.047 |
| 324 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.063 |
| 325 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- export withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.064 |
| 326 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | partial; 1 canonical JSON document | 0.096 |
| 327 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.099 |
| 328 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 329 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 330 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/A-drawdown.export.json` | 0 | complete; 1 canonical JSON document | 0.096 |
| 331 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/B-early-retiree.export.json` | 3 | partial; 1 canonical JSON document | 0.112 |
| 332 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | partial; 1 canonical JSON document | 0.089 |
| 333 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | partial; 1 canonical JSON document | 0.080 |
| 334 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | complete; 1 canonical JSON document | 0.090 |
| 335 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-cap.export.json` | 3 | partial; 1 canonical JSON document | 0.247 |
| 336 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-underfunded.export.json` | 3 | partial; 1 canonical JSON document | 0.323 |
| 337 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61-retire-later.export.json` | 3 | partial; 1 canonical JSON document | 0.353 |
| 338 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/answers-working-61.export.json` | 3 | partial; 1 canonical JSON document | 0.358 |
| 339 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-baseline.export.json` | 3 | partial; 1 canonical JSON document | 0.093 |
| 340 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/retirement-date-scenario.export.json` | 3 | partial; 1 canonical JSON document | 0.092 |
| 341 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 342 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/return-assumption-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.094 |
| 343 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.094 |
| 344 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/spending-amount-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 345 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-leap.export.json` | 3 | partial; 1 canonical JSON document | 0.315 |
| 346 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-retired.export.json` | 0 | complete; 1 canonical JSON document | 0.248 |
| 347 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/synthetic-working.export.json` | 3 | partial; 1 canonical JSON document | 0.332 |
| 348 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.095 |
| 349 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.111 |
| 350 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | complete; 1 canonical JSON document | 0.097 |
| 351 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | complete; 1 canonical JSON document | 0.098 |
| 352 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/tampered-export.json` | 1 | invalid; 1 canonical JSON document | 0.065 |
| 353 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/unknown-format-export.json` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 354 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- import packages/app/test-data/model-0.3.0.export.json` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 355 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | complete; 1 canonical JSON document | 0.057 |
| 356 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-pass-limit-1` | 0 | partial; 1 canonical JSON document | 0.055 |
| 357 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.055 |
| 358 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | complete; 1 canonical JSON document | 0.056 |
| 359 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | complete; 1 canonical JSON document | 0.055 |
| 360 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | partial; 1 canonical JSON document | 0.056 |
| 361 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | partial; 1 canonical JSON document | 0.053 |
| 362 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | partial; 1 canonical JSON document | 0.051 |
| 363 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run E-senior-2028-loss-carry` | 0 | complete; 1 canonical JSON document | 0.055 |
| 364 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run answers-cap` | 0 | partial; 1 canonical JSON document | 0.081 |
| 365 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run answers-underfunded` | 0 | partial; 1 canonical JSON document | 0.096 |
| 366 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61` | 0 | partial; 1 canonical JSON document | 0.111 |
| 367 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run answers-working-61-retire-later` | 0 | partial; 1 canonical JSON document | 0.121 |
| 368 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 369 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 370 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | invalid; 1 canonical JSON document | 0.039 |
| 371 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 372 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 373 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | invalid; 1 canonical JSON document | 0.046 |
| 374 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | invalid; 1 canonical JSON document | 0.047 |
| 375 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | invalid; 1 canonical JSON document | 0.043 |
| 376 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-missing-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.044 |
| 377 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | invalid; 1 canonical JSON document | 0.052 |
| 378 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-negative-tax-indexing` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 379 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | invalid; 1 canonical JSON document | 0.054 |
| 380 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | invalid; 1 canonical JSON document | 0.048 |
| 381 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 382 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | invalid; 1 canonical JSON document | 0.049 |
| 383 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run invalid-tax-pass-limit` | 1 | invalid; 1 canonical JSON document | 0.050 |
| 384 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-baseline` | 0 | partial; 1 canonical JSON document | 0.060 |
| 385 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run retirement-date-scenario` | 0 | partial; 1 canonical JSON document | 0.062 |
| 386 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-baseline` | 0 | complete; 1 canonical JSON document | 0.058 |
| 387 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run return-assumption-scenario` | 0 | complete; 1 canonical JSON document | 0.055 |
| 388 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-baseline` | 0 | complete; 1 canonical JSON document | 0.056 |
| 389 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run spending-amount-scenario` | 0 | complete; 1 canonical JSON document | 0.056 |
| 390 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | partial; 1 canonical JSON document | 0.093 |
| 391 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | complete; 1 canonical JSON document | 0.080 |
| 392 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | partial; 1 canonical JSON document | 0.096 |
| 393 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run two-person` | 2 | unsupported; 1 canonical JSON document | 0.048 |
| 394 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-baseline` | 0 | complete; 1 canonical JSON document | 0.055 |
| 395 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unchanged-copy-scenario` | 0 | complete; 1 canonical JSON document | 0.059 |
| 396 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | unsupported; 1 canonical JSON document | 0.058 |
| 397 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | unsupported; 1 canonical JSON document | 0.049 |
| 398 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | unsupported; 1 canonical JSON document | 0.051 |
| 399 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | unsupported; 1 canonical JSON document | 0.050 |
| 400 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run unsupported-tax-year` | 2 | unsupported; 1 canonical JSON document | 0.053 |
| 401 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-baseline` | 0 | complete; 1 canonical JSON document | 0.057 |
| 402 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- dev-run withdrawal-order-scenario` | 0 | complete; 1 canonical JSON document | 0.060 |
| 403 | `7ed0d13` | workspace root | `node --version` | 0 | v24.22.0 | 0.004 |
| 404 | `7ed0d13` | workspace root | `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden` | 0 | 1 passed, 0 failed, 0 ignored; harness 5.02 s | 6.262 |
| 405 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json` | 3 | partial; 1 canonical JSON document | 0.490 |
| 406 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- compare answers-working-61 answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.222 |
| 407 | `7ed0d13` | workspace root | `cargo run -p horizon-cli -- spend answers-working-61-retire-later` | 3 | partial; 1 canonical JSON document | 0.499 |
| 408 | `7ed0d13` | workspace root | `cargo test -p horizon-wasm` | 0 | 2 passed, 0 failed, 0 ignored | 6.458 |
| 409 | `7ed0d13` | workspace root | `node --version` | 0 | v24.22.0 | 0.002 |
| 410 | `7ed0d13` | workspace root | `cargo build -p horizon-wasm --target wasm32-unknown-unknown --release` | 0 | passed | 0.075 |
| 411 | `7ed0d13` | apps/web | `node --version` | 0 | v24.22.0 | 0.002 |
| 412 | `7ed0d13` | apps/web | `corepack --version` | 0 | 0.36.0 | 0.028 |
| 413 | `7ed0d13` | apps/web | `corepack pnpm --version` | 0 | 12.9.1 | 0.038 |
| 414 | `7ed0d13` | apps/web | `corepack pnpm install --frozen-lockfile` | 0 | passed | 0.102 |
| 415 | `7ed0d13` | apps/web | `node --version` | 0 | v24.22.0 | 0.001 |
| 416 | `7ed0d13` | apps/web | `corepack pnpm run build:engine` | 0 | passed | 0.153 |
| 417 | `7ed0d13` | apps/web | `corepack pnpm run types` | 0 | passed | 0.283 |
| 418 | `7ed0d13` | apps/web | `corepack pnpm run typecheck` | 0 | passed | 1.635 |
| 419 | `7ed0d13` | apps/web | `corepack pnpm run lint` | 0 | passed | 2.340 |
| 420 | `7ed0d13` | apps/web | `corepack pnpm run format:check` | 0 | passed | 0.724 |
| 421 | `7ed0d13` | apps/web | `corepack pnpm test` | 0 | 89 passed | 5.412 |
| 422 | `7ed0d13` | apps/web | `node --version` | 0 | v24.22.0 | 0.001 |
| 423 | `7ed0d13` | apps/web | `corepack pnpm run build` | 0 | passed | 2.184 |
| 424 | `7ed0d13` | apps/web | `corepack pnpm exec playwright install chromium firefox webkit` | 0 | passed | 0.323 |
| 425 | `7ed0d13` | apps/web | `corepack pnpm run e2e` | 0 | 48 passed; 12 projects; 1272 screenshots; 4 one-page PDFs; 0 unexpected/skipped/flaky | 1867.872 |
| 426 | `7ed0d13` | apps/web | `corepack pnpm run licenses` | 0 | 4 production / 358 full package versions passed | 0.295 |
| 427 | `7ed0d13` | workspace root | `git diff --exit-code main HEAD -- packages Cargo.toml Cargo.lock rust-toolchain.toml deny.toml docs/model docs/briefs/assets apps/web/package.json apps/web/pnpm-lock.yaml` | 0 | passed | 0.011 |

#### Diagnostic runs and limits

- Before the implementation commit, frozen installation and type generation passed. The first typecheck exited 2 because the generated WebAssembly binding was not yet built. After building it, subsequent diagnostic typechecks identified an incorrect generated export type name, mock call signatures and use of `findLast` outside the existing ES2022 library; those were corrected without changing tool configuration.
- An initial lint exited 1 because a ref was read during render for the request cache; the cache now uses a stable state initializer. The initial unit run had 4 failures because extraction of the shared answer sentence removed Plan's emphasized amount; its presentation was restored. Subsequent diagnostic typecheck/lint passed and all 89 tests across 14 files passed. A diagnostic format check identified one test's formatting; it was fixed before the recorded validation.
- The first Chromium export smoke exited 1 because its test tried to Tab directly to an unchecked native radio option. The test now traverses the checked option with arrow keys, preserving native keyboard behavior. The second smoke exited 1 on axe's missing level-one heading in the print view; the summary now has its own document heading. The final diagnostic command, `corepack pnpm exec playwright test e2e/export.spec.ts --project=chromium-375-dark --project=webkit-1280-light`, exited 0 with 2 passed, 0 failures (3.2 minutes). The complete matrix above then passed.
- macOS execution was not observed in this Linux container. The cross-platform keyboard traversal and existing macOS browser launch fixture remain in place; a macOS pass is not claimed.
- Independent review remains a separate reviewer step; this record does not claim self-review.

#### Exclusions

- Rough marks and copies remain in-memory summary content and are deliberately absent from the unchanged engine plan-file format; saving them requires a later format.
- A one-click PDF download and a PDF dependency remain excluded; printing uses the browser's print dialog and the stylesheet supplies a light Letter layout.
- Sending plans to another person from inside Horizon remains excluded; the person shares the summary or downloaded file themselves.
- Engine export/import operations, models, schemas and goldens remain unchanged as required. No dependency, persistence, hosted route or authorization surface was added.
