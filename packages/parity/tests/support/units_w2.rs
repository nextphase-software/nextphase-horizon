// SPDX-License-Identifier: AGPL-3.0-only
// Public W2 unit test body, shared values unchanged, compiled into each host.
use horizon_engine::{
    calendar::{benefit_start_date, date_59_half},
    input::{Amount, Date, DollarBasis},
    ledger::{activated_amount, average_cost_basis, growth, proportional_split},
    money::Fraction,
    rmd_table,
};
use serde_json::Value;
fn reference() -> Value {
    serde_json::from_str(include_str!(
        "../../../../docs/briefs/0001-W2-reference-values.json"
    ))
    .unwrap()
}
fn integer(v: &Value, key: &str) -> i64 {
    v[key].as_i64().unwrap()
}
fn small(v: &Value, key: &str) -> u16 {
    u16::try_from(integer(v, key)).unwrap()
}
fn date(v: &Value, key: &str) -> Date {
    Date(v[key].as_str().unwrap().into())
}
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn every_committed_unit_vector() {
    let root = reference();
    let u = &root["unit"];
    for v in u["applicable_age"].as_array().unwrap() {
        assert_eq!(
            rmd_table::applicable_age(&date(v, "birth_date")).unwrap(),
            Some(small(v, "applicable_age"))
        );
    }
    for v in u["first_rmd_year"].as_array().unwrap() {
        assert_eq!(
            rmd_table::first_rmd_year(&date(v, "birth_date")).unwrap(),
            Some(small(v, "first_year"))
        );
    }
    for v in u["date_59_half"].as_array().unwrap() {
        assert_eq!(
            date_59_half(&date(v, "birth_date")).unwrap(),
            date(v, "date")
        );
    }
    for v in u["early_test_event_2026_07_01"].as_array().unwrap() {
        assert_eq!(
            Date("2026-07-01".into()) < date_59_half(&date(v, "birth_date")).unwrap(),
            v["before_59_half"].as_bool().unwrap()
        );
    }
    for v in u["benefit_start"].as_array().unwrap() {
        assert_eq!(
            benefit_start_date(&date(v, "birth_date"), small(v, "start_age")).unwrap(),
            date(v, "first_day")
        );
    }
    for v in u["rmd_amount"].as_array().unwrap() {
        assert_eq!(
            rmd_table::amount(integer(v, "prior_year_end_cents"), small(v, "age")).unwrap(),
            integer(v, "rmd_cents")
        );
        let parts: Vec<_> = v["divisor"].as_str().unwrap().split('/').collect();
        let numerator: i64 = parts[0].parse().unwrap();
        let denominator: i64 = parts.get(1).map_or(1, |s| s.parse().unwrap());
        let expected = Fraction::new(numerator.into(), denominator.into())
            .unwrap()
            .times(&Fraction::integer(1000))
            .finalize()
            .unwrap()
            .cents();
        let actual = Fraction::decimal(rmd_table::divisor(small(v, "age")).unwrap())
            .unwrap()
            .times(&Fraction::integer(1000))
            .finalize()
            .unwrap()
            .cents();
        assert_eq!(actual, expected);
    }
    for v in u["day_activation"].as_array().unwrap() {
        let is_today = v.get("annual_today_cents").is_some();
        let amount = Amount {
            cents: integer(
                v,
                if is_today {
                    "annual_today_cents"
                } else {
                    "annual_nominal_cents"
                },
            ),
            dollar_basis: if is_today {
                DollarBasis::Today
            } else {
                DollarBasis::Nominal
            },
        };
        assert_eq!(
            activated_amount(
                &amount,
                v["inflation"].as_str().unwrap_or("0"),
                v["base_year"]
                    .as_u64()
                    .map_or(small(v, "year"), |n| u16::try_from(n).unwrap()),
                small(v, "year"),
                small(v, "active_days"),
                small(v, "days_in_year")
            )
            .unwrap(),
            integer(v, "cents")
        );
    }
    for v in u["growth"].as_array().unwrap() {
        assert_eq!(
            growth(
                integer(v, "opening"),
                integer(v, "net_flow"),
                v["rate"].as_str().unwrap(),
                small(v, "period_days"),
                small(v, "days_in_year")
            )
            .unwrap(),
            integer(v, "growth")
        );
    }
    for v in u["average_cost_basis"].as_array().unwrap() {
        assert_eq!(
            average_cost_basis(
                integer(v, "opening_value"),
                integer(v, "basis"),
                integer(v, "withdrawal")
            )
            .unwrap(),
            (integer(v, "basis_removed"), integer(v, "realized_gain"))
        );
    }
    for v in u["proportional_split"].as_array().unwrap() {
        let weights: Vec<_> = v["available_in_input_order"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_i64().unwrap())
            .collect();
        let expected: Vec<_> = v["shares"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_i64().unwrap())
            .collect();
        assert_eq!(
            proportional_split(integer(v, "amount"), &weights).unwrap(),
            expected
        );
    }
}
