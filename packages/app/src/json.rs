// SPDX-License-Identifier: AGPL-3.0-only
//! Serialization only: adapters use the existing operations and error envelopes.
use horizon_engine::{
    canonical::canonical_json,
    error::{Error, Result},
};
use serde::{Serialize, de::DeserializeOwned};

pub fn encode<T: Serialize>(result: Result<T>) -> String {
    match result.and_then(|value| canonical_json(&value)) {
        Ok(json) => json,
        Err(error) => canonical_json(&error).expect("error envelopes are canonical"),
    }
}

pub fn changes(text: &str) -> Result<Vec<crate::compare::PointerChange>> {
    parse(
        text,
        "Scenario changes must be a JSON array of path and value objects.",
    )
}
pub fn rough(text: &str) -> Result<Vec<crate::answers::RoughInput>> {
    parse(
        text,
        "Rough inputs must be a JSON array of path and optional low/high objects.",
    )
}
fn parse<T: DeserializeOwned>(text: &str, message: &str) -> Result<T> {
    serde_json::from_str(text).map_err(|_| Error::invalid("MALFORMED_INPUT", message))
}
