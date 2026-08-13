/**
 * Public do-survey API layer.
 * Partner URL start flow: activity → pre-screen check → survey link redirect.
 */

import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { getAuthToken } from "../../../services/auth/authStorage";
import { findSupplierMappingByDoSurveyToken } from "../../survey/services/supplierMappingApi";
import { dedupeQuestionsByIdentity } from "../../survey/utils/dedupeSelectOptions";
import { isLocalSurveyOutcomeUrl, getSurveyOutcomeKeyFromUrl } from "../utils/surveyFlowParams";

const MOCK_LOAD_DELAY_MS = 450;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isApiSuccess(data) {
  const value = data?.success;
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

function assertSuccess(data) {
  if (!isApiSuccess(data)) {
    throw new ApiError(
      coerceText(data?.message) || "Request failed. Please try again.",
      data
    );
  }
  return data;
}

function isSuccessOnlyMessage(message) {
  const text = coerceText(message).toLowerCase();
  if (!text) return false;
  return (
    text === "ok" ||
    text === "done" ||
    text === "success" ||
    /successfully!?$/.test(text) ||
    text.includes("fetched successfully") ||
    text.includes("initiated successfully")
  );
}

function toFlowErrorMessage(error, fallback) {
  const raw = coerceText(error?.message);
  if (!raw || isSuccessOnlyMessage(raw)) {
    return fallback;
  }
  return raw;
}

function isInactiveSurveyStatus(status) {
  const key = coerceText(status).toLowerCase();
  if (!key) return false;
  return [
    "inactive",
    "closed",
    "expired",
    "disabled",
    "paused",
    "stopped",
    "cancelled",
    "canceled",
  ].includes(key);
}

/**
 * Prefer survey_url, then Live_Link. Never invent a URL.
 */
export function resolveSurveyLaunchUrl(data) {
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
 * Absolute http(s) customer/vendor survey URLs only.
 * Rejects local outcome routes and non-navigable values.
 * Returns the exact input URL string (does not rewrite it).
 */
export function assertExternalSurveyLaunchUrl(surveyUrl, data = null) {
  const url = coerceText(surveyUrl);
  if (!url) {
    throw new ApiError(
      "Unable to start the survey. Survey link is unavailable.",
      data
    );
  }

  if (isLocalSurveyOutcomeUrl(url)) {
    throw new ApiError(
      "Unable to start the survey. Survey link is unavailable.",
      data
    );
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new ApiError(
      "Unable to start the survey. Survey link is invalid.",
      data
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiError(
      "Unable to start the survey. Survey link is invalid.",
      data
    );
  }

  return url;
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
 * Maps Partner URL / supplier-mapping fields into the public start-page shape.
 * `IsTest` from supplier mapping drives Test vs Live badge.
 */
export function mapDoSurveyStartDetails(
  record,
  {
    token = "",
    uid = "",
    projectId = "",
    projectUrlId = "",
    projectUrlCode = "",
    partnerId = "",
  } = {}
) {
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
      projectId:
        String(projectId ?? "").trim() ||
        String(
          pickField(record, ["projectId", "project_id", "projectid"]) ?? ""
        ).trim(),
      projectUrlId:
        String(projectUrlId ?? "").trim() ||
        String(
          pickField(record, ["projectUrlId", "project_url_id", "url_id"]) ?? ""
        ).trim(),
      projectUrlCode:
        String(projectUrlCode ?? "").trim() ||
        String(
          pickField(record, ["projectUrlCode", "project_url_code", "urlCode"]) ??
            ""
        ).trim(),
      partnerId:
        String(partnerId ?? "").trim() ||
        String(
          pickField(record, ["partnerId", "partner_id", "partnerid"]) ?? ""
        ).trim(),
      previewLabel: shortToken,
    },
  });
}

function buildMockSurveyDetails(
  token,
  uid,
  {
    isTest = false,
    projectId = "",
    projectUrlId = "",
    projectUrlCode = "",
    partnerId = "",
  } = {}
) {
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
    { token, uid, projectId, projectUrlId, projectUrlCode, partnerId }
  );
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
 * Load Do Survey start-page display details for a Partner URL.
 *
 * Never call backend GET /dosurvey/:token — that route redirects to Live/Test
 * (and must not run on open). Never call /api/survey/status or any complete API.
 * Survey start APIs (activity + pre-screen) run only when the user starts.
 */
export async function fetchDoSurveyStartDetails(
  token,
  {
    uid,
    isTest,
    projectId = "",
    projectUrlId = "",
    projectUrlCode = "",
    partnerId = "",
  } = {}
) {
  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) {
    throw new Error("Invalid survey link. Please check the URL and try again.");
  }

  if (normalizedToken.toLowerCase() === "invalid") {
    throw new Error("Survey not found. This link may be invalid or expired.");
  }

  const flowMeta = { projectId, projectUrlId, projectUrlCode, partnerId };
  const applyFlowMeta = (details) =>
    withDoSurveyDisplayDefaults({
      ...details,
      isTest:
        isTest !== undefined && isTest !== null && String(isTest).trim() !== ""
          ? toDoSurveyIsTest(isTest, details.isTest)
          : details.isTest,
      meta: {
        ...details.meta,
        ...Object.fromEntries(
          Object.entries(flowMeta).filter(([, value]) =>
            String(value ?? "").trim()
          )
        ),
      },
    });

  const fromMapping = await resolveStartDetailsFromSupplierMapping(
    normalizedToken,
    uid
  );
  if (fromMapping) {
    return applyFlowMeta(fromMapping);
  }

  // Public / no mapping match: show the start page shell. Token + uid are
  // validated by POST /api/survey/activity and GET /api/survey/prescreen on start.
  if (!import.meta.env.PROD) {
    await delay(MOCK_LOAD_DELAY_MS);
  }

  return applyFlowMeta(
    buildMockSurveyDetails(normalizedToken, uid, {
      isTest: toDoSurveyIsTest(isTest, false),
      ...flowMeta,
    })
  );
}

/**
 * POST /api/survey/activity
 * Creates an activity record before the survey begins.
 * Contract body: { token, uid } only — do not invent or hardcode either value.
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

/** Alias — Partner URL Start Survey activity step. */
export const startSurveyActivity = storeSurveyActivity;

function isTruthyFlag(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
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
 * Explicit `required: false` wins. Otherwise treat required/PreScreen flags as enabled.
 */
export function mapSurveyPrescreenResponse(data) {
  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const requiredRaw = data?.required;
  const explicitlyNotRequired =
    requiredRaw === false ||
    requiredRaw === 0 ||
    requiredRaw === "0" ||
    String(requiredRaw ?? "")
      .trim()
      .toLowerCase() === "false";

  const preScreenFlag = pickField(payload, [
    "PreScreen",
    "preScreen",
    "prescreen",
    "pre_screen",
  ]);

  const required = explicitlyNotRequired
    ? false
    : isTruthyFlag(requiredRaw) || isTruthyFlag(preScreenFlag);

  const questionsRaw = Array.isArray(payload?.questions) ? payload.questions : [];
  const questions = dedupeQuestionsByIdentity(
    questionsRaw.map(mapPrescreenQuestion).filter(Boolean)
  );

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

/** Alias — Partner URL Start Survey pre-screen check. */
export const checkSurveyPreScreen = fetchSurveyPrescreen;

/**
 * Extract redirect URL from GET /api/survey/link response.
 * Prefer survey_url; fall back to Live_Link.
 */
export function extractSurveyRedirectUrl(data) {
  return resolveSurveyLaunchUrl(data);
}

/**
 * GET /api/survey/link?token=<partner_token>&uid=<partner_uid>
 * Contract query: token + uid only. Redirect prefers survey_url, then Live_Link.
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

  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const status = pickField(payload, ["Status", "status"]);
  if (isInactiveSurveyStatus(status)) {
    throw new ApiError(
      "Unable to load the survey. This survey is not currently active.",
      data
    );
  }

  const resolvedUrl = resolveSurveyLaunchUrl(data);
  const outcomeKey = getSurveyOutcomeKeyFromUrl(resolvedUrl);

  // Outcome / redirect URLs (any host) are handled in-app — do not require
  // an external customer survey URL and do not navigate to production domains.
  if (outcomeKey) {
    return {
      success: true,
      message: coerceText(data?.message) || "Survey link fetched successfully!",
      surveyUrl: resolvedUrl,
      outcomeKey,
      liveLink: coerceText(
        pickField(payload, ["Live_Link", "live_link", "LiveLink", "liveLink"])
      ),
      data: payload,
    };
  }

  const surveyUrl = assertExternalSurveyLaunchUrl(resolvedUrl, data);

  return {
    success: true,
    message: coerceText(data?.message) || "Survey link fetched successfully!",
    surveyUrl,
    outcomeKey: "",
    liveLink: coerceText(
      pickField(payload, ["Live_Link", "live_link", "LiveLink", "liveLink"])
    ),
    data: payload,
  };
}

/** Alias — Partner URL Start Survey main link step. */
export const getMainSurveyLink = fetchSurveyLink;
export const getSurveyLink = fetchSurveyLink;

/**
 * Navigate to the customer/vendor survey URL (external).
 * Uses location.href — never React Router.
 */
export function openCustomerSurveyUrl(surveyUrl, data = null) {
  const url = assertExternalSurveyLaunchUrl(surveyUrl, data);
  window.location.href = url;
}

/**
 * Start Survey orchestration (Partner URL):
 * 1) POST /api/survey/activity — create/initiate activity
 * 2) GET /api/survey/prescreen — whether Pre-Screen is required
 *
 * Do not call /api/survey/status, /complete, or any API that marks the survey
 * completed. Outcome/complete handling is wired later when provided.
 *
 * Returns { prescreenRequired, prescreen } so the page can show Pre-Screen or
 * continue to GET /api/survey/link.
 */
export async function initiateSurveyStart({ token, uid } = {}) {
  await startSurveyActivity({ token, uid });
  const prescreen = await checkSurveyPreScreen(token);

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

export { toFlowErrorMessage };
