# Project status

Horizon runs locally in your browser with synthetic sample households, which you can edit; see [Setup](../README.md#setup). Nothing you enter is stored, and it is not deployed as a hosted service.

This page lists what works today and what is being built now. It is not a promise of features or dates.

## Works today

### Web app

| Capability | What it does | Details |
| --- | --- | --- |
| Start and guided setup | Pick a question and a sample household, edit it step by step, and review it. | [0002-W2](briefs/0002-W2-start-and-guided-setup.md) · `27f6986` |
| Input check | Mark entries as rough and see which ones could change the result. | [0002-W3](briefs/0002-W3-input-check.md) · `08f7869` |
| Plan screen | See whether savings last, what you can spend and what moves the result most, with charts and tables. | [0003-W2](briefs/0003-W2-plan-screen.md) · `f764456` |
| Try a change and compare | Make a copy of your plan with one change, such as retiring a year later, and compare the two side by side. | [0004-W1](briefs/0004-W1-compare-screen.md) · `eea96bd` |
| Engine in the browser | The calculation engine runs inside your browser, in a background worker. | [0002-W1](briefs/0002-W1-web-shell.md) · `52d8e58` |

### Calculation engine

| Capability | What it does | Details |
| --- | --- | --- |
| Engine foundations | Validates a synthetic single-filer household and projects it year by year, naming units, dollar basis and versions. | [0001-W1](briefs/0001-W1-engine-foundations.md) · `9d03ad6` |
| Yearly ledger | Shows each year's money in and out, required distributions and any shortfall; cash always balances. | [0001-W2](briefs/0001-W2-yearly-ledger.md) · `ae85e92` |
| Federal income tax | Computes federal income tax for a single filer, citing the rule and tax year for every line. | [0001-W3](briefs/0001-W3-federal-tax.md) · `1a25f73` |
| Comparison and export | Compares a changed copy with its baseline and exports a versioned file that reproduces the result. | [0001-W4](briefs/0001-W4-scenario-diff-and-export.md) · `a0a9769` |
| Answer operations | Finds sustainable spending, ranks one-change levers and rough inputs, and reports today's dollars. | [0003-W1](briefs/0003-W1-answer-operations.md) · `85f4c2e` |

Generated 2026-10-19 from the merged history of this repository.

## Being built now

Nothing in progress has been published. New work appears here once its brief is public.

Generated 2026-10-19 from the merged history of this repository.
