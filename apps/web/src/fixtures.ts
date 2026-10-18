// SPDX-License-Identifier: AGPL-3.0-only
import working from "../../../packages/app/fixtures/answers-working-61.json?raw";
import retired from "../../../packages/app/fixtures/synthetic-retired.json?raw";
import drawdown from "../../../packages/app/fixtures/A-drawdown.json?raw";
import underfunded from "../../../packages/app/fixtures/answers-underfunded.json?raw";
import couple from "../../../packages/app/fixtures/two-person.json?raw";
export const samples = [
  {
    name: "answers-working-61",
    label: "Single, 61, still working, plans to retire at 66",
    json: working,
  },
  { name: "synthetic-retired", label: "Single, 70, retired", json: retired },
  {
    name: "A-drawdown",
    label: "Single, 73, retired, small savings",
    json: drawdown,
  },
  {
    name: "answers-underfunded",
    label: "Single, 61, spending more than income",
    json: underfunded,
  },
  { name: "two-person", label: "Couple", json: couple },
];
