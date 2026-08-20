import {
  getDateRangeError,
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";
import { getSurveyLinkPlaceholderError } from "./surveyLinkPlaceholders";
import {
  getProjectNumericDecimalError,
  getProjectNumericIntegerError,
  PROJECT_URL_NUMERIC_MAX_DIGITS,
} from "./projectUrlFormValidation";

export { PROJECT_URL_NUMERIC_MAX_DIGITS };

/**
 * @param {ReturnType<import('../services/recontactSurveyApi').createEmptyRecontactSurveyForm>} form
 */
export function getRecontactSurveyFormErrors(form) {
  const isSingleLink = form.projectLinkType === "Single Link";

  const liveUrlError = isSingleLink
    ? getRequiredError(form.liveUrl, "Live Link") ||
      getSurveyLinkPlaceholderError(form.liveUrl, "Live Link")
    : "";
  const testUrlError = isSingleLink
    ? getSurveyLinkPlaceholderError(form.testUrl, "Test Link")
    : "";

  const errors = {
    client: getRequiredError(form.client, "Client"),
    projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
    loi: getProjectNumericDecimalError(form.loi, "LOI"),
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    ir: getProjectNumericDecimalError(form.ir, "IR"),
    sampleSize: getProjectNumericIntegerError(form.sampleSize, "Sample Size"),
    currency: getRequiredError(form.currency, "Currency"),
    respondentClickQuota: getProjectNumericIntegerError(
      form.respondentClickQuota,
      "Respondent Click Quota"
    ),
    cpi: getProjectNumericDecimalError(form.cpi, "CPI"),
    startDate: getRequiredError(form.startDate, "Start Date"),
    endDate: getRequiredError(form.endDate, "End Date"),
    liveUrl: liveUrlError,
    testUrl: testUrlError,
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
