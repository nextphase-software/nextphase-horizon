// SPDX-License-Identifier: AGPL-3.0-only
export type Engine = {
  plan_from_answers: (answers: string) => string;
  run: (fixture: string) => string;
  scenario: (fixture: string, changes: string) => string;
  compare: (baseline: string, scenario: string) => string;
  export_run: (fixture: string) => string;
  import_run: (exported: string) => string;
  sustainable_spending: (fixture: string) => string;
  levers: (fixture: string) => string;
  input_impact: (fixture: string, rough: string) => string;
};
export type Operation = keyof Engine;
export type Request = {
  [K in Operation]: { id: number; op: K; args: Parameters<Engine[K]> };
}[Operation];
export type Response = { id: number; json: string };
export function dispatch(engine: Engine, request: Request): Response {
  let json: string;
  switch (request.op) {
    case "plan_from_answers":
      json = engine.plan_from_answers(...request.args);
      break;
    case "scenario":
      json = engine.scenario(...request.args);
      break;
    case "compare":
      json = engine.compare(...request.args);
      break;
    case "input_impact":
      json = engine.input_impact(...request.args);
      break;
    case "run":
      json = engine.run(...request.args);
      break;
    case "export_run":
      json = engine.export_run(...request.args);
      break;
    case "import_run":
      json = engine.import_run(...request.args);
      break;
    case "sustainable_spending":
      json = engine.sustainable_spending(...request.args);
      break;
    case "levers":
      json = engine.levers(...request.args);
      break;
  }
  return { id: request.id, json };
}
