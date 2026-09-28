import { describe, expect, it } from "vitest";
import {
  languageSelectOptions,
  resolveLanguageSelectValue,
} from "./profilingQuestionsStore";

const API_LANGUAGES = ["Arabic", "English", "French", "Hindi", "Spanish"];

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
    expect(languageSelectOptions("English", API_LANGUAGES)).toEqual(API_LANGUAGES);
  });

  it("injects a stored language that is not in the API list", () => {
    expect(languageSelectOptions("Portuguese", API_LANGUAGES)).toEqual([
      "Portuguese",
      ...API_LANGUAGES,
    ]);
  });
});
