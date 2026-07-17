import {
  getDateRangeError,
  getOptionalUrlError,
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";

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
    cpi: getPositiveNumberError(form.cpi, "CPI"),
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

  const dateRangeError = getDateRangeError(form.startDate, form.endDate);
  if (dateRangeError) {
    errors.endDate = dateRangeError;
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
