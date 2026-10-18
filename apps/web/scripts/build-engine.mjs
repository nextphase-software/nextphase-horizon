// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const root = new URL("../../../", import.meta.url);
execFileSync(
  "cargo",
  [
    "build",
    "-p",
    "horizon-wasm",
    "--target",
    "wasm32-unknown-unknown",
    "--release",
  ],
  { cwd: root, stdio: "inherit" },
);
mkdirSync(new URL("../src/generated/engine/", import.meta.url), {
  recursive: true,
});
execFileSync(
  "wasm-bindgen",
  [
    new URL("target/wasm32-unknown-unknown/release/horizon_wasm.wasm", root)
      .pathname,
    "--target",
    "web",
    "--out-dir",
    "src/generated/engine",
  ],
  { stdio: "inherit" },
);
