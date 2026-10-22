// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { failures } from "./license-policy.mjs";
const list = (args = []) =>
  JSON.parse(
    execFileSync("pnpm", ["licenses", "list", "--json", ...args], {
      encoding: "utf8",
    }),
  );
// Evaluate both reports independently; dev exceptions never apply to shipped code.
const reports = [
  { label: "Shipped code", report: list(["--prod"]), production: true },
  { label: "All packages", report: list(), production: false },
];
for (const { label, report, production } of reports) {
  const rejected = failures(report, production);
  if (rejected.length) {
    console.error(
      `${label}: license policy requires maintainer escalation:\n${rejected.join("\n")}`,
    );
    process.exitCode = 1;
  } else {
    const versions = Object.values(report)
      .flat()
      .reduce((count, pkg) => count + pkg.versions.length, 0);
    console.log(
      `${label}: license policy passed (${versions} package versions).`,
    );
  }
}
