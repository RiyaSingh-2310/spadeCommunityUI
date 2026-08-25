export const PROJECT_STATUS_OPTIONS = ["Active", "Inactive"];

export const PROJECT_LINK_TYPES = ["Single Link", "Multi Link"];

export const CURRENCY_OPTIONS = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD"];

export const LANGUAGE_OPTIONS = ["English", "Arabic", "German", "French", "Spanish"];

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

export function downloadSurveySampleCsv() {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "survey_links_sample.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
