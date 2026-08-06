/**
 * Public do-survey API layer.
 * Partner URL start flow: activity → pre-screen check → survey link redirect.
 */

import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { getAuthToken } from "../../../services/auth/authStorage";
import { findSupplierMappingByDoSurveyToken } from "../../survey/services/supplierMappingApi";

const MOCK_LOAD_DELAY_MS = 450;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function pickField(record, keys) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function coerceText(value) {
  return String(value ?? "").trim();
}

/**
 * Partner URL APIs may run with an admin session (opened from Partner Mapping)
 * or as a public gateway. Prefer auth when a token exists; never force logout.
 */
function partnerSurveyRequestOptions(extra = {}) {
  const hasToken = Boolean(getAuthToken());
  return {
    auth: hasToken,
    skipSessionExpiryOn401: true,
    ...extra,
  };
}

/** Maps supplier-mapping `IsTest` (0/1) to boolean — same rules as Partner Mapping tab. */
export function toDoSurveyIsTest(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on", "test"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "live"].includes(normalized)) return false;
  return fallback;
}

function formatLanguageForUi(language) {
  const slug = String(language ?? "").trim();
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

const DO_SURVEY_DISPLAY_DEFAULTS = {
  language: "English",
  loiMinutes: 15,
};

function withDoSurveyDisplayDefaults(details) {
  if (!details || typeof details !== "object") return details;

  const loiRaw = details.loiMinutes;
  const loiMinutes =
    loiRaw != null && loiRaw !== "" && Number.isFinite(Number(loiRaw))
      ? Number(loiRaw)
      : DO_SURVEY_DISPLAY_DEFAULTS.loiMinutes;

  return {
    ...details,
    language: String(details.language ?? "").trim() || DO_SURVEY_DISPLAY_DEFAULTS.language,
    loiMinutes,
  };
}

/**
 * Maps GET /api/dosurvey/:token response into the public start-page shape.
 * `IsTest` from supplier mapping drives Test vs Live badge.
 */
export function mapDoSurveyStartDetails(record, { token = "", uid = "" } = {}) {
  const safeToken = String(token ?? "").trim();
  const shortToken =
    safeToken.length > 8 ? `${safeToken.slice(0, 8)}…` : safeToken || "preview";

  return withDoSurveyDisplayDefaults({
    id: pickField(record, ["id", "mapping_id", "token"]) ?? safeToken,
    surveyTitle: String(
      pickField(record, [
        "surveyTitle",
        "survey_title",
        "project_name",
        "projectName",
        "title",
      ]) ?? "Market Research Survey"
    ).trim(),
    surveyDescription: String(
      pickField(record, [
        "surveyDescription",
        "survey_description",
        "description",
      ]) ??
        "You have been invited to share your opinions. Your responses are confidential and will be used for research purposes only."
    ).trim(),
    language: formatLanguageForUi(
      pickField(record, ["language", "Language", "project_language"])
    ),
    loiMinutes: pickField(record, ["loiMinutes", "loi", "LOI", "loi_minutes"]),
    irPercent: pickField(record, ["irPercent", "ir", "IR", "ir_percent"]),
    partnerCode: String(pickField(record, ["partner_code", "partnerCode"]) ?? "").trim(),
    isTest: toDoSurveyIsTest(
      pickField(record, ["IsTest", "is_test", "isTest", "test_mode"]),
      false
    ),
    meta: {
      token: safeToken,
      respondentUid: uid,
      previewLabel: shortToken,
    },
  });
}

function buildMockSurveyDetails(token, uid, { isTest = false } = {}) {
  return mapDoSurveyStartDetails(
    {
      surveyTitle: "Market Research Survey",
      surveyDescription:
        "You have been invited to share your opinions. Your responses are confidential and will be used for research purposes only.",
      language: "english",
      loiMinutes: 15,
      irPercent: 35,
      partnerCode: "P001",
      IsTest: isTest ? 1 : 0,
    },
    { token, uid }
  );
}

function extractDoSurveyRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.id != null || data.IsTest != null || data.isTest != null) {
    return data;
  }
  return null;
}

async function resolveStartDetailsFromSupplierMapping(token, uid) {
  if (!getAuthToken()) return null;

  try {
    const mappingRecord = await findSupplierMappingByDoSurveyToken(token);
    if (!mappingRecord) return null;
    return mapDoSurveyStartDetails(mappingRecord, { token, uid });
  } catch {
    return null;
  }
}

/**
 * GET /api/dosurvey/:token (planned)
 * Loads survey start-page details for a partner mapping link.
 */
export async function fetchDoSurveyStartDetails(token, { uid, isTest } = {}) {
  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) {
    throw new Error("Invalid survey link. Please check the URL and try again.");
  }

  if (normalizedToken.toLowerCase() === "invalid") {
    throw new Error("Survey not found. This link may be invalid or expired.");
  }

  try {
    const data = await apiRequest(API_ROUTES.doSurvey.byToken(normalizedToken), {
      auth: false,
    });
    assertSuccess(data);
    const record = extractDoSurveyRecord(data);
    if (!record) {
      throw new ApiError("Survey not found.", data);
    }
    return mapDoSurveyStartDetails(record, { token: normalizedToken, uid });
  } catch (error) {
    // Never serve mock survey details in production — respondents must see a real error.
    if (import.meta.env.PROD) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error?.message ||
          "Unable to load this survey. Please try again later.",
        null
      );
    }

    const fromMapping = await resolveStartDetailsFromSupplierMapping(
      normalizedToken,
      uid
    );
    if (fromMapping) {
      return withDoSurveyDisplayDefaults({
        ...fromMapping,
        isTest:
          isTest !== undefined && isTest !== null && String(isTest).trim() !== ""
            ? toDoSurveyIsTest(isTest, fromMapping.isTest)
            : fromMapping.isTest,
      });
    }

    await delay(MOCK_LOAD_DELAY_MS);
    return buildMockSurveyDetails(normalizedToken, uid, {
      isTest: toDoSurveyIsTest(isTest, false),
    });
  }
}

/**
 * POST /api/survey/activity
 * Creates an activity record before the survey begins.
 */
export async function storeSurveyActivity({ token, uid } = {}) {
  const normalizedToken = coerceText(token);
  const normalizedUid = coerceText(uid);

  if (!normalizedToken) {
    throw new ApiError("Missing survey token.", null);
  }
  if (!normalizedUid) {
    throw new ApiError("Missing or Invalid UID in Link", null);
  }

  const data = await apiRequest(API_ROUTES.survey.activity, {
    ...partnerSurveyRequestOptions({ method: "POST" }),
    body: {
      token: normalizedToken,
      uid: normalizedUid,
    },
  });
  assertSuccess(data);
  return data;
}

function mapPrescreenQuestion(record) {
  if (!record || typeof record !== "object") return null;
  const id = pickField(record, ["id", "question_id", "questionId"]);
  if (id == null) return null;

  const optionsRaw = record.options;
  const options = Array.isArray(optionsRaw)
    ? optionsRaw.map((option) => {
        if (typeof option === "string" || typeof option === "number") {
          return String(option);
        }
        if (option && typeof option === "object") {
          return (
            option.label ??
            option.value ??
            option.option ??
            option.name ??
            String(option.id ?? "")
          );
        }
        return String(option ?? "");
      })
    : [];

  return {
    id,
    questionText: coerceText(
      pickField(record, [
        "question_title",
        "questionTitle",
        "question_text",
        "questionText",
        "title",
      ])
    ),
    questionType: coerceText(
      pickField(record, ["question_type", "questionType", "type"])
    ),
    options,
    rightAnswer: pickField(record, [
      "right_answer",
      "rightAnswer",
      "correct_answer",
      "correctAnswer",
    ]),
    required: true,
  };
}

/**
 * Maps GET /api/survey/prescreen response into UI-ready shape.
 */
export function mapSurveyPrescreenResponse(data) {
  const required =
    data?.required === true ||
    data?.required === 1 ||
    data?.required === "true" ||
    data?.required === "1";

  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const questionsRaw = Array.isArray(payload?.questions) ? payload.questions : [];
  const questions = questionsRaw.map(mapPrescreenQuestion).filter(Boolean);

  return {
    required,
    message: coerceText(data?.message),
    surveyTitle: coerceText(
      pickField(payload, [
        "surveyTitle",
        "survey_title",
        "PreScreenName",
        "preScreenName",
      ])
    ),
    language: formatLanguageForUi(
      pickField(payload, ["language", "Language"])
    ),
    preScreenId: pickField(payload, [
      "PreScreenid",
      "PreScreenId",
      "preScreenerId",
      "pre_screen_id",
    ]),
    questions,
    raw: data,
  };
}

/**
 * GET /api/survey/prescreen?token=<partner_token>
 */
export async function fetchSurveyPrescreen(token) {
  const normalizedToken = coerceText(token);
  if (!normalizedToken) {
    throw new ApiError("Missing survey token.", null);
  }

  const path = `${API_ROUTES.survey.prescreen}?token=${encodeURIComponent(normalizedToken)}`;
  const data = await apiRequest(path, partnerSurveyRequestOptions());
  assertSuccess(data);
  return mapSurveyPrescreenResponse(data);
}

/**
 * Extract redirect URL from GET /api/survey/link response.
 * Prefer survey_url; fall back to Live_Link.
 */
export function extractSurveyRedirectUrl(data) {
  if (!data || typeof data !== "object") return "";

  const payload =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  return coerceText(
    pickField(payload, [
      "survey_url",
      "surveyUrl",
      "Survey_URL",
      "Live_Link",
      "live_link",
      "LiveLink",
      "liveLink",
    ])
  );
}

/**
 * GET /api/survey/link?token=<partner_token>&uid=<partner_uid>
 */
export async function fetchSurveyLink({ token, uid } = {}) {
  const normalizedToken = coerceText(token);
  const normalizedUid = coerceText(uid);

  if (!normalizedToken) {
    throw new ApiError("Missing survey token.", null);
  }
  if (!normalizedUid) {
    throw new ApiError("Missing or Invalid UID in Link", null);
  }

  const params = new URLSearchParams({
    token: normalizedToken,
    uid: normalizedUid,
  });
  const path = `${API_ROUTES.survey.link}?${params.toString()}`;
  const data = await apiRequest(path, partnerSurveyRequestOptions());
  assertSuccess(data);

  const surveyUrl = extractSurveyRedirectUrl(data);
  if (!surveyUrl) {
    throw new ApiError(
      "Survey URL missing from response. Please try again.",
      data
    );
  }

  return {
    success: true,
    message: coerceText(data?.message) || "Survey link fetched successfully!",
    surveyUrl,
    liveLink: coerceText(
      pickField(
        data?.data && typeof data.data === "object" ? data.data : data,
        ["Live_Link", "live_link", "LiveLink", "liveLink"]
      )
    ),
    data: data?.data ?? data,
  };
}

/**
 * Start Survey orchestration:
 * 1) POST /api/survey/activity
 * 2) GET /api/survey/prescreen
 * Returns either { prescreenRequired: true, prescreen } or { prescreenRequired: false }
 * so the page can render pre-screen or continue to the survey link.
 */
export async function initiateSurveyStart({ token, uid } = {}) {
  await storeSurveyActivity({ token, uid });
  const prescreen = await fetchSurveyPrescreen(token);

  if (prescreen.required) {
    return {
      prescreenRequired: true,
      prescreen,
    };
  }

  return {
    prescreenRequired: false,
    prescreen,
  };
}
