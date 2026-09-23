/** User-facing copy when a Pre-Screen Group title is not unique. */
export const SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE =
  "Pre-Screen Group title already exists. Please use a unique group title.";

/**
 * Normalize a Pre-Screen Group title for uniqueness comparison.
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
