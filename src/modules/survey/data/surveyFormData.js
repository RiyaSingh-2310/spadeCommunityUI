import { getSurveyProjectDetails } from "./surveyDetailsData";

export const SURVEY_CLIENT_OPTIONS = [
  { value: "CL-1001", label: "Alpha Corp International" },
  { value: "CL-1002", label: "Beta Labs" },
  { value: "CL-1003", label: "Gamma Tech" },
  { value: "CL-1004", label: "Delta Works" },
  { value: "CL-1005", label: "Epsilon Ltd" },
];

export const PROJECT_MANAGER_OPTIONS = [
  "Priya Desai",
  "Arun Kumar",
  "Meera Shah",
  "Rohan Verma",
  "Anita Patel",
];

export const COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "India",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Singapore",
];

export const SALES_MANAGER_OPTIONS = [
  "Arun Kumar",
  "Sneha Rao",
  "Vikram Singh",
  "Kavya Nair",
];

export const SALES_PROJECT_OPTIONS = [
  "SP-2026-014",
  "SP-2026-022",
  "SP-2026-031",
  "SP-2026-045",
];

export const CURRENCY_OPTIONS = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD"];

export const LANGUAGE_OPTIONS = ["English", "Arabic", "German", "French", "Spanish"];

export const SURVEY_GROUP_OPTIONS = [
  { value: "pg-1", label: "Checking Bots" },
  { value: "pg-2", label: "Arabic Survey" },
  { value: "pg-3", label: "German Survey" },
  { value: "pg-4", label: "Security Checks" },
  { value: "pg-5", label: "Questions For Bots" },
];

export const PROJECT_LINK_TYPES = ["Single Link", "Multi Link"];

export const SAMPLE_CSV_CONTENT = `project_name,live_link,test_link
Brand Tracker Q2,https://speed-community.com/survey/live/sample,https://speed-community.com/survey/test/sample
CX Pulse Study,https://speed-community.com/survey/live/sample2,https://speed-community.com/survey/test/sample2`;

export function createEmptySurveyForm() {
  return {
    client: "",
    projectName: "",
    projectManager: "",
    projectCountry: "",
    salesManager: "",
    salesProject: "",
    description: "",
    loi: "",
    ir: "",
    sampleSize: "",
    currency: "",
    cpi: "",
    startDate: "",
    endDate: "",
    projectLinkType: "Single Link",
    liveLink: "",
    testLink: "",
    surveyCsvFile: null,
    existingSurveyCsvFileName: "",
    existingMultiLinkSurvey: false,
    filters: {
      geoLocation: false,
      urlProtection: false,
      uniqueIp: false,
      preScreen: false,
    },
    language: "",
    surveyGroup: "",
    userTerminationPoint: "",
    userCompletionPoint: "",
    notes: "",
    groupProjectId: "",
    partners: [],
    partnerAllocations: {},
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

  return {
    ...createEmptySurveyForm(),
    client,
    projectName: project.projectName,
    projectManager: project.projectManager,
    projectCountry: project.projectCountry,
    salesManager: project.salesManager,
    salesProject: project.salesProject,
    description: `<p>${project.description}</p>`,
    loi: String(project.loiMinutes),
    ir: String(project.irPercent),
    sampleSize: String(project.sampleSize),
    currency: "USD",
    cpi: project.cpiUsd,
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    projectLinkType: "Single Link",
    liveLink: project.liveLink,
    testLink: project.testLink,
    filters: {
      geoLocation: project.filters.geolocation,
      urlProtection: project.filters.urlProtection,
      uniqueIp: project.filters.uniqueIp,
      preScreen: project.filters.prescreen,
    },
    language: project.filters.prescreen ? "English" : "",
    surveyGroup: project.filters.prescreen ? "pg-1" : "",
    userTerminationPoint: project.redirectLinks.terminate,
    userCompletionPoint: project.redirectLinks.complete,
    notes: project.note,
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
