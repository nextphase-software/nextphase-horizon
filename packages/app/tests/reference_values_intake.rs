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

#[path = "../../parity/tests/support/intake_v2_malformed.rs"]
mod malformed_v2;
#[test]
fn intake_v2_malformed_documents_and_schema_bounds() {
    malformed_v2::prove();
    let input_schema = horizon_app::schemas::answers_schema_v2();
    let input_validator = jsonschema::validator_for(&input_schema).unwrap();
    let output_validator =
        jsonschema::validator_for(&horizon_app::schemas::answers_plan_schema_v2()).unwrap();
    for (name, a) in malformed_v2::cases() {
        assert!(!input_validator.is_valid(&a), "{name}");
        let result = horizon_app::plan_from_answers_json(&a.to_string());
        assert!(
            output_validator.is_valid(&serde_json::to_value(result).unwrap()),
            "{name}"
        );
    }
    let mut base = reference_v2::cases()["v2-working-complete"]["answers"].clone();
    for total in [-9_007_199_254_740_991i64, 0, 9_007_199_254_740_991i64] {
        base["planning"] = serde_json::json!("partner");
        base["what_if"] = serde_json::json!({"savings_total_cents":total});
        assert!(input_validator.is_valid(&base));
        let result = horizon_app::plan_from_answers_json(&base.to_string());
        let value = serde_json::to_value(result).unwrap();
        assert_eq!(value["code"], "ANSWERS_ONE_PERSON_ONLY");
        assert_eq!(value["what_if"], base["what_if"]);
        horizon_engine::canonical::canonical_json(&value).unwrap();
    }
    base["planning"] = serde_json::json!("alone");
    base["what_if"] = serde_json::json!({"savings_total_cents":-9_007_199_254_740_991i64});
    assert_eq!(
        serde_json::to_value(horizon_app::plan_from_answers_json(&base.to_string())).unwrap()["code"],
        "ANSWERS_NEGATIVE_AMOUNT"
    );
    for what_if in [serde_json::json!({}), serde_json::Value::Null] {
        base["planning"] = serde_json::json!("partner");
        base["what_if"] = what_if.clone();
        assert!(input_validator.is_valid(&base));
        assert_eq!(
            serde_json::to_value(horizon_app::plan_from_answers_json(&base.to_string())).unwrap()["what_if"],
            what_if
        );
    }
}
