# NextPhase Horizon

Open-source, web-first financial planning software for individuals planning their own retirement. The first supported jurisdiction is the United States.

**Status:** see [Project status](docs/STATUS.md) for what works today and what is being built now.

**License:** GNU Affero General Public License, version 3 only (`AGPL-3.0-only`). See [LICENSE](LICENSE). If you run a modified version as a network service, the license requires you to offer its source to the people who use it.

Copyright © 2026 NextPhase LLC.

## What is in this repository

Everything needed to build, run, verify and modify the software:

| Path | Holds |
| --- | --- |
| `apps/`, `packages/` | Application and calculation-engine source |
| `infra/`, `scripts/` | infrastructure templates, migrations and build scripts |
| `docs/briefs/` | One implementation brief per unit of work, with its acceptance criteria and implementation record |
| `docs/decisions/` | Technical decision records |
| `docs/architecture/` | The current system overview and contributor-facing contracts |
| `docs/model/` | Calculation model specification, assumptions, limitations and reference test vectors |
| `docs/guides/` | Self-hosting and user documentation |
| [DESIGN.md](DESIGN.md) | Engineering guardrails and design tokens |

This repository is intended to be sufficient on its own for anyone building, auditing or changing the software.

## Setup

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

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). All demonstration and test data must be synthetic.


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
