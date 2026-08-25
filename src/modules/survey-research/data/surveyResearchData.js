/**
 * Survey Research module has no backend API contract in this frontend.
 * Production must not display demo records or fake CRUD success.
 * WORKFLOW_STEPS are static diagram labels, not data records.
 */

export const WORKFLOW_STEPS = [
  { id: "pre-screener", label: "Pre-Screener" },
  { id: "eligibility", label: "Eligibility Check" },
  { id: "customer-survey", label: "Customer Survey" },
  { id: "complete", label: "Survey Complete" },
  { id: "reward", label: "Reward Processing" },
];

export const PRESCREENER_GROUPS = [];

export const PROJECT_SURVEY = null;

export const ANALYTICS_SUMMARY = {
  totalRespondents: 0,
  completed: 0,
  terminated: 0,
  overQuota: 0,
  qualityFailed: 0,
  conversionRate: 0,
  trend: [],
  funnel: [],
};

export function getPreScreenerGroupById() {
  return null;
}

export const SURVEY_RESEARCH_API_UNAVAILABLE_MESSAGE =
  "Survey Research is not connected to a backend API.";
