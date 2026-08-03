import { getSurveyProjectDetails } from "./surveyDetailsData";

/** @deprecated Demo/mock only — live forms use Client Management API via useSurveyFormSelectOptions. */
export const SURVEY_CLIENT_OPTIONS = [
  { value: "1", label: "Alpha Corp International" },
  { value: "2", label: "Beta Labs" },
  { value: "3", label: "Gamma Tech" },
  { value: "4", label: "Delta Works" },
  { value: "5", label: "Epsilon Ltd" },
];

/** @deprecated Demo/mock only — live forms use APIs via useSurveyFormSelectOptions. */
export const PROJECT_MANAGER_OPTIONS = [];

/** @deprecated Demo/mock only — live forms use APIs via useSurveyFormSelectOptions. */
export const SALES_MANAGER_OPTIONS = [];

/** @deprecated Demo/mock only — live forms use APIs via useSurveyFormSelectOptions. */
export const RFQ_OPTIONS = [];

/** @deprecated Prefer RFQ_OPTIONS */
export const SALES_PROJECT_OPTIONS = RFQ_OPTIONS;

export const PROJECT_STATUS_OPTIONS = ["Active", "Inactive"];

export const PROJECT_LINK_TYPES = ["Single Link", "Multi Link"];

export const CURRENCY_OPTIONS = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD"];

export const LANGUAGE_OPTIONS = ["English", "Arabic", "German", "French", "Spanish"];

export const SURVEY_GROUP_OPTIONS = [
  { value: "pg-1", label: "Checking Bots" },
  { value: "pg-2", label: "Arabic Survey" },
  { value: "pg-3", label: "German Survey" },
  { value: "pg-4", label: "Security Checks" },
  { value: "pg-5", label: "Questions For Bots" },
];

export const SAMPLE_CSV_CONTENT = `project_name,live_link,test_link
Brand Tracker Q2,https://speed-community.com/survey/live/sample,https://speed-community.com/survey/test/sample
CX Pulse Study,https://speed-community.com/survey/live/sample2,https://speed-community.com/survey/test/sample2`;

export function createEmptySurveyForm() {
  return {
    client: "",
    projectName: "",
    projectCode: "",
    projectManager: "",
    salesManager: "",
    salesProject: "",
    description: "",
    notes: "",
    projectLinkType: "Single Link",
    status: "Active",
    startDate: "",
    endDate: "",
    groupProjectId: "",
  };
}

/**
 * @param {string | undefined} id
 */
export function getDemoSurveyFormForEdit(id) {
  const project = getSurveyProjectDetails(id);
  const numId = Number(String(id).replace(/\D/g, "")) || 1;
  const client =
    SURVEY_CLIENT_OPTIONS[(numId - 1) % SURVEY_CLIENT_OPTIONS.length]?.value ?? "";
  const salesProject = "";

  return {
    ...createEmptySurveyForm(),
    client,
    projectName: project.projectName,
    projectCode: project.surveyId || `PRJ-${10000 + numId}`,
    projectManager: "",
    salesManager: "",
    salesProject,
    description: `<p>${project.description}</p>`,
    projectLinkType: "Single Link",
    notes: project.note,
    status: "Active",
  };
}

export function downloadSurveySampleCsv() {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "survey_links_sample.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
