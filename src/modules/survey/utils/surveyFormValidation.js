import {
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";
import { isProjectCodeTaken } from "../data/mockSurveyStore";

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 * @param {{ excludeId?: string|number }} [options]
 */
export function getSurveyFormErrors(form, options = {}) {
  const projectCode = String(form.projectCode ?? "").trim();
  let projectCodeError = getRequiredError(form.projectCode, "Project Code");

  if (!projectCodeError && projectCode) {
    if (isProjectCodeTaken(projectCode, options.excludeId)) {
      projectCodeError = "Project Code must be unique";
    }
  }

  return {
    client: getRequiredError(form.client, "Client"),
    projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
    projectCode: projectCodeError,
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    projectLinkType: getRequiredError(form.projectLinkType, "Project Link Type"),
    status: getRequiredError(form.status, "Status"),
    salesManager: "",
    salesProject: "",
  };
}

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 * @param {{ excludeId?: string|number }} [options]
 */
export function isSurveyFormSubmittable(form, options = {}) {
  return isFormValid(getSurveyFormErrors(form, options));
}

export const SURVEY_FORM_FIELDS = [
  "client",
  "projectName",
  "projectCode",
  "projectManager",
  "projectLinkType",
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
