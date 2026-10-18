# NextPhase Horizon

Open-source, web-first financial planning software for individuals planning their own retirement. The first supported jurisdiction is the United States.

**Status (2026-10-18):** the supported Rust command line runs synthetic yearly ledgers with single-filer federal tax, compares scenarios, and exports/imports versioned results. It also computes sustainable spending, ranked levers and rough-input impact, with balances and shortfalls in today's dollars. Native and WebAssembly outputs are proven identical. Supported retired scenarios report complete; omissions and partial flags remain explicit. No graphical interface, database or deployment exists yet.

**License:** GNU Affero General Public License, version 3 only (`AGPL-3.0-only`). See [LICENSE](LICENSE). If you run a modified version as a network service, the license requires you to offer its source to the people who use it.

Copyright © 2026 NextPhase LLC.

## What is in this repository

Everything needed to build, run, verify and modify the software:

| Path | Holds |
| --- | --- |
| `apps/`, `packages/` | Application and calculation-engine source |
| `infra/`, `scripts/` | Infrastructure templates, migrations and build scripts (empty for now) |
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

Install Node.js **24.22.0** (for example, `nvm install 24.22.0`). If it is
already installed with nvm, select its executable directory before running the
WebAssembly command:

```sh
export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
node --version
wasm-bindgen-test-runner --version
```

Expected versions are `v24.22.0` and `wasm-bindgen-test-runner 0.2.129`.
The runner version must equal `wasm-bindgen` in Cargo.lock. Node is test-only;
there is no TypeScript adapter or new top-level tool configuration.

Run the full cumulative 0001-W1–W4 and 0003-W1 validation sequence in order from the workspace root:

```sh
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
cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown
CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown
cargo deny check licenses
cargo run --release -p horizon-cli -- levers answers-working-61
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
Supported commands exit 0 complete, 3 partial, 1 invalid or 2 unsupported;
`dev-run` retains exit 0 for partial. Each prints canonical JSON and one newline.
For exports, status is the embedded `run.status`; import prints the restored run.
The CLI suite compares command output byte for byte with application operations.
Record `node --version` with every WebAssembly validation run. The release
levers command is timed after the release build and must finish in under two
seconds; its expected exit is 3 (partial). Measure the WebAssembly levers test
separately, using the same Node PATH and runner:

```sh
CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner cargo test -p horizon-parity --target wasm32-unknown-unknown answers_levers_reference_and_golden
```

Record that test's duration from the harness output.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). All demonstration and test data must be synthetic.
