// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { compile } from "json-schema-to-typescript";
const source = new URL("../../../docs/model/schemas/", import.meta.url);
const output = new URL("../src/generated/types/", import.meta.url);
await mkdir(output, { recursive: true });
for (const file of (await readdir(source))
  .filter((name) => name.endsWith(".json"))
  .sort()) {
  const schema = JSON.parse(await readFile(new URL(file, source), "utf8"));
  const types = await compile(schema, schema.title, {
    bannerComment: "// Generated from committed JSON Schema. Do not edit.",
    additionalProperties: false,
  });
  await writeFile(new URL(file.replace(".schema.json", ".ts"), output), types);
}
