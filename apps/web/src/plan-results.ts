// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from "react";
import { engine } from "./engine";
import type { Baseline } from "./plan-copies";
import type { Failure } from "./Answer";
export type Results = { [K in keyof Baseline]?: Baseline[K] | Failure };
export type PlanCache = Map<
  string,
  Partial<Record<keyof Baseline, Promise<string>>>
>;
export function usePlanResults(input: string, cache?: PlanCache) {
  const [results, setResults] = useState<Results>({});
  const [transport, setTransport] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const pending = cache?.get(input) ?? {};
    cache?.delete(input);
    cache?.set(input, pending);
    if (cache && cache.size > 8) cache.delete(cache.keys().next().value!);
    for (const [key, op] of [
      ["run", "run"],
      ["spending", "sustainable_spending"],
      ["levers", "levers"],
    ] as const) {
      const request = pending[key] ?? engine.call(op, input);
      pending[key] = request;
      request
        .then((json) => {
          if (active)
            setResults((previous) => ({
              ...previous,
              [key]: JSON.parse(json),
            }));
        })
        .catch((error: Error) => {
          delete pending[key];
          if (active) setTransport(error.message);
        });
    }
    return () => {
      active = false;
    };
  }, [input, cache]);
  return { results, transport };
}
