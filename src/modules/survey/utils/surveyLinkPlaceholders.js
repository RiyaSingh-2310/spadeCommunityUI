/**
 * Live / Test / redirect-link UID placeholders.
 * UID accepts identifier / [identifier] / XXX+ (case-insensitive).
 * PID is not required in examples, prefills, or frontend validation.
 *
 * Live/Test links may carry the UID as:
 * - query parameter: /survey?uid=XXXX
 * - path segment:    /survey/XXXX  or  /XXXX
 */

export const SURVEY_LINK_PLACEHOLDER_TOKENS = Object.freeze([
  "identifier",
  "[identifier]",
  "XXX",
  "XXXX",
]);

/** Default UID token used in pre-filled Single Link Live/Test URLs. */
export const DEFAULT_SURVEY_LINK_UID_PLACEHOLDER = "XXXX";

const LEGACY_SURVEY_LINK_PATHS = Object.freeze(["/survey", "/survey_simulator.php"]);

/** Canonical Admin origin for Live/Test survey-link examples / defaults (never localhost). */
export const ADMIN_SPADE_COMMUNITY_ORIGIN = "https://spadecommunity.com";
export const ADMIN_SPADE_COMMUNITY_URL = `${ADMIN_SPADE_COMMUNITY_ORIGIN}/`;
/** Canonical client origin for generated redirect URLs (never localhost). */
export const FALLBACK_REDIRECT_ORIGIN = "https://spadecommunity.com";
const DEFAULT_REDIRECT_UID_PLACEHOLDER = "identifier";

/** Client-side origin used for redirect URL examples and defaults. */
export function getDefaultRedirectOrigin() {
  return FALLBACK_REDIRECT_ORIGIN;
}

export function isAdminSpadeCommunityUrl(value) {
  const parsed = parseAbsoluteUrl(value);
  if (!parsed) {
    const trimmed = coerceText(value).replace(/\/+$/, "");
    return trimmed.toLowerCase() === ADMIN_SPADE_COMMUNITY_ORIGIN.toLowerCase();
  }
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return (
    parsed.origin.replace(/\/+$/, "").toLowerCase() ===
      ADMIN_SPADE_COMMUNITY_ORIGIN.toLowerCase() &&
    pathname === "/" &&
    !parsed.search &&
    !parsed.hash
  );
}

function rewriteUrlToOrigin(value, origin) {
  const parsed = parseAbsoluteUrl(value);
  if (!parsed) return coerceText(value);
  try {
    const rewritten = new URL(parsed.pathname + parsed.search + parsed.hash, origin);
    return rewritten.toString();
  } catch {
    return coerceText(value);
  }
}

/** Rewrite an absolute URL onto the Speed Community admin origin, keeping path + query. */
export function rewriteUrlToAdminOrigin(value) {
  return rewriteUrlToOrigin(value, ADMIN_SPADE_COMMUNITY_ORIGIN);
}

/** Rewrite an absolute URL onto the client redirect origin, keeping path + query. */
export function rewriteUrlToRedirectOrigin(value) {
  return rewriteUrlToOrigin(value, FALLBACK_REDIRECT_ORIGIN);
}

/** Placeholder shown in Live Link / Test Link inputs. */
export const DEFAULT_SURVEY_LINK_PLACEHOLDER = `${ADMIN_SPADE_COMMUNITY_ORIGIN}/?uid=XXX`;

const PID_PARAM_NAMES = ["pid"];
const UID_PARAM_NAMES = ["uid"];

const MISSING_UID_MESSAGE =
  "must include a UID as a query parameter (?uid=) or as a path segment";
const INVALID_UID_MESSAGE =
  "must include a supported UID placeholder (XXX, XXXX, or identifier)";

function coerceText(value) {
  return String(value ?? "").trim();
}

function parseAbsoluteUrl(value) {
  const trimmed = coerceText(value);
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function getQueryParamIgnoreCase(searchParams, names) {
  if (!searchParams) return { key: "", value: "" };
  const wanted = names.map((name) => String(name).toLowerCase());
  for (const [key, value] of searchParams.entries()) {
    if (wanted.includes(String(key).toLowerCase())) {
      return { key, value: String(value ?? "") };
    }
  }
  return { key: "", value: "" };
}

/**
 * Last non-empty pathname segment (used as path-parameter UID).
 * @param {string} pathname
 */
function readLastPathSegment(pathname) {
  const segments = String(pathname ?? "")
    .split("/")
    .map((part) => coerceText(part))
    .filter(Boolean);
  if (segments.length === 0) return "";
  return segments[segments.length - 1];
}

/**
 * True when the UID value is a supported configuration placeholder.
 * Accepts identifier, XXX, XXXX, and longer X-runs (e.g. XXXXX). Does not
 * accept arbitrary respondent IDs.
 * @param {unknown} value
 */
export function isSupportedUidPlaceholder(value) {
  const trimmed = coerceText(value);
  if (!trimmed) return false;
  const key = trimmed.toLowerCase();
  if (key === "identifier" || key === "[identifier]") return true;
  return /^x{3,}$/i.test(trimmed);
}

/**
 * Read pid + uid from URL query params, or uid from the last path segment.
 * Query `uid` wins when both are present.
 * Path uid is only recognized when the last segment is a supported placeholder
 * (so static redirect paths like `/redirect/complete` are not treated as UIDs).
 * @param {string} value
 * @returns {{ url: URL|null, pid: string, uid: string, hasPid: boolean, hasUid: boolean, uidIsPlaceholder: boolean, uidSource: 'query'|'path'|'' }}
 */
export function readPidUidFromUrl(value) {
  const url = parseAbsoluteUrl(value);
  if (!url) {
    return {
      url: null,
      pid: "",
      uid: "",
      hasPid: false,
      hasUid: false,
      uidIsPlaceholder: false,
      uidSource: "",
    };
  }

  const pid = coerceText(getQueryParamIgnoreCase(url.searchParams, PID_PARAM_NAMES).value);
  const queryUid = coerceText(
    getQueryParamIgnoreCase(url.searchParams, UID_PARAM_NAMES).value
  );

  if (queryUid) {
    return {
      url,
      pid,
      uid: queryUid,
      hasPid: Boolean(pid),
      hasUid: true,
      uidIsPlaceholder: isSupportedUidPlaceholder(queryUid),
      uidSource: "query",
    };
  }

  const pathUid = readLastPathSegment(url.pathname);
  if (pathUid && isSupportedUidPlaceholder(pathUid)) {
    return {
      url,
      pid,
      uid: pathUid,
      hasPid: Boolean(pid),
      hasUid: true,
      uidIsPlaceholder: true,
      uidSource: "path",
    };
  }

  return {
    url,
    pid,
    uid: "",
    hasPid: Boolean(pid),
    hasUid: false,
    uidIsPlaceholder: false,
    uidSource: "",
  };
}

/**
 * True when the URL has a uid (query or path) using a supported placeholder.
 * @param {string} value
 */
export function hasSupportedSurveyLinkPlaceholder(value) {
  return readPidUidFromUrl(value).uidIsPlaceholder;
}

function normalizePathname(pathname) {
  const trimmed = String(pathname ?? "").replace(/\/+$/, "");
  return trimmed || "/";
}

function isLocalDevHost(hostname) {
  const host = String(hostname ?? "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

function isSamplePollsHost(hostname) {
  return String(hostname ?? "")
    .replace(/^www\./i, "")
    .toLowerCase() === "samplepolls.com";
}

/**
 * True for empty-equivalent Live/Test defaults: samplepolls simulator URLs
 * or the bare Speed Community admin origin (no path/query).
 */
function isLegacyOrDefaultSurveyLink(url) {
  if (isAdminSpadeCommunityUrl(url)) return true;
  const parsed = parseAbsoluteUrl(url);
  if (!parsed) return false;
  if (!isSamplePollsHost(parsed.hostname)) return false;
  const path = normalizePathname(parsed.pathname);
  return LEGACY_SURVEY_LINK_PATHS.includes(path);
}

function shouldRewriteLocalOrigin(url) {
  const parsed = parseAbsoluteUrl(url);
  return Boolean(parsed && isLocalDevHost(parsed.hostname));
}

function isAdminRedirectUrl(url) {
  const parsed = parseAbsoluteUrl(url);
  if (!parsed) return false;
  const host = String(parsed.hostname ?? "").toLowerCase();
  if (host !== "admin.spadecommunity.com") return false;
  const path = normalizePathname(parsed.pathname);
  return path === "/redirect" || path.startsWith("/redirect/");
}

function shouldRewriteRedirectOrigin(url) {
  return shouldRewriteLocalOrigin(url) || isAdminRedirectUrl(url);
}

/** Ensure a supported UID placeholder is present; never adds or rewrites PID. */
function syncUidOnAbsoluteUrl(trimmed, defaultUid) {
  const parsed = parseAbsoluteUrl(trimmed);
  if (!parsed) return trimmed;

  const existing = readPidUidFromUrl(trimmed);
  if (existing.hasUid) {
    return trimmed;
  }

  const uidParam = getQueryParamIgnoreCase(parsed.searchParams, UID_PARAM_NAMES);
  if (!uidParam.key) {
    parsed.searchParams.set("uid", defaultUid);
  }

  return parsed.toString();
}

/**
 * Build a Single Link Live/Test URL with a supported UID placeholder.
 * Does not include PID.
 * @param {unknown} [_projectUrlCode] kept for call-site compatibility
 * @param {string} [uid]
 */
export function buildPrefillSurveyLink(
  _projectUrlCode,
  uid = DEFAULT_SURVEY_LINK_UID_PLACEHOLDER
) {
  const safeUid = isSupportedUidPlaceholder(uid)
    ? coerceText(uid)
    : DEFAULT_SURVEY_LINK_UID_PLACEHOLDER;

  try {
    const url = new URL("/", ADMIN_SPADE_COMMUNITY_ORIGIN);
    url.searchParams.set("uid", safeUid);
    return url.toString();
  } catch {
    return `${ADMIN_SPADE_COMMUNITY_ORIGIN}/?uid=${encodeURIComponent(safeUid)}`;
  }
}

/**
 * Prefill empty/legacy Live/Test links with the admin-origin URL + UID placeholder.
 * Custom user-edited URLs keep their host/path/query (including any existing pid);
 * only missing UID is added. Localhost origins are rewritten to the admin origin.
 * @param {unknown} url
 * @param {unknown} projectUrlCode trigger when a Project URL Code is available
 */
export function withSurveyLinkPid(url, projectUrlCode) {
  const code = coerceText(projectUrlCode);
  const trimmed = coerceText(url);
  if (!code) return trimmed;
  if (!trimmed || isLegacyOrDefaultSurveyLink(trimmed)) {
    return buildPrefillSurveyLink(code);
  }
  if (shouldRewriteLocalOrigin(trimmed)) {
    return syncUidOnAbsoluteUrl(
      rewriteUrlToAdminOrigin(trimmed),
      DEFAULT_SURVEY_LINK_UID_PLACEHOLDER
    );
  }

  return syncUidOnAbsoluteUrl(trimmed, DEFAULT_SURVEY_LINK_UID_PLACEHOLDER);
}

/**
 * Build a redirect URL with a supported uid placeholder (no PID).
 * @param {string} path
 * @param {unknown} [_projectUrlCode] kept for call-site compatibility
 * @param {string} [uid]
 */
export function buildPrefillRedirectUrl(
  path,
  _projectUrlCode,
  uid = DEFAULT_REDIRECT_UID_PLACEHOLDER
) {
  const redirectPath = String(path ?? "").trim();
  if (!redirectPath) return ADMIN_SPADE_COMMUNITY_URL;

  const safeUid = isSupportedUidPlaceholder(uid)
    ? coerceText(uid)
    : DEFAULT_REDIRECT_UID_PLACEHOLDER;

  try {
    const url = new URL(redirectPath, FALLBACK_REDIRECT_ORIGIN);
    url.searchParams.set("uid", safeUid);
    return url.toString();
  } catch {
    const normalizedPath = redirectPath.startsWith("/")
      ? redirectPath
      : `/${redirectPath}`;
    return `${FALLBACK_REDIRECT_ORIGIN}${normalizedPath}?uid=${encodeURIComponent(safeUid)}`;
  }
}

/**
 * Prefill empty redirect URLs. Does not add or rewrite PID on existing URLs.
 * Localhost and admin-domain redirect URLs keep path and query; only the domain is
 * updated to the client redirect origin.
 * @param {unknown} url
 * @param {unknown} projectUrlCode
 * @param {string} [fallbackPath]
 */
export function withRedirectUrlPid(url, projectUrlCode, fallbackPath = "") {
  const code = coerceText(projectUrlCode);
  const trimmed = coerceText(url);
  if (!code) return trimmed;
  if (!trimmed || isLegacyOrDefaultSurveyLink(trimmed)) {
    return fallbackPath ? buildPrefillRedirectUrl(fallbackPath, code) : buildPrefillSurveyLink(code);
  }
  if (shouldRewriteRedirectOrigin(trimmed)) {
    return syncUidOnAbsoluteUrl(
      rewriteUrlToRedirectOrigin(trimmed),
      DEFAULT_REDIRECT_UID_PLACEHOLDER
    );
  }
  return syncUidOnAbsoluteUrl(trimmed, DEFAULT_REDIRECT_UID_PLACEHOLDER);
}

/**
 * Prefill Single Link live/test fields.
 * Empty and legacy sample-pool defaults become the admin-origin live/test URL.
 * Custom user-edited URLs keep their host/path; UID is ensured when missing.
 * Does not change Multi Link forms or redirect fields.
 * @param {object} form
 * @param {unknown} [projectUrlCode]
 */
export function applyPrefillSingleLinkUrls(form, projectUrlCode) {
  if (!form || typeof form !== "object") return form;
  const code = coerceText(projectUrlCode ?? form.projectUrlCode);
  if (!code) return form;

  return {
    ...form,
    liveLink: withSurveyLinkPid(form.liveLink, code),
    testLink: withSurveyLinkPid(form.testLink, code),
  };
}

/**
 * Validates Live Link / Test Link for a supported uid placeholder.
 * Empty values are allowed (optional fields) — only non-empty values are checked.
 * Accepts UID as `?uid=` query param or as the last path segment.
 * PID is not required.
 * @param {string} value
 * @param {string} label
 */
export function getSurveyLinkPlaceholderError(value, label = "Link") {
  const trimmed = coerceText(value);
  if (!trimmed) return "";

  const { url, hasUid, uidIsPlaceholder } = readPidUidFromUrl(trimmed);
  if (!url) {
    return `${label} ${INVALID_UID_MESSAGE}.`;
  }

  if (!hasUid) {
    return `${label} ${MISSING_UID_MESSAGE}.`;
  }
  if (!uidIsPlaceholder) {
    return `${label} ${INVALID_UID_MESSAGE}.`;
  }

  return "";
}

/**
 * Validates optional redirect URLs for a supported uid placeholder.
 * PID is not required.
 * @param {unknown} value
 * @param {string} label
 */
export function getOptionalRedirectUrlPidUidError(value, label = "URL") {
  const trimmed = coerceText(value);
  if (!trimmed) return "";
  return getSurveyLinkPlaceholderError(trimmed, label);
}

/**
 * Replace a supported UID placeholder (query or path) with the real respondent UID.
 * Never invents a UID, never rewrites pid.
 * @param {string} url
 * @param {string} uid
 */
export function replaceSurveyLinkPlaceholders(url, uid) {
  const source = String(url ?? "");
  const respondentUid = coerceText(uid);
  if (!source || !respondentUid) return source;
  if (isSupportedUidPlaceholder(respondentUid)) return source;

  const parsed = parseAbsoluteUrl(source);
  if (!parsed) return source;

  const uidParam = getQueryParamIgnoreCase(parsed.searchParams, UID_PARAM_NAMES);
  if (uidParam.key && isSupportedUidPlaceholder(uidParam.value)) {
    parsed.searchParams.set(uidParam.key, respondentUid);
    return parsed.toString();
  }

  const pathUid = readLastPathSegment(parsed.pathname);
  if (pathUid && isSupportedUidPlaceholder(pathUid)) {
    const parts = parsed.pathname.split("/");
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (parts[i] !== "") {
        parts[i] = encodeURIComponent(respondentUid);
        break;
      }
    }
    parsed.pathname = parts.join("/") || "/";
    return parsed.toString();
  }

  return source;
}
