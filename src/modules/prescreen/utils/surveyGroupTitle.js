/** User-facing copy when a Survey Group title is not unique. */
export const SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE =
  "Survey Group title already exists. Please use a unique survey title.";

/**
 * Normalize a Survey Group title for uniqueness comparison.
 * Trims, collapses inner whitespace, and ignores case.
 * @param {unknown} title
 * @returns {string}
 */
export function normalizeSurveyGroupTitle(title) {
  return String(title ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSurveyGroupTitleDuplicateError(error) {
  const message = String(
    error?.message ?? error?.data?.message ?? error?.data?.error ?? ""
  ).toLowerCase();
  if (!message) return false;
  return (
    message.includes("already exists") ||
    message.includes("duplicate") ||
    message.includes("unique")
  );
}
