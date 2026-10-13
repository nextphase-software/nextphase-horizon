# Contributing to NextPhase Horizon

- Date: 2026-10-13
- Status: pre-implementation; the license and the public contribution process are not yet in place

Read `README.md` and `DESIGN.md` first. There are no install, test or build commands yet.

## Before the license exists

No license has been chosen, so outside contributions cannot be accepted yet. The contribution process (issues, pull requests, contributor terms, support channels) will be documented here before the repository opens to contributions.

## How work is organized

Each unit of work has one implementation brief in `docs/briefs/` stating the outcome, deliverables, numbered acceptance criteria, validation and exclusions. A change is made on its own branch, validated, recorded in the brief's implementation record, and reviewed by someone other than its author before the maintainer merges it. Technical decisions are recorded in `docs/decisions/` before the work that depends on them.

A brief contains everything needed to do and verify its work. Authoritative public references, such as official dependency documentation and published tax rules, may be cited by URL and retrieval date; anything the build or a calculation depends on is committed here.

## Standards for every change

- Never submit household financial data, personal information, credentials or provider keys. Use synthetic data in fixtures, demonstrations, screenshots and issue reports.
- Never submit material copied from another product, or code whose license is incompatible with this project's.
- Calculation changes need documented assumptions, units, rounding, versioning, reference vectors and boundary tests.
- Hosted behavior needs authorization and cross-tenant denial evidence.
- Interface evidence includes accessibility and responsive checks. Screenshots alone do not establish correct behavior.
- Use Conventional Commits.

Contributors are not required to use any particular coding agent. Those who do should point it at `AGENTS.md`.
