# Project status

This page lists what works today and what is being built now. It is not a promise of features or dates.

Generated 2026-10-18 from the merged history of this repository.

## Works today

### Calculation engine

- **Engine foundations:** A Rust calculation core loads a synthetic single-filer household, validates it and runs a year-by-year projection; every output names its units, dollar basis, model version and assumption sources. ([0001-W1](briefs/0001-W1-engine-foundations.md), `9d03ad6`)
- **Yearly ledger:** Each year shows money in and out, required distributions, which account covered any gap and where money ran out, with cash conserved exactly. ([0001-W2](briefs/0001-W2-yearly-ledger.md), `ae85e92`)
- **Federal income tax:** Federal income tax for a single filer, paid within each year; every tax line cites its rule and tax year and says whether it is published law or a projection. ([0001-W3](briefs/0001-W3-federal-tax.md), `1a25f73`)
- **Comparison and export:** Copy a plan, change inputs and compare every changed line; export a versioned file that reproduces the same result; native and WebAssembly results are identical. ([0001-W4](briefs/0001-W4-scenario-diff-and-export.md), `a0a9769`)
- **Answer operations:** Sustainable spending, ranked one-change levers and which rough inputs matter, with balances and shortfalls also in today's dollars. ([0003-W1](briefs/0003-W1-answer-operations.md), `85f4c2e`)

### Web app

- **Engine in the browser:** The engine runs in the browser inside a Web Worker and shows results for five synthetic sample households. ([0002-W1](briefs/0002-W1-web-shell.md), `52d8e58`)
- **Start and guided setup:** Pick a question and a sample household, edit it one short step at a time, and review it on one page. ([0002-W2](briefs/0002-W2-start-and-guided-setup.md), `27f6986`)
- **Input check:** Mark entries as rough and see which could change the result, ranked, with a plain note that this measures completeness, not likelihood. ([0002-W3](briefs/0002-W3-input-check.md), `08f7869`)
- **Plan screen:** A factual headline, three answers and savings over time in today's dollars, with levers, reasons, the yearly ledger and assumptions one click away, each as a chart and a table. ([0003-W2](briefs/0003-W2-plan-screen.md), `f764456`)

## Being built now

No milestone is in progress.
