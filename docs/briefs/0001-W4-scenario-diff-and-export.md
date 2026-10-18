BRIEF VERSION: 0001-W4 v4 (2026-10-17)

# 0001-W4 — Scenario comparison, versioned export and WebAssembly parity

## Outcome

A person can copy a baseline, change any inputs, and compare the two results. The comparison lists every changed input and every line that differs, by year and in summary. Any run can be exported to a versioned file that reproduces the same result when imported. The baseline is never altered.

The Rust command line becomes the supported way in, with four subcommands. Every reference result is proven byte-identical on the native build and on the WebAssembly module that later adapters will load.

## Deliverables

1. **Scenario copy** (decision 0010, items 1–2): `scenario(baseline, changes)` applies JSON Pointer and value changes to a copy and returns a new input; the baseline is never modified. The changed-input list is computed by comparing the baseline and scenario input documents, `{household, assumptions keyed by identifier}`. Each entry is `{path, change: added | modified | removed, baseline, scenario}`, sorted by path bytes.
2. **Comparison** (decision 0010, items 3–5):
   - **Line differences:** for every cent-valued line in each year's ledger and federal tax breakdown, identified by year and its path within the year's ledger, with accounts by identifier (for example `/accounts/ira/closing`). Equal lines are omitted. A line in only one run is listed with the other side null. Lines are sorted by year, then path. Lines with different dollar bases are never subtracted; that returns its own error code.
   - **Summary for each run, and the differences:** first shortfall year; total shortfall and total federal tax paid, labeled "nominal, summed across years"; closing balance per account in the last projected year; ending total.
   - **The changed-input list,** plus both input hashes and both assumption-set hashes.
   - **Status:** unsupported if either input is; otherwise complete only when both runs are complete. Each run's status, omissions and flags are reproduced exactly.
3. **Export** (decision 0010, item 6): canonical JSON `{export_format_version: 1, model_version, rule_set_identifier, rule_set_year, input, run, hashes}`.
   - `input` is the fixture envelope, including any `pass_limit`.
   - `run` is byte-identical to the `run` output.
   - `hashes` holds `method: "sha-256"`, `input_hash`, `assumption_set_hash`, and `export_content_hash`, the SHA-256 of the canonical export with that field omitted.
4. **Import** (decision 0010, item 7), checked in this order:
   1. unknown format version: **unsupported**, `EXPORT_FORMAT_UNSUPPORTED`;
   2. content-hash mismatch: **invalid**, `EXPORT_HASH_MISMATCH`;
   3. a model version other than the running engine's: **unsupported**, `EXPORT_MODEL_VERSION_UNSUPPORTED`;
   4. input validation;
   5. the rerun must be byte-identical to the embedded `run`, otherwise **invalid**, `EXPORT_RESULT_MISMATCH`.
   On success it returns the run output. Every code is added to `docs/model/error-codes.md`.
5. **Schemas:** run output v1, comparison v1 and export v1, as JSON Schema 2020-12 generated with `schemars` from the Rust types and published under `docs/model/schemas/` (for example `run-output.v1.schema.json`). Each has a drift test. Household input schema v2 is unchanged.
6. **The supported command line,** `horizon` in `horizon-cli`:
   - `horizon run <name|path>`;
   - `horizon compare <baseline name|path> <scenario name|path>`;
   - `horizon export <name|path>`;
   - `horizon import <path>`.
   Each prints canonical JSON and a newline, and exits 0 for complete, 3 for partial, 1 for invalid and 2 for unsupported; the status field always matches the exit code. The command line contains no calculation rule. `dev-run` is unchanged, including its exit 0 for partial results; for every valid fixture it prints the same bytes as `run`.
7. **WebAssembly parity** (decision 0010, item 10; decision 0007, item 2 and its amendment):
   - **Test crate:** `horizon-parity` at `packages/parity` (`publish = false`), depending on `horizon-app`, with the only new dependency `wasm-bindgen-test` 0.3.79 as a dev-dependency.
   - **Golden outputs:** committed under `packages/parity/golden/`, holding each valid fixture's canonical `run` output and export. A native test proves they equal current output. A WebAssembly test, compiling the fixtures and golden files in, proves the module produces byte-identical output.
   - **Earlier reference values on WebAssembly:** the 0001-W1 to 0001-W3 unit reference values also run on WebAssembly.
   - **Runner:** `wasm-bindgen-test-runner` from `wasm-bindgen-cli` 0.2.129, which must equal the locked `wasm-bindgen`, under Node.js 24.22.0, set through the `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER` environment variable. No `.cargo/` folder or other new top-level entry.
8. **Fixtures:**
   - every comparison case in `docs/briefs/0001-W4-reference-values.json`, as a baseline fixture and a scenario fixture named `<case>-baseline` and `<case>-scenario`;
   - one tampered export and one unknown-format export, each as committed test data.
9. **Documented commands:** `AGENTS.md` and `README.md` list the full cumulative W1–W4 validation commands, with the Node.js and runner install steps.

## Done when

1. **Reference comparisons:** for every case in `docs/briefs/0001-W4-reference-values.json`, `compare` produces exactly:
   - the expected changed-input list;
   - the expected status;
   - the expected summary for both runs, with differences;
   - the expected line differences among the file's `compared_paths`.
   The cases change the retirement date, a spending amount, the return assumption and the withdrawal order.
2. **Unchanged copy:** comparing a scenario with an unchanged copy reports an empty changed-input list and no line differences at all.
3. **Baseline untouched:** a test proves the baseline's input and run output are byte-identical before and after a scenario is created and compared.
4. **Round trip:** for every valid fixture, export → import reproduces byte-identical run output.
5. **Import rejections:**
   - the tampered export is rejected with `EXPORT_HASH_MISMATCH`;
   - the unknown-format export returns **unsupported** with `EXPORT_FORMAT_UNSUPPORTED`;
   - a changed model version returns `EXPORT_MODEL_VERSION_UNSUPPORTED`;
   - an export whose embedded run was altered and then re-hashed is rejected with `EXPORT_RESULT_MISMATCH`.
6. **Status reproduced:** status, omissions and flags appear in the comparison and the export exactly as in each run.
7. **Schemas:** every run output, comparison and export validates against its published schema, and the drift tests pass.
8. **Command line:** for each fixture, `run`, `compare` and `export` print output byte-identical to the application operations. Error codes match, and each exit code matches the status (0 complete, 3 partial, 1 invalid, 2 unsupported). `dev-run` and `run` print identical bytes for every valid fixture.
9. **WebAssembly parity:** the golden outputs and the 0001-W1 to 0001-W3 unit reference values pass on `wasm32-unknown-unknown` under Node.js, byte-identical to native.
10. **Earlier guarantees hold:**
    - all 0001-W1 to 0001-W3 tests pass;
    - the three earlier reference files and the W1 reference test source are unchanged;
    - no floating-point or unchecked integer arithmetic;
    - the engine crate uses no host facilities;
    - the license check passes;
    - the implementation record names `wasm-bindgen-test` with its exact version and license.

## Reference values

These were derived independently with exact integer arithmetic, by running an independent model of 0001-W1 to 0001-W3 on each baseline and scenario. Commit them exactly as given. If a value seems wrong, escalate; do not change it. The file covers the `compared_paths`; the implementation compares every other cent-valued line too.

## Read first

- `DESIGN.md` and `AGENTS.md`.
- The 0001-W1 to 0001-W3 code, `docs/model/`, and the earlier reference files.
- Decision records:
  - `docs/decisions/0003-*` (money and time);
  - `docs/decisions/0007-*` (stack), including its amendment;
  - `docs/decisions/0009-*` (federal tax);
  - `docs/decisions/0010-*` (comparison, export and command line).
- Public references:
  - RFC 6901, JSON Pointer: https://www.rfc-editor.org/rfc/rfc6901, retrieved 2026-10-17.
  - Node.js release index: https://nodejs.org/dist/index.json (24.22.0 LTS), retrieved 2026-10-17.
  - wasm-bindgen guide, testing with `wasm-bindgen-test`: https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/index.html, retrieved 2026-10-17.

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

Install once:
- the toolchain from `rust-toolchain.toml`;
- `cargo install cargo-deny --version 0.20.2 --locked`;
- `cargo install wasm-bindgen-cli --version 0.2.129 --locked`;
- Node.js 24.22.0 on `PATH`.

Then run, in order:

1. `cargo test -p horizon-app compare` — comparison tests; tests live in a module named `compare`.
2. `cargo test -p horizon-app immutability`
3. `cargo test -p horizon-app export` — export and import tests.
4. `cargo test -p horizon-app --test reference_values_w4` — every comparison case (`packages/app/tests/reference_values_w4.rs`).
5. The earlier focused and reference commands, unchanged:
   - `cargo test -p horizon-engine tax`
   - `cargo test -p horizon-app --test reference_values_w3`
   - `cargo test -p horizon-app --test reference_values_w2`
   - `cargo test -p horizon-app --test reference_values`
   - `cargo test -p horizon-engine ledger`
   - `cargo test -p horizon-engine money`
   - `cargo test -p horizon-app validation`
6. `cargo test -p horizon-parity` — native golden outputs.
7. `cargo test --workspace`
8. `cargo clippy --workspace --all-targets -- -D warnings`
9. `cargo fmt --all --check`
10. `cargo test --workspace --release`
11. `cargo build --workspace --release`
12. `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown`
13. `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` — WebAssembly parity under Node.js; record `node --version`.
14. `cargo deny check licenses`
15. `cargo run -p horizon-cli -- run|compare|export|import …` on each fixture and case, and `dev-run` on each fixture, recording each exit status.

## Exclusions

- The TypeScript binding for the module, and any TypeScript code — the first milestone that adds a TypeScript adapter. Node.js is used here only to run the WebAssembly tests.
- Export signing or authentication — a later feature with hosted accounts. The content hash detects edits; it does not prove who made an export.
- User interface for comparison and export; readable reports — later features.
- HTTP API and agent access — later features; this milestone provides the Rust command line only.
- Persistence, accounts and sharing — later features.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.


### 2026-10-17 — implementation complete; independent review pending

- Brief: **0001-W4 v4**.
- Branch: `codex/0001-W4-scenario-diff-and-export`.
- Worktree: `.worktrees/codex-0001-W4`, created from committed `main` at
  `1216f35142caa4374ad38487900c52ef8b3934eb`.
- **Source/test revision:** `ee5dbd85916697530daa6232960ae50ac2651b61`.
  The full sequence below ran against that committed revision, with a clean
  worktree before and after. This later record changes only this brief. The
  final branch tip is reported separately at handoff; no independent review,
  merge or push is claimed here.

#### Delivered contracts and evidence

The application now creates validated scenario copies with JSON Pointer changes,
compares normalized household/keyed-assumption documents, and reports all changed
cent-valued ledger/tax lines by year and escaped account identifier. It preserves
both runs' status, omissions, flags and hashes. Summaries give first shortfall
year, nominal sums, final account balances and ending totals, with differences.
Mismatched dollar bases are rejected. Tests prove an unchanged copy has no
changed inputs or line differences, and that baseline input and run bytes are
unchanged by scenario creation and comparison.

All five committed W4 comparison cases match their changed inputs, status,
summaries and every expected difference among the specified paths. Other
monetary lines are compared too, including the complete federal-tax breakdown.
Added/removed account sides remain null with no difference; Unicode, slash and
tilde account identifiers retain unambiguous escaped paths.

Export v1 carries the exact fixture envelope (including pass_limit), current
run, model/rule-set metadata and a canonical SHA-256 content hash excluding only
its own field. Import checks format, content hash, model version, input validity
and reproduced run in that order. It also checks duplicated metadata consistency.
Tampered, unknown-format, stale-model and re-hashed-result edits have the
specified stable codes. All 22 valid fixtures round-trip to byte-identical runs.
The hash is an integrity checksum, not signing or proof of authorship.

Generated 2020-12 schemas for run, comparison and export have drift tests and
validate every valid fixture's output. Household schemas are unchanged. The
supported Rust CLI calls application operations for run, compare, export and
import. Complete/partial/invalid/unsupported exits are 0/3/1/2. Legacy dev-run
retains exit 0 for partial and identical run bytes. New tests check names and
paths, exact output bytes, statuses and error codes. The old CLI usage test now
uses an unknown command because run is a supported command.

The unpublished horizon-parity crate compiles fixtures and 44 generated golden
files (run and export for each valid fixture) into its test module. Native and
WebAssembly runs/exports/imports are byte-identical. The same W1 unit test bodies
and W2/W3 unit reference bodies run on both hosts; W1's original reference test
file is unchanged. Native coverage also verifies that the manifest includes
every valid fixture. Golden data is generated explicitly by an example; tests
never overwrite it. No new top-level entry or .cargo configuration was added.
The financial model remains horizon-engine-0.3.0; no financial rule changed.

#### Tool versions and final validation

- Rust: **1.99.1**, unchanged pinned toolchain.
- `node --version`: **v24.22.0**.
- `wasm-bindgen-test-runner --version`: **wasm-bindgen-test-runner 0.2.129**,
  from wasm-bindgen-cli **0.2.129**, matching locked wasm-bindgen **0.2.129**.
- cargo-deny: **0.20.2**.
- Node.js was already installed. The WebAssembly command ran with
  `$HOME/.nvm/versions/node/v24.22.0/bin` first on PATH, and the runner selected
  through `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER`; no .cargo folder is used.
- **59 native tests passed in debug and 59 in release.** Native parity has
  **11 tests**; WebAssembly parity has **10 tests** (the native-only filesystem
  manifest completeness check is excluded on WebAssembly).

The first 20 commands below ran in this order, exactly as listed in both README
and AGENTS. Each exited 0. CLI expansions then ran in their documented order,
with expected nonzero partial/error exits recorded separately below.

| Command | Exit | Observed result |
| --- | --- | --- |
| `cargo test -p horizon-app compare` | 0 | 3 tests passed |
| `cargo test -p horizon-app immutability` | 0 | 1 tests passed |
| `cargo test -p horizon-app export` | 0 | 2 tests passed |
| `cargo test -p horizon-app --test reference_values_w4` | 0 | 1 tests passed |
| `cargo test -p horizon-engine tax` | 0 | 2 tests passed |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 tests passed |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 tests passed |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 tests passed |
| `cargo test -p horizon-engine ledger` | 0 | 2 tests passed |
| `cargo test -p horizon-engine money` | 0 | 2 tests passed |
| `cargo test -p horizon-app validation` | 0 | 5 tests passed |
| `cargo test -p horizon-parity` | 0 | 11 tests passed |
| `cargo test --workspace` | 0 | 59 tests passed |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | passed |
| `cargo fmt --all --check` | 0 | passed |
| `cargo test --workspace --release` | 0 | 59 tests passed |
| `cargo build --workspace --release` | 0 | passed |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | passed |
| `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown` | 0 | 10 tests passed |
| `cargo deny check licenses` | 0 | licenses ok; existing unused BSD-3-Clause and ISC allowance warnings only |

#### CLI command expansions — 205 invocations

Each column below is the observed exit for
`cargo run -p horizon-cli -- <command> <fixture>`; the compare column expands
`cargo run -p horizon-cli -- compare A-drawdown <fixture>`. Every envelope's
status matched its exit (export uses embedded run.status). All valid run,
export and dev-run bytes matched the committed goldens; application/CLI parity
for all comparisons is also asserted by the workspace CLI tests. All invalid
and unsupported fixture error codes retained their expected values.

| Fixture | run | compare | export | dev-run | Status / error code |
| --- | --- | --- | --- | --- | --- |
| `A-drawdown` | 0 | 0 | 0 | 0 | `complete` |
| `A-drawdown-pass-limit-1` | 3 | 3 | 3 | 0 | `partial` |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | 0 | 0 | 0 | `complete` |
| `A-drawdown-roth_before_tax_deferred` | 0 | 0 | 0 | 0 | `complete` |
| `A-drawdown-tax_deferred_first` | 0 | 0 | 0 | 0 | `complete` |
| `B-early-retiree` | 3 | 3 | 3 | 0 | `partial` |
| `C-partial-base-year-no-taxable` | 3 | 3 | 3 | 0 | `partial` |
| `D-still-working-rmd-surplus` | 3 | 3 | 3 | 0 | `partial` |
| `E-senior-2028-loss-carry` | 0 | 0 | 0 | 0 | `complete` |
| `invalid-account-type` | 1 | 1 | 1 | 1 | `UNKNOWN_ACCOUNT_TYPE` |
| `invalid-cost-basis` | 1 | 1 | 1 | 1 | `ACCOUNT_FIELDS` |
| `invalid-date` | 1 | 1 | 1 | 1 | `INVALID_DATE` |
| `invalid-end-before-start` | 1 | 1 | 1 | 1 | `END_BEFORE_START` |
| `invalid-missing-assumption` | 1 | 1 | 1 | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-cash-return` | 1 | 1 | 1 | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-field` | 1 | 1 | 1 | 1 | `MISSING_FIELD` |
| `invalid-missing-investment-return` | 1 | 1 | 1 | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-tax-indexing` | 1 | 1 | 1 | 1 | `MISSING_ASSUMPTION` |
| `invalid-negative-balance` | 1 | 1 | 1 | 1 | `NEGATIVE_BALANCE` |
| `invalid-negative-tax-indexing` | 1 | 1 | 1 | 1 | `INVALID_TAX_INDEXING` |
| `invalid-output-range` | 1 | 1 | 1 | 1 | `MONEY_OUTPUT_RANGE` |
| `invalid-owner` | 1 | 1 | 1 | 1 | `INVALID_OWNER` |
| `invalid-plan-end-age` | 1 | 1 | 1 | 1 | `PLAN_END_AGE_REACHED` |
| `invalid-rate` | 1 | 1 | 1 | 1 | `INVALID_RATE` |
| `invalid-tax-pass-limit` | 1 | 1 | 1 | 1 | `INVALID_TAX_PASS_LIMIT` |
| `retirement-date-baseline` | 3 | 3 | 3 | 0 | `partial` |
| `retirement-date-scenario` | 3 | 3 | 3 | 0 | `partial` |
| `return-assumption-baseline` | 0 | 0 | 0 | 0 | `complete` |
| `return-assumption-scenario` | 0 | 0 | 0 | 0 | `complete` |
| `spending-amount-baseline` | 0 | 0 | 0 | 0 | `complete` |
| `spending-amount-scenario` | 0 | 0 | 0 | 0 | `complete` |
| `synthetic-leap` | 3 | 3 | 3 | 0 | `partial` |
| `synthetic-retired` | 0 | 0 | 0 | 0 | `complete` |
| `synthetic-working` | 3 | 3 | 3 | 0 | `partial` |
| `two-person` | 2 | 2 | 2 | 2 | `MULTIPLE_PERSONS_UNSUPPORTED` |
| `unchanged-copy-baseline` | 0 | 0 | 0 | 0 | `complete` |
| `unchanged-copy-scenario` | 0 | 0 | 0 | 0 | `complete` |
| `unsupported-healthcare` | 2 | 2 | 2 | 2 | `FEATURE_UNSUPPORTED` |
| `unsupported-negative-cash-return` | 2 | 2 | 2 | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `unsupported-negative-investment-return` | 2 | 2 | 2 | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `unsupported-state-tax` | 2 | 2 | 2 | 2 | `FEATURE_UNSUPPORTED` |
| `unsupported-tax-year` | 2 | 2 | 2 | 2 | `TAX_YEAR_UNSUPPORTED` |
| `withdrawal-order-baseline` | 0 | 0 | 0 | 0 | `complete` |
| `withdrawal-order-scenario` | 0 | 0 | 0 | 0 | `complete` |

The five additional reference pair invocations were
`cargo run -p horizon-cli -- compare <case>-baseline <case>-scenario`:

| Case | Exit | Status |
| --- | --- | --- |
| `retirement-date` | 3 | `partial` |
| `return-assumption` | 0 | `complete` |
| `spending-amount` | 0 | `complete` |
| `unchanged-copy` | 0 | `complete` |
| `withdrawal-order` | 0 | `complete` |

Each import below ran as `cargo run -p horizon-cli -- import <path>`.
All valid imports reproduced the golden run byte for byte, including pass_limit
and the exact status, omissions and annual flags.

| Path | Exit | Status / error code |
| --- | --- | --- |
| `packages/parity/golden/A-drawdown-pass-limit-1.export.json` | 3 | `partial` |
| `packages/parity/golden/A-drawdown-proportional_taxable_tax_deferred.export.json` | 0 | `complete` |
| `packages/parity/golden/A-drawdown-roth_before_tax_deferred.export.json` | 0 | `complete` |
| `packages/parity/golden/A-drawdown-tax_deferred_first.export.json` | 0 | `complete` |
| `packages/parity/golden/A-drawdown.export.json` | 0 | `complete` |
| `packages/parity/golden/B-early-retiree.export.json` | 3 | `partial` |
| `packages/parity/golden/C-partial-base-year-no-taxable.export.json` | 3 | `partial` |
| `packages/parity/golden/D-still-working-rmd-surplus.export.json` | 3 | `partial` |
| `packages/parity/golden/E-senior-2028-loss-carry.export.json` | 0 | `complete` |
| `packages/parity/golden/retirement-date-baseline.export.json` | 3 | `partial` |
| `packages/parity/golden/retirement-date-scenario.export.json` | 3 | `partial` |
| `packages/parity/golden/return-assumption-baseline.export.json` | 0 | `complete` |
| `packages/parity/golden/return-assumption-scenario.export.json` | 0 | `complete` |
| `packages/parity/golden/spending-amount-baseline.export.json` | 0 | `complete` |
| `packages/parity/golden/spending-amount-scenario.export.json` | 0 | `complete` |
| `packages/parity/golden/synthetic-leap.export.json` | 3 | `partial` |
| `packages/parity/golden/synthetic-retired.export.json` | 0 | `complete` |
| `packages/parity/golden/synthetic-working.export.json` | 3 | `partial` |
| `packages/parity/golden/unchanged-copy-baseline.export.json` | 0 | `complete` |
| `packages/parity/golden/unchanged-copy-scenario.export.json` | 0 | `complete` |
| `packages/parity/golden/withdrawal-order-baseline.export.json` | 0 | `complete` |
| `packages/parity/golden/withdrawal-order-scenario.export.json` | 0 | `complete` |
| `packages/app/test-data/tampered-export.json` | 1 | `EXPORT_HASH_MISMATCH` |
| `packages/app/test-data/unknown-format-export.json` | 2 | `EXPORT_FORMAT_UNSUPPORTED` |

Additional validation: `git diff --check` passed. Installed source-commit hooks,
working-tree boundary checks and the explicit branch ancestry boundary check
passed; these establish only their implemented checks, not an independent
milestone review. All pre-existing W1–W3 reference artifacts and W1 reference
test source are unchanged; W4 reference JSON and both household schemas are
also byte-identical to main. Representative SHA-256 receipts:

| Artifact | SHA-256 |
| --- | --- |
| `packages/app/tests/reference_values.rs` | `36b073a3a27292892c77144b8d11b8b2cc783110fe3df465a4595c7c4f533953` |
| `docs/briefs/0001-W2-reference-values.json` | `251014c80b1e26e428ee8e622cc6fb9795b7340cd4a6dab057dacd620d59292c` |
| `docs/briefs/0001-W3-reference-values.json` | `207a99e66411b82daf6e6a5bc9304970f3d91b2ccdf41c1bc97228342a85a1c5` |
| `docs/briefs/0001-W4-reference-values.json` | `ac24ae94f1afaddd45986862a866630aace850fea0e39dd1ef1cb970f1314698` |
| `docs/model/schemas/household-input.v2.schema.json` | `5fcc1e70a9f343973d4f7ce6c1b0260cca38bf7804dfea6d596b8b7ca5b010f6` |

#### Dependencies

The only new direct external dependency is **wasm-bindgen-test 0.3.79**,
**MIT OR Apache-2.0**, dev-only in horizon-parity. Existing workspace dependencies
horizon-engine and serde_json are reused by its proof code. No runtime library
or financial dependency was added. The 23 newly resolved external packages are
listed below; all existing external package versions are retained. The complete
115-package inventory is in `docs/model/dependencies.md`. License policy and
the exact MIT-0 exception for borrow-or-share 0.2.4 are unchanged.

| New resolved package | Version | License expression |
| --- | --- | --- |
| `async-trait` | 0.1.92 | MIT OR Apache-2.0 |
| `cast` | 0.3.0 | MIT OR Apache-2.0 |
| `cc` | 1.8.0 | MIT OR Apache-2.0 |
| `find-msvc-tools` | 0.1.14 | MIT OR Apache-2.0 |
| `futures-core` | 0.3.34 | MIT OR Apache-2.0 |
| `futures-task` | 0.3.34 | MIT OR Apache-2.0 |
| `futures-util` | 0.3.34 | MIT OR Apache-2.0 |
| `libm` | 0.2.16 | MIT |
| `minicov` | 0.3.8 | Apache-2.0/MIT |
| `nu-ansi-term` | 0.50.3 | MIT |
| `oorandom` | 11.1.5 | MIT |
| `pin-project-lite` | 0.2.17 | Apache-2.0 OR MIT |
| `same-file` | 1.0.6 | Unlicense/MIT |
| `shlex` | 2.0.1 | MIT OR Apache-2.0 |
| `slab` | 0.4.12 | MIT |
| `tokio` | 1.53.3 | MIT |
| `walkdir` | 2.5.0 | Unlicense/MIT |
| `wasm-bindgen-futures` | 0.4.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-test` | 0.3.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-test-macro` | 0.3.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-test-shared` | 0.2.129 | MIT OR Apache-2.0 |
| `winapi-util` | 0.1.11 | Unlicense OR MIT |
| `windows-sys` | 0.61.2 | MIT OR Apache-2.0 |

wasm-bindgen-cli 0.2.129 (MIT OR Apache-2.0), Node.js 24.22.0 and cargo-deny
0.20.2 are development tools, not new application dependencies. Node runs only
the WebAssembly test harness.

#### Exclusions

- TypeScript bindings and all TypeScript code: reserved for the first adapter
  milestone. This change proves the Rust module under Node, without adding an
  adapter, npm package or top-level configuration directory.
- Export signing and authentication: reserved for hosted accounts; the content
  hash can be recomputed by an editor and is not proof of origin.
- Comparison/export graphical UI and readable reports: later features; output
  here is canonical machine-readable JSON.
- HTTP API and agent access: later features; the only host adapter added is the
  supported Rust command line.
- Persistence, accounts and sharing: later features; no storage or hosted
  service is introduced.
- Existing financial omissions and unsupported input boundaries: retained from
  W1–W3; this milestone does not expand the financial model or silently clear
  partial flags.
- Independent milestone review: reserved for a different session after handoff.
  No publication, deployment, push or merge was performed.
