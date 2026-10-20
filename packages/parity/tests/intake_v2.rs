// SPDX-License-Identifier: AGPL-3.0-only
#[path = "support/intake_v2.rs"]
mod reference;
#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test::wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn intake_v2_reference_values_and_canonical_bytes() {
    reference::reference_values();
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test::wasm_bindgen_test]
fn intake_v2_timing() {
    let cases = reference::cases();
    for name in [
        "v2-working-complete",
        "v2-solve-spending",
        "v2-solve-savings",
        "v2-solve-retirement",
        "v2-solve-savings-with-range",
    ] {
        let answers: horizon_app::intake::v2::AnswersV2 =
            serde_json::from_value(cases[name]["answers"].clone()).unwrap();
        let start = wasm_bindgen_test::Instant::now();
        for _ in 0..10 {
            let result = std::hint::black_box(horizon_app::plan_from_answers(
                std::hint::black_box(&answers),
            ));
            assert!(result.code.is_none(), "{name}");
        }
        let mean_us = start.elapsed().as_micros().checked_div(10).unwrap();
        wasm_bindgen_test::console_log!(
            "{name}: mean {}.{:03} ms (10 runs)",
            mean_us.checked_div(1000).unwrap(),
            mean_us.checked_rem(1000).unwrap()
        );
    }
}
