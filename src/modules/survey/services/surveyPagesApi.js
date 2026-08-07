import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";

export const DEFAULT_SURVEY_PAGE_ID = 1;

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeSurveyPageId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid survey page id.", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractSurveyPageRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.id != null) return data;
  return null;
}

export function mapSurveyPageToForm(record) {
  return {
    completeRedirect: String(record?.complete_content ?? ""),
    terminateRedirect: String(record?.terminate_content ?? ""),
    overQuotaRedirect: String(record?.overquota_content ?? ""),
    qualityTermRedirect: String(record?.quality_term_content ?? ""),
    surveyCloseRedirect: String(record?.survey_close_content ?? ""),
  };
}

export function buildSurveyPageUpdatePayload(form) {
  return {
    complete_content: sanitizeHtml(form.completeRedirect).trim(),
    terminate_content: sanitizeHtml(form.terminateRedirect).trim(),
    overquota_content: sanitizeHtml(form.overQuotaRedirect).trim(),
    quality_term_content: sanitizeHtml(form.qualityTermRedirect).trim(),
    survey_close_content: sanitizeHtml(form.surveyCloseRedirect).trim(),
  };
}

/** GET /api/survey-pages/:id */
export async function getSurveyPage(id = DEFAULT_SURVEY_PAGE_ID) {
  const normalizedId = normalizeSurveyPageId(id);
  const data = await apiRequest(API_ROUTES.surveyPages.byId(normalizedId));
  assertSuccess(data);

  const record = extractSurveyPageRecord(data);
  if (!record) {
    throw new ApiError(data?.message ?? "Survey page not found.", data);
  }

  return record;
}

/** PUT /api/survey-pages/:id */
export async function updateSurveyPage(id, form) {
  const normalizedId = normalizeSurveyPageId(id);
  const data = await apiRequest(API_ROUTES.surveyPages.update(normalizedId), {
    method: "PUT",
    body: buildSurveyPageUpdatePayload(form),
  });

  return assertSuccess(data);
}
