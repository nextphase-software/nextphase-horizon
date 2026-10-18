# Contributing to NextPhase Horizon

- Date: 2026-10-18
- Status: a Rust command line exists; no graphical interface, database or deployment yet (see the status in `README.md`); licensed under `AGPL-3.0-only`; the public contribution process is not yet open

Read `README.md` and `DESIGN.md` first. To install the toolchain and test tools, follow **Setup** in `README.md`. To build and test a change, run the cumulative validation sequence in the **Validation** section of `AGENTS.md`, in order, from the workspace root.

## License and contributor terms

The project is licensed under the GNU Affero General Public License, version 3 only. New source files carry `SPDX-License-Identifier: AGPL-3.0-only`.

Outside contributions will be accepted under a contributor license agreement. Its text will be published here before the repository opens to contributions; until then, pull requests cannot be merged. The rest of the contribution process (issues, pull requests, support channels) will be documented here at the same time.

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
