// SPDX-License-Identifier: AGPL-3.0-only
#[path = "../../app/tests/common/mod.rs"]
mod common;
use horizon_engine::canonical::canonical_json;
use serde_json::{Value, json};
use std::process::Command;
fn invoke(args: &[&str], value: &Value, exit: i32) {
    let r = Command::new(env!("CARGO_BIN_EXE_horizon"))
        .args(args)
        .current_dir(std::env::temp_dir())
        .output()
        .unwrap();
    assert_eq!(
        r.status.code(),
        Some(exit),
        "{args:?}: {}",
        String::from_utf8_lossy(&r.stderr)
    );
    assert_eq!(
        r.stdout,
        format!("{}\n", canonical_json(value).unwrap()).as_bytes(),
        "{args:?}"
    );
    assert!(r.stderr.is_empty());
}
fn exit(status: &str) -> i32 {
    match status {
        "complete" => 0,
        "partial" => 3,
        "invalid" => 1,
        "unsupported" => 2,
        _ => panic!("unknown status"),
    }
}
#[test]
fn every_fixture_supported_commands_match_application_bytes_status_and_dev_run() {
    let mut paths: Vec<_> = std::fs::read_dir(common::root().join("packages/app/fixtures"))
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect();
    paths.sort();
    assert_eq!(paths.len(), 48);
    let base = common::text("A-drawdown");
    for p in paths {
        let name = p.file_stem().unwrap().to_str().unwrap();
        let text = std::fs::read_to_string(&p).unwrap();
        let parsed = horizon_app::parse_fixture(&text);
        let run = parsed.clone().and_then(|f| horizon_app::run_fixture(&f));
        match run {
            Ok(run) => {
                let v = json!(run);
                let e = json!(horizon_app::export(&parsed.unwrap()).unwrap());
                for requested in [name, p.to_str().unwrap()] {
                    invoke(&["run", requested], &v, exit(run.status));
                    invoke(&["dev-run", requested], &v, 0);
                    invoke(&["export", requested], &e, exit(run.status));
                }
                let exported =
                    common::root().join(format!("packages/parity/golden/{name}.export.json"));
                invoke(
                    &["import", exported.to_str().unwrap()],
                    &v,
                    exit(run.status),
                );
            }
            Err(error) => {
                let v = json!(error);
                for cmd in ["run", "dev-run", "export"] {
                    invoke(&[cmd, name], &v, exit(v["status"].as_str().unwrap()));
                }
            }
        }
        let comparison = horizon_app::compare::compare_documents(&base, &text);
        let v = match comparison {
            Ok(c) => json!(c),
            Err(e) => json!(e),
        };
        invoke(
            &["compare", "A-drawdown", name],
            &v,
            exit(v["status"].as_str().unwrap()),
        );
    }
}
#[test]
fn reference_comparison_pairs_and_import_errors_match_application() {
    let refs: Value = serde_json::from_str(include_str!(
        "../../../docs/briefs/0001-W4-reference-values.json"
    ))
    .unwrap();
    for name in refs["comparisons"].as_object().unwrap().keys() {
        let a = format!("{name}-baseline");
        let b = format!("{name}-scenario");
        let c = horizon_app::compare(&common::fixture(&a), &common::fixture(&b)).unwrap();
        invoke(&["compare", &a, &b], &json!(c), exit(c.status));
    }
    for name in [
        "tampered-export",
        "unknown-format-export",
        "model-0.3.0.export",
    ] {
        let p = common::root().join(format!("packages/app/test-data/{name}.json"));
        let e = horizon_app::import(&std::fs::read_to_string(&p).unwrap()).unwrap_err();
        let v = json!(e);
        invoke(
            &["import", p.to_str().unwrap()],
            &v,
            exit(v["status"].as_str().unwrap()),
        );
    }
    for args in [
        vec!["run"],
        vec!["compare", "A-drawdown"],
        vec!["export"],
        vec!["import"],
        vec!["run", "missing-fixture"],
        vec!["import", "missing-export"],
    ] {
        let result = Command::new(env!("CARGO_BIN_EXE_horizon"))
            .args(&args)
            .output()
            .unwrap();
        assert_eq!(result.status.code(), Some(1));
        let v: Value = serde_json::from_slice(&result.stdout).unwrap();
        assert_eq!(v["status"], "invalid");
        assert_eq!(
            v["code"],
            if args.len() > 1 && args[0] != "compare" {
                "FIXTURE_READ"
            } else {
                "CLI_USAGE"
            }
        );
    }
}
