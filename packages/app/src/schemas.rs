// SPDX-License-Identifier: AGPL-3.0-only
use schemars::Schema;
use serde_json::Value;
fn named(schema: Schema, id: &str, version: u16) -> Value {
    let mut v = serde_json::to_value(schema).expect("schema serialization is infallible");
    v["$id"] = Value::String(format!("urn:nextphase:horizon:{id}:v{version}"));
    v
}
pub fn run_schema() -> Value {
    named(
        schemars::schema_for!(horizon_engine::projection::Run),
        "run-output",
        2,
    )
}
pub fn comparison_schema() -> Value {
    named(
        schemars::schema_for!(crate::compare::Comparison),
        "comparison",
        2,
    )
}
pub fn export_schema() -> Value {
    named(schemars::schema_for!(crate::export::Export), "export", 2)
}

pub fn sustainable_spending_schema() -> Value {
    named(
        schemars::schema_for!(crate::answers::SustainableSpending),
        "sustainable-spending",
        1,
    )
}
pub fn levers_schema() -> Value {
    named(schemars::schema_for!(crate::answers::Levers), "levers", 1)
}
pub fn input_impact_schema() -> Value {
    named(
        schemars::schema_for!(crate::answers::InputImpact),
        "input-impact",
        1,
    )
}
