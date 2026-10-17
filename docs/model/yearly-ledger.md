# Yearly ledger — model 0.2.0

Historical W2 contract, retained by `horizon_app::run_pre_tax`. The current
`run` operation includes [federal tax and in-year tax funding](federal-tax.md).

The application operation `run(household, assumptions)` now returns a yearly
ledger at `years[].ledger`, together with W1's annual `indexed_inputs`. Those
indexed inputs are reference amounts, not additional cash flows. Ledger accounts
are an array in input order, each with an `identifier` value; user identifiers
never become JSON property names, so Unicode identifiers remain supported. Successful
runs are estimates with status `partial`: **federal income tax not modeled**
and **contributions not modeled**, plus the applicable omissions below.

Money stays in integer USD cents, with checked arithmetic, exact rational
intermediates and half-away-from-zero cent rounding once per line. Every
ledger monetary value is labeled nominal, with currency, unit, base year and
year. Every monetary line also has a `rule_id`. W1's money, canonical JSON,
hash and age-label conventions carry over.

## Order of calculation

1. Open each account with the previous year's closing balance, or the valuation
   balance in the base year. The base period starts on the valuation date;
   all other periods start on 1 January and include 31 December.
2. Activate wages on `[start_date, end_date)`. Activate pension and Social
   Security on the first of the month after the birth month in the year the
   start age is reached; December births start in January of the following year.
   Split spending at the exact retirement date. Each income line is annual
   amount × exact inflation factor when in today's dollars × active days /
   calendar-year days. Add unrounded phase amounts for the single spending
   line, then round once. Leap years have 366 days.
3. Take required distributions before discretionary withdrawals, per account.
4. Compute spending − income − distributions. Fund a positive gap from eligible
   opening balances; deposit a negative gap as surplus. Record any unfunded
   remainder as shortfall, with no borrowing.
5. Apply growth = opening × rate × period fraction + net flow × rate × period
   fraction / 2, rounded once. Net flow is deposits − withdrawals − distributions.
   Deposits and growth are unavailable for funding the current year's gap.
6. Close each account from its finalized lines. Carry that balance and taxable
   basis into the next year. Both household and account identities reconcile
   exactly in cents. A depleted account may retain half-period growth earned
   before its withdrawal under this declared convention.

Events occur on 1 July, or on the period start when later. A draw is early when
that event date precedes birth plus 59 years and 6 months, clamping a missing
month-end day to the final day of the target month. The displayed age on
31 December is only a label; the event test uses the exact date.

## Funding, basis and limitations

Cash always comes first, with accounts of a type drawn in input order. The
optional household field `withdrawal_order` selects `taxable_first` (default),
`tax_deferred_first`, `roth_before_tax_deferred` or
`proportional_taxable_tax_deferred`. The actual order is recorded for every
year. Before age 59½, all selections use cash → taxable → tax-deferred → Roth.
A tax-deferred draw adds the omission `early-distribution exceptions not modeled`;
an early Roth draw adds `Roth early-withdrawal ordering not modeled`. No early
additional tax is computed in this milestone.

Proportional funding uses each taxable/tax-deferred account's available balance
in input order. Shares are rounded once, and the final account takes the cent
remainder. Hard balance caps and a nonnegative remaining need take precedence
when rounding tiny shares: preceding allocations reserve sufficient capacity
for the remaining accounts. The committed proportional unit calculation also
works for abstract weights; the ledger separately caps the funded amount to
the available total.

A surplus goes to the first taxable account. If none exists, `surplus-taxable`
is created with a `created` label and zero opening balance/basis. If that ID is
already held by a non-taxable account, the run returns
`SURPLUS_ACCOUNT_ID_CONFLICT` rather than overwriting it. The created account
persists in subsequent years. Deposits add to taxable basis. A withdrawal W
from opening value V and basis B removes round(W × B / V); realized gain is
W minus removed basis and may be negative. Growth does not change basis.

`cash_return` and `investment_return` are required annual decimal-fraction
assumptions with source, effective base year and override marker, just like
inflation. No missing rate is silently supplied. Negative returns return
unsupported with `NEGATIVE_RETURN_UNSUPPORTED`. The complete used assumption
register is sorted by identifier and included in its independent hash.

## Required distributions and source data

The committed [Uniform Lifetime Table data](../../packages/engine/src/rmd_table.rs)
contains ages 72–120, with the final divisor 2.0 applying at 120 and over.
Source: [IRS Publication 590-B (2025), Appendix B, Table III](https://www.irs.gov/publications/p590b),
retrieved 2026-10-16. Values are decimal strings parsed as exact fractions.

The model follows [decision 0008](../decisions/0008-ledger-and-required-distribution-conventions.md):
73 for births 1951–1959, 75 from 1960, and due every projection year for older
cohorts. The 1959 age is explicitly a model assumption following the
[2024 proposed regulation](https://www.federalregister.gov/documents/2024/07/19/2024-14543/required-minimum-distributions),
retrieved 2026-10-16. Those runs add `rmd_applicable_age_1959`, value 73,
unit `year_of_age`, effective year 2024 and that source to the used register;
it is not presented as a finalized tax rule or a user override.

Each tax-deferred account's distribution uses previous closing / the table's
age divisor, rounded once. In the base year, opening is an explicitly labeled
estimate of the prior 31 December balance. Distribution output identifies the
table, source, table year 2025 and divisor. Roth accounts never have owner
required distributions. An employer-plan distribution with active wages adds
`still-working distribution exception not modeled` to the omissions.
Historical inputs requiring a distribution below table age 72 are unsupported;
no unavailable divisor is invented. First-year 1 April deferral, inherited
accounts and distribution exceptions are not modeled.

Run metadata names model `horizon-engine-0.2.0`, rule set `us-single-ledger-v2`
and table/rule-set year 2025. Canonical serialization and input/assumption
hashes remain entirely in the pure Rust core. There are no new dependencies.
The existing exact MIT-0 exception for borrow-or-share 0.2.4 is unchanged.

## Schemas and regression checks

[Household schema v2](schemas/household-input.v2.schema.json) is generated from
the Rust input types and adds only the optional `withdrawal_order`. The
[v1 schema](schemas/household-input.v1.schema.json) stays byte-identical and
has a retained v1 Rust schema type/generator. Omitted withdrawal order is
reported as the named default; no order field is inserted into that input's hash.
Regenerate v2 with:

```sh
cargo run -p horizon-app --example household-schema-v2 > docs/model/schemas/household-input.v2.schema.json
```

As with v1, full validation registers the `x-horizon-validation` extension
(value `v2`) or calls `parse_household` after generic structural validation.
Assumptions remain a separate register validated by `run`. Schema drift tests,
all W1 numerical tests and the unchanged W2 reference JSON are retained.
The W1 unsupported-assumption test now uses an actually unsupported identifier,
because `investment_return` is a supported W2 input.

## Fixtures

Run `cargo run -p horizon-cli -- dev-run <name>` from the workspace root.
The command prints the complete ledger as canonical JSON plus a newline.

| Name | Exit | What it exercises |
| --- | --- | --- |
| `A-drawdown` | 0 | Cash-first drawdown through every account type, RMDs and running out |
| `A-drawdown-tax_deferred_first` | 0 | Tax-deferred-first order |
| `A-drawdown-roth_before_tax_deferred` | 0 | Roth-before-tax-deferred order |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | Proportional funding after cash |
| `B-early-retiree` | 0 | Surplus while working, early retirement and early-distribution flags |
| `C-partial-base-year-no-taxable` | 0 | Partial base year, leap-day birth and a created taxable account |
| `D-still-working-rmd-surplus` | 0 | Still-working RMD flag and surplus from distributions |
| `synthetic-working`, `synthetic-retired`, `synthetic-leap` | 0 | W1 households updated with both return assumptions |
| `unsupported-negative-cash-return`, `unsupported-negative-investment-return` | 2 | NEGATIVE_RETURN_UNSUPPORTED |
| `invalid-missing-cash-return`, `invalid-missing-investment-return` | 1 | MISSING_ASSUMPTION |

The fourteen [W1 invalid/unsupported fixtures](engine-foundations.md#fixtures)
retain their error codes and exit statuses. All scenarios are synthetic.
Conservation, nonnegative balances/basis and line-by-line expected amounts and
flags are tested. The CLI suite compares all ten valid fixtures' bytes to the
application operation by both name and path; it also checks every error fixture.

Income tax and tax funding remain W3 work. Contributions, Roth conversions,
market variability and negative returns remain later features. Comparison,
export and the supported CLI remain W4. WebAssembly execution parity,
TypeScript adapters, persistence and user interface are outside this change.
