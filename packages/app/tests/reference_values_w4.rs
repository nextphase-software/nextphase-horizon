// SPDX-License-Identifier: AGPL-3.0-only
mod common;
use horizon_app::{compare, compare::PointerChange, run_fixture, scenario};
use horizon_engine::canonical::canonical_json;
use serde_json::{Value, json};
fn summary(v: &Value) -> Value {
    let balances: serde_json::Map<_, _> = v["ending_balances"]
        .as_array()
        .unwrap()
        .iter()
        .map(|a| {
            (
                a["identifier"].as_str().unwrap().into(),
                a["balance"]["cents"].clone(),
            )
        })
        .collect();
    json!({"status":v["status"],"last_year":v["last_year"],"first_shortfall_year":v["first_shortfall_year"],"ending_balances":balances,"ending_total":v["ending_total"]["cents"],"total_shortfall":v["total_shortfall"]["cents"],"total_federal_tax_paid":v["total_federal_tax_paid"]["cents"]})
}
#[test]
fn compare_every_reference_case_exactly() {
    let refs: Value = serde_json::from_str(include_str!(
        "../../../docs/briefs/0001-W4-reference-values.json"
    ))
    .unwrap();
    assert_eq!(refs["comparisons"].as_object().unwrap().len(), 5);
    for (name, case) in refs["comparisons"].as_object().unwrap() {
        let a = common::fixture(&format!("{name}-baseline"));
        let b = common::fixture(&format!("{name}-scenario"));
        assert_eq!(json!(a), case["baseline_input"]);
        assert_eq!(json!(b), case["scenario_input"]);
        let a_before = canonical_json(&a).unwrap();
        let before = canonical_json(&run_fixture(&a).unwrap()).unwrap();
        let result = compare(&a, &b).unwrap();
        let v = json!(result);
        let e = &case["expected"];
        assert_eq!(v["changed_inputs"], e["changed_inputs"], "{name}");
        assert_eq!(v["status"], e["status"]);
        assert_eq!(
            summary(&v["summary"]["baseline"]),
            e["summary"]["baseline"],
            "{name}"
        );
        assert_eq!(
            summary(&v["summary"]["scenario"]),
            e["summary"]["scenario"],
            "{name}"
        );
        for key in ["ending_total", "total_shortfall", "total_federal_tax_paid"] {
            assert_eq!(
                v["summary"]["difference"][key]["cents"], e["summary"]["difference"][key],
                "{name}: {key}"
            );
        }
        let lines:Vec<_>=v["line_differences"].as_array().unwrap().iter().filter(|l|{
            let p=l["path"].as_str().unwrap();refs["compared_paths"].as_array().unwrap().iter().any(|x|x==p)||(p.starts_with("/accounts/")&&p.ends_with("/closing"))
        }).map(|l|json!({"year":l["year"],"path":l["path"],"baseline":l["baseline"]["cents"],"scenario":l["scenario"]["cents"],"difference":l["difference"]["cents"]})).collect();
        assert_eq!(json!(lines), e["line_differences"], "{name}");
        for (side, f) in [("baseline", &a), ("scenario", &b)] {
            assert_eq!(
                canonical_json(&v[side]).unwrap(),
                canonical_json(&run_fixture(f).unwrap()).unwrap()
            );
            assert_eq!(
                v[format!("{side}_hashes")]["input_hash"],
                v[side]["metadata"]["input_hash"]
            );
            assert_eq!(
                v[format!("{side}_hashes")]["assumption_set_hash"],
                v[side]["metadata"]["assumption_set_hash"]
            );
            assert_eq!(
                v["summary"][side]["totals_label"],
                "nominal, summed across years"
            );
        }
        let changes: Vec<_> = e["changed_inputs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| PointerChange {
                path: x["path"].as_str().unwrap().into(),
                value: x["scenario"].clone(),
            })
            .collect();
        let copy = scenario(&a, &changes).unwrap();
        assert_eq!(canonical_json(&copy).unwrap(), canonical_json(&b).unwrap());
        assert_eq!(a_before, canonical_json(&a).unwrap());
        assert_eq!(before, canonical_json(&run_fixture(&a).unwrap()).unwrap());
        if name == "unchanged-copy" {
            assert!(result.line_differences.is_empty());
            assert!(result.changed_inputs.is_empty());
        }
    }
}
