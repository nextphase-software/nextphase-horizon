# Architecture

This folder describes the system as it is built: `system-overview.md` for the module map, plus one document per contributor-facing contract (interfaces between packages, data schemas, calculation inputs and outputs).

Every document is dated at the top and is read from the current code. Keep the editable diagram source next to the Markdown.

The Rust workspace in `packages/` (`engine`, `app`, `cli` and `parity`) exists, but `system-overview.md` has not been written yet, so there is no overview and no contract document here. Calculation inputs, outputs and their JSON schemas are specified in `docs/model/`.
