import { createEmptySurveyForm } from "./surveyFormData";

export const GROUP_SURVEY_CLIENT_OPTIONS = [
  { value: "C1022", label: "C1022 - NewtonX" },
  { value: "C1034", label: "C1034 - Paradigm Sample" },
  { value: "C1056", label: "C1056 - PureSpectrum" },
  { value: "C1088", label: "C1088 - Dynata" },
];

export const GROUP_PROJECT_NAMES = ["Latvia HCP", "Lithuania HCP", "CZE HCP"];

export const GROUP_PROJECT_MANAGER_OPTIONS = [];

/** @deprecated Demo only — live group forms should load managers from API. */
export const GROUP_SALES_MANAGER_OPTIONS = [];

export const ADD_PROJECT_DEFAULTS = {
  description: "50 HCPs in each country",
  notes: "Project-specific notes and instructions.",
};

export function createEmptyAddGroupProjectForm() {
  return {
    client: "",
    projectName: "",
    description: ADD_PROJECT_DEFAULTS.description,
    notes: ADD_PROJECT_DEFAULTS.notes,
  };
}

export function getDemoGroupSurveyRow(id) {
  const numId = Number(String(id).replace(/\D/g, "")) || 1;
  const client = GROUP_SURVEY_CLIENT_OPTIONS[(numId - 1) % GROUP_SURVEY_CLIENT_OPTIONS.length];
  const groupProject = GROUP_PROJECT_NAMES[(numId - 1) % GROUP_PROJECT_NAMES.length];

  return {
    id: String(id),
    clientName: client.label,
    clientCode: client.value,
    client: client.value,
    projectName: groupProject,
    groupProject,
    status: numId % 5 === 0 ? "Inactive" : "Active",
  };
}

export function getDemoGroupSurveySimpleEditForm(groupId) {
  const group = getDemoGroupSurveyRow(groupId);

  return {
    client: group.client,
    projectName: group.groupProject,
    description: ADD_PROJECT_DEFAULTS.description,
    notes: ADD_PROJECT_DEFAULTS.notes,
  };
}

export function getDemoGroupProjects(groupId) {
  const group = getDemoGroupSurveyRow(groupId);
  const projectNames = [
    `${group.groupProject} Wave A`,
    `${group.groupProject} Wave B`,
    "Brand Tracker Q2",
    "CX Pulse Study",
    "Market Sizing Study",
  ];

  return Array.from({ length: 18 }, (_, idx) => ({
    id: `GP-${String(groupId).replace(/\D/g, "")}-${1001 + idx}`,
    projectName: projectNames[idx % projectNames.length],
    clientCode: group.clientCode,
    loi: String(10 + (idx % 8)),
    ir: String(15 + (idx % 20)),
    startDate: `${String(1 + (idx % 28)).padStart(2, "0")}/03/2026`,
    endDate: `${String(10 + (idx % 18)).padStart(2, "0")}/04/2026`,
    status: idx % 4 === 0 ? "Inactive" : "Active",
  }));
}

export function createEmptySurveyFormForGroup() {
  return {
    ...createEmptySurveyForm(),
    groupProject: "",
  };
}
