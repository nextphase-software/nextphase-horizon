# NextPhase Horizon

Open-source, web-first financial planning software for individuals planning their own retirement. The first supported jurisdiction is the United States.

**Status (2026-10-13):** pre-implementation. No application, calculation engine, framework, database or deployment exists yet.

**License:** not yet chosen. Until a `LICENSE` file is present, nothing in this repository is licensed for reuse.

## What is in this repository

Everything needed to build, run, verify and modify the software:

| Path | Holds |
| --- | --- |
| `apps/`, `packages/` | Application and calculation-engine source (empty for now) |
| `infra/`, `scripts/` | Infrastructure templates, migrations and build scripts (empty for now) |
| `docs/briefs/` | One implementation brief per unit of work, with its acceptance criteria and implementation record |
| `docs/decisions/` | Technical decision records |
| `docs/architecture/` | The current system overview and contributor-facing contracts |
| `docs/model/` | Calculation model specification, assumptions, limitations and reference test vectors |
| `docs/guides/` | Self-hosting and user documentation |
| [DESIGN.md](DESIGN.md) | Engineering guardrails and design tokens |

This repository is intended to be sufficient on its own for anyone building, auditing or changing the software.

## Setup

There are no install, build or test commands yet. They will be recorded here and in [AGENTS.md](AGENTS.md) when a stack is chosen through a decision record. `.env.example` contains documentation only.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). All demonstration and test data must be synthetic.
