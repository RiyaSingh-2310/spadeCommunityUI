/** Languages that have a survey_settings row on the backend. */
export type SurveySettingsLanguage =
  | "English"
  | "Spanish"
  | "French"
  | "German"
  | "Korean"
  | "Chinese"
  | "Hindi"
  | "Japanese";

/** Record returned in `data` by GET /api/survey-settings/public/language/:language. */
export interface SurveySettingRecord {
  id: number;
  language: string;
  complete_redirect_content: string | null;
  terminate_redirect_content: string | null;
  quality_term_redirect_content: string | null;
  survey_close_redirect_content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveySettingsApiResponse<TData> {
  success: boolean;
  message: string;
  data?: TData;
  error?: string;
}

export type SurveySettingByLanguageResponse = SurveySettingsApiResponse<SurveySettingRecord>;

/** PUT /api/survey-settings/:id body. Every field is optional on the backend. */
export interface SurveySettingsUpdateRequest {
  complete_redirect_content: string;
  terminate_redirect_content: string;
  quality_term_redirect_content: string;
  survey_close_redirect_content: string;
}

export type SurveySettingsUpdateResponse = SurveySettingsApiResponse<SurveySettingRecord>;

export type SurveySettingsContentKey =
  | "completeRedirect"
  | "terminateRedirect"
  | "qualityTermRedirect"
  | "surveyCloseRedirect";

/** Survey Settings page form state. */
export interface SurveySettingsFormValues {
  language: string;
  completeRedirect: string;
  terminateRedirect: string;
  qualityTermRedirect: string;
  surveyCloseRedirect: string;
}

/** Mapped GET record used by the Survey Settings page. */
export interface SurveySettingsDetails extends SurveySettingsFormValues {
  id: number;
  language: SurveySettingsLanguage;
  createdAt: string;
  updatedAt: string;
}
