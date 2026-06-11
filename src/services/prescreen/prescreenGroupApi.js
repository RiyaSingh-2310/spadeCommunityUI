import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { getPrescreensByLanguage } from "./prescreenQuestionnairesApi";
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

function normalizePrescreenSurveyId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractPrescreenSurveyList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.prescreenSurveys)) return data.prescreenSurveys;
  return [];
}

function extractPrescreenSurveyRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.prescreenSurvey && typeof data.prescreenSurvey === "object") {
    return data.prescreenSurvey;
  }
  if (data.id != null) return data;
  return null;
}

function normalizePrescreenIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

function resolvePrescreenIds(payload) {
  if (Array.isArray(payload.prescreenIds)) {
    return normalizePrescreenIds(payload.prescreenIds);
  }

  const single = payload.selectedPrescreenId ?? payload.selectedQuestionnaire;
  if (single == null || String(single).trim() === "") return [];

  const parsed = Number(single);
  return Number.isFinite(parsed) ? [parsed] : [];
}

function buildPrescreenSurveyBody(payload) {
  return {
    survey_title: String(payload.surveyTitle ?? "").trim(),
    language: String(payload.language ?? "").trim(),
    status: formValueToApiStatus(payload.status),
    prescreen_ids: resolvePrescreenIds(payload),
  };
}

function getQuestionItemsFromRecord(prescreen) {
  if (Array.isArray(prescreen?.questions) && prescreen.questions.length) {
    return prescreen.questions;
  }

  if (Array.isArray(prescreen?.prescreens) && prescreen.prescreens.length) {
    return prescreen.prescreens;
  }

  return [];
}

function extractPrescreenIdsFromRecord(prescreen) {
  if (Array.isArray(prescreen?.prescreen_ids)) {
    return normalizePrescreenIds(prescreen.prescreen_ids);
  }

  if (Array.isArray(prescreen?.prescreenIds)) {
    return normalizePrescreenIds(prescreen.prescreenIds);
  }

  if (prescreen?.prescreen_id != null) {
    const parsed = Number(prescreen.prescreen_id);
    return Number.isFinite(parsed) ? [parsed] : [];
  }

  const questionItems = getQuestionItemsFromRecord(prescreen);
  if (questionItems.length) {
    return questionItems
      .map((item) => item?.id)
      .filter((item) => item != null)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  return [];
}

/**
 * @param {object} prescreen
 */
export function mapPrescreenGroupToRow(prescreen) {
  const createdRaw = prescreen?.created_at ?? prescreen?.createdAt ?? "";
  const prescreenIds = extractPrescreenIdsFromRecord(prescreen);

  return {
    id: prescreen?.id,
    surveyTitle: prescreen?.survey_title ?? "",
    language: prescreen?.language ?? "",
    status: apiStatusToFormValue(prescreen?.status),
    prescreenIds,
    createdAt: createdRaw,
    createdDate: createdRaw,
  };
}

async function enrichPrescreenSurveyRecord(record) {
  if (!record) return record;

  const prescreenIds = extractPrescreenIdsFromRecord(record);
  const questionItems = getQuestionItemsFromRecord(record);

  if (questionItems.length > 0) {
    return {
      ...record,
      prescreen_ids: prescreenIds,
      questions: questionItems,
      prescreens: questionItems,
    };
  }

  const language = String(record.language ?? "").trim();

  if (language && prescreenIds.length > 0) {
    try {
      const questions = await getPrescreensByLanguage(language);
      const prescreens = prescreenIds.map((prescreenId) => {
        const match = questions.find((item) => String(item.id) === String(prescreenId));
        return (
          match ?? {
            id: prescreenId,
            question_title: record.selected_question_title ?? "",
          }
        );
      });

      return {
        ...record,
        prescreen_ids: prescreenIds,
        prescreens,
      };
    } catch {
      return {
        ...record,
        prescreen_ids: prescreenIds,
      };
    }
  }

  if (prescreenIds.length > 0) {
    return {
      ...record,
      prescreen_ids: prescreenIds,
    };
  }

  return record;
}

export function mapPrescreenGroupToForm(prescreen) {
  const prescreenIds = extractPrescreenIdsFromRecord(prescreen);
  const questionItems = getQuestionItemsFromRecord(prescreen);
  const selectedItem =
    questionItems.find((item) => String(item?.id) === String(prescreenIds[0])) ??
    questionItems[0];
  const selectedQuestionnaireLabel = String(
    selectedItem?.question_title ??
      selectedItem?.title ??
      prescreen?.selected_question_title ??
      ""
  ).trim();

  return {
    surveyTitle: prescreen?.survey_title ?? "",
    language: prescreen?.language ?? "",
    status: apiStatusToFormValue(prescreen?.status),
    selectedPrescreenId: prescreenIds[0] != null ? String(prescreenIds[0]) : "",
    selectedQuestionnaireLabel,
    prescreenIds,
  };
}

/** GET /api/prescreen-survey/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.prescreenSurvey.list, { page, limit, search })
  );
  assertSuccess(data);

  const prescreens = extractPrescreenSurveyList(data);
  const total = extractListTotalFromResponse(data, prescreens.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? 1,
    limit: data.limit ?? prescreens.length,
    totalPages: data.totalPages ?? 1,
    items: prescreens.map((prescreen) => mapPrescreenGroupToRow(prescreen)),
  };
}

/** GET /api/prescreen-survey/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizePrescreenSurveyId(id);

  try {
    const data = await apiRequest(API_ROUTES.prescreenSurvey.byId(normalizedId));
    assertSuccess(data);
    const record = extractPrescreenSurveyRecord(data);
    if (record) return enrichPrescreenSurveyRecord(record);
  } catch {
    // Fall back to list lookup below.
  }

  const data = await apiRequest(API_ROUTES.prescreenSurvey.list);
  assertSuccess(data);

  const prescreens = extractPrescreenSurveyList(data);
  const match = prescreens.find((prescreen) => String(prescreen.id) === String(id));
  if (!match) {
    throw new ApiError("Prescreen group not found", null);
  }

  return enrichPrescreenSurveyRecord(match);
}

/**
 * POST /api/prescreen-survey/add
 * @param {{
 *   surveyTitle: string,
 *   language: string,
 *   status: string,
 *   selectedPrescreenId?: string|number,
 *   prescreenIds?: Array<string|number>,
 * }} payload
 */
export async function createPrescreenGroup(payload) {
  const data = await apiRequest(API_ROUTES.prescreenSurvey.create, {
    method: "POST",
    body: buildPrescreenSurveyBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen-survey/:id
 * @param {string|number} id
 * @param {Parameters<typeof createPrescreenGroup>[0]} payload
 */
export async function updatePrescreenGroup(id, payload) {
  const normalizedId = normalizePrescreenSurveyId(id);
  const data = await apiRequest(API_ROUTES.prescreenSurvey.update(normalizedId), {
    method: "PUT",
    body: buildPrescreenSurveyBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/prescreen-survey/:id — status toggle from listing table only.
 * @param {string|number} id
 * @param {{
 *   surveyTitle?: string,
 *   language?: string,
 *   prescreenIds?: Array<string|number>,
 *   status: string,
 * }} payload
 */
export async function updatePrescreenGroupStatus(id, payload) {
  const normalizedId = normalizePrescreenSurveyId(id);
  const data = await apiRequest(API_ROUTES.prescreenSurvey.update(normalizedId), {
    method: "PUT",
    body: buildPrescreenSurveyBody({
      surveyTitle: payload.surveyTitle,
      language: payload.language,
      prescreenIds: payload.prescreenIds,
      selectedPrescreenId: payload.prescreenIds?.[0],
      status: payload.status,
    }),
  });

  return assertSuccess(data);
}
