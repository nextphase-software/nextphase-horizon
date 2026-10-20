// SPDX-License-Identifier: AGPL-3.0-only
use horizon_engine::canonical::canonical_json;
use serde_json::Value;
pub fn cases() -> Value {
    serde_json::from_str::<Value>(include_str!(
        "../../../../docs/briefs/0002-W5-reference-values.json"
    ))
    .unwrap()["cases"]
        .clone()
}
pub fn reference_values() {
    let cases = cases();
    assert_eq!(cases.as_object().unwrap().len(), 25);
    for (name, case) in cases.as_object().unwrap() {
        let actual = horizon_app::plan_from_answers_json(&case["answers"].to_string());
        assert_eq!(
            serde_json::to_value(&actual).unwrap(),
            case["result"],
            "{name}"
        );
        assert_eq!(
            canonical_json(&actual).unwrap(),
            canonical_json(&case["result"]).unwrap(),
            "bytes {name}"
        );
        if case["answers"]["version"] == 2 {
            let a: horizon_app::intake::v2::AnswersV2 =
                serde_json::from_value(case["answers"].clone()).unwrap();
            assert_eq!(
                canonical_json(&horizon_app::plan_from_answers(&a)).unwrap(),
                canonical_json(&actual).unwrap(),
                "typed {name}"
            );
        }
    }
}
