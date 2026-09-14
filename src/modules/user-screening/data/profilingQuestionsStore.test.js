import { describe, expect, it } from "vitest";
import {
  LANGUAGES,
  languageSelectOptions,
  resolveLanguageSelectValue,
} from "./profilingQuestionsStore";

describe("resolveLanguageSelectValue", () => {
  it("maps API slugs and codes onto catalog option values", () => {
    expect(resolveLanguageSelectValue("english")).toBe("English");
    expect(resolveLanguageSelectValue("ENGLISH")).toBe("English");
    expect(resolveLanguageSelectValue("en")).toBe("English");
    expect(resolveLanguageSelectValue("fr")).toBe("French");
  });

  it("reads language objects from the API", () => {
    expect(resolveLanguageSelectValue({ name: "Hindi" })).toBe("Hindi");
    expect(resolveLanguageSelectValue({ code: "ar" })).toBe("Arabic");
    expect(resolveLanguageSelectValue({ language_name: "Spanish" })).toBe("Spanish");
  });

  it("does not invent a default language when the value is missing", () => {
    expect(resolveLanguageSelectValue("")).toBe("");
    expect(resolveLanguageSelectValue(null)).toBe("");
  });
});

describe("languageSelectOptions", () => {
  it("keeps catalog values unchanged when the selection already matches", () => {
    expect(languageSelectOptions("English")).toEqual(LANGUAGES);
  });

  it("injects an API language that is not in the static catalog", () => {
    expect(languageSelectOptions("Hindi")[0]).toBe("Hindi");
    expect(languageSelectOptions("Hindi")).toContain("English");
  });
});
