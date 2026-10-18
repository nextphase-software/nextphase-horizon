// SPDX-License-Identifier: AGPL-3.0-only
fn main() {
    for (name, version, schema) in [
        ("run-output", 2, horizon_app::schemas::run_schema()),
        ("comparison", 2, horizon_app::schemas::comparison_schema()),
        ("export", 2, horizon_app::schemas::export_schema()),
        (
            "sustainable-spending",
            1,
            horizon_app::schemas::sustainable_spending_schema(),
        ),
        ("levers", 1, horizon_app::schemas::levers_schema()),
        (
            "input-impact",
            1,
            horizon_app::schemas::input_impact_schema(),
        ),
    ] {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(format!(
            "../../docs/model/schemas/{name}.v{version}.schema.json"
        ));
        std::fs::write(
            path,
            format!("{}\n", serde_json::to_string_pretty(&schema).unwrap()),
        )
        .unwrap();
    }
}
