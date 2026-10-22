# Design references, version 2

Approved reference screens for the question-led intake and the top of the results (brief 0002-W6). Each PNG is a full-page capture. Unless the file name says otherwise it shows the desktop frame (1280 px) in light; `-phone-light` is 375 px and `-desktop-dark` is the dark theme. Colors and type follow [DESIGN.md](../../../../DESIGN.md).

Figures are output of `horizon-engine-0.4.0` (`horizon intake`) for synthetic answers that describe the example household "Single, 61, still working, plans to retire at 66", taken from the [0002-W4](../../0002-W4-reference-values.json) and [0002-W5](../../0002-W5-reference-values.json) reference values. Questions show that household's answers as a person would type them. Screens 22–26 show the example households "Single, 61, still working, plans to retire at 66" and "Single, 70, retired" and copies made from them, with figures from `horizon-engine-0.4.0` (`horizon run`, `spend` and `levers`). A `-phone-light-2` file is the next screen down on a phone, where the navigation bar stays fixed at the bottom. Screens 29–34 show the same example households, "Single, 61, spending more than income", plans from the synthetic answers of the [0002-W5](../../0002-W5-reference-values.json) reference values (`v2-solve-retirement`, `v2-range-nothing-solved`), and copies made from them; the two PDFs are the printed summary on US Letter.

| Screen | Files |
| --- | --- |
| 1 Welcome | [01-welcome-phone-light.png](01-welcome-phone-light.png), [01-welcome.png](01-welcome.png) |
| 2 A question, one at a time: "not sure" and a range | [02-question-one-at-a-time-desktop-dark.png](02-question-one-at-a-time-desktop-dark.png), [02-question-one-at-a-time-phone-light.png](02-question-one-at-a-time-phone-light.png), [02-question-one-at-a-time.png](02-question-one-at-a-time.png) |
| 3 A question in the conversation style | [03-question-conversation.png](03-question-conversation.png) |
| 4 A section in the guided-page style | [04-question-guided-page.png](04-question-guided-page.png) |
| 5 "I'll add this later" | [05-add-later.png](05-add-later.png) |
| 6 Review your answers | [06-review.png](06-review.png) |
| 7 Results: a plan with an answer left out | [07-results-plan-phone-light.png](07-results-plan-phone-light.png), [07-results-plan.png](07-results-plan.png) |
| 8 Results: savings worked out | [08-results-worked-out.png](08-results-worked-out.png) |
| 9 Results: one more answer needed | [09-results-one-more-answer.png](09-results-one-more-answer.png) |
| 10 Results: a range | [10-results-range.png](10-results-range.png) |
| 11 Results: Horizon can't plan for this yet | [11-results-cant-plan.png](11-results-cant-plan.png) |
| 12 What if: the panel as it opens | [12-what-if-start.png](12-what-if-start.png) |
| 13 What if: spending changed to $80,000 | [13-what-if-changed.png](13-what-if-changed.png), [13-what-if-changed-phone-light.png](13-what-if-changed-phone-light.png), [13-what-if-changed-desktop-dark.png](13-what-if-changed-desktop-dark.png) |
| 14 Plain results: the plan | [14-plan.png](14-plan.png), [14-plan-phone-light.png](14-plan-phone-light.png), [14-plan-desktop-dark.png](14-plan-desktop-dark.png); details for experts open: [14-plan-experts.png](14-plan-experts.png) |
| 15 Plain results: compare | [15-compare.png](15-compare.png), [15-compare-phone-light.png](15-compare-phone-light.png), [15-compare-desktop-dark.png](15-compare-desktop-dark.png); details for experts open: [15-compare-experts.png](15-compare-experts.png) |
| 16 Plain results: export | [16-export.png](16-export.png); details for experts open: [16-export-experts.png](16-export-experts.png) |
| 17 Plain results: your own figures with ranges | [17-own-ranges.png](17-own-ranges.png), [17-own-ranges-phone-light.png](17-own-ranges-phone-light.png), [17-own-ranges-desktop-dark.png](17-own-ranges-desktop-dark.png) |
| 18 Plain results: navigation and footer | [18-nav.png](18-nav.png), [18-footer.png](18-footer.png) |
| 22 Plan layout: the Plan page, savings run short | [22-plan-home.png](22-plan-home.png), [22-plan-home-phone-light.png](22-plan-home-phone-light.png), [22-plan-home-phone-light-2.png](22-plan-home-phone-light-2.png), [22-plan-home-desktop-dark.png](22-plan-home-desktop-dark.png) |
| 22b Plan layout: the Plan page, savings last | [22b-plan-home-room.png](22b-plan-home-room.png), [22b-plan-home-room-phone-light.png](22b-plan-home-room-phone-light.png), [22b-plan-home-room-phone-light-2.png](22b-plan-home-room-phone-light-2.png), [22b-plan-home-room-desktop-dark.png](22b-plan-home-room-desktop-dark.png) |
| 22c Plan layout: a copy viewed as a full plan | [22c-plan-viewing-copy.png](22c-plan-viewing-copy.png), [22c-plan-viewing-copy-phone-light.png](22c-plan-viewing-copy-phone-light.png), [22c-plan-viewing-copy-phone-light-2.png](22c-plan-viewing-copy-phone-light-2.png), [22c-plan-viewing-copy-desktop-dark.png](22c-plan-viewing-copy-desktop-dark.png) |
| 23 Plan layout: a year chosen, the year savings run short | [23-year-slider.png](23-year-slider.png), [23-year-slider-phone-light.png](23-year-slider-phone-light.png), [23-year-slider-desktop-dark.png](23-year-slider-desktop-dark.png) |
| 23b Plan layout: a year chosen, the retirement year | [23b-year-slider-retire.png](23b-year-slider-retire.png) |
| 24 Plan layout: Overview, savings run short | [24-overview.png](24-overview.png), [24-overview-phone-light.png](24-overview-phone-light.png), [24-overview-phone-light-2.png](24-overview-phone-light-2.png), [24-overview-desktop-dark.png](24-overview-desktop-dark.png) |
| 24b Plan layout: Overview, savings last | [24b-overview-room.png](24b-overview-room.png), [24b-overview-room-phone-light.png](24b-overview-room-phone-light.png), [24b-overview-room-phone-light-2.png](24b-overview-room-phone-light-2.png), [24b-overview-room-desktop-dark.png](24b-overview-room-desktop-dark.png) |
| 26 Plan layout: the navigation bar on a phone | [26-phone-nav.png](26-phone-nav.png), [26b-phone-nav-overview.png](26b-phone-nav-overview.png), [26c-phone-nav-dark.png](26c-phone-nav-dark.png) |
| 29 Options: the Plan page, savings run short | [29-plan-options.png](29-plan-options.png), [29-plan-options-phone-light.png](29-plan-options-phone-light.png), [29-plan-options-phone-light-2.png](29-plan-options-phone-light-2.png), [29-plan-options-desktop-dark.png](29-plan-options-desktop-dark.png) |
| 29b Options: the Plan page, savings last | [29b-plan-room.png](29b-plan-room.png), [29b-plan-room-phone-light.png](29b-plan-room-phone-light.png), [29b-plan-room-phone-light-2.png](29b-plan-room-phone-light-2.png), [29b-plan-room-desktop-dark.png](29b-plan-room-desktop-dark.png) |
| 29c Options: no change fixes this | [29c-plan-no-fix.png](29c-plan-no-fix.png) |
| 29d Details for experts: every change Horizon tried | [29d-experts-every-change.png](29d-experts-every-change.png) |
| 29e Options: the Plan page after three copies | [29e-plan-with-copies.png](29e-plan-with-copies.png) |
| 30 Options: Overview, savings run short | [30-overview-options.png](30-overview-options.png), [30-overview-options-phone-light.png](30-overview-options-phone-light.png), [30-overview-options-phone-light-2.png](30-overview-options-phone-light-2.png), [30-overview-options-desktop-dark.png](30-overview-options-desktop-dark.png) |
| 30b Options: Overview, savings last | [30b-overview-room.png](30b-overview-room.png), [30b-overview-room-phone-light.png](30b-overview-room-phone-light.png), [30b-overview-room-phone-light-2.png](30b-overview-room-phone-light-2.png), [30b-overview-room-desktop-dark.png](30b-overview-room-desktop-dark.png) |
| 30c Options: Overview after three copies | [30c-overview-with-copies.png](30c-overview-with-copies.png) |
| 31 Compare: your plan and three copies side by side | [31-compare-side-by-side.png](31-compare-side-by-side.png), [31-compare-side-by-side-phone-light.png](31-compare-side-by-side-phone-light.png), [31-compare-side-by-side-desktop-dark.png](31-compare-side-by-side-desktop-dark.png) |
| 32 Summary: the screen and the printed summary on one page | [32-summary-screen.png](32-summary-screen.png), [32-summary.png](32-summary.png), [32-summary.pdf](32-summary.pdf) |
| 32b Summary: a printed summary on two pages | [32b-summary-two-pages.png](32b-summary-two-pages.png), [32b-summary-two-pages.pdf](32b-summary-two-pages.pdf) |
| 33 A worked-out answer: Overview and the Plan page end with what to do next | [33-worked-out-overview.png](33-worked-out-overview.png), [33-worked-out-plan.png](33-worked-out-plan.png) |
| 34 Options for your own figures with ranges | [34-own-ranges-overview.png](34-own-ranges-overview.png), [34-own-ranges-plan.png](34-own-ranges-plan.png) |

A screen's brief is the requirement; these references show the intended design. Where they differ, the brief wins and the difference is reported. Screens 1–11 are implemented by brief 0002-W6, screens 12–13 by brief 0002-W7 (the what-if panel), screens 14–18 by brief 0003-W3 (plain results), screens 22–24 and 26 by brief 0003-W4 (plan layout), which lists the parts of them that a later build delivers, and screens 29–34 by brief 0003-W5 (options, side-by-side compare and a printable summary). Not shown: "Show all questions on one page".
