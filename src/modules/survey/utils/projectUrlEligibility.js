/**
 * Project URL eligibility for Partner Mapping assignment and Panelist invite.
 * Uses API status strings when available — does not invent statuses.
 */

const EXCLUDED_FOR_FRESH_INVITE = new Set([
  "completed",
  "complete",
  "inactive",
  "unavailable",
  "closed",
  "on hold",
  "onhold",
  "hold",
]);

/**
 * Fresh invite / new mapping eligibility.
 * Explicitly excludes Completed and Inactive (req).
 * Other unavailable statuses from the API are excluded consistently.
 */

const ELIGIBLE_FOR_FRESH_INVITE = new Set([
  "active",
  "open",
  "initiated",
  "shared",
]);

/**
 * Normalize a Project URL / mapping status for display.
 * @param {unknown} status
 */
export function normalizeProjectUrlAssignmentStatus(status) {
  const raw = String(status ?? "").trim();
  if (!raw) return "Active";

  const key = raw.toLowerCase().replace(/[_-]+/g, " ");

  if (key === "active" || key === "open") return "Active";
  if (key === "initiated" || key === "init") return "Initiated";
  if (key === "shared") return "Shared";
  if (key === "completed" || key === "complete") return "Completed";
  if (key === "inactive") return "Inactive";
  if (key === "unavailable") return "Unavailable";
  if (key === "closed" || key === "close") return "Closed";
  if (key === "on hold" || key === "onhold" || key === "hold") return "On Hold";

  // Preserve unknown API values for display rather than inventing a label.
  return raw;
}

/**
 * Whether a Project URL may be selected for a fresh invite / new partner mapping.
 * @param {unknown} status
 */
export function isProjectUrlEligibleForInvite(status) {
  const display = normalizeProjectUrlAssignmentStatus(status);
  const key = display.toLowerCase();

  if (EXCLUDED_FOR_FRESH_INVITE.has(key)) return false;
  if (ELIGIBLE_FOR_FRESH_INVITE.has(key)) return true;

  // Unknown statuses: allow only when clearly not in the exclude set.
  return !EXCLUDED_FOR_FRESH_INVITE.has(key);
}

/**
 * Normalize Project_Link_Type for option labels.
 * @param {unknown} value
 * @returns {"Single Link"|"Multi Link"}
 */
function normalizeProjectLinkTypeLabel(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
  if (normalized === "multilink" || normalized === "multi") return "Multi Link";
  return "Single Link";
}

/**
 * Normalize link_mode for display (Test / Live).
 * @param {unknown} value
 * @returns {"Test"|"Live"}
 */
export function normalizeProjectUrlLinkModeLabel(value) {
  const mode = String(value ?? "")
    .trim()
    .toLowerCase();
  return mode === "live" ? "Live" : "Test";
}

/**
 * Format a Project URL option label for selectors.
 * @param {{
 *   projectUrlCode?: string,
 *   id?: string|number,
 *   country?: string,
 *   language?: string,
 *   discussion?: string,
 *   status?: string,
 *   linkMode?: string,
 *   link_mode?: string,
 *   projectLinkType?: string,
 *   Project_Link_Type?: string,
 *   project_link_type?: string,
 * }} url
 * @param {{
 *   includeStatus?: boolean,
 *   includeLinkType?: boolean,
 *   includeLinkMode?: boolean,
 * }} [options]
 */
export function formatProjectUrlOptionLabel(
  url,
  {
    includeStatus = true,
    includeLinkType = false,
    includeLinkMode = false,
  } = {}
) {
  const code =
    String(url?.projectUrlCode ?? url?.project_url_code ?? "").trim() ||
    (url?.id != null && url.id !== "" ? `URL-${url.id}` : "Project URL");
  const parts = [code];

  if (includeLinkType) {
    parts.push(
      normalizeProjectLinkTypeLabel(
        url?.projectLinkType ?? url?.Project_Link_Type ?? url?.project_link_type
      )
    );
    return parts.join(" — ");
  }

  if (includeLinkMode) {
    parts.push(
      normalizeProjectUrlLinkModeLabel(url?.linkMode ?? url?.link_mode)
    );
    return parts.join(" — ");
  }

  const country = String(url?.country ?? "").trim();
  const language = String(url?.language ?? "").trim();
  const detail = [country, language].filter(Boolean).join(" / ");
  if (detail) parts.push(detail);

  if (includeStatus) {
    const status = normalizeProjectUrlAssignmentStatus(url?.status);
    parts.push(status);
  }

  return parts.join(" — ");
}
