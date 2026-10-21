// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkout, headersBytes, releaseBytes, writeStage } from "../scripts/staging.mjs";

function repository(t) {
  const repo = mkdtempSync(join(tmpdir(), "horizon-stage-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init");
  writeFileSync(join(repo, ".gitignore"), "ignored/\n");
  writeFileSync(join(repo, "source"), "synthetic source\n");
  git("add", ".");
  const commit = () => git("-c", "user.name=Synthetic Test", "-c", "user.email=test@example.invalid", "commit", "-m", "test: add synthetic source");
  commit();
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  return { repo, git, commit };
}

for (const state of ["modified", "staged", "untracked"]) {
  test(`refuses a ${state} tree before staging`, (t) => {
    const { repo, git } = repository(t);
    writeFileSync(join(repo, state === "untracked" ? "new" : "source"), "changed\n");
    if (state === "staged") git("add", ".");
    assert.throws(() => checkout(repo), /uncommitted or untracked changes/);
  });
}

test("ignored output is allowed and an ancestor of origin/main does not warn", (t) => {
  const { repo, git } = repository(t);
  mkdirSync(join(repo, "ignored"));
  writeFileSync(join(repo, "ignored/output"), "generated\n");
  const warnings = [];
  assert.equal(checkout(repo, (message) => warnings.push(message)), git("rev-parse", "HEAD"));
  assert.deepEqual(warnings, []);
});

test("a commit outside origin/main warns and continues", (t) => {
  const { repo, git, commit } = repository(t);
  writeFileSync(join(repo, "source"), "next synthetic revision\n");
  git("add", ".");
  commit();
  const warnings = [];
  const head = checkout(repo, (message) => warnings.push(message));
  assert.equal(head, git("rev-parse", "HEAD"));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], new RegExp(`Warning: commit ${head}.*origin/main.*continuing`));
});

test("an unavailable origin/main warns and continues", (t) => {
  const { repo, git } = repository(t);
  git("update-ref", "-d", "refs/remotes/origin/main");
  const warnings = [];
  assert.equal(checkout(repo, (message) => warnings.push(message)), git("rev-parse", "HEAD"));
  assert.equal(warnings.length, 1);
});

test("release.json is sorted canonical JSON with one newline and no timestamp", () => {
  assert.equal(
    releaseBytes("a".repeat(40), 'pub const MODEL_VERSION: &str = "horizon-engine-0.4.0";'),
    '{"commit":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","engine":"horizon-engine-0.4.0"}\n',
  );
});

test("_headers bytes match decision 0022 exactly", () => {
  assert.equal(headersBytes, "/*\n"
    + "  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'; frame-ancestors 'none'\n"
    + "  X-Content-Type-Options: nosniff\n"
    + "  Referrer-Policy: no-referrer\n"
    + "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n");
});

test("fresh staging contains dist plus exactly _headers and release.json, reproducibly", (t) => {
  const { repo } = repository(t);
  const dist = join(repo, "dist");
  const stage = join(repo, "stage");
  mkdirSync(join(dist, "assets"), { recursive: true });
  writeFileSync(join(dist, "index.html"), "synthetic index\n");
  writeFileSync(join(dist, "assets/engine.wasm"), Buffer.from([0, 97, 115, 109]));
  mkdirSync(stage);
  writeFileSync(join(stage, "stale"), "must disappear");
  const release = releaseBytes("b".repeat(40), 'pub const MODEL_VERSION: &str = "test-engine";');
  const snapshot = () => readdirSync(stage, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).map((entry) => {
      const path = join(entry.parentPath, entry.name);
      return [path.slice(stage.length + 1), readFileSync(path)];
    }).sort(([a], [b]) => a.localeCompare(b));
  writeStage(dist, stage, release);
  const first = snapshot();
  assert.deepEqual(first.map(([path]) => path), ["_headers", "assets/engine.wasm", "index.html", "release.json"]);
  assert.deepEqual(readFileSync(join(stage, "assets/engine.wasm")), readFileSync(join(dist, "assets/engine.wasm")));
  assert.deepEqual(readFileSync(join(stage, "index.html")), readFileSync(join(dist, "index.html")));
  assert.equal(readFileSync(join(stage, "_headers"), "utf8"), headersBytes);
  assert.equal(readFileSync(join(stage, "release.json"), "utf8"), release);
  writeStage(dist, stage, release);
  assert.deepEqual(snapshot(), first);
});
