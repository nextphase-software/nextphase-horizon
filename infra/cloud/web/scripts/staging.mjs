// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const tooling = fileURLToPath(new URL("../", import.meta.url));
export const root = fileURLToPath(new URL("../../../../", import.meta.url));
export const staging = join(tooling, "staging");
export const headers = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};
export const headersBytes = `/*\n${Object.entries(headers).map(([name, value]) => `  ${name}: ${value}\n`).join("")}`;

export function checkout(repo, warn = console.warn) {
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  if (git("status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none")) {
    throw new Error("Refusing to stage: working tree has uncommitted or untracked changes outside ignored paths.");
  }
  const commit = git("rev-parse", "HEAD");
  const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", commit, "origin/main"], { cwd: repo, encoding: "utf8" });
  if (ancestor.error) throw ancestor.error;
  if (ancestor.status !== 0) {
    warn(`Warning: commit ${commit} is not a known ancestor of origin/main (which may be unavailable); continuing.`);
  }
  return commit;
}

export function releaseBytes(commit, projection) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Expected a full 40-character commit.");
  const engine = projection.match(/pub const MODEL_VERSION: &str = "([^"]+)";/)?.[1];
  if (!engine) throw new Error("MODEL_VERSION is missing from packages/engine/src/projection.rs.");
  return `${JSON.stringify({ commit, engine })}\n`;
}

export function writeStage(dist, destination, release) {
  rmSync(destination, { recursive: true, force: true });
  // Only paths and bytes are release inputs; no source metadata is copied.
  const copy = (source, target) => {
    mkdirSync(target, { recursive: true });
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      const from = join(source, entry.name);
      const to = join(target, entry.name);
      if (entry.isDirectory()) copy(from, to);
      else writeFileSync(to, readFileSync(from));
    }
  };
  copy(dist, destination);
  writeFileSync(join(destination, "_headers"), headersBytes);
  writeFileSync(join(destination, "release.json"), release);
}

export function run(command, args, cwd = tooling) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

export function stage() {
  const commit = checkout(root);
  const app = join(root, "apps/web");
  run("node", ["--version"]);
  run("cargo", ["build", "-p", "horizon-wasm", "--target", "wasm32-unknown-unknown", "--release"], root);
  run("pnpm", ["install", "--frozen-lockfile"], app);
  for (const command of ["build:engine", "build"]) {
    run("node", ["--version"]);
    run("pnpm", ["run", command], app);
  }
  if (checkout(root, () => {}) !== commit) throw new Error("Checkout changed while building.");
  const release = releaseBytes(commit, readFileSync(join(root, "packages/engine/src/projection.rs"), "utf8"));
  writeStage(join(app, "dist"), staging, release);
  console.log(`Staged commit ${commit}.`);
  return commit;
}
