// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, expect, it, vi } from "vitest";
import { buildAnswers, newFields } from "./intake-fields";
import {
  saveIntake,
  loadIntake,
  forgetIntake,
  intakeKey,
  type SavedIntake,
} from "./intake-storage";
const saved = (): SavedIntake => ({
  format: "horizon-saved-intake",
  version: 1,
  answers: buildAnswers(newFields("2026-01-01")),
  style: "one_question",
  place: "1",
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it("writes exactly one envelope and validates the stored document through the engine", async () => {
  const value = saved();
  expect(saveIntake(value)).toBe(true);
  expect(Object.keys(localStorage)).toEqual([intakeKey]);
  const engine = vi.fn(async () => '{"status":"incomplete","code":null}');
  expect(await loadIntake(engine)).toEqual({ saved: value });
  expect(engine).toHaveBeenCalledWith(JSON.stringify(value.answers));
  expect(forgetIntake()).toBe(true);
  expect(localStorage.length).toBe(0);
});
it.each([
  "not JSON",
  JSON.stringify({ ...saved(), version: 2 }),
  JSON.stringify({ ...saved(), extra: true }),
  JSON.stringify({ ...saved(), place: "0" }),
  JSON.stringify({ ...saved(), place: "16" }),
  JSON.stringify({ ...saved(), style: "unknown" }),
  JSON.stringify({ ...saved(), answers: { ...saved().answers, version: 1 } }),
])("deletes an invalid envelope: %s", async (text) => {
  localStorage.setItem(intakeKey, text);
  const validate = vi.fn();
  expect(await loadIntake(validate)).toEqual({ saved: null, corrupt: true });
  expect(localStorage.length).toBe(0);
  expect(validate).not.toHaveBeenCalled();
});
it("deletes structurally malformed answers and preserves meaningful invalid/unsupported documents", async () => {
  for (const code of [
    "MALFORMED_INPUT",
    "ANSWERS_AGE_RANGE",
    "ANSWERS_ONE_PERSON_ONLY",
  ]) {
    saveIntake(saved());
    const result = await loadIntake(async () =>
      JSON.stringify({
        status: code === "ANSWERS_ONE_PERSON_ONLY" ? "unsupported" : "invalid",
        code,
      }),
    );
    expect(result.corrupt ?? false).toBe(code === "MALFORMED_INPUT");
    expect(localStorage.length).toBe(code === "MALFORMED_INPUT" ? 0 : 1);
  }
});
it("works in memory when storage is unavailable and retains saved answers on transport failure", async () => {
  const value = saved();
  saveIntake(value);
  await expect(
    loadIntake(async () => {
      throw new Error("Worker unavailable");
    }),
  ).rejects.toThrow("Worker unavailable");
  expect(localStorage.getItem(intakeKey)).toBe(JSON.stringify(value));
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  expect(await loadIntake(vi.fn())).toEqual({ saved: null, unavailable: true });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Full");
  });
  expect(saveIntake(value)).toBe(false);
});
