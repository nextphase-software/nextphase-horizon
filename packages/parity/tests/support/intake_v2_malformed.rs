// SPDX-License-Identifier: AGPL-3.0-only
//! Shared native/WebAssembly proof of the v1.2 structural boundary.
use horizon_engine::canonical::canonical_json;
use serde_json::{Value, json};
pub fn expected() -> Value {
    json!({"status":"invalid","code":"MALFORMED_INPUT","needed":[],
        "household_input":null,"central":null,"bounds":null,"left_out":[],
        "starting_values":[],"not_sure":[],"solved":null,"what_if":null})
}
pub fn cases() -> Vec<(String, Value)> {
    let references: Value = serde_json::from_str(include_str!(
        "../../../../docs/briefs/0002-W5-reference-values.json"
    ))
    .unwrap();
    let mut base = references["cases"]["v2-working-complete"]["answers"].clone();
    base["not_sure"] = json!(["pay", "savings"]);
    let mut cases = Vec::new();
    for (name, total) in [
        ("above-limit", json!(9_007_199_254_740_992i64)),
        ("below-limit", json!(-9_007_199_254_740_992i64)),
        ("i64-max", json!(i64::MAX)),
        ("i64-min", json!(i64::MIN)),
        ("fractional", serde_json::from_str("0.5").unwrap()),
        ("null", Value::Null),
        ("string", json!("100")),
        ("boolean", json!(true)),
    ] {
        let mut a = base.clone();
        a["what_if"] = json!({"savings_total_cents":total});
        cases.push((name.into(), a));
    }
    for (name, key, value) in [
        ("unknown-root", "unknown", json!(true)),
        ("unknown-what-if", "what_if", json!({"other":0})),
        ("wrong-format", "format", json!("other")),
        ("wrong-period", "pay", json!({"cents":0,"per":"week"})),
        ("bad-valuation-shape", "valuation_date", json!("2026-1-01")),
        (
            "bad-birth-shape",
            "birth_date",
            json!({"date":"not-a-date"}),
        ),
        (
            "bad-retirement-shape",
            "retirement",
            json!({"date":"not-a-date"}),
        ),
        (
            "bad-pay-end-shape",
            "pay_ends",
            json!({"date":"not-a-date"}),
        ),
    ] {
        let mut a = base.clone();
        a["what_if"] = json!({"savings_total_cents":100});
        a[key] = value;
        cases.push((name.into(), a));
    }
    let mut a = base.clone();
    a.as_object_mut().unwrap().remove("savings");
    a["what_if"] = json!({"savings_total_cents":100});
    cases.push(("missing-required".into(), a));
    let mut a = base;
    a["planning"] = json!("partner");
    a["birth_date"] = json!({"later":true});
    a["what_if"] = json!({"savings_total_cents":9_007_199_254_740_992i64});
    cases.push(("malformed-before-planning-and-needed".into(), a));
    cases
}
pub fn prove() {
    for (name, a) in cases() {
        let result = horizon_app::plan_from_answers_json(&a.to_string());
        assert_eq!(serde_json::to_value(&result).unwrap(), expected(), "{name}");
        assert_eq!(
            canonical_json(&result).unwrap(),
            canonical_json(&expected()).unwrap(),
            "bytes {name}"
        );
        if let Ok(a) = serde_json::from_value::<horizon_app::intake::v2::AnswersV2>(a) {
            assert_eq!(
                serde_json::to_value(horizon_app::plan_from_answers(&a)).unwrap(),
                expected(),
                "typed {name}"
            );
        }
    }
}
