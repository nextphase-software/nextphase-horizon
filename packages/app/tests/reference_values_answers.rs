// SPDX-License-Identifier: AGPL-3.0-only
#[path = "../../parity/tests/support/answer_golden.rs"]
mod answer_golden;
#[path = "../../parity/tests/support/fixtures.rs"]
mod fixtures;
#[path = "../../parity/tests/support/answers.rs"]
mod reference;
#[test]
fn answers_sustainable_spending_reference() {
    reference::spending();
}
#[test]
fn answers_levers_reference() {
    reference::lever_values();
}
#[test]
fn answers_input_impact_reference() {
    reference::impact();
}
#[test]
fn answers_today_values_reference() {
    reference::today_values();
}
#[test]
fn answers_comparison_today_reference() {
    reference::comparison_today();
}
#[test]
fn answers_schemas_match_and_outputs_validate() {
    use horizon_app::schemas::*;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    for (name, schema, outputs) in [
        (
            "sustainable-spending",
            sustainable_spending_schema(),
            answer_golden::SPENDING
                .iter()
                .map(|p| p.1)
                .collect::<Vec<_>>(),
        ),
        (
            "levers",
            levers_schema(),
            answer_golden::LEVERS.iter().map(|p| p.1).collect(),
        ),
        (
            "input-impact",
            input_impact_schema(),
            vec![answer_golden::IMPACT],
        ),
    ] {
        let text =
            std::fs::read_to_string(root.join(format!("docs/model/schemas/{name}.v1.schema.json")))
                .unwrap();
        assert_eq!(
            text,
            format!("{}\n", serde_json::to_string_pretty(&schema).unwrap())
        );
        let validator = jsonschema::validator_for(&schema).unwrap();
        for text in outputs {
            let value: serde_json::Value = serde_json::from_str(text).unwrap();
            let errors: Vec<_> = validator
                .iter_errors(&value)
                .map(|e| e.to_string())
                .collect();
            assert!(errors.is_empty(), "{errors:?}");
        }
    }
}
