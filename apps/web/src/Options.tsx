// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from "react";
import type { Options as OptionsData } from "./plan-options";
import { sameChange, type CopyChange, type PlanCopy } from "./plan-copies";

export function focusOptions() {
  const heading = document.getElementById("plan-options-heading");
  if (!heading) return;
  heading.focus({ preventScroll: true });
  const strip = document
    .querySelector(".headline-strip")
    ?.getBoundingClientRect();
  window.scrollBy({
    top: heading.getBoundingClientRect().top - (strip?.bottom ?? 0) - 24,
    behavior: "instant",
  });
}
export function Options({
  options,
  copies = [],
  tryOption,
  openCopy,
  overview = false,
  seeAll,
  printed = false,
  focus = false,
}: {
  options: OptionsData;
  copies?: PlanCopy[];
  tryOption?: (change: CopyChange) => void;
  openCopy?: (id: string) => void;
  overview?: boolean;
  seeAll?: () => void;
  printed?: boolean;
  focus?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(focusOptions, 0);
    return () => window.clearTimeout(timer);
  }, [focus]);
  return (
    <section
      className={printed ? "options-summary" : "card plan-options"}
      aria-labelledby={printed ? undefined : "plan-options-heading"}
    >
      <h2
        ref={heading}
        id={printed ? undefined : "plan-options-heading"}
        tabIndex={printed ? undefined : -1}
      >
        {options.heading}
      </h2>
      {!overview && <p className="help options-intro">{options.intro}</p>}
      {options.none ? (
        <p className="follow-on options-none">{options.none}</p>
      ) : (
        <ol className="options-list">
          {(overview ? options.items.slice(0, 2) : options.items).map(
            (item) => {
              const existing =
                item.try &&
                copies.find((copy) => sameChange(copy.lever, item.try!));
              const label = existing ? "Open the copy" : "Try this";
              return (
                <li key={item.title}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.mark && (
                        <>
                          <span
                            aria-hidden="true"
                            className={
                              item.mark === "✓"
                                ? "option-supported"
                                : "option-partial"
                            }
                          >
                            {item.mark}
                          </span>{" "}
                        </>
                      )}
                      {item.effect}
                    </p>
                  </div>
                  {!printed && item.try && (
                    <button
                      aria-label={`${label}: ${item.title}`}
                      onClick={() =>
                        existing
                          ? openCopy?.(existing.lever.id)
                          : tryOption?.(item.try!)
                      }
                    >
                      {label}
                    </button>
                  )}
                </li>
              );
            },
          )}
        </ol>
      )}
      {overview ? (
        <p className="help">
          They are options to explore, not advice.{" "}
          <button className="link-button" onClick={seeAll}>
            See all options
          </button>
        </p>
      ) : (
        <div className="options-returns">
          <h3>{options.returns_heading}</h3>
          <ul>
            {options.returns.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
