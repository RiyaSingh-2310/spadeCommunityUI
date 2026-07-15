import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { apiToUiQuestionType } from "../question-library/questionLibraryApi";

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

function normalizePublicGroupId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Questionnaire not found", null);
  }
  return encodeURIComponent(normalizedId);
}

function formatLanguageForUi(language) {
  const slug = String(language ?? "").trim();
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

function mapPublicQuestionOptions(options) {
  if (options == null || options === "") return [];

  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];
    try {
      return mapPublicQuestionOptions(JSON.parse(trimmed));
    } catch {
      return trimmed
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ label: line, value: line }));
    }
  }

  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (option == null) return null;
      if (typeof option === "string") {
        const trimmed = option.trim();
        return trimmed ? { label: trimmed, value: trimmed } : null;
      }
      if (typeof option === "object") {
        const label = String(
          option.option_text ?? option.optionText ?? option.label ?? option.value ?? ""
        ).trim();
        const value = String(option.value ?? label).trim();
        if (!label && !value) return null;
        return { label: label || value, value: value || label };
      }
      const asString = String(option).trim();
      return asString ? { label: asString, value: asString } : null;
    })
    .filter(Boolean);
}

function mapPublicQuestion(item) {
  if (!item || item.id == null) return null;

  const questionTitle = String(
    item.question_title ?? item.questionTitle ?? item.title ?? ""
  ).trim();

  return {
    id: item.id,
    questionText: questionTitle,
    questionTitle,
    questionType: apiToUiQuestionType(item.question_type ?? item.questionType),
    required: Boolean(item.is_required ?? item.required ?? item.isRequired ?? true),
    options: mapPublicQuestionOptions(item.options),
  };
}

function extractPublicQuestionnaire(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return null;
}

export function formatAnswerForSubmit(question, value) {
  if (question?.questionType === "Checkbox") {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
    }
    return String(value ?? "").trim();
  }
  return String(value ?? "").trim();
}

export function buildPublicSubmitPayload({ panelistId, questions, answers }) {
  const panelist_id = Number(panelistId);
  if (!Number.isFinite(panelist_id)) {
    throw new ApiError("Missing panelist information. Please use a valid questionnaire link.", null);
  }

  return {
    panelist_id,
    answers: (questions ?? []).map((question) => ({
      question_id: Number(question.id),
      question_title: String(question.questionTitle ?? question.questionText ?? "").trim(),
      answer: formatAnswerForSubmit(question, answers?.[question.id]),
    })),
  };
}

/** GET /api/questionnaire-group/public/:id/questions */
export async function fetchPublicQuestionnaire(id) {
  const normalizedId = normalizePublicGroupId(id);
  const data = await apiRequest(API_ROUTES.questionnaireGroup.publicQuestions(normalizedId), {
    auth: false,
  });
  assertSuccess(data);

  const record = extractPublicQuestionnaire(data);
  if (!record) {
    throw new ApiError("Questionnaire not found", null);
  }

  const questions = Array.isArray(record.questions)
    ? record.questions.map(mapPublicQuestion).filter(Boolean)
    : [];

  return {
    id: record.id ?? id,
    surveyTitle: String(record.surveyTitle ?? record.survey_title ?? "").trim(),
    surveyDescription: String(
      record.surveyDescription ?? record.survey_description ?? record.description ?? ""
    ).trim(),
    language: formatLanguageForUi(record.language),
    questions,
  };
}

/** POST /api/questionnaire-group/public/:id/submit */
export async function submitPublicQuestionnaire(id, { panelistId, questions, answers }) {
  const normalizedId = normalizePublicGroupId(id);
  const body = buildPublicSubmitPayload({ panelistId, questions, answers });

  const data = await apiRequest(API_ROUTES.questionnaireGroup.publicSubmit(normalizedId), {
    method: "POST",
    body,
    auth: false,
  });

  return assertSuccess(data);
}
