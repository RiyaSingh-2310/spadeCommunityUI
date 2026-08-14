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
