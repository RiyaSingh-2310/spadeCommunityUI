import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse, safeMapListItems } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { apiRequest } from "../api/client";
import { downloadCsvExport } from "../api/csvExport";
import { ApiError } from "../api/ApiError";
import { formatLocaleDateTime } from "../../modules/shared/utils/dateTime";

function isApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  const explicit = data.success;
  if (explicit === false || explicit === "false") return false;
  return explicit === true || explicit === "true" || explicit == null;
}

function getApiFailureMessage(data) {
  const message = String(data?.message ?? "").trim();
  const detail = String(data?.error ?? "").trim();

  if (message && detail && detail !== message) {
    return `${message} (${detail})`;
  }

  return message || detail || "Request failed";
}

function assertSuccess(data, status = 0) {
  if (!isApiSuccess(data)) {
    throw new ApiError(getApiFailureMessage(data), data, status);
  }
  return data;
}

function normalizeQuestionnaireGroupId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function normalizeQuestionnaireGroupLanguage(language) {
  return String(language ?? "").trim().toLowerCase();
}

function formatQuestionnaireGroupLanguageForUi(language) {
  const slug = normalizeQuestionnaireGroupLanguage(language);
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function extractQuestionnaireGroupList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function extractQuestionnaireGroupRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return null;
}

function normalizeQuestionLibraryIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function resolveQuestionLibraryIds(payload) {
  if (Array.isArray(payload.questionIds)) {
    return normalizeQuestionLibraryIds(payload.questionIds);
  }

  if (Array.isArray(payload.questionLibraryIds)) {
    return normalizeQuestionLibraryIds(payload.questionLibraryIds);
  }

  if (Array.isArray(payload.prescreenIds)) {
    return normalizeQuestionLibraryIds(payload.prescreenIds);
  }

  const single = payload.selectedPrescreenId ?? payload.selectedQuestionnaire;
  if (single == null || String(single).trim() === "") return [];

  const parsed = Number(single);
  return Number.isFinite(parsed) ? [parsed] : [];
}

function resolveGroupTitle(payload) {
  return String(
    payload.groupTitle ?? payload.surveyTitle ?? payload.survey_title ?? payload.group_title ?? ""
  ).trim();
}

function buildQuestionnaireGroupCreateBody(payload) {
  return {
    surveyTitle: resolveGroupTitle(payload),
    language: normalizeQuestionnaireGroupLanguage(payload.language),
    status: formValueToApiStatus(payload.status),
    questionIds: resolveQuestionLibraryIds(payload),
  };
}

/** PUT /api/questionnaire-group/:id — surveyTitle + questionIds (+ optional language). */
function buildQuestionnaireGroupUpdateBody(payload) {
  const body = {
    surveyTitle: resolveGroupTitle(payload),
    questionIds: resolveQuestionLibraryIds(payload),
  };

  if (payload.language != null && String(payload.language).trim()) {
    body.language = normalizeQuestionnaireGroupLanguage(payload.language);
  }

  return body;
}

function getQuestionItemsFromRecord(record) {
  if (!Array.isArray(record?.questions)) return [];
  return record.questions.filter((item) => item != null);
}

function extractQuestionLibraryIdsFromRecord(record) {
  if (Array.isArray(record?.questionIds)) {
    return normalizeQuestionLibraryIds(record.questionIds);
  }

  if (Array.isArray(record?.question_library_ids)) {
    return normalizeQuestionLibraryIds(record.question_library_ids);
  }

  if (Array.isArray(record?.questionLibraryIds)) {
    return normalizeQuestionLibraryIds(record.questionLibraryIds);
  }

  const questionItems = getQuestionItemsFromRecord(record);
  if (questionItems.length) {
    return questionItems
      .map((item) => item?.id)
      .filter((item) => item != null)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  return [];
}

function resolveGroupTitleFromRecord(record) {
  return String(
    record?.surveyTitle ?? record?.group_title ?? record?.survey_title ?? record?.groupTitle ?? ""
  ).trim();
}

function getQuestionnaireGroupPublicUrlBase() {
  const explicit = import.meta.env.VITE_QUESTIONNAIRE_GROUP_URL_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/public/questionnaire`;
  }

  return "/public/questionnaire";
}

function normalizePanelistId(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function extractPanelistIdFromUrl(urlString) {
  const raw = String(urlString ?? "").trim();
  if (!raw) return null;

  try {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const url = new URL(raw, base);
    return normalizePanelistId(
      url.searchParams.get("panelist_id") ?? url.searchParams.get("panelistId")
    );
  } catch {
    return null;
  }
}

function resolvePanelistIdForWebsiteUrl(record, fromApiUrl) {
  return (
    normalizePanelistId(record?.panelist_id ?? record?.panelistId) ??
    extractPanelistIdFromUrl(fromApiUrl) ??
    normalizePanelistId(import.meta.env.VITE_QUESTIONNAIRE_GROUP_PANELIST_ID)
  );
}

/**
 * Canonical public questionnaire URL:
 * /public/questionnaire/{questionnaireGroupId}?panelist_id={panelistId}
 */
export function buildPublicQuestionnaireUrl(groupId, panelistId) {
  const normalizedGroupId = String(groupId ?? "").trim();
  if (
    !normalizedGroupId ||
    normalizedGroupId === "undefined" ||
    normalizedGroupId === "null"
  ) {
    return "";
  }

  const base = getQuestionnaireGroupPublicUrlBase();
  if (!base) return "";

  const url = `${base}/${encodeURIComponent(normalizedGroupId)}`;
  const normalizedPanelistId = normalizePanelistId(panelistId);
  if (normalizedPanelistId == null) return url;

  return `${url}?panelist_id=${encodeURIComponent(String(normalizedPanelistId))}`;
}

function resolveQuestionnaireGroupWebsiteUrl(record) {
  const groupId = record?.id;
  if (groupId == null || String(groupId).trim() === "") return "";

  const fromApi = [
    record?.websiteUrl,
    record?.website_url,
    record?.url,
    record?.groupUrl,
    record?.group_url,
    record?.questionnaireUrl,
    record?.questionnaire_url,
    record?.previewUrl,
    record?.preview_url,
  ]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);

  const panelistId = resolvePanelistIdForWebsiteUrl(record, fromApi);

  // Always build the canonical local public URL:
  // /public/questionnaire/{id}?panelist_id={panelistId}
  // Never trust a stored API URL path alone (may point at an old host or omit panelist_id).
  return buildPublicQuestionnaireUrl(groupId, panelistId);
}

function normalizeGroupQuestionOptions(options) {
  if (options == null || options === "") return [];

  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];
    try {
      return normalizeGroupQuestionOptions(JSON.parse(trimmed));
    } catch {
      return trimmed
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (option == null) return "";
      if (typeof option === "string") return option.trim();
      if (typeof option === "object") {
        return String(option.option_text ?? option.optionText ?? option.value ?? "").trim();
      }
      return String(option).trim();
    })
    .filter(Boolean);
}

function mapGroupQuestionItem(item) {
  if (!item || item.id == null) return null;

  const numericId = Number(item.id);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;

  return {
    id: numericId,
    questionTitle: String(
      item.question_title ?? item.questionTitle ?? item.title ?? ""
    ).trim(),
    questionType: String(item.question_type ?? item.questionType ?? "").trim(),
    rightAnswer: item.right_answer ?? item.rightAnswer ?? "",
    options: normalizeGroupQuestionOptions(item.options),
  };
}

/**
 * Prefer GET /api/questionnaire-group/:id `questionIds` order; fall back to `questions`.
 * Handles empty arrays and questions with options: null / [].
 */
function mapGroupQuestionsFromRecord(record) {
  const questionItems = getQuestionItemsFromRecord(record);
  const byId = new Map();

  questionItems.forEach((item) => {
    const numericId = Number(item?.id);
    if (!Number.isFinite(numericId) || numericId <= 0) return;
    byId.set(numericId, item);
  });

  const orderedIds = extractQuestionLibraryIdsFromRecord(record);
  if (orderedIds.length > 0) {
    return orderedIds
      .map((id) => {
        const item = byId.get(id);
        if (item) return mapGroupQuestionItem(item);
        return {
          id,
          questionTitle: "",
          questionType: "",
          rightAnswer: "",
          options: [],
        };
      })
      .filter(Boolean);
  }

  return questionItems.map((item) => mapGroupQuestionItem(item)).filter(Boolean);
}

export function mapPrescreenGroupToDetail(record) {
  const createdRaw = record?.createdAt ?? record?.created_at ?? "";
  const updatedRaw = record?.updatedAt ?? record?.updated_at ?? "";
  const groupTitle = resolveGroupTitleFromRecord(record);
  const questionIds = extractQuestionLibraryIdsFromRecord(record);
  const questions = mapGroupQuestionsFromRecord(record);

  return {
    id: record?.id,
    title: groupTitle,
    surveyTitle: groupTitle,
    language: formatQuestionnaireGroupLanguageForUi(record?.language),
    status: apiStatusToFormValue(record?.status),
    websiteUrl: resolveQuestionnaireGroupWebsiteUrl(record),
    questionIds,
    prescreenIds: questionIds,
    questions,
    createdAt: createdRaw,
    createdDate: formatLocaleDateTime(createdRaw),
    updatedAt: updatedRaw,
    updatedDate: formatLocaleDateTime(updatedRaw),
    deletedAt: record?.deleted_at ?? record?.deletedAt ?? null,
  };
}

export function mapPrescreenGroupToRow(record) {
  const createdRaw = record?.createdAt ?? record?.created_at ?? "";
  const questionLibraryIds = extractQuestionLibraryIdsFromRecord(record);
  const groupTitle = resolveGroupTitleFromRecord(record);

  return {
    id: record?.id,
    title: groupTitle,
    surveyTitle: groupTitle,
    language: formatQuestionnaireGroupLanguageForUi(record?.language),
    status: apiStatusToFormValue(record?.status),
    websiteUrl: resolveQuestionnaireGroupWebsiteUrl(record),
    prescreenIds: questionLibraryIds,
    createdAt: createdRaw,
    createdDate: formatLocaleDateTime(createdRaw),
  };
}

export function mapPrescreenGroupToForm(record) {
  const questionLibraryIds = extractQuestionLibraryIdsFromRecord(record);
  const questions = mapGroupQuestionsFromRecord(record);
  const selectedQuestion =
    questions.find((item) => String(item?.id) === String(questionLibraryIds[0])) ??
    questions[0];
  const selectedQuestionnaireLabel = String(
    selectedQuestion?.questionTitle ?? record?.selected_question_title ?? ""
  ).trim();
  const groupTitle = resolveGroupTitleFromRecord(record);

  return {
    surveyTitle: groupTitle,
    language: formatQuestionnaireGroupLanguageForUi(record?.language),
    status: apiStatusToFormValue(record?.status),
    selectedPrescreenId: questionLibraryIds[0] != null ? String(questionLibraryIds[0]) : "",
    selectedQuestionnaireLabel,
    prescreenIds: questionLibraryIds.map(String),
    linkedQuestions: questions.map((item) => ({
      id: String(item.id),
      questionTitle: item.questionTitle || `Question #${item.id}`,
    })),
  };
}

/** GET /api/questionnaire-group/list */
export async function getRecords({ page = 1, limit = 10, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.questionnaireGroup.list, { page, limit, search })
  );
  assertSuccess(data);

  const groups = extractQuestionnaireGroupList(data);
  const total = extractListTotalFromResponse(data, groups.length);
  const safeLimit = Number(limit) || 10;
  const items = safeMapListItems(groups, (record) => mapPrescreenGroupToRow(record));

  return {
    ...data,
    items,
    total,
    count: total,
    page: Number(data.page) || page,
    limit: Number(data.limit) || safeLimit,
    totalPages:
      Number(data.totalPages) || Math.max(1, Math.ceil(total / safeLimit) || 1),
  };
}

/**
 * GET /api/questionnaire-group/:id
 * Expects: { success, data: { id, surveyTitle, language, website_url, status,
 *   createdAt, updatedAt, questionIds, questions } }
 */
export async function getRecord(id) {
  const normalizedId = normalizeQuestionnaireGroupId(id);
  const data = await apiRequest(API_ROUTES.questionnaireGroup.byId(normalizedId));
  assertSuccess(data);

  const record = extractQuestionnaireGroupRecord(data);
  if (!record || record.id == null) {
    throw new ApiError("Questionnaire group not found", null);
  }

  return record;
}

/** GET /api/questionnaire-group/:id — normalized detail for edit/view screens. */
export async function getRecordDetail(id) {
  const record = await getRecord(id);
  return mapPrescreenGroupToDetail(record);
}

/** GET /api/questionnaire-group/:id — mapped for the add/edit form. */
export async function getRecordForForm(id) {
  const record = await getRecord(id);
  return mapPrescreenGroupToForm(record);
}

/** POST /api/questionnaire-group/add */
export async function createPrescreenGroup(payload) {
  const data = await apiRequest(API_ROUTES.questionnaireGroup.create, {
    method: "POST",
    body: buildQuestionnaireGroupCreateBody(payload),
  });

  const result = assertSuccess(data);
  const record = extractQuestionnaireGroupRecord(result);
  const websiteUrl = record ? resolveQuestionnaireGroupWebsiteUrl(record) : "";

  return {
    ...result,
    websiteUrl,
    data: record
      ? {
          ...record,
          websiteUrl,
          website_url: record.website_url ?? websiteUrl,
        }
      : result.data,
  };
}

/** PUT /api/questionnaire-group/:id */
export async function updatePrescreenGroup(id, payload) {
  const normalizedId = normalizeQuestionnaireGroupId(id);
  const data = await apiRequest(API_ROUTES.questionnaireGroup.update(normalizedId), {
    method: "PUT",
    body: buildQuestionnaireGroupUpdateBody(payload),
  });

  return assertSuccess(data);
}

/** PATCH /api/questionnaire-group/:id/status */
export async function updatePrescreenGroupStatus(id, status) {
  const normalizedId = normalizeQuestionnaireGroupId(id);
  const data = await apiRequest(API_ROUTES.questionnaireGroup.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/** DELETE /api/questionnaire-group/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizeQuestionnaireGroupId(id);
  const data = await apiRequest(API_ROUTES.questionnaireGroup.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

/** GET /api/questionnaire-group/export/csv */
export async function exportQuestionnaireGroupCsv() {
  return downloadCsvExport(API_ROUTES.questionnaireGroup.exportCsv, {
    defaultFilename: "questionnaire-groups.csv",
  });
}
