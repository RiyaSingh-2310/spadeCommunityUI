import { beforeEach, describe, expect, it, vi } from "vitest";
import { getColumnKey, getRowValue } from "../../modules/shared/utils/tableHelpers";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import { getRecords, mapPrescreenGroupToRow } from "./questionnaireGroupApi";

const LIST_RECORD = {
  id: 4,
  surveyTitle: "Introduction",
  language: "english",
  website_url: "https://spade-community-client-ui.vercel.app/questionnaire/4",
  status: "active",
  createdAt: "2026-08-31T03:14:42.000Z",
  questionCount: 4,
};

describe("mapPrescreenGroupToRow", () => {
  it("uses API questionCount and does not count nested questions or ids", () => {
    const row = mapPrescreenGroupToRow({
      ...LIST_RECORD,
      questionIds: [1, 2, 3, 4, 5, 6],
      questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    expect(row.questionCount).toBe(4);
    expect(row.surveyTitle).toBe("Introduction");
    expect(row.website_url).toBe(LIST_RECORD.website_url);
  });

  it("displays 3 when the API returns questionCount 3", () => {
    const row = mapPrescreenGroupToRow({
      ...LIST_RECORD,
      id: 3,
      surveyTitle: "testinggg",
      questionCount: 3,
      questionIds: [10, 20, 30, 40],
    });

    expect(row.questionCount).toBe(3);
  });
});

describe("Questionnaire Group listing columns", () => {
  it("maps Questionnaire Group and Question Count without Website URL", () => {
    expect(getColumnKey("Questionnaire Group")).toBe("surveyTitle");
    expect(getColumnKey("Question Count")).toBe("questionCount");
    expect(getColumnKey("Created At")).toBe("createdAt");
    expect(getColumnKey("Website URL")).toBe("websiteUrl");

    const row = mapPrescreenGroupToRow(LIST_RECORD);
    expect(getRowValue(row, "Questionnaire Group")).toBe("Introduction");
    expect(getRowValue(row, "Question Count")).toBe(4);
    expect(getRowValue(row, "Language")).toBe("English");
  });
});

describe("getRecords", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("calls /api/questionnaire-group/list with page, limit, and language", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      data: [LIST_RECORD],
      total: 4,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await getRecords({ page: 1, limit: 10, language: "English" });

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const path = String(vi.mocked(apiRequest).mock.calls[0][0]);
    expect(path).toContain("/api/questionnaire-group/list");
    expect(path).toContain("page=1");
    expect(path).toContain("limit=10");
    expect(path).toContain("language=english");

    expect(result.total).toBe(4);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.items[0].questionCount).toBe(4);
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

    const result = await getRecords({ page: 2, limit: 10 });

    expect(result.total).toBe(24);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });
});
