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

const PID_KEYS = ["pid"];
const PROJECT_ID_KEYS = ["projectId", "project_id", "projectid"];
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
    pid: firstParam(params, PID_KEYS),
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
    pid: flow.pid,
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
 * Normalize outcome keys from API status, redirect path, or vendor callback.
 * @param {unknown} status
 * @returns {string} canonical key or ""
 */
export function normalizeSurveyOutcomeKey(status) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (
    key === "completed" ||
    key === "complete" ||
    key === "success"
  ) {
    return "complete";
  }
  if (key === "terminated" || key === "terminate" || key === "term") {
    return "terminate";
  }
  if (
    key === "quota_full" ||
    key === "quotafull" ||
    key === "overquota" ||
    key === "over_quota" ||
    key === "quota"
  ) {
    return "quota-full";
  }
  if (
    key === "qualityterm" ||
    key === "quality_term" ||
    key === "quality_terminate" ||
    key === "qualityterminate"
  ) {
    return "qualityterm";
  }
  if (
    key === "surveyclose" ||
    key === "survey_close" ||
    key === "surveyclosed" ||
    key === "survey_closed"
  ) {
    return "surveyclose";
  }
  return "";
}

function buildRedirectOutcomePath(segment, uid, pid) {
  const params = new URLSearchParams();
  const safePid = String(pid ?? "").trim();
  const safeUid = normalizeFlowUid(uid);
  if (safePid) params.set("pid", safePid);
  if (safeUid) params.set("uid", safeUid);
  const qs = params.toString();
  return qs ? `/redirect/${segment}?${qs}` : `/redirect/${segment}`;
}

/**
 * Build an in-app result path on the current frontend origin.
 * Canonical destination is /redirect/{outcome}?pid=&uid= so status APIs can
 * read both identifiers. Never embeds placeholder identifier/XXX values.
 * @param {string} status
 * @param {string} uid
 * @param {{ pid?: string }} [extra]
 */
export function getSurveyOutcomePath(status, uid, extra = {}) {
  const outcome = normalizeSurveyOutcomeKey(status);
  if (!outcome) return null;

  const pid = extra?.pid ?? "";

  if (outcome === "complete") return buildRedirectOutcomePath("complete", uid, pid);
  if (outcome === "terminate") return buildRedirectOutcomePath("terminate", uid, pid);
  if (outcome === "quota-full") return buildRedirectOutcomePath("quota-full", uid, pid);
  if (outcome === "qualityterm") {
    return buildRedirectOutcomePath("quality-terminate", uid, pid);
  }
  if (outcome === "surveyclose") {
    return buildRedirectOutcomePath("survey-closed", uid, pid);
  }

  return null;
}

/**
 * Detect Complete / Terminate / Quota / Closed / Quality outcome URLs on any host.
 * Catches hardcoded production redirects like https://spade-community.com/redirect/complete?...
 * @param {string} url
 * @param {string} [origin]
 * @returns {string} outcome key or ""
 */
export function getSurveyOutcomeKeyFromUrl(url, origin) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const base =
    String(origin ?? "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "https://example.invalid");

  try {
    const parsed = new URL(raw, base);
    const path = parsed.pathname.toLowerCase();

    const redirectMatch = path.match(/^\/redirect\/([^/]+)\/?$/);
    if (redirectMatch?.[1]) {
      return normalizeSurveyOutcomeKey(redirectMatch[1]);
    }

    const pathMatch = path.match(
      /^\/(complete|terminate|quota-full|quality-terminate|survey-closed)(\/|$)/
    );
    if (pathMatch?.[1]) {
      return normalizeSurveyOutcomeKey(pathMatch[1]);
    }
  } catch {
    return "";
  }

  return "";
}

/**
 * True when a URL is a survey outcome / redirect result page (any host).
 * Do not open these via window.location — use in-app router paths instead.
 * @param {string} url
 * @param {string} [origin]
 */
export function isLocalSurveyOutcomeUrl(url, origin) {
  return Boolean(getSurveyOutcomeKeyFromUrl(url, origin));
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
