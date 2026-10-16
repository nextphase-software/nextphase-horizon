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
