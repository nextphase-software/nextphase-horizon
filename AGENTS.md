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

Install the toolchain pinned in `rust-toolchain.toml`, then install the test tools:

```sh
cargo install cargo-deny --version 0.20.2 --locked
cargo install wasm-bindgen-cli --version 0.2.129 --locked
```

Install Node.js **26.11.1** (for example, `nvm install 26.11.1`). If it is
already installed with nvm, select its executable directory before running the
WebAssembly command:

```sh
export PATH="$HOME/.nvm/versions/node/v26.11.1/bin:$PATH"
node --version
wasm-bindgen-test-runner --version
```

Expected versions are `v26.11.1` and `wasm-bindgen-test-runner 0.2.129`.
The runner version must equal `wasm-bindgen` in Cargo.lock. Node also builds and tests the self-contained web adapter in `apps/web/`;
there is no new top-level tool configuration.

Install pnpm 12.9.1 for that Node.js:

```sh
npm install -g pnpm@12.9.1
```

Alternatively, use [pnpm’s installer](https://pnpm.io/installation) (retrieved 2026-10-22):

```sh
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=12.9.1 sh -
```

pnpm runs the version in `packageManager` when another is invoked (`pmOnFail`, default `download`; [pnpm settings](https://pnpm.io/settings/cli), retrieved 2026-10-22).

**Validation tiers.** Run only the tier that matches what the brief changes;
the brief's Validation section names it. Each tier lists everything that runs.

- **Docs only:** the public boundary check and a link check.
- **Screen** (only `apps/web/` and `docs/`): `cargo test -p horizon-wasm`, the
  release WebAssembly build, the web shell commands below, and the end-to-end
  suite in 4 projects: `chromium-1280-light`, `chromium-375-dark`,
  `webkit-1280-dark` and `webkit-375-light`.
- **Toolchain or infra** (package files, Node or pnpm versions, `infra/`): the
  web shell commands, the end-to-end suite in `chromium-1280-light` and
  `webkit-375-light`, the WebAssembly parity test, and `cargo test --workspace
  --release`.
- **Engine** (`packages/`, `Cargo.toml`, `Cargo.lock`, `deny.toml`,
  `rust-toolchain.toml`): `cargo test --workspace --release`, `cargo clippy`,
  `cargo fmt --check`, `cargo deny check licenses`, both WebAssembly commands,
  the release levers timing and `intake_v2_timing`; then the web unit tests,
  typecheck and build, and the end-to-end suite in `chromium-1280-light` and
  `webkit-375-light`.

`cargo test --workspace --release` covers the filtered `cargo test -p …`
commands, the debug `cargo test --workspace` run and the per-fixture CLI
expansions listed below: the CLI suite already compares every command's output
byte for byte with the application operations. Those are not run separately.
The full list below stays the reference for what each tier draws from.

Run the full cumulative 0001-W1–W4, 0003-W1 and 0002-W4–W5 validation sequence in order from the workspace root:

```sh
cargo test -p horizon-app intake
cargo test -p horizon-app --test reference_values_intake
cargo test -p horizon-app answers
cargo test -p horizon-app --test reference_values_answers
cargo test -p horizon-app compare
cargo test -p horizon-app immutability
cargo test -p horizon-app export
cargo test -p horizon-app --test reference_values_w4
cargo test -p horizon-engine tax
cargo test -p horizon-app --test reference_values_w3
cargo test -p horizon-app --test reference_values_w2
cargo test -p horizon-app --test reference_values
cargo test -p horizon-engine ledger
cargo test -p horizon-engine money
cargo test -p horizon-app validation
cargo test -p horizon-parity
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
cargo test --workspace --release
cargo build --workspace --release
node --version
cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown
node --version
CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown
node --version
CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test --release -p horizon-parity --target wasm32-unknown-unknown intake_v2_timing -- --nocapture
cargo deny check licenses
cargo run --release -p horizon-cli -- levers answers-working-61
cargo run -p horizon-cli -- intake <answers.json>
cargo run -p horizon-cli -- spend <name>
cargo run -p horizon-cli -- levers <name>
cargo run -p horizon-cli -- impact <name> <rough.json>
cargo run -p horizon-cli -- run <name>
cargo run -p horizon-cli -- compare <baseline> <scenario>
cargo run -p horizon-cli -- export <name>
cargo run -p horizon-cli -- import <export-path>
cargo run -p horizon-cli -- dev-run <name>
```

Expand the command placeholders over all fixtures and reference cases in
[the answer guide](docs/model/answers.md#fixtures-and-validation) and
[the scenario/export fixture guide](docs/model/scenario-diff-and-export.md#fixtures-and-command-checks).
Run intake over all 29 answers documents in the [version 1 intake reference values](docs/briefs/0002-W4-reference-values.json) and all 25 documents in the [reverse-answer reference values](docs/briefs/0002-W5-reference-values.json), extracted to separate JSON files.
The intake reference and WebAssembly parity commands cover both milestones.
Record all five means printed by the release `intake_v2_timing` test (ten runs
per case). Intake also exits 4 incomplete.
Supported commands exit 0 complete, 3 partial, 1 invalid or 2 unsupported;
`dev-run` retains exit 0 for partial. Each prints canonical JSON and one newline.
For exports, status is the embedded `run.status`; import prints the restored run.
The CLI suite compares command output byte for byte with application operations.
Record `node --version` with every WebAssembly validation run. The release
levers command is timed after the release build and must finish in under two
seconds; its expected exit is 3 (partial). Measure the WebAssembly levers test
separately, using the same Node PATH and runner:

```sh
node --version
CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden
```

Record that test's duration from the harness output.

Prove behavior with current source and tests. Interface work also checks the brief's design reference, responsive layouts, light and dark themes, keyboard access and accessible status labels. Report exactly what you ran and observed; cached output is not a new pass. A different reviewer evaluates each change; do not review your own work.

## Commit recommendations

After any change, include exactly one line near the end of your final response:

`Recommended commit message: type(scope): imperative summary`

Use Conventional Commits with a concise imperative subject, ideally under 72 characters. Types: feat, fix, refactor, docs, test, perf, build, ci, chore.


## Web shell validation — 0002-W1 v2

Use Node.js 26.11.1 and pnpm 12.9.1.
`apps/web/package.json` selects pnpm 12.9.1.
No top-level JavaScript configuration is needed. First
run the entire Rust sequence above unchanged, expanding every placeholder over
the fixtures/reference cases in both linked guides. Then, from the workspace root:

```sh
cargo test -p horizon-wasm
node --version
cargo build -p horizon-wasm --target wasm32-unknown-unknown --release
```

Continue from `apps/web/`, in this order (including on a fresh clone):

```sh
export PATH="$HOME/.nvm/versions/node/v26.11.1/bin:$PATH"
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run build:engine
pnpm run types
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm test
pnpm run build
pnpm exec playwright install chromium webkit
pnpm run e2e
pnpm run licenses
```

Expected versions: Node v26.11.1, pnpm 12.9.1. Playwright
1.63.0 installs its matched Chromium and WebKit binaries. Record actual
browser versions from the e2e browser-version annotations; installing binaries
alone does not prove they ran. Browser launches require an environment that
permits their OS processes. The e2e suite serves the production build locally
and checks 8 browser/size/theme projects, with every sample in every project.

**Engine-only briefs.** When a brief changes nothing under `apps/web/`, its Validation section may exclude the end-to-end browser suite: `pnpm exec playwright install …` and `pnpm run e2e`. Every other command in this section still runs, including the web unit tests, typecheck, lint, build and license checks.

**Screen-only briefs.** When a brief changes nothing outside `apps/web/` and
`docs/` (no file under `packages/` or `infra/`, and no `Cargo.toml`,
`Cargo.lock`, `deny.toml` or `rust-toolchain.toml`), its Validation section may
exclude the cumulative Rust sequence above, and its CLI command expansions. `cargo test -p horizon-wasm`, the release WebAssembly
build and every web shell command in this section still run, including the
end-to-end browser suite. The implementation record shows
`git diff --name-only <base>..HEAD` to prove the scope; any file outside it
brings the excluded commands back.

The license command checks the production and full dependency closures separately.
Production keeps the strict allow-list and named font exception. Only exact
build/test package-version-license exceptions in decision 0011's 2026-10-18
amendment apply to the full closure. Any other license fails with its package,
version and license. See [the inventory](docs/model/dependencies.md#web-shell--0002-w1-v2).

For local use after installation, run `pnpm run dev` from `apps/web/`
and open http://127.0.0.1:5173. It watches static builds; reload after a rebuild.
This preserves the exact CSP without inline development HMR scripts/styles.
Restart after engine/schema changes. Architecture, protocol, tokens, security
and test details are in [web-shell.md](docs/architecture/web-shell.md).
