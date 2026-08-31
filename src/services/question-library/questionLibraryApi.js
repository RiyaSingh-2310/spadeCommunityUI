import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse, safeMapListItems } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";
import { apiRequest } from "../api/client";
import { buildDatedExportFilename, downloadCsvExport } from "../api/csvExport";
import { ApiError } from "../api/ApiError";
import { formatLocaleDateTime } from "../../modules/shared/utils/dateTime";
import { toUiSentenceCase } from "../../modules/shared/utils/uiText";

const UI_TO_API_QUESTION_TYPE = {
  "Text Box": "textbox",
  "Text Area": "textarea",
  Checkbox: "checkbox",
  Dropdown: "dropdown",
  "Radio Button": "radio",
  Number: "number",
  Date: "date",
  Time: "time",
  "Date Time": "datetime",
  "Date-Time": "datetime",
  "Single Line Text": "textbox",
  "Multi Line Text": "textarea",
};

const API_TO_UI_QUESTION_TYPE = {
  textbox: "Text Box",
  textarea: "Text Area",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  radio: "Radio Button",
  number: "Number",
  date: "Date",
  time: "Time",
  datetime: "Date-Time",
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

function normalizeQuestionLibraryLanguageSlug(language) {
  return String(language ?? "").trim().toLowerCase();
}

function normalizeQuestionId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractQuestionList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function extractQuestionRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return null;
}

function normalizeOptionValue(option) {
  if (option == null) return "";
  if (typeof option === "string") return option.trim();
  if (typeof option === "object") {
    return String(option.option_text ?? option.optionText ?? option.value ?? "").trim();
  }
  return String(option).trim();
}

function mapOptionsToFormItems(options) {
  if (typeof options === "string") {
    return options
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ label: line, value: line }));
  }

  if (!Array.isArray(options)) return [];

  return options
    .map((opt) => {
      if (opt == null) return null;
      if (typeof opt === "string") {
        const trimmed = opt.trim();
        return trimmed ? { label: trimmed, value: trimmed } : null;
      }
      if (typeof opt === "object") {
        const label = String(opt.option_text ?? opt.optionText ?? opt.label ?? "").trim();
        const value = String(opt.value ?? label).trim();
        if (!label && !value) return null;
        return { label: label || value, value: value || label };
      }
      return null;
    })
    .filter(Boolean);
}

function resolveOptionsAsStrings(payload) {
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

function buildQuestionLibraryCreateBody(payload) {
  const rightAnswerRaw = payload.rightAnswer ?? payload.right_answer ?? "";
  const rightAnswerTrimmed = String(rightAnswerRaw ?? "").trim();
  const questionType = uiToApiQuestionType(
    payload.questionType ?? payload.question_type ?? "textbox"
  );
  const options = resolveOptionsAsStrings(payload);

  const body = {
    language: normalizeQuestionLibraryLanguageSlug(payload.language),
    question_title: String(
      payload.questionnaireTitle ?? payload.questionTitle ?? payload.title ?? ""
    ).trim(),
    question_type: questionType,
    status: formValueToApiStatus(payload.status ?? "Active"),
    sort_order: Number(payload.sortOrder ?? payload.sort_order ?? 0) || 0,
  };

  // Backend validates: options.optional().isArray({ min: 1 })
  // So omit options entirely when empty (e.g. textbox/date/datetime).
  if (options.length > 0) {
    body.options = options;
  }

  if (rightAnswerTrimmed) {
    body.right_answer = rightAnswerTrimmed;
  }

  return body;
}

function buildQuestionLibraryUpdateBody(payload) {
  const rightAnswerRaw = payload.rightAnswer ?? payload.right_answer ?? "";
  const rightAnswerTrimmed = String(rightAnswerRaw ?? "").trim();
  const questionType = payload.questionType ?? payload.question_type;
  const options = resolveOptionsAsStrings(payload);

  const body = {
    language: normalizeQuestionLibraryLanguageSlug(payload.language),
    question_title: String(
      payload.questionnaireTitle ?? payload.questionTitle ?? payload.title ?? ""
    ).trim(),
    status: formValueToApiStatus(payload.status ?? "Active"),
  };

  if (questionType) {
    body.question_type = uiToApiQuestionType(questionType);
  }

  // Same rule as create: never send options: [] (fails min:1 validation).
  if (options.length > 0) {
    body.options = options;
  }

  if (rightAnswerTrimmed) {
    body.right_answer = rightAnswerTrimmed;
  } else if (
    payload.rightAnswer === null ||
    payload.right_answer === null ||
    rightAnswerRaw === ""
  ) {
    body.right_answer = null;
  }

  if (payload.sortOrder != null || payload.sort_order != null) {
    body.sort_order = Number(payload.sortOrder ?? payload.sort_order ?? 0) || 0;
  }

  return body;
}

function appendQuestionLibraryListQuery(basePath, { page, limit, search } = {}) {
  return appendListQuery(basePath, {
    page,
    limit,
    search: normalizeSearchQuery(search),
  });
}

function formatQuestionLibraryLanguageForUi(language) {
  const slug = String(language ?? "").trim();
  if (!slug) return "";
  return toUiSentenceCase(slug);
}

export function mapQuestionToForm(record) {
  const optionItems = mapOptionsToFormItems(record?.options);
  const mappedLines = optionItems.map((opt) => opt.label).filter(Boolean);
  const required = Boolean(record?.is_required ?? record?.required ?? record?.isRequired);

  return {
    language: formatQuestionLibraryLanguageForUi(record?.language),
    questionTitle:
      record?.question_title ?? record?.questionnaireTitle ?? record?.title ?? "",
    questionType: apiToUiQuestionType(record?.question_type ?? record?.questionType),
    mappedOptions: mappedLines.join("\n"),
    options: optionItems,
    optionItems,
    rightAnswer:
      record?.right_answer != null
        ? String(record.right_answer)
        : record?.rightAnswer != null
          ? String(record.rightAnswer)
          : "",
    sortOrder: String(record?.sort_order ?? record?.sortOrder ?? 0),
    required,
    status: apiStatusToFormValue(record?.status),
  };
}

export function mapQuestionToRow(record) {
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

function mapLanguageQuestion(record) {
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

function sortQuestionsByOrder(records) {
  if (!Array.isArray(records)) return [];
  return [...records].sort(
    (left, right) =>
      (Number(left?.sort_order ?? left?.sortOrder) || 0) -
      (Number(right?.sort_order ?? right?.sortOrder) || 0)
  );
}

/** Adapter for listing hooks. */
export function listQuestionLibraryRecords({ page, limit, search } = {}) {
  return getRecords({
    page,
    limit,
    search,
  });
}

/** GET /api/question-library/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendQuestionLibraryListQuery(API_ROUTES.questionLibrary.list, {
      page,
      limit,
      search,
    })
  );
  assertSuccess(data);

  const questions = extractQuestionList(data);
  const total = extractListTotalFromResponse(data, questions.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? 1,
    limit: data.limit ?? questions.length,
    totalPages: data.totalPages ?? 1,
    items: safeMapListItems(questions, (record) => mapQuestionToRow(record)),
  };
}

/** GET /api/question-library/:id — returns raw `data` object from API. */
export async function getRecord(id) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.questionLibrary.byId(normalizedId));
  assertSuccess(data);

  const record = extractQuestionRecord(data);
  if (!record) {
    throw new ApiError("Question not found", null);
  }

  return record;
}

/** GET /api/question-library/:id — mapped for edit forms. */
export async function getRecordForForm(id) {
  const record = await getRecord(id);
  return mapQuestionToForm(record);
}

/** GET /api/question-library/language/:language (lowercase slug, e.g. english) */
export async function getQuestionsByLanguage(language) {
  const normalizedLanguage = normalizeQuestionLibraryLanguageSlug(language);
  if (!normalizedLanguage) return [];

  const data = await apiRequest(API_ROUTES.questionLibrary.byLanguage(normalizedLanguage));
  assertSuccess(data);

  return sortQuestionsByOrder(extractQuestionList(data));
}

export async function getQuestionnaireOptionsForLanguage(language, surveyLanguage) {
  const questionLanguage = String(language ?? "").trim();
  if (!questionLanguage) return [];

  const surveyLang = String(surveyLanguage ?? questionLanguage).trim();
  if (
    normalizeQuestionLibraryLanguageSlug(surveyLang) !==
    normalizeQuestionLibraryLanguageSlug(questionLanguage)
  ) {
    return [];
  }

  try {
    const records = await getQuestionsByLanguage(questionLanguage);

    return records
      .map((record) => mapLanguageQuestion(record))
      .filter((record) => record.id != null && record.questionTitle)
      .map((record) => ({
        value: String(record.id),
        label: record.questionTitle,
      }));
  } catch {
    return [];
  }
}

export async function getQuestionnaireTitlesForLanguage(language, surveyLanguage) {
  const options = await getQuestionnaireOptionsForLanguage(language, surveyLanguage);
  return options.map((option) => option.label);
}

/** POST /api/question-library/add */
export async function createQuestion(payload) {
  const data = await apiRequest(API_ROUTES.questionLibrary.create, {
    method: "POST",
    body: buildQuestionLibraryCreateBody(payload),
  });

  return assertSuccess(data);
}

/** PUT /api/question-library/:id */
export async function updateQuestion(id, payload) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.questionLibrary.update(normalizedId), {
    method: "PUT",
    body: buildQuestionLibraryUpdateBody(payload),
  });

  return assertSuccess(data);
}

/** PATCH /api/question-library/:id/status */
export async function updateQuestionStatus(id, status) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.questionLibrary.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/** PUT /api/question-library/sort-order */
export async function updateQuestionSortOrder(items) {
  const data = await apiRequest(API_ROUTES.questionLibrary.sortOrder, {
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

export async function saveRecord(payload) {
  if (payload.id != null && String(payload.id).trim()) {
    return updateQuestion(payload.id, payload);
  }
  return createQuestion(payload);
}

/** DELETE /api/question-library/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.questionLibrary.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

/** GET /api/question-library/export/csv */
export async function exportQuestionLibraryCsv() {
  return downloadCsvExport(API_ROUTES.questionLibrary.exportCsv, {
    defaultFilename: buildDatedExportFilename("question-library"),
  });
}

/** @deprecated Use listQuestionLibraryRecords */
export const listPrescreenRecords = listQuestionLibraryRecords;
/** @deprecated Use updateQuestionStatus */
export const updatePrescreenStatus = updateQuestionStatus;
/** @deprecated Use mapQuestionToForm */
export const mapPrescreenToForm = mapQuestionToForm;
/** @deprecated Use mapQuestionToRow */
export const mapPrescreenQuestionnaireToRow = mapQuestionToRow;
/** @deprecated Use getQuestionsByLanguage */
export const getPrescreensByLanguage = getQuestionsByLanguage;
/** @deprecated Use createQuestion */
export const createPrescreen = createQuestion;
/** @deprecated Use updateQuestion */
export const updatePrescreen = updateQuestion;
/** @deprecated Use updateQuestionSortOrder */
export const updatePrescreenSortOrder = updateQuestionSortOrder;
