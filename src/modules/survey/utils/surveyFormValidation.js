import {
  getDateRangeError,
  getOptionalUrlError,
  getRequiredError,
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

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function getSurveyFormErrors(form) {
  const errors = {
    client: getRequiredError(form.client, "Client"),
    projectName: getRequiredError(form.projectName, "Project Name"),
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    projectCountry: getRequiredError(form.projectCountry, "Project Country"),
    loi: getPositiveNumberError(form.loi, "LOI"),
    ir: getPositiveNumberError(form.ir, "IR"),
    sampleSize: getPositiveNumberError(form.sampleSize, "Sample Size"),
    currency: getRequiredError(form.currency, "Currency"),
    cpi: getPositiveNumberError(form.cpi, "CPI"),
    startDate: getRequiredError(form.startDate, "Start Date"),
    endDate: getRequiredError(form.endDate, "End Date"),
    projectLinkType: getRequiredError(form.projectLinkType, "Project Link Type"),
    userTerminationPoint: getRequiredError(
      form.userTerminationPoint,
      "User Termination Point"
    ),
    userCompletionPoint: getRequiredError(
      form.userCompletionPoint,
      "User Completion Point"
    ),
    liveLink: getOptionalUrlError(form.liveLink, "Live Link"),
    testLink: getOptionalUrlError(form.testLink, "Test Link"),
    surveyCsvFile: "",
    language: "",
    surveyGroup: "",
  };

  const dateRangeError = getDateRangeError(form.startDate, form.endDate);
  if (dateRangeError) {
    errors.endDate = dateRangeError;
  }

  if (form.filters.preScreen) {
    errors.language = getRequiredError(form.language, "Language");
  }

  return errors;
}

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function isSurveyFormSubmittable(form) {
  return isFormValid(getSurveyFormErrors(form));
}

export const SURVEY_FORM_FIELDS = [
  "client",
  "projectName",
  "projectManager",
  "projectCountry",
  "loi",
  "ir",
  "sampleSize",
  "currency",
  "cpi",
  "startDate",
  "endDate",
  "projectLinkType",
  "liveLink",
  "testLink",
  "surveyCsvFile",
  "language",
  "surveyGroup",
  "userTerminationPoint",
  "userCompletionPoint",
];

const SURVEY_FORM_SCALAR_KEYS = [
  "client",
  "projectName",
  "projectManager",
  "projectCountry",
  "salesManager",
  "salesProject",
  "description",
  "loi",
  "ir",
  "sampleSize",
  "currency",
  "cpi",
  "startDate",
  "endDate",
  "projectLinkType",
  "liveLink",
  "testLink",
  "language",
  "surveyGroup",
  "userTerminationPoint",
  "userCompletionPoint",
  "notes",
  "existingSurveyCsvFileName",
];

const SURVEY_FORM_META_KEYS = ["existingMultiLinkSurvey"];

const SURVEY_FILTER_KEYS = ["geoLocation", "urlProtection", "uniqueIp", "preScreen"];

/**
 * Deep equality check for survey form dirty-state detection.
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} current
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} original
 */
export function areSurveyFormsEqual(current, original) {
  if (!current || !original) return current === original;

  for (const key of SURVEY_FORM_SCALAR_KEYS) {
    if (String(current[key] ?? "") !== String(original[key] ?? "")) {
      return false;
    }
  }

  for (const key of SURVEY_FILTER_KEYS) {
    if (Boolean(current.filters?.[key]) !== Boolean(original.filters?.[key])) {
      return false;
    }
  }

  const currentFileName =
    current.surveyCsvFile?.name ?? current.existingSurveyCsvFileName ?? "";
  const originalFileName =
    original.surveyCsvFile?.name ?? original.existingSurveyCsvFileName ?? "";
  if (currentFileName !== originalFileName) {
    return false;
  }

  for (const key of SURVEY_FORM_META_KEYS) {
    if (Boolean(current[key]) !== Boolean(original[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Clone survey form state for dirty-state snapshots.
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function cloneSurveyForm(form) {
  return {
    ...form,
    filters: { ...form.filters },
    surveyCsvFile: null,
  };
}
