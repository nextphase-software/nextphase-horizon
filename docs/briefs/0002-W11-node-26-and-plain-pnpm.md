BRIEF VERSION: 0002-W11 v1 (2026-10-22)

# 0002-W11 — Node.js 26 and plain pnpm

## Outcome

Every Node.js command in the repository runs on Node.js **26.11.1** and calls pnpm **12.9.1** directly as `pnpm`, not through corepack, which Node.js 25 and later no longer include (decision 0011, amendment of 2026-10-22). The application, the engine, the lockfiles and every test result stay the same.

## Deliverables

1. **Node.js pin:** `engines.node` becomes `"26.11.1"` in `apps/web/package.json` and `infra/cloud/web/package.json`. `packageManager` stays `"pnpm@12.9.1"` in both. Both lockfiles stay byte-identical.
2. **Commands that start pnpm** call `pnpm` instead of `corepack pnpm`, with the same arguments:
   - `apps/web/playwright.config.ts` (`webServer.command`; keep Prettier's formatting);
   - `apps/web/scripts/licenses.mjs`;
   - `infra/cloud/web/scripts/staging.mjs`, `check.mjs` (both the dry-run and the `wrangler dev` spawn), `deploy.mjs` and `licenses.mjs`.

   No other code changes.
3. **`AGENTS.md` and `README.md`,** in the same words in both:
   - **Setup:**
     - "Install Node.js 26.11.1" with `nvm install 26.11.1`, the `export PATH="$HOME/.nvm/versions/node/v26.11.1/bin:$PATH"` line and "Expected versions are `v26.11.1` and `wasm-bindgen-test-runner 0.2.129`".
     - A new step installs pnpm 12.9.1 for that Node.js: `npm install -g pnpm@12.9.1`, or pnpm's installer `curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=12.9.1 sh -` (https://pnpm.io/installation, retrieved 2026-10-22).
     - One sentence explains that pnpm runs the version in `packageManager` when another is invoked (`pmOnFail`, default `download`; https://pnpm.io/settings/cli, retrieved 2026-10-22).
   - **Web shell validation:**
     - "Use Node.js 26.11.1 and pnpm 12.9.1"; the corepack sentences go.
     - The command list drops `corepack --version`; every `corepack pnpm …` becomes `pnpm …`.
     - "Expected versions: Node v26.11.1, pnpm 12.9.1".
     - The "Engine-only briefs" and "Screen-only briefs" paragraphs and the local-use paragraph name the `pnpm …` commands.
   - **Deploy tooling — 0002-W8:** "(Node.js 26.11.1, pnpm 12.9.1)" and `pnpm …` commands.
   - The heading names (`Web shell validation — 0002-W1 v2`, `Deploy tooling — 0002-W8`) stay.
4. **Documentation:**
   - `infra/cloud/web/README.md`: Node.js 26.11.1 and `pnpm …` commands, including `pnpm exec wrangler login` and `pnpm run deploy`.
   - `docs/architecture/web-shell.md`: the hosting section's toolchain line and its `pnpm …` commands.
   - `docs/model/dependencies.md`:
     - a new "Toolchain — 0002-W11" entry: Node.js 26.11.1 (MIT, with bundled-component notices) and pnpm 12.9.1 (MIT), run directly; corepack leaves the toolchain;
     - the earlier entries stay as the record of their milestones.
   - `docs/model/answers.md` (three mentions) and `docs/model/scenario-diff-and-export.md` (one mention): the WebAssembly runner's Node.js becomes 26.11.1.
   - Briefs already merged are records and do not change.
5. **Decision records:**
   - the 2026-10-22 amendment appended to `docs/decisions/0011-web-shell-stack.md`;
   - the one-line note in `docs/decisions/0010-comparison-export-and-command-line-conventions.md`;
   - both committed with this brief (G2), not by the implementer.

## Done when

1. Both `engines.node` values are `26.11.1`. `packageManager` is unchanged, and both lockfiles are byte-identical to `main`.
2. `git grep -n corepack` returns only merged briefs, decision records and dependency-history entries; no code, configuration, `AGENTS.md`, `README.md` or current-instruction text.
3. `git grep -nE "24\.22\.0|v24\.22"` outside merged briefs, decision records and dependency-history entries returns nothing.
4. The full validation below passes on Node.js 26.11.1, and every recorded `node --version` prints `v26.11.1`.
5. The deploy tooling `check` passes twice, with byte-identical staging folders.
6. The diff touches only the files named in deliverables 1–4.

## Read first

- `AGENTS.md`, `README.md`, `docs/architecture/web-shell.md`, `docs/model/dependencies.md`.
- Decision records `0011-*` (item 3, item 12 and the 2026-10-22 amendment) and `0010-*` (WebAssembly runner).
- pnpm documentation, retrieved 2026-10-22: https://pnpm.io/installation, https://pnpm.io/settings/cli (`pmOnFail`), https://pnpm.io/package_json (`packageManager`).
- Node.js release schedule, retrieved 2026-10-22: https://github.com/nodejs/Release/blob/main/schedule.json and https://nodejs.org/dist/index.json.

## Guardrails

- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** change application behaviour, test assertions or dependency versions. If a check passes on Node.js 24.22.0 but fails on 26.11.1, stop and report it.

## Validation

This brief changes files under `infra/` and the Node.js that runs the WebAssembly parity tests, so the "Screen-only briefs" exclusion does not apply. Run the full sequence in `AGENTS.md` as amended by this brief, on Node.js 26.11.1 with pnpm 12.9.1:
- the cumulative Rust sequence with its CLI expansions and both WebAssembly commands (record `node --version` before each);
- the web shell sequence, including `pnpm exec playwright install chromium webkit` and `pnpm run e2e` in all 8 projects;
- the deploy tooling sequence, with `check` run twice and the staging folders compared byte for byte.

Then record `git grep -n corepack` and the `24.22` grep of Done when 2–3, and `git diff --stat main..HEAD`. Record each command with its exit status and counts.

## Exclusions

- **Moving to the first Node.js 26 long-term-support release** (28 October 2026 or later): a later toolchain brief, once that release is 14 days old.
- **The macOS-only Chromium step in `e2e/plan-layout.spec.ts`** (a closed native `<select>` ignores Home and End): it fails the same way on Node.js 24.22.0, and Linux Chromium passes. It is outside this brief.
- **Briefs already merged:** they keep their recorded versions.

## Implementation record

Appended by the implementer before handoff: branch, the source/test revision the validation ran against, each validation command with its exit status and counts, tool versions, new dependencies (none expected), and every exclusion with its reason. The record is committed after that revision and does not name its own commit; the final branch tip is reported in the handoff message.
