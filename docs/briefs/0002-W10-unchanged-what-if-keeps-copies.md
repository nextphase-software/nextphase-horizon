BRIEF VERSION: 0002-W10 v1 (2026-10-22)

# 0002-W10 — Leaving a what-if control unchanged keeps your copies

## Outcome

In a plan from the person's own figures, leaving a what-if number box or releasing a slider without changing its value does nothing. The same holds for **Reset to my answers** when there is nothing to reset. Today each of these sends the answers' plan back to the app as a new result, and the app clears every copy: copies made with "Try this" or "Try a change" vanish from "Your plans", the switcher and side-by-side Compare without a word. A person who only presses Tab through the panel loses them.

## Terms

- **Plan on screen:** the result the own-figures head and plan body show: the result of the person's answers, or a what-if result (brief 0002-W7).
- **Values on screen:** the what-if changes behind the plan on screen. For the result of the answers this is no change at all.
- **Commit:** the moments brief 0002-W7 deliverable 3 sends a what-if: a slider released (pointer up, or a key released) and a number box committed (Enter, or leaving it).
- **Settled:** no calculation is waiting and none has failed ("Calculation unavailable").

## Deliverables

1. **An unchanged commit does nothing.** While the panel is settled, a commit whose changes, taken together with every other control, equal the values on screen does nothing. That means no `plan_from_answers` request, no "Working out your plan…", and no new result passed to the app. Copies, the shown plan, the switcher, "Your plans", Compare, the summary's answers and keyboard focus all stay as they are. A value counts as unchanged when it equals the control's value on screen as a number (so `67000` and `67000.00` are the same). This covers:
   - leaving an untouched box, with or without a what-if on screen;
   - Enter in an untouched box;
   - releasing a slider at its value on screen (for example, a pointer press and release without moving, or a key that does not move it);
   - dragging a slider away and back to its value on screen before releasing. The panel then shows the plan on screen, with no "What if: not your answers" tag when that is the result of the answers, and **Keep these as my answers** stays disabled.
2. **A changed commit behaves as today.** A commit whose changes differ from the values on screen is sent exactly as brief 0002-W7 deliverable 3 says. That includes moving every control back to its starting value after a what-if was shown, which shows the result of the answers again. As today, a new result on screen clears the copies (brief 0003-W4: "a changed input"), because copies are made from the plan they were tried on.
3. **Waiting and failed states behave as today.** While a calculation is waiting, or after "Calculation unavailable", commits behave exactly as they do now: a commit after a failure tries again. This brief changes the settled state only.
4. **Reset with nothing to reset keeps copies.** **Reset to my answers** always sets every control back to its starting value and clears any invalid text and its message under a box. It shows the result of the answers and clears copies only when a what-if is on screen, waiting or failed. When the plan on screen is already the result of the answers and the panel is settled, Reset passes no new result to the app, and copies, the switcher, "Your plans" and Compare stay as they are.
5. **Tests.**
   - **`src/WhatIfPlan.test.tsx`:** for each case in deliverable 1, and for Reset with nothing to reset, the engine is not called and the app's input callback is not called. The changed cases of deliverable 2 still call both once. The waiting and failed cases of deliverable 3 keep their current tests.
   - **An app-level unit test in `src/Options.test.tsx`:** load `0002-W5/v2-range-nothing-solved` as the person's own figures and make two copies through "Try this: Spend $64,994 a year in retirement" and "Try this: Retire a year later, at 67". Back on Plan, leave every one of the seven number boxes untouched (focus, then blur), press Enter in one, release one slider without moving it, and press **Reset to my answers**. Then "Your plans" still lists both copies in the order made, the button reads "Compare 3 plans", and Compare's h1 is "Your plan and 2 copies, side by side". The same test then changes one value (retirement age 66 to 67 by its number box), sees the what-if result, and sees the copies cleared ("Your plans" is no longer on Plan, the switcher lists no copy and there is no "Compare 3 plans" button), proving deliverable 2.
   - **End-to-end, a new test in `e2e/what-if.spec.ts`:** the same household and the same two copies, made by keyboard. From the Plan page, press Tab through every slider and number box of the panel without changing anything, press Enter in the "Retire at" number box, and press **Reset to my answers**. Then assert by visible text that the switcher and "Your plans" still list both copies, that the Compare button reads "Compare 3 plans", and that Compare's h1 is "Your plan and 2 copies, side by side". It runs in all 8 projects with axe as the other what-if tests do.
   - **`e2e/options.spec.ts`:** remove the workaround in the own-figures flow that moves focus straight to the options heading after "Back to plan", along with its comment about blurring an unchanged what-if number. The flow then reaches the options by keyboard through the panel as a person would, and its existing checks (three copies, the Summary header row and "Your plan and 3 copies, side by side") pass unchanged.
6. **Documentation.** In `docs/architecture/web-shell.md`:
   - In the what-if section, after "a number box sends on Enter or blur after range validation", add: "A release or commit that leaves every control at the values behind the plan on screen sends nothing, and Reset with no what-if on screen only clears the controls."
   - Replace "Changing answers or keeping a what-if clears the copies." with "Changing answers, keeping a what-if, or showing a different what-if result (including going back to the result of the answers) clears the copies. A commit or reset that leaves the plan on screen as it is clears nothing."

## Done when

1. Each case of deliverable 1 and the Reset case of deliverable 4 makes no `plan_from_answers` request and leaves every copy in place, by the unit tests of deliverable 5.
2. A changed commit is sent once and its new result clears the copies, as before, by the same tests.
3. The new end-to-end test passes in all 8 projects, and the 0003-W5 own-figures flow passes without its workaround.
4. Every existing what-if, options, compare and plan-layout test passes. No assertion is removed or weakened; any test changed other than those named here is listed with its reason in the implementation record.
5. Engine code, schemas, references, goldens and every expected-text file are unchanged. No dependency is added. The only source changes are under `apps/web/src/` and `apps/web/e2e/`, plus the documentation of deliverable 6.

## Read first

- `AGENTS.md`, `docs/architecture/web-shell.md`.
- Briefs `0002-W7-what-if-panel.md` (deliverables 3 and 5), `0003-W4-plan-layout-and-overview.md` (copies cleared by a changed input) and `0003-W5-options-compare-and-summary.md` (deliverables 4 and 6: "Your plans" and side-by-side Compare).
- `apps/web/src/WhatIfPlan.tsx` and the what-if callback in `apps/web/src/App.tsx`.

## Guardrails

- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Do** keep responsive web layouts, keyboard access, and light/dark states reviewable.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.

## Validation

The web shell sequence in `AGENTS.md`, from `cargo test -p horizon-wasm` through `corepack pnpm run licenses`, including `corepack pnpm exec playwright install chromium webkit` and `corepack pnpm run e2e` in the 8 projects. Record `node --version`, `corepack pnpm --version`, the browser versions and the e2e project and test counts. Run the unit tests twice and record both counts.

## Exclusions

- **The Rust sequence and the deploy-tooling block:** this brief changes no Rust, engine, schema, reference, golden or deploy file; Done when 5 proves it with `git diff --stat main`.
- **Any change to what a changed what-if does,** to the waiting or failed states, or to which actions clear copies, beyond deliverables 1 and 4.
- **Keeping copies across a changed what-if:** copies are made from the plan they were tried on, so a new plan on screen still clears them.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool and browser versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
