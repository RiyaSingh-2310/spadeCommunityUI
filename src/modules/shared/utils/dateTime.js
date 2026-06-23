import moment from "moment-timezone";

const IST = "Asia/Kolkata";

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
 * @param {string | number | Date | null | undefined} value
 * @param {string} pattern Moment format string
 * @param {string} [fallback="—"]
 */
export function formatUtcToIst(value, pattern, fallback = "—") {
  const ist = parseUtcToIst(value);
  if (!ist) return value ? String(value) : fallback;
  return ist.format(pattern);
}

/** DD/MM/YYYY h:mm A — activity log tables */
export function formatActivityLogDate(value) {
  return formatUtcToIst(value, "DD/MM/YYYY h:mm A");
}

/** D MMM YYYY, h:mm A — audit / reward logs */
export function formatAuditLogDate(value) {
  return formatUtcToIst(value, "D MMM YYYY, h:mm A");
}

/** DD/MM/YYYY — survey / group survey list dates */
export function formatSurveyListDate(value) {
  return formatUtcToIst(value, "DD/MM/YYYY");
}

/** MMM D, YYYY, h:mm A — partner / sales datetime lists */
export function formatLocaleDateTime(value) {
  return formatUtcToIst(value, "MMM D, YYYY, h:mm A");
}

/** MMM D, YYYY — date-only labels */
export function formatLocaleDateLabel(value) {
  return formatUtcToIst(value, "MMM D, YYYY");
}

/** h:mm A — time-only labels */
export function formatLocaleTimeLabel(value) {
  return formatUtcToIst(value, "h:mm A");
}

/** Locale date string for dashboard cards */
export function formatDashboardDate(value) {
  return formatUtcToIst(value, "MMM D, YYYY");
}

/** Locale time string for dashboard cards */
export function formatDashboardTime(value) {
  return formatUtcToIst(value, "h:mm A");
}
