import { API_ROUTES } from "../../../../config/api";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../../shared/utils/listResponse";
import { appendListQuery } from "../../../shared/utils/listQueryParams";
import { formatSurveyListDate } from "../../../shared/utils/dateTime";
import { apiStatusToFormValue, normalizeStatusKey } from "../../../shared/utils/statusLabels";
import { apiRequest } from "../../../../services/api/client";
import { ApiError } from "../../../../services/api/ApiError";
import {
  dedupeQuestionsByIdentity,
  dedupeSelectOptions,
} from "../../utils/dedupeSelectOptions";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

/**
 * Strips trailing question-type labels from a title if present.
 * e.g. "Gender (Radio)" → "Gender"
 * @param {unknown} title
 * @returns {string}
 */
function cleanFindUserQuestionTitle(title) {
  return String(title ?? "")
    .trim()
    .replace(
      /\s*\((radio|dropdown|textbox|checkbox|number|select|text|textarea|input)\)\s*$/i,
      ""
    )
    .trim();
}

function extractQuestionList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Normalizes question options / answer values from the Find User APIs.
 * @param {unknown} options
 * @returns {string[]}
 */
export function normalizeFindUserQuestionOptions(options) {
  let parsed = options;

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  return parsed
    .map((opt) => {
      if (typeof opt === "string" || typeof opt === "number") {
        return String(opt).trim();
      }
      if (!opt || typeof opt !== "object") return "";
      return String(
        opt.label ??
          opt.value ??
          opt.option_text ??
          opt.optionText ??
          opt.answer ??
          ""
      ).trim();
    })
    .filter(Boolean);
}

/**
 * Maps GET /api/find-user/questions records.
 * Contract: { id, question_title, question_type, options }
 * @param {object} record
 */
function mapFindUserQuestion(record) {
  if (!record || typeof record !== "object") return null;
  const id = record.id ?? record.question_id ?? record.questionId;
  if (id == null || id === "") return null;

  const questionTitle = cleanFindUserQuestionTitle(
    record.question_title ??
      record.questionTitle ??
      record.title ??
      record.label ??
      ""
  );
  if (!questionTitle) return null;

  return {
    id: String(id),
    question_title: questionTitle,
    question_type: String(
      record.question_type ?? record.questionType ?? ""
    ).trim(),
    options: normalizeFindUserQuestionOptions(record.options),
  };
}

/**
 * GET /api/find-user/questions
 * Panel Questionnaire questions only (never Question Library / Prescreen).
 * @returns {Promise<Array<{
 *   id: string,
 *   question_title: string,
 *   question_type: string,
 *   options: string[],
 * }>>}
 */
export async function getFindUserQuestions() {
  const data = await apiRequest(API_ROUTES.findUser.questions);
  assertSuccess(data);

  return dedupeQuestionsByIdentity(
    extractQuestionList(data)
      .map(mapFindUserQuestion)
      .filter(Boolean)
  );
}

/**
 * GET /api/find-user/questions/:questionId/answers
 * Contract: { success, data: { id, question_title, question_type, answers: string[] } }
 * @param {string|number} questionId
 * @returns {Promise<{
 *   id: string,
 *   question_title: string,
 *   question_type: string,
 *   answers: string[],
 * }>}
 */
export async function getFindUserQuestionAnswers(questionId) {
  const normalizedId = String(questionId ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Question id is required.", null);
  }

  const data = await apiRequest(
    API_ROUTES.findUser.questionAnswers(normalizedId)
  );
  assertSuccess(data);

  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  return {
    id: String(payload?.id ?? normalizedId),
    question_title: cleanFindUserQuestionTitle(
      payload?.question_title ?? payload?.questionTitle ?? ""
    ),
    question_type: String(
      payload?.question_type ?? payload?.questionType ?? ""
    ).trim(),
    answers: normalizeFindUserQuestionOptions(
      payload?.answers ?? payload?.options
    ),
  };
}

/**
 * Answer Filter options for a selected question.
 * @param {string|number} questionId
 * @returns {Promise<string[]>}
 */
export async function getFindUserAnswerOptions(questionId) {
  const result = await getFindUserQuestionAnswers(questionId);
  return result.answers;
}

function extractEmailTemplateList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.templates)) return data.templates;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * GET /api/email-templates/list — Email Template dropdown options for Find User invite.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function listFindUserEmailTemplateOptions() {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.emailTemplates.list, {
      page: 1,
      limit: 100,
    })
  );
  assertSuccess(data);

  return dedupeSelectOptions(
    extractEmailTemplateList(data)
      .filter((template) => {
        if (!template || typeof template !== "object") return false;
        if (template.id == null || template.id === "") return false;
        const statusKey = normalizeStatusKey(template.status);
        return !statusKey || statusKey === "active";
      })
      .map((template) => {
        const label = String(
          template.title ??
            template.template_key ??
            template.templateKey ??
            template.slug ??
            ""
        ).trim();

        return {
          value: String(template.id),
          label: label || `Template #${template.id}`,
        };
      })
  );
}

function extractSearchList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

function displayOrDash(value) {
  if (value == null) return "—";
  const text = String(value).trim();
  return text !== "" ? text : "—";
}

function formatInviteStatus(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  return raw
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Formats matched_answers from search response for table display.
 * @param {unknown} matchedAnswers
 * @returns {string}
 */
function formatMatchedAnswers(matchedAnswers) {
  if (!Array.isArray(matchedAnswers) || matchedAnswers.length === 0) return "—";

  const parts = matchedAnswers
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") {
        return String(item).trim();
      }
      if (typeof item !== "object") return "";

      const title = String(
        item.question_title ?? item.questionTitle ?? item.question ?? ""
      ).trim();
      const answer = String(
        item.answer ?? item.answers ?? item.value ?? ""
      ).trim();

      if (title && answer) return `${title}: ${answer}`;
      return answer || title;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : "—";
}

function toDisplayNumber(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.round(num * 100) / 100;
}

/**
 * Maps find-user search/invited API rows into the Find User table shape.
 * @param {object} record
 */
function mapFindUserSearchRecord(record) {
  if (!record || typeof record !== "object") return null;

  const id =
    record.id ??
    record.user_id ??
    record.userId ??
    record.panelist_id ??
    record.panelistId;
  if (id == null || id === "") return null;

  const panelistId =
    record.panelist_id ??
    record.panelistId ??
    record.user_id ??
    record.userId ??
    id;

  const joiningRaw =
    record.joiningDate ??
    record.joining_date ??
    record.joined_date ??
    record.joinedDate ??
    record.created_at ??
    record.createdAt ??
    "";

  const invitedAtRaw =
    record.invitedAt ??
    record.invited_at ??
    record.invite_date ??
    record.inviteDate ??
    "";

  const balanceRaw =
    record.balance ??
    record.balance_point ??
    record.balancePoint ??
    null;
  const earnedPointsRaw =
    record.earned_points ??
    record.earnedPoints ??
    record.reward_points ??
    null;

  const messageRaw = record.message ?? record.invite_message ?? "";
  const message =
    messageRaw == null ? "" : String(messageRaw).trim();

  return {
    id: String(id),
    panelistId: String(panelistId),
    name: displayOrDash(record.name ?? record.full_name ?? record.fullName),
    email: displayOrDash(
      record.email ?? record.emailAddress ?? record.email_address
    ),
    balance: toDisplayNumber(balanceRaw, 0),
    joiningDate: joiningRaw
      ? formatSurveyListDate(joiningRaw) || displayOrDash(joiningRaw)
      : "—",
    invitedAt: invitedAtRaw
      ? formatSurveyListDate(invitedAtRaw) || displayOrDash(invitedAtRaw)
      : "—",
    inviteStatus: formatInviteStatus(
      record.inviteStatus ??
        record.invite_status ??
        record.invitation_status ??
        "not_invited"
    ),
    earnedPoints: toDisplayNumber(earnedPointsRaw, 0),
    matchedAnswers: formatMatchedAnswers(
      record.matched_answers ?? record.matchedAnswers
    ),
    message,
    status: apiStatusToFormValue(record.status),
  };
}

/**
 * Builds search filters for POST /api/find-user/:id/search.
 * Contract: [{ question_id: number, answers: string[] }, ...]
 * @param {{ questionId: string, answers?: string[], answer?: string|string[] }[]} filters
 */
export function buildFindUserSearchFilters(filters = []) {
  return (Array.isArray(filters) ? filters : [])
    .map((filter) => {
      const rawQuestionId = filter?.questionId ?? filter?.question_id;
      const numericId = Number(rawQuestionId);
      const questionId = Number.isFinite(numericId) ? numericId : rawQuestionId;

      const rawAnswers = filter?.answers ?? filter?.answer;
      const answers = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
        .map((answer) => String(answer ?? "").trim())
        .filter(Boolean);

      if (questionId == null || questionId === "" || answers.length === 0) {
        return null;
      }

      return {
        question_id: questionId,
        answers,
      };
    })
    .filter(Boolean);
}

function normalizeFindUserLinkMode(value) {
  const mode = String(value ?? "test").trim().toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeNullableLink(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

/**
 * Maps GET /api/find-user/{projectId}/urls records into Find User state shape.
 * Preserves original API field names alongside app-normalized fields.
 * @param {object} record
 */
export function mapFindUserProjectUrl(record) {
  if (!record || typeof record !== "object") return null;

  const id = record.id ?? record.project_url_id ?? record.projectUrlId;
  if (id == null || id === "") return null;

  const projectUrlCode = String(
    record.project_url_code ?? record.projectUrlCode ?? ""
  ).trim();
  const status = String(
    record.Status ?? record.status ?? ""
  ).trim();
  const linkMode = normalizeFindUserLinkMode(
    record.link_mode ?? record.linkMode
  );
  const projectLinkType = String(
    record.Project_Link_Type ??
      record.project_link_type ??
      record.projectLinkType ??
      record.link_type ??
      ""
  ).trim();
  const liveLink = normalizeNullableLink(
    record.Live_Link ?? record.live_link ?? record.liveLink
  );
  const testLink = normalizeNullableLink(
    record.Test_Link ?? record.test_link ?? record.testLink
  );

  return {
    id: String(id),
    projectUrlId: String(id),
    projectUrlCode,
    project_url_code: projectUrlCode,
    status,
    Status: status,
    linkMode,
    link_mode: linkMode,
    projectLinkType,
    Project_Link_Type: projectLinkType,
    project_link_type: projectLinkType,
    liveLink,
    Live_Link: liveLink,
    testLink,
    Test_Link: testLink,
  };
}

/**
 * Resolves the survey/simulator link for a Find User Project URL using link_mode.
 * Never invents URLs — returns null when the selected mode's link is missing.
 * @param {{
 *   linkMode?: string,
 *   link_mode?: string,
 *   liveLink?: string|null,
 *   Live_Link?: string|null,
 *   testLink?: string|null,
 *   Test_Link?: string|null,
 * } | null | undefined} url
 * @returns {string|null}
 */
export function resolveFindUserProjectUrlLink(url) {
  if (!url || typeof url !== "object") return null;
  const mode = normalizeFindUserLinkMode(url.linkMode ?? url.link_mode);
  if (mode === "live") {
    return normalizeNullableLink(url.Live_Link ?? url.liveLink);
  }
  return normalizeNullableLink(url.Test_Link ?? url.testLink);
}

/**
 * GET /api/find-user/{projectId}/urls
 * @param {string|number} projectId
 * @returns {Promise<Array<ReturnType<typeof mapFindUserProjectUrl>>>}
 */
export async function getProjectUrlsForFindUser(projectId) {
  const normalizedId = String(projectId ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Project id is required.", null);
  }

  const data = await apiRequest(API_ROUTES.findUser.projectUrls(normalizedId));
  assertSuccess(data);

  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapFindUserProjectUrl).filter(Boolean);
}

/**
 * POST /api/find-user/{project_id}/search
 */
export async function searchFindUsers({
  surveyId,
  filters = [],
  page = 1,
  pageSize = 10,
  limit,
}) {
  const projectId = String(surveyId ?? "").trim();
  if (!projectId || projectId === "undefined" || projectId === "null") {
    throw new ApiError("Project id is required.", null);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(pageSize ?? limit) || 10);
  const payloadFilters = buildFindUserSearchFilters(filters);

  const data = await apiRequest(API_ROUTES.findUser.search(projectId), {
    method: "POST",
    body: {
      filters: payloadFilters,
      page: safePage,
      limit: safeLimit,
    },
  });
  assertSuccess(data);

  const records = extractSearchList(data);
  const items = safeMapListItems(records, mapFindUserSearchRecord);
  const total = extractListTotalFromResponse(data, items.length);
  const responsePage = Number(data.page);
  const responseLimit = Number(data.limit ?? data.pageSize);
  const responseTotalPages = Number(data.totalPages ?? data.total_pages);
  const resolvedPageSize =
    Number.isFinite(responseLimit) && responseLimit > 0
      ? responseLimit
      : safeLimit;
  const resolvedPage =
    Number.isFinite(responsePage) && responsePage > 0 ? responsePage : safePage;
  const resolvedTotalPages = Number.isFinite(responseTotalPages)
    ? Math.max(0, responseTotalPages)
    : resolvedPageSize > 0
      ? Math.ceil(total / resolvedPageSize)
      : 0;

  return {
    success: true,
    items,
    total,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    totalPages: resolvedTotalPages,
    hasMore: resolvedPage * resolvedPageSize < total,
  };
}

/**
 * POST /api/find-user/{project_id}/invite
 */
export async function inviteFindUsers({
  surveyId,
  userIds = [],
  emailTemplateId,
  projectUrlId,
}) {
  const projectId = String(surveyId ?? "").trim();
  if (!projectId || projectId === "undefined" || projectId === "null") {
    throw new ApiError("Project id is required.", null);
  }

  const panelistIds = (Array.isArray(userIds) ? userIds : [])
    .map((id) => {
      const numericId = Number(id);
      return Number.isFinite(numericId) ? numericId : null;
    })
    .filter((id) => id != null);

  if (panelistIds.length === 0) {
    throw new ApiError("Select at least one user to invite.", null);
  }

  const numericTemplateId = Number(emailTemplateId);
  if (!Number.isFinite(numericTemplateId)) {
    throw new ApiError("Email template is required.", null);
  }

  const normalizedProjectUrlId = String(projectUrlId ?? "").trim();
  if (!normalizedProjectUrlId) {
    throw new ApiError("Project URL is required.", null);
  }

  const numericProjectUrlId = Number(normalizedProjectUrlId);
  const body = {
    panelist_ids: panelistIds,
    email_template_id: numericTemplateId,
    project_url_id: Number.isFinite(numericProjectUrlId)
      ? numericProjectUrlId
      : normalizedProjectUrlId,
  };

  const data = await apiRequest(API_ROUTES.findUser.invite(projectId), {
    method: "POST",
    body,
  });
  assertSuccess(data);
  return data;
}

/**
 * GET /api/find-user/{project_id}/invited?page=&limit=
 */
export async function getInvitedFindUsers({
  surveyId,
  page = 1,
  pageSize = 10,
  limit,
}) {
  const projectId = String(surveyId ?? "").trim();
  if (!projectId || projectId === "undefined" || projectId === "null") {
    throw new ApiError("Project id is required.", null);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(pageSize ?? limit) || 10);

  const data = await apiRequest(
    appendListQuery(API_ROUTES.findUser.invited(projectId), {
      page: safePage,
      limit: safeLimit,
    })
  );
  assertSuccess(data);

  const records = extractSearchList(data);
  const items = safeMapListItems(records, mapFindUserSearchRecord);
  const total = extractListTotalFromResponse(data, items.length);
  const responsePage = Number(data.page);
  const responseLimit = Number(data.limit ?? data.pageSize);
  const responseTotalPages = Number(data.totalPages ?? data.total_pages);
  const resolvedPageSize =
    Number.isFinite(responseLimit) && responseLimit > 0
      ? responseLimit
      : safeLimit;
  const resolvedPage =
    Number.isFinite(responsePage) && responsePage > 0 ? responsePage : safePage;
  const resolvedTotalPages = Number.isFinite(responseTotalPages)
    ? Math.max(0, responseTotalPages)
    : resolvedPageSize > 0
      ? Math.ceil(total / resolvedPageSize)
      : 0;

  return {
    success: true,
    items,
    total,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    totalPages: resolvedTotalPages,
  };
}
