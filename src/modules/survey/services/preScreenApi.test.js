import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  normalizePreScreenStatus,
  PRESCREEN_RESPONSE_STATUSES,
  toPreScreenAnswerArray,
} from "./preScreenApi";
import { mapSurveyPrescreenResponse } from "../../public-survey/services/doSurveyApi";

describe("toPreScreenAnswerArray", () => {
  it("always returns an array", () => {
    expect(toPreScreenAnswerArray("Red")).toEqual(["Red"]);
    expect(toPreScreenAnswerArray(["Red", "Blue"])).toEqual(["Red", "Blue"]);
    expect(toPreScreenAnswerArray(["white", "red"])).toEqual(["white", "red"]);
  });

  it("does not split a single string on commas", () => {
    expect(toPreScreenAnswerArray("Red, Blue")).toEqual(["Red, Blue"]);
  });

  it("drops empty entries", () => {
    expect(toPreScreenAnswerArray(["Red", " ", ""])).toEqual(["Red"]);
    expect(toPreScreenAnswerArray(null)).toEqual([]);
  });
});

describe("normalizePreScreenStatus", () => {
  it("accepts the supported statuses", () => {
    expect(normalizePreScreenStatus("completed")).toBe(PRESCREEN_RESPONSE_STATUSES.COMPLETED);
    expect(normalizePreScreenStatus("IN_PROGRESS")).toBe(PRESCREEN_RESPONSE_STATUSES.IN_PROGRESS);
    expect(normalizePreScreenStatus("terminated")).toBe(PRESCREEN_RESPONSE_STATUSES.TERMINATED);
  });
});

describe("DoSurveyStartPage does not call end API early", () => {
  it("does not send IN_PROGRESS when pre-screen opens", () => {
    const source = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../public-survey/pages/DoSurveyStartPage.jsx"
      ),
      "utf8"
    );
    expect(source).not.toMatch(/IN_PROGRESS/);
    expect(source).not.toMatch(/pagehide/);
  });
});

describe("mapSurveyPrescreenResponse", () => {
  it("skips the questionnaire when the backend marks pre-screen completed", () => {
    const mapped = mapSurveyPrescreenResponse({
      success: true,
      required: true,
      data: {
        prescreen_status: "COMPLETED",
        questions: [{ id: 1, question_title: "Colour?", question_type: "textbox" }],
      },
    });
    expect(mapped.completed).toBe(true);
    expect(mapped.required).toBe(false);
    expect(mapped.questions).toEqual([]);
  });

  it("keeps questions when pre-screen is required and not completed", () => {
    const mapped = mapSurveyPrescreenResponse({
      success: true,
      required: true,
      data: {
        questions: [{ id: 3, question_title: "Your favourite colour?", question_type: "textbox" }],
      },
    });
    expect(mapped.completed).toBe(false);
    expect(mapped.required).toBe(true);
    expect(mapped.questions[0].id).toBe(3);
    expect(mapped.questions[0].questionTitle).toBe("Your favourite colour?");
    expect(mapped.questions[0].questionType).toBe("textbox");
  });
});
