/**
 * Frontend-only mock defaults for Survey Settings.
 * Replace with API mapping when backend integration is added.
 */
import logoUrl from "../../../assets/SpadeCommunitylogocompressed.png";

/** Styled preview content similar to classic redirect pages (logo + message). */
const MOCK_REDIRECT_HTML = `
<div style="text-align:center;padding:28px 16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <img
    src="${logoUrl}"
    alt="Spade Community"
    style="max-width:240px;width:100%;height:auto;margin:0 auto;"
  />
  <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#475569;">
    Thank you for participating in this survey.
  </p>
</div>
`.trim();

export const SURVEY_SETTINGS_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
];

export const DEFAULT_SURVEY_SETTINGS_FORM = {
  language: "English",
  completeRedirect: MOCK_REDIRECT_HTML,
  terminateRedirect: MOCK_REDIRECT_HTML,
  overQuotaRedirect: MOCK_REDIRECT_HTML,
  qualityTermRedirect: MOCK_REDIRECT_HTML,
  surveyCloseRedirect: MOCK_REDIRECT_HTML,
};

export function createSurveySettingsForm(overrides = {}) {
  return {
    ...DEFAULT_SURVEY_SETTINGS_FORM,
    ...overrides,
  };
}
