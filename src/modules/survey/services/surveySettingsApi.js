import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";

/**
 * @typedef {import("../types/surveySettings").SurveySettingsLanguage} SurveySettingsLanguage
 * @typedef {import("../types/surveySettings").SurveySettingRecord} SurveySettingRecord
 * @typedef {import("../types/surveySettings").SurveySettingByLanguageResponse} SurveySettingByLanguageResponse
 * @typedef {import("../types/surveySettings").SurveySettingsUpdateRequest} SurveySettingsUpdateRequest
 * @typedef {import("../types/surveySettings").SurveySettingsUpdateResponse} SurveySettingsUpdateResponse
 * @typedef {import("../types/surveySettings").SurveySettingsContentKey} SurveySettingsContentKey
 * @typedef {import("../types/surveySettings").SurveySettingsFormValues} SurveySettingsFormValues
 * @typedef {import("../types/surveySettings").SurveySettingsDetails} SurveySettingsDetails
 */

/**
 * survey_settings row id per language. PUT /api/survey-settings/:id is built from this map.
 * @type {Readonly<Record<SurveySettingsLanguage, number>>}
 */
export const SURVEY_SETTINGS_LANGUAGE_IDS = Object.freeze({
  English: 1,
  Spanish: 2,
  French: 3,
  German: 4,
  Korean: 5,
  Chinese: 6,
  Hindi: 7,
  Japanese: 8,
});

/** @type {readonly SurveySettingsLanguage[]} */
export const SURVEY_SETTINGS_LANGUAGES = Object.freeze(
  /** @type {SurveySettingsLanguage[]} */ (Object.keys(SURVEY_SETTINGS_LANGUAGE_IDS))
);

export const DEFAULT_SURVEY_SETTINGS_LANGUAGE = "English";

/**
 * Form key → API field for every redirect status stored on a language record.
 * @type {ReadonlyArray<readonly [SurveySettingsContentKey, keyof SurveySettingsUpdateRequest]>}
 */
export const SURVEY_SETTINGS_CONTENT_FIELD_MAP = Object.freeze([
  ["completeRedirect", "complete_redirect_content"],
  ["terminateRedirect", "terminate_redirect_content"],
  ["qualityTermRedirect", "quality_term_redirect_content"],
  ["surveyCloseRedirect", "survey_close_redirect_content"],
]);

/** @type {readonly SurveySettingsContentKey[]} */
export const SURVEY_SETTINGS_CONTENT_KEYS = Object.freeze(
  SURVEY_SETTINGS_CONTENT_FIELD_MAP.map(([formKey]) => formKey)
);

/**
 * @param {string} [language]
 * @returns {SurveySettingsFormValues}
 */
export function createEmptySurveySettingsForm(language = "") {
  return {
    language: String(language ?? "").trim(),
    completeRedirect: "",
    terminateRedirect: "",
    qualityTermRedirect: "",
    surveyCloseRedirect: "",
  };
}

/**
 * Case-insensitive match against the supported languages.
 * @param {unknown} language
 * @returns {SurveySettingsLanguage | null}
 */
export function resolveSurveySettingsLanguage(language) {
  const wanted = String(language ?? "").trim().toLowerCase();
  if (!wanted) return null;
  return SURVEY_SETTINGS_LANGUAGES.find((name) => name.toLowerCase() === wanted) ?? null;
}

/**
 * @param {unknown} language
 * @returns {number | null}
 */
export function getSurveySettingsIdForLanguage(language) {
  const canonical = resolveSurveySettingsLanguage(language);
  return canonical ? SURVEY_SETTINGS_LANGUAGE_IDS[canonical] : null;
}

/**
 * @param {unknown} language
 * @returns {SurveySettingsLanguage}
 */
function requireSupportedLanguage(language) {
  const canonical = resolveSurveySettingsLanguage(language);
  if (canonical) return canonical;

  const label = String(language ?? "").trim();
  throw new ApiError(
    label
      ? `Survey settings are not available for "${label}". Supported languages: ${SURVEY_SETTINGS_LANGUAGES.join(", ")}.`
      : "Select a language to manage survey settings.",
    null,
    400
  );
}

/**
 * @param {unknown} data
 * @param {string} fallbackMessage
 */
function assertSuccess(data, fallbackMessage) {
  if (!data || typeof data !== "object") {
    throw new ApiError(fallbackMessage, data ?? null);
  }
  const { success } = /** @type {{ success?: unknown }} */ (data);
  if ("success" in data && success !== true && success !== "true" && success !== 1) {
    const message = /** @type {{ message?: unknown }} */ (data).message;
    throw new ApiError(String(message ?? "").trim() || fallbackMessage, data);
  }
  return data;
}

/** @param {unknown} value */
function toContentString(value) {
  return value == null ? "" : String(value);
}

/**
 * Maps the GET record to page form values and rejects records that belong to
 * another language or a different row than the PUT map points at.
 *
 * @param {SurveySettingRecord | null | undefined} record
 * @param {SurveySettingsLanguage} expectedLanguage
 * @returns {SurveySettingsDetails}
 */
export function mapSurveySettingRecord(record, expectedLanguage) {
  if (!record || typeof record !== "object") {
    throw new ApiError(
      `Survey settings response for ${expectedLanguage} did not include any data.`,
      record ?? null
    );
  }

  const returnedLanguage = String(record.language ?? "").trim();
  if (returnedLanguage.toLowerCase() !== expectedLanguage.toLowerCase()) {
    throw new ApiError(
      `Requested ${expectedLanguage} survey settings but the API returned "${returnedLanguage || "unknown"}".`,
      record
    );
  }

  const expectedId = SURVEY_SETTINGS_LANGUAGE_IDS[expectedLanguage];
  if (Number(record.id) !== expectedId) {
    throw new ApiError(
      `${expectedLanguage} survey settings have id ${record.id ?? "unknown"} but id ${expectedId} is expected. Saving is blocked to avoid overwriting another language.`,
      record
    );
  }

  /** @type {SurveySettingsDetails} */
  const details = {
    ...createEmptySurveySettingsForm(expectedLanguage),
    id: expectedId,
    language: expectedLanguage,
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
  };

  SURVEY_SETTINGS_CONTENT_FIELD_MAP.forEach(([formKey, apiKey]) => {
    details[formKey] = toContentString(record[apiKey]);
  });

  return details;
}

/**
 * GET /api/survey-settings/public/language/:language
 * @param {unknown} language
 * @returns {Promise<SurveySettingsDetails>}
 */
export async function getSurveySettingsByLanguage(language) {
  const canonical = requireSupportedLanguage(language);
  /** @type {SurveySettingByLanguageResponse} */
  const data = await apiRequest(API_ROUTES.surveySettings.byLanguage(canonical));
  assertSuccess(data, `Unable to load ${canonical} survey settings.`);
  return mapSurveySettingRecord(data.data, canonical);
}

/**
 * PUT /api/survey-settings/:id body. HTML is sent as-is (only outer whitespace trimmed).
 * @param {Partial<SurveySettingsFormValues>} [form]
 * @returns {SurveySettingsUpdateRequest}
 */
export function buildSurveySettingsUpdatePayload(form = {}) {
  /** @type {SurveySettingsUpdateRequest} */
  const payload = {
    complete_redirect_content: "",
    terminate_redirect_content: "",
    quality_term_redirect_content: "",
    survey_close_redirect_content: "",
  };
  SURVEY_SETTINGS_CONTENT_FIELD_MAP.forEach(([formKey, apiKey]) => {
    payload[apiKey] = String(form[formKey] ?? "").trim();
  });
  return payload;
}

/**
 * PUT /api/survey-settings/:id, with :id resolved from the selected language.
 * @param {unknown} language
 * @param {Partial<SurveySettingsFormValues>} form
 * @returns {Promise<SurveySettingsUpdateResponse>}
 */
export async function updateSurveySettingsByLanguage(language, form) {
  const canonical = requireSupportedLanguage(language);
  const id = SURVEY_SETTINGS_LANGUAGE_IDS[canonical];
  /** @type {SurveySettingsUpdateResponse} */
  const data = await apiRequest(API_ROUTES.surveySettings.update(id), {
    method: "PUT",
    body: buildSurveySettingsUpdatePayload(form),
  });
  assertSuccess(data, `Unable to update ${canonical} survey settings.`);
  return data;
}

/**
 * Content keys whose persisted value differs from what was sent in the PUT.
 * @param {SurveySettingsUpdateRequest} sent
 * @param {SurveySettingsFormValues} persisted
 * @returns {SurveySettingsContentKey[]}
 */
export function findUnpersistedContentKeys(sent, persisted) {
  return SURVEY_SETTINGS_CONTENT_FIELD_MAP.filter(
    ([formKey, apiKey]) =>
      String(persisted?.[formKey] ?? "").trim() !== String(sent?.[apiKey] ?? "").trim()
  ).map(([formKey]) => formKey);
}
