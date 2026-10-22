// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { failures } from "./license-policy.mjs";
const report = JSON.parse(execFileSync("pnpm", ["licenses", "list", "--json"], { encoding: "utf8" }));
const rejected = failures(report);
if (rejected.length) {
  console.error(`Deploy tooling license policy failed:\n${rejected.join("\n")}`);
  process.exitCode = 1;
} else {
  const count = Object.values(report).flat().reduce((sum, pkg) => sum + pkg.versions.length, 0);
  console.log(`Deploy tooling license policy passed (${count} package versions).`);
}
