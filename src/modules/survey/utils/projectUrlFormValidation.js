import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import {
  sanitizeDecimal,
  sanitizeInteger,
} from "../../shared/utils/numericInputUtils";

export const PROJECT_URL_NUMERIC_MAX_DIGITS = 6;
/** @deprecated Use PROJECT_URL_NUMERIC_MAX_DIGITS */
export const PROJECT_URL_INTEGER_MAX_LENGTH = PROJECT_URL_NUMERIC_MAX_DIGITS;
export const PROJECT_URL_CPI_MAX_DECIMALS = 2;

export const PROJECT_URL_FORM_FIELDS = [
  "loi",
  "ir",
  "cpiRate",
  "sampleSize",
  "startDate",
  "endDate",
  "preScreenerId",
  "completeRewardPoints",
  "validateRewardPoints",
];

const DIRTY_COMPARE_KEYS = [
  "discussion",
  "loi",
  "ir",
  "cpiRate",
  "sampleSize",
  "startDate",
  "endDate",
  "country",
  "language",
  "status",
  "liveLink",
  "testLink",
  "geoLocation",
  "urlProtection",
  "uniqueIp",
  "fraudDetection",
  "preScreen",
  "preScreenerId",
  "surveyGroupId",
  "redirectComplete",
  "redirectTerminate",
  "redirectOverQuota",
  "redirectQualityTerm",
  "redirectSurveyClose",
  "completeRewardPoints",
  "validateRewardPoints",
];

export function sanitizeProjectUrlInteger(raw) {
  return sanitizeInteger(raw).slice(0, PROJECT_URL_NUMERIC_MAX_DIGITS);
}

export function sanitizeProjectUrlDecimal(raw) {
  const cleaned = sanitizeDecimal(raw, PROJECT_URL_CPI_MAX_DECIMALS);
  const [intPart = "", decPart] = cleaned.split(".");
  const limitedInt = intPart.slice(0, PROJECT_URL_NUMERIC_MAX_DIGITS);
  if (decPart != null && cleaned.includes(".")) {
    if (cleaned.endsWith(".") && decPart === "") return `${limitedInt}.`;
    return decPart.length > 0 ? `${limitedInt}.${decPart}` : limitedInt;
  }
  return limitedInt;
}

/** @deprecated Use sanitizeProjectUrlDecimal */
export const sanitizeProjectUrlCpi = sanitizeProjectUrlDecimal;

function getIntegerFieldError(value, label, { required = true } = {}) {
  const requiredError = required ? getRequiredError(value, label) : "";
  if (requiredError) return requiredError;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (/[eE]/.test(trimmed)) {
    return `${label} must be a whole number`;
  }
  const digits = sanitizeInteger(trimmed);
  if (!digits) return `${label} must be a whole number`;
  if (digits.length > PROJECT_URL_NUMERIC_MAX_DIGITS) {
    return `${label} must be at most ${PROJECT_URL_NUMERIC_MAX_DIGITS} digits`;
  }
  if (trimmed !== digits) {
    return `${label} must be a whole number`;
  }
  return "";
}

function getDecimalFieldError(value, label, { required = true } = {}) {
  const requiredError = required ? getRequiredError(value, label) : "";
  if (requiredError) return requiredError;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.endsWith(".")) return `${label} is incomplete`;
  if (/[eE]/.test(trimmed)) {
    return `${label} must be a number with up to 2 decimal places`;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return `${label} must be a number with up to 2 decimal places`;
  }
  const [intPart] = trimmed.split(".");
  if (intPart.length > PROJECT_URL_NUMERIC_MAX_DIGITS) {
    return `${label} must be at most ${PROJECT_URL_NUMERIC_MAX_DIGITS} digits`;
  }
  return "";
}

/**
 * @param {object} form
 */
export function getProjectUrlFormErrors(form) {
  const preScreenerId = form.preScreenerId || form.surveyGroupId;
  return {
    loi: getDecimalFieldError(form.loi, "LOI (Minutes)"),
    ir: getDecimalFieldError(form.ir, "IR (%)"),
    cpiRate: getDecimalFieldError(form.cpiRate, "CPI"),
    sampleSize: getIntegerFieldError(form.sampleSize, "Sample Size"),
    startDate: getRequiredError(form.startDate, "Start Date"),
    endDate: getRequiredError(form.endDate, "End Date"),
    preScreenerId: form.preScreen
      ? getRequiredError(preScreenerId, "Pre-Screen Group")
      : "",
    completeRewardPoints: getDecimalFieldError(
      form.completeRewardPoints,
      "Reward Point"
    ),
    validateRewardPoints: getDecimalFieldError(
      form.validateRewardPoints,
      "Validate Reward Point",
      { required: false }
    ),
  };
}

/**
 * @param {object} form
 */
export function isProjectUrlFormValid(form) {
  return isFormValid(getProjectUrlFormErrors(form));
}

const NUMERIC_COMPARE_FIELDS = new Set([
  "loi",
  "ir",
  "cpiRate",
  "sampleSize",
  "completeRewardPoints",
  "validateRewardPoints",
]);

function normalizeComparableValue(key, value) {
  if (typeof value === "boolean") return value;
  if (NUMERIC_COMPARE_FIELDS.has(key)) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";
    const num = Number(trimmed);
    return Number.isFinite(num) ? String(num) : trimmed;
  }
  return String(value ?? "").trim();
}

/**
 * Normalizes loaded/saved form values for stable dirty-state comparisons.
 * @param {object} form
 */
export function normalizeProjectUrlFormForState(form) {
  if (!form || typeof form !== "object") return {};

  const normalized = { ...form };
  for (const key of DIRTY_COMPARE_KEYS) {
    if (typeof normalized[key] === "boolean") continue;
    normalized[key] = normalizeComparableValue(key, normalized[key]);
  }

  const groupId = String(normalized.preScreenerId || normalized.surveyGroupId || "").trim();
  normalized.preScreenerId = groupId;
  normalized.surveyGroupId = groupId;

  return normalized;
}


/**
 * @param {object} current
 * @param {object} original
 */
export function areProjectUrlFormsEqual(current, original) {
  if (!current || !original) return current === original;

  const left = normalizeProjectUrlFormForState(current);
  const right = normalizeProjectUrlFormForState(original);

  for (const key of DIRTY_COMPARE_KEYS) {
    if (typeof left[key] === "boolean" || typeof right[key] === "boolean") {
      if (Boolean(left[key]) !== Boolean(right[key])) return false;
      continue;
    }
    if (normalizeComparableValue(key, left[key]) !== normalizeComparableValue(key, right[key])) {
      return false;
    }
  }

  return true;
}

export function cloneProjectUrlForm(form) {
  return normalizeProjectUrlFormForState({ ...form });
}

export function normalizeProjectUrlStatus(status) {
  const raw = String(status ?? "").trim();
  const key = raw.toLowerCase();
  if (!raw || key === "active" || key === "open") return "Open";
  if (key === "closed" || key === "close") return "Closed";
  if (key === "on hold" || key === "onhold" || key === "hold") return "On Hold";
  if (raw === "Open" || raw === "Closed" || raw === "On Hold") return raw;
  return "Open";
}
