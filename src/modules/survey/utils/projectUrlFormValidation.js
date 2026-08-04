import { getRequiredError, isFormValid } from "../../shared/utils/validation";
import {
  sanitizeDecimal,
  sanitizeInteger,
  getDecimalPlacesError,
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
  "redirectComplete",
  "redirectTerminate",
  "redirectOverQuota",
  "redirectQualityTerm",
  "redirectSurveyClose",
  "completeRewardPoints",
  "validateRewardPoints",
  "terminationRewardPoints",
];

export const PROJECT_URL_REDIRECT_FIELDS = [
  {
    key: "redirectComplete",
    label: "Complete URL",
    path: "/redirect/complete",
    example: "https://spade-community.com/redirect/complete?uid=[identifier]",
  },
  {
    key: "redirectTerminate",
    label: "Terminate URL",
    path: "/redirect/terminate",
    example: "https://spade-community.com/redirect/terminate?uid=[identifier]",
  },
  {
    key: "redirectOverQuota",
    label: "Over Quota URL",
    path: "/redirect/overquota",
    example: "https://spade-community.com/redirect/overquota?uid=[identifier]",
  },
  {
    key: "redirectQualityTerm",
    label: "Quality Term URL",
    path: "/redirect/qualityterm",
    example: "https://spade-community.com/redirect/qualityterm?uid=[identifier]",
  },
  {
    key: "redirectSurveyClose",
    label: "Survey Closed URL",
    path: "/redirect/surveyclose",
    example: "https://spade-community.com/redirect/surveyclose?uid=[identifier]",
  },
];

const REDIRECT_UID_VALUE = "[identifier]";

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
  "terminationRewardPoints",
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
  const placesError = getDecimalPlacesError(value, label, {
    required,
    maxDecimals: PROJECT_URL_CPI_MAX_DECIMALS,
  });
  if (placesError) return placesError;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const [intPart = ""] = trimmed.split(".");
  if (intPart.length > PROJECT_URL_NUMERIC_MAX_DIGITS) {
    return `${label} must be at most ${PROJECT_URL_NUMERIC_MAX_DIGITS} digits`;
  }
  return "";
}

/**
 * Validates redirect URLs: domain may vary, but path + uid=[identifier] must match.
 * All redirect URL fields are required.
 * @param {string} value
 * @param {{ path: string, label: string, example: string }} options
 */
export function getProjectRedirectUrlError(value, { path, label, example }) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return getRequiredError(trimmed, label);

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return `${label} must follow the required format. Example: ${example}`;
  }

  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  const requiredPath = path.replace(/\/+$/, "") || "/";
  if (pathname !== requiredPath) {
    return `${label} must follow the required format. Example: ${example}`;
  }

  if (parsed.searchParams.get("uid") !== REDIRECT_UID_VALUE) {
    return `${label} must follow the required format. Example: ${example}`;
  }

  return "";
}

/**
 * @param {object} form
 */
export function getProjectUrlFormErrors(form) {
  const preScreenerId = form.preScreenerId || form.surveyGroupId;
  const redirectErrors = Object.fromEntries(
    PROJECT_URL_REDIRECT_FIELDS.map(({ key, label, path, example }) => [
      key,
      getProjectRedirectUrlError(form[key], { path, label, example }),
    ])
  );

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
    ...redirectErrors,
    completeRewardPoints: getDecimalFieldError(
      form.completeRewardPoints,
      "Completion Point"
    ),
    validateRewardPoints: getDecimalFieldError(
      form.validateRewardPoints,
      "Validate Point",
      { required: false }
    ),
    terminationRewardPoints: getDecimalFieldError(
      form.terminationRewardPoints,
      "Termination Point",
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
const DECIMAL_FORM_FIELDS = [
  "loi",
  "ir",
  "cpiRate",
  "completeRewardPoints",
  "validateRewardPoints",
  "terminationRewardPoints",
];

/**
 * @param {object} form
 */
export function normalizeProjectUrlFormForState(form) {
  if (!form || typeof form !== "object") return {};

  const normalized = { ...form };
  for (const key of DECIMAL_FORM_FIELDS) {
    if (normalized[key] == null || normalized[key] === "") continue;
    // Enforce max 2 decimals for DB-loaded and typed values alike.
    normalized[key] = sanitizeProjectUrlDecimal(String(normalized[key]));
    if (String(normalized[key]).endsWith(".")) {
      normalized[key] = String(normalized[key]).slice(0, -1);
    }
  }

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
