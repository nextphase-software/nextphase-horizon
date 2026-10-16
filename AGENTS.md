# NextPhase Horizon — agent instructions

Open-source financial planning for individuals, web first. These rules apply to every coding agent working in this repository. They are the same standards human contributors follow. Read `README.md`, `DESIGN.md` and `CONTRIBUTING.md` first.

## Working on a change

- Implement exactly one implementation brief from `docs/briefs/`. Its first line carries a brief ID and version. A missing, ambiguous or superseded brief requires clarification before any work.
- This repository is self-sufficient: every requirement, decision, and build or model input you need is committed here. Requirements come only from the brief. You may consult authoritative public references that the brief or a decision record cites, such as official dependency documentation and published tax rules, and cite them by URL and retrieval date. Maintainers may hold private planning material; never copy, quote, paraphrase, link or name any source that is not public in anything committed here, and never treat it as a requirement. If something you need is missing from the brief, stop and report it.
- Work in your own worktree on a branch named `<agent>/<BRIEF-ID>-<slug>`, created from current `main`. If you start anywhere else, create it first with `git worktree add .worktrees/<agent>-<BRIEF-ID> -b <agent>/<BRIEF-ID>-<slug> main` and work only there. If `main` has uncommitted changes, stop and ask the maintainer to commit them first. When asked to implement a milestone by its ID, use the newest brief version in `docs/briefs/`. Commit only on that branch, using Conventional Commits. Never commit to, merge into, rebase, reset or push `main`. Do not push or open a pull request unless the maintainer asks.
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

Install the pinned toolchain through rustup (`rust-toolchain.toml`), then install the license checker once:

```sh
cargo install cargo-deny --version 0.20.2 --locked
```

Run these validation commands in order from the workspace root:

```sh
cargo test -p horizon-engine money
cargo test -p horizon-app validation
cargo test -p horizon-app --test reference_values
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
cargo test --workspace --release
cargo build --workspace --release
cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown
cargo deny check licenses
cargo run -p horizon-cli -- dev-run <name>
```

For the last command, replace `<name>` with each fixture name in
[the fixture and command reference](docs/model/engine-foundations.md#fixtures).
Valid fixtures exit 0; invalid inputs exit 1; unsupported inputs exit 2.
Every response is canonical JSON followed by one newline. The workspace test
suite also checks command output against the application operation byte for byte.

Prove behavior with current source and tests. Interface work also checks the brief's design reference, responsive layouts, light and dark themes, keyboard access and accessible status labels. Report exactly what you ran and observed; cached output is not a new pass. A different reviewer evaluates each change; do not review your own work.

## Commit recommendations

After any change, include exactly one line near the end of your final response:

`Recommended commit message: type(scope): imperative summary`

Use Conventional Commits with a concise imperative subject, ideally under 72 characters. Types: feat, fix, refactor, docs, test, perf, build, ci, chore.
