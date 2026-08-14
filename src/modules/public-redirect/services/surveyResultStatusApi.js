/**
 * Public survey result status APIs.
 * Each independent result page calls only its matching endpoint.
 */

import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { getAuthToken } from "../../../services/auth/authStorage";
import { normalizeSurveyOutcomeKey } from "../../public-survey/utils/surveyFlowParams";

export const SURVEY_RESULT_STATUS_KIND = {
  COMPLETE: "complete",
  TERMINATE: "terminate",
  QUOTA: "quota",
  QUALITY: "quality",
  CLOSED: "closed",
};

const STATUS_ROUTES = {
  [SURVEY_RESULT_STATUS_KIND.COMPLETE]: API_ROUTES.survey.complete,
  [SURVEY_RESULT_STATUS_KIND.TERMINATE]: API_ROUTES.survey.terminate,
  [SURVEY_RESULT_STATUS_KIND.QUOTA]: API_ROUTES.survey.quota,
  [SURVEY_RESULT_STATUS_KIND.QUALITY]: API_ROUTES.survey.quality,
  [SURVEY_RESULT_STATUS_KIND.CLOSED]: API_ROUTES.survey.closed,
};

/** In-flight / completed requests — one status call per page load (kind+pid+uid). */
const statusRequestCache = new Map();

function coerceText(value) {
  return String(value ?? "").trim();
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
      coerceText(data?.message) || "Unable to update survey status. Please try again.",
      data
    );
  }
  return data;
}

function unwrapPayload(data) {
  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return data && typeof data === "object" ? data : {};
}

function pickField(record, keys) {
  if (!record || typeof record !== "object") return "";
  for (const key of keys) {
    if (record[key] != null && String(record[key]).trim() !== "") {
      return record[key];
    }
  }
  return "";
}

/**
 * Use the exact redirect_url from the API payload. Never invent a destination.
 */
export function extractSurveyResultRedirectUrl(data) {
  const payload = unwrapPayload(data);
  return coerceText(
    pickField(payload, ["redirect_url", "redirectUrl", "Redirect_Url", "RedirectUrl"])
  );
}

function publicResultRequestOptions() {
  const hasToken = Boolean(getAuthToken());
  return {
    auth: hasToken,
    skipSessionExpiryOn401: true,
  };
}

/**
 * Map a result-page outcome path to the matching status API kind.
 * @param {unknown} outcome
 * @returns {string}
 */
export function resolveSurveyResultStatusKind(outcome) {
  const key = normalizeSurveyOutcomeKey(outcome);
  if (key === "complete") return SURVEY_RESULT_STATUS_KIND.COMPLETE;
  if (key === "terminate") return SURVEY_RESULT_STATUS_KIND.TERMINATE;
  if (key === "quota-full") return SURVEY_RESULT_STATUS_KIND.QUOTA;
  if (key === "qualityterm") return SURVEY_RESULT_STATUS_KIND.QUALITY;
  if (key === "surveyclose") return SURVEY_RESULT_STATUS_KIND.CLOSED;
  return "";
}

function statusCacheKey(kind, pid, uid) {
  return `${kind}|${pid}|${uid}`;
}

/**
 * GET /api/survey/{complete|terminate|quota|quality|closed}?pid=&uid=
 * Dedupes identical in-flight/completed calls for the same page load.
 *
 * @param {{ kind: string, pid: string, uid: string }} input
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   surveyStatus: string,
 *   pid: string,
 *   uid: string,
 *   redirectUrl: string,
 *   data: object,
 * }>}
 */
export async function updateSurveyResultStatus({ kind, pid, uid } = {}) {
  const normalizedKind = coerceText(kind).toLowerCase();
  const route = STATUS_ROUTES[normalizedKind];
  const normalizedPid = coerceText(pid);
  const normalizedUid = coerceText(uid);

  if (!route) {
    throw new ApiError("This survey result link is not recognized.", null);
  }
  if (!normalizedPid || !normalizedUid) {
    throw new ApiError(
      "This result link is missing a required survey identifier (PID or UID).",
      null
    );
  }

  const cacheKey = statusCacheKey(normalizedKind, normalizedPid, normalizedUid);
  const cached = statusRequestCache.get(cacheKey);
  if (cached) return cached;

  const request = (async () => {
    const params = new URLSearchParams({
      pid: normalizedPid,
      uid: normalizedUid,
    });
    const data = await apiRequest(
      `${route}?${params.toString()}`,
      publicResultRequestOptions()
    );
    assertSuccess(data);

    const payload = unwrapPayload(data);
    return {
      success: true,
      message:
        coerceText(data?.message) || "Survey status updated successfully.",
      surveyStatus: coerceText(
        pickField(payload, ["surveyStatus", "survey_status", "status", "Status"])
      ),
      pid: coerceText(pickField(payload, ["pid"])) || normalizedPid,
      uid: coerceText(pickField(payload, ["uid"])) || normalizedUid,
      redirectUrl: extractSurveyResultRedirectUrl(data),
      data: payload,
    };
  })();

  statusRequestCache.set(cacheKey, request);
  return request;
}

export function clearSurveyResultStatusCache({ kind, pid, uid } = {}) {
  if (kind && pid && uid) {
    statusRequestCache.delete(
      statusCacheKey(coerceText(kind).toLowerCase(), coerceText(pid), coerceText(uid))
    );
    return;
  }
  statusRequestCache.clear();
}
