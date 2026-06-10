import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
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

function normalizePrescreenId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

export function parseQuestionsFromText(text) {
  return String(text ?? "")
    .split("\n")
    .map((question) => question.trim())
    .filter(Boolean);
}

/** API may return questions as strings or as { id, question } objects. */
export function normalizeQuestionItem(item) {
  if (item == null) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "object") {
    return String(item.question ?? item.title ?? item.text ?? "").trim();
  }
  return String(item).trim();
}

export function formatQuestionsForText(questions) {
  if (!Array.isArray(questions)) return "";
  return questions.map(normalizeQuestionItem).filter(Boolean).join("\n");
}

function resolveSelectedQuestions(payload) {
  const single = String(payload.selectedQuestionnaire ?? "").trim();
  if (single) return [single];

  if (Array.isArray(payload.selectedQuestionnaires)) {
    return payload.selectedQuestionnaires.map((question) => String(question ?? "").trim()).filter(Boolean);
  }

  return parseQuestionsFromText(payload.questionnaireList);
}

function buildPrescreenBody(payload) {
  return {
    survey_title: payload.surveyTitle.trim(),
    language: payload.language.trim(),
    status: formValueToApiStatus(payload.status),
    questions: resolveSelectedQuestions(payload),
  };
}

/**
 * @param {object} prescreen
 */
export function mapPrescreenGroupToRow(prescreen) {
  return {
    id: prescreen?.id,
    surveyTitle: prescreen?.survey_title ?? "",
    language: prescreen?.language ?? "",
    status: apiStatusToFormValue(prescreen?.status),
    createdAt: prescreen?.created_at ?? "",
    createdDate: prescreen?.created_at ?? "",
  };
}

/**
 * @param {object} prescreen
 */
export function mapPrescreenGroupToForm(prescreen) {
  const selectedQuestionnaires = Array.isArray(prescreen?.questions)
    ? prescreen.questions.map(normalizeQuestionItem).filter(Boolean)
    : [];

  return {
    surveyTitle: prescreen?.survey_title ?? "",
    language: prescreen?.language ?? "",
    status: apiStatusToFormValue(prescreen?.status),
    selectedQuestionnaire: selectedQuestionnaires[0] ?? "",
    selectedQuestionnaires,
  };
}

/** GET /api/prescreen/list */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.prescreenGroup.list);
  assertSuccess(data);

  const prescreens = extractPrescreenList(data);
  const total = extractListTotalFromResponse(data, prescreens.length);

  return {
    ...data,
    total,
    count: total,
    items: prescreens.map((prescreen) => mapPrescreenGroupToRow(prescreen)),
  };
}

/** GET /api/prescreen/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizePrescreenId(id);

  try {
    const data = await apiRequest(API_ROUTES.prescreenGroup.byId(normalizedId));
    assertSuccess(data);
    const record = extractPrescreenRecord(data);
    if (record) return record;
  } catch {
    // Fall back to list lookup below.
  }

  const data = await apiRequest(API_ROUTES.prescreenGroup.list);
  assertSuccess(data);

  const prescreens = extractPrescreenList(data);
  const match = prescreens.find((prescreen) => String(prescreen.id) === String(id));
  if (!match) {
    throw new ApiError("Prescreen group not found", null);
  }

  return match;
}

/**
 * POST /api/prescreen/add
 * @param {{
 *   surveyTitle: string,
 *   language: string,
 *   status: string,
 *   questionnaireList: string,
 * }} payload
 */
export async function createPrescreenGroup(payload) {
  const data = await apiRequest(API_ROUTES.prescreenGroup.create, {
    method: "POST",
    body: buildPrescreenBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen/:id
 * @param {string|number} id
 * @param {{
 *   surveyTitle: string,
 *   language: string,
 *   status: string,
 *   questionnaireList: string,
 * }} payload
 */
export async function updatePrescreenGroup(id, payload) {
  const normalizedId = normalizePrescreenId(id);
  const data = await apiRequest(API_ROUTES.prescreenGroup.update(normalizedId), {
    method: "PUT",
    body: buildPrescreenBody(payload),
  });

  return assertSuccess(data);
}
