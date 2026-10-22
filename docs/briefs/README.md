# Implementation briefs

A brief is the complete, self-sufficient specification for one unit of work. Whoever implements it needs nothing outside this repository.

File name: `<ID>-<slug>.md`. Design references for the brief, when it implements a screen, live in `assets/<ID>/`, or in a shared versioned folder such as `assets/design-v1/` when several briefs use the same references. An amended brief keeps its ID and increments its version; the newest version in this folder is the only one to implement.

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

Briefs: [0001-W1](0001-W1-engine-foundations.md) engine foundations; [0001-W2](0001-W2-yearly-ledger.md) yearly ledger and funding order, with [reference values](0001-W2-reference-values.json); [0001-W3](0001-W3-federal-tax.md) federal income tax, with [reference values](0001-W3-reference-values.json); [0001-W4](0001-W4-scenario-diff-and-export.md) scenario comparison, versioned export and WebAssembly parity, with [reference values](0001-W4-reference-values.json); [0003-W1](0003-W1-answer-operations.md) answer operations, with [reference values](0003-W1-reference-values.json); [0002-W1](0002-W1-web-shell.md) web shell: the engine in the browser; [0002-W2](0002-W2-start-and-guided-setup.md) start screen and guided household setup, with the [design references](assets/design-v1/README.md); [0002-W3](0002-W3-input-check.md) input check; [0003-W2](0003-W2-plan-screen.md) the plan screen; [0004-W1](0004-W1-compare-screen.md) try a change and compare; [0005-W1](0005-W1-export-screen.md) export: share a summary, keep and reopen a plan file; [0005-W2](0005-W2-tidy-up.md) tidy-up across the plan, comparison and export screens; [0002-W4](0002-W4-answers-to-plan.md) answers to plan: incomplete answers and ranges, with [reference values](0002-W4-reference-values.json); [0002-W5](0002-W5-reverse-answers.md) reverse answers and what-if, with [reference values](0002-W5-reference-values.json); [0002-W6](0002-W6-intake-screens.md) intake screens, with [head sentences](0002-W6-head-sentences.json) and the [design references, version 2](assets/design-v2/README.md); [0002-W7](0002-W7-what-if-panel.md) what-if panel, with [what-if cases](0002-W7-what-if-cases.json) and [slider starts](0002-W7-slider-starts.json); [0003-W3](0003-W3-plain-results.md) plain results, with [plain sentences](0003-W3-plain-sentences.json); [0002-W8](0002-W8-hosted-prototype.md) hosted prototype: deploy tooling; [0002-W9](0002-W9-analytics-and-fonts.md) the host's analytics script and no inlined fonts; [0003-W4](0003-W4-plan-layout-and-overview.md) plan layout: navigation, headline figures, Overview and a chart-first plan, with [shell figures](0003-W4-shell-figures.json); [0003-W5](0003-W5-options-compare-and-summary.md) options, side-by-side compare and a printable summary, with [options](0003-W5-options.json); [0002-W10](0002-W10-unchanged-what-if-keeps-copies.md) leaving a what-if control unchanged keeps your copies.
