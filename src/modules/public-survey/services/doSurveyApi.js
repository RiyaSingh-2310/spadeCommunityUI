/**
 * Public do-survey API layer.
 * Replace mock implementation with real endpoints once backend contract is finalized.
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
 * POST /api/dosurvey/:token/start (planned)
 * Records respondent entry and returns the next survey URL or session payload.
 */
export async function startDoSurvey(token, { uid } = {}) {
  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) {
    throw new Error("Invalid survey link. Please check the URL and try again.");
  }

  // TODO: wire to API_ROUTES.doSurvey.start(token) with auth: false
  await delay(MOCK_LOAD_DELAY_MS);

  return {
    success: true,
    message: "Survey session started.",
    data: {
      token: normalizedToken,
      respondentUid: uid,
      nextUrl: null,
    },
  };
}
