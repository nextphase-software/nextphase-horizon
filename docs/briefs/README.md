# Implementation briefs

A brief is the complete, self-sufficient specification for one unit of work. Whoever implements it needs nothing outside this repository.

File name: `<ID>-<slug>.md`. Design references for the brief, when it implements a screen, live in `assets/<ID>/`. An amended brief keeps its ID and increments its version; the newest version in this folder is the only one to implement.

All requirements are in the brief. Every decision record a brief depends on is accepted and committed in `docs/decisions/` before the brief is.

## Template

```text
BRIEF VERSION: <ID> v<integer> (<YYYY-MM-DD>)

# <ID> — <title>

## Outcome
The user-visible result, in a few sentences.

## Deliverables
Explicit files, contracts, signatures and behavior.

## Done when
Numbered, measurable acceptance criteria.

## Read first
Paths in this repository: decision records, model specification, architecture
overview, design reference. Authoritative public references, each with its URL
and retrieval date. Name any control in a design reference that is
illustrative and must not ship.

## Guardrails
The applicable Do's and Don'ts from DESIGN.md, copied verbatim.

## Validation
Exact commands, ordered by cost: focused numerical, domain and authorization
tests, then package tests, typecheck, lint and format, then the build, then
integration or browser proof. Numerical work names its reference vectors,
edge cases, precision and rounding. Hosted behavior names its role, tenant
and household denial tests.

## Exclusions
What is deliberately not part of this work, each with its reason.

## Implementation record
Appended by the implementer before handoff: branch, the source/test revision
the validation ran against, each validation command with exit status and
counts, seed and model version for simulations, new dependencies with exact
versions, and every exclusion with its reason. The record is committed after
that revision and does not name its own commit; the final branch tip is
reported in the handoff message.
```

Briefs: [0001-W1](0001-W1-engine-foundations.md) engine foundations.
