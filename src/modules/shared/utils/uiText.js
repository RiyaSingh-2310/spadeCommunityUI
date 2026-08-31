/**
 * Centralized sentence-case formatting for user-facing UI labels and display values.
 * First letter of the string is capitalized; the rest is lowercase.
 * Known acronyms are preserved in uppercase.
 */

const ACRONYM_TOKENS = new Set([
  "url",
  "id",
  "rfq",
  "csv",
  "otp",
  "api",
  "pdf",
  "html",
  "sms",
  "ip",
  "sno",
  "s.no",
]);

/**
 * Values that must keep original casing (URLs, emails, codes, etc.).
 * @param {unknown} value
 * @returns {boolean}
 */
export function shouldPreserveUiCasing(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return true;
  if (/^https?:\/\//i.test(raw)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return true;
  if (/^\d+$/.test(raw)) return true;
  // Technical identifiers / codes with digits (e.g. INV-12, PRJ_01).
  if (/[A-Za-z]/.test(raw) && /\d/.test(raw) && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(raw)) {
    return true;
  }
  return false;
}

/**
 * Sentence-case a UI label/value: "RIGHT ANSWER" → "Right answer", "english" → "English".
 * @param {unknown} value
 * @returns {string}
 */
export function toUiSentenceCase(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (shouldPreserveUiCasing(raw)) return raw;

  const lower = raw.toLowerCase();
  const firstLetterIndex = lower.search(/[a-z]/);
  if (firstLetterIndex < 0) return raw;

  let result =
    lower.slice(0, firstLetterIndex) +
    lower.charAt(firstLetterIndex).toUpperCase() +
    lower.slice(firstLetterIndex + 1);

  result = result.replace(/\b[a-z][a-z0-9.]*\b/gi, (token) => {
    const key = token.toLowerCase();
    if (key === "s.no") return "S.No";
    if (ACRONYM_TOKENS.has(key)) return token.toUpperCase();
    return token;
  });

  return result;
}

/**
 * Column keys whose listing/detail values should use sentence-case presentation.
 */
export const UI_SENTENCE_CASE_VALUE_KEYS = new Set([
  "language",
  "status",
  "questiontype",
  "rightanswer",
  "type",
  "readstatus",
  "actiontype",
  "module",
  "country",
  "commentby",
  "gender",
]);
