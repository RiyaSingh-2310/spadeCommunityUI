import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/client";
import {
  buildSurveySettingsUpdatePayload,
  findUnpersistedContentKeys,
  getSurveySettingsByLanguage,
  getSurveySettingsIdForLanguage,
  mapSurveySettingRecord,
  resolveSurveySettingsLanguage,
  SURVEY_SETTINGS_LANGUAGE_IDS,
  updateSurveySettingsByLanguage,
} from "./surveySettingsApi";

const HINDI_RECORD = {
  id: 7,
  language: "Hindi",
  complete_redirect_content:
    '<div style="text-align: center;"><p>यह सर्वेक्षण सफलतापूर्वक पूरा हो गया है।</p></div>',
  terminate_redirect_content: "<p>Terminate</p>",
  quality_term_redirect_content: "<p>Quality</p>",
  survey_close_redirect_content: null,
  createdAt: "2026-09-07T05:22:26.000Z",
  updatedAt: "2026-09-30T09:00:00.000Z",
};

const HINDI_RESPONSE = {
  success: true,
  message: "Survey setting fetched successfully",
  data: HINDI_RECORD,
};

const FORM = {
  language: "Hindi",
  completeRedirect: "<p>Complete</p>",
  terminateRedirect: "<p>Terminate</p>",
  qualityTermRedirect: "<p>Quality</p>",
  surveyCloseRedirect: "<p>Closed</p>",
};

describe("language → id mapping", () => {
  it("maps all eight supported languages to their survey_settings ids", () => {
    expect(SURVEY_SETTINGS_LANGUAGE_IDS).toEqual({
      English: 1,
      Spanish: 2,
      French: 3,
      German: 4,
      Korean: 5,
      Chinese: 6,
      Hindi: 7,
      Japanese: 8,
    });
  });

  it("resolves languages case-insensitively and rejects unsupported ones", () => {
    expect(resolveSurveySettingsLanguage(" hindi ")).toBe("Hindi");
    expect(getSurveySettingsIdForLanguage("JAPANESE")).toBe(8);
    expect(resolveSurveySettingsLanguage("Italian")).toBeNull();
    expect(getSurveySettingsIdForLanguage("")).toBeNull();
  });
});

describe("mapSurveySettingRecord", () => {
  it("maps API fields to form fields and preserves HTML", () => {
    expect(mapSurveySettingRecord(HINDI_RECORD, "Hindi")).toEqual({
      id: 7,
      language: "Hindi",
      createdAt: HINDI_RECORD.createdAt,
      updatedAt: HINDI_RECORD.updatedAt,
      completeRedirect: HINDI_RECORD.complete_redirect_content,
      terminateRedirect: "<p>Terminate</p>",
      qualityTermRedirect: "<p>Quality</p>",
      surveyCloseRedirect: "",
    });
  });

  it("rejects missing data, another language's record, and id mismatches", () => {
    expect(() => mapSurveySettingRecord(undefined, "Hindi")).toThrow(/did not include any data/);
    expect(() => mapSurveySettingRecord(HINDI_RECORD, "English")).toThrow(/returned "Hindi"/);
    expect(() => mapSurveySettingRecord({ ...HINDI_RECORD, id: 9 }, "Hindi")).toThrow(
      /id 7 is expected/
    );
  });
});

describe("getSurveySettingsByLanguage", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("calls GET /api/survey-settings/public/language/:language with the canonical name", async () => {
    vi.mocked(apiRequest).mockResolvedValue(HINDI_RESPONSE);

    const result = await getSurveySettingsByLanguage("hindi");

    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(vi.mocked(apiRequest).mock.calls[0][0]).toBe(
      "/api/survey-settings/public/language/Hindi"
    );
    expect(result.id).toBe(7);
    expect(result.completeRedirect).toContain("यह सर्वेक्षण");
  });

  it("does not call the API for unsupported languages", async () => {
    await expect(getSurveySettingsByLanguage("Italian")).rejects.toThrow(
      /not available for "Italian"/
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("throws the API message when success is false", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ success: false, message: "Not found!" });
    await expect(getSurveySettingsByLanguage("Hindi")).rejects.toThrow("Not found!");
  });

  it("throws when the response has no data", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ success: true, message: "ok" });
    await expect(getSurveySettingsByLanguage("Hindi")).rejects.toThrow(
      /did not include any data/
    );
  });
});

describe("buildSurveySettingsUpdatePayload", () => {
  it("sends only the four redirect content fields", () => {
    expect(buildSurveySettingsUpdatePayload({ ...FORM, id: 7, createdAt: "x" })).toEqual({
      complete_redirect_content: "<p>Complete</p>",
      terminate_redirect_content: "<p>Terminate</p>",
      quality_term_redirect_content: "<p>Quality</p>",
      survey_close_redirect_content: "<p>Closed</p>",
    });
  });
});

describe("updateSurveySettingsByLanguage", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it.each(Object.entries(SURVEY_SETTINGS_LANGUAGE_IDS))(
    "PUTs %s content to /api/survey-settings/%i",
    async (language, id) => {
      vi.mocked(apiRequest).mockResolvedValue({
        success: true,
        message: "Survey setting updated successfully!",
      });

      await updateSurveySettingsByLanguage(language.toLowerCase(), FORM);

      const [path, options] = vi.mocked(apiRequest).mock.calls[0];
      expect(path).toBe(`/api/survey-settings/${id}`);
      expect(options.method).toBe("PUT");
      expect(options.body).toEqual(buildSurveySettingsUpdatePayload(FORM));
    }
  );

  it("does not PUT for unsupported languages", async () => {
    await expect(updateSurveySettingsByLanguage("Italian", FORM)).rejects.toThrow();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("surfaces an explicit API failure", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ success: false, message: "Nothing to update!" });
    await expect(updateSurveySettingsByLanguage("Hindi", FORM)).rejects.toThrow(
      "Nothing to update!"
    );
  });
});

describe("findUnpersistedContentKeys", () => {
  it("lists fields whose persisted content differs from what was sent", () => {
    const sent = buildSurveySettingsUpdatePayload(FORM);
    expect(findUnpersistedContentKeys(sent, FORM)).toEqual([]);
    expect(
      findUnpersistedContentKeys(sent, { ...FORM, terminateRedirect: "<p>Old</p>" })
    ).toEqual(["terminateRedirect"]);
  });
});
