// SPDX-License-Identifier: AGPL-3.0-only
#![forbid(unsafe_code)]
//! Browser bindings. All calculation and canonical serialization remain in the app.
use horizon_app::{self as app, json::encode, parse_fixture};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn run(fixture: &str) -> String {
    encode(parse_fixture(fixture).and_then(|f| app::run_fixture(&f)))
}
#[wasm_bindgen]
pub fn scenario(fixture: &str, changes: &str) -> String {
    encode(parse_fixture(fixture).and_then(|f| app::scenario(&f, &app::json::changes(changes)?)))
}
#[wasm_bindgen]
pub fn compare(baseline: &str, scenario: &str) -> String {
    encode(app::compare::compare_documents(baseline, scenario))
}
#[wasm_bindgen]
pub fn export_run(fixture: &str) -> String {
    encode(parse_fixture(fixture).and_then(|f| app::export(&f)))
}
#[wasm_bindgen]
pub fn import_run(export: &str) -> String {
    encode(app::import(export))
}
#[wasm_bindgen]
pub fn sustainable_spending(fixture: &str) -> String {
    encode(parse_fixture(fixture).and_then(|f| app::sustainable_spending(&f)))
}
#[wasm_bindgen]
pub fn levers(fixture: &str) -> String {
    encode(parse_fixture(fixture).and_then(|f| app::levers(&f)))
}
#[wasm_bindgen]
pub fn input_impact(fixture: &str, rough: &str) -> String {
    // Match the CLI's rough-input parse precedence.
    encode(app::json::rough(rough).and_then(|r| app::input_impact(&parse_fixture(fixture)?, &r)))
}

#[wasm_bindgen]
pub fn plan_from_answers(answers: &str) -> String {
    encode(Ok(app::plan_from_answers_json(answers)))
}

#[cfg(test)]
mod tests {
    use super::*;
    const VALID: &str = include_str!("../../app/fixtures/synthetic-retired.json");
    const INVALID: &str = include_str!("../../app/fixtures/two-person.json");

    #[test]
    fn all_exports_equal_application_bytes_valid_and_invalid() {
        for text in [VALID, INVALID] {
            assert_eq!(
                run(text),
                encode(parse_fixture(text).and_then(|f| app::run_fixture(&f)))
            );
            assert_eq!(
                scenario(text, "[]"),
                encode(parse_fixture(text).and_then(|f| app::scenario(&f, &[])))
            );
            assert_eq!(
                compare(text, VALID),
                encode(app::compare::compare_documents(text, VALID))
            );
            assert_eq!(
                export_run(text),
                encode(parse_fixture(text).and_then(|f| app::export(&f)))
            );
            assert_eq!(
                sustainable_spending(text),
                encode(parse_fixture(text).and_then(|f| app::sustainable_spending(&f)))
            );
            assert_eq!(
                levers(text),
                encode(parse_fixture(text).and_then(|f| app::levers(&f)))
            );
            assert_eq!(
                input_impact(text, "[]"),
                encode(parse_fixture(text).and_then(|f| app::input_impact(&f, &[])))
            );
        }
        let export = export_run(VALID);
        for text in [export.as_str(), "{}"] {
            assert_eq!(import_run(text), encode(app::import(text)));
        }
    }

    #[test]
    fn intake_export_matches_application_bytes_for_all_result_states() {
        let template = r#"{"format":"horizon-answers","version":1,"valuation_date":"2026-01-01","planning":"alone","birth_date":{"date":"1960-01-01"},"retired":true,"savings":{"none":true},"social_security":{"expects":"no"},"pension":{"expects":"no"},"spending_in_retirement":{"cents":0}}"#;
        for text in [
            template.to_string(),
            template.replace("alone", "partner"),
            template.replace(r#"{"date":"1960-01-01"}"#, r#"{"later":true}"#),
            template.replace(r#""cents":0"#, r#""cents":-1"#),
            "{}".into(),
        ] {
            assert_eq!(
                plan_from_answers(&text),
                encode(Ok(app::plan_from_answers_json(&text)))
            );
        }
    }

    #[test]
    fn malformed_arguments_and_compare_precedence_are_envelopes() {
        let error = run("{}");
        assert_eq!(sustainable_spending("{}"), error);
        assert_eq!(levers("{}"), error);
        assert_eq!(export_run("{}"), error);
        assert_eq!(input_impact("{}", "[]"), error);
        assert_eq!(scenario("{}", "[]"), error);
        assert_eq!(compare("{}", INVALID), run(INVALID));
        assert_eq!(input_impact(VALID, "{}"), encode(app::json::rough("{}")));
        assert_eq!(scenario(VALID, "{}"), encode(app::json::changes("{}")));
    }
}
