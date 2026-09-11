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
