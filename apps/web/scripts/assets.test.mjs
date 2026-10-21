// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { expect, it } from "vitest";
import { build } from "vite";

it("builds CSS without data URLs and emits every referenced font under assets", async () => {
  const result = await build({ build: { write: false }, logLevel: "silent" });
  const bundles = Array.isArray(result) ? result : [result];
  const output = bundles.flatMap((bundle) => bundle.output);
  const css = output.filter((asset) => asset.fileName.endsWith(".css"));
  expect(css.length).toBeGreaterThan(0);
  const fonts = [];
  for (const asset of css) {
    const source = String(asset.source);
    expect(source).not.toMatch(/data:/i);
    for (const match of source.matchAll(
      /url\(["']?([^\s)"']+\.woff2?)["']?\)/g,
    )) {
      expect(match[1]).toMatch(/^\/assets\//);
      expect(output.some((file) => `/${file.fileName}` === match[1])).toBe(
        true,
      );
      fonts.push(match[1]);
    }
  }
  expect(fonts.length).toBeGreaterThan(0);
}, 30_000);
