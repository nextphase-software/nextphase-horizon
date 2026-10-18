# Technical decision records

One record per technical decision, so a settled question stays settled. A record states what was decided and the technical reasons. It is accepted and committed before any brief that depends on it; what implementation later shows is appended as an amendment.

File name: `NNNN-kebab-slug.md`, using the decision's four-digit number. Numbers are never reused.

## Template

```text
# NNNN — <Decision stated as an outcome (the chosen option)>

- Status: <Accepted | Accepted (qualified — state the gate) | Superseded by NNNN>
- Date: YYYY-MM-DD
- Related: <relative links to other records, briefs or model documents, each with why it matters>

## Context
The technical situation that required a decision, and what was verified.

## Decision
Numbered. Each item is a bolded imperative claim followed by its technical rationale.

## Consequences
What this requires, enables or rules out, including security and operating-cost effects.
```

Amendments are appended in place under `## Amendment — YYYY-MM-DD: <headline>`.

Records: [0002](0002-engine-stack-typescript-headless-first.md) engine stack and architecture (superseded by 0007); [0003](0003-money-and-time-conventions.md) money and time conventions; [0004](0004-withdrawals-before-59-half.md) withdrawals before age 59½; [0005](0005-tax-rule-contract-and-base-year.md) tax rules across future years; [0006](0006-surplus-and-withdrawal-order.md) surplus and withdrawal order; [0007](0007-rust-core-typescript-shell.md) language split and architecture; [0008](0008-ledger-and-required-distribution-conventions.md) ledger and required-distribution conventions; [0009](0009-federal-tax-computation-conventions.md) federal income tax computation conventions; [0010](0010-comparison-export-and-command-line-conventions.md) comparison, export and command-line conventions.
