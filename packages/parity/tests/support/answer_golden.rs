// SPDX-License-Identifier: AGPL-3.0-only
// Generated answer outputs, never edited by tests.
pub const SPENDING: &[(&str, &str)] = &[
    (
        "A-drawdown",
        include_str!("../../golden/A-drawdown.spend.json"),
    ),
    (
        "answers-cap",
        include_str!("../../golden/answers-cap.spend.json"),
    ),
    (
        "answers-underfunded",
        include_str!("../../golden/answers-underfunded.spend.json"),
    ),
    (
        "answers-working-61",
        include_str!("../../golden/answers-working-61.spend.json"),
    ),
    (
        "synthetic-retired",
        include_str!("../../golden/synthetic-retired.spend.json"),
    ),
];
pub const LEVERS: &[(&str, &str)] = &[
    (
        "A-drawdown",
        include_str!("../../golden/A-drawdown.levers.json"),
    ),
    (
        "answers-working-61",
        include_str!("../../golden/answers-working-61.levers.json"),
    ),
];
pub const IMPACT: &str = include_str!("../../golden/answers-working-61.impact.json");
