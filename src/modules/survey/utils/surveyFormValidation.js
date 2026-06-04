import {
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
    liveLink: "",
    testLink: "",
    surveyCsvFile: "",
    language: "",
    surveyGroup: "",
  };

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = "End Date cannot be earlier than Start Date";
  }

  if (form.projectLinkType === "Single Link") {
    errors.liveLink = getRequiredError(form.liveLink, "Live Link");
    errors.testLink = getRequiredError(form.testLink, "Test Link");
  } else if (form.projectLinkType === "Multi Link") {
    if (!form.surveyCsvFile) {
      errors.surveyCsvFile = "Survey file is required";
    }
  }

  if (form.filters.preScreen) {
    errors.language = getRequiredError(form.language, "Language");
    errors.surveyGroup = getRequiredError(form.surveyGroup, "Survey Group");
  }

  return errors;
}

/**
 * @param {ReturnType<import('../data/surveyFormData').createEmptySurveyForm>} form
 */
export function isSurveyFormSubmittable(form) {
  return isFormValid(getSurveyFormErrors(form));
}
