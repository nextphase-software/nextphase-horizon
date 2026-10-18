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
