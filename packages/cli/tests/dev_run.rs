// SPDX-License-Identifier: AGPL-3.0-only
#[path = "../../app/tests/common/mod.rs"]
mod common;
use std::process::Command;
#[test]
fn fixture_names_and_paths_match_application_bytes() {
    for name in common::VALID
        .iter()
        .chain(common::W2_VALID)
        .chain(common::W3_VALID)
    {
        let f = common::fixture(name);
        let expected = format!(
            "{}\n",
            horizon_engine::canonical::canonical_json(&horizon_app::run_fixture(&f).unwrap())
                .unwrap()
        );
        let path = common::root()
            .join("packages/app/fixtures")
            .join(format!("{name}.json"));
        for requested in [name.to_string(), path.to_string_lossy().into_owned()] {
            let result = Command::new(env!("CARGO_BIN_EXE_horizon"))
                .args(["dev-run", &requested])
                .current_dir(std::env::temp_dir())
                .output()
                .unwrap();
            assert_eq!(result.status.code(), Some(0));
            assert!(result.stderr.is_empty());
            assert_eq!(result.stdout, expected.as_bytes());
        }
    }
}
#[test]
fn invalid_and_unsupported_have_exact_exit_status_and_json() {
    for &(name, code, exit) in common::INVALID
        .iter()
        .chain(common::W2_INVALID)
        .chain(common::W3_INVALID)
    {
        let result = Command::new(env!("CARGO_BIN_EXE_horizon"))
            .args(["dev-run", name])
            .output()
            .unwrap();
        assert_eq!(result.status.code(), Some(i32::from(exit)), "{name}");
        let json: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
        assert_eq!(json["code"], code, "{name}");
        assert_eq!(
            json["status"],
            if exit == 2 { "unsupported" } else { "invalid" }
        );
        assert_eq!(
            result.stdout,
            format!(
                "{}\n",
                horizon_engine::canonical::canonical_json(&json).unwrap()
            )
            .as_bytes()
        );
    }
}
#[test]
fn missing_file_and_usage_errors_are_json() {
    for args in [
        vec!["dev-run", "does-not-exist"],
        vec![],
        vec!["run", "synthetic-working"],
    ] {
        let result = Command::new(env!("CARGO_BIN_EXE_horizon"))
            .args(&args)
            .output()
            .unwrap();
        assert_eq!(result.status.code(), Some(1));
        let json: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
        assert_eq!(
            json["code"],
            if args.first() == Some(&"dev-run") {
                "FIXTURE_READ"
            } else {
                "CLI_USAGE"
            }
        );
    }
}
