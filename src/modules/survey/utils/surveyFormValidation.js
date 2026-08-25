import {
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function getSurveyFormErrors(form) {
  return {
    client: getRequiredError(form.client, "Client"),
    projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
    projectCode: getRequiredError(form.projectCode, "Project Code"),
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    projectLinkType: "",
    status: getRequiredError(form.status, "Status"),
    salesManager: "",
    salesProject: "",
  };
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
  "projectCode",
  "projectManager",
  "status",
];

const SURVEY_FORM_SCALAR_KEYS = [
  "client",
  "projectName",
  "projectCode",
  "projectManager",
  "salesManager",
  "salesProject",
  "description",
  "notes",
  "projectLinkType",
  "status",
  "groupProjectId",
];

/**
 * Deep equality check for project form dirty-state detection.
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

  return true;
}

/**
 * Clone project form state for dirty-state snapshots.
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function cloneSurveyForm(form) {
  return { ...form };
}
