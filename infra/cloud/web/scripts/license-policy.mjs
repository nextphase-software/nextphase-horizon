// SPDX-License-Identifier: AGPL-3.0-only
import { failures as appFailures } from "../../../../apps/web/scripts/license-policy.mjs";

export function failures(report) {
  const rejected = [];
  for (const [license, packages] of Object.entries(report)) {
    for (const pkg of packages) {
      for (const version of pkg.versions) {
        const platform = /^@img\/sharp-libvips-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.name)
          && version === "1.3.3" && license === "LGPL-3.0-or-later";
        const highlight = pkg.name === "@speed-highlight/core" && version === "1.2.24" && license === "CC0-1.0";
        // A dual license composed solely of strict allowed licenses is allowed.
        const dual = ["MIT OR Apache-2.0", "(MIT OR Apache-2.0)"].includes(license);
        if (!platform && !highlight && !dual) {
          rejected.push(...appFailures({ [license]: [{ name: pkg.name, versions: [version] }] }, false));
        }
      }
    }
  }
  return rejected.sort();
}
