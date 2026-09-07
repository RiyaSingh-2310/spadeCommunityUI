import {
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValid,
} from "../../shared/utils/validation";

export const PROJECT_NAME_DUPLICATE_MESSAGE =
  "Project Name already exists. Please enter a unique Project Name.";

export const PROJECT_CODE_DUPLICATE_MESSAGE =
  "Project code already exists. Please use a unique project code.";

/**
 * Exact-name uniqueness key: trim surrounding space, collapse inner space, ignore case.
 * "Test Project 1" and "Test Project - Copy" stay distinct from "Test Project".
 */
export function normalizeProjectNameForUniqueness(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isSameProjectName(left, right) {
  const a = normalizeProjectNameForUniqueness(left);
  const b = normalizeProjectNameForUniqueness(right);
  return Boolean(a) && a === b;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isProjectNameDuplicateError(error) {
  const message = String(
    error?.message ?? error?.data?.message ?? error?.data?.error ?? ""
  ).toLowerCase();
  if (!message) return false;
  return (
    (message.includes("project name") || message.includes("project_name")) &&
    (message.includes("already exists") ||
      message.includes("duplicate") ||
      message.includes("unique"))
  ) || (
    message.includes("already exists") &&
    (message.includes("name") || message.includes("project"))
  );
}

export function isProjectCodeDuplicateError(error) {
  const message = String(
    error?.message ?? error?.data?.message ?? error?.data?.error ?? ""
  ).toLowerCase();
  if (!message) return false;
  return (
    (message.includes("project code") ||
      message.includes("project_code") ||
      message.includes("survey_id")) &&
    (message.includes("already exists") ||
      message.includes("duplicate") ||
      message.includes("unique"))
  );
}

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 * @param {{ projectNameTaken?: boolean, projectCodeTaken?: boolean }} [options]
 */
export function getSurveyFormErrors(
  form,
  { projectNameTaken = false, projectCodeTaken = false } = {}
) {
  return {
    client: getRequiredError(form.client, "Client"),
    projectName:
      getRequiredMaxLengthError(form.projectName, "Project Name") ||
      (projectNameTaken ? PROJECT_NAME_DUPLICATE_MESSAGE : ""),
    projectCode:
      getRequiredError(form.projectCode, "Project Code") ||
      (projectCodeTaken ? PROJECT_CODE_DUPLICATE_MESSAGE : ""),
    projectManager: getRequiredError(form.projectManager, "Project Manager"),
    projectLinkType: "",
    status: getRequiredError(form.status, "Status"),
    salesManager: "",
    salesProject: "",
  };
}

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 * @param {{ projectNameTaken?: boolean }} [options]
 */
export function isSurveyFormSubmittable(form, options) {
  return isFormValid(getSurveyFormErrors(form, options));
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
