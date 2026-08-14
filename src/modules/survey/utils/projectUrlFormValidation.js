import { getDateRangeError, getRequiredError, isFormValid } from "../../shared/utils/validation";
import {
  sanitizeDecimal,
  sanitizeInteger,
  getDecimalPlacesError,
} from "../../shared/utils/numericInputUtils";
import {
  getSurveyLinkPlaceholderError,
  isSupportedUidPlaceholder,
  readPidUidFromUrl,
} from "./surveyLinkPlaceholders";

export const PROJECT_URL_NUMERIC_MAX_DIGITS = 6;
/** @deprecated Use PROJECT_URL_NUMERIC_MAX_DIGITS */
export const PROJECT_URL_INTEGER_MAX_LENGTH = PROJECT_URL_NUMERIC_MAX_DIGITS;
export const PROJECT_URL_CPI_MAX_DECIMALS = 2;

export const PROJECT_URL_FORM_FIELDS = [
  "projectUrlCode",
  "loi",
  "ir",
  "cpiRate",
  "sampleSize",
  "startDate",
  "endDate",
  "liveLink",
  "testLink",
  "preScreenerId",
  "redirectComplete",
  "redirectTerminate",
  "redirectOverQuota",
  "redirectQualityTerm",
  "redirectSurveyClose",
  "completeRewardPoints",
  "terminationRewardPoints",
];

export const PROJECT_URL_REDIRECT_FIELDS = [
  {
    key: "redirectComplete",
    label: "Complete URL",
    path: "/redirect/complete",
    example:
      "https://spade-community.com/redirect/complete?pid=xxxx&uid=[identifier]",
  },
  {
    key: "redirectTerminate",
    label: "Terminate URL",
    path: "/redirect/terminate",
    example:
      "https://spade-community.com/redirect/terminate?pid=xxxx&uid=[identifier]",
  },
  {
    key: "redirectOverQuota",
    label: "Quota Full URL",
    path: "/redirect/quota-full",
    /** Accept legacy `/redirect/overquota` URLs already saved in the API. */
    acceptedPaths: ["/redirect/quota-full", "/redirect/overquota"],
    example:
      "https://spade-community.com/redirect/overquota?pid=xxxx&uid=[identifier]",
  },
  {
    key: "redirectQualityTerm",
    label: "Quality Term URL",
    path: "/redirect/qualityterm",
    acceptedPaths: ["/redirect/qualityterm", "/redirect/quality-terminate"],
    example:
      "https://spade-community.com/redirect/qualityterm?pid=xxxx&uid=[identifier]",
  },
  {
    key: "redirectSurveyClose",
    label: "Survey Closed URL",
    path: "/redirect/surveyclose",
    acceptedPaths: ["/redirect/surveyclose", "/redirect/survey-closed"],
    example:
      "https://spade-community.com/redirect/surveyclose?pid=xxxx&uid=[identifier]",
  },
];

/** Default redirect URLs used only when creating a new Project URL. */
export function getDefaultProjectUrlRedirects() {
  return Object.fromEntries(
    PROJECT_URL_REDIRECT_FIELDS.map(({ key, example }) => [key, example])
  );
}

const DIRTY_COMPARE_KEYS = [
  "projectUrlCode",
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
  "projectLinkType",
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
 * Validates redirect URLs: domain may vary, but path + pid + uid placeholder must match.
 * pid may be any non-empty value. uid must be identifier or XXXX (case-insensitive).
 * All redirect URL fields are required.
 * @param {string} value
 * @param {{ path: string, label: string, example: string, acceptedPaths?: string[] }} options
 */
export function getProjectRedirectUrlError(
  value,
  { path, label, example, acceptedPaths }
) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return getRequiredError(trimmed, label);

  const { url, hasPid, hasUid, uid, uidIsPlaceholder } = readPidUidFromUrl(trimmed);
  if (!url) {
    return `${label} must follow the required format. Example: ${example}`;
  }

  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const allowedPaths = (
    Array.isArray(acceptedPaths) && acceptedPaths.length > 0
      ? acceptedPaths
      : [path]
  ).map((entry) => String(entry ?? "").replace(/\/+$/, "") || "/");

  if (!allowedPaths.includes(pathname)) {
    return `${label} must follow the required format. Example: ${example}`;
  }

  if (!hasPid && !uidIsPlaceholder) {
    return `${label} must include both PID and a supported UID placeholder (identifier or XXXX).`;
  }
  if (!hasPid) {
    return `${label} must include a PID query parameter.`;
  }
  if (!hasUid) {
    return `${label} must include a UID query parameter.`;
  }
  if (!isSupportedUidPlaceholder(uid)) {
    return `${label} must include a supported UID placeholder (identifier or XXXX).`;
  }

  return "";
}

/**
 * @param {object} form
 * @param {{ isMultiLink?: boolean, csvLinkCount?: number|null }} [options]
 */
export function getProjectUrlFormErrors(
  form,
  { isMultiLink = false, csvLinkCount = null } = {}
) {
  const preScreenerId = form.preScreenerId || form.surveyGroupId;
  const redirectErrors = Object.fromEntries(
    PROJECT_URL_REDIRECT_FIELDS.map(
      ({ key, label, path, example, acceptedPaths }) => [
        key,
        getProjectRedirectUrlError(form[key], {
          path,
          label,
          example,
          acceptedPaths,
        }),
      ]
    )
  );

  const liveLinkError = isMultiLink
    ? ""
    : getRequiredError(form.liveLink, "Live Link") ||
      getSurveyLinkPlaceholderError(form.liveLink, "Live Link");
  const testLinkError = isMultiLink
    ? ""
    : getSurveyLinkPlaceholderError(form.testLink, "Test Link");

  let sampleSizeError = getIntegerFieldError(form.sampleSize, "Sample Size");
  if (
    !sampleSizeError &&
    isMultiLink &&
    csvLinkCount != null &&
    Number.isFinite(Number(csvLinkCount))
  ) {
    const sampleSize = Number(form.sampleSize);
    if (
      Number.isFinite(sampleSize) &&
      sampleSize !== Number(csvLinkCount)
    ) {
      sampleSizeError = "Sample size and no. of links not equal";
    }
  }

  return {
    projectUrlCode: getRequiredError(form.projectUrlCode, "Project URL Code"),
    loi: getDecimalFieldError(form.loi, "LOI (Minutes)"),
    ir: getDecimalFieldError(form.ir, "IR (%)"),
    cpiRate: getDecimalFieldError(form.cpiRate, "CPI"),
    sampleSize: sampleSizeError,
    startDate: getRequiredError(form.startDate, "Start Date"),
    endDate:
      getRequiredError(form.endDate, "End Date") ||
      getDateRangeError(form.startDate, form.endDate),
    liveLink: liveLinkError,
    testLink: testLinkError,
    preScreenerId: form.preScreen
      ? getRequiredError(preScreenerId, "Pre-Screen Group")
      : "",
    ...redirectErrors,
    completeRewardPoints: getDecimalFieldError(
      form.completeRewardPoints,
      "Completion Point"
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
export function isProjectUrlFormValid(form, options) {
  return isFormValid(getProjectUrlFormErrors(form, options));
}

const NUMERIC_COMPARE_FIELDS = new Set([
  "loi",
  "ir",
  "cpiRate",
  "sampleSize",
  "completeRewardPoints",
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

  const linkType = String(normalized.projectLinkType ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
  normalized.projectLinkType =
    linkType === "multilink" || linkType === "multi"
      ? "Multi Link"
      : "Single Link";

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
