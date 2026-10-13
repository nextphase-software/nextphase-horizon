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

No decisions have been recorded yet.
