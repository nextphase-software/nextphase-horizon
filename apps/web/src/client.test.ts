// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from "vitest";
import { EngineClient } from "./client";
import type { Request, Response } from "./protocol";
class StubWorker {
  requests: Request[] = [];
  onmessage: ((event: { data: Response }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage(request: Request) {
    this.requests.push(request);
  }
}
it("correlates out-of-order worker replies without changing JSON", async () => {
  const worker = new StubWorker();
  const client = new EngineClient(worker as unknown as Worker);
  const a = client.call("run", "a");
  const b = client.call("compare", "a", "b");
  expect(worker.requests).toEqual([
    { id: 1, op: "run", args: ["a"] },
    { id: 2, op: "compare", args: ["a", "b"] },
  ]);
  worker.onmessage!({ data: { id: 2, json: '{"status":"partial"}' } });
  worker.onmessage!({ data: { id: 1, json: '{"status":"complete"}' } });
  expect(await a).toBe('{"status":"complete"}');
  expect(await b).toBe('{"status":"partial"}');
});
it("rejects pending and future calls when the worker fails", async () => {
  const worker = new StubWorker();
  const client = new EngineClient(worker as unknown as Worker);
  const pending = expect(client.call("run", "{}")).rejects.toThrow(
    "could not load",
  );
  worker.onerror!();
  await pending;
  await expect(client.call("run", "{}")).rejects.toThrow("could not load");
});
