import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { formatLocaleDateTime } from "../../modules/shared/utils/dateTime";

const UI_TO_API_QUESTION_TYPE = {
  "Text Box": "textbox",
  "Text Area": "textarea",
  Checkbox: "checkbox",
  Dropdown: "dropdown",
  "Radio Button": "radio",
};

const API_TO_UI_QUESTION_TYPE = {
  textbox: "Text Box",
  textarea: "Text Area",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  radio: "Radio Button",
};

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
  if (typeof payload.options === "string") {
    return payload.options
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (typeof payload.mappedOptions === "string") {
    return payload.mappedOptions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

export function uiToApiQuestionType(value) {
  const label = String(value ?? "").trim();
  if (UI_TO_API_QUESTION_TYPE[label]) return UI_TO_API_QUESTION_TYPE[label];
  const normalized = label.toLowerCase().replace(/\s+/g, "");
  if (API_TO_UI_QUESTION_TYPE[normalized]) return normalized;
  return normalized || "textbox";
}

export function apiToUiQuestionType(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return API_TO_UI_QUESTION_TYPE[key] ?? value ?? "";
}

function buildPrescreenBody(payload, { includeStatus = true } = {}) {
  const rightAnswerRaw = payload.rightAnswer ?? payload.right_answer ?? "";
  const rightAnswerTrimmed = String(rightAnswerRaw ?? "").trim();

  const body = {
    language: String(payload.language ?? "").trim(),
    question_title: String(
      payload.questionnaireTitle ?? payload.questionTitle ?? payload.title ?? ""
    ).trim(),
    question_type: uiToApiQuestionType(
      payload.questionType ?? payload.question_type ?? "textbox"
    ),
    options: resolveOptions(payload),
    right_answer: rightAnswerTrimmed || null,
    sort_order: Number(payload.sortOrder ?? payload.sort_order ?? 0) || 0,
  };

  if (includeStatus) {
    body.status = formValueToApiStatus(payload.status ?? "Active");
  }

  return body;
}

function appendPrescreenListQuery(basePath, { page, limit, search, status = "", language = "" } = {}) {
  return appendListQuery(basePath, {
    page,
    limit,
    search,
    alwaysIncludeEmpty: ["search", "status", "language"],
    extra: {
      status: String(status ?? ""),
      language: String(language ?? ""),
    },
  });
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
    questionType: apiToUiQuestionType(record?.question_type ?? record?.questionType),
    mappedOptions: mappedLines.join("\n"),
    options: mappedLines.join("\n"),
    rightAnswer:
      record?.right_answer != null
        ? String(record.right_answer)
        : record?.rightAnswer != null
          ? String(record.rightAnswer)
          : "",
    sortOrder: String(record?.sort_order ?? record?.sortOrder ?? 0),
    status: apiStatusToFormValue(record?.status),
  };
}

/**
 * @param {object} record
 */
export function mapPrescreenQuestionnaireToRow(record) {
  const createdRaw = record?.created_at ?? record?.createdAt ?? "";
  const sortOrder = Number(record?.sort_order ?? record?.sortOrder ?? 0) || 0;
  const title =
    record?.question_title ?? record?.questionnaireTitle ?? record?.title ?? "";

  return {
    id: record?.id,
    title,
    questionTitle: title,
    language: record?.language ?? "",
    questionType: apiToUiQuestionType(record?.question_type ?? record?.questionType),
    sortOrder: String(sortOrder),
    rightAnswer:
      record?.right_answer != null
        ? String(record.right_answer)
        : record?.rightAnswer != null
          ? String(record.rightAnswer)
          : "",
    status: apiStatusToFormValue(record?.status),
    options: Array.isArray(record?.options) ? record.options : [],
    createdAt: createdRaw,
    createdDate: formatLocaleDateTime(createdRaw),
  };
}

/** Adapter for listing hooks — sends the query keys this API expects. */
export function listPrescreenRecords({ page, limit, search } = {}) {
  return getRecords({
    page,
    limit,
    search: normalizeSearchQuery(search),
    status: "",
    language: "",
  });
}

/** GET /api/prescreen/list */
export async function getRecords({ page, limit, search, status = "", language = "" } = {}) {
  const data = await apiRequest(
    appendPrescreenListQuery(API_ROUTES.prescreen.list, {
      page,
      limit,
      search,
      status,
      language,
    })
  );
  assertSuccess(data);

  const prescreens = extractPrescreenList(data);
  const total = extractListTotalFromResponse(data, prescreens.length);

  const items = prescreens.map((record) => mapPrescreenQuestionnaireToRow(record));

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? 1,
    limit: data.limit ?? prescreens.length,
    totalPages: data.totalPages ?? 1,
    items,
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

  const data = await apiRequest(
    appendPrescreenListQuery(API_ROUTES.prescreen.list, { page: 1, limit: 500 })
  );
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
    rightAnswer:
      record?.right_answer != null
        ? String(record.right_answer)
        : record?.rightAnswer != null
          ? String(record.rightAnswer)
          : "",
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
 * @param {string} language Prescreen question language to fetch
 * @param {string} [surveyLanguage] Survey group language — must match to call the API
 */
export async function getQuestionnaireTitlesForLanguage(language, surveyLanguage) {
  const options = await getQuestionnaireOptionsForLanguage(language, surveyLanguage);
  return options.map((option) => option.label);
}

/**
 * POST /api/prescreen/add
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
 * PATCH /api/prescreen/:id/status — status toggle from listing tables.
 */
export async function updatePrescreenStatus(id, status) {
  const normalizedId = normalizePrescreenId(id);
  const data = await apiRequest(API_ROUTES.prescreen.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen/sort-order
 * @param {Array<{ id: string|number, sort_order?: number, sortOrder?: number }>} items
 */
export async function updatePrescreenSortOrder(items) {
  const data = await apiRequest(API_ROUTES.prescreen.sortOrder, {
    method: "PUT",
    body: {
      items: (items ?? []).map((item, index) => ({
        id: item.id,
        sort_order: Number(item.sort_order ?? item.sortOrder ?? index) || index,
      })),
    },
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
