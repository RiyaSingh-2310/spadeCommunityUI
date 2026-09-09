import { beforeEach, describe, expect, it, vi } from "vitest";
import { getColumnKey, getRowValue } from "../../modules/shared/utils/tableHelpers";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import { getRecords, mapPrescreenGroupToRow } from "./questionnaireGroupApi";

const LIST_RECORD = {
  id: 9,
  surveyTitle: "Nederlandse introductie (DUTCH)",
  language: "dutch",
  website_url: "https://spade-community-client-ui.vercel.app/questionnaire/9",
  status: "active",
  createdAt: "2026-09-08T00:55:47.000Z",
  questionCount: 2,
};

describe("mapPrescreenGroupToRow", () => {
  it("uses API questionCount, language, and website_url", () => {
    const row = mapPrescreenGroupToRow({
      ...LIST_RECORD,
      questionIds: [1, 2, 3, 4, 5, 6],
      questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    expect(row.questionCount).toBe(2);
    expect(row.surveyTitle).toBe(LIST_RECORD.surveyTitle);
    expect(row.website_url).toBe(LIST_RECORD.website_url);
    expect(row.websiteUrl).toBe(LIST_RECORD.website_url);
    expect(row.languageSlug).toBe("dutch");
    expect(row.language).toBe("Dutch");
  });

  it("displays 3 when the API returns questionCount 3", () => {
    const row = mapPrescreenGroupToRow({
      ...LIST_RECORD,
      id: 3,
      surveyTitle: "testinggg",
      language: "english",
      questionCount: 3,
      questionIds: [10, 20, 30, 40],
    });

    expect(row.questionCount).toBe(3);
  });
});

describe("Questionnaire Group listing columns", () => {
  it("maps Group Title, Website URL, and Question Count", () => {
    expect(getColumnKey("Group Title")).toBe("surveyTitle");
    expect(getColumnKey("Questionnaire Group")).toBe("surveyTitle");
    expect(getColumnKey("Question Count")).toBe("questionCount");
    expect(getColumnKey("Created At")).toBe("createdAt");
    expect(getColumnKey("Website URL")).toBe("websiteUrl");

    const row = mapPrescreenGroupToRow(LIST_RECORD);
    expect(getRowValue(row, "Group Title")).toBe(LIST_RECORD.surveyTitle);
    expect(getRowValue(row, "Question Count")).toBe(2);
    expect(getRowValue(row, "Language")).toBe("Dutch");
    expect(getRowValue(row, "Website URL")).toBe(LIST_RECORD.website_url);
  });
});

describe("getRecords", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("calls /api/questionnaire-group/list with page, limit, and status", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [LIST_RECORD],
      total: 7,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await getRecords({ page: 1, limit: 10, status: "active" });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const path = String(vi.mocked(apiRequest).mock.calls[0][0]);
    expect(path).toContain("/api/questionnaire-group/list");
    expect(path).toContain("page=1");
    expect(path).toContain("limit=10");
    expect(path).toContain("status=active");
    expect(path).not.toContain("language=");

    expect(result.total).toBe(7);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.items[0].questionCount).toBe(2);
    expect(result.items[0].languageSlug).toBe("dutch");
  });

  it("does not default to english and can list every language", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [
        LIST_RECORD,
        { ...LIST_RECORD, id: 7, language: "korean", surveyTitle: "Tooth" },
        { ...LIST_RECORD, id: 4, language: "english", surveyTitle: "Introduction" },
      ],
      total: 7,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await getRecords({ page: 1, limit: 10, status: "all" });
    const path = String(vi.mocked(apiRequest).mock.calls[0][0]);
    expect(path).not.toContain("status=");
    expect(path).not.toContain("language=");
    expect(result.items.map((item) => item.languageSlug)).toEqual([
      "dutch",
      "korean",
      "english",
    ]);
  });

  it("sends language only when a language filter is selected", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [LIST_RECORD],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    await getRecords({ page: 1, limit: 10, status: "active", language: "Dutch" });
    const path = String(vi.mocked(apiRequest).mock.calls[0][0]);
    expect(path).toContain("language=dutch");
    expect(path).toContain("status=active");
  });

  it("uses API pagination fields instead of hardcoded totals", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [LIST_RECORD],
      total: 24,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    const result = await getRecords({ page: 2, limit: 10, status: "active" });

    expect(result.total).toBe(24);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });
});
