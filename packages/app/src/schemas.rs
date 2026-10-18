// SPDX-License-Identifier: AGPL-3.0-only
use schemars::Schema;
use serde_json::Value;
fn named(schema: Schema, id: &str) -> Value {
    let mut v = serde_json::to_value(schema).expect("schema serialization is infallible");
    v["$id"] = Value::String(format!("urn:nextphase:horizon:{id}:v1"));
    v
}
pub fn run_schema() -> Value {
    named(
        schemars::schema_for!(horizon_engine::projection::Run),
        "run-output",
    )
}
pub fn comparison_schema() -> Value {
    named(
        schemars::schema_for!(crate::compare::Comparison),
        "comparison",
    )
}
pub fn export_schema() -> Value {
    named(schemars::schema_for!(crate::export::Export), "export")
}
