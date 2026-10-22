// SPDX-License-Identifier: AGPL-3.0-only
import { spawn } from "node:child_process";
import { stage, tooling } from "./staging.mjs";

const commit = stage();
const child = spawn("pnpm", ["exec", "wrangler", "deploy", "--config", "wrangler.jsonc"], {
  cwd: tooling,
  stdio: ["inherit", "pipe", "inherit"],
});
let output = "";
child.stdout.on("data", (bytes) => {
  output += bytes;
  process.stdout.write(bytes);
});
child.on("error", (error) => { throw error; });
child.on("exit", (code) => {
  if (code !== 0) {
    process.exitCode = code || 1;
    return;
  }
  const fallback = output.match(/https:\/\/horizon\.[a-z0-9-]+\.workers\.dev\b/)?.[0];
  if (!fallback) throw new Error("Deploy succeeded but Wrangler did not report the workers.dev address.");
  console.log(`Deployed commit ${commit}\nhttps://horizon.nextphase.software\n${fallback}`);
});
