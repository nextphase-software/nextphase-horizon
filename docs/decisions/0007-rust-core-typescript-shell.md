# 0007 — Language split and architecture (Rust calculation core compiled to one WebAssembly module; TypeScript web interface, API and MCP server; headless-first layering)

- Status: Accepted
- Date: 2026-10-16
- Supersedes: [0002](0002-engine-stack-typescript-headless-first.md). Its headless-first layering and published schemas carry over unchanged.
- Related: [0003](0003-money-and-time-conventions.md) — the money and time rules the core implements.

## Context

No code exists yet. The calculation core must give exact, reproducible results from declared inputs, as `DESIGN.md` requires, including for stochastic models that run many projections. The same results must be available in a web browser, on a server, from a command line and to other programs. The web interface must meet the accessibility rules in `DESIGN.md`: text labels, accessible controls, and textual or tabular alternatives to charts.

## Decision

1. **Write the calculation core in Rust: the engine, the application operations and a developer command line, as one Cargo workspace.** Rust's exhaustive pattern matching and absence of null values suit rule-heavy calculation, and compiled code suits workloads that run many projections. The toolchain is pinned by `rust-toolchain.toml` on the stable channel, edition 2024; the exact version is set in the brief that introduces it.
2. **Compile the core to one WebAssembly module that both the browser and the server load, and to native code for the command line and tests.** Every host runs the same compiled engine, so results do not depend on where they were requested. Reference values must pass on the native build and on the WebAssembly build before any adapter uses the module.
3. **Use exact arithmetic with no floating point.** Money is `i64` integer cents with checked arithmetic, so overflow is an error and never wraps. Rates are exact decimals, and compound factors are exact rationals over arbitrary-precision integers, rounded half up to the cent once, as 0003 requires. Floating-point arithmetic is denied by lint in the core crates.
4. **Layer the code headless-first:**
   - **(a) An engine of pure calculation** with no input/output, no storage, and no clock or randomness except through declared inputs.
   - **(b) Application operations** such as run, compare, export and import. Every adapter calls these.
   - **(c) Adapters,** starting with a command line.
   No adapter contains a calculation rule.
5. **Publish versioned JSON Schemas for household input, run output and export, generated from the Rust types, with stable machine-readable error codes listed in one table.** Generating the schemas from the types keeps the contract and the code from drifting apart.
6. **Write the web interface, HTTP API and MCP server in TypeScript on Node.js LTS, with pnpm workspaces and Vitest,** calling the WebAssembly module through a thin generated binding. The web ecosystem's accessible components and charting serve the interface rules. Exact versions are pinned in the first brief that adds TypeScript.
7. **Compute input and assumption hashes and canonical JSON inside the Rust core,** so run metadata is identical in every host.
8. **Validate Rust code with `cargo fmt --check`, `cargo clippy` with warnings denied, and `cargo test`,** plus a license check of every dependency. Exact commands are recorded in `AGENTS.md` and `README.md` when the code exists.

## Consequences

- Briefs for the calculation core name Rust validation commands. Node.js and TypeScript enter with the first TypeScript adapter.
- New adapters are thin layers over the WebAssembly module, the application operations and the published schemas.
- **Security:** the pure engine has no input/output surface and runs sandboxed as WebAssembly. Authorization belongs in application operations and adapters, and every adapter must enforce it.
- **Dependencies:** each dependency is named with its exact version and license, and must be compatible with `AGPL-3.0-only`.

## Amendment — 2026-10-16: WebAssembly parity is first proven in 0001-W4, under Node.js

Item 2 requires the reference vectors to pass on the WebAssembly build before any adapter uses the module.

1. **Milestone 0001-W4 runs them first.** It runs the reference vectors and the export round trips on the `wasm32-unknown-unknown` module that adapters will load, and requires output byte-identical to the native build.
2. **The tests run under Node.js with `wasm-bindgen-test`.** This tests the module the same way the browser and the later TypeScript layer will load it.
3. **Node.js therefore enters at 0001-W4, as a test-only runtime.** Its exact version is pinned in that brief. TypeScript, pnpm and Vitest still enter with the first TypeScript adapter.

Wasmtime was considered and declined: it would need a custom host to load the same module.
