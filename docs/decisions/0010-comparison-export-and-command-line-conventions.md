# 0010 — Comparison, export and command-line conventions (JSON Pointer change list; line differences by year and path; self-hashing versioned export; four subcommands; WebAssembly parity by committed golden outputs under Node.js 24.22.0)

- Status: Accepted
- Date: 2026-10-17
- Related: [0007](0007-rust-core-typescript-shell.md) — the application operations and command line this defines, and its amendment placing WebAssembly parity under Node.js; [0003](0003-money-and-time-conventions.md) — dollar bases that are never mixed; [0009](0009-federal-tax-computation-conventions.md) — the run being compared and exported.

## Context

Comparing two plans and exporting one needs exact answers to several questions:
- how a changed input is named;
- how lines in two runs are matched;
- what a comparison summarizes and which status it reports;
- how an export detects edits and an engine-version change;
- how WebAssembly output is proven identical to native output.

Verified on 2026-10-17:
- **Node.js:** the [release index](https://nodejs.org/dist/index.json) lists 24.22.0 as the current long-term-support release.
- **WebAssembly tooling:** the workspace's `Cargo.lock` resolves `wasm-bindgen` 0.2.129. crates.io lists `wasm-bindgen-test` 0.3.79 and `wasm-bindgen-cli` 0.2.129, both MIT OR Apache-2.0. The test runner must equal the locked `wasm-bindgen` version.
- **Run output:** it is serialized but has no published schema.
- **File access:** a `wasm32-unknown-unknown` test cannot read files, so fixtures and expected outputs must be compiled in.
- **JSON Pointer:** [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901).

## Decision

**Changed inputs**

1. **Name each changed input by its JSON Pointer into the input document `{household, assumptions}`, with the assumptions keyed by identifier.**
   - Examples: `/household/persons/0/retirement_date`, `/assumptions/investment_return/value`.
   - The changed-input list is computed by comparing the baseline and scenario documents: objects key by key, arrays index by index.
   - Each entry is `{path, change: added | modified | removed, baseline, scenario}`, sorted by path bytes.
   - Setting a value to what it already was lists nothing.

   A list derived from the two documents cannot disagree with what actually changed.
2. **`scenario(baseline, changes)` applies pointer-and-value changes to a copy and returns a new input.** The baseline is borrowed immutably and never modified. A comparison records both input hashes and both assumption-set hashes.

**Comparing two runs**

3. **List line differences by year and by path within that year's ledger.**
   - This covers every cent-valued line in each year's ledger and tax breakdown.
   - Accounts are addressed by identifier, not position, for example `/accounts/ira/closing`, so adding an account does not shift the others.
   - A line is listed when its cents differ (difference = scenario − baseline), or when it exists in only one run; the missing side is then null and no difference is computed.
   - Equal lines are omitted, so an unchanged copy shows nothing. The list is sorted by year, then path.
   - Both sides must carry the same dollar basis. Otherwise the comparison fails with its own code, and nothing is subtracted.
4. **Summarize each run, and the differences:**
   - the first shortfall year, or null when there is none;
   - total shortfall and total federal tax paid, labeled "nominal, summed across years";
   - each account's closing balance in the last projected year;
   - the household ending total.
5. **Comparison status:**
   - **unsupported** if either input is unsupported;
   - otherwise **complete** only when both runs are complete, and **partial** when either is partial.

   Each run's status, omissions and flags are reproduced exactly.

**Export and import**

6. **An export is canonical JSON `{export_format_version: 1, model_version, rule_set_identifier, rule_set_year, input, run, hashes}`.**
   - `input` is the fixture envelope, including any `pass_limit`.
   - `run` is byte-identical to the run output.
   - `hashes` holds the method `sha-256`, the input hash, the assumption-set hash, and `export_content_hash`: the SHA-256 of the canonical export with that one field omitted.
7. **Import checks, in this order:**
   1. an unknown format version is **unsupported** (`EXPORT_FORMAT_UNSUPPORTED`);
   2. a content-hash mismatch is **invalid** (`EXPORT_HASH_MISMATCH`);
   3. a model version other than the running engine's is **unsupported** (`EXPORT_MODEL_VERSION_UNSUPPORTED`), because results are reproducible only on the same model;
   4. the input is validated;
   5. the run is repeated, and output that is not byte-identical to the embedded `run` is **invalid** (`EXPORT_RESULT_MISMATCH`).

   Otherwise import returns the run output.

**Command line**

8. **The supported command line is `horizon`, in `horizon-cli`.**
   - Subcommands: `run <name|path>`, `compare <baseline> <scenario>`, `export <name|path>` and `import <path>`.
   - Each prints canonical JSON and a newline.
   - Exit codes: 0 complete, 3 partial, 1 invalid, 2 unsupported. Errors use the existing JSON error envelope.
   - `dev-run` is unchanged, including its exit 0 for partial results. For every valid fixture it prints the same bytes as `run`.
9. **Publish versioned JSON Schemas (2020-12, generated with `schemars`) for run output v1, comparison v1 and export v1,** next to the input schemas, each with a drift test. Household input schema v2 is unchanged.

**WebAssembly parity**

10. **Prove WebAssembly parity with committed golden outputs in a separate test crate.**
    - **Test crate:** `horizon-parity` (`packages/parity`, `publish = false`) depends on `horizon-app`. Its one new dependency is the dev-dependency `wasm-bindgen-test` 0.3.79. Keeping it separate means test-only dependencies of other crates never need to compile for WebAssembly.
    - **Golden outputs:** committed under `packages/parity/golden/`, holding each valid fixture's canonical run output and export. A native test proves they equal current output. A WebAssembly test, using compile-time includes, proves the WebAssembly build produces identical bytes. The earlier unit reference values also run on WebAssembly.
    - **Runner:** `wasm-bindgen-test-runner` from `wasm-bindgen-cli` 0.2.129, under Node.js 24.22.0. It is selected through the `CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER` environment variable in the documented command, so no `.cargo/` configuration folder is added.
    - The Node.js version and the runner are recorded in `AGENTS.md`, `README.md` and the implementation record.

## Consequences

- Every comparison and export output can be defined exactly, so reference values can be derived independently of any implementation.
- `wasm-bindgen-test` is the only new crate, and it is test-only. Node.js and `wasm-bindgen-cli` are tools, not dependencies.
- An export made by another model version does not import; migrating exports is a later feature.
- **Security:** an export is not authenticated. The content hash detects edits, but anyone who changes an export can recompute it. Import must never be described as tamper-proof. Signed exports belong with hosted accounts.
