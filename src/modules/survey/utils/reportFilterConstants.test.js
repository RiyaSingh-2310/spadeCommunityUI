import { describe, expect, it } from "vitest";
import {
  filterReportRows,
  REPORT_MODE,
  REPORT_STATUS,
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

  it("returns an empty list when nothing matches", () => {
    expect(
      filterReportRows(rows, {
        mode: REPORT_MODE.TEST,
        status: REPORT_STATUS.INITIATED,
      })
    ).toEqual([]);
  });
});
