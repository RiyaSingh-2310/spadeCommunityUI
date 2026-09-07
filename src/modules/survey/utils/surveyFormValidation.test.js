import { describe, expect, it } from "vitest";
import {
  isSameProjectName,
  normalizeProjectNameForUniqueness,
  PROJECT_NAME_DUPLICATE_MESSAGE,
} from "./surveyFormValidation";

describe("project name uniqueness", () => {
  it("treats casing and surrounding whitespace as the same name", () => {
    expect(normalizeProjectNameForUniqueness("  Test Project  ")).toBe("test project");
    expect(isSameProjectName("Test Project", "test project")).toBe(true);
    expect(isSameProjectName("Test Project", " Test Project ")).toBe(true);
  });

  it("allows similar but not exact names", () => {
    expect(isSameProjectName("Test Project", "Test Project 1")).toBe(false);
    expect(isSameProjectName("Test Project", "Test Project - Copy")).toBe(false);
    expect(isSameProjectName("Test Project", "Test Project")).toBe(true);
  });

  it("uses the requested duplicate message", () => {
    expect(PROJECT_NAME_DUPLICATE_MESSAGE).toBe(
      "Project Name already exists. Please enter a unique Project Name."
    );
  });
});
