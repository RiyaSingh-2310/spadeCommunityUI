import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";

function assertSuccess(data) {
  if (data?.success !== true && data?.success !== "true") {
    throw new ApiError(data?.message ?? "Unable to load survey settings.", data);
  }
  return data;
}

function extractSurveySettingsList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function mapSurveySettingsListItem(record) {
  if (!record || typeof record !== "object") return null;

  const language = String(record.language ?? "").trim();
  if (!language) return null;

  return {
    id: record.id ?? null,
    language,
    createdAt: record.createdAt ?? record.created_at ?? "",
    updatedAt: record.updatedAt ?? record.updated_at ?? "",
  };
}

export function mapSurveySettingsToLanguageOptions(items) {
  const seen = new Set();
  const options = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    const language = String(item?.language ?? "").trim();
    if (!language) return;
    const key = language.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      value: language,
      label: language,
    });
  });

  return options;
}

export function resolveSurveySettingsId(language, items) {
  const wanted = String(language ?? "").trim().toLowerCase();
  if (!wanted || !Array.isArray(items)) return "";

  const match = items.find(
    (item) => String(item?.language ?? "").trim().toLowerCase() === wanted
  );
  const id = match?.id;
  if (id == null || String(id).trim() === "") return "";
  return String(id).trim();
}

function normalizeRedirectContent(value) {
  return String(value ?? "").trim();
}

/**
 * PUT /api/survey-settings/:id body.
 * Matches:
 * complete_redirect_content, terminate_redirect_content,
 * quality_term_redirect_content, survey_close_redirect_content
 * (plus over_quota_redirect_content from the Survey Settings form).
 */
export function buildSurveySettingsUpdatePayload(form = {}) {
  return {
    complete_redirect_content: normalizeRedirectContent(form.completeRedirect),
    terminate_redirect_content: normalizeRedirectContent(form.terminateRedirect),
    over_quota_redirect_content: normalizeRedirectContent(form.overQuotaRedirect),
    quality_term_redirect_content: normalizeRedirectContent(form.qualityTermRedirect),
    survey_close_redirect_content: normalizeRedirectContent(form.surveyCloseRedirect),
  };
}

function normalizeSurveySettingsId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Survey setting id is required.", null);
  }
  return encodeURIComponent(normalizedId);
}

/** GET /api/survey-settings/list?page=&limit= */
export async function listSurveySettings({ page = 1, limit = 10 } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.surveySettings.list, { page, limit })
  );
  assertSuccess(data);

  const records = extractSurveySettingsList(data)
    .map((record) => mapSurveySettingsListItem(record))
    .filter(Boolean);
  const total = extractListTotalFromResponse(data, records.length);
  const safeLimit = Number(data.limit) || Number(limit) || 10;
  const apiTotalPages = Number(data.totalPages);

  return {
    items: records,
    total,
    page: Number(data.page) || page,
    limit: safeLimit,
    totalPages:
      Number.isFinite(apiTotalPages) && apiTotalPages > 0
        ? apiTotalPages
        : Math.max(1, Math.ceil(total / safeLimit) || 1),
  };
}

/** Loads every survey-settings language row across API pages. */
export async function listAllSurveySettings() {
  const items = [];
  const seenIds = new Set();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listSurveySettings({ page, limit: 10 });
    (response.items ?? []).forEach((item) => {
      const id = item?.id != null ? String(item.id) : "";
      if (id) {
        if (seenIds.has(id)) return;
        seenIds.add(id);
      }
      items.push(item);
    });
    totalPages = Math.max(1, Number(response.totalPages) || 1);
    page += 1;
  } while (page <= totalPages && page <= 50);

  return items;
}

/** PUT /api/survey-settings/:id */
export async function updateSurveySettings(id, form) {
  const normalizedId = normalizeSurveySettingsId(id);
  const data = await apiRequest(API_ROUTES.surveySettings.update(normalizedId), {
    method: "PUT",
    body: buildSurveySettingsUpdatePayload(form),
  });

  return assertSuccess(data);
}
