// SPDX-License-Identifier: AGPL-3.0-only
import { EngineClient } from "./client";
export const engine = new EngineClient(
  new Worker(new URL("./engine.worker.ts", import.meta.url), {
    type: "module",
  }),
);
