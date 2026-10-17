# Engine foundations — model 0.1.0

Historical W1 contract. The current model extends this foundation with the
[yearly ledger](yearly-ledger.md), required return assumptions and schema v2.
The v1 schema and W1 numerical reference values remain unchanged. The current
operation also includes [federal income tax](federal-tax.md).

This model is a synthetic, single-person US indexing skeleton. It does not
compute a funded retirement plan. Every successful run reports `partial`,
explains its estimated status and lists omitted calculations. Opening account
balances are observed only at the declared valuation date. Year rows contain
indexed input amounts, never a ledger, activated income or realized spending.
Taxes, withdrawals, surplus, required distributions, shortfalls, investment
growth and within-year flow timing enter in later briefs. Couples, state tax
and healthcare inputs return unsupported rather than approximations.

## Contracts and units

The public application operation is `horizon_app::run(&household, &assumptions)`.
It validates typed arguments too. `parse_fixture` accepts the development JSON
envelope with required `household` and `assumptions` members; `parse_household`
validates the household alone. No engine function reads host state.

Money is integer USD cents with checked i64 operations and an exact JSON output
range of ±9,007,199,254,740,991 cents. Exact rational intermediates use arbitrary
precision integers. Finalizing a line sums unrounded amounts first, then rounds
half away from zero exactly once. Output money includes `cents`, `unit`,
`currency`, `dollar_basis`, `base_year` and `year`. Income and spending inputs
are annual amounts; a nominal input denotes the entered nominal amount in each
year, and a today input is indexed from the valuation year.

The valuation year is B. Year rows include B through birth year plus end age,
inclusive. The age label is age on 31 December, not an eligibility rule. Exact
birth, retirement, wage start/end and benefit start-age fields remain inputs;
flow activation and mid-year timing are deferred. Annual indexing multiplies
by the exact fraction (1 + inflation)^(Y − B), then rounds once. Conversion to
today dollars divides by the same fraction, then rounds once. No annual
rounding is compounded. Date parsing implements Gregorian leap-year rules.

## Assumptions and metadata

Inflation is required as an assumption with identifier `inflation`, decimal
string `value`, unit `decimal_fraction_per_year`, source `user` or a cited public
HTTPS URL, the valuation year as `effective_year`, and an explicit
`user_overrode_default` boolean. No default is silently inserted. Other model
assumptions are unsupported. The run lists the complete used register sorted
by identifier. Non-money decimals use plain strings, at most 18 fractional
digits; inflation must exceed −1.

Metadata names `horizon-engine-0.1.0`, `us-single-indexing-skeleton-v1`, the base
rule-set year, cent rounding, annual indexing and the age-label convention.
This rule-set identifier denotes skeleton conventions, not a tax-law model.
SHA-256 hashes cover the validated, typed household and sorted assumption set
separately, serialized by the engine's restricted RFC 8785 canonicalizer.
Optional input fields normalize to null. Object names are ASCII; string values
retain Unicode without normalization; numbers are exact JSON-safe integers.
The canonicalizer recursively sorts keys and emits no whitespace. Changing an
assumption leaves the household hash unchanged, and vice versa.

## Household schema

[household-input.v1.schema.json](schemas/household-input.v1.schema.json) is
JSON Schema 2020-12, generated from the Rust household types with schemars.
Regenerate from the workspace root with:

```sh
cargo run -p horizon-app --example household-schema > docs/model/schemas/household-input.v1.schema.json
```

The schema describes the household, not the fixture envelope or separate
assumption register. Its `x-horizon-validation: "v1"` extension delegates
cross-field date ordering, end-age checks, account ownership and stable error
codes to `parse_household`. A schema caller must register this extension (the
`validation` tests demonstrate registration with jsonschema), or call
`parse_household` after structural validation. Generic validators that ignore
extensions perform only structural validation; they cannot establish these
cross-field conditions. The application operation always enforces them.
`jsonschema` is test-only, with network/file resolution features disabled.
A test compares the generated and committed schemas byte for byte; invalid
household fixtures fail the registered schema validator with their stable
codes. Assumption errors are tested against `run` separately.

## Fixtures

Use `cargo run -p horizon-cli -- dev-run <name>` from the workspace root.
A name resolves to `packages/app/fixtures/<name>.json`; a path is read directly.
The command prints canonical JSON plus one newline. Test data is synthetic.

| Name | Exit | Coverage / expected code |
| --- | --- | --- |
| `synthetic-working` | 0 | All four account types, wages, pension, Social Security, 2.5% inflation |
| `synthetic-retired` | 0 | Already retired, traditional IRA, no wages, zero inflation |
| `synthetic-leap` | 0 | Leap-day birth, midyear valuation, overridden 2.75% inflation |
| `invalid-missing-field` | 1 | MISSING_FIELD |
| `invalid-negative-balance` | 1 | NEGATIVE_BALANCE |
| `invalid-end-before-start` | 1 | END_BEFORE_START |
| `invalid-account-type` | 1 | UNKNOWN_ACCOUNT_TYPE |
| `invalid-plan-end-age` | 1 | PLAN_END_AGE_REACHED |
| `invalid-date` | 1 | INVALID_DATE |
| `invalid-owner` | 1 | INVALID_OWNER |
| `invalid-cost-basis` | 1 | ACCOUNT_FIELDS |
| `invalid-rate` | 1 | INVALID_RATE |
| `invalid-missing-assumption` | 1 | MISSING_ASSUMPTION |
| `invalid-output-range` | 1 | MONEY_OUTPUT_RANGE |
| `two-person` | 2 | MULTIPLE_PERSONS_UNSUPPORTED |
| `unsupported-state-tax` | 2 | FEATURE_UNSUPPORTED |
| `unsupported-healthcare` | 2 | FEATURE_UNSUPPORTED |

[Stable error codes](error-codes.md) are shared by every caller. This command is
only a development adapter; a supported command-line interface is deferred.

## Mechanical engine boundary

The engine forbids unsafe code, denies floating-point and unchecked arithmetic,
and configures Clippy bans for host methods/types in `packages/engine/clippy.toml`.
A workspace regression check also scans every engine source file, rejecting
host module paths, grouped/aliased standard-library imports, host macros,
external interfaces and random/hash-map facilities. It deliberately permits
only explicit standard-library paths to keep this check conservative.
Test-host code lives outside engine `src/` and may read sources and fixtures.
Native and wasm32 builds compile the same pure engine/application code.
Execution parity on WebAssembly, TypeScript bindings, persistence and UI are
outside this milestone; no route, authorization surface or export is added.
