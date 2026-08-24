/**
 * Project listing Info popup.
 * GET /api/projects/:id/summary
 */
import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { formatStatusLabel } from "../../shared/utils/statusLabels";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeProjectId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Project ID is required.", null);
  }
  return encodeURIComponent(normalizedId);
}

function pickField(source, keys) {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const value = source[key];
    if (value === undefined || value === null || value === "") continue;
    return value;
  }
  return undefined;
}

function formatDisplayValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === 0 || value === "0") return "0";
  const text = String(value ?? "").trim();
  if (!text || text === "—" || text === "-") return "—";
  return text;
}

function formatCount(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : formatDisplayValue(value);
}

function extractSummaryPayload(data) {
  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data && typeof data === "object") return data;
  return {};
}

function mapSummaryUrl(url, index = 0) {
  const urlId = pickField(url, ["url_id", "urlId", "id", "project_url_id"]);

  return {
    id: urlId != null ? String(urlId) : `url-${index + 1}`,
    projectLinkType: formatDisplayValue(
      pickField(url, ["Project_Link_Type", "project_link_type", "projectLinkType"])
    ),
    country: formatDisplayValue(pickField(url, ["country", "Country"])),
    language: formatDisplayValue(pickField(url, ["Language", "language"])),
    cpi: formatCount(pickField(url, ["CPI", "cpi"])),
    loi: formatCount(pickField(url, ["LOI", "loi"])),
    completed: formatCount(pickField(url, ["CompletedCount"])),
    terminated: formatCount(pickField(url, ["Terminate"])),
    sampleSize: formatCount(pickField(url, ["SampleSize"])),
    quotaAdded: formatCount(pickField(url, ["QuotaAdded"])),
    remainingQuota: formatCount(pickField(url, ["RemainingQuota"])),
  };
}

function mapProjectSummary(payload) {
  const urls = Array.isArray(payload?.urls) ? payload.urls : [];

  return {
    project: {
      projectName: formatDisplayValue(pickField(payload, ["Project_Name"])),
      clientName: formatDisplayValue(pickField(payload, ["Clients"])),
      status: formatDisplayValue(
        formatStatusLabel(pickField(payload, ["Status"]))
      ),
      salesManager: formatDisplayValue(pickField(payload, ["Sales_Manager"])),
      projectManagerName: formatDisplayValue(
        pickField(payload, ["Project_Manager"])
      ),
    },
    totals: {
      completed: formatCount(pickField(payload, ["totalCompletedCount"])),
      terminated: formatCount(
        pickField(payload, ["Ttotalerminate", "totalTerminate"])
      ),
      sampleSize: formatCount(pickField(payload, ["totalSampleSize"])),
      quotaAdded: formatCount(pickField(payload, ["totalQuotaAdded"])),
      remainingQuota: formatCount(pickField(payload, ["totalRemainingQuota"])),
      quotaFull: formatDisplayValue(pickField(payload, ["totalQuotaFull"])),
    },
    urls: urls.map(mapSummaryUrl),
  };
}

/**
 * GET /api/projects/:id/summary
 * @param {string|number} projectId
 */
export async function getProjectUrlInfoSummary(projectId) {
  const normalizedId = normalizeProjectId(projectId);
  const data = await apiRequest(API_ROUTES.projects.summary(normalizedId));
  assertSuccess(data);
  return mapProjectSummary(extractSummaryPayload(data));
}
