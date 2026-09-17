import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/client";
import {
  listSurveySettings,
  mapSurveySettingsListItem,
  mapSurveySettingsToLanguageOptions,
  buildSurveySettingsUpdatePayload,
  resolveSurveySettingsId,
  updateSurveySettings,
} from "./surveySettingsApi";

const LIST_RESPONSE = {
  success: true,
  message: "Survey settings fetched successfully",
  data: [
    { id: 1, language: "English", createdAt: "2026-09-07T05:22:26.000Z", updatedAt: "2026-09-07T05:22:26.000Z" },
    { id: 5, language: "Korean", createdAt: "2026-09-07T05:22:26.000Z", updatedAt: "2026-09-07T05:22:26.000Z" },
    { id: 7, language: "Hindi", createdAt: "2026-09-07T05:22:26.000Z", updatedAt: "2026-09-07T05:22:26.000Z" },
  ],
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe("mapSurveySettingsListItem", () => {
  it("maps API language rows", () => {
    expect(mapSurveySettingsListItem(LIST_RESPONSE.data[0])).toEqual({
      id: 1,
      language: "English",
      createdAt: "2026-09-07T05:22:26.000Z",
      updatedAt: "2026-09-07T05:22:26.000Z",
      completeRedirect: "",
      terminateRedirect: "",
      overQuotaRedirect: "",
      qualityTermRedirect: "",
      surveyCloseRedirect: "",
    });
  });
});

describe("mapSurveySettingsToLanguageOptions", () => {
  it("builds unique language select options from the list API", () => {
    const items = LIST_RESPONSE.data.map((row) => mapSurveySettingsListItem(row));
    expect(mapSurveySettingsToLanguageOptions(items)).toEqual([
      { value: "English", label: "English" },
      { value: "Korean", label: "Korean" },
      { value: "Hindi", label: "Hindi" },
    ]);
  });
});

describe("listSurveySettings", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("calls GET /api/survey-settings/list with page and limit", async () => {
    vi.mocked(apiRequest).mockResolvedValue(LIST_RESPONSE);

    const result = await listSurveySettings({ page: 1, limit: 10 });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const path = String(vi.mocked(apiRequest).mock.calls[0][0]);
    expect(path).toContain("/api/survey-settings/list");
    expect(path).toContain("page=1");
    expect(path).toContain("limit=10");
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
    expect(result.items.map((item) => item.language)).toEqual([
      "English",
      "Korean",
      "Hindi",
    ]);
  });
});

describe("buildSurveySettingsUpdatePayload", () => {
  it("maps redirect editors to the PUT contract", () => {
    expect(
      buildSurveySettingsUpdatePayload({
        completeRedirect: "<p>Complete</p>",
        terminateRedirect: "<p>Terminate</p>",
        overQuotaRedirect: "<p>Quota</p>",
        qualityTermRedirect: "<p>Quality</p>",
        surveyCloseRedirect: "<p>Closed</p>",
      })
    ).toEqual({
      complete_redirect_content: "<p>Complete</p>",
      terminate_redirect_content: "<p>Terminate</p>",
      over_quota_redirect_content: "<p>Quota</p>",
      quality_term_redirect_content: "<p>Quality</p>",
      survey_close_redirect_content: "<p>Closed</p>",
    });
  });
});

describe("resolveSurveySettingsId", () => {
  it("resolves the list row id for the selected language", () => {
    const items = LIST_RESPONSE.data.map((row) => mapSurveySettingsListItem(row));
    expect(resolveSurveySettingsId("English", items)).toBe("1");
    expect(resolveSurveySettingsId("korean", items)).toBe("5");
  });
});

describe("updateSurveySettings", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("PUTs redirect content to /api/survey-settings/:id", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      message: "Survey setting updated successfully!",
    });

    await updateSurveySettings(1, {
      completeRedirect: "<p>Complete</p>",
      terminateRedirect: "<p>Terminate</p>",
      overQuotaRedirect: "<p>Quota</p>",
      qualityTermRedirect: "<p>Quality</p>",
      surveyCloseRedirect: "<p>Closed</p>",
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const [path, options] = vi.mocked(apiRequest).mock.calls[0];
    expect(path).toBe("/api/survey-settings/1");
    expect(options.method).toBe("PUT");
    expect(options.body).toEqual({
      complete_redirect_content: "<p>Complete</p>",
      terminate_redirect_content: "<p>Terminate</p>",
      over_quota_redirect_content: "<p>Quota</p>",
      quality_term_redirect_content: "<p>Quality</p>",
      survey_close_redirect_content: "<p>Closed</p>",
    });
  });
});

