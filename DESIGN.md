# NextPhase Horizon design and engineering guardrails

- Status: initial baseline; visual design tokens not yet defined
- Date: 2026-10-13

These rules apply to every change. Implementation briefs copy the applicable ones verbatim.

## Do's and Don'ts

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Do** enforce tenant, role, and household authorization on every applicable server operation, document access, and export; test cross-tenant denial.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Visual language

Colors, typography, spacing, layout, elevation, shapes and component tokens are not defined yet. They are established here before any production interface is implemented. Until then, no interface work is in scope.
