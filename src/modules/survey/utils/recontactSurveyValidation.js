import {
  getDateRangeError,
  getOptionalUrlError,
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";
import {
  DEFAULT_DECIMAL_PLACES,
  getDecimalPlacesError,
} from "../../shared/utils/numericInputUtils";

function getPositiveNumberError(value, label) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) {
    return `${label} must be a valid number greater than 0`;
  }
  return "";
}

function getPositiveDecimalError(value, label) {
  const placesError = getDecimalPlacesError(value, label, {
    required: true,
    maxDecimals: DEFAULT_DECIMAL_PLACES,
  });
  if (placesError) return placesError;
  const num = Number(String(value ?? "").trim());
  if (!Number.isFinite(num) || num <= 0) {
    return `${label} must be a valid number greater than 0`;
  }
  return "";
}

function getNonNegativeNumberError(value, label) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) {
    return `${label} must be a valid number`;
  }
  return "";
}

/**
 * @param {ReturnType<import('../services/recontactSurveyApi').createEmptyRecontactSurveyForm>} form
 */
export function getRecontactSurveyFormErrors(form) {
  const isSingleLink = form.projectLinkType === "Single Link";

  const errors = {
    client: getRequiredError(form.client, "Client"),
    projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
    loi: getPositiveNumberError(form.loi, "LOI"),
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    ir: getPositiveNumberError(form.ir, "IR"),
    sampleSize: getPositiveNumberError(form.sampleSize, "Sample Size"),
    currency: getRequiredError(form.currency, "Currency"),
    respondentClickQuota: getNonNegativeNumberError(
      form.respondentClickQuota,
      "Respondent Click Quota"
    ),
    cpi: getPositiveDecimalError(form.cpi, "CPI"),
    startDate: getRequiredError(form.startDate, "Start Date"),
    endDate: getRequiredError(form.endDate, "End Date"),
    liveUrl: isSingleLink
      ? getOptionalUrlError(form.liveUrl, "Live Link")
      : "",
    testUrl: isSingleLink
      ? getOptionalUrlError(form.testUrl, "Test Link")
      : "",
    language: form.filters?.preScreen
      ? getRequiredError(form.language, "Language")
      : "",
  };

  const rangeError = getDateRangeError(form.startDate, form.endDate);
  if (rangeError) {
    errors.endDate = rangeError;
  }

  return errors;
}

export function isRecontactSurveyFormSubmittable(form) {
  return isFormValid(getRecontactSurveyFormErrors(form));
}

export const RECONTACT_SURVEY_FORM_FIELDS = [
  "client",
  "projectName",
  "loi",
  "projectManager",
  "ir",
  "sampleSize",
  "currency",
  "respondentClickQuota",
  "cpi",
  "startDate",
  "endDate",
  "liveUrl",
  "testUrl",
  "language",
];
