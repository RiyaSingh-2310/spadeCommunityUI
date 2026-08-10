/**
 * Live / Test link dynamic identifier placeholders.
 * Supported tokens (validation): identifier | XXX
 */

export const SURVEY_LINK_PLACEHOLDER_TOKENS = Object.freeze(["identifier", "XXX"]);

/** Tokens replaced at survey-redirect time (includes legacy bracket form). */
export const SURVEY_LINK_REPLACE_TOKENS = Object.freeze([
  "[identifier]",
  "identifier",
  "XXXX",
  "XXX",
]);

const PLACEHOLDER_MESSAGE =
  "must include a supported identifier placeholder (identifier or XXX)";

/**
 * True when the URL contains at least one supported placeholder token.
 * @param {string} value
 */
export function hasSupportedSurveyLinkPlaceholder(value) {
  const text = String(value ?? "");
  if (!text.trim()) return false;

  // Prefer exact query-param style matches, but also allow path/query token presence.
  // Reject arbitrary brace placeholders like {uid} / {foo}.
  for (const token of SURVEY_LINK_PLACEHOLDER_TOKENS) {
    if (text.includes(token)) return true;
  }
  return false;
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

  if (
    respondentUid === "[identifier]" ||
    respondentUid === "identifier" ||
    respondentUid === "XXX" ||
    respondentUid === "XXXX"
  ) {
    return source;
  }

  const tokens = [...SURVEY_LINK_REPLACE_TOKENS].sort(
    (a, b) => b.length - a.length
  );

  let result = source;
  for (const token of tokens) {
    if (!result.includes(token)) continue;
    result = result.split(token).join(respondentUid);
  }
  return result;
}
