import { getSurveyProjectDetails } from "./surveyDetailsData";

export const SURVEY_CLIENT_OPTIONS = [
  { value: "1", label: "Alpha Corp International" },
  { value: "2", label: "Beta Labs" },
  { value: "3", label: "Gamma Tech" },
  { value: "4", label: "Delta Works" },
  { value: "5", label: "Epsilon Ltd" },
];

export const PROJECT_MANAGER_OPTIONS = [
  { value: "1", label: "Priya Desai" },
  { value: "2", label: "Arun Kumar" },
  { value: "3", label: "Meera Shah" },
  { value: "4", label: "Rohan Verma" },
  { value: "5", label: "Anita Patel" },
];

export const SALES_MANAGER_OPTIONS = [
  { value: "1", label: "Arun Kumar" },
  { value: "2", label: "Sneha Rao" },
  { value: "3", label: "Vikram Singh" },
  { value: "4", label: "Kavya Nair" },
];

/** RFQ ID options used when sales/project/list is unavailable. */
export const RFQ_OPTIONS = [
  { value: "PRJ-011", label: "PRJ-011" },
  { value: "PRJ-012", label: "PRJ-012" },
  { value: "PRJ-013", label: "PRJ-013" },
  { value: "PRJ-014", label: "PRJ-014" },
  { value: "PRJ-015", label: "PRJ-015" },
];

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
  const salesProject = RFQ_OPTIONS[(numId - 1) % RFQ_OPTIONS.length]?.value ?? "";

  return {
    ...createEmptySurveyForm(),
    client,
    projectName: project.projectName,
    projectCode: project.surveyId || `PRJ-${10000 + numId}`,
    projectManager: String(1 + ((numId - 1) % 5)),
    salesManager: String(1 + ((numId - 1) % 4)),
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
