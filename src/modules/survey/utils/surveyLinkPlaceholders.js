/**
 * Live / Test link dynamic identifier placeholders.
 * Supported token (validation): XXXX (case-insensitive, exact token).
 */

export const SURVEY_LINK_PLACEHOLDER_TOKENS = Object.freeze(["XXXX"]);

/**
 * Exact XXXX token, ignoring letter case.
 * Rejects partial/different values such as XXX, XXXXX, identifier, abcXXXX.
 */
const SURVEY_LINK_PLACEHOLDER_PATTERN = /(^|[^A-Za-z0-9])XXXX(?![A-Za-z0-9])/i;

/** Tokens replaced at survey-redirect time (includes legacy bracket form). */
export const SURVEY_LINK_REPLACE_TOKENS = Object.freeze([
  "[identifier]",
  "identifier",
  "XXXX",
  "XXX",
]);

const PLACEHOLDER_MESSAGE =
  "must include a supported identifier placeholder (XXXX)";

function isPlaceholderUid(uid) {
  const key = String(uid ?? "").trim().toLowerCase();
  return (
    key === "[identifier]" ||
    key === "identifier" ||
    key === "xxx" ||
    key === "xxxx"
  );
}

/**
 * True when the URL contains the exact XXXX placeholder (case-insensitive).
 * @param {string} value
 */
export function hasSupportedSurveyLinkPlaceholder(value) {
  const text = String(value ?? "");
  if (!text.trim()) return false;
  return SURVEY_LINK_PLACEHOLDER_PATTERN.test(text);
}

/**
 * Validates Live Link / Test Link for a supported dynamic identifier.
 * Empty values are allowed (optional fields) — only non-empty values are checked.
 * @param {string} value
 * @param {string} label
 */
export function getSurveyLinkPlaceholderError(value, label = "Link") {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  if (!hasSupportedSurveyLinkPlaceholder(trimmed)) {
    return `${label} ${PLACEHOLDER_MESSAGE}`;
  }

  return "";
}

/**
 * Replace supported placeholders with the real respondent UID.
 * Never invents a UID — returns the original URL when uid is missing.
 * Longer tokens are replaced first so `[identifier]` wins over `identifier`.
 * @param {string} url
 * @param {string} uid
 */
export function replaceSurveyLinkPlaceholders(url, uid) {
  const source = String(url ?? "");
  const respondentUid = String(uid ?? "").trim();
  if (!source || !respondentUid) return source;

  if (isPlaceholderUid(respondentUid)) {
    return source;
  }

  let result = source.replace(
    /(^|[^A-Za-z0-9])XXXX(?![A-Za-z0-9])/gi,
    `$1${respondentUid}`
  );

  const legacyTokens = SURVEY_LINK_REPLACE_TOKENS.filter(
    (token) => token.toUpperCase() !== "XXXX"
  ).sort((a, b) => b.length - a.length);

  for (const token of legacyTokens) {
    if (!result.includes(token)) continue;
    result = result.split(token).join(respondentUid);
  }
  return result;
}
