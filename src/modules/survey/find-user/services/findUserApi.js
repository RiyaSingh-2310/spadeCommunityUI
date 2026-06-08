import { ALL_FIND_USER_RECORDS } from "../utils/demoData";

const PAGE_DELAY_MS = 600;

/**
 * Simulates filtered user search with paging.
 * @param {{
 *   surveyId: string,
 *   filters: { questionId: string, answer: string }[],
 *   page?: number,
 *   pageSize?: number,
 *   offset?: number,
 *   limit?: number,
 * }} params
 */
export async function searchFindUsers({
  surveyId,
  filters = [],
  page = 1,
  pageSize = 10,
  offset,
  limit,
}) {
  await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));

  let pool = [...ALL_FIND_USER_RECORDS];

  if (filters.length > 0) {
    const seed = filters.reduce((acc, f) => acc + f.questionId.length + f.answer.length, 0);
    pool = pool.filter((_, idx) => (idx + seed) % 3 !== 0 || filters.length === 1);
  }

  void surveyId;

  const safePageSize = pageSize ?? limit ?? 10;
  const safePage = Math.max(1, page);
  const start =
    offset != null ? offset : (safePage - 1) * safePageSize;
  const slice = pool.slice(start, start + safePageSize);
  const total = pool.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize) || 1);

  return {
    success: true,
    items: slice,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasMore: start + safePageSize < total,
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
