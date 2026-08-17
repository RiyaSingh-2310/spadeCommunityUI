/**
 * Partner Mapping quota helpers.
 * Sample size and assigned quota are always scoped to one Project URL ID.
 */

export const PARTNER_QUOTA_EXCEEDS_REMAINING_MESSAGE =
  "Partner quota cannot exceed the remaining available sample size.";

export const PARTNER_QUOTA_SAMPLE_SIZE_UNAVAILABLE_MESSAGE =
  "Sample size is unavailable for this Project URL. Partner quota cannot be submitted.";

function coerceText(value) {
  return String(value ?? "").trim();
}

/**
 * Parse a non-negative number from API/UI values.
 * Returns null when the value is missing or not a valid number — never a default sample size.
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseNonNegativeNumber(value) {
  const text = coerceText(value);
  if (!text || text === "—" || text === "-") return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const num = Number(text);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

/**
 * Read SampleSize from the selected Project URL record only.
 * Does not fall back to another Project URL or a default.
 * @param {object|null|undefined} projectUrl
 * @returns {number|null}
 */
export function readProjectUrlSampleSize(projectUrl) {
  if (!projectUrl || typeof projectUrl !== "object") return null;
  return parseNonNegativeNumber(
    projectUrl.sampleSize ?? projectUrl.SampleSize ?? projectUrl.sample_size
  );
}

/**
 * Assigned partner quota from a mapping row. Missing/invalid values count as 0.
 * @param {unknown} value
 */
export function parsePartnerQuota(value) {
  const parsed = parseNonNegativeNumber(value);
  return parsed == null ? 0 : parsed;
}

/**
 * Sum partner quotas already assigned against the selected Project URL's mappings.
 * @param {Array<{ quota?: unknown }>|null|undefined} rows
 */
export function sumAssignedPartnerQuota(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((sum, row) => sum + parsePartnerQuota(row?.quota), 0);
}

/**
 * Remaining quota for a new or edited mapping against the same Project URL.
 * `excludedQuota` is the original quota of the mapping being edited so it is not double-counted.
 * @param {{ sampleSize: number|null, assignedQuota: number, excludedQuota?: number }} input
 * @returns {number|null}
 */
export function getAvailablePartnerQuota({
  sampleSize,
  assignedQuota,
  excludedQuota = 0,
}) {
  if (sampleSize == null || !Number.isFinite(sampleSize)) return null;
  const assigned = Number.isFinite(Number(assignedQuota)) ? Number(assignedQuota) : 0;
  const excluded = Number.isFinite(Number(excludedQuota)) ? Number(excludedQuota) : 0;
  return Math.max(0, sampleSize - (assigned - excluded));
}

/**
 * Cap an auto-filled quota so it cannot exceed remaining available sample size.
 * @param {unknown} raw
 * @param {number|null} availableQuota
 */
export function capQuotaToAvailable(raw, availableQuota) {
  const parsed = parseNonNegativeNumber(raw);
  if (parsed == null) return coerceText(raw);
  if (availableQuota == null) return String(parsed);
  if (availableQuota <= 0) return "";
  return String(Math.min(parsed, availableQuota));
}

/**
 * Frontend Partner Quota field validation for the selected Project URL.
 * @param {unknown} quota
 * @param {{ sampleSize: number|null, availableQuota: number|null }} options
 */
export function getPartnerQuotaFieldError(
  quota,
  { sampleSize, availableQuota } = {}
) {
  if (sampleSize == null) {
    return PARTNER_QUOTA_SAMPLE_SIZE_UNAVAILABLE_MESSAGE;
  }
  if (availableQuota == null) {
    return PARTNER_QUOTA_SAMPLE_SIZE_UNAVAILABLE_MESSAGE;
  }

  const trimmed = coerceText(quota);
  if (!trimmed) return "Partner quota is required";
  if (!/^\d+$/.test(trimmed)) {
    return "Partner quota must be a valid number.";
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return "Partner quota must be a valid number.";
  }
  if (availableQuota <= 0 || value > availableQuota) {
    return PARTNER_QUOTA_EXCEEDS_REMAINING_MESSAGE;
  }

  return "";
}
