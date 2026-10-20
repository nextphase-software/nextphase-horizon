// SPDX-License-Identifier: AGPL-3.0-only
use horizon_engine::canonical::canonical_json;
use serde_json::Value;
use std::process::Command;
#[test]
fn intake_every_reference_case_cli_bytes_and_status() {
    let cases: Value = serde_json::from_str(include_str!(
        "../../../docs/briefs/0002-W4-reference-values.json"
    ))
    .unwrap();
    let directory = std::env::temp_dir().join(format!("horizon-intake-{}", std::process::id()));
    std::fs::create_dir(&directory).unwrap();
    for (name, case) in cases["cases"].as_object().unwrap() {
        let path = directory.join(format!("{name}.json"));
        let text = case["answers"].to_string();
        std::fs::write(&path, &text).unwrap();
        let actual = horizon_app::plan_from_answers_json(&text);
        let output = Command::new(env!("CARGO_BIN_EXE_horizon"))
            .args(["intake", path.to_str().unwrap()])
            .current_dir(std::env::temp_dir())
            .output()
            .unwrap();
        let code = match actual.status {
            "complete" => 0,
            "partial" => 3,
            "incomplete" => 4,
            "invalid" => 1,
            "unsupported" => 2,
            _ => panic!(),
        };
        assert_eq!(output.status.code(), Some(code), "{name}");
        assert_eq!(
            output.stdout,
            format!("{}\n", canonical_json(&actual).unwrap()).as_bytes(),
            "{name}"
        );
        assert!(output.stderr.is_empty());
    }
    std::fs::remove_dir_all(directory).unwrap();
}
