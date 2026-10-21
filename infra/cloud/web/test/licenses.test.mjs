// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { test } from "node:test";
import { failures } from "../scripts/license-policy.mjs";
import { failures as appFailures } from "../../../../apps/web/scripts/license-policy.mjs";

const report = (name, version, license) => ({ [license]: [{ name, versions: [version] }] });
test("reuses the app full-closure policy and allows strict dual licenses", () => {
  for (const input of [
    report("example", "1.0.0", "MIT"),
    report("wrangler", "4.148.0", "(MIT OR Apache-2.0)"),
    report("axe-core", "4.13.0", "MPL-2.0"),
    report("lightningcss-linux-x64-gnu", "1.33.0", "MPL-2.0"),
    report("@fontsource-variable/plus-jakarta-sans", "5.3.0", "OFL-1.1"),
  ]) assert.deepEqual(failures(input), []);
});

test("allows only the exact two deploy-tool exceptions, leaving app policy unchanged", () => {
  for (const input of [
    report("@img/sharp-libvips-linux-x64", "1.3.3", "LGPL-3.0-or-later"),
    report("@img/sharp-libvips-darwin-arm64", "1.3.3", "LGPL-3.0-or-later"),
    report("@speed-highlight/core", "1.2.24", "CC0-1.0"),
  ]) {
    assert.deepEqual(failures(input), []);
    assert.equal(appFailures(input, false).length, 1);
  }
});

test("rejects planted unlisted licenses and exception mismatches with name, version and license", () => {
  for (const [name, version, license] of [
    ["planted", "1.0.0", "UNLISTED"],
    ["@img/sharp-libvips-linux-x64", "1.3.4", "LGPL-3.0-or-later"],
    ["@img/sharp-linux-x64", "1.3.3", "LGPL-3.0-or-later"],
    ["@img/sharp-libvips-linux-x64", "1.3.3", "LGPL-2.1-only"],
    ["@speed-highlight/core", "1.2.25", "CC0-1.0"],
    ["other", "1.2.24", "CC0-1.0"],
    ["@speed-highlight/core", "1.2.24", "MPL-2.0"],
    ["axe-core", "4.13.1", "MPL-2.0"],
  ]) assert.deepEqual(failures(report(name, version, license)), [`${name}@${version}: ${license}`]);
});
