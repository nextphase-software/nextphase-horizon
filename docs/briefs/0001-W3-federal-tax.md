BRIEF VERSION: 0001-W3 v3 (2026-10-16)

# 0001-W3 — Federal income tax

## Outcome

Each projection year now includes federal income tax for a single filer, paid inside the year through the withdrawal order. Every tax line cites its rule, tax year and kind: published law, or a projection of it. A retired household whose situation is fully covered now reports **complete**. Anything not modeled is listed, and the result is partial where it matters.

## Deliverables

1. **Federal income tax for a single filer, each year** (decision 0009, items 1–9):
   - **Ordinary income:** wages, the pension, every tax-deferred distribution and withdrawal, and the cash account's growth as interest.
   - **Taxable Social Security** under 26 USC 86, with the $25,000 and $34,000 amounts.
   - **Capital gains:** W2's realized gains, all long-term. A net loss offsets up to $3,000 a year, and the rest carries forward.
   - **Deductions:**
     - the standard deduction, plus the additional amount when 65 by year end, using the IRS rule (born on or before 1 January of the year minus 64);
     - the senior deduction, $6,000 reduced by 6% of AGI above $75,000, in tax years through 2028 only.
   - **Tax:** ordinary brackets applied progressively; capital gains stacked at 0%, 15% and 20%; the additional 10% on tax-deferred withdrawals before 59½. Each tax line is rounded once.
   - **2026 law** (Rev. Proc. 2025-32) is committed as data, with its source.
   - **Later years:** the indexed amounts (bracket thresholds, standard deduction, additional 65 amount, both capital-gains thresholds) are the 2026 amount × (1 + `tax_indexing`)^(Y − 2026), rounded down to a multiple of $50.
   - **Not indexed:** rates, the Social Security amounts, $6,000, $75,000, $3,000 and 10%.
   - **Tax years before 2026** are unsupported, with their own code.
2. **`tax_indexing`** is a required assumption: a decimal string, zero or greater, with a source. It is absent from the W2 inputs and present in every W3 fixture.
3. **Tax paid inside the year** (decision 0009, item 10). Tax is an outflow funded through the withdrawal order.
   - Each year repeats from zero tax until a pass computes exactly the tax it paid.
   - If passes cycle through cent rounding, the year pays the highest amount in the cycle and shows a **rounding settlement** line (paid − computed).
   - Otherwise, after 50 passes, the year is partial: "tax funding did not converge".
   - The output records the pass count, how the year settled, and the limit.
   - The engine exposes the pass limit so tests can set it, and the reference file includes a run at limit 1.
   - Tax the household cannot pay becomes part of the shortfall.
4. **A tax breakdown per year:** ordinary income, Social Security, taxable Social Security, net capital result, loss carried out, AGI, standard deduction, senior deduction, taxable income, its ordinary and preferential parts, ordinary tax, capital-gains tax, early-distribution tax, total tax computed, tax paid and rounding settlement. Also, the rule values used, each with source URL, tax year and kind (a or b).
5. **Status** (decision 0009, items 11–12):
   - **complete** unless a partial flag applies;
   - **partial flags:** W2's flags; contributions not modeled, only when wages are active in some year; tax funding did not converge; modified AGI above $200,000 (the net investment income tax is not modeled);
   - **base year:** a base year starting after 1 January carries the estimate flag "base-year tax covers the projected period only";
   - **always listed, without changing the status:** state tax, the alternative minimum tax, taxable-account dividends and interest, itemized deductions and credits.
6. **The W2 ledger stays reproducible:** the engine's ledger with no tax outflow still reproduces `docs/briefs/0001-W2-reference-values.json` exactly. W2's reference tests may change only how they call the engine, never their expected values.
7. **Fixtures:** every scenario in `docs/briefs/0001-W3-reference-values.json`, under the scenario's name. Existing fixtures gain `tax_indexing`. `horizon dev-run <name>` prints the ledger with tax.
8. **Documented commands:** `AGENTS.md` and `README.md` list the full, cumulative set of validation commands for 0001-W1 to 0001-W3, not only this milestone's.

## Done when

1. **Every unit value** in `docs/briefs/0001-W3-reference-values.json` matches exactly:
   - ordinary tax at each 2026 bracket boundary and one cent above it;
   - projected law for 2027, 2030 and 2040;
   - the age-65 test, including 1 January and 2 January births;
   - taxable Social Security at zero, the 50% tier, the 85% tier and the cap;
   - twelve full tax-year cases, covering:
     - the standard deduction with and without the age-65 amount;
     - the senior deduction full, partly phased out, fully phased out, and absent in 2029;
     - capital gains in the 0%, 15% and 20% bands;
     - a loss limited to $3,000 with a carryforward, then used;
     - an early distribution;
     - a projected-law year.
2. **Every scenario** in that file matches year by year and line by line, flags and status included. Scenario A at pass limit 1 is partial.
3. **The senior deduction** applies in 2028 and not in 2029 (scenario E and the unit cases).
4. **Conservation:** every year satisfies income + distributions + withdrawals + shortfall = spending + tax paid + surplus, and tax paid = tax computed + rounding settlement. No balance or basis is negative.
5. **Earlier milestones hold:**
   - W2's reference values still pass through the pre-tax ledger;
   - W1's reference test file is unchanged and passes;
   - both reference JSON files are unchanged.
6. **Every tax line** names its rule identifier and tax year, and every rule value names its source and kind.
7. **Status:** fully supported retired scenarios report **complete**, and the others report **partial** with their flags.

## Reference values

These were derived independently with exact rational arithmetic. The key cases were checked by hand against the Rev. Proc. 2025-32 rate schedule and the statute text. The 2026 cases were also cross-checked against an independent open-source tax calculator: 54 of 56 comparisons matched to the cent. Both differences were resolved against the primary sources: that calculator adds the alternative minimum tax, which this brief lists as an omission, and it lacks the senior deduction's 2028 end date. Commit the values exactly as given. If a value seems wrong, escalate; do not change it. The implementation needs no external calculator.

## Read first

- `DESIGN.md` and `AGENTS.md`.
- The 0001-W1 and 0001-W2 code, `docs/model/`, and both earlier reference files.
- Decision records:
  - `docs/decisions/0003-*` (money and time);
  - `docs/decisions/0004-*` (withdrawals before 59½);
  - `docs/decisions/0005-*` (tax rule contract);
  - `docs/decisions/0006-*` (withdrawal order);
  - `docs/decisions/0007-*` (stack);
  - `docs/decisions/0008-*` (ledger), including its amendment;
  - `docs/decisions/0009-*` (federal tax computation).
- Public references, all retrieved 2026-10-16:
  - Rev. Proc. 2025-32: https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
  - 26 USC 1: https://www.law.cornell.edu/uscode/text/26/1 (rates and rounding)
  - 26 USC 63: https://www.law.cornell.edu/uscode/text/26/63 (standard deduction)
  - 26 USC 86: https://www.law.cornell.edu/uscode/text/26/86 (Social Security)
  - 26 USC 151(d)(5)(C): https://www.law.cornell.edu/uscode/text/26/151 (senior deduction)
  - 26 USC 1211(b): https://www.law.cornell.edu/uscode/text/26/1211 (capital loss limit)
  - IRS Form 1040 instructions (2025): https://www.irs.gov/instructions/i1040gi (the age-65 rule)
  - IRS Topics 557 and 558: https://www.irs.gov/taxtopics/tc557, https://www.irs.gov/taxtopics/tc558 (early distributions)

## Guardrails

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.

## Validation

Same toolchain and license checker, with no new dependency; any new crate requires escalation. Run, in order:

1. `cargo test -p horizon-engine tax` — tax unit tests; tests live in a module named `tax`.
2. `cargo test -p horizon-app --test reference_values_w3` — every unit value and scenario (`packages/app/tests/reference_values_w3.rs`).
3. `cargo test -p horizon-app --test reference_values_w2` — W2's values through the pre-tax ledger.
4. `cargo test -p horizon-app --test reference_values` — W1's values, unchanged.
5. `cargo test --workspace`
6. `cargo clippy --workspace --all-targets -- -D warnings`
7. `cargo fmt --all --check`
8. `cargo test --workspace --release`
9. `cargo build --workspace --release`
10. `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown`
11. `cargo deny check licenses`
12. `cargo run -p horizon-cli -- dev-run <name>` for each fixture, recording each exit status.

## Exclusions

- State and local income tax — a later feature; listed as an omission.
- The alternative minimum tax, itemized deductions and credits — listed as omissions. The net investment income tax is partial above $200,000 of modified AGI.
- Taxable-account dividends and interest — growth is treated as unrealized until withdrawn; listed as an omission.
- Exceptions to the additional tax on early distributions — a later feature (0004).
- Nondeductible IRA basis and Roth conversions — later features.
- Medicare income-related surcharges and premium credits — later features.
- Tax paid the following year (April filing) — not modeled; tax is paid in the year it arises.
- Scenario comparison, export and the supported command line — 0001-W4.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, new dependencies with exact versions and licenses, and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.


### 2026-10-17 — implementation complete; independent review pending

- Brief: **0001-W3 v3**.
- Branch: `codex/0001-W3-federal-tax`.
- Worktree: `.worktrees/codex-0001-W3`, created from committed `main` at
  `dc8d3137f155bc7b2ae5eed58e6b6f9aaebfad3c`.
- **Source/test revision:** `cc904263f651ba6b8dde903a601ec031b79e40dc`.
  The following final validation sequence ran against that committed revision
  with a clean worktree before and after. This later record changes only this
  brief. The final branch tip is reported separately at handoff; no independent
  review, merge or push is claimed here.

#### Delivered behavior and contracts

The pure Rust engine computes single-filer ordinary and capital-gains tax,
taxable Social Security, loss carry, the standard/additional/senior deductions,
and the early-distribution tax. Published 2026 law and its sources are committed
in `packages/engine/src/tax.rs`. Later indexed amounts use the required sourced
`tax_indexing` assumption and exact $50 flooring. Enacted senior expiration
applies in 2029. Tax lines identify their rule, units, dollar basis, tax year
and kind; rule values include source and retrieval date.

Each year funds tax through the withdrawal order using fresh trial copies of
its opening ledger. Exact settlement, the highest amount in a cent-rounding
cycle, and the pass-limit partial path are explicit. The final settlement
calculation counts as a pass. The application exposes the limit (1–50, default
50), and the development fixture envelope accepts optional `pass_limit`.
The CLI delegates to the application fixture operation. The retained pre-tax
operation reproduces W2 without any tax outflow.

All 40 committed tax unit cases and published rule data match. All nine
scenarios match every expected line, flag, status and pass count across 47
years. Scenario E's first year settles after seven passes with a one-cent
rounding line; the senior deduction disappears in 2029. Scenario A with limit
1 remains partial where tax funding is unresolved. Household and account
conservation and nonnegative balances/basis pass; settled years also reconcile
paid = computed + rounding settlement. Unsettled years retain the last payment
and a zero rounding line, as required by that reference scenario; their computed
liability can differ and is explicitly marked unresolved.

Supported retired cases report complete. Active wages, applicable W2 partial
flags, unconverged funding and modified AGI above $200,000 make runs partial.
After-1-January base periods carry the projected-period tax estimate flag.
The always-listed omissions do not themselves change status.

The W1 reference test source, W2 and W3 reference JSON, both household schemas,
Cargo.lock and dependency/license policy are unchanged. W2 test edits only
select the historical call and remove tax indexing from their fixture view;
no expected value changed. All 28 earlier fixtures gained tax indexing; six
fixtures were added, including deliberate invalid/missing-input cases.
Full cumulative commands are in README and AGENTS; model details and the full
fixture catalog are in `docs/model/federal-tax.md`.

#### Final validation

Pinned Rust **1.99.1**, cargo-deny **0.20.2**. All commands below exited 0.
Workspace tests: **39 passed** in debug and **39 passed** in release.

| Command | Exit | Observed result |
| --- | --- | --- |
| `cargo test -p horizon-engine tax` | 0 | 2 tests passed |
| `cargo test -p horizon-app --test reference_values_w3` | 0 | 4 tests passed |
| `cargo test -p horizon-app --test reference_values_w2` | 0 | 11 tests passed |
| `cargo test -p horizon-app --test reference_values` | 0 | 7 tests passed |
| `cargo test --workspace` | 0 | 39 tests passed |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | passed |
| `cargo fmt --all --check` | 0 | passed |
| `cargo test --workspace --release` | 0 | 39 tests passed |
| `cargo build --workspace --release` | 0 | passed |
| `cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown` | 0 | engine and app compiled for wasm32-unknown-unknown; execution parity remains W4 |
| `cargo deny check licenses` | 0 | licenses ok; existing unused BSD-3-Clause and ISC allowances warned |
| `cargo test -p horizon-engine ledger` | 0 | 2 tests passed |

The first eleven commands ran in the prescribed order, followed by every fixture
command below, then the retained W2 focused ledger command. For every row,
`cargo run -p horizon-cli -- dev-run <name>` used the exact fixture name shown.
All 34 observed exit statuses and result/error envelopes matched their contracts.
The CLI test also compares all 12 valid fixture names and paths to application
canonical JSON byte for byte from a different working directory.

| Fixture name | Exit | Result or error code |
| --- | --- | --- |
| `A-drawdown-pass-limit-1` | 0 | `partial` |
| `A-drawdown-proportional_taxable_tax_deferred` | 0 | `complete` |
| `A-drawdown-roth_before_tax_deferred` | 0 | `complete` |
| `A-drawdown-tax_deferred_first` | 0 | `complete` |
| `A-drawdown` | 0 | `complete` |
| `B-early-retiree` | 0 | `partial` |
| `C-partial-base-year-no-taxable` | 0 | `partial` |
| `D-still-working-rmd-surplus` | 0 | `partial` |
| `E-senior-2028-loss-carry` | 0 | `complete` |
| `invalid-account-type` | 1 | `UNKNOWN_ACCOUNT_TYPE` |
| `invalid-cost-basis` | 1 | `ACCOUNT_FIELDS` |
| `invalid-date` | 1 | `INVALID_DATE` |
| `invalid-end-before-start` | 1 | `END_BEFORE_START` |
| `invalid-missing-assumption` | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-cash-return` | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-field` | 1 | `MISSING_FIELD` |
| `invalid-missing-investment-return` | 1 | `MISSING_ASSUMPTION` |
| `invalid-missing-tax-indexing` | 1 | `MISSING_ASSUMPTION` |
| `invalid-negative-balance` | 1 | `NEGATIVE_BALANCE` |
| `invalid-negative-tax-indexing` | 1 | `INVALID_TAX_INDEXING` |
| `invalid-output-range` | 1 | `MONEY_OUTPUT_RANGE` |
| `invalid-owner` | 1 | `INVALID_OWNER` |
| `invalid-plan-end-age` | 1 | `PLAN_END_AGE_REACHED` |
| `invalid-rate` | 1 | `INVALID_RATE` |
| `invalid-tax-pass-limit` | 1 | `INVALID_TAX_PASS_LIMIT` |
| `synthetic-leap` | 0 | `partial` |
| `synthetic-retired` | 0 | `complete` |
| `synthetic-working` | 0 | `partial` |
| `two-person` | 2 | `MULTIPLE_PERSONS_UNSUPPORTED` |
| `unsupported-healthcare` | 2 | `FEATURE_UNSUPPORTED` |
| `unsupported-negative-cash-return` | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `unsupported-negative-investment-return` | 2 | `NEGATIVE_RETURN_UNSUPPORTED` |
| `unsupported-state-tax` | 2 | `FEATURE_UNSUPPORTED` |
| `unsupported-tax-year` | 2 | `TAX_YEAR_UNSUPPORTED` |

Additional checks: `git diff --check` passed; the installed repository commit
hooks passed on the source commit; working-tree and explicit branch ancestry
boundary checks passed. These checks establish only their implemented checks,
not an independent milestone review.

Unchanged SHA-256 receipts:

| Artifact | SHA-256 |
| --- | --- |
| W1 reference test source | `36b073a3a27292892c77144b8d11b8b2cc783110fe3df465a4595c7c4f533953` |
| W2 reference JSON | `251014c80b1e26e428ee8e622cc6fb9795b7340cd4a6dab057dacd620d59292c` |
| W3 reference JSON | `207a99e66411b82daf6e6a5bc9304970f3d91b2ccdf41c1bc97228342a85a1c5` |
| Cargo.lock | `d5eda111069a1ea3ba63a57330b2c514d598d2248b37d7d14c2a16544dd13f3c` |

#### Dependencies and exclusions

- **New dependencies: none.** Exact versions and licenses remain in
  `docs/model/dependencies.md`; the lockfile is byte-identical. The existing
  MIT-0 exception remains limited to `borrow-or-share@0.2.4`.
- State/local income tax, alternative minimum tax, itemized deductions,
  credits and taxable-account dividends/interest: excluded by this brief;
  always named in omissions without changing status.
- Net investment income tax: excluded computation; modified AGI above
  $200,000 explicitly marks the run partial.
- Contributions and the still-working required-distribution exception:
  later features; active wages and applicable required distributions retain
  their specified partial coverage labels.
- Exceptions to the additional early-distribution tax, and Roth early
  contribution/five-year ordering: later features; affected draws remain partial.
- Nondeductible IRA basis, Roth conversions, Medicare income-related surcharges
  and premium credits: later features outside the specified federal-tax model.
- Following-April tax payment timing: excluded because this model pays tax
  within the year it arises. A partial base year's tax covers only that period
  and is labeled an estimate.
- Negative investment/cash returns, couples, state-tax and healthcare inputs:
  earlier unsupported boundaries retained; no approximation was added.
- Comparison, export, the supported command line and WebAssembly execution
  parity: 0001-W4. This milestone verifies compilation for WebAssembly only.
- Graphical UI, TypeScript adapters, persistence, authentication, hosting and
  deployment: no such surface is introduced by this headless milestone.
- Independent milestone review: reserved for a different session after handoff.
