// SPDX-License-Identifier: AGPL-3.0-only
// Watch static output: Vite's development HMR injects inline styles/scripts,
// which the page's unchanged CSP forbids. Reload the page after a rebuild.
import { execFileSync } from "node:child_process";
import { build, preview } from "vite";
for (const script of ["build-engine.mjs", "types.mjs"]) {
  execFileSync(process.execPath, [new URL(script, import.meta.url).pathname], {
    stdio: "inherit",
  });
}
const watcher = await build({ build: { watch: {} } });
let server;
watcher.on("event", async (event) => {
  if (event.code === "END" && !server) {
    server = await preview({
      preview: { host: "127.0.0.1", port: 5173, strictPort: true },
    });
    server.printUrls();
  }
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await watcher.close();
    server?.httpServer.close();
    process.exit(0);
  });
}
