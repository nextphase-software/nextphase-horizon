# 0016 — Plain status words (a result says in plain words whether it covers the person's situation and what it leaves out; no coverage labels before there is a result)

- Status: Accepted (qualified — the exact words are confirmed once they have been seen in use, and may be amended then; the rule itself stands)
- Date: 2026-10-19
- Related:
  - [`DESIGN.md`](../../DESIGN.md), "Financial content" and the status colour tokens — the rule this decision changes.
  - [0012](0012-application-operations-for-answers.md) — the engine's run output, whose statuses (`supported`, `partial`, `unsupported`) and omission lists are unchanged.

## Context

`DESIGN.md` named the status words Supported, Partial (with the count of omissions), Unsupported, Your estimate, Rough value and Sample household. The words are the engine's own terms. The web app showed them on every screen, including the start screen, before any result exists, and marked every money field "≈ Rough?". Shown before a result and in engine terms, they do not tell a first-time user what they mean.

The guardrail in `DESIGN.md` stays: label assumptions, estimates, missing data and failure states explicitly, and never present an incomplete or failed calculation as a successful plan. This decision changes how that is said, not whether.

## Decision

1. **Say coverage only once there is a result.** Before a result, each gap is said once, in one plain line, at the question it concerns, and the review page lists what Horizon doesn't count yet.
2. **Use plain statements on a result, comparison or export.** Engine `supported` is shown as "✓ Covers your situation"; `partial` as "△ Leaves out N things", with the list one click away under "What this result leaves out"; `unsupported` as "! Horizon can't plan for this yet", followed by the reason. "Covers your situation" is preferred over "Complete" because the engine reports only the gaps it knows of.
3. **Mark uncertain answers "not sure".** A person marks an answer "I'm not sure of this"; it then carries a "not sure" tag wherever it appears. This replaces "Rough value".
4. **Label invented data "Example household — invented figures".** This replaces "Sample household".
5. **Keep "Your estimate"** for a figure the person estimated.
6. **Keep the colours, icons and token names.** Only the tokens' descriptions change. Status is never shown by colour alone.
7. **Keep engine terms off the screen.** "Supported", "partial", "omission" and "rough" remain in the engine's data, the plan file and the model documentation.

## Consequences

- The web app's words change on every screen that shows a status, and the end-to-end tests that assert them change with it, in a later brief.
- The engine, schemas, plan file, status logic, colours and token names do not change.
- Each statement keeps its icon and its words, so screen readers read the words, never the icon alone.
