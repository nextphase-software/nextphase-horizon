// SPDX-License-Identifier: AGPL-3.0-only
mod common;
mod validation {
    use super::common;
    use horizon_app::{household_schema, parse_fixture, parse_household, run};
    use horizon_engine::{
        canonical::canonical_json,
        error::Status,
        input::{Date, validate_household},
    };
    use jsonschema::{Keyword, ValidationError};
    use serde_json::{Value, json};

    struct HouseholdRules;
    impl<'i> Keyword<'i> for HouseholdRules {
        fn validate(&self, instance: &'i Value) -> Result<(), ValidationError<'i>> {
            parse_household(instance)
                .map(|_| ())
                .map_err(|e| ValidationError::custom(e.to_string()))
        }
        fn is_valid(&self, instance: &'i Value) -> bool {
            parse_household(instance).is_ok()
        }
    }
    fn validator() -> jsonschema::Validator {
        let schema: Value = serde_json::from_str(
            &std::fs::read_to_string(
                common::root().join("docs/model/schemas/household-input.v1.schema.json"),
            )
            .unwrap(),
        )
        .unwrap();
        jsonschema::options()
            .with_keyword("x-horizon-validation", |_, version, _| {
                if version == "v1" {
                    Ok(Box::new(HouseholdRules))
                } else {
                    Err(ValidationError::schema(
                        "Unsupported household validation version",
                    ))
                }
            })
            .build(&schema)
            .unwrap()
    }
    #[test]
    fn fixture_schema_and_generated_schema_match() {
        let committed = std::fs::read_to_string(
            common::root().join("docs/model/schemas/household-input.v1.schema.json"),
        )
        .unwrap();
        assert_eq!(
            committed,
            format!(
                "{}\n",
                serde_json::to_string_pretty(&household_schema()).unwrap()
            )
        );
        let v = validator();
        for name in common::VALID {
            let f = common::fixture(name);
            assert!(
                v.is_valid(&serde_json::to_value(&f.household).unwrap()),
                "{name}"
            );
        }
    }
    #[test]
    fn every_invalid_fixture_has_a_stable_code_and_readable_message() {
        let v = validator();
        for &(name, code, exit) in common::INVALID {
            let result =
                parse_fixture(&common::text(name)).and_then(|f| run(&f.household, &f.assumptions));
            let error = result.unwrap_err();
            assert_eq!(error.code, code, "{name}");
            assert_eq!(
                error.status,
                if exit == 2 {
                    Status::Unsupported
                } else {
                    Status::Invalid
                },
                "{name}"
            );
            let message = match code {
                "MISSING_FIELD" => "Missing required field: valuation_date.",
                "NEGATIVE_BALANCE" => {
                    "Balances, cost bases and entered amounts must be nonnegative cents."
                }
                "END_BEFORE_START" => "Wage end date precedes its start date.",
                "UNKNOWN_ACCOUNT_TYPE" => {
                    "Account type must be cash, taxable, tax_deferred or roth."
                }
                "PLAN_END_AGE_REACHED" => {
                    "The person reaches the plan end age by 31 December of the base year."
                }
                "MULTIPLE_PERSONS_UNSUPPORTED" => "Only one person is supported.",
                _ => {
                    assert!(!error.message.is_empty());
                    &error.message
                }
            };
            assert_eq!(error.message, message);
            let value: Value = serde_json::from_str(&common::text(name)).unwrap();
            // The published schema covers household input. Assumptions are a
            // separate register validated by run, not household properties.
            if !["INVALID_RATE", "MISSING_ASSUMPTION"].contains(&code) {
                let errors: Vec<_> = v
                    .iter_errors(&value["household"])
                    .map(|e| e.to_string())
                    .collect();
                assert!(
                    errors.iter().any(|e| e.contains(code)),
                    "{name}: {errors:?}"
                );
            }
        }
    }
    #[test]
    fn strict_types_dates_and_direct_run_validation() {
        let f = common::fixture("synthetic-working");
        let value = serde_json::to_value(&f.household).unwrap();
        for (path, bad) in [
            ("valuation_date", json!("2026-13-01")),
            ("valuation_date", json!("2026-02-30")),
            ("valuation_date", json!("0000-01-01")),
        ] {
            let mut altered = value.clone();
            altered[path] = bad;
            assert_eq!(parse_household(&altered).unwrap_err().code, "INVALID_DATE");
        }
        assert!(Date("2000-02-29".into()).validate().is_ok());
        assert!(Date("1900-02-29".into()).validate().is_err());
        let mut altered = value.clone();
        altered["accounts"][0]["opening_balance_cents"] = serde_json::from_str("1.5").unwrap();
        assert_eq!(
            parse_household(&altered).unwrap_err().code,
            "MALFORMED_INPUT"
        );
        let mut h = f.household.clone();
        h.accounts[0].opening_balance_cents = -1;
        assert_eq!(
            run(&h, &f.assumptions).unwrap_err().code,
            "NEGATIVE_BALANCE"
        );
        h = f.household.clone();
        h.persons.clear();
        assert_eq!(validate_household(&h).unwrap_err().code, "PERSON_REQUIRED");
        h = f.household.clone();
        h.accounts[1].id = h.accounts[0].id.clone();
        assert_eq!(
            validate_household(&h).unwrap_err().code,
            "INVALID_ACCOUNT_ID"
        );
        h = f.household.clone();
        h.persons[0].birth_date = Date("2030-01-01".into());
        assert_eq!(
            validate_household(&h).unwrap_err().code,
            "INVALID_DATE_ORDER"
        );
        let mut a = f.assumptions.clone();
        a[0].unit = "percent".into();
        assert_eq!(
            run(&f.household, &a).unwrap_err().code,
            "INVALID_ASSUMPTION"
        );
        a = f.assumptions.clone();
        a.push(a[0].clone());
        assert_eq!(
            run(&f.household, &a).unwrap_err().code,
            "DUPLICATE_ASSUMPTION"
        );
        a = f.assumptions.clone();
        a[0].identifier = "unsupported_return".into();
        assert_eq!(
            run(&f.household, &a).unwrap_err().code,
            "ASSUMPTION_UNSUPPORTED"
        );
    }
    #[test]
    fn deterministic_runs_hash_independence_and_units() {
        for name in common::VALID {
            let f = common::fixture(name);
            let first = run(&f.household, &f.assumptions).unwrap();
            assert_eq!(
                canonical_json(&first).unwrap(),
                canonical_json(&run(&f.household, &f.assumptions).unwrap()).unwrap()
            );
            assert_eq!(first.assumptions_used, f.assumptions);
            let mut a = f.assumptions.clone();
            a[0].value = "0.01".into();
            let changed = run(&f.household, &a).unwrap();
            assert_ne!(
                first.metadata.assumption_set_hash,
                changed.metadata.assumption_set_hash
            );
            assert_eq!(first.metadata.input_hash, changed.metadata.input_hash);
            let mut h = f.household.clone();
            h.accounts[0].opening_balance_cents = 1;
            let changed = run(&h, &f.assumptions).unwrap();
            assert_ne!(first.metadata.input_hash, changed.metadata.input_hash);
            assert_eq!(
                first.metadata.assumption_set_hash,
                changed.metadata.assumption_set_hash
            );
            fn check(value: &Value) {
                match value {
                    Value::Object(map) => {
                        if map.contains_key("cents") {
                            assert_eq!(map["unit"], "cent");
                            assert_eq!(map["currency"], "USD");
                            assert!(
                                [json!("today"), json!("nominal")].contains(&map["dollar_basis"])
                            );
                            assert!(map["base_year"].is_u64());
                            assert!(map["year"].is_u64());
                        }
                        for v in map.values() {
                            check(v);
                        }
                    }
                    Value::Array(items) => {
                        for v in items {
                            check(v)
                        }
                    }
                    _ => {}
                }
            }
            check(&serde_json::to_value(first).unwrap());
        }
    }
}
