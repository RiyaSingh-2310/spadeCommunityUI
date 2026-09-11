import { describe, expect, it, vi, beforeEach } from "vitest";
import { toProjectReportApiStatus } from "../utils/reportFilterConstants";

vi.mock("../../../services/api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/client";
import {
  fetchProjectReportList,
  mapProjectReportRow,
  mapPrescreenReportRow,
  reportFilterQuery,
} from "./projectReportApi";

describe("mapProjectReportRow", () => {
  it("maps Supplier Identifier onto UID", () => {
    const row = mapProjectReportRow({
      supplier_id: 1,
      supplier_name: "Supplier 1",
      client_id: "C-9",
      "Supplier Identifier": "4534sddfs",
      status: "complete",
      is_test: 0,
      device: "Desktop",
      reason: "Qualified",
    });
    expect(row.uid).toBe("4534sddfs");
    expect(row.device).toBe("Desktop");
    expect(row.reason).toBe("Qualified");
    expect(row.isTestLink).toBe("false");
  });

  it("maps GET /report payload including supplier_identifier as UID", () => {
    const row = mapProjectReportRow({
      supplier_id: 3,
      supplier_name: "Demo Partner (P003)",
      client_id: "Demo Client",
      supplier_identifier: "Riya",
      status: "completed",
      survey_start_date: "2026-08-31T03:22:53.000Z",
      survey_end_date: "2026-08-31T03:24:38.000Z",
      loi_minutes: 1,
      ip_address: "::1",
      country: null,
      city: null,
      is_test_link: false,
    });
    expect(row.supplierId).toBe("3");
    expect(row.supplierName).toBe("Demo Partner (P003)");
    expect(row.clientId).toBe("Demo Client");
    expect(row.uid).toBe("Riya");
    expect(row.status).toBe("completed");
    expect(row.loiMinutes).toBe("1");
    expect(row.ipAddress).toBe("::1");
    expect(row.country).toBe("—");
    expect(row.city).toBe("—");
    expect(row.isTestLink).toBe("false");
  });

  it("falls back to uid when Supplier Identifier is missing", () => {
    const row = mapProjectReportRow({
      uid: "uid-only",
      is_test: 1,
    });
    expect(row.uid).toBe("uid-only");
    expect(row.isTestLink).toBe("true");
  });
});

describe("toProjectReportApiStatus", () => {
  it("sends lowercase status query values matching the report API", () => {
    expect(toProjectReportApiStatus("initiated")).toBe("initiated");
    expect(toProjectReportApiStatus("Initiated")).toBe("initiated");
    expect(toProjectReportApiStatus("completed")).toBe("completed");
    expect(toProjectReportApiStatus("Completed")).toBe("completed");
    expect(toProjectReportApiStatus("")).toBe("");
  });
});

describe("reportFilterQuery", () => {
  it("omits status when All is selected", () => {
    expect(reportFilterQuery({ status: "" }).status).toBeUndefined();
  });

  it("combines status, date range, supplier, and mode in one query", () => {
    expect(
      reportFilterQuery({
        mode: "live",
        supplierId: "3",
        status: "completed",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      })
    ).toEqual({
      is_test: "0",
      supplier_id: "3",
      supplierId: "3",
      status: "completed",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
  });
});

describe("fetchProjectReportList", () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it("requests GET /api/project-reports/:id/report?status=completed", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      project_name: "Demo Project",
      data: [
        {
          supplier_id: 3,
          supplier_name: "Demo Partner (P003)",
          client_id: "Demo Client",
          supplier_identifier: "Riya",
          status: "completed",
          survey_start_date: "2026-08-31T03:22:53.000Z",
          survey_end_date: "2026-08-31T03:24:38.000Z",
          loi_minutes: 1,
          ip_address: "::1",
          country: null,
          city: null,
          is_test_link: false,
        },
      ],
    });

    const result = await fetchProjectReportList({
      projectId: 2,
      status: "completed",
      mode: "live",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/project-reports\/2\/report\?/)
    );
    const path = apiRequest.mock.calls[0][0];
    expect(path).toContain("status=completed");
    expect(path).not.toContain("status=Completed");
    expect(result.items[0].uid).toBe("Riya");
    expect(result.items[0].status).toBe("completed");
    expect(result.projectName).toBe("Demo Project");
  });

  it("requests status=initiated and keeps an empty API payload empty", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      project_name: "Demo Project",
      data: [],
    });

    const result = await fetchProjectReportList({
      projectId: 2,
      status: "initiated",
      mode: "live",
    });

    const path = apiRequest.mock.calls[0][0];
    expect(path).toContain("status=initiated");
    expect(path).not.toContain("status=Initiated");
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("hides rows that do not match the selected status", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      project_name: "Demo Project",
      data: [
        {
          supplier_identifier: "Riya",
          status: "completed",
          is_test_link: false,
          supplier_id: 3,
        },
        {
          supplier_identifier: "akshat",
          status: "initiated",
          is_test_link: false,
          supplier_id: 1,
        },
      ],
    });

    const result = await fetchProjectReportList({
      projectId: 2,
      status: "completed",
      mode: "live",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].uid).toBe("Riya");
    expect(result.total).toBe(1);
  });

  it("applies the same combined filters on the pre-screen report", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: [
        {
          supplier_identifier: "A",
          status: "completed",
          is_test: 0,
          supplier_id: 3,
        },
        {
          supplier_identifier: "B",
          status: "initiated",
          is_test: 0,
          supplier_id: 3,
        },
        {
          supplier_identifier: "C",
          status: "initiated",
          is_test: 1,
          supplier_id: 3,
        },
      ],
    });

    const result = await fetchProjectReportList({
      projectId: 2,
      reportType: "prescreen",
      status: "initiated",
      mode: "live",
      supplierId: "3",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].uid).toBe("B");
    expect(result.total).toBe(1);
  });
});

describe("mapPrescreenReportRow", () => {
  it("maps Supplier Identifier onto UID and keeps existing fields", () => {
    const row = mapPrescreenReportRow({
      supplier_identifier: "ps-uid-1",
      supplier_name: "Partner A",
      vendor_id: "V-2",
      client_id: "C-3",
      ip: "1.2.3.4",
      question: "Age?",
      answer: "18+",
    });
    expect(row.uid).toBe("ps-uid-1");
    expect(row.supplierName).toBe("Partner A");
    expect(row.vendorId).toBe("V-2");
    expect(row.clientId).toBe("C-3");
    expect(row.ip).toBe("1.2.3.4");
    expect(row.question).toBe("Age?");
    expect(row.answer).toBe("18+");
  });
});
