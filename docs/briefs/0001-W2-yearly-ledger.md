BRIEF VERSION: 0001-W2 v2 (2026-10-16)

# 0001-W2 — Yearly ledger and funding order

## Outcome

For a supported single filer, the engine turns W1's projection skeleton into a year-by-year ledger. For each year it shows:
- what came in and what went out;
- which required distributions were taken;
- which account covered any gap, and under which rule;
- where a surplus went;
- where money ran out. When nothing is left, it records a shortfall and never invents borrowing.

Cash is conserved exactly in every year, for every account and for the household. Taxes are not yet computed, so every run reports **partial: federal income tax not modeled**.

## Deliverables

1. **The ledger,** following decisions 0003, 0004, 0006 and 0008. Each year carries:
   - its period: the days from the period start to 31 December;
   - its event date;
   - whether withdrawals fall before 59½;
   - the income lines by source and the spending line.
   Each account carries, for that year:
   - opening balance;
   - required distribution;
   - withdrawal, with the rule that caused it;
   - deposit;
   - growth;
   - closing balance;
   - for taxable accounts, also the basis removed, the realized gain and the closing basis.
   The household carries total income, total distributions, total withdrawals, the surplus deposit and the shortfall. Every monetary value keeps W1's labels: unit, currency, dollar basis (nominal), base year and year.
2. **Flow activation by days** (decision 0008, item 7):
   - wages from the start date, inclusive, to the end date, exclusive;
   - spending before and after the retirement date;
   - Social Security and the pension from the first day of the month after the birth month, in the year the person reaches the start age.
   Each line is the amount × W1's index factor × (active days ÷ days in the year), computed exactly and rounded once. In the base year, the period starts on the valuation date.
3. **Required minimum distributions** (decision 0008, items 1–5):
   - **applicable age:** 73 for people born 1951–1959, with 1959 following the 2024 proposed regulation and recorded on the run as the assumption `rmd_applicable_age_1959`; 75 for people born 1960 or later; due in every year for people born before 1951;
   - **due:** in every year in which age on 31 December is at least the applicable age;
   - **amount:** prior year-end balance ÷ Uniform Lifetime Table divisor, rounded once. In the base year, the opening balance is used and labeled an estimate;
   - **Roth:** never;
   - **still working:** a distribution from an employer plan in a year with active wages marks the run partial ("still-working distribution exception not modeled").
   The Uniform Lifetime Table is committed as data with its source: IRS Publication 590-B (2025), Appendix B, Table III.
4. **Withdrawal order** (decisions 0006, 0004 and 0008, item 12):
   - cash always first;
   - then the household's `withdrawal_order`: `taxable_first` (the default), `tax_deferred_first`, `roth_before_tax_deferred` or `proportional_taxable_tax_deferred`;
   - within a type, accounts in input order;
   - each account can supply at most its opening balance less its distribution;
   - **before 59½**, the order is cash, taxable, tax-deferred, Roth, whatever was chosen. A tax-deferred draw marks the run partial ("early-distribution exceptions not modeled"), and so does a Roth draw ("Roth early-withdrawal ordering not modeled");
   - the order actually used is named in the output.
5. **Surplus** (decision 0006, item 1, and decision 0008, item 12): a surplus is deposited to the first taxable account in input order, or to a created account `surplus-taxable`, labeled as created.
6. **Shortfall:** whatever no eligible account can cover is recorded as the shortfall. No balance is ever negative, and no borrowing is ever created.
7. **Growth** (decision 0008, item 9): opening × r × f + net flow × r × f ÷ 2, computed exactly and rounded once.
   - The rate r is `investment_return` for taxable, tax-deferred and Roth accounts, and `cash_return` for cash.
   - f is the period's fraction of the year.
   - Both assumptions are required, with no silent default, and must be zero or greater. A negative return is **unsupported**, with its own code.
8. **Average-cost basis** (decision 0008, item 13):
   - a deposit adds to the basis;
   - a withdrawal W from opening value V with basis B removes W × B ÷ V, rounded once;
   - the realized gain is W minus the basis removed, and can be negative.
9. **Household input schema v2:** v1 plus the optional field `withdrawal_order`. It is published at `docs/model/schemas/household-input.v2.schema.json`, generated from the Rust types; the v1 file stays unchanged. Existing fixtures gain the two return assumptions.
10. **Run status and omissions:** every run is **partial**, with omissions "federal income tax not modeled" and "contributions not modeled", plus every flag from items 3 and 4. W1's omissions now covered by this ledger are removed: withdrawals, surplus, required distributions, shortfalls, investment growth, flow activation and timing.
11. **Fixtures:** every scenario in the reference values file, under the scenario's name, plus W1's three synthetic households updated with the new assumptions. `horizon dev-run <name>` prints the ledger.

## Done when

1. **Cash is conserved** in every year of every fixture and test, exactly:
   - for each account: opening + deposit − withdrawal − distribution + growth = closing;
   - for the household: income + distributions + withdrawals + shortfall = spending + surplus deposit.
2. **No closing balance or basis is negative** in any fixture or test.
3. **Every unit value** in `docs/briefs/0001-W2-reference-values.json` matches exactly:
   - applicable age;
   - first distribution year, including birthdays on 1 January and 31 December;
   - distribution amounts, including the divisor for age 120 and over;
   - the 59½ date, including month-end and 29 February births;
   - the before-59½ test on the event date;
   - benefit start dates;
   - day activation;
   - growth;
   - average-cost basis;
   - proportional split.
4. **Every scenario** in that file produces exactly the expected ledger, year by year, line by line, flags included. Between them the scenarios cover:
   - a surplus year;
   - a year drawing each account type in order;
   - the first distribution year;
   - an excess distribution deposited as surplus;
   - the still-working flag;
   - a draw before 59½;
   - the year money runs out;
   - a partial base year;
   - a created surplus account;
   - each named withdrawal order.
5. **Changing the withdrawal order** changes only withdrawal lines, distributions, basis and gain lines, and the balances that follow from them. Income and spending lines are unchanged; the order scenarios prove this.
6. **Every line names its rule:** each withdrawal, distribution and surplus line names the rule identifier that produced it, and each distribution cites its table and year.
7. **Run status:** the status is **partial**, with the omissions in deliverable 10.
8. **W1 still holds:** all of 0001-W1's tests and reference values still pass. The v2 schema validates every fixture, and its drift test passes.

## Read first

- `DESIGN.md` and `AGENTS.md`.
- The 0001-W1 code, its model notes in `docs/model/`, and its fixtures.
- Decision records:
  - `docs/decisions/0003-*` (money and time);
  - `docs/decisions/0004-*` (withdrawals before 59½);
  - `docs/decisions/0006-*` (surplus and withdrawal order);
  - `docs/decisions/0007-*` (stack);
  - `docs/decisions/0008-*` (ledger and required-distribution conventions).
- Public references:
  - IRS Publication 590-B (2025), Appendix B, Table III: https://www.irs.gov/publications/p590b, retrieved 2026-10-16.
  - 26 CFR 1.401(a)(9)-2(b)(2), the applicable age: https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.401(a)(9)-2, retrieved 2026-10-16.
  - Proposed regulation, Federal Register 2024-14543 (19 July 2024), on the 1959 cohort: https://www.federalregister.gov/documents/2024/07/19/2024-14543/required-minimum-distributions, retrieved 2026-10-16.
  - IRS RMD FAQs: https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs, retrieved 2026-10-16.

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

Same toolchain and license checker as 0001-W1, with no new dependency. Any new crate requires escalation. Run, in order:

1. `cargo test -p horizon-engine ledger` — conservation and ledger tests; tests live in a module named `ledger`.
2. `cargo test -p horizon-app --test reference_values_w2` — every unit value and scenario in the reference values file (`packages/app/tests/reference_values_w2.rs`).
3. `cargo test -p horizon-app --test reference_values` — 0001-W1's values, unchanged.
4. `cargo test --workspace`
5. `cargo clippy --workspace --all-targets -- -D warnings`
6. `cargo fmt --all --check`
7. `cargo test --workspace --release`
8. `cargo build --workspace --release`
9. `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown`
10. `cargo deny check licenses`
11. `cargo run -p horizon-cli -- dev-run <name>` for each fixture, recording each exit status.

## Exclusions

- Income tax, the additional tax on early distributions and tax funding — 0001-W3.
- Contributions — a later feature; listed as an omission.
- The first-year 1 April deferral, inherited accounts and distribution exceptions — later features.
- Roth conversions — a later feature.
- Market variability and negative returns — a later feature; negative returns are unsupported.
- Scenario comparison, export and the supported command line — 0001-W4.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.


### 2026-10-16 — implementation complete; independent review pending

- Brief: **0001-W2 v2**. Implemented in the public workspace only.
- Branch: `codex/0001-W2-yearly-ledger`.
- Worktree: `.worktrees/codex-0001-W2`, created from `main` at
  `f893ebb9c84593cdd7e9e7730cb1b3a84e697a1d`.
- **Source/test revision:** `f678301e2fd56e3970a28cbc786a7cfa2439adef`.
  The full final command sequence below ran against that committed revision
  with a clean worktree. This later record changes only this brief. The final
  branch tip is reported separately; no independent review, merge or push is
  claimed by this implementation record.

#### Delivered behavior and contracts

The engine now returns day-activated yearly ledgers at `years[].ledger` through
the existing application `run` operation and `horizon dev-run`. Each ledger
contains its period/event date, exact early-withdrawal date test, income and
spending, account opening/distribution/withdrawal/deposit/growth/closing lines,
taxable basis and realized gains, household totals, surplus, shortfall, flags
and the order actually applied. Every monetary line has unit/currency/basis,
base year/year and a rule identifier. Distributions carry the table source,
2025 table year, divisor and base-year estimate marker.

W1 annual indexed amounts remain separate reference values, not additional
cash flows. Ledger accounts are an array in input order with `identifier`
values, preserving Unicode IDs without making them canonical JSON member names.
The seven committed scenarios match every expected line and flag exactly after
extracting finalized cents from the labeled output. The reference JSON was not
edited to fit the implementation.

All four requested withdrawal orders draw cash first and observe the exact
pre-59½ override. A surplus goes to the first taxable account or to the labeled,
persistent `surplus-taxable` account. Rounding small proportional shares respects
hard balance caps and preserves the remaining accounts' capacity. A zero-balance
account in a due distribution year retains the applicable rule/table source;
the still-working flag requires an actual positive employer-plan distribution.
No account supplies growth or deposits to fund the same year's need, and no
negative balance, negative basis or borrowing is invented.

The current model identifies itself as `horizon-engine-0.2.0`, rule set
`us-single-ledger-v2`, table/rule-set year 2025. Every run remains `partial` with
`federal income tax not modeled` and `contributions not modeled`, plus applicable
early/still-working flags and existing state-tax/healthcare omissions. The
1959 cohort records the sourced proposed-rule assumption
`rmd_applicable_age_1959` in its sorted used register and assumption hash.

Schema v2 is generated from the Rust types and adds optional
`withdrawal_order`; the retained v1 generator still produces the unchanged v1
schema. The v2 extension uses `x-horizon-validation: "v2"` with
`parse_household` for full cross-field validation, as documented in
[the model/contract notes](../model/yearly-ledger.md).
W1's numerical reference test file remains byte-identical. Its existing
unsupported-assumption test uses an actually unsupported identifier now that
investment returns are supported. Existing household fixtures gain both
explicit return assumptions. Seven scenario fixtures and four return-error
fixtures are added. The public README and agent instructions document the
current W2 commands; [stable error codes](../model/error-codes.md) cover the
new unsupported/error cases.

The sourced Uniform Lifetime Table is committed as exact decimal-string data in
[the Rust data module](../../packages/engine/src/rmd_table.rs). Its values were
checked against [IRS Publication 590-B (2025), Appendix B, Table III](https://www.irs.gov/publications/p590b),
retrieved 2026-10-16. The 1959 assumption cites the accepted decision's
[2024 proposed regulation](https://www.federalregister.gov/documents/2024/07/19/2024-14543/required-minimum-distributions);
it is not represented as a finalized rule.

#### Final validation

Rust 1.99.1, edition 2024 and cargo-deny 0.20.2 are unchanged from W1.
All commands below ran in the brief's order against the source/test revision
above. No required gate was skipped. The final workspace count is 33 tests
in each profile, with zero failures and zero ignored tests.

| Command | Exit | Observed result |
| --- | --- | --- |
| `cargo test -p horizon-engine ledger` | 0 | 2 tests passed |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 tests passed |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 tests passed |
| `cargo test --workspace` | 0 | 33 tests passed |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | No warnings or errors; core float/unchecked-arithmetic and engine host-facility checks active |
| `cargo fmt --all --check` | 0 | Formatting matches |
| `cargo test --workspace --release` | 0 | 33 tests passed |
| `cargo build --workspace --release` | 0 | All three crates built |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | Engine and application compiled for WebAssembly |
| `cargo deny check licenses` | 0 | All dependency licenses accepted with existing exact exception; two unused-allowance warnings (BSD-3-Clause and ISC) |

The 11 W2 reference tests cover every supplied unit/scenario, exact household
and account conservation, nonnegative balances/basis, unchanged income/spending
across orders, source/rule labels, schema drift and fixture validation, missing
and negative returns, month-end/leap dates, late valuation events, zero-balance
due years, the 1959 source assumption, early overrides/flags, tiny proportional
shares, input order, ID collisions, output range and Unicode identifiers.
All seven W1 reference tests and the existing validation/canonicalization/purity
tests pass. The CLI tests compare all ten valid fixtures' canonical bytes with
serialized `run` results by both name and path, including from another working
directory, and test all eighteen invalid/unsupported fixtures and usage errors.

Individual development commands were run for every fixture after the other
validation gates; each result is canonical JSON followed by one newline:

| Command | Exit | Result / error code |
| --- | --- | --- |
| `cargo run -p horizon-cli -- dev-run A-drawdown` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run A-drawdown-proportional_taxable_tax_deferred` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run A-drawdown-roth_before_tax_deferred` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run A-drawdown-tax_deferred_first` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run B-early-retiree` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run C-partial-base-year-no-taxable` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run D-still-working-rmd-surplus` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run invalid-account-type` | 1 | `UNKNOWN_ACCOUNT_TYPE` |
| `cargo run -p horizon-cli -- dev-run invalid-cost-basis` | 1 | `ACCOUNT_FIELDS` |
| `cargo run -p horizon-cli -- dev-run invalid-date` | 1 | `INVALID_DATE` |
| `cargo run -p horizon-cli -- dev-run invalid-end-before-start` | 1 | `END_BEFORE_START` |
| `cargo run -p horizon-cli -- dev-run invalid-missing-assumption` | 1 | `MISSING_ASSUMPTION` |
| `cargo run -p horizon-cli -- dev-run invalid-missing-cash-return` | 1 | `MISSING_ASSUMPTION` |
| `cargo run -p horizon-cli -- dev-run invalid-missing-field` | 1 | `MISSING_FIELD` |
| `cargo run -p horizon-cli -- dev-run invalid-missing-investment-return` | 1 | `MISSING_ASSUMPTION` |
| `cargo run -p horizon-cli -- dev-run invalid-negative-balance` | 1 | `NEGATIVE_BALANCE` |
| `cargo run -p horizon-cli -- dev-run invalid-output-range` | 1 | `MONEY_OUTPUT_RANGE` |
| `cargo run -p horizon-cli -- dev-run invalid-owner` | 1 | `INVALID_OWNER` |
| `cargo run -p horizon-cli -- dev-run invalid-plan-end-age` | 1 | `PLAN_END_AGE_REACHED` |
| `cargo run -p horizon-cli -- dev-run invalid-rate` | 1 | `INVALID_RATE` |
| `cargo run -p horizon-cli -- dev-run synthetic-leap` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run synthetic-retired` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run synthetic-working` | 0 | Partial yearly ledger |
| `cargo run -p horizon-cli -- dev-run two-person` | 2 | `MULTIPLE_PERSONS_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run unsupported-healthcare` | 2 | `FEATURE_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run unsupported-negative-cash-return` | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run unsupported-negative-investment-return` | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `cargo run -p horizon-cli -- dev-run unsupported-state-tax` | 2 | `FEATURE_UNSUPPORTED` |

Additional observations: `git diff --check` and local documentation-link checks
passed. Both implementation commits passed the installed hooks. An automated
raw-ancestry check passed for the initial source commit, and installed-hook
verification passed; the final handoff also undergoes the automated boundary
check. These are implemented checks only, not an independent review verdict.
A separate Unicode-ID CLI reproduction now exits 0 and retains the original ID.

#### Dependency and preservation evidence

**No dependency was added or changed.** `Cargo.lock`, workspace/crate manifests,
`rust-toolchain.toml` and `deny.toml` are unchanged. The seven existing external
direct dependencies remain serde 1.0.229 (MIT OR Apache-2.0), serde_json 1.0.154
(MIT OR Apache-2.0), schemars 1.2.3 (MIT), num-bigint 0.5.1 (MIT OR Apache-2.0),
num-traits 0.2.19 (MIT OR Apache-2.0), sha2 0.11.1 (MIT OR Apache-2.0) and test-only
jsonschema 0.58.6 (MIT, default features off). The existing MIT-0 exception
remains restricted to borrow-or-share 0.2.4. All 92 resolved external package
versions/licenses remain those in [the W1 inventory](../model/dependencies.md).

The following SHA-256 values were checked against the merge-base files:

| Preserved file | SHA-256 |
| --- | --- |
| `docs/briefs/0001-W2-reference-values.json` | `251014c80b1e26e428ee8e622cc6fb9795b7340cd4a6dab057dacd620d59292c` |
| `docs/model/schemas/household-input.v1.schema.json` | `22aa89ccc48931962a712a958742de62812241aaa150746066c5d0e30212d9e6` |
| `packages/app/tests/reference_values.rs` | `36b073a3a27292892c77144b8d11b8b2cc783110fe3df465a4595c7c4f533953` |
| `Cargo.lock` | `d5eda111069a1ea3ba63a57330b2c514d598d2248b37d7d14c2a16544dd13f3c` |

#### Exclusions and remaining gates

- Income tax, early-distribution additional tax and tax funding: deferred to
  0001-W3. The current ledger is explicitly partial.
- Contributions: deferred and listed as an omission; working savings appear as surplus.
- First-year 1 April deferral, inherited accounts and distribution exceptions:
  deferred. Base-year prior-balance estimates and still-working omissions are labeled.
- Roth conversions: deferred; no conversion operation or tax is approximated.
- Market variability and negative returns: deferred; negative returns return
  unsupported with their own code.
- Comparison, export and the supported CLI: deferred to 0001-W4; the command
  remains the development adapter.
- WebAssembly execution parity remains W4; compilation passes here. No TypeScript
  binding, persistence, graphical UI or hosted route/document/export surface is
  added. There is no new tenant/role authorization surface to exercise.
- Historical inputs requiring a distribution below age 72 return unsupported
  because the committed table has no such divisor; no missing rule is invented.
- Independent review, operator merge, merged-result validation and publication
  remain pending. This handoff does not mark the milestone Done.
