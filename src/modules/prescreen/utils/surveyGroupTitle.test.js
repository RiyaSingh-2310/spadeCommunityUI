import { describe, expect, it } from "vitest";
import {
  isSurveyGroupTitleDuplicateError,
  normalizeSurveyGroupTitle,
  SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE,
} from "./surveyGroupTitle";

describe("survey group title uniqueness", () => {
  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeSurveyGroupTitle("  Security Survey  ")).toBe("security survey");
    expect(normalizeSurveyGroupTitle("SECURITY SURVEY")).toBe("security survey");
    expect(normalizeSurveyGroupTitle("security   survey")).toBe("security survey");
  });

  it("treats case-only differences as the same title", () => {
    expect(normalizeSurveyGroupTitle("Security Survey")).toBe(
      normalizeSurveyGroupTitle("security survey")
    );
  });

  it("detects API duplicate messages", () => {
    expect(
      isSurveyGroupTitleDuplicateError({ message: "Survey title already exists" })
    ).toBe(true);
    expect(isSurveyGroupTitleDuplicateError({ message: "Required field" })).toBe(false);
  });

  it("keeps the user-facing duplicate copy", () => {
    expect(SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE).toContain("already exists");
    expect(SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE).toContain("unique survey title");
  });
});
