import { createEmptySurveyForm } from "./surveyFormData";

export function createEmptyAddGroupProjectForm() {
  return {
    client: "",
    projectName: "",
    description: "",
    notes: "",
  };
}

export function createEmptySurveyFormForGroup() {
  return {
    ...createEmptySurveyForm(),
    groupProject: "",
  };
}
