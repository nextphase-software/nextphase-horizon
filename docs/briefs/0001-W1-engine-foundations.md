BRIEF VERSION: 0001-W1 v5 (2026-10-16)

# 0001-W1 — Engine foundations

## Outcome

A calculation core written in Rust loads a synthetic household for one US single filer and its assumptions, validates them, and runs a year-by-year projection skeleton. Every output names its units, dollar basis, model version, rule-set year and assumption sources, and the same inputs always produce identical output. A development command prints the result for any fixture, so a person can read real output. No taxes, withdrawals or required distributions are computed yet.

## Deliverables

1. **One Cargo workspace** (decision 0007):

   | Crate | Path | Holds |
   |---|---|---|
   | `horizon-engine` | `packages/engine` | pure calculation |
   | `horizon-app` | `packages/app` | application operations, validation and fixtures |
   | `horizon-cli` | `packages/cli` | the development command (deliverable 11), as a binary named `horizon` |

   - The root holds `Cargo.toml` (the workspace), `Cargo.lock` (committed), `rust-toolchain.toml` and `deny.toml`. It may also hold `rustfmt.toml`.
   - No other new top-level file or folder is added.
   - `.gitignore` already ignores `target/`.
   - `rust-toolchain.toml` pins `channel = "1.99.1"` with the `rustfmt` and `clippy` components and the `wasm32-unknown-unknown` target.
   - Every crate uses edition 2024 and the `AGPL-3.0-only` license.
2. **A money type** (decisions 0003 and 0007):
   - **Representation:** `i64` cents of US dollars. Every operation is checked: overflow returns an error and never wraps.
   - **Intermediate values:** before a line is finalized, a result is an exact fraction of cents; the rounding function takes that exact value.
   - **Rounding** (decision 0003 and its 2026-10-16 amendment), applied when a line is finalized:
     - round by size to the nearest cent: under half a cent rounds down, half a cent or more rounds up;
     - a negative amount is rounded by its size and keeps its sign (half away from zero);
     - when a line adds several amounts, they are added unrounded and only the total is rounded.
   - **No floating point** anywhere in the core crates.
   - **Range:** every monetary value written to output lies within ±(2^53 − 1) cents. A larger value is an error with its own code, so every number is exact for any JSON reader, including JavaScript.
3. **A household input schema for exactly one person:**
   - a valuation date: the date on which opening balances are stated and whose calendar year is the base year for today's dollars (the engine never reads the clock);
   - birth date, retirement date and plan end age;
   - accounts: cash, taxable investment, tax-deferred (employer plan or traditional IRA) and Roth, each with an owner, an opening balance, and a cost basis for taxable accounts;
   - income streams: wages with start and end dates; a Social Security benefit entered as an amount with its start age; one pension with start age;
   - two spending phases (before and after retirement), each with an amount and its declared dollar basis.
   Money is entered as integer cents. Rates and other non-money decimals are written as decimal strings, never as JSON numbers with a fraction.
4. **Validation** that rejects malformed input with a stable machine-readable error code and a readable message:
   - a missing required field;
   - a negative balance;
   - an end date before a start date;
   - an unknown account type;
   - a plan end age the person already reaches by 31 December of the base year.
   - Input with more than one person returns an explicit **unsupported** status with its own code, not a result.
   - Every code is listed in one published table, `docs/model/error-codes.md`, and is never reused for a different meaning.
5. **An assumption register.** Each assumption has an identifier, value, unit, source (a cited public reference or "user"), effective year, and whether the user overrode the default. A run lists every assumption it used, sorted by identifier.
6. **A yearly loop with these definitions:**
   - **Years.** The first projection year is the base year B, the calendar year of the valuation date. The last is the calendar year in which the person reaches the plan end age.
   - **Age shown for a year.** The person's age in whole years on 31 December of that year, computed from the exact birth date. This always equals the year minus the birth year. It labels the year only. Age-based rules in later milestones use the exact date tests that decision 0003 requires, not this label.
   - **Indexing.** A today's-dollar amount A becomes a nominal amount in year Y as A × (1 + i)^(Y − B), where i is the declared inflation assumption.
     - The rate is parsed exactly from its decimal string.
     - The factor is an exact fraction of arbitrary-precision integers.
     - The product is rounded once by the rule in deliverable 2, never year by year.
     - Year B has a factor of exactly 1.
   - **Conversion to today's dollars.** A nominal amount divides by the same factor and rounds once. A round trip may differ by at most one cent.
   - The index is annual. When flows occur within a year (decision 0003, item 5) is settled in 0001-W2 and does not change this factor.
   - Every monetary output is labeled with its dollar basis and can be converted to today's dollars.
7. **Run metadata:** model version, rule-set identifier and year, a hash of the assumption set and a hash of the inputs.
   - Each hash is SHA-256, written in lowercase hexadecimal, of the canonical JSON bytes of the validated input or the assumption set.
   - Canonical JSON follows RFC 8785:
     - object members are sorted recursively by name, and all names are ASCII;
     - no insignificant whitespace;
     - strings are escaped as the RFC specifies;
     - output contains only strings, integers within ±(2^53 − 1), booleans, null, arrays and objects.
   - The metadata names both methods: `"sha-256"` and `"rfc8785"`.
   - Hashing and canonical JSON run inside the Rust core (decision 0007, item 7).
8. **At least three synthetic fixtures** in `packages/app/fixtures/`, each a JSON file holding one household and its assumption set. Also committed:
   - at least one invalid input for each validation rule;
   - one two-person input.
9. **A versioned JSON Schema for the household input:**
   - dialect 2020-12;
   - generated from the Rust input types with `schemars`;
   - published at `docs/model/schemas/household-input.v1.schema.json`.
   Validation implements it. The schema is the contract other callers (command line, API, interface, agents) are built against.
10. **A pure engine.**
    - `horizon-engine` performs no input or output and holds no state.
    - It is called through the application operation `run(household, assumptions)` in `horizon-app`.
    - Both crates compile for `wasm32-unknown-unknown`.
11. **A development command,** `horizon dev-run <fixture name | file path>`. It runs the input through `run` and prints the result to standard output as canonical JSON with a trailing newline.
    - It exits 0 for a result, 1 for invalid input and 2 for unsupported input. For 1 and 2 it prints the status, error code and message as JSON.
    - A fixture name resolves to `packages/app/fixtures/<name>.json`.
    - Reading the file and printing happen in `horizon-cli`, never in the engine.
    - It is a development tool, not the supported command-line entry point, which 0001-W4 delivers.
12. **Dependencies.** Only these crates, at these versions or a later patch release of the same line:

    | Crate | Version | License | Use |
    |---|---|---|---|
    | `serde` (with `derive`) | 1.0.229 | MIT OR Apache-2.0 | input and output types |
    | `serde_json` | 1.0.154 | MIT OR Apache-2.0 | parsing and serialization |
    | `schemars` | 1.2.3 | MIT | schema generation |
    | `num-bigint` | 0.5.1 | MIT OR Apache-2.0 | exact index factors |
    | `num-traits` | 0.2.19 | MIT OR Apache-2.0 | integer traits |
    | `sha2` | 0.11.1 | MIT OR Apache-2.0 | hashes |
    | `jsonschema` | 0.58.6 | MIT | schema validation, as a dev-dependency only, with default features off where they add network or file access |

    Any other crate requires escalation before use.
13. **A license check.**
    - `cargo-deny` 0.20.2 (MIT OR Apache-2.0) runs with a committed `deny.toml`.
    - The `deny.toml` allows only these licenses: MIT, Apache-2.0, Apache-2.0 WITH LLVM-exception, BSD-2-Clause, BSD-3-Clause, ISC, Zlib and Unicode-3.0.
    - A dependency with any other license is a stop-and-report, not an allow-list edit.
14. **Lints.**
    - In both core crates (`horizon-engine` and `horizon-app`), deny `clippy::float_arithmetic` and `clippy::arithmetic_side_effects`.
    - In `horizon-engine`, forbid file, network, clock, environment, process, thread and random-number facilities, using `clippy::disallowed_methods` and `clippy::disallowed_types` configured in `packages/engine/clippy.toml`, or an equivalent mechanical check. The rule applies to that crate only, because `horizon-cli` must read files.
15. **Documented commands.**
    - Replace the "no commands yet" statements in `AGENTS.md` (Validation section) and `README.md` with the exact validation commands below.
    - Change nothing else in those files.

## Done when

1. The money type passes every rounding and overflow value in the reference values below, in debug and release builds.
2. Each validation rule in deliverable 4 has a failing-input test that asserts its error code and message, and the two-person input returns **unsupported** with its code.
3. Running any fixture twice produces byte-identical output, including metadata.
4. Changing one assumption changes the assumption-set hash and leaves the input hash unchanged; changing one input changes the input hash and leaves the assumption-set hash unchanged.
5. Each fixture's output lists every assumption used, with value, unit, source and year.
6. Every age, plan-year, indexing and conversion value in the reference values below is committed as a test and passes exactly.
7. No output value lacks a unit and dollar-basis label.
8. Every fixture validates against the published input schema, and each invalid input fails schema validation with its expected code. A test fails if the committed schema differs from the one generated from the Rust types.
9. The lints in deliverable 14 are active and pass. A test or check fails if `horizon-engine` uses a disallowed facility.
10. For each fixture, `horizon dev-run` prints output byte-identical to that fixture's serialized `run` result in the tests. The invalid and two-person inputs exit 1 and 2 with their codes.
11. Canonical JSON matches the RFC 8785 string example in its section 3.2.2, restricted to strings. A value above 2^53 − 1 cents returns its range error.
12. `horizon-engine` and `horizon-app` build for `wasm32-unknown-unknown`. Running the reference values on that build is 0001-W4's job, not this milestone's.
13. `cargo deny check licenses` passes. The implementation record names every resolved dependency with its exact version and license.
14. `AGENTS.md` and `README.md` list exactly the commands in the Validation section, and every one of them runs.

## Reference values

These values were derived independently, with exact rational arithmetic, and cross-checked with 120-digit decimal arithmetic. Amounts are in cents. Commit them as tests exactly as given. If a value seems wrong, escalate; do not change it.

**Rounding to the cent** (deliverable 2). The input is an exact amount in cents.

| Input | Result | Input | Result |
|---|---|---|---|
| 1000.4 | 1000 | −1000.4 | −1000 |
| 1000.5 | 1001 | −1000.5 | −1001 |
| 1000.6 | 1001 | −1000.6 | −1001 |
| 0.5 | 1 | −0.5 | −1 |
| 1000.49999 | 1000 | | |

**Summed lines** (add unrounded, round the total):

| Amounts | Result | Rounding each first would give |
|---|---|---|
| 0.4 + 0.4 + 0.4 | 1 | 0 |
| 0.3 + 0.3 | 1 | 0 |
| −0.3 + −0.3 | −1 | 0 |

**Overflow and range:**
- `i64::MAX` + 1 cent is an overflow error.
- `i64::MIN` − 1 cent is an overflow error.
- An output value of 2^53 cents is a range error.
- 2^53 − 1 cents is accepted.

**Age shown for a year** (age on 31 December):

| Birth date | Year | Age |
|---|---|---|
| 1966-01-01 | 2026 | 60 |
| 1966-12-31 | 2026 | 60 |
| 1964-02-29 | 2026 | 62 |
| 1964-02-29 | 2028 | 64 |
| 1966-07-15 | 2061 | 95 |

**Projection years** (birth date 1966-07-15, valuation date in 2026, so B = 2026):

| Plan end age | Result |
|---|---|
| 95 | years 2026 to 2061, 36 years |
| 61 | years 2026 to 2027, 2 years |
| 60 | rejected: the person reaches 60 by 31 December 2026 |

**Indexing to nominal** (amount A in today's dollars, base year 2026):

| A | Rate | Year | Nominal |
|---|---|---|---|
| 6000000 | "0.025" | 2026 | 6000000 |
| 6000000 | "0.025" | 2027 | 6150000 |
| 6000000 | "0.025" | 2028 | 6303750 |
| 6000000 | "0.025" | 2056 | 12585405 |
| 100 | "0.025" | 2027 | 103 |
| 100 | "0.025" | 2028 | 105 |
| 6000000 | "0" | 2056 | 6000000 |
| 6000000 | "0.0275" | 2061 | 15506555 |
| 4250000 | "0.03" | 2040 | 6428506 |

- The 2056 row shows that rounding happens once: rounding year by year would give 12585408.
- The row for 100 in 2027 is an exact half cent (102.5), which rounds to 103.

**Conversion to today's dollars** (base year 2026):

| Nominal | Rate | Year | Today's dollars | Converted back to nominal |
|---|---|---|---|---|
| 12585405 | "0.025" | 2056 | 6000000 | 12585405 |
| 103 | "0.025" | 2027 | 100 | 103 |
| 10000000 | "0.025" | 2046 | 6102709 | 9999999 (within one cent) |

## Read first

- `DESIGN.md` and `AGENTS.md`.
- `docs/decisions/0007-rust-core-typescript-shell.md` (Rust core, TypeScript shell; supersedes 0002), including its 2026-10-16 amendment.
- `docs/decisions/0003-money-and-time-conventions.md` (money and time), including its 2026-10-16 amendment on rounding.
- 0002 is superseded and is not an input, except for the headless-first layering that 0007 carries over.
- Public references:
  - IRS, Instructions for Form 1040 (2025), "Rounding Off to Whole Dollars": https://www.irs.gov/instructions/i1040gi, retrieved 2026-10-16.
  - RFC 8785, JSON Canonicalization Scheme: https://www.rfc-editor.org/rfc/rfc8785, retrieved 2026-10-16.
  - JSON Schema 2020-12: https://json-schema.org/draft/2020-12/schema, retrieved 2026-10-16.
  - Rust stable release 1.99.1 (2026-10-13): https://static.rust-lang.org/dist/channel-rust-stable.toml, retrieved 2026-10-16.
  - Crate versions and licenses from the crates.io registry API: https://crates.io/api/v1/crates/<name>, retrieved 2026-10-16.
  - Clippy lint reference: https://doc.rust-lang.org/clippy/, retrieved 2026-10-16.

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

Install once: the toolchain from `rust-toolchain.toml` (rustup does this automatically), and `cargo install cargo-deny --version 0.20.2 --locked`. Then run, in order:

1. `cargo test -p horizon-engine money` — money and rounding; tests live in a module named `money`.
2. `cargo test -p horizon-app validation` — validation; tests live in a module named `validation`.
3. `cargo test -p horizon-app --test reference_values` — every reference value above (`packages/app/tests/reference_values.rs`).
4. `cargo test --workspace`
5. `cargo clippy --workspace --all-targets -- -D warnings`
6. `cargo fmt --all --check`
7. `cargo test --workspace --release`
8. `cargo build --workspace --release`
9. `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown`
10. `cargo deny check licenses`
11. `cargo run -p horizon-cli -- dev-run <name>` for each fixture, then for each invalid input and the two-person input, recording each exit status.

## Exclusions

- Taxes — 0001-W3.
- Withdrawals, surplus handling, required minimum distributions, shortfalls and when flows occur within a year — 0001-W2.
- Scenario comparison, export and the supported command-line entry point — 0001-W4.
- Running the reference values on the WebAssembly build — 0001-W4.
- TypeScript and the WebAssembly binding for TypeScript — the first milestone that adds a TypeScript adapter.
- User interface and persistence — later features.
- Couples, state tax and healthcare costs — later features; returned as unsupported, not approximated.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.

### 2026-10-16 — implementation complete; independent review pending

- Brief: **0001-W1 v5**, with the exact MIT-0 exception approved by the maintainer
  on 2026-10-16 as recorded below.
- Branch: `codex/0001-W1-engine-foundations`.
- Worktree: `.worktrees/codex-0001-W1`, created from `main` at
  `a5f6c620ec7d6c81af38993071f9a4ebe03bbc92`.
- **Source/test revision:** `4feb459f1cfd7cb6bbd7f440c0fe670587f62a5c`.
  All commands below ran against that committed revision with a clean worktree.
  This later record changes only this brief; the final branch tip is reported
  separately in the handoff. No push, merge or independent review is claimed.

The workspace adds the pure Rust engine, application `run` operation and
`horizon dev-run` adapter. Exact checked cents and arbitrary-precision rational
indexing preserve every published reference vector. Validated input and the
sorted used-assumption register have independent SHA-256 hashes over restricted
RFC 8785 JSON. Three synthetic households and fourteen invalid/unsupported
fixtures exercise the contract. Monetary output carries units, currency, basis,
base year and year; run output explicitly says `partial` and lists omissions.
[Model and contract notes](../model/engine-foundations.md),
[stable errors](../model/error-codes.md) and the
[generated 2020-12 schema](../model/schemas/household-input.v1.schema.json)
are committed with the source.

The schema has an explicit `x-horizon-validation: "v1"` extension for cross-field
conditions and stable error codes; its registered implementation calls
`parse_household`. Generic schema validators that ignore this extension must
also call `parse_household` for full validation. The test validator registers
it, checks invalid household codes, and compares regenerated schema bytes.
Assumption-register validation is separate from the household schema.

#### Approved license exception

The maintainer approved **MIT-0 for `borrow-or-share 0.2.4` only** on 2026-10-16.
This is the only exception to deliverable 13's general license allow-list.
`deny.toml` uses the exact package specification `borrow-or-share@0.2.4`;
it does not allow MIT-0 globally or for other versions. The dependency chain is
`jsonschema 0.58.6 → referencing 0.58.6 → fluent-uri 0.4.1 → borrow-or-share 0.2.4`,
and it is test-only. The license checker explicitly includes development and
build dependencies. Its initial development-license exclusion was corrected;
the unapproved configuration then failed with exit 4, and the final approved
configuration passes with exit 0. Two warnings are unused existing allowances
(BSD-3-Clause and ISC); no rejected dependency remains.

#### Validation

Toolchain: Rust 1.99.1, edition 2024, cargo-deny 0.20.2. Commands ran in the
following order against the source/test revision above. No gate was skipped.

| Command | Exit | Observed result |
| --- | --- | --- |
| `cargo test -p horizon-engine money` | 0 | 2 money tests passed; rounding, summed lines, overflow and JSON output range |
| `cargo test -p horizon-app validation` | 0 | 4 tests passed; validation/schema, deterministic runs, hash independence and units |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 tests passed; all supplied numerical vectors unchanged |
| `cargo test --workspace` | 0 | 20 tests passed; 0 failed, 0 ignored |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | No warnings or errors; core arithmetic/float lints active |
| `cargo fmt --all --check` | 0 | Formatting matches |
| `cargo test --workspace --release` | 0 | 20 tests passed; 0 failed, 0 ignored |
| `cargo build --workspace --release` | 0 | All three crates built |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | Engine and application compiled for WebAssembly |
| `cargo deny check licenses` | 0 | Licenses pass, including development/build dependencies and the approved exact exception |

The CLI integration suite additionally proves byte-identical canonical output
against serialized `run` results for each valid fixture by both name and file
path, including from a different working directory, in debug and release.
Error envelopes are canonical JSON with a trailing newline. The source-boundary
check scans every engine source and tests rejection of forbidden host facilities;
the test host alone is allowed file access to inspect those sources.

Each required development invocation was also run separately after those gates:

| Command | Exit | Result / error code |
| --- | --- | --- |
| `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | Partial indexing result |
| `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | Partial indexing result |
| `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | Partial indexing result |
| `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | `MISSING_FIELD` |
| `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | `NEGATIVE_BALANCE` |
| `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | `END_BEFORE_START` |
| `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | `UNKNOWN_ACCOUNT_TYPE` |
| `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | `PLAN_END_AGE_REACHED` |
| `cargo run -p horizon-cli -- dev-run two-person` | 2 | `MULTIPLE_PERSONS_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | `INVALID_DATE` |
| `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | `INVALID_OWNER` |
| `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | `ACCOUNT_FIELDS` |
| `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | `INVALID_RATE` |
| `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | `MISSING_ASSUMPTION` |
| `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | `FEATURE_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | `FEATURE_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | `MONEY_OUTPUT_RANGE` |

Additional observations: the commit hooks passed for the source commit; the
branch's full raw ancestry check and installed-hook verification passed.
These are automated checks, not the independent review gate. `git diff --check`
passed. `AGENTS.md` and `README.md` change only their former no-commands text
and list the brief's exact validation commands.

#### Dependencies

No new direct external dependency beyond deliverable 12 was added. The three
workspace crates are AGPL-3.0-only and unpublished. The seven direct external
crates are pinned exactly in the workspace manifest; transitive versions are
locked in `Cargo.lock`. The following 92-package inventory includes test, build
and target-specific resolutions, with exact versions and declared registry
license expressions. Alternative-license expressions are resolved under the
allowed licenses by cargo-deny; MIT-0 uses only the approved exact exception.
The separate installed checker is cargo-deny 0.20.2 (MIT OR Apache-2.0).
A standalone copy is in [the dependency inventory](../model/dependencies.md).

| Package | Version | License expression |
| --- | --- | --- |
| `ahash` | 0.8.12 | MIT OR Apache-2.0 |
| `aho-corasick` | 1.1.5 | Unlicense OR MIT |
| `allocator-api2` | 0.2.21 | MIT OR Apache-2.0 |
| `autocfg` | 1.5.1 | Apache-2.0 OR MIT |
| `bit-set` | 0.8.0 | Apache-2.0 OR MIT |
| `bit-vec` | 0.8.0 | Apache-2.0 OR MIT |
| `bitflags` | 2.13.2 | MIT OR Apache-2.0 |
| `block-buffer` | 0.12.1 | MIT OR Apache-2.0 |
| `borrow-or-share` | 0.2.4 | MIT-0 |
| `bumpalo` | 3.20.3 | MIT OR Apache-2.0 |
| `bytecount` | 0.6.9 | Apache-2.0/MIT |
| `cfg-if` | 1.0.5 | MIT OR Apache-2.0 |
| `const-oid` | 0.10.2 | Apache-2.0 OR MIT |
| `cpufeatures` | 0.3.1 | MIT OR Apache-2.0 |
| `crypto-common` | 0.2.2 | MIT OR Apache-2.0 |
| `data-encoding` | 2.11.1 | MIT |
| `digest` | 0.11.3 | MIT OR Apache-2.0 |
| `dyn-clone` | 1.0.20 | MIT OR Apache-2.0 |
| `email_address` | 0.2.9 | MIT |
| `equivalent` | 1.0.3 | Apache-2.0 OR MIT |
| `fancy-regex` | 0.19.2 | MIT |
| `fluent-uri` | 0.4.1 | MIT |
| `foldhash` | 0.2.0 | Zlib |
| `fraction` | 0.17.0 | MIT OR Apache-2.0 |
| `getrandom` | 0.3.4 | MIT OR Apache-2.0 |
| `hashbrown` | 0.17.1 | MIT OR Apache-2.0 |
| `heck` | 0.5.0 | MIT OR Apache-2.0 |
| `hybrid-array` | 0.4.15 | MIT OR Apache-2.0 |
| `itoa` | 1.0.18 | MIT OR Apache-2.0 |
| `js-sys` | 0.3.106 | MIT OR Apache-2.0 |
| `jsonschema` | 0.58.6 | MIT |
| `jsonschema-regex` | 0.58.6 | MIT |
| `jsonschema-value` | 0.58.6 | MIT |
| `libc` | 0.2.190 | MIT OR Apache-2.0 |
| `lock_api` | 0.4.14 | MIT OR Apache-2.0 |
| `memchr` | 2.8.3 | Unlicense OR MIT |
| `micromap` | 0.3.0 | MIT |
| `num` | 0.4.3 | MIT OR Apache-2.0 |
| `num-bigint` | 0.4.8 | MIT OR Apache-2.0 |
| `num-bigint` | 0.5.1 | MIT OR Apache-2.0 |
| `num-cmp` | 0.1.0 | MIT/Apache-2.0 |
| `num-complex` | 0.4.6 | MIT OR Apache-2.0 |
| `num-integer` | 0.1.47 | MIT OR Apache-2.0 |
| `num-iter` | 0.1.46 | MIT OR Apache-2.0 |
| `num-rational` | 0.4.2 | MIT OR Apache-2.0 |
| `num-traits` | 0.2.19 | MIT OR Apache-2.0 |
| `once_cell` | 1.21.4 | MIT OR Apache-2.0 |
| `outref` | 0.5.2 | MIT |
| `parking_lot` | 0.12.5 | MIT OR Apache-2.0 |
| `parking_lot_core` | 0.9.12 | MIT OR Apache-2.0 |
| `percent-encoding` | 2.3.2 | MIT OR Apache-2.0 |
| `proc-macro2` | 1.0.107 | MIT OR Apache-2.0 |
| `quote` | 1.0.47 | MIT OR Apache-2.0 |
| `r-efi` | 5.3.0 | MIT OR Apache-2.0 OR LGPL-2.1-or-later |
| `redox_syscall` | 0.5.18 | MIT |
| `ref-cast` | 1.0.27 | MIT OR Apache-2.0 |
| `ref-cast-impl` | 1.0.27 | MIT OR Apache-2.0 |
| `referencing` | 0.58.6 | MIT |
| `regex` | 1.13.1 | MIT OR Apache-2.0 |
| `regex-automata` | 0.4.18 | MIT OR Apache-2.0 |
| `regex-syntax` | 0.8.11 | MIT OR Apache-2.0 |
| `rustversion` | 1.0.23 | MIT OR Apache-2.0 |
| `schemars` | 1.2.3 | MIT |
| `schemars_derive` | 1.2.3 | MIT |
| `scopeguard` | 1.2.0 | MIT OR Apache-2.0 |
| `serde` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_core` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_derive` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_derive_internals` | 0.30.0 | MIT OR Apache-2.0 |
| `serde_json` | 1.0.154 | MIT OR Apache-2.0 |
| `sha2` | 0.11.1 | MIT OR Apache-2.0 |
| `smallvec` | 1.16.3 | MIT OR Apache-2.0 |
| `strum` | 0.28.0 | MIT |
| `strum_macros` | 0.28.0 | MIT |
| `syn` | 2.0.119 | MIT OR Apache-2.0 |
| `syn` | 3.0.9 | MIT OR Apache-2.0 |
| `typenum` | 1.20.1 | MIT OR Apache-2.0 |
| `unicode-general-category` | 1.1.0 | Apache-2.0 |
| `unicode-ident` | 1.0.27 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| `uuid-simd` | 0.8.0 | MIT |
| `version_check` | 0.9.5 | MIT/Apache-2.0 |
| `vsimd` | 0.8.0 | MIT |
| `wasip2` | 1.0.4+wasi-0.2.12 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| `wasm-bindgen` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-macro` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-macro-support` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-shared` | 0.2.129 | MIT OR Apache-2.0 |
| `windows-link` | 0.2.1 | MIT OR Apache-2.0 |
| `wit-bindgen` | 0.57.1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| `zerocopy` | 0.8.63 | BSD-2-Clause OR Apache-2.0 OR MIT |
| `zerocopy-derive` | 0.8.63 | BSD-2-Clause OR Apache-2.0 OR MIT |
| `zmij` | 1.0.23 | MIT |

#### Exclusions and handoff limits

- Taxes: deferred to 0001-W3; no tax result is computed.
- Withdrawals, surplus handling, required distributions, shortfalls and
  within-year flow timing: deferred to 0001-W2. Year rows are indexed inputs,
  not activated flows or a funded account ledger; investment growth is omitted.
- Comparison, export and the supported CLI: deferred to 0001-W4. `dev-run` is
  only the development command.
- Reference-vector execution on WebAssembly: deferred to 0001-W4; this milestone
  proves compilation only.
- TypeScript and its WebAssembly bindings: deferred to the first adapter milestone.
- UI and persistence: deferred to later features; no interface or storage exists.
- Couples, state tax and healthcare: explicitly unsupported, with tested status
  and error codes; not approximated.
- No hosted route, document-access or export surface is added, so hosted
  tenant/role authorization is not exercised in this milestone. Synthetic data only.
- Independent review, operator merge, merged-result validation and publication
  are pending; this implementation handoff does not mark the milestone Done.
