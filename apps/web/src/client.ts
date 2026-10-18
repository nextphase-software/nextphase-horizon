// SPDX-License-Identifier: AGPL-3.0-only
import type { Engine, Operation, Request, Response } from "./protocol";
export class EngineClient {
  private sequence = 0;
  private pending = new Map<
    number,
    { resolve: (json: string) => void; reject: (error: Error) => void }
  >();
  private failure: Error | null = null;
  constructor(private worker: Worker) {
    worker.onmessage = ({ data }: MessageEvent<Response>) => {
      this.pending.get(data.id)?.resolve(data.json);
      this.pending.delete(data.id);
    };
    worker.onerror = () => {
      this.failure = new Error(
        "The calculation engine could not load. Reload the page to try again.",
      );
      for (const call of this.pending.values()) call.reject(this.failure);
      this.pending.clear();
    };
  }
  call<K extends Operation>(
    op: K,
    ...args: Parameters<Engine[K]>
  ): Promise<string> {
    if (this.failure) return Promise.reject(this.failure);
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, op, args } as Request);
    });
  }
}
