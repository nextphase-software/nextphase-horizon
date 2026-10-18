// SPDX-License-Identifier: AGPL-3.0-only
// Public W3 unit test body, shared values unchanged, compiled into each host.
use horizon_engine::{
    input::Date,
    tax::{self, TaxInput},
};
use serde_json::{Value, json};
fn reference() -> Value {
    serde_json::from_str(include_str!(
        "../../../../docs/briefs/0001-W3-reference-values.json"
    ))
    .unwrap()
}
fn n(v: &Value) -> i64 {
    v.as_i64().unwrap()
}
fn cents(v: &Value) -> i64 {
    n(&v["cents"])
}
fn normalized_tax(t: &Value) -> Value {
    let mut value = serde_json::Map::new();
    for (k, v) in t.as_object().unwrap() {
        if v.get("cents").is_some() {
            value.insert(k.clone(), json!(cents(v)));
        } else if ["tax_year", "law_kind", "niit_threshold_exceeded"].contains(&k.as_str()) {
            value.insert(k.clone(), v.clone());
        }
    }
    Value::Object(value)
}
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn every_committed_unit_value() {
    let root = reference();
    let u = &root["unit"];
    assert_eq!(u["tax_year_cases"].as_array().unwrap().len(), 12);
    let law = tax::law(2026, "0.025").unwrap();
    for v in u["ordinary_tax_2026"].as_array().unwrap() {
        assert_eq!(
            tax::ordinary_tax(n(&v["taxable_income"]), &law).unwrap(),
            n(&v["tax"])
        );
    }
    for v in u["projected_law"].as_array().unwrap() {
        let l = serde_json::to_value(
            tax::law(
                u16::try_from(n(&v["year"])).unwrap(),
                v["tax_indexing"].as_str().unwrap(),
            )
            .unwrap(),
        )
        .unwrap();
        for key in [
            "additional_65",
            "bracket_thresholds",
            "capital_gains_15_max",
            "capital_gains_zero_max",
            "kind",
            "standard_deduction",
        ] {
            assert_eq!(l[key], v[key], "{key}");
        }
    }
    for v in u["age_65_by_year_end"].as_array().unwrap() {
        assert_eq!(
            tax::age_65(
                &Date(v["birth_date"].as_str().unwrap().into()),
                u16::try_from(n(&v["year"])).unwrap()
            )
            .unwrap(),
            v["is_65"].as_bool().unwrap()
        );
    }
    for v in u["taxable_social_security"].as_array().unwrap() {
        assert_eq!(
            tax::taxable_social_security(n(&v["benefits"]), n(&v["other_income"])).unwrap(),
            n(&v["taxable"])
        );
    }
    // Explicit tax inputs, in the same order as the twelve named committed cases.
    for (expected, (year, birth, ordinary, ss, gains, carry, early)) in
        u["tax_year_cases"].as_array().unwrap().iter().zip([
            (2026, "1980-06-15", 6_000_000, 0, 0, 0, 0),
            (2026, "1961-06-15", 6_000_000, 0, 0, 0, 0),
            (2028, "1958-06-15", 9_000_000, 0, 0, 0, 0),
            (2029, "1958-06-15", 9_000_000, 0, 0, 0, 0),
            (2026, "1956-06-15", 17_500_000, 0, 0, 0, 0),
            (2026, "1980-06-15", 4_000_000, 0, 3_000_000, 0, 0),
            (2026, "1980-06-15", 10_000_000, 0, 70_000_000, 0, 0),
            (2026, "1980-06-15", 5_000_000, 0, -1_000_000, 0, 0),
            (2027, "1980-06-15", 5_000_000, 0, 400_000, 700_000, 0),
            (2026, "1980-06-15", 2_000_000, 0, 0, 0, 2_000_000),
            (2026, "1952-06-15", 3_000_000, 2_400_000, 0, 0, 0),
            (2035, "1965-06-15", 8_000_000, 0, 0, 0, 0),
        ])
    {
        let actual = tax::compute(
            &TaxInput {
                ordinary_income: ordinary,
                social_security: ss,
                realized_gains: gains,
                loss_carry_in: carry,
                early_distributions: early,
            },
            &Date(birth.into()),
            2026,
            year,
            "0.025",
        )
        .unwrap();
        let mut expected = expected.clone();
        expected.as_object_mut().unwrap().remove("case");
        assert_eq!(
            normalized_tax(&serde_json::to_value(actual).unwrap()),
            expected
        );
    }
    let published = &root["law_2026_single"];
    for (name, v) in published.as_object().unwrap() {
        if name == "brackets_cents" {
            for (i, pair) in v.as_array().unwrap().iter().enumerate() {
                assert_eq!(
                    pair[0],
                    law.bracket_thresholds
                        .get(i)
                        .map_or(Value::Null, |v| json!(v))
                );
                assert_eq!(pair[1], law.values[&format!("ordinary_rate_{i}")].value);
            }
        } else {
            let key = if name == "additional_65_unmarried" {
                "additional_65"
            } else {
                name
            };
            assert_eq!(law.values[key].value, v.to_string(), "{name}");
        }
    }
}
