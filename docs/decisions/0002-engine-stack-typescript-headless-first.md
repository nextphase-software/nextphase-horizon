# 0002 — Engine stack and architecture (TypeScript on Node.js LTS, pnpm, Vitest; headless-first layering with published JSON Schemas)

- Status: Superseded by [0007](0007-rust-core-typescript-shell.md)
- Date: 2026-10-15
- Related: [0003](0003-money-and-time-conventions.md) — the money and time rules this stack implements.

## Context

The first code is a calculation engine for retirement projections, built before any user interface. The engine has to run in a web browser and on a server, and must be usable by programs other than a web interface. Every run must be reproducible from its declared inputs, as `DESIGN.md` requires.

Integers in JavaScript are exact up to 2^53, which in cents is about 90 trillion US dollars. That is more than enough for household amounts held as integer cents (see 0003).

## Decision

1. **Write the engine, and every layer built on it, in TypeScript on the current Node.js LTS release.** One language runs from the calculation core to any interface or service, and the same engine runs in the browser and on a server. Exact versions of Node.js, TypeScript, pnpm and Vitest are pinned in the brief that introduces them.
2. **Use pnpm workspaces and Vitest.** Workspaces keep the engine, its published contracts and its adapters in separate packages. Vitest runs the unit and reference-value tests.
3. **Layer the code headless-first:**
   - **(a) An engine package of pure calculation** with no input/output, no storage, and no clock or randomness except through declared inputs.
   - **(b) Application operations** such as run, compare, export and import. Every adapter calls these.
   - **(c) Adapters,** starting with a command line.
   No adapter contains a calculation rule. Results never depend on which adapter requested them, and the engine stays testable in isolation.
4. **Publish versioned JSON Schemas for household input, run output and export, with stable machine-readable error codes alongside readable messages.** A schema is the contract every caller is built against. Codes let programs react reliably, and versioning lets callers and adapters evolve independently.

## Consequences

- Briefs can name exact validation commands: focused tests, typecheck, lint, format and build.
- New adapters are thin layers over application operations and the published schemas.
- **Security:** the pure engine has no input/output surface. Authorization belongs in application operations and adapters, and every adapter must enforce it.
- **Dependencies:** each dependency is named with its exact version and license, and must be compatible with `AGPL-3.0-only`.
