/**
 * Project Multi URL API layer (project_multiple_Url).
 * Upload: project_id + project_url_id + CSV file.
 */
import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { delay } from "../data/mockSurveyStore";
import {
  createMockMultiUrlsFromLiveLinks,
  listMockMultiUrlsByProject,
  parseLiveLinksFromCsvText,
  PROJECT_MULTI_URL_COLUMNS,
  PROJECT_MULTI_URL_CSV_TEMPLATE,
} from "../data/mockProjectMultiUrlData";

export { PROJECT_MULTI_URL_COLUMNS, PROJECT_MULTI_URL_CSV_TEMPLATE };

/** Prefer mock until the multi-url endpoints are live. */
const USE_PROJECT_MULTI_URL_MOCK = true;

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractRows(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.multipleUrls)) return data.multipleUrls;
  return [];
}

/** GET multi URL rows for a project (optional project URL filter). */
export async function listProjectMultiUrls(projectId, projectUrlId = "") {
  if (USE_PROJECT_MULTI_URL_MOCK) {
    await delay();
    return {
      success: true,
      data: listMockMultiUrlsByProject(projectId, projectUrlId),
    };
  }

  const query = new URLSearchParams();
  if (projectUrlId) query.set("project_url_id", String(projectUrlId));
  const qs = query.toString();
  const path = `${API_ROUTES.projects.multiUrls(projectId)}${qs ? `?${qs}` : ""}`;
  const data = await apiRequest(path);
  assertSuccess(data);
  return {
    ...data,
    data: extractRows(data),
  };
}

/**
 * Upload CSV for project multi URLs.
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

  if (USE_PROJECT_MULTI_URL_MOCK) {
    await delay(350);
    const text = await file.text();
    const liveLinks = parseLiveLinksFromCsvText(text);
    if (liveLinks.length === 0) {
      throw new ApiError("No Live_Link rows found in the CSV.");
    }
    const created = createMockMultiUrlsFromLiveLinks({
      projectId,
      projectUrlId,
      liveLinks,
    });
    return {
      success: true,
      message: `Uploaded ${created.length} multi URL record(s) successfully.`,
      data: created,
    };
  }

  const body = new FormData();
  body.append("project_id", String(projectId));
  body.append("project_url_id", String(projectUrlId));
  body.append("file", file);

  const data = await apiRequest(API_ROUTES.projects.uploadMultiUrls(projectId), {
    method: "POST",
    body,
  });
  return assertSuccess(data);
}

/** Download the required CSV template for multi URL upload. */
export function downloadProjectMultiUrlCsvTemplate() {
  const blob = new Blob([PROJECT_MULTI_URL_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "project_multi_url_template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
