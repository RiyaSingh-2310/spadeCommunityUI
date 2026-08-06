export const PROJECT_REPORT_TYPES = {
  PROJECT: "project",
  PRESCREEN: "prescreen",
  SUPPLIER: "supplier",
};

export const PROJECT_REPORT_TYPE_LABELS = {
  [PROJECT_REPORT_TYPES.PROJECT]: "Project Report",
  [PROJECT_REPORT_TYPES.PRESCREEN]: "Prescreen Report",
  [PROJECT_REPORT_TYPES.SUPPLIER]: "Supplier Report",
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
} = {}) {
  const encodedId = encodeURIComponent(String(projectId ?? "").trim());
  const params = new URLSearchParams();
  params.set("type", normalizeProjectReportType(reportType));

  const resolvedSupplierId = String(supplierId ?? "").trim();
  if (resolvedSupplierId) {
    params.set("supplierId", resolvedSupplierId);
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
    [PROJECT_REPORT_TYPES.PRESCREEN]: "Prescreen Question",
    [PROJECT_REPORT_TYPES.SUPPLIER]: "Supplier",
  }[type];
  const name = String(projectName ?? "").trim();
  return name ? `${titlePrefix} of ${name}` : titlePrefix;
}
