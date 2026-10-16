// SPDX-License-Identifier: AGPL-3.0-only
#![allow(dead_code)]
use horizon_app::{Fixture, parse_fixture};
use std::path::PathBuf;
pub const VALID: &[&str] = &["synthetic-working", "synthetic-retired", "synthetic-leap"];
pub const INVALID: &[(&str, &str, u8)] = &[
    ("invalid-missing-field", "MISSING_FIELD", 1),
    ("invalid-negative-balance", "NEGATIVE_BALANCE", 1),
    ("invalid-end-before-start", "END_BEFORE_START", 1),
    ("invalid-account-type", "UNKNOWN_ACCOUNT_TYPE", 1),
    ("invalid-plan-end-age", "PLAN_END_AGE_REACHED", 1),
    ("two-person", "MULTIPLE_PERSONS_UNSUPPORTED", 2),
    ("invalid-date", "INVALID_DATE", 1),
    ("invalid-owner", "INVALID_OWNER", 1),
    ("invalid-cost-basis", "ACCOUNT_FIELDS", 1),
    ("invalid-rate", "INVALID_RATE", 1),
    ("invalid-missing-assumption", "MISSING_ASSUMPTION", 1),
    ("unsupported-state-tax", "FEATURE_UNSUPPORTED", 2),
    ("unsupported-healthcare", "FEATURE_UNSUPPORTED", 2),
    ("invalid-output-range", "MONEY_OUTPUT_RANGE", 1),
];
pub fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}
pub fn text(name: &str) -> String {
    std::fs::read_to_string(
        root()
            .join("packages/app/fixtures")
            .join(format!("{name}.json")),
    )
    .unwrap()
}
pub fn fixture(name: &str) -> Fixture {
    parse_fixture(&text(name)).unwrap()
}
