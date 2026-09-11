import { normalizeSearchQuery } from "../../shared/utils/searchQuery";

export const REPORT_MODE = {
  LIVE: "live",
  TEST: "test",
};

export const REPORT_STATUS = {
  ALL: "",
  INITIATED: "initiated",
  COMPLETED: "completed",
};

export const REPORT_STATUS_OPTIONS = [
  { value: REPORT_STATUS.ALL, label: "All" },
  { value: REPORT_STATUS.INITIATED, label: "Initiated" },
  { value: REPORT_STATUS.COMPLETED, label: "Completed" },
];

export function normalizeReportMode(mode) {
  return String(mode ?? "").trim().toLowerCase() === "test"
    ? REPORT_MODE.TEST
    : REPORT_MODE.LIVE;
}

export function normalizeReportStatus(status) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (key === "completed" || key === "complete") return REPORT_STATUS.COMPLETED;
  if (
    key === "initiated" ||
    key === "initiate" ||
    key === "in_progress" ||
    key === "inprogress" ||
    key === "started" ||
    key === "start"
  ) {
    return REPORT_STATUS.INITIATED;
  }
  return REPORT_STATUS.ALL;
}

/** Query value for GET /api/project-reports/:id/report?status=completed */
export function toProjectReportApiStatus(status) {
  const normalized = normalizeReportStatus(status);
  if (normalized === REPORT_STATUS.COMPLETED) return "completed";
  if (normalized === REPORT_STATUS.INITIATED) return "initiated";
  return "";
}

export function isReportTestModeValue(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key === "true" || key === "1" || key === "yes" || key === "test";
}

/** Calendar day (YYYY-MM-DD) used to match Date Range filters. */
export function toFilterDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—") return "";
  const isoDay = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDay) return isoDay[1];
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rowSupplierIds(row) {
  return [
    row?.supplierId,
    row?.vendorId,
    row?.partnerId,
    row?.partnerCode,
  ]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value && value !== "—");
}

export function rowMatchesReportFilters(
  row,
  { mode, supplierId, status, startDate = "", endDate = "" } = {}
) {
  const normalizedMode = normalizeReportMode(mode);
  const isTest = isReportTestModeValue(row?.isTestLink);
  if (normalizedMode === REPORT_MODE.TEST && !isTest) return false;
  if (normalizedMode === REPORT_MODE.LIVE && isTest) return false;

  const wantedStatus = normalizeReportStatus(status);
  if (wantedStatus) {
    const rowStatus = normalizeReportStatus(row?.status);
    if (rowStatus !== wantedStatus) return false;
  }

  const resolvedSupplierId = String(supplierId ?? "").trim();
  if (resolvedSupplierId && !rowSupplierIds(row).includes(resolvedSupplierId)) {
    return false;
  }

  const resolvedStart = String(startDate ?? "").trim();
  const resolvedEnd = String(endDate ?? "").trim();
  if (resolvedStart || resolvedEnd) {
    const rowDate = String(row?._filterDate ?? "").trim() || toFilterDate(
      row?.surveyStartDate ?? row?.surveyEndDate ?? row?.occurredAt
    );
    if (!rowDate) return false;
    if (resolvedStart && rowDate < resolvedStart) return false;
    if (resolvedEnd && rowDate > resolvedEnd) return false;
  }

  return true;
}

export function filterReportRows(
  rows,
  { search = "", mode, supplierId, status, startDate = "", endDate = "" } = {}
) {
  const query = normalizeSearchQuery(search).toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!rowMatchesReportFilters(row, { mode, supplierId, status, startDate, endDate })) {
      return false;
    }
    if (!query) return true;
    return Object.entries(row).some(([key, value]) => {
      if (String(key).startsWith("_")) return false;
      return String(value ?? "").toLowerCase().includes(query);
    });
  });
}
