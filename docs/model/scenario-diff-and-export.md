# Scenario comparison, export and native/WebAssembly parity — 0001-W4

The financial model stays `horizon-engine-0.3.0`, rule set
`us-single-federal-tax-v3`, year 2026. This milestone adds application operations,
versioned output contracts and command adapters without changing tax or ledger
calculations. All inputs and fixtures are synthetic. Calculation and tax
omissions remain those documented in [federal-tax.md](federal-tax.md).

## Application operations

`horizon_app::scenario(&baseline, &changes)` borrows an input immutably and
returns a validated copy. Each `PointerChange` contains `path` and `value`.
Paths address `{household, assumptions}`, with assumptions keyed by identifier.
For example, `/assumptions/investment_return/value` changes one rate.
A source fixture's optional `pass_limit` is retained as a run option. It is
exported exactly; it is outside the decision 0010 changed-input document.

Pointers follow [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901), retrieved
2026-10-17: `~0` encodes tilde and `~1` encodes slash. The empty pointer replaces
the whole input document. Existing array positions may be replaced; a final
`-` appends to an array. Leading-zero array indices and malformed escapes fail.
An object leaf may be added, but its parent must exist. Removing a field is
possible by replacing its parent with an object omitting that field. The final
root must contain exactly household and keyed assumptions. Assumption keys must
match their identifiers. The copied input goes through normal validation and
run validation; failed changes never modify the baseline.

`horizon_app::compare(&baseline, &scenario)` runs both inputs, with unsupported
errors taking precedence if either run is unsupported. `compare_documents`
provides the equivalent operation for two fixture JSON documents, validating
both before selecting errors. Valid comparison status is complete only when
both runs are complete; otherwise it is partial. The comparison embeds both
runs, preserving each status, omission, annual flag and hash exactly.

Changed inputs are derived from the two normalized input documents, not the
requested patch list. Objects compare by key, arrays by position, assumptions
by identifier. Entries have path, added/modified/removed kind, and both values;
an absent side is null. Entries sort by UTF-8 path bytes. Equal settings and
assumption array reordering produce no changes.

Every object with a monetary `cents` field in each yearly ledger is compared,
including all federal-tax breakdown lines. Account paths use escaped identifiers
rather than array positions. Differences sort by year and path. Equal cents are
omitted; a missing side is null and its difference is null. Different dollar
bases return `COMPARISON_BASIS_MISMATCH`, including equal cents with different
bases. Subtraction uses checked Money arithmetic and exact JSON-safe cents.
Monetary differences retain units, currency, dollar basis, base year and year.
Unicode account IDs remain values and pointer strings, never canonical JSON
object member names.

Each summary gives first shortfall year (or null), last year, nominal shortfall
and tax totals, final-year account balances, and ending total. Totals carry the
explicit label **nominal, summed across years**; they are not present values.
Ending balances are identifier/balance records sorted by identifier. Summary
differences are scenario minus baseline, including account and ending totals;
missing account sides and unavailable first-shortfall-year differences are null.
The last-year difference makes differing projection horizons explicit.

## Export/import v1

`horizon_app::export(&fixture)` returns canonical JSON with exactly
`export_format_version`, `model_version`, `rule_set_identifier`, `rule_set_year`,
`input`, `run` and `hashes`. Input retains the fixture envelope, including any
`pass_limit`. Run serializes to the same bytes as the run operation. Hashes hold
the method sha-256, input and assumption-set hashes from that run, and
`export_content_hash`: SHA-256 of canonical export JSON with only that last hash
field omitted. No timestamp, host path or random value enters the result.

`horizon_app::import(json)` checks in order:

1. Format version; unsupported versions return `EXPORT_FORMAT_UNSUPPORTED`.
2. Content hash; mismatch returns `EXPORT_HASH_MISMATCH`.
3. Engine model version; mismatch returns `EXPORT_MODEL_VERSION_UNSUPPORTED`.
4. Input validation and a fresh run, preserving normal error codes.
5. Byte equality of canonical rerun and embedded run, and consistency of the
   full envelope's duplicated hashes and rule-set metadata. A re-hashed edit
   that does not reproduce returns `EXPORT_RESULT_MISMATCH`.

Success returns the restored run. The hash detects content edits, not authorship
or authorization: this is not export signing or authentication.

The generated JSON Schema 2020-12 contracts are
[run v1](schemas/run-output.v1.schema.json),
[comparison v1](schemas/comparison.v1.schema.json) and
[export v1](schemas/export.v1.schema.json). Rust types derive `schemars::JsonSchema`.
Drift tests compare generated files and validate every valid fixture's output.
Household input v2 remains byte-identical. Regenerate output schemas explicitly:

```sh
cargo run -p horizon-app --example output-schemas
```

## Supported command line

Install/build the `horizon-cli` workspace binary with Rust. It contains only file
reading, command dispatch, canonical printing and exit mapping; all operations
call the application layer.

```sh
cargo run -p horizon-cli -- run A-drawdown
cargo run -p horizon-cli -- compare withdrawal-order-baseline withdrawal-order-scenario
cargo run -p horizon-cli -- export A-drawdown > /tmp/horizon-example.export.json
cargo run -p horizon-cli -- import /tmp/horizon-example.export.json
```

Run/export/compare accept fixture names or JSON file paths; import accepts a
file path. Each prints canonical JSON plus one newline. Exit status is 0 for
complete, 3 partial, 1 invalid, 2 unsupported. Export status is in `run.status`;
other successful operations have a top-level status. Errors use the existing
status/code/message envelope. Legacy `dev-run` prints identical run bytes and
keeps exit 0 for partial, with its earlier error exits unchanged.

## Fixtures and command checks

The [W4 reference JSON](../briefs/0001-W4-reference-values.json) is unchanged.
Its five cases each have `<case>-baseline` and `<case>-scenario` fixtures:
`retirement-date`, `spending-amount`, `return-assumption`, `withdrawal-order`
and `unchanged-copy`. These ten join the 34 W3 fixtures, for 44 total: 22 valid
and 22 invalid/unsupported. All are in `packages/app/fixtures/`. The earlier
fixture/error catalog remains in [federal-tax.md](federal-tax.md#fixtures).

For the cumulative validation commands in README and AGENTS, expand run,
export and dev-run over all 44 names; compare `A-drawdown` with each fixture,
then the five named baseline/scenario pairs. Import all 22 committed golden
exports in `packages/parity/golden/` and both rejection examples in
`packages/app/test-data/`: `tampered-export.json` (exit 1, hash mismatch) and
`unknown-format-export.json` (exit 2, unsupported format). Thus every fixture
and case has application/CLI byte parity and observed status/exit checks.

## Native and WebAssembly proof

The unpublished `horizon-parity` crate depends on horizon-app and adds only
wasm-bindgen-test 0.3.79 as a new external dev-dependency, MIT OR Apache-2.0.
Existing engine and serde_json dependencies are reused for proof code. It
compiles fixtures and golden run/export JSON into its test module, so no
WebAssembly test reads files. Every valid fixture proves run/export byte equality
and import round trips on both hosts. The native manifest test detects an omitted
valid fixture. Golden files are generated explicitly; tests never rewrite them:

```sh
cargo run -p horizon-parity --example generate-golden
cargo fmt --all
```

The parity crate also compiles all W1 unit test bodies with an embedded fixture,
and the W2/W3 unit-reference test bodies against the unchanged committed vectors.
W1's original reference source is unchanged. These same proof bodies execute on
native and WebAssembly using target-specific test attributes. Node.js 24.22.0
runs the module with wasm-bindgen-test-runner 0.2.129, matching locked
wasm-bindgen 0.2.129. See [the testing guide](https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/index.html),
retrieved 2026-10-17. All cumulative commands and tool setup are in
[README](../../README.md#setup) and [AGENTS](../../AGENTS.md#validation).

TypeScript bindings, graphical comparison/export, readable reports, HTTP/agent
access, persistence, accounts, sharing and authenticated/signed exports remain
outside this milestone. Node is only a test runtime. No new top-level entry or
`.cargo/` configuration is introduced. Financial omissions and estimates remain
explicit, including for complete results within the supported model.
