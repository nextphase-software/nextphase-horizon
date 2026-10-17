# Federal income tax — model 0.3.0

`horizon_app::run(household, assumptions)` returns the funded annual ledger at
`years[].ledger`. Its `federal_tax` contains the breakdown, payment, rounding
settlement, pass count, pass limit, convergence flag and settlement method.
`horizon_app::run_fixture` also honors the fixture envelope's optional
`pass_limit`; the default is 50. `run_with_tax_limit` and the engine equivalent
expose limits 1–50 for reproducible tests. `run_pre_tax` retains the W2 ledger,
metadata, partial status and omissions, without requiring `tax_indexing`.

All calculations use exact rational arithmetic and checked integer USD cents.
Every monetary tax line has currency, dollar basis, base year, projection year,
tax year, rule identifier and rule kind. Law amounts are nominal cents; rule
values also identify units, source URL, retrieval date, tax year and kind.
Kind `a` means published law, including enacted expiration dates. Kind `b`
means an indexed projection of a published amount. No hypothetical policy is
applied. Metadata identifies `horizon-engine-0.3.0`, `us-single-federal-tax-v3`
and base rule-set year 2026. Cargo package versions remain 0.1.0.

## Computation and data

The committed [tax module](../../packages/engine/src/tax.rs) contains 2026
single-filer data from [Rev. Proc. 2025-32](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf),
sections 4.01, 4.03 and 4.14, retrieved 2026-10-17. Progressive ordinary rates
apply at all income levels; this is stated in each breakdown. A filed return
may require the IRS banded Tax Table and can differ from this model.

The sourced `tax_indexing` assumption is required by every taxed run, in annual
decimal-fraction units, effective in the household's valuation year, zero or
greater. Its factor always starts with 2026 law: amount × (1 + rate)^(Y − 2026).
For years after 2026 the result is floored exactly to $50, without an
intermediate cent rounding. Published 2026 amounts are retained as published.
Brackets, standard deduction, additional age-65 deduction and both capital-gain
thresholds are indexed. Statutory rates and the other limits are held at their
published amounts. Years before 2026 return `TAX_YEAR_UNSUPPORTED`.

Ordinary income sums wages, pensions, all tax-deferred distributions and cash
account growth as interest. Taxable growth stays unrealized until withdrawal.
Realized taxable-account gains are long-term. Loss carry entering the year is
subtracted from realized gains; net losses offset up to $3,000 of other income,
and the excess carries to the following year. Each trial uses the same incoming
carry; only the accepted year's outgoing carry advances.

Taxable Social Security follows [26 USC 86](https://www.law.cornell.edu/uscode/text/26/86):
provisional income includes half the benefits, with the fixed $25,000/$34,000
single-filer thresholds and 50%/85% tiers. The line rounds once after the exact
formula and cap. AGI sums finalized ordinary income, net capital result and
taxable Social Security. The standard deduction includes the additional amount
if birth is on or before 1 January of tax year minus 64, following the
[Form 1040 age rule](https://www.irs.gov/instructions/i1040gi).
The [senior deduction](https://www.law.cornell.edu/uscode/text/26/151) is
$6,000 less 6% of AGI over $75,000, bounded below at zero, for eligible ages
through 2028; it is zero from 2029. Sources retrieved 2026-10-17.

Taxable income is AGI less both deductions, bounded below at zero. Net positive
capital gains, capped at taxable income, stack above the ordinary portion at
0%, 15% and 20%. Ordinary tax and capital-gains tax each round once, then the
10% tax on taxable early tax-deferred distributions rounds once. Their finalized
sum is total tax computed. Early dates and withdrawal order retain W2's exact
event-date test; exceptions remain partial. The
[capital-loss limit](https://www.law.cornell.edu/uscode/text/26/1211) and
[early-distribution rule](https://www.irs.gov/taxtopics/tc557) were retrieved
2026-10-17.

## Funding and reconciliation

Each year begins with a requested tax payment of zero. A pass clones that
year's opening ledger and incoming loss carry, funds spending plus the requested
tax through the normal withdrawal order, then computes tax on its resulting
income, realized gains and cash interest. Trial growth, surplus accounts,
balances and basis never accumulate between passes. Only the accepted pass
advances the ledger. Required distributions stay based on opening balances.

If computed tax equals the requested payment, settlement is `exact`. A repeated
requested payment identifies a rounding cycle; its highest requested payment
is funded in a final, counted pass, and paid less computed is the separate
`rounding_settlement`. Scenario E settles in seven passes with one cent of
settlement. The limit includes that final pass. Otherwise the last attempted
ledger is retained with `settled_by: null`, `converged: false` and the partial
flag `tax_funding_did_not_converge`.

Every pass reconciles income + distributions + withdrawals + shortfall =
spending + tax paid + surplus. Insufficient savings increase shortfall without
creating borrowing. Every settled year also reconciles tax paid = tax computed
+ rounding settlement. In an unsettled year the requested payment and newly
computed liability can differ; the settlement line stays zero, as specified by
the one-pass reference scenario. That difference is unresolved tax funding,
not a rounding settlement. Balances and taxable basis remain nonnegative.

## Status and scope

A taxed run is `complete` unless any partial condition applies: early deferred
or Roth withdrawals, the still-working required-distribution exception, active
wages with contributions not modeled, unconverged tax funding, or modified AGI
above $200,000 with net investment income tax not modeled. Active wages means
at least one activated day, including zero-rate wage lines. Contributions are
listed once in run omissions in that case. Other partial conditions appear as
annual flags and run omissions. An after-1-January base period gets the estimate
flag `base_year_tax_covers_projected_period_only`; this alone is not partial.
A required-distribution opening-balance estimate is retained from W2.

Always listed without changing status: state tax, alternative minimum tax,
taxable-account dividends and interest, itemized deductions and credits.
Complete describes coverage of this model's supported rules and inputs, not a
filed return, guaranteed future law or adequate savings. A fully computed
shortfall does not itself mean an incomplete calculation.

Contributions, early-distribution exceptions, nondeductible IRA basis, Roth
conversions, Medicare income-related surcharges and premium credits remain
outside this milestone. Taxes are funded within the year, without following-April
payment timing. Comparison, export, the supported CLI and WebAssembly execution
parity remain W4. This change adds no dependencies or interface, server,
persistence or deployment. The existing exact MIT-0 exception remains limited
to borrow-or-share 0.2.4.

## Fixtures

Run `cargo run -p horizon-cli -- dev-run <name>` from the workspace root.
Both fixture names and JSON file paths work. Successful complete and partial
results exit 0 as canonical JSON plus one newline. The CLI applies no tax rules;
it calls the application fixture operation.

| Fixture | Exit | Coverage |
| --- | --- | --- |
| `A-drawdown` | 0 | Tax funding, exhaustion and required distributions |
| `A-drawdown-tax_deferred_first` | 0 | Deferred-first order |
| `A-drawdown-roth_before_tax_deferred` | 0 | Roth-before-deferred order |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | Proportional order |
| `A-drawdown-pass-limit-1` | 0 | Deliberate incomplete tax funding, limit 1 |
| `B-early-retiree` | 0 | Wages, early retirement and additional tax |
| `C-partial-base-year-no-taxable` | 0 | Base-period estimate and created account |
| `D-still-working-rmd-surplus` | 0 | Wages, required distributions and surplus |
| `E-senior-2028-loss-carry` | 0 | Rounding cycle, loss carry and deduction expiration |
| `synthetic-working`, `synthetic-retired`, `synthetic-leap` | 0 | Earlier households with required tax indexing |
| `invalid-missing-tax-indexing` | 1 | MISSING_ASSUMPTION |
| `invalid-negative-tax-indexing` | 1 | INVALID_TAX_INDEXING |
| `invalid-tax-pass-limit` | 1 | INVALID_TAX_PASS_LIMIT |
| `unsupported-tax-year` | 2 | TAX_YEAR_UNSUPPORTED |

The 18 earlier invalid/unsupported fixtures retain their names, codes and exit
statuses, listed in [W2](yearly-ledger.md#fixtures) and
[W1](engine-foundations.md#fixtures). There are 34 fixtures total. Every fixture
contains sourced tax indexing except `invalid-missing-tax-indexing`, whose
purpose is to omit it. Earlier reference JSON files and W1's reference test
source are unchanged. W2 tests invoke the historical operation with tax indexing
removed from their fixture view; all expected values are unchanged. The W3
suite checks all 40 tax unit cases, published data, nine scenarios / 47 years,
status, flags, pass counts, metadata, exact conservation and CLI parity.
The full cumulative validation sequence is in [README](../../README.md#setup)
and [AGENTS](../../AGENTS.md#validation).
