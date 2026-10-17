// SPDX-License-Identifier: AGPL-3.0-only
fn main() {
    println!(
        "{}",
        serde_json::to_string_pretty(&horizon_app::household_schema_v2())
            .expect("schema serialization")
    );
}
