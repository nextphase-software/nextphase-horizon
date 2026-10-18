// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import { failures } from "./license-policy.mjs";
const report = (name, versions, license) => ({
  [license]: [{ name, versions }],
});
it("keeps build/test exceptions out of the production closure", () => {
  const input = report("axe-core", ["4.13.0", "4.14.0"], "MPL-2.0");
  expect(failures(input, false)).toEqual([]);
  expect(failures(input, true)).toEqual([
    "axe-core@4.13.0: MPL-2.0",
    "axe-core@4.14.0: MPL-2.0",
  ]);
});
it("rejects other packages, versions and licenses independently", () => {
  for (const input of [
    report("axe-core", ["4.14.1"], "MPL-2.0"),
    report("other", ["4.13.0"], "MPL-2.0"),
    report("argparse", ["3.0.3"], "Python-2.0"),
    report("@csstools/color-helpers", ["6.1.3"], "MIT-0"),
    report("@fontsource-variable/other-font", ["5.3.0"], "OFL-1.1"),
  ])
    expect(failures(input, false)).toHaveLength(1);
});
it("limits the platform exception to lightningcss 1.33.0 in tools", () => {
  for (const platform of ["darwin-arm64", "linux-x64-gnu", "win32-x64-msvc"]) {
    const input = report(`lightningcss-${platform}`, ["1.33.0"], "MPL-2.0");
    expect(failures(input, false)).toEqual([]);
    expect(failures(input, true)).toHaveLength(1);
  }
  expect(
    failures(
      report("lightningcss-linux-x64-gnu", ["1.33.1"], "MPL-2.0"),
      false,
    ),
  ).toHaveLength(1);
});
it("accepts the strict licenses and named font in both closures", () => {
  for (const production of [true, false]) {
    expect(
      failures(report("scheduler", ["0.28.0"], "MIT"), production),
    ).toEqual([]);
    expect(
      failures(
        report("@fontsource-variable/plus-jakarta-sans", ["5.3.0"], "OFL-1.1"),
        production,
      ),
    ).toEqual([]);
  }
});
