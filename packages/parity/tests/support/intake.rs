// SPDX-License-Identifier: AGPL-3.0-only
use horizon_engine::canonical::canonical_json;
use serde_json::Value;
pub fn cases() -> Value {
    serde_json::from_str::<Value>(include_str!(
        "../../../../docs/briefs/0002-W4-reference-values.json"
    ))
    .unwrap()["cases"]
        .clone()
}
pub fn reference_values() {
    let cases = cases();
    assert_eq!(cases.as_object().unwrap().len(), 29);
    for (name, case) in cases.as_object().unwrap() {
        let answers = case["answers"].to_string();
        let actual = horizon_app::plan_from_answers_json(&answers);
        assert_eq!(
            serde_json::to_value(&actual).unwrap(),
            case["result"],
            "{name}"
        );
        assert_eq!(
            canonical_json(&actual).unwrap(),
            canonical_json(&case["result"]).unwrap(),
            "canonical {name}"
        );
    }
}
