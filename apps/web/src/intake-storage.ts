// SPDX-License-Identifier: AGPL-3.0-only
import type { AnswersV2 } from "./generated/types/answers.v2";
import type { Style, Place } from "./intake-fields";
export const intakeKey = "horizon.intake.v1";
export const savedNotice =
  "Your answers are saved on this device only. They are never sent anywhere.";
export const unavailableNotice =
  "Your answers can't be kept on this device, so they will be gone when you close this page.";
export const corruptNotice =
  "We couldn't read the answers saved on this device, so we've started again.";
export type SavedIntake = {
  format: "horizon-saved-intake";
  version: 1;
  answers: AnswersV2;
  style: Style;
  place: Place;
};
export function saveIntake(value: SavedIntake): boolean {
  try {
    localStorage.setItem(intakeKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function forgetIntake(): boolean {
  try {
    localStorage.removeItem(intakeKey);
    return true;
  } catch {
    return false;
  }
}
export async function loadIntake(
  validate: (json: string) => Promise<string>,
): Promise<{
  saved: SavedIntake | null;
  unavailable?: boolean;
  corrupt?: boolean;
}> {
  let text: string | null;
  try {
    text = localStorage.getItem(intakeKey);
  } catch {
    return { saved: null, unavailable: true };
  }
  if (text === null) return { saved: null };
  let value: SavedIntake;
  try {
    value = JSON.parse(text);
    if (
      !value ||
      Object.keys(value).sort().join(",") !==
        "answers,format,place,style,version" ||
      value.format !== "horizon-saved-intake" ||
      value.version !== 1 ||
      !["one_question", "conversation", "guided_page"].includes(value.style) ||
      typeof value.place !== "string" ||
      !/^(?:[1-9]|1[0-5]|review|results)$/.test(value.place) ||
      value.answers?.format !== "horizon-answers" ||
      value.answers?.version !== 2
    )
      throw new Error("Invalid saved intake");
  } catch {
    forgetIntake();
    return { saved: null, corrupt: true };
  }
  // Transport failures preserve the saved item; only a malformed document deletes it.
  const result = JSON.parse(await validate(JSON.stringify(value.answers)));
  if (result.code === "MALFORMED_INPUT") {
    forgetIntake();
    return { saved: null, corrupt: true };
  }
  return { saved: value };
}
