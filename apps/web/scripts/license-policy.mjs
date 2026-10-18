// SPDX-License-Identifier: AGPL-3.0-only
// Exact build/test exceptions from 0002-W1 v2 and decision 0011's amendment.
const strict = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Zlib",
  "Unicode-3.0",
  "0BSD",
]);
const exceptions = new Map([
  ["@axe-core/playwright@4.13.0", "MPL-2.0"],
  ["axe-core@4.13.0", "MPL-2.0"],
  ["axe-core@4.14.0", "MPL-2.0"],
  ["lightningcss@1.33.0", "MPL-2.0"],
  ["@csstools/color-helpers@6.1.2", "MIT-0"],
  ["@csstools/css-syntax-patches-for-csstree@1.1.15", "MIT-0"],
  ["language-subtag-registry@0.3.23", "CC0-1.0"],
  ["mdn-data@2.27.1", "CC0-1.0"],
  ["caniuse-lite@1.0.30001816", "CC-BY-4.0"],
  ["lru-cache@11.5.3", "BlueOak-1.0.0"],
  ["minimatch@10.2.6", "BlueOak-1.0.0"],
  ["argparse@2.0.1", "Python-2.0"],
  ["argparse@3.0.3", "PSF-2.0"],
]);
export function failures(report, production) {
  const rejected = [];
  for (const [license, packages] of Object.entries(report)) {
    for (const pkg of packages) {
      for (const version of pkg.versions) {
        const font =
          license === "OFL-1.1" &&
          pkg.name === "@fontsource-variable/plus-jakarta-sans";
        const exact = exceptions.get(`${pkg.name}@${version}`) === license;
        const platform =
          license === "MPL-2.0" &&
          version === "1.33.0" &&
          /^lightningcss-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.name);
        if (
          !strict.has(license) &&
          !font &&
          (production || !(exact || platform))
        ) {
          rejected.push(`${pkg.name}@${version}: ${license}`);
        }
      }
    }
  }
  return rejected.sort();
}
