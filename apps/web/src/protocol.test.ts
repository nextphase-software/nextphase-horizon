// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from "vitest";
import { dispatch, type Engine, type Request } from "./protocol";
it("dispatches every operation unchanged and preserves IDs and canonical bytes", () => {
  const json = '{"code":"EXAMPLE","message":"Example","status":"invalid"}';
  const stub = () => vi.fn(() => json);
  const engine: Engine = {
    plan_from_answers: stub(),
    run: stub(),
    scenario: stub(),
    compare: stub(),
    export_run: stub(),
    import_run: stub(),
    sustainable_spending: stub(),
    levers: stub(),
    input_impact: stub(),
  };
  const requests: Request[] = [
    { id: 9, op: "plan_from_answers", args: ["answers"] },
    { id: 1, op: "run", args: ["fixture"] },
    { id: 2, op: "scenario", args: ["fixture", "changes"] },
    { id: 3, op: "compare", args: ["baseline", "scenario"] },
    { id: 4, op: "export_run", args: ["fixture"] },
    { id: 5, op: "import_run", args: ["export"] },
    { id: 6, op: "sustainable_spending", args: ["fixture"] },
    { id: 7, op: "levers", args: ["fixture"] },
    { id: 8, op: "input_impact", args: ["fixture", "rough"] },
  ];
  for (const request of requests) {
    expect(dispatch(engine, request)).toEqual({ id: request.id, json });
    expect(engine[request.op]).toHaveBeenCalledWith(...request.args);
  }
});
