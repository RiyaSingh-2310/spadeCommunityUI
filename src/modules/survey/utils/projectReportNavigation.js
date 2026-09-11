export const PROJECT_REPORT_TYPES = {
  PROJECT: "project",
  PRESCREEN: "prescreen",
  FRAUD: "fraud",
  SUPPLIER: "supplier",
  TEST: "test",
};

export const PROJECT_REPORT_TYPE_LABELS = {
  [PROJECT_REPORT_TYPES.PROJECT]: "Project Report",
  [PROJECT_REPORT_TYPES.PRESCREEN]: "Pre-Screen Report",
  [PROJECT_REPORT_TYPES.FRAUD]: "Fraud / Security Report",
  [PROJECT_REPORT_TYPES.SUPPLIER]: "Supplier Report",
  [PROJECT_REPORT_TYPES.TEST]: "Test URL Report",
};

/**
 * @param {string} [reportType]
 */
export function normalizeProjectReportType(reportType) {
  const normalized = String(reportType ?? "")
    .trim()
    .toLowerCase();
  if (Object.values(PROJECT_REPORT_TYPES).includes(normalized)) {
    return normalized;
  }
  return PROJECT_REPORT_TYPES.PROJECT;
}

/**
 * @param {{
 *   projectId: string|number,
 *   reportType?: string,
 *   supplierId?: string|number,
 *   projectName?: string,
 * }} options
 */
export function getProjectReportViewPath({
  projectId,
  reportType = PROJECT_REPORT_TYPES.PROJECT,
  supplierId,
  projectName,
  mode,
} = {}) {
  const encodedId = encodeURIComponent(String(projectId ?? "").trim());
  const params = new URLSearchParams();
  params.set("type", normalizeProjectReportType(reportType));

  const resolvedSupplierId = String(supplierId ?? "").trim();
  if (resolvedSupplierId) {
    params.set("supplierId", resolvedSupplierId);
  }

  const resolvedMode = String(mode ?? "").trim().toLowerCase();
  if (resolvedMode === "test" || resolvedMode === "live") {
    params.set("mode", resolvedMode);
  }

  const resolvedTitle = String(projectName ?? "").trim();
  if (resolvedTitle) {
    params.set("title", resolvedTitle);
  }

  const query = params.toString();
  return `/survey/report/view/${encodedId}${query ? `?${query}` : ""}`;
}

/**
 * @param {Parameters<typeof getProjectReportViewPath>[0]} options
 */
export function openProjectReportView(options) {
  const path = getProjectReportViewPath(options);
  const url =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}${path}`
      : path;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * @param {URLSearchParams | { get: (key: string) => string | null }} searchParams
 */
export function parseProjectReportSearch(searchParams) {
  return {
    reportType: normalizeProjectReportType(searchParams.get("type")),
    supplierId: String(searchParams.get("supplierId") ?? "").trim(),
    mode: String(searchParams.get("mode") ?? "live").trim().toLowerCase() === "test"
      ? "test"
      : "live",
    status: String(searchParams.get("status") ?? "").trim().toLowerCase(),
    startDate: String(
      searchParams.get("start_date") ?? searchParams.get("from_date") ?? ""
    ).trim(),
    endDate: String(
      searchParams.get("end_date") ?? searchParams.get("to_date") ?? ""
    ).trim(),
    projectName: String(searchParams.get("title") ?? "").trim(),
  };
}

/**
 * @param {{ reportType: string, projectName?: string }} options
 */
export function getProjectReportPageTitle({ reportType, projectName }) {
  const type = normalizeProjectReportType(reportType);
  const titlePrefix = {
    [PROJECT_REPORT_TYPES.PROJECT]: "Project Report",
    [PROJECT_REPORT_TYPES.PRESCREEN]: "Pre-Screen Report",
    [PROJECT_REPORT_TYPES.FRAUD]: "Fraud / Security Report",
    [PROJECT_REPORT_TYPES.SUPPLIER]: "Supplier",
    [PROJECT_REPORT_TYPES.TEST]: "Test URL Report",
  }[type];
  const name = String(projectName ?? "").trim();
  return name ? `${titlePrefix} of ${name}` : titlePrefix;
}
