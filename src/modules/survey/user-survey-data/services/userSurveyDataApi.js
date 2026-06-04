/**
 * Placeholder for future User Survey Data API.
 * @param {string} surveyId
 * @param {{ query?: string, page?: number, pageSize?: number }} params
 */
export async function fetchUserSurveyData(surveyId, params = {}) {
  void surveyId;
  void params;
  await new Promise((r) => setTimeout(r, 200));
  return {
    success: true,
    items: [],
    total: 0,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  };
}
