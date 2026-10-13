# NextPhase Horizon — agent instructions

Open-source financial planning for individuals, web first. These rules apply to every coding agent working in this repository. They are the same standards human contributors follow. Read `README.md`, `DESIGN.md` and `CONTRIBUTING.md` first.

## Working on a change

- Implement exactly one implementation brief from `docs/briefs/`. Its first line carries a brief ID and version. A missing, ambiguous or superseded brief requires clarification before any work.
- This repository is self-sufficient: every requirement, decision, and build or model input you need is committed here. Requirements come only from the brief. You may consult authoritative public references that the brief or a decision record cites, such as official dependency documentation and published tax rules, and cite them by URL and retrieval date. Do not use, copy from, or link to any source that is not public. If something you need is missing, stop and report it.
- Work in your own worktree on a branch named `<agent>/<BRIEF-ID>-<slug>`, created from current `main`. Commit only on that branch, using Conventional Commits. Never commit to, merge into, rebase, reset or push `main`. Do not push or open a pull request unless the maintainer asks.
- Never use `git stash`, never touch another worktree, and never bypass Git hooks with `--no-verify`. If a hook blocks a commit, fix the cause or report it.
- Do the brief and nothing beyond it. Preserve unrelated work.
- Name every added dependency with its exact version. Stack and provider choices come only from accepted records in `docs/decisions/`.
- The project is licensed `AGPL-3.0-only`. Start each new source file with an `SPDX-License-Identifier: AGPL-3.0-only` comment where the format allows one, and add no dependency whose license is incompatible with it; name each new dependency's license.
- Before handing off, append an **Implementation record** to the brief: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, new dependencies, and every exclusion with its reason. The record is committed after that revision, so it cannot name its own commit; report the final branch tip separately in your handoff message.

## Code discovery

When a code-graph tool is available, use it first to find symbols, call paths and structure, then read files for documentation, configuration and literals. Read a file before editing it.

## Guardrails

Follow the Do's and Don'ts in `DESIGN.md`. In particular:

- Financial logic declares units, currency, precision, rounding, assumptions, and model and tax-year versions, and is proven with synthetic reference vectors.
- Tenant, role and household authorization ships with every route, document access and export, with cross-tenant denial tests.
- Credentials stay server-side. Fixtures, demonstrations, screenshots and logs use synthetic data only.
- Output distinguishes assumptions and estimates from facts, and never presents an incomplete or failed calculation as a successful plan.

## Validation

There is no framework, package manager, application or test suite yet, so there are no commands to run. Once a stack exists, the exact focused test, typecheck, lint, format, build, security and numerical validation commands are documented here and in `README.md`. Do not advertise commands that do not exist.

Prove behavior with current source and tests. Interface work also checks the brief's design reference, responsive layouts, light and dark themes, keyboard access and accessible status labels. Report exactly what you ran and observed; cached output is not a new pass. A different reviewer evaluates each change; do not review your own work.

## Commit recommendations

After any change, include exactly one line near the end of your final response:

`Recommended commit message: type(scope): imperative summary`

Use Conventional Commits with a concise imperative subject, ideally under 72 characters. Types: feat, fix, refactor, docs, test, perf, build, ci, chore.
