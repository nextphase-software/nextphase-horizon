// SPDX-License-Identifier: AGPL-3.0-only
mod common;
use horizon_app::{parse_fixture, run, run_fixture, run_with_tax_limit};
use horizon_engine::{
    canonical::canonical_json,
    input::Date,
    tax::{self, TaxInput},
};
use serde_json::{Value, json};
fn reference() -> Value {
    serde_json::from_str(include_str!(
        "../../../docs/briefs/0001-W3-reference-values.json"
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
fn normalized(run: &Value) -> Value {
    let mut years = Vec::new();
    for y in run["years"].as_array().unwrap() {
        let l = &y["ledger"];
        let f = &l["federal_tax"];
        let mut accounts = serde_json::Map::new();
        for a in l["accounts"].as_array().unwrap() {
            let mut value = serde_json::Map::new();
            for key in [
                "opening",
                "rmd",
                "withdrawal",
                "deposit",
                "growth",
                "closing",
                "basis_removed",
                "realized_gain",
                "closing_basis",
            ] {
                if let Some(line) = a.get(key) {
                    value.insert(key.into(), json!(cents(line)));
                }
            }
            accounts.insert(
                a["identifier"].as_str().unwrap().into(),
                Value::Object(value),
            );
        }
        let income: serde_json::Map<_, _> = l["income"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), json!(cents(v))))
            .collect();
        years.push(json!({"year":y["year"],"accounts":accounts,"income":income,"spending":cents(&l["spending"]),
            "rmd_total":cents(&l["rmd_total"]),"withdrawals_total":cents(&l["withdrawals_total"]),"surplus_deposit":cents(&l["surplus_deposit"]),
            "shortfall":cents(&l["shortfall"]),"created_account":l["created_account"],"flags":l["flags"],
            "federal_tax_paid":cents(&f["paid"]),"rounding_settlement":cents(&f["rounding_settlement"]),"passes":f["passes"],
            "settled_by":f["settled_by"],"converged":f["converged"],"tax":normalized_tax(&f["breakdown"])}));
    }
    json!({"status":run["status"],"contributions_partial":run["omissions"].as_array().unwrap().contains(&json!("contributions not modeled")),
        "withdrawal_order_used":run["withdrawal_order_used"],"years":years})
}
#[test]
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
fn conservation(run: &Value) {
    for y in run["years"].as_array().unwrap() {
        let l = &y["ledger"];
        let f = &l["federal_tax"];
        let c = |key: &str| i128::from(cents(&l[key]));
        assert_eq!(
            c("income_total") + c("rmd_total") + c("withdrawals_total") + c("shortfall"),
            c("spending") + i128::from(cents(&f["paid"])) + c("surplus_deposit")
        );
        if f["converged"] == true {
            assert_eq!(
                cents(&f["paid"]),
                cents(&f["breakdown"]["total_tax"]) + cents(&f["rounding_settlement"])
            );
        } else {
            assert_eq!(cents(&f["rounding_settlement"]), 0);
            assert!(
                l["flags"]
                    .as_array()
                    .unwrap()
                    .contains(&json!("partial:tax_funding_did_not_converge"))
            );
        }
        for a in l["accounts"].as_array().unwrap() {
            let c = |key: &str| i128::from(cents(&a[key]));
            assert_eq!(
                c("opening") - c("rmd") - c("withdrawal") + c("deposit") + c("growth"),
                c("closing")
            );
            assert!(c("closing") >= 0);
            assert!(c("rmd") + c("withdrawal") <= c("opening"));
            if a.get("closing_basis").is_some() {
                assert!(c("closing_basis") >= 0);
            }
        }
        for line in f["breakdown"]
            .as_object()
            .unwrap()
            .values()
            .chain([&f["paid"], &f["rounding_settlement"]])
        {
            if line.get("cents").is_some() {
                assert_eq!(line["tax_year"], y["year"]);
                assert!(!line["rule_id"].as_str().unwrap().is_empty());
                assert!([json!("a"), json!("b")].contains(&line["kind"]));
            }
        }
        for rule in f["breakdown"]["rules"]["values"]
            .as_object()
            .unwrap()
            .values()
        {
            assert!(rule["source"].as_str().unwrap().starts_with("https://"));
            assert_eq!(rule["tax_year"], y["year"]);
            assert!([json!("a"), json!("b")].contains(&rule["kind"]));
            assert!(!rule["retrieved"].as_str().unwrap().is_empty());
        }
    }
}
#[test]
fn every_scenario_every_line_flag_pass_and_status() {
    let root = reference();
    for (name, s) in root["scenarios"].as_object().unwrap() {
        let f = common::fixture(name);
        let mut input = serde_json::to_value(&f).unwrap();
        input.as_object_mut().unwrap().remove("pass_limit");
        assert_eq!(input, s["input"], "fixture {name}");
        assert_eq!(
            f.pass_limit.map(i64::from).unwrap_or(50),
            s["pass_limit"].as_i64().unwrap_or(50)
        );
        let result = run_fixture(&f).unwrap();
        let value = serde_json::to_value(&result).unwrap();
        assert_eq!(normalized(&value), s["expected"], "{name}");
        conservation(&value);
        assert_eq!(
            canonical_json(&result).unwrap(),
            canonical_json(&run_fixture(&f).unwrap()).unwrap()
        );
    }
}
#[test]
fn validation_status_shortfall_and_immutable_trial_state() {
    let mut f = common::fixture("A-drawdown");
    f.assumptions.retain(|a| a.identifier != "tax_indexing");
    assert_eq!(
        run(&f.household, &f.assumptions).unwrap_err().code,
        "MISSING_ASSUMPTION"
    );
    f = common::fixture("A-drawdown");
    let tax = f
        .assumptions
        .iter_mut()
        .find(|a| a.identifier == "tax_indexing")
        .unwrap();
    tax.value = "-0.01".into();
    assert_eq!(
        run(&f.household, &f.assumptions).unwrap_err().code,
        "INVALID_TAX_INDEXING"
    );
    let tax = f
        .assumptions
        .iter_mut()
        .find(|a| a.identifier == "tax_indexing")
        .unwrap();
    tax.value = "0".into();
    tax.source.clear();
    assert_eq!(
        run(&f.household, &f.assumptions).unwrap_err().code,
        "INVALID_ASSUMPTION"
    );
    f = common::fixture("A-drawdown");
    for limit in [0, 51] {
        assert_eq!(
            run_with_tax_limit(&f.household, &f.assumptions, limit)
                .unwrap_err()
                .code,
            "INVALID_TAX_PASS_LIMIT"
        );
    }
    assert_eq!(
        tax::law(2025, "0").unwrap_err().code,
        "TAX_YEAR_UNSUPPORTED"
    );
    // Tax liability remains in shortfall when savings cannot fund it.
    f.household.accounts.clear();
    f.household.income.pension.amount.cents = 30_000_000;
    f.household.spending.after_retirement.cents = 30_000_000;
    let v = serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap();
    assert_eq!(v["status"], "partial");
    assert!(
        v["omissions"]
            .as_array()
            .unwrap()
            .contains(&json!("net investment income tax not modeled"))
    );
    conservation(&v);
    assert!(cents(&v["years"][0]["ledger"]["shortfall"]) > 0);
    assert!(parse_fixture("{}").is_err());
}

#[test]
fn rounding_settlement_counts_as_a_pass_and_active_wages_control_status() {
    let f = common::fixture("E-senior-2028-loss-carry");
    let six = run_with_tax_limit(&f.household, &f.assumptions, 6).unwrap();
    let seven = run_with_tax_limit(&f.household, &f.assumptions, 7).unwrap();
    let six_tax = six.years[0].ledger.federal_tax.as_ref().unwrap();
    let seven_tax = seven.years[0].ledger.federal_tax.as_ref().unwrap();
    assert!(!six_tax.converged);
    assert_eq!(six_tax.passes, 6);
    assert_eq!(seven_tax.settled_by, Some("rounding_cycle"));
    assert_eq!(seven_tax.passes, 7);
    assert_eq!(seven_tax.rounding_settlement.cents(), 1);
    // Dates activate the contributions omission even if the wage amount is zero.
    let mut f = common::fixture("synthetic-working");
    for w in &mut f.household.income.wages {
        w.amount.cents = 0;
    }
    let active = run(&f.household, &f.assumptions).unwrap();
    assert_eq!(active.status, "partial");
    assert!(active.omissions.contains(&"contributions not modeled"));
    for w in &mut f.household.income.wages {
        w.start_date = Date("2025-01-01".into());
        w.end_date = Date("2026-01-01".into());
    }
    let inactive = run(&f.household, &f.assumptions).unwrap();
    assert!(!inactive.omissions.contains(&"contributions not modeled"));
    for omission in [
        "state tax not modeled",
        "alternative minimum tax not modeled",
        "taxable-account dividends and interest not modeled",
        "itemized deductions and credits not modeled",
    ] {
        assert!(inactive.omissions.contains(&omission));
    }
}
