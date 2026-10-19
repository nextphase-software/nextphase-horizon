// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import type { Lever } from "./generated/types/levers.v1";
import type { Baseline, PlanCopy } from "./plan-copies";
import { leverLabel } from "./plan-display";

export function CopyPanel({
  baseline,
  copies,
  make,
  cancel,
}: {
  baseline: Baseline;
  copies: PlanCopy[];
  make: (lever: Lever) => void;
  cancel: () => void;
}) {
  const available = baseline.levers.levers.filter(
    (lever) => !copies.some((copy) => copy.lever.id === lever.id),
  );
  const [selected, setSelected] = useState(available[0]?.id);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  return (
    <section className="card copy-panel" aria-labelledby="copy-panel-title">
      <h2 id="copy-panel-title">Try one change in a copy</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const lever = available.find((lever) => lever.id === selected);
          if (lever) make(lever);
        }}
      >
        <fieldset className="choices">
          <legend className="sr-only">Choose one change</legend>
          {baseline.levers.levers.map((lever) => {
            const exists = copies.some((copy) => copy.lever.id === lever.id);
            return (
              <label className="choice" key={lever.id}>
                <input
                  ref={lever.id === available[0]?.id ? first : undefined}
                  type="radio"
                  name="copy-lever"
                  checked={selected === lever.id}
                  disabled={exists}
                  onChange={() => setSelected(lever.id)}
                />
                <span>
                  {leverLabel(lever, baseline.run)}
                  {exists ? " (already a copy)" : ""}
                </span>
              </label>
            );
          })}
        </fieldset>
        <p>Your plan stays as it is.</p>
        <div className="actions">
          <button
            className="primary"
            disabled={!available.length}
            type="submit"
          >
            Make the copy
          </button>
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
