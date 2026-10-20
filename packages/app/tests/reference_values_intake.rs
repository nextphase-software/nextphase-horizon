// SPDX-License-Identifier: AGPL-3.0-only
#[path = "../../parity/tests/support/intake.rs"]
mod reference;
#[test]
fn intake_every_reference_case() {
    reference::reference_values();
}
#[test]
fn intake_schemas_match_and_every_result_validates() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    for (name, schema) in [
        ("answers", horizon_app::schemas::answers_schema()),
        ("answers-plan", horizon_app::schemas::answers_plan_schema()),
    ] {
        assert_eq!(
            std::fs::read_to_string(root.join(format!("docs/model/schemas/{name}.v1.schema.json")))
                .unwrap(),
            format!("{}\n", serde_json::to_string_pretty(&schema).unwrap())
        );
        let validator = jsonschema::validator_for(&schema).unwrap();
        for (case, value) in reference::cases().as_object().unwrap() {
            let output = horizon_app::plan_from_answers_json(&value["answers"].to_string());
            let value = if name == "answers" {
                value["answers"].clone()
            } else {
                serde_json::to_value(output).unwrap()
            };
            let errors: Vec<_> = validator
                .iter_errors(&value)
                .map(|e| e.to_string())
                .collect();
            assert!(errors.is_empty(), "{case}: {errors:?}");
        }
    }
}

#[path = "../../parity/tests/support/intake_v2.rs"]
mod reference_v2;
#[test]
fn intake_v2_every_reference_case() {
    reference_v2::reference_values();
}
#[test]
fn intake_v2_schemas_match_and_every_result_validates() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    for (name, schema) in [
        ("answers", horizon_app::schemas::answers_schema_v2()),
        (
            "answers-plan",
            horizon_app::schemas::answers_plan_schema_v2(),
        ),
    ] {
        assert_eq!(
            std::fs::read_to_string(root.join(format!("docs/model/schemas/{name}.v2.schema.json")))
                .unwrap(),
            format!("{}\n", serde_json::to_string_pretty(&schema).unwrap())
        );
        let validator = jsonschema::validator_for(&schema).unwrap();
        for (case, value) in reference_v2::cases().as_object().unwrap() {
            if value["answers"]["version"] != 2 {
                continue;
            }
            let output = horizon_app::plan_from_answers_json(&value["answers"].to_string());
            let value = if name == "answers" {
                value["answers"].clone()
            } else {
                serde_json::to_value(output).unwrap()
            };
            let errors: Vec<_> = validator
                .iter_errors(&value)
                .map(|e| e.to_string())
                .collect();
            assert!(errors.is_empty(), "{case}: {errors:?}");
        }
    }
}
