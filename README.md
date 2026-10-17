# NextPhase Horizon

Open-source, web-first financial planning software for individuals planning their own retirement. The first supported jurisdiction is the United States.

**Status (2026-10-17):** a Rust calculation engine and development command produce synthetic yearly ledgers with single-filer federal income tax paid through withdrawals. Supported retired scenarios report complete; omissions and partial flags remain explicit. No graphical interface, database or deployment exists yet.

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

Install the pinned toolchain through rustup (`rust-toolchain.toml`), then install the license checker once:

```sh
cargo install cargo-deny --version 0.20.2 --locked
```

Run these validation commands in order from the workspace root:

```sh
cargo test -p horizon-engine tax
cargo test -p horizon-app --test reference_values_w3
cargo test -p horizon-app --test reference_values_w2
cargo test -p horizon-app --test reference_values
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
cargo test --workspace --release
cargo build --workspace --release
cargo build -p horizon-engine -p horizon-app --target wasm32-unknown-unknown
cargo deny check licenses
cargo run -p horizon-cli -- dev-run <name>
cargo test -p horizon-engine ledger
```

For the last command, replace `<name>` with each fixture name in
[the federal-tax fixture reference](docs/model/federal-tax.md#fixtures).
Valid fixtures exit 0; invalid inputs exit 1; unsupported inputs exit 2.
Every response is canonical JSON followed by one newline. The workspace test
suite also checks command output against the application operation byte for byte.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). All demonstration and test data must be synthetic.
