BRIEF VERSION: 0002-W2 v1 (2026-10-18)

# 0002-W2 — Start screen and guided household setup

## Outcome

A person opens Horizon and sees what it can answer and five synthetic sample households, each with the status the engine reports. They pick a question and a household and continue into a guided setup: one short step at a time (about you, income, accounts, spending, assumptions), then one page reviewing every answer. Any value they are unsure of can be marked rough. Checking the household runs the engine on exactly what they entered and shows the result honestly, or the engine's error. Nothing is stored: reloading or closing the page clears everything.

This milestone builds screens 1 and 2 of the design references. The input check, the plan, comparison and export screens come in later milestones.

## Deliverables

1. **Design references** in `docs/briefs/assets/design-v1/`:
   - the six reference screens, each as an HTML page (`01-start.html`, `02-setup-accounts.html`, `03-input-check.html`, `04-baseline.html`, `05-compare.html`, `06-export.html`) with three frames (desktop light, desktop dark, phone at 375 px), plus a PNG of each desktop-light frame;
   - a `README.md` naming each screen, which brief implements it, and which parts are illustrative and must not ship (listed in deliverable 1's table below).

   This milestone implements **screens 1 and 2**. Screens 3–6 are references for later briefs and must not be built here.

   | Screen | Implemented by | Illustrative, do not ship |
   | --- | --- | --- |
   | 1 Start | 0002-W2 | The "When should I claim Social Security?" question is shown as not available; no claiming-age feature |
   | 2 Setup, accounts | 0002-W2 | Only the Accounts step is drawn; the other steps follow the same pattern, specified below |
   | 3–6 | Later briefs | Everything; not built in this milestone |

2. **DESIGN.md principles.** `DESIGN.md` gains the section "Principles for screens", committed with this brief:
   - **Simple by default, detail on demand:** each screen opens with one plain sentence generated from the engine result, and a picture where one helps. Everything else sits in labelled sections that open on request.
   - **Factual headlines:** headlines state results ("Savings run short at 93, two years before the plan ends") and never judge them; no invented thresholds.
   - **A chart view for data tables** that share one unit: chart by default, table one click away. Every chart keeps its table alternative.

   The implementation follows these for screens 1 and 2.

3. **Start screen** (reference screen 1), replacing the sample-household page of 0002-W1:
   - **Step bar:** Question, Household, Check, Plan, Compare, Export. In this milestone only Question and Household are active. The other four are shown and visibly marked "not available yet". They are not links or buttons, so keyboard focus skips them.
   - **Intro sentence,** generated from the engine statuses of the five samples, for example "The engine gives a full result for two of these five sample households, a partial one for two, and none for the couple (only one person is supported)." The counts come from the engine, never hard-coded.
   - **"Your question":** a native radio group of three questions. "Can I afford to retire when I want to?" and "How much can I spend each year?" are marked Supported; the first is chosen by default. "When should I claim Social Security?" is shown disabled with "Not available yet" and the reason: claiming-age rules are not modelled.
   - **"Start from a sample household":** a native radio group of the five 0002-W1 samples with their exact labels, each showing the status the engine returns for it:
     - "Supported" for complete;
     - "Partial (N omissions)" for partial, N being the engine's omission count;
     - "Unsupported" for an unsupported error.

     A one-line note appears when the engine reports a flag or an unsupported reason. Statuses come from one `sustainable_spending` call per sample through the worker.
   - **Collapsed sections:** "What the statuses mean", and "What the selected household's result leaves out" (the engine's omission list for the selected sample).
   - **Continue** opens the guided setup for the selected household, with a short line saying the setup goes step by step and ends with a review of every answer. For the couple (Unsupported), Continue is disabled and the reason is shown: Horizon plans for one person only.
4. **Guided setup** (reference screen 2):
   - **Step list** (left on desktop, top on phone): About you, Income, Accounts, Spending, Assumptions, Review your answers. Visited steps show a tick. **Back** and **Continue** move one step; any visited step can be reopened from the list.
   - **Heading:** the sample's label, for example "Single, 61, still working, plans to retire at 66".
   - **Privacy note, exactly:** "Your answers stay in this page only. Reload or close it and they're gone."
   - **Fields,** prefilled from the selected sample. Each edits exactly one place in the household input or assumptions:

     | Step | Field | Household input path | Notes |
     | --- | --- | --- | --- |
     | About you | Birth date | `/household/persons/0/birth_date` | Date |
     | About you | Retirement date | `/household/persons/0/retirement_date` | Date |
     | About you | Plan to age | `/household/persons/0/plan_end_age` | Whole number |
     | About you | Values as of | `/household/valuation_date` | Read-only |
     | Income | Wages per year | `/household/income/wages/0/amount/cents` | Only when the sample has a wage entry |
     | Income | Wages end on my retirement date | `/household/income/wages/0/end_date` | Checkbox. Checked when the sample's end date equals the retirement date; while checked, the end date is kept equal to the retirement date; unchecked, it is its own date field |
     | Income | Social Security per year | `/household/income/social_security/amount/cents` | |
     | Income | Social Security starts at age | `/household/income/social_security/start_age` | Whole number |
     | Income | Pension per year | `/household/income/pension/amount/cents` | |
     | Income | Pension starts at age | `/household/income/pension/start_age` | Whole number |
     | Accounts | Account type | `/household/accounts/<i>/account_type` | Cash, Brokerage (taxable), Tax-deferred, Roth |
     | Accounts | Balance today | `/household/accounts/<i>/opening_balance_cents` | |
     | Accounts | Cost basis | `/household/accounts/<i>/cost_basis_cents` | Taxable accounts only; `null` otherwise |
     | Accounts | Plan kind | `/household/accounts/<i>/tax_deferred_kind` | Tax-deferred only: "Workplace plan, such as a 401(k)" (`employer_plan`) or "Traditional IRA" (`traditional_ira`); `null` otherwise |
     | Spending | Spending per year before retirement | `/household/spending/before_retirement/cents` | |
     | Spending | Spending per year after retirement | `/household/spending/after_retirement/cents` | |
     | Assumptions | Inflation, investment return, cash return, tax-threshold indexing | `/assumptions/<identifier>/value` | Percent per year |

   - **Every amount** shows its dollar basis next to it ("today's dollars" or "nominal dollars"), kept from the sample unchanged. Every field without an obvious meaning gets one short explanation line; the reference shows the cost-basis explanation.
   - **Accounts:**
     - "Edit type" changes an account's type, setting or clearing cost basis and plan kind as in the table;
     - "Add an account" appends a cash account with balance $0, owned by the sample's person, with an id `account-N` that does not collide with existing ids;
     - removing accounts is not in this milestone.
   - **Rough marker:** each amount, cost basis and assumption rate can be marked "Rough". Only fields with an engine default range (`docs/model/answers.md`, "Rough-input impact") are eligible; dates and ages are not. Rough marks are kept in memory as a list of the household input paths above, for the next milestone's input check, and are shown on the review page.
   - **Review your answers:** every field grouped by step, each group with an Edit link that opens that step, and rough marks shown. The button **"Check this household"** sends the edited input through the worker to `sustainable_spending`:
     - **on success,** the 0002-W1 result view: status word with its icon, sustainable spending, entered spending and headroom in today's dollars a year, any flag in words, and the omission list;
     - **on an error envelope,** the status word and the engine's message with no figures, plus Edit links to every step.
   - **Navigation:** Back from the first setup step returns to the Start screen, keeping the choices. Choosing a different household on the Start screen discards edits after a confirmation that names what will be lost.
5. **Entry parsing**, exact and without floating point. The interface converts what a person types into the input format; it never computes financial values.
   - **Dollars:** whole dollars, optional "$" and thousands commas, no decimals, no sign. `150,000` becomes `15000000` cents by appending "00" to the digits. Anything else shows a field message ("Enter a whole-dollar amount, like 150,000") and blocks Continue on that step.
   - **Percent:** up to two decimal places, no sign, at most 100. `2.5` becomes `"0.025"` by exact decimal string shifting. The value is written in the same format as the sample (minimal decimal string, no trailing zeros, "0" for zero).
   - **Whole numbers:** digits only.
   - **Dates:** the browser's date input, `YYYY-MM-DD`.
   - **The engine stays the only validator of meaning** (for example a retirement date before the valuation date). Its errors reach the person through "Check this household".
6. **State:** in memory only, as in 0002-W1. The theme behaviour, CSP, worker protocol, tokens and focus ring are unchanged.

## Done when

1. **Design references:** the six HTML pages and six PNGs are present and match the approved references. The HTML makes no outside requests (no font service) and starts with an SPDX line.
2. **Start screen:** in all three browsers, both sizes and both themes:
   - the five samples show the engine's statuses and omission counts;
   - the intro sentence's counts match;
   - the claiming-age question cannot be chosen;
   - the couple cannot continue and says why;
   - the not-yet-available steps are marked and skipped by keyboard focus.
3. **Guided setup:** keyboard-only, a person can choose the working sample, step through every setup step, change the 401(k) balance to 600,000, mark it rough, change inflation to 3, reach the review page, see both edits and the rough mark, and check the household.
4. **Parity:** the result shown for that edited household equals the native engine's `sustainable_spending` output for `packages/app/test-data/web-edited-working-61.json`. That file is `answers-working-61` with only `/household/accounts/2/opening_balance_cents` set to `60000000` and `/assumptions/inflation/value` set to `"0.03"`. Expected values (native engine `horizon-engine-0.4.0`, verified 2026-10-18): sustainable spending **$64,654**, entered **$67,000**, headroom **−$2,346**, status **Partial (5 omissions)**, no flag. The higher balance is outweighed by the higher inflation. The browser's `run` output for the five samples stays byte-identical to the committed goldens, as in 0002-W1.
5. **Errors:** with "Wages end on my retirement date" checked, setting the retirement date to 2025-06-01 (before the wages start on 2026-01-01) leads to the engine's invalid envelope `END_BEFORE_START` ("Wage end date precedes its start date.") on check. The status word and that message appear with no figures.
6. **Parsing:** unit tests cover dollars (commas, "$", rejections), percent (0, 2.5, 3, 12.25, 100 and rejections) and the exact strings written.
7. **Privacy and accessibility:** no storage, cookies or off-origin requests; axe reports no violations; no horizontal page scroll at 375 px. This holds on every step and on the review page.
8. **Earlier guarantees hold:**
   - all Rust validation passes unchanged;
   - the licence checks pass with no new dependency;
   - no earlier reference file, schema or golden changes;
   - no new top-level entry.

## Read first

- `DESIGN.md` (Visual language, version 1, and the new "Principles for screens"), `AGENTS.md`.
- The design references in `docs/briefs/assets/design-v1/` (screens 1 and 2, and the README).
- `docs/model/answers.md` ("Rough-input impact"), `docs/model/scenario-diff-and-export.md` (input paths), `docs/model/error-codes.md`, and the household-input schema in `docs/model/schemas/`.
- `docs/architecture/web-shell.md` and brief 0002-W1.
- Public references, retrieved 2026-10-18:
  - WCAG 2.2: https://www.w3.org/TR/WCAG22/
  - WAI-ARIA radio group pattern: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
  - MDN date input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date

## Guardrails

- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Validation

The 0002-W1 sequence in `AGENTS.md`, unchanged, including `corepack pnpm exec playwright install chromium firefox webkit` and `corepack pnpm run e2e` in all three browsers, plus:

- `cargo run -p horizon-cli -- spend packages/app/test-data/web-edited-working-61.json`. Record its output; it must match the browser assertion of Done when 4.

Record `node --version`, `corepack pnpm --version`, the Playwright browser versions and the e2e project count.

## Exclusions

- **Screens 3–6:** later milestones (input check, plan, comparison, export).
- **Removing accounts; editing the withdrawal order; more than one wage entry:** later. The sample's withdrawal order is kept unchanged.
- **Saving progress, accounts and sign-in:** plan 0006. Nothing persists here.
- **A "show everything" entry mode:** deferred. The review page serves experienced users.
- **The printed summary and charts:** later screens.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
