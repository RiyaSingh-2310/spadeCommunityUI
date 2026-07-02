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
import {
  apiToUiQuestionType,
  uiToApiQuestionType,
} from "../question-library/questionLibraryApi";
import {
  normalizeOptionsForQuestionType,
  normalizeQuestionTypeLabel,
} from "../../modules/user-screening/data/profilingQuestionsStore";

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

export function decodeQuestionId(id) {
  const raw = String(id ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normalizeQuestionId(id) {
  const decodedId = decodeQuestionId(id);
  if (!decodedId) {
    throw new ApiError("", null);
  }
  return encodeURIComponent(decodedId);
}

function extractQuestionList(data) {
  if (!data || typeof data !== "object") return [];
  const payload = data.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

function isLanguageQuestionGroup(item) {
  return (
    item &&
    typeof item === "object" &&
    Array.isArray(item.questions) &&
    (item.question_title != null || item.questionTitle != null)
  );
}

/**
 * GET /api/screening/questions/language/:language
 * Response: { data: [{ question_title, questions: [{ id, question_text }] }] }
 */
function flattenLanguageQuestionGroups(groups, language = "") {
  if (!Array.isArray(groups)) return [];

  const flattened = [];

  for (const group of groups) {
    if (!isLanguageQuestionGroup(group)) {
      flattened.push(group);
      continue;
    }

    const groupTitle = String(group.question_title ?? group.questionTitle ?? "").trim();

    for (const question of group.questions ?? []) {
      if (!question || typeof question !== "object") continue;

      flattened.push({
        ...question,
        id: question.id ?? question.question_id ?? question.questionId,
        question_text: question.question_text ?? question.questionText ?? "",
        question_title: groupTitle,
        language: group.language ?? language,
      });
    }
  }

  return flattened;
}

function extractLanguageQuestionRecords(data, language = "") {
  const payload = data?.data;

  if (Array.isArray(payload) && payload.some(isLanguageQuestionGroup)) {
    return flattenLanguageQuestionGroups(payload, language);
  }

  return extractQuestionList(data).map((record) => normalizeScreeningListRecord(record));
}

function getRecordId(record) {
  if (!record || typeof record !== "object") return null;

  const direct =
    record.id ??
    record.question_id ??
    record.questionId ??
    record.screening_question_id ??
    record.screeningQuestionId ??
    record._id;

  if (direct != null && direct !== "") {
    return direct;
  }

  const nested = record.questions ?? record.question_list ?? record.questionList;
  if (Array.isArray(nested) && nested.length > 0) {
    const sorted = [...nested].sort(
      (a, b) =>
        (Number(a?.sort_order ?? a?.sortOrder ?? 0) || 0) -
        (Number(b?.sort_order ?? b?.sortOrder ?? 0) || 0)
    );
    return getRecordId(sorted[0]);
  }

  return null;
}

/** Resolves the API id used for list row actions (view, edit, delete, status). */
export function getScreeningRowId(row) {
  return getRecordId(row);
}

function normalizeScreeningListRecord(record) {
  if (!record || typeof record !== "object") return record;

  const nested = Array.isArray(record.questions)
    ? record.questions
    : Array.isArray(record.question_list)
      ? record.question_list
      : Array.isArray(record.questionList)
        ? record.questionList
        : null;

  if (!nested || nested.length === 0) {
    return record;
  }

  const sorted = [...nested].sort(
    (a, b) =>
      (Number(a?.sort_order ?? a?.sortOrder ?? 0) || 0) -
      (Number(b?.sort_order ?? b?.sortOrder ?? 0) || 0)
  );
  const primary = sorted[0] ?? {};

  return {
    ...primary,
    ...record,
    id: getRecordId(record) ?? getRecordId(primary),
    question_title:
      record.question_title ??
      record.questionTitle ??
      primary.question_title ??
      primary.questionTitle ??
      "",
    language: record.language ?? primary.language ?? "",
    question_type:
      record.question_type ??
      record.questionType ??
      primary.question_type ??
      primary.questionType,
    sort_order:
      record.sort_order ??
      record.sortOrder ??
      primary.sort_order ??
      primary.sortOrder,
    status: record.status ?? primary.status,
  };
}

function extractQuestionRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.question && typeof data.question === "object") {
    return data.question;
  }
  if (data.id != null) return data;
  return null;
}

function mapRequiredValue(record) {
  const raw = record?.is_required ?? record?.required ?? record?.isRequired;
  if (raw === 1 || raw === "1") return true;
  if (raw === 0 || raw === "0") return false;
  return Boolean(raw);
}

function extractRecordOptions(record) {
  if (!record || typeof record !== "object") return [];

  const candidates = [
    record.options,
    record.question_options,
    record.questionOptions,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const parsed = parseOptionsField(candidate);
    if (hasQuestionOptions({ options: parsed })) {
      return parsed;
    }
  }

  return parseOptionsField(record.options) ?? [];
}

function parseOptionsField(options) {
  if (options == null) return options;

  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : options;
      } catch {
        // Fall through to line-based parsing.
      }
    }

    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return options;
}

function hasQuestionOptions(record) {
  const options = parseOptionsField(record?.options);
  if (!Array.isArray(options)) {
    return typeof options === "string" ? options.trim().length > 0 : false;
  }

  return options.some((option) => {
    if (typeof option === "string") return option.trim().length > 0;
    if (typeof option === "object" && option) {
      return Boolean(
        String(
          option.label ??
            option.value ??
            option.option_text ??
            option.optionText ??
            option.mapped_option ??
            option.mappedOption ??
            ""
        ).trim()
      );
    }
    return false;
  });
}

function mergeScreeningQuestionRecord(listRecord, detailRecord) {
  if (!detailRecord) return listRecord;

  const detailOptions = extractRecordOptions(detailRecord);
  const listOptions = extractRecordOptions(listRecord);
  const options = hasQuestionOptions({ options: detailOptions })
    ? detailOptions
    : listOptions;

  return {
    ...listRecord,
    ...detailRecord,
    id: getRecordId(listRecord) ?? getRecordId(detailRecord),
    language: listRecord?.language ?? detailRecord.language ?? "",
    question_title:
      detailRecord.question_title ??
      detailRecord.questionTitle ??
      listRecord?.question_title ??
      listRecord?.questionTitle ??
      "",
    question_text:
      detailRecord.question_text ??
      detailRecord.questionText ??
      listRecord?.question_text ??
      listRecord?.questionText ??
      "",
    question_type:
      detailRecord.question_type ??
      detailRecord.questionType ??
      listRecord?.question_type ??
      listRecord?.questionType,
    is_required:
      detailRecord.is_required ??
      detailRecord.required ??
      listRecord?.is_required ??
      listRecord?.required,
    sort_order:
      listRecord?.sort_order ??
      listRecord?.sortOrder ??
      detailRecord.sort_order ??
      detailRecord.sortOrder,
    status: listRecord?.status ?? detailRecord.status,
    options,
  };
}

async function enrichScreeningQuestionRecord(record) {
  if (!record) return record;

  const withParsedOptions = {
    ...record,
    options: extractRecordOptions(record),
  };

  if (hasQuestionOptions(withParsedOptions)) {
    return withParsedOptions;
  }

  const recordId = getRecordId(record);
  if (recordId == null) return withParsedOptions;

  try {
    const data = await apiRequest(API_ROUTES.screening.byId(normalizeQuestionId(recordId)));
    assertSuccess(data);
    const detail = extractQuestionRecord(data);
    return mergeScreeningQuestionRecord(withParsedOptions, detail);
  } catch {
    return withParsedOptions;
  }
}

function resolveOptionsAsStrings(payload) {
  if (Array.isArray(payload.options)) {
    return payload.options
      .map((option) => {
        if (typeof option === "string") return option.trim();
        if (typeof option === "object" && option) {
          return String(option.text ?? option.label ?? option.value ?? option.option_text ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof payload.options === "string") {
    return payload.options
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function buildQuestionBody(payload, { includeStatus = true, partial = false } = {}) {
  const body = {};

  const language = String(payload.language ?? "").trim();
  const questionTitle = String(
    payload.questionTitle ?? payload.question_title ?? payload.title ?? ""
  ).trim();
  const questionText = String(
    payload.questionText ?? payload.question_text ?? questionTitle
  ).trim();
  const questionType = uiToApiQuestionType(
    payload.questionType ?? payload.question_type ?? "textbox"
  );
  const options = resolveOptionsAsStrings(payload);
  const sortOrder = Number(payload.sortOrder ?? payload.sort_order ?? 0) || 0;
  const isRequired = Boolean(
    payload.required ?? payload.is_required ?? payload.isRequired
  );

  if (!partial || payload.language != null) body.language = language;
  if (!partial || payload.questionTitle != null || payload.question_title != null) {
    body.question_title = questionTitle;
  }
  if (
    !partial ||
    payload.questionText != null ||
    payload.question_text != null ||
    payload.questionTitle != null ||
    payload.question_title != null
  ) {
    body.question_text = questionText;
  }
  if (!partial || payload.questionType != null || payload.question_type != null) {
    body.question_type = questionType;
  }
  if (!partial || payload.options != null) body.options = options;
  if (!partial || payload.sortOrder != null || payload.sort_order != null) {
    body.sort_order = sortOrder;
  }
  if (!partial || payload.required != null || payload.is_required != null) {
    body.is_required = isRequired ? 1 : 0;
  }
  if (includeStatus && (!partial || payload.status != null)) {
    body.status = formValueToApiStatus(payload.status ?? "Active");
  }

  return body;
}

function appendScreeningListQuery(basePath, { page, limit, search, language } = {}) {
  const extra = {};
  const alwaysIncludeEmpty = ["search"];

  if (language !== undefined) {
    extra.language = String(language ?? "");
    alwaysIncludeEmpty.push("language");
  }

  return appendListQuery(basePath, {
    page,
    limit,
    search,
    alwaysIncludeEmpty,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
  });
}

/**
 * Maps a screening API record to a form question item.
 * @param {object} record
 */
export function mapScreeningRecordToQuestionItem(record) {
  const mapped = mapScreeningQuestionToForm(record);
  const recordId = getRecordId(record);

  return {
    id: `question-${recordId ?? Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recordId: recordId ?? undefined,
    questionText: mapped.questionText,
    questionType: mapped.questionType,
    options: mapped.options,
    required: mapped.required,
  };
}

/**
 * GET /api/screening/questions/language/:language
 * Falls back to list filtering when the language endpoint is unavailable.
 */
export async function getScreeningQuestionsByLanguage(language) {
  const normalizedLanguage = String(language ?? "").trim();
  if (!normalizedLanguage) return [];

  try {
    const data = await apiRequest(API_ROUTES.screening.byLanguage(normalizedLanguage));
    assertSuccess(data);
    return extractLanguageQuestionRecords(data, normalizedLanguage);
  } catch {
    const data = await apiRequest(
      appendScreeningListQuery(API_ROUTES.screening.list, {
        page: 1,
        limit: 500,
        language: normalizedLanguage,
      })
    );
    assertSuccess(data);
    return extractQuestionList(data)
      .map((record) => normalizeScreeningListRecord(record))
      .filter((record) => String(record?.language ?? "").trim() === normalizedLanguage);
  }
}

/** Options for Create Survey — questions available for a language. */
export async function getCreateSurveyQuestionOptions(language) {
  const records = await getScreeningQuestionsByLanguage(language);

  return records
    .map((record) => {
      const recordId = getRecordId(record);
      const questionText = String(
        record?.question_text ?? record?.questionText ?? ""
      ).trim();
      const fallbackTitle = String(
        record?.question_title ?? record?.questionTitle ?? ""
      ).trim();

      if (!questionText && !fallbackTitle) return null;

      return {
        value: String(recordId ?? questionText ?? fallbackTitle),
        label: questionText || fallbackTitle,
        libraryQuestionId: recordId,
        record,
      };
    })
    .filter(Boolean);
}

/** @deprecated Use getCreateSurveyQuestionOptions for Create Survey. */
export async function getScreeningQuestionTextOptions(language) {
  return getCreateSurveyQuestionOptions(language);
}

/**
 * @param {object} record
 */
export function mapScreeningQuestionToForm(record) {
  const questionType = normalizeQuestionTypeLabel(
    apiToUiQuestionType(record?.question_type ?? record?.questionType)
  );
  const options = normalizeOptionsForQuestionType(
    extractRecordOptions(record),
    questionType
  );
  const required = mapRequiredValue(record);

  return {
    language: record?.language ?? "",
    questionTitle: record?.question_title ?? record?.questionTitle ?? "",
    questionText: record?.question_text ?? record?.questionText ?? "",
    questionType,
    options,
    sortOrder: String(record?.sort_order ?? record?.sortOrder ?? 0),
    required,
    status: apiStatusToFormValue(record?.status),
  };
}

/**
 * Maps all API records in a questionnaire to the shared edit form shape.
 * @param {object[]} records
 */
export function mapQuestionnaireToForm(records) {
  const sorted = [...(records ?? [])].sort(
    (a, b) =>
      (Number(a?.sort_order ?? a?.sortOrder ?? 0) || 0) -
      (Number(b?.sort_order ?? b?.sortOrder ?? 0) || 0)
  );
  const first = sorted[0] ?? {};

  return {
    language: first.language ?? "",
    questionTitle: first.question_title ?? first.questionTitle ?? "",
    status: apiStatusToFormValue(first.status),
    questions: sorted.map((record) => {
      const mapped = mapScreeningQuestionToForm(record);
      const recordId = getRecordId(record);
      return {
        id: `loaded-question-${recordId}`,
        recordId,
        questionText: mapped.questionText,
        questionType: mapped.questionType,
        options: mapped.options,
        required: mapped.required,
      };
    }),
  };
}

/**
 * @param {object} record
 */
export function mapScreeningQuestionToRow(record) {
  const createdRaw = record?.created_at ?? record?.createdAt ?? "";
  const sortOrder = Number(record?.sort_order ?? record?.sortOrder ?? 0) || 0;
  const title = record?.question_title ?? record?.questionTitle ?? "";

  return {
    id: getRecordId(record),
    title,
    questionTitle: title,
    language: record?.language ?? "",
    questionType: normalizeQuestionTypeLabel(
      apiToUiQuestionType(record?.question_type ?? record?.questionType)
    ),
    sortOrder: String(sortOrder),
    status: apiStatusToFormValue(record?.status),
    options: Array.isArray(record?.options) ? record.options : [],
    createdAt: createdRaw,
    createdDate: formatLocaleDateTime(createdRaw),
  };
}

/** Adapter for listing hooks. */
export function listScreeningRecords({ page, limit, search } = {}) {
  return getRecords({
    page,
    limit,
    search: normalizeSearchQuery(search),
  });
}

/** GET /api/screening/questions/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendScreeningListQuery(API_ROUTES.screening.list, {
      page,
      limit,
      search,
    })
  );
  assertSuccess(data);

  const questions = extractQuestionList(data);
  const total = extractListTotalFromResponse(data, questions.length);
  const items = questions
    .map((record) => normalizeScreeningListRecord(record))
    .map((record) => mapScreeningQuestionToRow(record));

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? 1,
    limit: data.limit ?? questions.length,
    totalPages: data.totalPages ?? 1,
    items,
  };
}

/** GET /api/screening/questions/:id — falls back to list lookup when detail is unavailable. */
export async function getRecord(id) {
  const decodedId = decodeQuestionId(id);
  if (!decodedId) {
    throw new ApiError("Question not found", null);
  }

  const normalizedId = normalizeQuestionId(decodedId);

  try {
    const data = await apiRequest(API_ROUTES.screening.byId(normalizedId));
    assertSuccess(data);
    const record = extractQuestionRecord(data);
    if (record) {
      const listData = await apiRequest(
        appendScreeningListQuery(API_ROUTES.screening.list, { page: 1, limit: 500 })
      );
      assertSuccess(listData);
      const listRecord = extractQuestionList(listData)
        .map((item) => normalizeScreeningListRecord(item))
        .find((item) => String(getRecordId(item)) === decodedId);
      return enrichScreeningQuestionRecord(
        mergeScreeningQuestionRecord(listRecord ?? {}, record)
      );
    }
  } catch {
    // Fall back to list lookup below.
  }

  const data = await apiRequest(
    appendScreeningListQuery(API_ROUTES.screening.list, { page: 1, limit: 500 })
  );
  assertSuccess(data);

  const questions = extractQuestionList(data)
    .map((record) => normalizeScreeningListRecord(record));
  const match = questions.find((record) => String(getRecordId(record)) === decodedId);
  if (!match) {
    throw new ApiError("Question not found", null);
  }

  return enrichScreeningQuestionRecord(match);
}

/**
 * GET /api/screening/questions/by-title/:title
 * Returns the full questionnaire for a title directly from the API.
 */
export async function getQuestionnaireByTitle(questionTitle) {
  const title = String(questionTitle ?? "").trim();
  if (!title) {
    throw new ApiError("Question title is required", null);
  }

  const data = await apiRequest(API_ROUTES.screening.byTitle(title));
  assertSuccess(data);

  const questions = data?.data?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError("Question not found", null);
  }

  return questions.map((record) => ({
    ...record,
    options: extractRecordOptions(record),
  }));
}

async function loadQuestionnaireFromList(seed, id) {
  const questionTitle = String(seed?.question_title ?? seed?.questionTitle ?? "").trim();
  const language = String(seed?.language ?? "").trim();
  const seedId = String(getRecordId(seed) ?? decodeQuestionId(id));

  const data = await apiRequest(
    appendScreeningListQuery(API_ROUTES.screening.list, { page: 1, limit: 500 })
  );
  assertSuccess(data);

  const questions = extractQuestionList(data)
    .map((record) => normalizeScreeningListRecord(record))
    .filter((record) => {
      const recordTitle = String(record?.question_title ?? record?.questionTitle ?? "").trim();
      const recordLanguage = String(record?.language ?? "").trim();
      const recordId = String(getRecordId(record) ?? "");
      return (
        recordTitle === questionTitle &&
        recordLanguage === language &&
        (apiStatusToFormValue(record?.status) === "Active" || recordId === seedId)
      );
    })
    .sort(
      (a, b) =>
        (Number(a?.sort_order ?? a?.sortOrder ?? 0) || 0) -
        (Number(b?.sort_order ?? b?.sortOrder ?? 0) || 0)
    )
    .map((record) => ({
      ...record,
      options: extractRecordOptions(record),
    }));

  if (questions.length === 0) {
    throw new ApiError("Question not found", null);
  }

  return questions;
}

/**
 * Loads every question in the questionnaire identified by any member question id.
 */
export async function getQuestionnaireByQuestionId(id) {
  const seed = await getRecord(id);
  const title = String(seed?.question_title ?? seed?.questionTitle ?? "").trim();
  if (!title) {
    throw new ApiError("Question not found", null);
  }

  try {
    return await getQuestionnaireByTitle(title);
  } catch {
    return loadQuestionnaireFromList(seed, id);
  }
}

/** DELETE /api/screening/questions/:id */
export async function deleteScreeningQuestion(id) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.screening.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

/** POST /api/screening/questions/add */
export async function createScreeningQuestion(payload) {
  const data = await apiRequest(API_ROUTES.screening.create, {
    method: "POST",
    body: buildQuestionBody(payload),
  });

  return assertSuccess(data);
}

/** PUT /api/screening/questions/:id */
export async function updateScreeningQuestion(id, payload) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.screening.update(normalizedId), {
    method: "PUT",
    body: buildQuestionBody(payload, { partial: true }),
  });

  return assertSuccess(data);
}

/** PATCH /api/screening/questions/:id/status */
export async function updateScreeningQuestionStatus(id, status) {
  const normalizedId = normalizeQuestionId(id);
  const data = await apiRequest(API_ROUTES.screening.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/** PUT /api/screening/questions/sort-order */
export async function updateScreeningSortOrder(items) {
  const data = await apiRequest(API_ROUTES.screening.sortOrder, {
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

function surveyGroupKey(row) {
  const title = String(row?.questionTitle ?? row?.title ?? "").trim().toLowerCase();
  const language = String(row?.language ?? "").trim().toLowerCase();
  return `${title}::${language}`;
}

function groupQuestionsIntoSurveys(items = []) {
  const groups = new Map();

  for (const item of items) {
    const key = surveyGroupKey(item);
    if (!key || key === "::") continue;

    const rowId = getScreeningRowId(item);
    const sortOrder = Number(item?.sortOrder ?? 0) || 0;

    if (!groups.has(key)) {
      groups.set(key, {
        id: rowId,
        surveyTitle: item.questionTitle ?? item.title ?? "",
        language: item.language ?? "",
        questionType: item.questionType ?? "",
        status: item.status ?? "Active",
        memberIds: rowId != null ? [rowId] : [],
        sortOrder,
      });
      continue;
    }

    const group = groups.get(key);
    if (rowId != null) {
      group.memberIds.push(rowId);
    }
    if (sortOrder < group.sortOrder) {
      group.sortOrder = sortOrder;
      if (rowId != null) {
        group.id = rowId;
      }
      group.questionType = item.questionType ?? group.questionType;
    }
    if (String(item.status ?? "").toLowerCase() === "inactive") {
      group.status = "Inactive";
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const titleCompare = String(a.surveyTitle).localeCompare(String(b.surveyTitle));
    if (titleCompare !== 0) return titleCompare;
    return String(a.language).localeCompare(String(b.language));
  });
}

/** Adapter for Create Survey listing — groups screening questions by survey title + language. */
export async function listCreateSurveyRecords({ page, limit, search } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageLimit = Math.max(1, Number(limit) || 10);

  const data = await getRecords({
    page: 1,
    limit: 500,
    search: normalizeSearchQuery(search),
  });

  const surveys = groupQuestionsIntoSurveys(data.items ?? []);
  const total = surveys.length;
  const start = (pageNum - 1) * pageLimit;
  const items = surveys.slice(start, start + pageLimit);

  return {
    ...data,
    items,
    total,
    count: total,
    page: pageNum,
    limit: pageLimit,
    totalPages: Math.max(1, Math.ceil(total / pageLimit)),
  };
}

/** Deletes every question in a survey group. */
export async function deleteCreateSurvey(row) {
  const memberIds = Array.isArray(row?.memberIds)
    ? row.memberIds.filter((id) => id != null)
    : row?.id != null
      ? [row.id]
      : [];

  if (memberIds.length === 0) {
    throw new ApiError("Survey not found", null);
  }

  let lastData = null;
  for (const memberId of memberIds) {
    lastData = await deleteScreeningQuestion(memberId);
  }

  return lastData;
}

/** Updates status for every question in a survey group. */
export async function updateCreateSurveyStatus(row, status) {
  const memberIds = Array.isArray(row?.memberIds)
    ? row.memberIds.filter((id) => id != null)
    : row?.id != null
      ? [row.id]
      : [];

  if (memberIds.length === 0) {
    throw new ApiError("Survey not found", null);
  }

  let lastData = null;
  for (const memberId of memberIds) {
    lastData = await updateScreeningQuestionStatus(memberId, status);
  }

  return lastData;
}

const PANEL_SURVEY_LANGUAGE_TO_API = {
  English: "en",
  Arabic: "ar",
  German: "de",
  French: "fr",
  Spanish: "es",
};

const PANEL_SURVEY_LANGUAGE_FROM_API = Object.fromEntries(
  Object.entries(PANEL_SURVEY_LANGUAGE_TO_API).map(([label, code]) => [code, label])
);

function normalizePanelSurveyId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function uiLanguageToPanelSurveyApi(language) {
  const trimmed = String(language ?? "").trim();
  return PANEL_SURVEY_LANGUAGE_TO_API[trimmed] ?? trimmed.toLowerCase();
}

function panelSurveyApiLanguageToUi(language) {
  const code = String(language ?? "").trim().toLowerCase();
  return PANEL_SURVEY_LANGUAGE_FROM_API[code] ?? language;
}

function extractPanelSurveyList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.surveys)) return data.surveys;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function resolvePanelSurveyQuestionIds(payload) {
  if (Array.isArray(payload.questionIds)) {
    return payload.questionIds.map(Number).filter(Number.isFinite);
  }

  if (Array.isArray(payload.questions)) {
    return payload.questions
      .map((question) => question.libraryQuestionId ?? question.recordId)
      .map(Number)
      .filter(Number.isFinite);
  }

  return [];
}

function buildPanelSurveyBody(payload) {
  const body = {
    questionIds: resolvePanelSurveyQuestionIds(payload),
    surveyTitle: String(payload.surveyTitle ?? payload.questionTitle ?? "").trim(),
    language: uiLanguageToPanelSurveyApi(payload.language),
  };

  if (payload.status != null && String(payload.status).trim() !== "") {
    body.status = formValueToApiStatus(payload.status);
  }

  return body;
}

export function mapPanelSurveyToRow(record) {
  const id = record?.id ?? record?.survey_id ?? record?.surveyId;
  const questionIds = Array.isArray(record?.questionIds)
    ? record.questionIds
    : Array.isArray(record?.question_ids)
      ? record.question_ids
      : [];

  return {
    id,
    surveyTitle: record?.surveyTitle ?? record?.survey_title ?? "",
    language: panelSurveyApiLanguageToUi(record?.language),
    status: apiStatusToFormValue(record?.status),
    questionIds: questionIds.map(Number).filter(Number.isFinite),
  };
}

/** Adapter for Panel Survey listing — GET /api/questionaire/survey */
export async function listPanelSurveyRecords({ page, limit, search } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageLimit = Math.max(1, Number(limit) || 10);
  const normalizedSearch = normalizeSearchQuery(search);

  const data = await apiRequest(API_ROUTES.questionaire.list);
  assertSuccess(data);

  let items = extractPanelSurveyList(data).map(mapPanelSurveyToRow);

  if (normalizedSearch) {
    const lower = normalizedSearch.toLowerCase();
    items = items.filter(
      (row) =>
        String(row.surveyTitle ?? "")
          .toLowerCase()
          .includes(lower) ||
        String(row.language ?? "")
          .toLowerCase()
          .includes(lower)
    );
  }

  const total = items.length;
  const start = (pageNum - 1) * pageLimit;
  const paginated = items.slice(start, start + pageLimit);

  return {
    ...data,
    items: paginated,
    total,
    count: total,
    page: pageNum,
    limit: pageLimit,
    totalPages: Math.max(1, Math.ceil(total / pageLimit)),
  };
}

export async function getPanelSurveyById(id) {
  const normalizedId = decodeQuestionId(id);
  if (!normalizedId) return null;

  const data = await apiRequest(API_ROUTES.questionaire.list);
  assertSuccess(data);

  return (
    extractPanelSurveyList(data)
      .map(mapPanelSurveyToRow)
      .find((item) => String(item.id) === String(normalizedId)) ?? null
  );
}

export async function createPanelSurvey(payload) {
  const data = await apiRequest(API_ROUTES.questionaire.create, {
    method: "POST",
    body: buildPanelSurveyBody(payload),
  });
  return assertSuccess(data);
}

export async function updatePanelSurvey(id, payload) {
  const data = await apiRequest(API_ROUTES.questionaire.update(normalizePanelSurveyId(id)), {
    method: "PUT",
    body: buildPanelSurveyBody(payload),
  });
  return assertSuccess(data);
}

export async function deletePanelSurvey(id) {
  const data = await apiRequest(API_ROUTES.questionaire.delete(normalizePanelSurveyId(id)), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

export async function updatePanelSurveyStatus(row, status) {
  if (row?.id == null) {
    throw new ApiError("Survey not found", null);
  }

  return updatePanelSurvey(row.id, {
    surveyTitle: row.surveyTitle,
    language: row.language,
    questionIds: row.questionIds,
    status,
  });
}

export async function mapPanelSurveyToForm(record) {
  const language = panelSurveyApiLanguageToUi(record?.language);
  const questionIds = Array.isArray(record?.questionIds) ? record.questionIds : [];

  const options = language ? await getCreateSurveyQuestionOptions(language) : [];
  const optionById = new Map(
    options.map((option) => [String(option.libraryQuestionId ?? option.value), option])
  );

  const questions = [];

  for (const questionId of questionIds) {
    const option = optionById.get(String(questionId));

    if (option) {
      let detailRecord = option.record;
      try {
        detailRecord = await getRecord(questionId);
      } catch {
        // Fall back to the language-list payload when detail is unavailable.
      }

      const mapped = mapScreeningRecordToQuestionItem(detailRecord);
      questions.push({
        ...mapped,
        recordId: undefined,
        libraryQuestionId: questionId,
        sourceKey: String(questionId),
      });
      continue;
    }

    try {
      const detailRecord = await getRecord(questionId);
      const mapped = mapScreeningRecordToQuestionItem(detailRecord);
      questions.push({
        ...mapped,
        recordId: undefined,
        libraryQuestionId: questionId,
        sourceKey: String(questionId),
      });
    } catch {
      questions.push({
        id: `question-${questionId}`,
        libraryQuestionId: questionId,
        sourceKey: String(questionId),
        questionText: `Question #${questionId}`,
        questionType: "",
        options: [],
        required: false,
      });
    }
  }

  return {
    language,
    questionTitle: record?.surveyTitle ?? "",
    status: apiStatusToFormValue(record?.status),
    questions,
  };
}
