# Design references, version 1

Approved reference screens for the first web screens. Each HTML page shows three frames: desktop light, desktop dark, and phone (375 px) light. Append `#desktop-light`, `#desktop-dark` or `#phone-light` to its address to show one. Each PNG shows the desktop light frame as the screen first opens. Colors and type follow [DESIGN.md](../../../../DESIGN.md) (visual language, version 1). Figures are output of `horizon-engine-0.4.0` for the synthetic sample household "Single, 61, still working, plans to retire at 66".

| Screen | Files | Implemented by | Illustrative, do not ship |
| --- | --- | --- | --- |
| 1 Start: question and sample household | [01-start.html](01-start.html), [01-start.png](01-start.png) | Brief 0002-W2 | The Social Security claiming question is shown as not available; there is no claiming-age feature |
| 2 Guided setup, accounts step | [02-setup-accounts.html](02-setup-accounts.html), [02-setup-accounts.png](02-setup-accounts.png) | Brief 0002-W2 | Only the accounts step is drawn; brief 0002-W2 specifies the other steps |
| 3 Input check | [03-input-check.html](03-input-check.html), [03-input-check.png](03-input-check.png) | A later brief | The whole screen, until its brief exists |
| 4 Plan | [04-baseline.html](04-baseline.html), [04-baseline.png](04-baseline.png) | A later brief | The whole screen, until its brief exists |
| 5 Compare | [05-compare.html](05-compare.html), [05-compare.png](05-compare.png) | A later brief | The whole screen, until its brief exists |
| 6 Export | [06-export.html](06-export.html), [06-export.png](06-export.png) | A later brief | The whole screen, until its brief exists |

A screen's brief is the requirement; this reference shows the intended design. Where they differ, the brief wins and the difference is reported. The pages make no outside requests. They use Plus Jakarta Sans when it is installed and the system font otherwise; the PNGs show the intended rendering.
