// SPDX-License-Identifier: AGPL-3.0-only
mod common;
use horizon_app::{household_schema_v2, parse_household, run};
use horizon_engine::{
    calendar::{Period, benefit_start_date, date_59_half},
    input::{Amount, Date, DollarBasis},
    ledger::{activated_amount, average_cost_basis, growth, proportional_split},
    money::Fraction,
    rmd_table,
};
use serde_json::{Value, json};
fn reference() -> Value {
    serde_json::from_str(include_str!(
        "../../../docs/briefs/0001-W2-reference-values.json"
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
fn cents(v: &Value) -> i64 {
    v["cents"].as_i64().unwrap()
}

#[test]
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
fn normalized(run: &Value) -> Value {
    let mut years = Vec::new();
    for projection in run["years"].as_array().unwrap() {
        let y = &projection["ledger"];
        let mut accounts = serde_json::Map::new();
        for account in y["accounts"].as_array().unwrap() {
            let id = account["identifier"].as_str().unwrap();
            let mut result = serde_json::Map::new();
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
                if let Some(line) = account.get(key) {
                    result.insert(key.into(), json!(cents(line)));
                }
            }
            accounts.insert(id.into(), Value::Object(result));
        }
        let income: serde_json::Map<_, _> = y["income"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), json!(cents(v))))
            .collect();
        years.push(json!({"year":projection["year"],"period_days":y["period"]["days"],"event_date":y["period"]["event_date"],
            "before_59_half":y["before_59_half"],"accounts":accounts,"income":income,"spending":cents(&y["spending"]),
            "rmd_total":cents(&y["rmd_total"]),"withdrawals_total":cents(&y["withdrawals_total"]),"surplus_deposit":cents(&y["surplus_deposit"]),
            "shortfall":cents(&y["shortfall"]),"created_account":y["created_account"],"flags":y["flags"]}));
    }
    json!({"withdrawal_order_used":run["withdrawal_order_used"],"years":years})
}
fn conservation(run: &Value) {
    assert_eq!(run["status"], "partial");
    let omissions = run["omissions"].as_array().unwrap();
    assert!(omissions.contains(&json!("federal income tax not modeled")));
    assert!(omissions.contains(&json!("contributions not modeled")));
    for year in run["years"].as_array().unwrap() {
        let y = &year["ledger"];
        let c = |key: &str| i128::from(cents(&y[key]));
        assert_eq!(
            c("income_total") + c("rmd_total") + c("withdrawals_total") + c("shortfall"),
            c("spending") + c("surplus_deposit")
        );
        for account in y["accounts"].as_array().unwrap() {
            let a = |key: &str| i128::from(cents(&account[key]));
            assert_eq!(
                a("opening") + a("deposit") - a("withdrawal") - a("rmd") + a("growth"),
                a("closing")
            );
            assert!(a("closing") >= 0);
            assert!(a("withdrawal") + a("rmd") <= a("opening"));
            if account.get("closing_basis").is_some() {
                assert!(a("closing_basis") >= 0);
            }
            for key in ["withdrawal", "rmd", "deposit"] {
                assert!(
                    account[key]["rule_id"]
                        .as_str()
                        .is_some_and(|s| !s.is_empty())
                );
            }
            if a("rmd") > 0 {
                assert_eq!(account["distribution_source"]["table_year"], 2025);
                assert!(
                    account["distribution_source"]["table"]
                        .as_str()
                        .unwrap()
                        .contains("Table III")
                );
            }
        }
    }
}
#[test]
fn every_scenario_matches_every_line_and_flag_and_conserves_cash() {
    let root = reference();
    for (name, scenario) in root["scenarios"].as_object().unwrap() {
        let fixture = common::fixture(name);
        assert_eq!(
            serde_json::from_str::<Value>(&common::text(name)).unwrap(),
            scenario["input"],
            "{name}: fixture input"
        );
        let result = run(&fixture.household, &fixture.assumptions).unwrap();
        let value = serde_json::to_value(result).unwrap();
        assert_eq!(normalized(&value), scenario["expected"], "{name}");
        conservation(&value);
    }
    for name in common::VALID {
        let f = common::fixture(name);
        conservation(&serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap());
    }
}
#[test]
fn orders_preserve_income_and_spending() {
    let root = reference();
    let base = common::fixture("A-drawdown");
    let base = serde_json::to_value(run(&base.household, &base.assumptions).unwrap()).unwrap();
    for name in root["scenarios"]
        .as_object()
        .unwrap()
        .keys()
        .filter(|s| s.starts_with("A-drawdown-"))
    {
        let f = common::fixture(name);
        let value = serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap();
        for (a, b) in base["years"]
            .as_array()
            .unwrap()
            .iter()
            .zip(value["years"].as_array().unwrap())
        {
            assert_eq!(a["ledger"]["income"], b["ledger"]["income"]);
            assert_eq!(a["ledger"]["spending"], b["ledger"]["spending"]);
        }
    }
}
struct HouseholdRules;
impl<'i> jsonschema::Keyword<'i> for HouseholdRules {
    fn validate(&self, v: &'i Value) -> Result<(), jsonschema::ValidationError<'i>> {
        parse_household(v)
            .map(|_| ())
            .map_err(|e| jsonschema::ValidationError::custom(e.to_string()))
    }
    fn is_valid(&self, v: &'i Value) -> bool {
        parse_household(v).is_ok()
    }
}
#[test]
fn schema_v2_generated_and_all_valid_fixtures_validate() {
    let committed = std::fs::read_to_string(
        common::root().join("docs/model/schemas/household-input.v2.schema.json"),
    )
    .unwrap();
    assert_eq!(
        committed,
        format!(
            "{}\n",
            serde_json::to_string_pretty(&household_schema_v2()).unwrap()
        )
    );
    let schema: Value = serde_json::from_str(&committed).unwrap();
    let validator = jsonschema::options()
        .with_keyword("x-horizon-validation", |_, version, _| {
            if version == "v2" {
                Ok(Box::new(HouseholdRules))
            } else {
                Err(jsonschema::ValidationError::schema(
                    "Unsupported household schema version",
                ))
            }
        })
        .build(&schema)
        .unwrap();
    let root = reference();
    let names = common::VALID.iter().copied().chain(
        root["scenarios"]
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str),
    );
    for name in names {
        let f = common::fixture(name);
        let value = serde_json::to_value(&f.household).unwrap();
        assert!(validator.is_valid(&value), "{name}");
    }
    let mut value = reference()["scenarios"]["A-drawdown"]["input"]["household"].clone();
    value["withdrawal_order"] = json!("unknown");
    assert!(!validator.is_valid(&value));
}
#[test]
fn returns_are_explicit_and_negative_returns_are_unsupported() {
    let f = common::fixture("A-drawdown");
    for identifier in ["cash_return", "investment_return"] {
        let mut a = f.assumptions.clone();
        a.retain(|v| v.identifier != identifier);
        assert_eq!(
            run(&f.household, &a).unwrap_err().code,
            "MISSING_ASSUMPTION"
        );
        let mut a = f.assumptions.clone();
        a.iter_mut()
            .find(|v| v.identifier == identifier)
            .unwrap()
            .value = "-0.01".into();
        let error = run(&f.household, &a).unwrap_err();
        assert_eq!(error.code, "NEGATIVE_RETURN_UNSUPPORTED");
        assert_eq!(error.status, horizon_engine::error::Status::Unsupported);
    }
}
#[test]
fn exact_boundaries_created_accounts_and_1959_provenance() {
    let late = Period::new(&Date("2026-10-16".into()), 2026).unwrap();
    assert_eq!(late.event_date, Date("2026-10-16".into()));
    assert_eq!(
        late.active_days(
            Some(&Date("2026-10-16".into())),
            Some(&Date("2026-10-17".into()))
        )
        .unwrap(),
        1
    );
    assert_eq!(
        late.active_days(
            Some(&Date("2026-01-01".into())),
            Some(&Date("2026-10-16".into()))
        )
        .unwrap(),
        0
    );
    assert_eq!(
        rmd_table::divisor(120).unwrap(),
        rmd_table::divisor(130).unwrap()
    );
    assert!(rmd_table::due(&Date("1950-12-31".into()), 2026).unwrap());
    let mut f = common::fixture("A-drawdown");
    f.household.persons[0].birth_date = Date("1959-06-30".into());
    let result = run(&f.household, &f.assumptions).unwrap();
    let assumption = result
        .assumptions_used
        .iter()
        .find(|a| a.identifier == "rmd_applicable_age_1959")
        .unwrap();
    assert_eq!(assumption.value, "73");
    assert!(assumption.source.contains("2024-14543"));
    assert_eq!(assumption.effective_year, 2024);
    assert!(
        result
            .assumptions_used
            .windows(2)
            .all(|w| w[0].identifier < w[1].identifier)
    );
}

fn unfunded_fixture() -> horizon_app::Fixture {
    let mut f = common::fixture("B-early-retiree");
    f.household.income.wages.clear();
    f.household.income.social_security.amount.cents = 0;
    f.household.income.pension.amount.cents = 0;
    f.household.persons[0].retirement_date = Date("2020-01-01".into());
    f.household.spending.before_retirement = Amount {
        cents: 100,
        dollar_basis: DollarBasis::Nominal,
    };
    f.household.spending.after_retirement = f.household.spending.before_retirement.clone();
    for a in &mut f.assumptions {
        a.value = "0".into();
    }
    for a in &mut f.household.accounts {
        a.opening_balance_cents = 0;
        if a.cost_basis_cents.is_some() {
            a.cost_basis_cents = Some(0);
        }
    }
    f
}
#[test]
fn early_override_and_both_early_flags_apply_to_every_requested_order() {
    use horizon_engine::input::WithdrawalOrder;
    let mut f = unfunded_fixture();
    f.household.accounts[2].opening_balance_cents = 1;
    f.household.accounts[3].opening_balance_cents = 200;
    let mut previous = None;
    for order in [
        WithdrawalOrder::TaxableFirst,
        WithdrawalOrder::TaxDeferredFirst,
        WithdrawalOrder::RothBeforeTaxDeferred,
        WithdrawalOrder::ProportionalTaxableTaxDeferred,
    ] {
        f.household.withdrawal_order = Some(order);
        let value = serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap();
        conservation(&value);
        let first = &value["years"][0]["ledger"];
        assert_eq!(cents(&account(first, "k401")["withdrawal"]), 1);
        assert_eq!(cents(&account(first, "roth")["withdrawal"]), 99);
        assert_eq!(
            first["withdrawal_order_used"],
            "before_59_half_cash_taxable_tax_deferred_roth"
        );
        assert!(
            first["flags"]
                .as_array()
                .unwrap()
                .contains(&json!("partial:early_distribution_exceptions_not_modeled"))
        );
        assert!(
            first["flags"]
                .as_array()
                .unwrap()
                .contains(&json!("partial:roth_early_withdrawal_ordering_not_modeled"))
        );
        assert!(
            value["omissions"]
                .as_array()
                .unwrap()
                .contains(&json!("early-distribution exceptions not modeled"))
        );
        assert!(
            value["omissions"]
                .as_array()
                .unwrap()
                .contains(&json!("Roth early-withdrawal ordering not modeled"))
        );
        if let Some(expected) = previous {
            assert_eq!(first, &expected);
        }
        previous = Some(first.clone());
    }
}
#[test]
fn proportional_rounding_with_many_tiny_accounts_stays_bounded_and_conserves() {
    use horizon_engine::input::{Account, AccountType, WithdrawalOrder};
    let mut f = unfunded_fixture();
    f.household.persons[0].birth_date = Date("1960-01-01".into());
    f.household.persons[0].plan_end_age = 75;
    f.household.withdrawal_order = Some(WithdrawalOrder::ProportionalTaxableTaxDeferred);
    f.household.spending.after_retirement.cents = 2;
    f.household.accounts = (0..4)
        .map(|i| Account {
            id: format!("tiny-{i}"),
            owner: "synthetic-person".into(),
            account_type: AccountType::Taxable,
            opening_balance_cents: 1,
            cost_basis_cents: Some(1),
            tax_deferred_kind: None,
        })
        .collect();
    let value = serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap();
    conservation(&value);
    assert_eq!(cents(&value["years"][0]["ledger"]["withdrawals_total"]), 2);
    assert_eq!(cents(&value["years"][0]["ledger"]["shortfall"]), 0);
}
#[test]
fn input_order_cash_first_created_account_conflict_and_output_range() {
    let mut f = unfunded_fixture();
    f.household.accounts[0].opening_balance_cents = 60;
    let mut cash = f.household.accounts[0].clone();
    cash.id = "second-cash".into();
    cash.opening_balance_cents = 100;
    f.household.accounts.insert(1, cash);
    let value = serde_json::to_value(run(&f.household, &f.assumptions).unwrap()).unwrap();
    conservation(&value);
    assert_eq!(
        cents(&account(&value["years"][0]["ledger"], "cash")["withdrawal"]),
        60
    );
    assert_eq!(
        cents(&account(&value["years"][0]["ledger"], "second-cash")["withdrawal"]),
        40
    );
    let mut f = common::fixture("C-partial-base-year-no-taxable");
    f.household.accounts[0].id = "surplus-taxable".into();
    assert_eq!(
        run(&f.household, &f.assumptions).unwrap_err().code,
        "SURPLUS_ACCOUNT_ID_CONFLICT"
    );
    let mut f = unfunded_fixture();
    f.household.spending.after_retirement.cents = 0;
    f.household.accounts[3].opening_balance_cents = horizon_engine::money::JSON_CENT_LIMIT;
    f.assumptions
        .iter_mut()
        .find(|a| a.identifier == "investment_return")
        .unwrap()
        .value = "1".into();
    assert_eq!(
        run(&f.household, &f.assumptions).unwrap_err().code,
        "MONEY_OUTPUT_RANGE"
    );
}

#[test]
fn zero_balance_due_year_keeps_its_rule_source_and_1959_first_due_year() {
    let mut f = common::fixture("A-drawdown");
    f.household.persons[0].birth_date = Date("1959-06-30".into());
    f.household.accounts[2].opening_balance_cents = 0;
    let result = run(&f.household, &f.assumptions).unwrap();
    for y in &result.years {
        let account = y
            .ledger
            .accounts
            .iter()
            .find(|a| a.identifier == "ira")
            .unwrap();
        assert_eq!(account.distribution_source.is_some(), y.year >= 2032);
        if y.year >= 2032 {
            assert_eq!(account.rmd.rule_id, "rmd_uniform_lifetime");
        }
    }
    let mut f = common::fixture("D-still-working-rmd-surplus");
    f.household.accounts[2].opening_balance_cents = 0;
    let result = run(&f.household, &f.assumptions).unwrap();
    assert!(
        result.years[0]
            .ledger
            .accounts
            .iter()
            .find(|a| a.identifier == "k401")
            .unwrap()
            .distribution_source
            .is_some()
    );
    assert!(
        !result
            .omissions
            .contains(&"still-working distribution exception not modeled")
    );
}

fn account<'a>(ledger: &'a Value, id: &str) -> &'a Value {
    ledger["accounts"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["identifier"] == id)
        .unwrap()
}
#[test]
fn unicode_account_ids_remain_values_in_canonical_json() {
    let mut f = common::fixture("A-drawdown");
    f.household.accounts[1].id = "taxé-税".into();
    let result = run(&f.household, &f.assumptions).unwrap();
    let bytes = horizon_engine::canonical::canonical_json(&result).unwrap();
    let value: Value = serde_json::from_str(&bytes).unwrap();
    assert_eq!(
        account(&value["years"][0]["ledger"], "taxé-税")["identifier"],
        "taxé-税"
    );
    conservation(&value);
    let second =
        horizon_engine::canonical::canonical_json(&run(&f.household, &f.assumptions).unwrap())
            .unwrap();
    assert_eq!(bytes, second);
}
