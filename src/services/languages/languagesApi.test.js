import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import {
  clearLanguagesCache,
  getLanguages,
  mergeLanguageNames,
} from "./languagesApi";

const API_LANGUAGES = [
  "Arabic",
  "Chinese",
  "Dutch",
  "English",
  "French",
  "German",
  "Hindi",
  "Italian",
  "Japanese",
  "Korean",
  "Russian",
  "Spanish",
];

describe("getLanguages", () => {
  beforeEach(() => {
    clearLanguagesCache();
    apiRequest.mockReset();
  });

  it("returns every language from GET /api/languages", async () => {
    apiRequest.mockResolvedValue({ success: true, data: API_LANGUAGES });

    await expect(getLanguages()).resolves.toEqual(API_LANGUAGES);
    expect(apiRequest).toHaveBeenCalledWith("/api/languages");
  });

  it("reuses the cached list", async () => {
    apiRequest.mockResolvedValue({ success: true, data: API_LANGUAGES });

    await getLanguages();
    await getLanguages();

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});

describe("mergeLanguageNames", () => {
  it("keeps the full API list when extras are only a subset", () => {
    expect(mergeLanguageNames(API_LANGUAGES, { extra: ["english", "dutch"] })).toEqual(
      API_LANGUAGES
    );
  });

  it("appends a stored language that the API did not return", () => {
    expect(mergeLanguageNames(["English"], { selected: "Portuguese" })).toEqual([
      "English",
      "Portuguese",
    ]);
  });
});
