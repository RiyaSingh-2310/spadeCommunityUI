import { describe, expect, it } from "vitest";
import {
  filterReportRows,
  GROUP_STATUS_FILTER_OPTIONS,
  REPORT_MODE,
  REPORT_STATUS,
  REPORT_STATUS_OPTIONS,
  toGroupListingStatusQuery,
  toProjectReportApiStatus,
} from "./reportFilterConstants";

const liveCompleted = {
  uid: "Riya",
  status: "completed",
  supplierId: "3",
  isTestLink: "false",
  _filterDate: "2026-08-31",
};

const liveInitiated = {
  uid: "akshat",
  status: "initiated",
  supplierId: "1",
  isTestLink: "false",
  _filterDate: "2026-09-07",
};

const testCompleted = {
  uid: "test-user",
  status: "completed",
  supplierId: "3",
  isTestLink: "true",
  _filterDate: "2026-08-31",
};

describe("filterReportRows", () => {
  const rows = [liveCompleted, liveInitiated, testCompleted];

  it("returns only completed live rows when those filters are selected", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.LIVE,
        status: REPORT_STATUS.COMPLETED,
      })
    ).toEqual([liveCompleted]);
  });

  it("returns only initiated rows", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.LIVE,
        status: REPORT_STATUS.INITIATED,
      })
    ).toEqual([liveInitiated]);
  });

  it("restores matching live rows when status is All", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.LIVE,
        status: REPORT_STATUS.ALL,
      })
    ).toEqual([liveCompleted, liveInitiated]);
  });

  it("combines supplier, date range, and status", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.LIVE,
        status: REPORT_STATUS.COMPLETED,
        supplierId: "3",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
      })
    ).toEqual([liveCompleted]);
  });

  it("applies search after other filters", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.LIVE,
        search: "riya",
      })
    ).toEqual([liveCompleted]);
  });

  it("keeps the shared outcome status list for reports and groups", () => {
    expect(REPORT_STATUS_OPTIONS.map((option) => option.label)).toEqual([
      "All",
      "Initiated",
      "Completed",
      "Quota Full",
      "Quality Term",
      "Survey Closed",
      "Terminated",
    ]);
    expect(GROUP_STATUS_FILTER_OPTIONS.map((option) => option.label).slice(0, 7)).toEqual(
      REPORT_STATUS_OPTIONS.map((option) => option.label)
    );
    expect(GROUP_STATUS_FILTER_OPTIONS.map((option) => option.value)).toEqual(
      expect.arrayContaining(["all", "active", "inactive", REPORT_STATUS.QUOTA_FULL])
    );
    expect(toProjectReportApiStatus("Quota Full")).toBe("quota_full");
    expect(toProjectReportApiStatus("Quality Term")).toBe("quality_term");
    expect(toProjectReportApiStatus("Survey Closed")).toBe("survey_closed");
    expect(toProjectReportApiStatus("Terminated")).toBe("terminated");
    expect(toGroupListingStatusQuery("all")).toBe("");
    expect(toGroupListingStatusQuery("active")).toBe("active");
    expect(toGroupListingStatusQuery("Inactive")).toBe("inactive");
    expect(toGroupListingStatusQuery("quota full")).toBe("quota_full");
  });

  it("returns an empty list when nothing matches", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.TEST,
        status: REPORT_STATUS.INITIATED,
      })
    ).toEqual([]);
  });
});
