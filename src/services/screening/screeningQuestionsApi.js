import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
  normalizeStatusKey,
} from "../../modules/shared/utils/statusLabels";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { formatLocaleDateTime } from "../../modules/shared/utils/dateTime";
import {
  apiToUiQuestionType,
  uiToApiQuestionType,
} from "../prescreen/prescreenQuestionnairesApi";
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
  if (Array.isArray(data.questions)) return data.questions;
  return [];
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
    id: listRecord?.id ?? detailRecord.id,
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

  const recordId = record.id;
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

function appendScreeningListQuery(basePath, { page, limit, search } = {}) {
  return appendListQuery(basePath, {
    page,
    limit,
    search,
    alwaysIncludeEmpty: ["search"],
  });
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
      return {
        id: `loaded-question-${record.id}`,
        recordId: record.id,
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
    id: record?.id,
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
  const items = questions.map((record) => mapScreeningQuestionToRow(record));

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
  const normalizedId = normalizeQuestionId(id);

  try {
    const data = await apiRequest(API_ROUTES.screening.byId(normalizedId));
    assertSuccess(data);
    const record = extractQuestionRecord(data);
    if (record) {
      const listData = await apiRequest(
        appendScreeningListQuery(API_ROUTES.screening.list, { page: 1, limit: 500 })
      );
      assertSuccess(listData);
      const listRecord = extractQuestionList(listData).find(
        (item) => String(item.id) === String(id)
      );
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

  const questions = extractQuestionList(data);
  const match = questions.find((record) => String(record.id) === String(id));
  if (!match) {
    throw new ApiError("Question not found", null);
  }

  return enrichScreeningQuestionRecord(match);
}

/**
 * Loads every active question that belongs to the same questionnaire title
 * as the record identified by `id`.
 */
export async function getQuestionnaireByQuestionId(id) {
  const seed = await getRecord(id);
  const questionTitle = String(seed?.question_title ?? seed?.questionTitle ?? "").trim();
  const language = String(seed?.language ?? "").trim();

  const data = await apiRequest(
    appendScreeningListQuery(API_ROUTES.screening.list, { page: 1, limit: 500 })
  );
  assertSuccess(data);

  const seedId = String(seed?.id ?? id);

  const questions = extractQuestionList(data)
    .filter((record) => {
      const recordTitle = String(record?.question_title ?? record?.questionTitle ?? "").trim();
      const recordLanguage = String(record?.language ?? "").trim();
      const isActive = normalizeStatusKey(record?.status) !== "inactive";
      const isSeed = String(record?.id) === seedId;
      return (
        recordTitle === questionTitle &&
        recordLanguage === language &&
        (isActive || isSeed)
      );
    })
    .sort(
      (a, b) =>
        (Number(a?.sort_order ?? a?.sortOrder ?? 0) || 0) -
        (Number(b?.sort_order ?? b?.sortOrder ?? 0) || 0)
    );

  if (questions.length === 0) {
    throw new ApiError("Question not found", null);
  }

  return Promise.all(questions.map((record) => enrichScreeningQuestionRecord(record)));
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
