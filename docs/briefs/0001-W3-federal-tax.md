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
