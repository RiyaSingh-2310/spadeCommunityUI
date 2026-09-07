/**
 * Live / Test / redirect-link PID + UID placeholders.
 * UID accepts only identifier / [identifier] / XXXX (case-insensitive).
 * PID may be any non-empty value (project code or placeholder).
 */

export const SURVEY_LINK_PLACEHOLDER_TOKENS = Object.freeze([
  "identifier",
  "[identifier]",
  "XXXX",
]);

/** Default UID token used in pre-filled Single Link Live/Test URLs. */
export const DEFAULT_SURVEY_LINK_UID_PLACEHOLDER = "XXXX";

const LEGACY_SURVEY_LINK_PATHS = Object.freeze(["/survey", "/survey_simulator.php"]);

/** Canonical Admin UI origin used for examples / defaults (never localhost). */
export const ADMIN_SPADE_COMMUNITY_URL = "https://admin.spadecommunity.com/";
export const FALLBACK_REDIRECT_ORIGIN = "https://admin.spadecommunity.com";
const DEFAULT_REDIRECT_UID_PLACEHOLDER = "identifier";

/** Speed Community admin origin used for examples (never localhost). */
export function getDefaultRedirectOrigin() {
  return FALLBACK_REDIRECT_ORIGIN;
}

export function isAdminSpadeCommunityUrl(value) {
  const parsed = parseAbsoluteUrl(value);
  if (!parsed) {
    const trimmed = coerceText(value).replace(/\/+$/, "");
    return trimmed.toLowerCase() === FALLBACK_REDIRECT_ORIGIN.toLowerCase();
  }
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return (
    parsed.origin.replace(/\/+$/, "").toLowerCase() ===
      FALLBACK_REDIRECT_ORIGIN.toLowerCase() &&
    pathname === "/" &&
    !parsed.search &&
    !parsed.hash
  );
}

/** Rewrite an absolute URL onto the Speed Community admin origin, keeping path + query. */
export function rewriteUrlToAdminOrigin(value) {
  const parsed = parseAbsoluteUrl(value);
  if (!parsed) return coerceText(value);
  try {
    const rewritten = new URL(parsed.pathname + parsed.search + parsed.hash, FALLBACK_REDIRECT_ORIGIN);
    return rewritten.toString();
  } catch {
    return coerceText(value);
  }
}

/** Placeholder shown in Live Link / Test Link inputs. */
export const DEFAULT_SURVEY_LINK_PLACEHOLDER = `${FALLBACK_REDIRECT_ORIGIN}/?pid=PROJECT_URL_CODE&uid=${DEFAULT_SURVEY_LINK_UID_PLACEHOLDER}`;

const PID_PARAM_NAMES = ["pid"];
const UID_PARAM_NAMES = ["uid"];

const BOTH_PARAMS_MESSAGE =
  "must include both PID and a supported UID placeholder (identifier or XXXX)";
const MISSING_PID_MESSAGE = "must include a PID query parameter";
const MISSING_UID_MESSAGE = "must include a UID query parameter";
const INVALID_UID_MESSAGE =
  "must include a supported UID placeholder (identifier or XXXX)";

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
 * True when the UID query value is a supported configuration placeholder.
 * Does not accept arbitrary respondent IDs or partial tokens (XXX, XXXXX).
 * @param {unknown} value
 */
export function isSupportedUidPlaceholder(value) {
  const trimmed = coerceText(value);
  if (!trimmed) return false;
  const key = trimmed.toLowerCase();
  if (key === "identifier" || key === "[identifier]") return true;
  return key === "xxxx";
}

/**
 * Read pid + uid from URL query params only (not from the rest of the string).
 * @param {string} value
 * @returns {{ url: URL|null, pid: string, uid: string, hasPid: boolean, hasUid: boolean, uidIsPlaceholder: boolean }}
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
    };
  }

  const pid = coerceText(getQueryParamIgnoreCase(url.searchParams, PID_PARAM_NAMES).value);
  const uidRaw = getQueryParamIgnoreCase(url.searchParams, UID_PARAM_NAMES).value;
  const uid = coerceText(uidRaw);

  return {
    url,
    pid,
    uid,
    hasPid: Boolean(pid),
    hasUid: Boolean(uid),
    uidIsPlaceholder: isSupportedUidPlaceholder(uid),
  };
}

/**
 * True when the URL has a uid query param using a supported placeholder.
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

function syncPidUidOnAbsoluteUrl(trimmed, pid, defaultUid) {
  const parsed = parseAbsoluteUrl(trimmed);
  if (!parsed) return trimmed;

  const pidParam = getQueryParamIgnoreCase(parsed.searchParams, PID_PARAM_NAMES);
  parsed.searchParams.set(pidParam.key || "pid", pid);

  const uidParam = getQueryParamIgnoreCase(parsed.searchParams, UID_PARAM_NAMES);
  if (!uidParam.key) {
    parsed.searchParams.set("uid", defaultUid);
  }

  return parsed.toString();
}

/**
 * Build a Single Link Live/Test URL with pid = Project URL Code and a supported UID placeholder.
 * Does not invent a second PID value.
 * @param {unknown} projectUrlCode
 * @param {string} [uid]
 */
export function buildPrefillSurveyLink(
  projectUrlCode,
  uid = DEFAULT_SURVEY_LINK_UID_PLACEHOLDER
) {
  const pid = coerceText(projectUrlCode);
  const safeUid = isSupportedUidPlaceholder(uid)
    ? coerceText(uid)
    : DEFAULT_SURVEY_LINK_UID_PLACEHOLDER;
  if (!pid) {
    return `${FALLBACK_REDIRECT_ORIGIN}/?pid=PROJECT_URL_CODE&uid=${encodeURIComponent(safeUid)}`;
  }

  try {
    const url = new URL("/", FALLBACK_REDIRECT_ORIGIN);
    url.searchParams.set("pid", pid);
    url.searchParams.set("uid", safeUid);
    return url.toString();
  } catch {
    return `${FALLBACK_REDIRECT_ORIGIN}/?pid=${encodeURIComponent(pid)}&uid=${encodeURIComponent(safeUid)}`;
  }
}

/**
 * Set pid to the Project URL Code on an existing survey link.
 * Keeps the current UID (or adds the supported placeholder when missing).
 * Empty/legacy sample-pool defaults become the admin-origin live/test URL.
 * Localhost URLs keep their path and query; only the domain is updated.
 * @param {unknown} url
 * @param {unknown} projectUrlCode
 */
export function withSurveyLinkPid(url, projectUrlCode) {
  const pid = coerceText(projectUrlCode);
  const trimmed = coerceText(url);
  if (!pid) return trimmed;
  if (!trimmed || isLegacyOrDefaultSurveyLink(trimmed)) {
    return buildPrefillSurveyLink(pid);
  }
  if (shouldRewriteLocalOrigin(trimmed)) {
    return syncPidUidOnAbsoluteUrl(
      rewriteUrlToAdminOrigin(trimmed),
      pid,
      DEFAULT_SURVEY_LINK_UID_PLACEHOLDER
    );
  }

  return syncPidUidOnAbsoluteUrl(trimmed, pid, DEFAULT_SURVEY_LINK_UID_PLACEHOLDER);
}

/**
 * Build a redirect URL with pid + supported uid placeholder.
 * @param {string} path
 * @param {unknown} projectUrlCode
 * @param {string} [uid]
 */
export function buildPrefillRedirectUrl(
  path,
  projectUrlCode,
  uid = DEFAULT_REDIRECT_UID_PLACEHOLDER
) {
  const pid = coerceText(projectUrlCode) || "xxxx";
  const redirectPath = String(path ?? "").trim();
  if (!redirectPath) return pid ? buildPrefillSurveyLink(pid, uid) : ADMIN_SPADE_COMMUNITY_URL;

  const safeUid = isSupportedUidPlaceholder(uid)
    ? coerceText(uid)
    : DEFAULT_REDIRECT_UID_PLACEHOLDER;

  try {
    const url = new URL(redirectPath, FALLBACK_REDIRECT_ORIGIN);
    url.searchParams.set("pid", pid);
    url.searchParams.set("uid", safeUid);
    return url.toString();
  } catch {
    const normalizedPath = redirectPath.startsWith("/")
      ? redirectPath
      : `/${redirectPath}`;
    return `${FALLBACK_REDIRECT_ORIGIN}${normalizedPath}?pid=${encodeURIComponent(pid)}&uid=${encodeURIComponent(safeUid)}`;
  }
}

/**
 * Ensure pid is present on a redirect URL. Empty values become a full pre-filled URL.
 * Localhost URLs keep path and query; only the domain is updated.
 * @param {unknown} url
 * @param {unknown} projectUrlCode
 * @param {string} [fallbackPath]
 */
export function withRedirectUrlPid(url, projectUrlCode, fallbackPath = "") {
  const pid = coerceText(projectUrlCode);
  const trimmed = coerceText(url);
  if (!pid) return trimmed;
  if (!trimmed || isLegacyOrDefaultSurveyLink(trimmed)) {
    return fallbackPath ? buildPrefillRedirectUrl(fallbackPath, pid) : buildPrefillSurveyLink(pid);
  }
  if (shouldRewriteLocalOrigin(trimmed)) {
    return syncPidUidOnAbsoluteUrl(
      rewriteUrlToAdminOrigin(trimmed),
      pid,
      DEFAULT_REDIRECT_UID_PLACEHOLDER
    );
  }
  return syncPidUidOnAbsoluteUrl(trimmed, pid, DEFAULT_REDIRECT_UID_PLACEHOLDER);
}

/**
 * Prefill Single Link live/test fields.
 * Empty and legacy sample-pool defaults become the admin-origin live/test URL.
 * Custom user-edited URLs keep their host/path; only pid is synced.
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
 * Validates Live Link / Test Link for pid + a supported uid placeholder.
 * Empty values are allowed (optional fields) — only non-empty values are checked.
 * @param {string} value
 * @param {string} label
 */
export function getSurveyLinkPlaceholderError(value, label = "Link") {
  const trimmed = coerceText(value);
  if (!trimmed) return "";

  const { url, hasPid, hasUid, uidIsPlaceholder } = readPidUidFromUrl(trimmed);
  if (!url) {
    return `${label} ${BOTH_PARAMS_MESSAGE}.`;
  }

  if (!hasPid && !uidIsPlaceholder) {
    return `${label} ${BOTH_PARAMS_MESSAGE}.`;
  }
  if (!hasPid) {
    return `${label} ${MISSING_PID_MESSAGE}.`;
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
 * Validates optional redirect URLs for pid + supported uid placeholder.
 * @param {unknown} value
 * @param {string} label
 */
export function getOptionalRedirectUrlPidUidError(value, label = "URL") {
  const trimmed = coerceText(value);
  if (!trimmed) return "";
  return getSurveyLinkPlaceholderError(trimmed, label);
}

/**
 * Replace a supported UID query placeholder with the real respondent UID.
 * Never invents a UID, never rewrites pid (pid may also use xxxx as a token).
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
  if (!uidParam.key || !isSupportedUidPlaceholder(uidParam.value)) {
    return source;
  }

  parsed.searchParams.set(uidParam.key, respondentUid);
  return parsed.toString();
}
