// SPDX-License-Identifier: AGPL-3.0-only
#[path = "../../app/tests/common/mod.rs"]
mod common;
use horizon_engine::canonical::canonical_json;
use serde_json::Value;
use std::process::Command;
fn check(args: &[&str], expected: Result<Value, horizon_engine::error::Error>) {
    let v = match expected {
        Ok(v) => v,
        Err(e) => serde_json::to_value(e).unwrap(),
    };
    let exit = match v["status"].as_str().unwrap() {
        "complete" => 0,
        "partial" => 3,
        "invalid" => 1,
        "unsupported" => 2,
        _ => panic!("status"),
    };
    let out = Command::new(env!("CARGO_BIN_EXE_horizon"))
        .args(args)
        .current_dir(std::env::temp_dir())
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(exit), "{args:?}");
    assert_eq!(
        out.stdout,
        format!("{}\n", canonical_json(&v).unwrap()).as_bytes(),
        "{args:?}"
    );
    assert!(out.stderr.is_empty());
}
#[test]
fn answers_every_fixture_and_reference_case_cli_bytes_and_status() {
    let root = common::root();
    let empty = root.join("packages/app/test-data/empty-rough.json");
    let mut paths: Vec<_> = std::fs::read_dir(root.join("packages/app/fixtures"))
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect();
    paths.sort();
    assert_eq!(paths.len(), 48);
    for path in paths {
        let name = path.file_stem().unwrap().to_str().unwrap();
        let parsed = horizon_app::parse_fixture(&std::fs::read_to_string(&path).unwrap());
        check(
            &["spend", name],
            parsed
                .clone()
                .and_then(|f| horizon_app::sustainable_spending(&f))
                .map(|v| serde_json::to_value(v).unwrap()),
        );
        check(
            &["levers", name],
            parsed
                .clone()
                .and_then(|f| horizon_app::levers(&f))
                .map(|v| serde_json::to_value(v).unwrap()),
        );
        check(
            &["impact", name, empty.to_str().unwrap()],
            parsed
                .and_then(|f| horizon_app::input_impact(&f, &[]))
                .map(|v| serde_json::to_value(v).unwrap()),
        );
    }
    let rough = root.join("packages/app/test-data/answers-working-61-rough.json");
    let items: Vec<horizon_app::answers::RoughInput> =
        serde_json::from_str(&std::fs::read_to_string(&rough).unwrap()).unwrap();
    let f = common::fixture("answers-working-61");
    check(
        &["impact", "answers-working-61", rough.to_str().unwrap()],
        horizon_app::input_impact(&f, &items).map(|v| serde_json::to_value(v).unwrap()),
    );
    let file = root.join("packages/app/fixtures/answers-working-61.json");
    check(
        &["spend", file.to_str().unwrap()],
        horizon_app::sustainable_spending(&f).map(|v| serde_json::to_value(v).unwrap()),
    );
}
