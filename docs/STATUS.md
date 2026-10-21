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
| Export and reopen | Print or save a one-page summary, download a plan file, and reopen a file after Horizon checks and reruns it. | [0005-W1](briefs/0005-W1-export-screen.md) · `b2097dd` |
| Screen tidy-up | Clearer answers when the plan ends before retirement or savings run short before it, chart labels beside their markers, and export screen fixes. | [0005-W2](briefs/0005-W2-tidy-up.md) · `a133c7d` |
| Engine in the browser | The calculation engine runs inside your browser, in a background worker. | [0002-W1](briefs/0002-W1-web-shell.md) · `52d8e58` |
| Answer in your own words | Enter your own figures through plain questions in one of three styles, as a figure, a range or "not sure", leave any for later, and keep your answers on your device until you forget them. | [0002-W6](briefs/0002-W6-intake-screens.md) · `2ae5254` |
| Try what-ifs on your plan | Move sliders for retirement age, spending, savings, Social Security, pension, investment growth and price rises to see your plan again, then reset or keep the change as your answers. | [0002-W7](briefs/0002-W7-what-if-panel.md) · `fd66f49` |
| Plain results | The plan, comparison and export speak in today's dollars and plain words, open with one clear answer, keep the year-by-year numbers in a details section for experts, and say which of your answers could change the result. | [0003-W3](briefs/0003-W3-plain-results.md) · `a7f0939` |

### Calculation engine

| Capability | What it does | Details |
| --- | --- | --- |
| Engine foundations | Validates a synthetic single-filer household and projects it year by year, naming units, dollar basis and versions. | [0001-W1](briefs/0001-W1-engine-foundations.md) · `9d03ad6` |
| Yearly ledger | Shows each year's money in and out, required distributions and any shortfall; cash always balances. | [0001-W2](briefs/0001-W2-yearly-ledger.md) · `ae85e92` |
| Federal income tax | Computes federal income tax for a single filer, citing the rule and tax year for every line. | [0001-W3](briefs/0001-W3-federal-tax.md) · `1a25f73` |
| Comparison and export | Compares a changed copy with its baseline and exports a versioned file that reproduces the result. | [0001-W4](briefs/0001-W4-scenario-diff-and-export.md) · `a0a9769` |
| Answer operations | Finds sustainable spending, ranks one-change levers and rough inputs, and reports today's dollars. | [0003-W1](briefs/0003-W1-answer-operations.md) · `85f4c2e` |
| Incomplete answers and ranges | Builds a plan from answers that are a figure, a range or not known yet, says what is still needed or left out, and shows how far a range can move the result. | [0002-W4](briefs/0002-W4-answers-to-plan.md) · `ccf0e4c` |
| Worked-out answers and what-if | When savings, spending in retirement or a retirement age is not known yet, works out the one that is missing, accepts an age instead of a date of birth, and recalculates the plan for any changed answer. | [0002-W5](briefs/0002-W5-reverse-answers.md) · `f3d9f44` |

Generated 2026-10-20 from the merged history of this repository.

## Being built now

Nothing in progress has been published. New work appears here once its brief is public.

Generated 2026-10-20 from the merged history of this repository.
