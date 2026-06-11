import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

function isApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  const explicit = data.success;
  if (explicit === false || explicit === "false") return false;
  return explicit === true || explicit === "true" || explicit == null;
}

function assertSuccess(data) {
  if (!isApiSuccess(data)) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizePrescreenId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractPrescreenList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.prescreens)) return data.prescreens;
  return [];
}

function extractPrescreenRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.prescreen && typeof data.prescreen === "object") {
    return data.prescreen;
  }
  if (data.id != null) return data;
  return null;
}

function normalizeOptionValue(option) {
  if (option == null) return "";
  if (typeof option === "string") return option.trim();
  if (typeof option === "object") {
    return String(option.mappedOption ?? option.optionText ?? option.option ?? "").trim();
  }
  return String(option).trim();
}

function resolveOptions(payload) {
  if (Array.isArray(payload.options)) {
    return payload.options.map(normalizeOptionValue).filter(Boolean);
  }
  return [];
}

function buildPrescreenBody(payload, { includeStatus = true } = {}) {
  const body = {
    language: String(payload.language ?? "").trim(),
    question_title: String(
      payload.questionnaireTitle ?? payload.questionTitle ?? payload.title ?? ""
    ).trim(),
    options: resolveOptions(payload),
    right_answer: String(payload.rightAnswer ?? payload.right_answer ?? "").trim(),
  };

  if (includeStatus) {
    body.status = formValueToApiStatus(payload.status ?? "Active");
  }

  return body;
}

/**
 * @param {object} record
 */
export function mapPrescreenToForm(record) {
  const optionRows = Array.isArray(record?.options) ? record.options : [];
  const mappedLines = optionRows
    .map((opt) => normalizeOptionValue(opt))
    .filter(Boolean);

  return {
    language: record?.language ?? "",
    questionTitle:
      record?.question_title ?? record?.questionnaireTitle ?? record?.title ?? "",
    mappedOptions: mappedLines.join("\n"),
    rightAnswer: record?.right_answer ?? record?.rightAnswer ?? "",
    status: apiStatusToFormValue(record?.status),
  };
}

/**
 * @param {object} record
 */
export function mapPrescreenQuestionnaireToRow(record) {
  const createdRaw = record?.created_at ?? record?.createdAt ?? "";

  return {
    id: record?.id,
    title:
      record?.question_title ??
      record?.questionnaireTitle ??
      record?.title ??
      "",
    language: record?.language ?? "",
    rightAnswer: record?.right_answer ?? record?.rightAnswer ?? "",
    status: apiStatusToFormValue(record?.status),
    options: Array.isArray(record?.options) ? record.options : [],
    createdAt: createdRaw,
    createdDate: createdRaw,
  };
}

/** GET /api/prescreen/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.prescreen.list, { page, limit, search })
  );
  assertSuccess(data);

  const prescreens = extractPrescreenList(data);
  const total = extractListTotalFromResponse(data, prescreens.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? 1,
    limit: data.limit ?? prescreens.length,
    totalPages: data.totalPages ?? 1,
    items: prescreens.map((record) => mapPrescreenQuestionnaireToRow(record)),
  };
}

function hasPrescreenOptions(record) {
  if (!Array.isArray(record?.options)) return false;
  return record.options.some((option) => Boolean(normalizeOptionValue(option)));
}

/** Merges options/right_answer from the language list when detail/list omits them. */
async function enrichPrescreenRecord(record, id) {
  if (!record || hasPrescreenOptions(record)) return record;

  const language = String(record.language ?? "").trim();
  if (!language) return record;

  try {
    const byLanguage = await getPrescreensByLanguage(language);
    const match = byLanguage.find((item) => String(item.id) === String(id));
    if (!match) return record;

    return {
      ...record,
      question_title:
        record.question_title ?? match.question_title ?? match.title ?? "",
      right_answer: record.right_answer ?? match.right_answer ?? match.rightAnswer ?? "",
      options: hasPrescreenOptions(match) ? match.options : record.options,
    };
  } catch {
    return record;
  }
}

/** GET /api/prescreen/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizePrescreenId(id);

  try {
    const data = await apiRequest(API_ROUTES.prescreen.byId(normalizedId));
    assertSuccess(data);
    const record = extractPrescreenRecord(data);
    if (record) return enrichPrescreenRecord(record, id);
  } catch {
    // Fall back to list lookup below.
  }

  const data = await apiRequest(API_ROUTES.prescreen.list);
  assertSuccess(data);

  const prescreens = extractPrescreenList(data);
  const match = prescreens.find((record) => String(record.id) === String(id));
  if (!match) {
    throw new ApiError("Prescreen not found", null);
  }

  return enrichPrescreenRecord(match, id);
}

/**
 * @param {object} record
 */
export function mapPrescreenLanguageQuestion(record) {
  const options = Array.isArray(record?.options)
    ? record.options.map(normalizeOptionValue).filter(Boolean)
    : [];

  return {
    id: record?.id,
    questionTitle: record?.question_title ?? record?.questionnaireTitle ?? record?.title ?? "",
    rightAnswer: record?.right_answer ?? record?.rightAnswer ?? "",
    options,
  };
}

/** GET /api/prescreen/language/:language */
export async function getPrescreensByLanguage(language) {
  const normalizedLanguage = String(language ?? "").trim();
  if (!normalizedLanguage) return [];

  const data = await apiRequest(API_ROUTES.prescreen.byLanguage(normalizedLanguage));
  assertSuccess(data);

  return extractPrescreenList(data);
}

/**
 * Questionnaire options for Survey Group selection, filtered by language.
 * Skips the API call when question language does not match survey language.
 * @param {string} language Prescreen question language to fetch
 * @param {string} [surveyLanguage] Survey group language — must match to call the API
 */
export async function getQuestionnaireOptionsForLanguage(language, surveyLanguage) {
  const questionLanguage = String(language ?? "").trim();
  if (!questionLanguage) return [];

  const normalizedSurveyLanguage = String(surveyLanguage ?? questionLanguage).trim();
  if (normalizedSurveyLanguage !== questionLanguage) {
    return [];
  }

  const records = await getPrescreensByLanguage(questionLanguage);

  return records
    .map((record) => mapPrescreenLanguageQuestion(record))
    .filter((record) => record.id != null && record.questionTitle)
    .map((record) => ({
      value: String(record.id),
      label: record.questionTitle,
    }));
}

/**
 * Questionnaire titles for Survey Group selection, filtered by language.
 * Skips the API call when question language does not match survey language.
 * @param {string} language Prescreen question language to fetch
 * @param {string} [surveyLanguage] Survey group language — must match to call the API
 */
export async function getQuestionnaireTitlesForLanguage(language, surveyLanguage) {
  const options = await getQuestionnaireOptionsForLanguage(language, surveyLanguage);
  return options.map((option) => option.label);
}

/**
 * POST /api/prescreen/add
 * @param {{
 *   language: string,
 *   questionnaireTitle?: string,
 *   questionTitle?: string,
 *   rightAnswer: string,
 *   status?: string,
 *   options?: Array<string | { optionText?: string, mappedOption?: string }>,
 * }} payload
 */
export async function createPrescreen(payload) {
  const data = await apiRequest(API_ROUTES.prescreen.create, {
    method: "POST",
    body: buildPrescreenBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen/:id
 * @param {string|number} id
 * @param {Parameters<typeof createPrescreen>[0]} payload
 */
export async function updatePrescreen(id, payload) {
  const normalizedId = normalizePrescreenId(id);
  const data = await apiRequest(API_ROUTES.prescreen.update(normalizedId), {
    method: "PUT",
    body: buildPrescreenBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen/:id — status toggle from listing table only.
 * @param {string|number} id
 * @param {{
 *   title?: string,
 *   language?: string,
 *   rightAnswer?: string,
 *   options?: Array<string | object>,
 *   status: string,
 * }} payload
 */
export async function updatePrescreenStatus(id, payload) {
  const normalizedId = normalizePrescreenId(id);
  const data = await apiRequest(API_ROUTES.prescreen.update(normalizedId), {
    method: "PUT",
    body: buildPrescreenBody(
      {
        language: payload.language,
        questionTitle: payload.title,
        rightAnswer: payload.rightAnswer,
        options: payload.options,
        status: payload.status,
      },
      { includeStatus: true }
    ),
  });

  return assertSuccess(data);
}

/**
 * @param {Parameters<typeof createPrescreen>[0] & { id?: string|number }} payload
 */
export async function saveRecord(payload) {
  if (payload.id != null && String(payload.id).trim()) {
    return updatePrescreen(payload.id, payload);
  }
  return createPrescreen(payload);
}

/** DELETE /api/prescreen/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizePrescreenId(id);
  const data = await apiRequest(API_ROUTES.prescreen.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}
