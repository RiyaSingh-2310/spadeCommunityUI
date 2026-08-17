/**
 * Project Multi URL API layer.
 * List:   GET    /api/projects/:id/multiple-url/list
 * Create: POST   /api/projects/:id/multiple-url
 * Update: PUT    /api/projects/multiple-url/:urlId
 * Delete: DELETE /api/projects/multiple-url/:urlId
 * Upload: POST   /api/projects/:id/multiple-url/csv-upload
 * Template: GET  /api/projects/multiple-url/csv-template
 * Stats:  GET    /api/projects/:id/multi-link-stats?project_url_id=
 */
import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  createEmptyProjectUrlForm,
  createProjectUrl,
  listProjectUrlsByProject,
  resolveProjectUrlRecordId,
} from "./projectUrlsApi";
import {
  mapMultiUrlRecordToRow,
  PROJECT_MULTI_URL_COLUMNS,
  PROJECT_MULTI_URL_CSV_TEMPLATE,
} from "../data/mockProjectMultiUrlData";

export { PROJECT_MULTI_URL_COLUMNS, PROJECT_MULTI_URL_CSV_TEMPLATE };

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

function normalizeMultiUrlId(urlId) {
  const normalizedId = String(urlId ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Multi URL ID is required.", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractRows(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.multipleUrls)) return data.multipleUrls;
  return [];
}

function mapRows(rawRows) {
  return (Array.isArray(rawRows) ? rawRows : []).map((row) =>
    mapMultiUrlRecordToRow(row)
  );
}

/**
 * Builds POST /api/projects/:id/multiple-url body.
 * @param {object} form
 */
export function buildCreateMultiUrlApiPayload(form = {}) {
  const vendorUser =
    String(form.Venderid_Userid ?? form.venderidUserid ?? "").trim() ||
    [form.vendorId, form.userId].filter(Boolean).join("/") ||
    "";

  return {
    Live_Link: String(form.Live_Link ?? form.liveLink ?? "").trim(),
    VenderURL: String(form.VenderURL ?? form.vendorUrl ?? "").trim(),
    Venderid_Userid: vendorUser,
    UserType: String(form.UserType ?? form.userType ?? "").trim(),
    Status: String(form.Status ?? form.status ?? "active").trim() || "active",
  };
}

/**
 * Normalizes GET /api/projects/:id/multi-link-stats payload.
 * @param {object} [raw]
 */
export function mapMultiLinkStats(raw = {}) {
  const source =
    raw && typeof raw === "object" && raw.data && typeof raw.data === "object"
      ? raw.data
      : raw;

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const addPartnerRaw =
    source?.addPartner ?? source?.add_partner ?? source?.addpartner;

  return {
    projectId: source?.project_id ?? source?.projectId ?? "",
    totalMultiLinks: toNumber(
      source?.totalMultiLinkCount ??
        source?.total_multi_links ??
        source?.totalMultiLinks
    ),
    remainingMultiLinks: toNumber(
      source?.remainingMultiLinkCount ??
        source?.remaining_multi_links ??
        source?.remainingMultiLinks
    ),
    completedSurveyCount: toNumber(
      source?.completed_survey_count ??
        source?.completedSurveyCount ??
        source?.completedSurveys
    ),
    sampleSize: toNumber(
      source?.sampleSize ?? source?.sample_size
    ),
    quotasAdded: toNumber(
      source?.quotasAdded ??
        source?.quotaAdded ??
        source?.quotas_added ??
        source?.samplesAdded ??
        source?.sample_added ??
        source?.sampleAdded
    ),
    remainingQuota: toNumber(
      source?.remainingQuota ?? source?.remaining_quota
    ),
    sampleAdded: toNumber(
      source?.quotasAdded ??
        source?.quotaAdded ??
        source?.samplesAdded ??
        source?.sample_added ??
        source?.sampleAdded
    ),
    addPartner:
      addPartnerRaw === false ||
      addPartnerRaw === 0 ||
      addPartnerRaw === "0" ||
      addPartnerRaw === "false"
        ? false
        : true,
  };
}

/** GET /api/projects/:id/multi-link-stats?project_url_id={projectUrlId} */
export async function getProjectMultiLinkStats(projectId, projectUrlId) {
  const normalizedId = normalizeProjectId(projectId);
  const normalizedUrlId = String(projectUrlId ?? "").trim();
  if (
    !normalizedUrlId ||
    normalizedUrlId === "undefined" ||
    normalizedUrlId === "null"
  ) {
    throw new ApiError("Project URL ID is required for multi-link stats.", null);
  }

  const params = new URLSearchParams({
    project_url_id: normalizedUrlId,
  });
  const data = await apiRequest(
    `${API_ROUTES.projects.multiLinkStats(normalizedId)}?${params.toString()}`
  );
  assertSuccess(data);
  return mapMultiLinkStats(data);
}

/** GET /api/projects/:id/multiple-url/list */
export async function listProjectMultiUrls(projectId, projectUrlId = "") {
  const normalizedId = normalizeProjectId(projectId);
  const data = await apiRequest(API_ROUTES.projects.multiUrlList(normalizedId));
  assertSuccess(data);

  let rows = mapRows(extractRows(data));
  const filterUrlId = String(projectUrlId ?? "").trim();
  if (filterUrlId) {
    rows = rows.filter(
      (row) => String(row.projectUrlId ?? "") === filterUrlId
    );
  }

  return {
    ...data,
    data: rows,
  };
}

/** POST /api/projects/:id/multiple-url */
export async function createProjectMultiUrl(projectId, form = {}) {
  const normalizedId = normalizeProjectId(projectId);
  const payload = buildCreateMultiUrlApiPayload(form);
  const data = await apiRequest(API_ROUTES.projects.createMultiUrl(normalizedId), {
    method: "POST",
    body: payload,
  });
  return assertSuccess(data);
}

/** PUT /api/projects/multiple-url/:urlId */
export async function updateProjectMultiUrl(urlId, form = {}) {
  const normalizedUrlId = normalizeMultiUrlId(urlId);
  const payload = buildCreateMultiUrlApiPayload(form);
  const data = await apiRequest(API_ROUTES.projects.updateMultiUrl(normalizedUrlId), {
    method: "PUT",
    body: payload,
  });
  return assertSuccess(data);
}

/** DELETE /api/projects/multiple-url/:urlId */
export async function deleteProjectMultiUrl(urlId) {
  const normalizedUrlId = normalizeMultiUrlId(urlId);
  const data = await apiRequest(API_ROUTES.projects.deleteMultiUrl(normalizedUrlId), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

/**
 * Upload CSV for project multi URLs.
 * POST /api/projects/:id/multiple-url/csv-upload (multipart: file + project_url_id)
 * @param {{ projectId: string|number, projectUrlId: string|number, file: File }} params
 */
export async function uploadProjectMultiUrlCsv({ projectId, projectUrlId, file }) {
  if (!file) {
    throw new ApiError("Please select a CSV file to upload.");
  }
  if (projectId == null || projectId === "") {
    throw new ApiError("Project ID is required.");
  }
  if (projectUrlId == null || projectUrlId === "") {
    throw new ApiError("Project URL ID is required. Save Project URL first.");
  }

  const name = String(file.name ?? "").toLowerCase();
  const isCsv =
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel";
  if (!isCsv) {
    throw new ApiError("Only CSV files are allowed.");
  }

  const body = new FormData();
  body.append("project_url_id", String(projectUrlId));
  body.append("file", file);

  const data = await apiRequest(
    API_ROUTES.projects.uploadMultiUrls(normalizeProjectId(projectId)),
    {
      method: "POST",
      body,
    }
  );
  return assertSuccess(data);
}

function resolveProjectUrlIdFromResponse(response) {
  const data = response?.data;
  if (!data || typeof data !== "object") return "";

  const urlInfo = data.urlInfo ?? data.url_info;
  if (Array.isArray(urlInfo) && urlInfo.length > 0) {
    return resolveProjectUrlRecordId(urlInfo[0]);
  }
  if (urlInfo && typeof urlInfo === "object") {
    return resolveProjectUrlRecordId(urlInfo);
  }

  return resolveProjectUrlRecordId(data);
}

/**
 * Resolve project id from a create-project API response.
 * @param {object} response
 */
export function resolveCreatedProjectId(response) {
  const data = response?.data;
  if (!data) return "";
  if (typeof data === "object") {
    return String(data.id ?? data.project_id ?? data.projectId ?? "").trim();
  }
  return "";
}

/**
 * After project creation, ensure a project URL exists and upload pending CSV files.
 * @param {{ projectId: string|number, createResponse?: object, files?: File[] }} params
 */
export async function uploadPendingMultiUrlCsvFiles({
  projectId,
  createResponse = null,
  files = [],
}) {
  const normalizedProjectId = String(projectId ?? "").trim();
  if (!normalizedProjectId) {
    throw new ApiError("Project ID is required.");
  }
  if (!Array.isArray(files) || files.length === 0) {
    return { uploaded: 0, projectUrlId: "" };
  }

  let projectUrlId = resolveProjectUrlIdFromResponse(createResponse);

  if (!projectUrlId) {
    const listResponse = await listProjectUrlsByProject(normalizedProjectId);
    const rows = Array.isArray(listResponse?.data) ? listResponse.data : [];
    if (rows.length > 0) {
      projectUrlId = resolveProjectUrlRecordId(rows[0]);
    }
  }

  if (!projectUrlId) {
    const urlResponse = await createProjectUrl(
      normalizedProjectId,
      createEmptyProjectUrlForm(normalizedProjectId)
    );
    projectUrlId = String(urlResponse?.data?.id ?? "").trim();
  }

  if (!projectUrlId) {
    throw new ApiError("Unable to create a Project URL for CSV upload.");
  }

  let uploaded = 0;
  for (const file of files) {
    await uploadProjectMultiUrlCsv({
      projectId: normalizedProjectId,
      projectUrlId,
      file,
    });
    uploaded += 1;
  }

  return { uploaded, projectUrlId };
}

/**
 * Download CSV template from GET /api/projects/multiple-url/csv-template.
 * Falls back to the local template string if the API fails to return a file body.
 */
export async function downloadProjectMultiUrlCsvTemplate() {
  const data = await apiRequest(API_ROUTES.projects.multiUrlCsvTemplate, {
    method: "GET",
    responseType: "text",
  });

  const text = typeof data === "string" ? data : "";
  const csvContent =
    text && text.trim()
      ? text
      : PROJECT_MULTI_URL_CSV_TEMPLATE;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "multi_url_template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return { success: true, message: "CSV template downloaded successfully." };
}
