// SPDX-License-Identifier: AGPL-3.0-only
#[path = "support/fixtures.rs"]
mod fixtures;
#[path = "support/units_w1.rs"]
mod units_w1;
#[path = "support/units_w2.rs"]
mod units_w2;
#[path = "support/units_w3.rs"]
mod units_w3;
use horizon_engine::canonical::canonical_json;
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn every_fixture_matches_native_run_export_golden_and_round_trip() {
    assert_eq!(fixtures::FIXTURES.len(), 26);
    assert_eq!(
        horizon_app::import(include_str!("../../app/test-data/model-0.3.0.export.json"))
            .unwrap_err()
            .code,
        "EXPORT_MODEL_VERSION_UNSUPPORTED"
    );
    for (name, input, run, export) in fixtures::FIXTURES {
        let f = horizon_app::parse_fixture(input).unwrap();
        let actual = horizon_app::run_fixture(&f).unwrap();
        assert_eq!(
            format!("{}\n", canonical_json(&actual).unwrap()),
            *run,
            "run {name}"
        );
        let actual = horizon_app::export(&f).unwrap();
        assert_eq!(
            format!("{}\n", canonical_json(&actual).unwrap()),
            *export,
            "export {name}"
        );
        let restored = horizon_app::import(export).unwrap();
        assert_eq!(
            format!("{}\n", canonical_json(&restored).unwrap()),
            *run,
            "import {name}"
        );
    }
}
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn compiled_manifest_covers_every_valid_fixture() {
    let mut names = Vec::new();
    for entry in
        std::fs::read_dir(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../app/fixtures"))
            .unwrap()
    {
        let p = entry.unwrap().path();
        let text = std::fs::read_to_string(&p).unwrap();
        if horizon_app::parse_fixture(&text)
            .and_then(|f| horizon_app::run_fixture(&f))
            .is_ok()
        {
            names.push(p.file_stem().unwrap().to_str().unwrap().to_owned());
        }
    }
    names.sort();
    let mut compiled = fixtures::FIXTURES
        .iter()
        .map(|r| r.0.to_string())
        .collect::<Vec<_>>();
    compiled.sort();
    assert_eq!(names, compiled);
}

#[path = "support/answer_golden.rs"]
mod answer_golden;
#[path = "support/answers.rs"]
mod answers_reference;
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn answers_spending_reference_and_golden() {
    answers_reference::spending();
}
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn answers_levers_reference_and_golden() {
    answers_reference::lever_values();
}
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn answers_impact_reference_and_golden() {
    answers_reference::impact();
}
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn answers_today_reference() {
    answers_reference::today_values();
    answers_reference::comparison_today();
}
