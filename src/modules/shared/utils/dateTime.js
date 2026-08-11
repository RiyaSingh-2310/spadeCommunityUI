import moment from "moment-timezone";

const IST = "Asia/Kolkata";

/** Application-wide display formats (IST). */
export const APP_DATE_FORMAT = "DD/MM/YY";
export const APP_DATETIME_FORMAT = "DD/MM/YY HH:mm";

/**
 * Parses API UTC timestamps and returns a Moment instance in IST.
 * @param {string | number | Date | null | undefined} value
 */
export function parseUtcToIst(value) {
  if (value == null || value === "") return null;

  if (moment.isMoment(value)) {
    return value.clone().tz(IST);
  }

  const utcMoment = moment.utc(value);
  if (utcMoment.isValid()) {
    return utcMoment.tz(IST);
  }

  const fallback = moment(value);
  return fallback.isValid() ? fallback.tz(IST) : null;
}

/**
 * Whether the raw value includes a time component (vs date-only).
 * Used to choose DD/MM/YY vs DD/MM/YY HH:mm for display.
 * @param {unknown} value
 */
export function hasTimeComponent(value) {
  if (value == null || value === "") return false;
  if (typeof value === "number") return true;
  if (value instanceof Date) return true;
  if (moment.isMoment(value)) return true;

  const text = String(value).trim();
  if (!text || text === "—" || text === "-") return false;

  // Pure date-only patterns (no time).
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(text)) return false;
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(text)) return false;

  if (text.includes("T")) return true;
  if (/[T\s]\d{1,2}:\d{2}/.test(text)) return true;
  if (/Z$/i.test(text) || /[+-]\d{2}:?\d{2}$/.test(text)) return true;
  if (/^\d{10,13}$/.test(text)) return true;

  return false;
}

/**
 * @param {string | number | Date | null | undefined} value
 * @param {string} pattern Moment format string
 * @param {string} [fallback="—"]
 */
export function formatUtcToIst(value, pattern, fallback = "—") {
  if (value == null || value === "") return fallback;
  const text = String(value).trim();
  if (!text || text === "—" || text === "-") return fallback;

  const ist = parseUtcToIst(value);
  if (!ist) return text;
  return ist.format(pattern);
}

/** Date-only display: DD/MM/YY (UTC → IST). */
export function formatAppDate(value, fallback = "—") {
  return formatUtcToIst(value, APP_DATE_FORMAT, fallback);
}

/** Date + time display: DD/MM/YY HH:mm (UTC → IST). */
export function formatAppDateTime(value, fallback = "—") {
  return formatUtcToIst(value, APP_DATETIME_FORMAT, fallback);
}

/**
 * Auto-selects DD/MM/YY or DD/MM/YY HH:mm based on whether the value has a time.
 * Prefer this for API-provided fields when the shape may vary.
 */
export function formatAppDateValue(value, fallback = "—") {
  if (value == null || value === "") return fallback;
  const text = String(value).trim();
  if (!text || text === "—" || text === "-") return fallback;

  return hasTimeComponent(value)
    ? formatAppDateTime(value, fallback)
    : formatAppDate(value, fallback);
}

/** @deprecated Prefer formatAppDateTime — kept for existing imports. */
export function formatActivityLogDate(value) {
  return formatAppDateTime(value);
}

/** @deprecated Prefer formatAppDateTime — kept for existing imports. */
export function formatAuditLogDate(value) {
  return formatAppDateTime(value);
}

/**
 * List/table dates. Auto-selects DD/MM/YY or DD/MM/YY HH:mm from the value shape.
 * @deprecated Prefer formatAppDateValue — kept for existing imports.
 */
export function formatSurveyListDate(value) {
  return formatAppDateValue(value);
}

/** @deprecated Prefer formatAppDateValue — kept for existing imports. */
export function formatLocaleDateTime(value) {
  return formatAppDateValue(value);
}

/** @deprecated Prefer formatAppDate — kept for existing imports. */
export function formatLocaleDateLabel(value) {
  return formatAppDate(value);
}

/** Time-only label: HH:mm (UTC → IST). */
export function formatLocaleTimeLabel(value) {
  return formatUtcToIst(value, "HH:mm");
}

/** Dashboard date label: DD/MM/YY. */
export function formatDashboardDate(value) {
  return formatAppDate(value);
}

/** Dashboard time label: HH:mm. */
export function formatDashboardTime(value) {
  return formatUtcToIst(value, "HH:mm");
}
