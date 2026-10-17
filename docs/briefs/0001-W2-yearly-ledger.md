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
