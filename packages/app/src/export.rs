// SPDX-License-Identifier: AGPL-3.0-only
use crate::{Fixture, parse_fixture, run_fixture};
use horizon_engine::{
    canonical::{canonical_json, hash},
    error::{Error, Result},
    projection::Run,
};
use schemars::JsonSchema;
use serde::Serialize;
use serde_json::Value;
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct ExportHashes {
    pub method: &'static str,
    pub input_hash: String,
    pub assumption_set_hash: String,
    pub export_content_hash: String,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Export {
    pub export_format_version: u16,
    pub model_version: &'static str,
    pub rule_set_identifier: &'static str,
    pub rule_set_year: u16,
    pub input: Fixture,
    pub run: Run,
    pub hashes: ExportHashes,
}
pub fn content_hash(value: &Value) -> Result<String> {
    let mut value = value.clone();
    value
        .get_mut("hashes")
        .and_then(Value::as_object_mut)
        .ok_or_else(|| {
            Error::invalid(
                "EXPORT_HASH_MISMATCH",
                "Export hashes are missing or malformed.",
            )
        })?
        .remove("export_content_hash");
    hash(&value)
}
pub fn export(input: &Fixture) -> Result<Export> {
    let run = run_fixture(input)?;
    let mut result = Export {
        export_format_version: 1,
        model_version: run.metadata.model_version,
        rule_set_identifier: run.metadata.rule_set_identifier,
        rule_set_year: run.metadata.rule_set_year,
        input: input.clone(),
        hashes: ExportHashes {
            method: "sha-256",
            input_hash: run.metadata.input_hash.clone(),
            assumption_set_hash: run.metadata.assumption_set_hash.clone(),
            export_content_hash: String::new(),
        },
        run,
    };
    result.hashes.export_content_hash =
        content_hash(&serde_json::to_value(&result).map_err(|_| malformed())?)?;
    Ok(result)
}
fn malformed() -> Error {
    Error::invalid(
        "MALFORMED_INPUT",
        "Export must be a JSON document matching export format v1.",
    )
}
pub fn import(text: &str) -> Result<Run> {
    let value: Value = serde_json::from_str(text).map_err(|_| malformed())?;
    if value["export_format_version"] != 1 {
        return Err(Error::unsupported(
            "EXPORT_FORMAT_UNSUPPORTED",
            "Only export format version 1 is supported.",
        ));
    }
    let expected = content_hash(&value).map_err(|_| {
        Error::invalid(
            "EXPORT_HASH_MISMATCH",
            "Export content hash does not match.",
        )
    })?;
    if value["hashes"]["export_content_hash"].as_str() != Some(&expected) {
        return Err(Error::invalid(
            "EXPORT_HASH_MISMATCH",
            "Export content hash does not match.",
        ));
    }
    if value["model_version"] != horizon_engine::projection::MODEL_VERSION {
        return Err(Error::unsupported(
            "EXPORT_MODEL_VERSION_UNSUPPORTED",
            "Export model version differs from the running engine.",
        ));
    }
    let input = parse_fixture(&canonical_json(&value["input"])?)?;
    let run = run_fixture(&input)?;
    let embedded = canonical_json(&value["run"])?;
    // Rebuild the entire envelope too: duplicated hashes, rule-set metadata and
    // unknown fields must not contradict a correctly reproduced embedded run.
    let reproduced = export(&input)?;
    if canonical_json(&run)? != embedded || canonical_json(&reproduced)? != canonical_json(&value)?
    {
        return Err(Error::invalid(
            "EXPORT_RESULT_MISMATCH",
            "Export does not reproduce the embedded run and metadata.",
        ));
    }
    Ok(run)
}
