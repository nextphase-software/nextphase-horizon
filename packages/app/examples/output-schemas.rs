// SPDX-License-Identifier: AGPL-3.0-only
fn main() {
    for (name, schema) in [
        ("run-output", horizon_app::schemas::run_schema()),
        ("comparison", horizon_app::schemas::comparison_schema()),
        ("export", horizon_app::schemas::export_schema()),
    ] {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join(format!("../../docs/model/schemas/{name}.v1.schema.json"));
        std::fs::write(
            path,
            format!("{}\n", serde_json::to_string_pretty(&schema).unwrap()),
        )
        .unwrap();
    }
}
