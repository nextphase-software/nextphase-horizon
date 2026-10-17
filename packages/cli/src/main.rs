// SPDX-License-Identifier: AGPL-3.0-only
#![forbid(unsafe_code)]
use horizon_engine::{
    canonical::canonical_json,
    error::{Error, Status},
};
use std::{path::PathBuf, process::ExitCode};

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() != 2 || args[0] != "dev-run" {
        return print_error(Error::invalid(
            "CLI_USAGE",
            "Usage: horizon dev-run <fixture name | file path>",
        ));
    }
    let requested = &args[1];
    let path =
        if !requested.contains('/') && !requested.contains('\\') && !requested.ends_with(".json") {
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../app/fixtures")
                .join(format!("{requested}.json"))
        } else {
            PathBuf::from(requested)
        };
    let result = std::fs::read_to_string(path)
        .map_err(|_| {
            Error::invalid(
                "FIXTURE_READ",
                "Cannot read the requested UTF-8 fixture file.",
            )
        })
        .and_then(|text| horizon_app::parse_fixture(&text))
        .and_then(|fixture| horizon_app::run_fixture(&fixture))
        .and_then(|run| canonical_json(&run));
    match result {
        Ok(json) => {
            println!("{json}");
            ExitCode::SUCCESS
        }
        Err(error) => print_error(error),
    }
}
fn print_error(error: Error) -> ExitCode {
    // Error envelopes have only fixed ASCII keys and string values.
    println!(
        "{}",
        canonical_json(&error).expect("error envelope is canonical JSON")
    );
    match error.status {
        Status::Invalid => ExitCode::from(1),
        Status::Unsupported => ExitCode::from(2),
    }
}
