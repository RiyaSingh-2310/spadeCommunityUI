import { ALL_FIND_USER_RECORDS } from "../utils/demoData";

const PAGE_DELAY_MS = 600;

/**
 * Simulates filtered user search with paging.
 * @param {{
 *   surveyId: string,
 *   filters: { questionId: string, answer: string }[],
 *   offset: number,
 *   limit: number,
 * }} params
 */
export async function searchFindUsers({
  surveyId,
  filters = [],
  offset = 0,
  limit = 10,
}) {
  await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));

  let pool = [...ALL_FIND_USER_RECORDS];

  if (filters.length > 0) {
    const seed = filters.reduce((acc, f) => acc + f.questionId.length + f.answer.length, 0);
    pool = pool.filter((_, idx) => (idx + seed) % 3 !== 0 || filters.length === 1);
  }

  void surveyId;

  const slice = pool.slice(offset, offset + limit);
  return {
    success: true,
    items: slice,
    total: pool.length,
    hasMore: offset + limit < pool.length,
  };
}

/**
 * @param {{ surveyId: string, userIds: string[], emailTemplate: string }} params
 */
export async function inviteFindUsers({ surveyId, userIds, emailTemplate }) {
  await new Promise((r) => setTimeout(r, 400));
  void surveyId;
  return {
    success: true,
    message: `Invitation sent using "${emailTemplate}" to ${userIds.length} user(s).`,
  };
}
