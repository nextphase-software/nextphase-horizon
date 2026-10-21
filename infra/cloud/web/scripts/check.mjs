// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync, readdirSync } from "node:fs";
import { get } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { headers, run, stage, staging, tooling } from "./staging.mjs";

// Use node:http: fetch supplies its own Sec-Fetch-Mode, hiding SPA navigation.
function request(port, path, navigation = false) {
  return new Promise((resolve, reject) => {
    const req = get({
      hostname: "127.0.0.1", port, path,
      headers: navigation ? { "Sec-Fetch-Mode": "navigate" } : {},
    }, (response) => {
      const chunks = [];
      response.on("data", (bytes) => chunks.push(bytes));
      response.on("error", reject);
      response.on("end", () => resolve({
        status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks),
      }));
    });
    req.setTimeout(2000, () => req.destroy(new Error(`Request timed out: ${path}`)));
    req.on("error", reject);
  });
}

const commit = stage();
process.env.WRANGLER_SEND_METRICS = "false";
run("corepack", ["pnpm", "exec", "wrangler", "deploy", "--dry-run", "--config", "wrangler.jsonc"]);
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
const child = spawn("corepack", [
  "pnpm", "exec", "wrangler", "dev", "--config", "wrangler.jsonc",
  "--local", "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0",
], {
  cwd: tooling, stdio: ["ignore", "inherit", "inherit"],
  detached: process.platform !== "win32",
  env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
let stopped = false;
const exited = once(child, "exit").then(() => { stopped = true; });
try {
  const deadline = Date.now() + 30000;
  while (true) {
    if (stopped) throw new Error("Local Wrangler server exited before checks.");
    try {
      await request(port, "/");
      break;
    } catch (error) {
      if (Date.now() >= deadline) throw new Error("Local Wrangler server did not become ready.", { cause: error });
      await delay(100);
    }
  }
  const assets = readdirSync(staging, { recursive: true });
  const wasm = assets.find((path) => path.endsWith(".wasm"));
  const font = assets.find((path) => path.endsWith(".woff2"));
  assert.ok(wasm, "Staged engine module is present");
  assert.ok(font, "Staged font is present");
  const index = readFileSync(join(staging, "index.html"));
  for (const path of ["/", "/release.json", `/${wasm}`, `/${font}`, "/__horizon_unknown_page__"]) {
    const navigation = path === "/__horizon_unknown_page__";
    const response = await request(port, path, navigation);
    assert.equal(response.status, 200, `${path}: HTTP 200`);
    for (const [name, value] of Object.entries(headers)) {
      assert.equal(response.headers[name.toLowerCase()], value, `${path}: ${name}`);
    }
    if (navigation || path === "/") assert.deepEqual(response.body, index, `${path}: index.html bytes`);
    if (path === "/release.json") {
      assert.equal(JSON.parse(response.body).commit, commit);
      assert.deepEqual(response.body, readFileSync(join(staging, "release.json")));
    }
    if (path === `/${wasm}`) assert.equal(response.headers["content-type"], "application/wasm");
    console.log(`PASS ${path}: 200, all four exact headers${navigation ? ", index.html fallback" : ""}`);
  }
  console.log(`Local checks passed (5 responses); release commit ${commit}.`);
} finally {
  // Stop pnpm, Wrangler and the simulator together, including on assertion failure.
  const stop = (signal) => {
    if (!child.pid) return;
    try {
      if (process.platform === "win32") child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  };
  stop("SIGTERM");
  const timeout = setTimeout(() => stop("SIGKILL"), 5000);
  try { await exited; } finally { clearTimeout(timeout); }
}
