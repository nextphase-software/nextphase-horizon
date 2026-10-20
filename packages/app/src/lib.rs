// SPDX-License-Identifier: AGPL-3.0-only
#![forbid(unsafe_code)]
#![deny(clippy::float_arithmetic, clippy::arithmetic_side_effects)]

use horizon_engine::{
    error::{Error, Result},
    input::{Assumption, Household, validate_household},
    projection::{Run, project},
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Fixture {
    pub household: Household,
    pub assumptions: Vec<Assumption>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pass_limit: Option<u16>,
}

pub fn run(household: &Household, assumptions: &[Assumption]) -> Result<Run> {
    project(household, assumptions)
}

pub fn run_fixture(fixture: &Fixture) -> Result<Run> {
    run_with_tax_limit(
        &fixture.household,
        &fixture.assumptions,
        fixture
            .pass_limit
            .unwrap_or(horizon_engine::tax::DEFAULT_PASS_LIMIT),
    )
}
pub fn run_pre_tax(household: &Household, assumptions: &[Assumption]) -> Result<Run> {
    horizon_engine::projection::project_pre_tax(household, assumptions)
}
pub fn run_with_tax_limit(
    household: &Household,
    assumptions: &[Assumption],
    limit: u16,
) -> Result<Run> {
    horizon_engine::projection::project_with_tax_limit(household, assumptions, limit)
}

pub fn parse_household(value: &Value) -> Result<Household> {
    if value
        .get("persons")
        .and_then(Value::as_array)
        .is_some_and(|p| p.len() > 1)
    {
        return Err(Error::unsupported(
            "MULTIPLE_PERSONS_UNSUPPORTED",
            "Only one person is supported.",
        ));
    }
    let household: Household = serde_json::from_value(value.clone()).map_err(parse_error)?;
    validate_household(&household)?;
    Ok(household)
}
pub fn parse_fixture(text: &str) -> Result<Fixture> {
    let value: Value = serde_json::from_str(text).map_err(parse_error)?;
    let household = value
        .get("household")
        .ok_or_else(|| Error::invalid("MISSING_FIELD", "Missing required field: household."))?;
    parse_household(household)?;
    serde_json::from_value(value).map_err(parse_error)
}
fn parse_error(error: serde_json::Error) -> Error {
    let message = error.to_string();
    if let Some(rest) = message.strip_prefix("missing field `") {
        let field = rest.split('`').next().unwrap_or("unknown");
        return Error::invalid("MISSING_FIELD", format!("Missing required field: {field}."));
    }
    if message.starts_with("unknown variant")
        && message.contains("tax_deferred")
        && message.contains("taxable")
    {
        return Error::invalid(
            "UNKNOWN_ACCOUNT_TYPE",
            "Account type must be cash, taxable, tax_deferred or roth.",
        );
    }
    if message.starts_with("unknown field `state_tax")
        || message.starts_with("unknown field `healthcare")
    {
        return Error::unsupported(
            "FEATURE_UNSUPPORTED",
            "State tax and healthcare inputs are unsupported.",
        );
    }
    Error::invalid(
        "MALFORMED_INPUT",
        "Input must match the published household schema; unknown fields and fractional JSON numbers are rejected.",
    )
}

/// 2020-12 structural schema, generated from the Rust types. The extension
/// delegates cross-field date/ownership checks and stable codes to parse_household.
pub fn household_schema() -> Value {
    let mut schema = serde_json::to_value(schemars::schema_for!(HouseholdV1))
        .expect("schema serialization is infallible");
    schema["$id"] = Value::String("urn:nextphase:horizon:household-input:v1".into());
    schema["x-horizon-validation"] = Value::String("v1".into());
    schema
}

// Retain the v1 generator and schema byte for byte; the current operation uses v2.
#[derive(JsonSchema, Serialize, Deserialize)]
#[schemars(rename = "Household")]
#[serde(deny_unknown_fields)]
struct HouseholdV1 {
    valuation_date: horizon_engine::input::Date,
    #[schemars(length(min = 1, max = 1))]
    persons: Vec<horizon_engine::input::Person>,
    accounts: Vec<horizon_engine::input::Account>,
    income: horizon_engine::input::Income,
    spending: horizon_engine::input::Spending,
}

pub fn household_schema_v2() -> Value {
    let mut schema = serde_json::to_value(schemars::schema_for!(Household))
        .expect("schema serialization is infallible");
    schema["$id"] = Value::String("urn:nextphase:horizon:household-input:v2".into());
    schema["x-horizon-validation"] = Value::String("v2".into());
    schema
}

pub mod compare;
pub mod export;
pub mod schemas;
pub use compare::{compare, scenario};
pub use export::{export, import};

pub mod answers;
pub use answers::{input_impact, levers, sustainable_spending};

/// JSON transport helpers shared by thin adapters.
pub mod json;

pub mod intake;
pub use intake::{plan_from_answers, plan_from_answers_json};
