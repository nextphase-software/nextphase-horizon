// SPDX-License-Identifier: AGPL-3.0-only
mod common;
use horizon_app::{
    compare as compare_inputs,
    compare::{PointerChange, line_differences},
    export as export_run,
    export::content_hash,
    import, run_fixture, scenario,
};
use horizon_engine::{canonical::canonical_json, input::DollarBasis};
use serde_json::{Value, json};
fn valid() -> Vec<horizon_app::Fixture> {
    std::fs::read_dir(common::root().join("packages/app/fixtures"))
        .unwrap()
        .map(|p| std::fs::read_to_string(p.unwrap().path()).unwrap())
        .filter_map(|s| horizon_app::parse_fixture(&s).ok())
        .filter(|f| run_fixture(f).is_ok())
        .collect()
}
mod compare {
    use super::*;
    #[test]
    fn all_lines_missing_sides_escaped_identifiers_and_bases() {
        let a = common::fixture("A-drawdown");
        let mut b = a.clone();
        let mut new = b.household.accounts[0].clone();
        new.id = "é/~税".into();
        new.opening_balance_cents = 100;
        b.household.accounts.push(new);
        let c = compare_inputs(&a, &b).unwrap();
        let path = "/accounts/é~1~0税/closing";
        let missing = c.line_differences.iter().find(|l| l.path == path).unwrap();
        assert!(missing.baseline.is_none());
        assert!(missing.difference.is_none());
        assert!(missing.scenario.is_some());
        assert!(canonical_json(&c).is_ok());
        assert!(
            c.line_differences
                .windows(2)
                .all(|w| (w[0].year, &w[0].path) < (w[1].year, &w[1].path))
        );
        let left = run_fixture(&a).unwrap();
        let mut right = left.clone();
        right.years[0].ledger.accounts[0].closing.value.dollar_basis = DollarBasis::Today;
        assert_eq!(
            line_differences(&left, &right).unwrap_err().code,
            "COMPARISON_BASIS_MISMATCH"
        );
        // Include tax breakdown lines, not just the reference file's selected paths.
        let c = compare_inputs(&a, &common::fixture("A-drawdown-tax_deferred_first")).unwrap();
        assert!(
            c.line_differences
                .iter()
                .any(|l| l.path == "/federal_tax/breakdown/ordinary_income")
        );
        let mut shorter = a.clone();
        shorter.household.persons[0].plan_end_age = 74;
        assert!(
            compare_inputs(&a, &shorter)
                .unwrap()
                .line_differences
                .iter()
                .any(|l| l.scenario.is_none())
        );
    }
    #[test]
    fn changed_inputs_added_removed_arrays_and_keyed_assumptions() {
        let a = common::fixture("A-drawdown-tax_deferred_first");
        let mut b = a.clone();
        b.household.withdrawal_order = None;
        b.household.accounts.pop();
        b.assumptions.reverse();
        let c = compare_inputs(&a, &b).unwrap();
        let v = json!(c.changed_inputs);
        assert!(
            v.as_array()
                .unwrap()
                .iter()
                .any(|x| x["path"] == "/household/withdrawal_order" && x["change"] == "removed")
        );
        assert!(
            v.as_array()
                .unwrap()
                .iter()
                .any(|x| x["path"] == "/household/accounts/3" && x["change"] == "removed")
        );
        assert!(
            !v.as_array()
                .unwrap()
                .iter()
                .any(|x| x["path"].as_str().unwrap().starts_with("/assumptions"))
        );
        let mut unsupported = a.clone();
        unsupported.assumptions[0].identifier = "unknown".into();
        let mut invalid = a.clone();
        invalid.household.accounts[0].opening_balance_cents = -1;
        assert_eq!(
            compare_inputs(&invalid, &unsupported).unwrap_err().status,
            horizon_engine::error::Status::Unsupported
        );
        assert_eq!(
            compare_inputs(&unsupported, &invalid).unwrap_err().status,
            horizon_engine::error::Status::Unsupported
        );
    }
}
#[test]
fn immutability_and_pointer_errors() {
    let a = common::fixture("A-drawdown");
    let input = canonical_json(&a).unwrap();
    let run = canonical_json(&run_fixture(&a).unwrap()).unwrap();
    let b = scenario(
        &a,
        &[
            PointerChange {
                path: "/household/accounts/0/id".into(),
                value: json!("a~/税"),
            },
            PointerChange {
                path: "/assumptions/investment_return/value".into(),
                value: json!("0.06"),
            },
        ],
    )
    .unwrap();
    compare_inputs(&a, &b).unwrap();
    assert_eq!(canonical_json(&a).unwrap(), input);
    assert_eq!(canonical_json(&run_fixture(&a).unwrap()).unwrap(), run);
    for path in [
        "household",
        "/household/~2",
        "/household/persons/00/id",
        "/household/persons/5/id",
        "/missing/value",
    ] {
        assert_eq!(
            scenario(
                &a,
                &[PointerChange {
                    path: path.into(),
                    value: json!(0)
                }]
            )
            .unwrap_err()
            .code,
            "SCENARIO_POINTER_INVALID"
        );
        assert_eq!(canonical_json(&a).unwrap(), input);
    }
    assert_eq!(
        scenario(
            &a,
            &[PointerChange {
                path: "/assumptions/investment_return/identifier".into(),
                value: json!("other")
            }]
        )
        .unwrap_err()
        .code,
        "SCENARIO_ASSUMPTION_ID_MISMATCH"
    );
    assert!(
        compare_inputs(&a, &scenario(&a, &[]).unwrap())
            .unwrap()
            .line_differences
            .is_empty()
    );
}
mod export {
    use super::*;
    fn rehash(v: &mut Value) {
        v["hashes"]["export_content_hash"] = json!(content_hash(v).unwrap());
    }
    #[test]
    fn export_round_trips_every_valid_fixture_and_reproduces_status() {
        let all = valid();
        assert_eq!(all.len(), 26);
        for f in all {
            let run = run_fixture(&f).unwrap();
            let e = export_run(&f).unwrap();
            assert_eq!(
                canonical_json(&e.run).unwrap(),
                canonical_json(&run).unwrap()
            );
            assert_eq!(
                canonical_json(&import(&canonical_json(&e).unwrap()).unwrap()).unwrap(),
                canonical_json(&run).unwrap()
            );
            assert_eq!(json!(e.input), json!(f));
        }
    }
    #[test]
    fn export_import_checks_order_tampering_versions_and_rehashed_results() {
        let f = common::fixture("A-drawdown");
        let mut v = json!(export_run(&f).unwrap());
        for (name, code) in [
            ("tampered-export", "EXPORT_HASH_MISMATCH"),
            ("unknown-format-export", "EXPORT_FORMAT_UNSUPPORTED"),
            ("model-0.3.0.export", "EXPORT_MODEL_VERSION_UNSUPPORTED"),
        ] {
            let text = std::fs::read_to_string(
                common::root().join(format!("packages/app/test-data/{name}.json")),
            )
            .unwrap();
            assert_eq!(import(&text).unwrap_err().code, code);
        }
        v["export_format_version"] = json!(2);
        v["model_version"] = json!("unknown");
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_FORMAT_UNSUPPORTED"
        );
        v["export_format_version"] = json!(1);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_HASH_MISMATCH"
        );
        rehash(&mut v);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_MODEL_VERSION_UNSUPPORTED"
        );
        v["model_version"] = json!(horizon_engine::projection::MODEL_VERSION);
        v["input"]["household"]["accounts"][0]["opening_balance_cents"] = json!(-1);
        rehash(&mut v);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "NEGATIVE_BALANCE"
        );
        v = json!(export_run(&f).unwrap());
        v["run"]["status"] = json!("partial");
        rehash(&mut v);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_RESULT_MISMATCH"
        );
        v = json!(export_run(&f).unwrap());
        v["hashes"]["input_hash"] = json!("edited");
        rehash(&mut v);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_RESULT_MISMATCH"
        );
        v = json!(export_run(&f).unwrap());
        v["rule_set_year"] = json!(2027);
        rehash(&mut v);
        assert_eq!(
            import(&canonical_json(&v).unwrap()).unwrap_err().code,
            "EXPORT_RESULT_MISMATCH"
        );
    }
}
#[test]
fn generated_output_schemas_drift_and_validate_every_output() {
    use horizon_app::schemas::*;
    let schemas = [
        ("run-output", run_schema()),
        ("comparison", comparison_schema()),
        ("export", export_schema()),
    ];
    for (name, schema) in &schemas {
        let committed = std::fs::read_to_string(
            common::root().join(format!("docs/model/schemas/{name}.v2.schema.json")),
        )
        .unwrap();
        assert_eq!(
            committed,
            format!("{}\n", serde_json::to_string_pretty(schema).unwrap())
        );
        assert_eq!(
            schema["$schema"],
            "https://json-schema.org/draft/2020-12/schema"
        );
    }
    let validators: Vec<_> = schemas
        .iter()
        .map(|(_, v)| jsonschema::validator_for(v).unwrap())
        .collect();
    for f in valid() {
        let run = json!(run_fixture(&f).unwrap());
        let e = json!(export_run(&f).unwrap());
        let c = json!(compare_inputs(&f, &f).unwrap());
        for (v, out) in validators.iter().zip([run, c, e]) {
            let errors: Vec<_> = v.iter_errors(&out).map(|e| e.to_string()).collect();
            assert!(errors.is_empty(), "{errors:?}");
        }
    }
}
