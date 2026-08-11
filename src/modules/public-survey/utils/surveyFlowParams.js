/**
 * Read and preserve survey-flow identifiers from the URL (path + query).
 * Never invents or hardcodes UID / Project URL values.
 */

const UID_QUERY_KEYS = [
  "uid",
  "identifier",
  "participant_id",
  "participantId",
  "respondent_id",
  "respondentId",
];

const PROJECT_ID_KEYS = ["projectId", "project_id", "pid", "projectid"];
const PROJECT_URL_ID_KEYS = [
  "projectUrlId",
  "project_url_id",
  "urlId",
  "url_id",
  "projecturlid",
];
const PROJECT_URL_CODE_KEYS = [
  "projectUrlCode",
  "project_url_code",
  "urlCode",
  "url_code",
];
const PARTNER_ID_KEYS = ["partnerId", "partner_id", "partnerid"];
const TOKEN_KEYS = ["token", "partnerToken", "partner_token"];

function firstParam(params, keys) {
  if (!params) return "";
  for (const key of keys) {
    const value = params.get?.(key);
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

/**
 * @param {string|URLSearchParams|null|undefined} search
 * @returns {URLSearchParams}
 */
export function toSearchParams(search) {
  if (search instanceof URLSearchParams) return search;
  const raw = String(search ?? "");
  const query = raw.startsWith("?") ? raw.slice(1) : raw;
  try {
    return new URLSearchParams(query);
  } catch {
    return new URLSearchParams();
  }
}

/**
 * Normalize respondent UID — template placeholders count as missing.
 * Exact placeholder matches are case-insensitive; any value starting with XXX is invalid.
 * @param {unknown} value
 */
export function isUidPlaceholderValue(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  const key = trimmed.toLowerCase();
  if (
    key === "identifier" ||
    key === "[identifier]" ||
    key === "{identifier}"
  ) {
    return true;
  }
  // XXX, XXXriya, XXX123, XXXABC, etc.
  if (key.startsWith("xxx")) {
    return true;
  }
  return false;
}

/**
 * Normalize respondent UID — template placeholders count as missing.
 * @param {unknown} value
 */
export function normalizeFlowUid(value) {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (isUidPlaceholderValue(trimmed)) return "";
  return trimmed;
}

/**
 * True when any known UID query param still holds a placeholder token.
 * @param {string|URLSearchParams|null|undefined} search
 */
export function urlHasUidPlaceholder(search) {
  const params = toSearchParams(search);
  for (const key of UID_QUERY_KEYS) {
    if (!params.has(key)) continue;
    if (isUidPlaceholderValue(params.get(key))) return true;
  }
  return false;
}

/**
 * Collect flow identifiers from path token + query string.
 * @param {{ token?: string, search?: string|URLSearchParams, pathUid?: string }} input
 */
export function readSurveyFlowParams({
  token = "",
  search = "",
  pathUid = "",
} = {}) {
  const params = toSearchParams(search);
  const pathToken = String(token ?? "").trim();
  const queryToken = firstParam(params, TOKEN_KEYS);

  return {
    token: pathToken || queryToken,
    uid: normalizeFlowUid(pathUid) || normalizeFlowUid(firstParam(params, UID_QUERY_KEYS)),
    projectId: firstParam(params, PROJECT_ID_KEYS),
    projectUrlId: firstParam(params, PROJECT_URL_ID_KEYS),
    projectUrlCode: firstParam(params, PROJECT_URL_CODE_KEYS),
    partnerId: firstParam(params, PARTNER_ID_KEYS),
    /** Full query snapshot for future API / partner redirect (excluding nothing). */
    query: Object.fromEntries(params.entries()),
  };
}

/**
 * Build a query string that preserves known flow identifiers (+ any extras).
 * @param {ReturnType<typeof readSurveyFlowParams>} flow
 * @param {Record<string, string>} [extra]
 */
export function buildSurveyFlowSearch(flow = {}, extra = {}) {
  const params = new URLSearchParams();

  const entries = {
    uid: flow.uid,
    projectId: flow.projectId,
    projectUrlId: flow.projectUrlId,
    projectUrlCode: flow.projectUrlCode,
    partnerId: flow.partnerId,
    token: flow.token,
    ...extra,
  };

  Object.entries(entries).forEach(([key, value]) => {
    const text = String(value ?? "").trim();
    if (text) params.set(key, text);
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Map backend / vendor outcome status to a frontend result path.
 * Used only after the customer survey returns — never from Start Survey.
 * @param {string} status
 * @param {string} uid
 */
export function getSurveyOutcomePath(status, uid) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
  const safeUid = encodeURIComponent(String(uid ?? "").trim() || "unknown");

  if (
    key === "completed" ||
    key === "complete" ||
    key === "success"
  ) {
    return `/complete/${safeUid}`;
  }
  if (
    key === "terminated" ||
    key === "terminate" ||
    key === "term"
  ) {
    return `/terminate/${safeUid}`;
  }
  if (
    key === "quota_full" ||
    key === "quotafull" ||
    key === "overquota" ||
    key === "over_quota" ||
    key === "quota"
  ) {
    return `/quota-full/${safeUid}`;
  }

  return null;
}

/**
 * True when a URL points at this app's Complete / Terminate / Quota / redirect
 * outcome pages. Start Survey must never navigate here — those routes are only
 * for the customer's eventual survey callback.
 * @param {string} url
 * @param {string} [origin]
 */
export function isLocalSurveyOutcomeUrl(url, origin) {
  const raw = String(url ?? "").trim();
  if (!raw) return false;

  const base =
    String(origin ?? "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost");

  try {
    const parsed = new URL(raw, base);
    // Relative same-origin outcome paths, or absolute same-origin outcome paths.
    const isRelativeOutcome = raw.startsWith("/") && !raw.startsWith("//");
    const isSameOrigin =
      typeof window !== "undefined"
        ? parsed.origin === window.location.origin
        : parsed.origin === new URL(base).origin;

    if (!isRelativeOutcome && !isSameOrigin) return false;

    const path = parsed.pathname.toLowerCase();
    return (
      /^\/(complete|terminate|quota-full)(\/|$)/.test(path) ||
      /^\/redirect(\/|$)/.test(path)
    );
  } catch {
    return false;
  }
}

/**
 * Read the survey token path segment from /dosurvey/:token without inventing a value.
 * Decodes once so it matches React Router `useParams` when the URL was encoded.
 * @param {string} [pathname]
 */
export function readDoSurveyTokenFromPath(pathname) {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  const match = String(path ?? "").match(/\/dosurvey\/([^/]+)\/?/i);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return String(match[1]).trim();
  }
}
