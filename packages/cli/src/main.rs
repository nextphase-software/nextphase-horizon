// SPDX-License-Identifier: AGPL-3.0-only
#![forbid(unsafe_code)]
use horizon_app::{compare::compare_documents, export, import, parse_fixture, run_fixture};
use horizon_engine::{
    canonical::canonical_json,
    error::{Error, Status},
};
use serde_json::Value;
use std::{path::PathBuf, process::ExitCode};
fn read(requested: &str, fixture: bool) -> Result<String, Error> {
    let path = if fixture
        && !requested.contains('/')
        && !requested.contains('\\')
        && !requested.ends_with(".json")
    {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../app/fixtures")
            .join(format!("{requested}.json"))
    } else {
        PathBuf::from(requested)
    };
    std::fs::read_to_string(path).map_err(|_| {
        Error::invalid(
            "FIXTURE_READ",
            "Cannot read the requested UTF-8 fixture file.",
        )
    })
}
fn execute(args: &[String]) -> Result<(String, u8), Error> {
    let (value, status, legacy): (Value, &str, bool) = match args
        .iter()
        .map(String::as_str)
        .collect::<Vec<_>>()
        .as_slice()
    {
        [command @ ("dev-run" | "run"), requested] => {
            let run = run_fixture(&parse_fixture(&read(requested, true)?)?)?;
            (
                serde_json::to_value(&run).expect("run serialization"),
                run.status,
                *command == "dev-run",
            )
        }
        ["intake", requested] => {
            let result = horizon_app::plan_from_answers_json(&read(requested, false)?);
            (
                serde_json::to_value(&result).expect("intake serialization"),
                result.status,
                false,
            )
        }
        ["spend", requested] => {
            let result =
                horizon_app::sustainable_spending(&parse_fixture(&read(requested, true)?)?)?;
            (
                serde_json::to_value(&result).expect("answer serialization"),
                result.status,
                false,
            )
        }
        ["levers", requested] => {
            let result = horizon_app::levers(&parse_fixture(&read(requested, true)?)?)?;
            (
                serde_json::to_value(&result).expect("answer serialization"),
                result.status,
                false,
            )
        }
        ["impact", requested, rough] => {
            let rough: Vec<horizon_app::answers::RoughInput> =
                serde_json::from_str(&read(rough, false)?).map_err(|_| {
                    Error::invalid(
                        "MALFORMED_INPUT",
                        "Rough inputs must be a JSON array of path and optional low/high objects.",
                    )
                })?;
            let result =
                horizon_app::input_impact(&parse_fixture(&read(requested, true)?)?, &rough)?;
            (
                serde_json::to_value(&result).expect("answer serialization"),
                result.status,
                false,
            )
        }
        ["compare", a, b] => {
            let a = read(a, true);
            let b = read(b, true);
            let (a, b) = horizon_app::compare::read_pair(a, b)?;
            let result = compare_documents(&a, &b)?;
            (
                serde_json::to_value(&result).expect("comparison serialization"),
                result.status,
                false,
            )
        }
        ["export", requested] => {
            let result = export(&parse_fixture(&read(requested, true)?)?)?;
            (
                serde_json::to_value(&result).expect("export serialization"),
                result.run.status,
                false,
            )
        }
        ["import", requested] => {
            let result = import(&read(requested, false)?)?;
            (
                serde_json::to_value(&result).expect("run serialization"),
                result.status,
                false,
            )
        }
        _ => {
            return Err(Error::invalid(
                "CLI_USAGE",
                "Usage: horizon intake <answers.json> | spend <name|path> | levers <name|path> | impact <name|path> <rough.json> | run <name|path> | compare <baseline> <scenario> | export <name|path> | import <path> | dev-run <name|path>",
            ));
        }
    };
    Ok((
        canonical_json(&value)?,
        match status {
            "partial" if !legacy => 3,
            "incomplete" => 4,
            "invalid" => 1,
            "unsupported" => 2,
            _ => 0,
        },
    ))
}
fn main() -> ExitCode {
    let args: Vec<_> = std::env::args().skip(1).collect();
    match execute(&args) {
        Ok((json, exit)) => {
            println!("{json}");
            ExitCode::from(exit)
        }
        Err(error) => {
            println!(
                "{}",
                canonical_json(&error).expect("error envelope serialization")
            );
            ExitCode::from(match error.status {
                Status::Invalid => 1,
                Status::Unsupported => 2,
            })
        }
    }
}
