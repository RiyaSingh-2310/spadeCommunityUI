import { API_ROUTES } from "../../../../config/api";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../../shared/utils/listResponse";
import { appendListQuery } from "../../../shared/utils/listQueryParams";
import { formatSurveyListDate } from "../../../shared/utils/dateTime";
import { apiStatusToFormValue } from "../../../shared/utils/statusLabels";
import { apiRequest } from "../../../../services/api/client";
import { ApiError } from "../../../../services/api/ApiError";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractQuestionList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function extractSearchList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

function mapYesNo(value) {
  if (value === true || value === 1 || value === "1") return "Yes";
  if (value === false || value === 0 || value === "0") return "No";
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["yes", "y", "true", "completed"].includes(normalized)) return "Yes";
  if (["no", "n", "false", "pending", "incomplete"].includes(normalized)) return "No";
  const raw = String(value ?? "").trim();
  return raw || "—";
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
 * Normalizes question options from the API.
 * @param {unknown} options
 * @returns {string[] | null}
 */
export function normalizeQuestionOptions(options) {
  let parsed = options;

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed
    .map((opt) => String(opt ?? "").trim())
    .filter(Boolean);
}

/**
 * @param {object} record
 */
function mapFindUserQuestion(record) {
  if (!record || typeof record !== "object") return null;
  const id = record.id ?? record.question_id ?? record.questionId;
  if (id == null || id === "") return null;

  return {
    id: String(id),
    question_title: String(
      record.question_title ?? record.questionTitle ?? record.label ?? ""
    ).trim(),
    question_text: String(
      record.question_text ?? record.questionText ?? ""
    ).trim(),
    options: normalizeQuestionOptions(record.options),
    raw: record,
  };
}

/**
 * Maps find-user search API rows into the Find User table shape.
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
    record.panelist_id ?? record.panelistId ?? record.user_id ?? record.userId ?? id;

  const mobile =
    record.mobile ??
    record.mobile_number ??
    record.mobileNumber ??
    record.phone ??
    record.contact_no ??
    "";

  const joiningRaw =
    record.joiningDate ??
    record.joining_date ??
    record.created_at ??
    record.createdAt ??
    "";

  const earnedPointsRaw =
    record.earnedPoints ??
    record.earned_points ??
    record.balance_point ??
    record.balancePoint ??
    record.reward_points ??
    0;

  const earnedPointsNum = Number(earnedPointsRaw);
  const earnedPoints = Number.isFinite(earnedPointsNum)
    ? Math.round(earnedPointsNum * 100) / 100
    : 0;
  const inviteStatus = formatInviteStatus(
    record.inviteStatus ??
      record.invite_status ??
      record.invitation_status ??
      "Not Invited"
  );

  return {
    id: String(id),
    panelistId: String(panelistId),
    name: displayOrDash(record.name ?? record.full_name ?? record.fullName),
    email: displayOrDash(
      record.email ?? record.emailAddress ?? record.email_address
    ),
    mobile: mobile !== "" && mobile != null ? String(mobile) : "—",
    preScreenCompleted: mapYesNo(
      record.preScreenCompleted ??
        record.pre_screen_completed ??
        record.prescreenCompleted ??
        record.questionnaire
    ),
    joiningDate: joiningRaw
      ? formatSurveyListDate(joiningRaw) || displayOrDash(joiningRaw)
      : "—",
    inviteStatus,
    earnedPoints,
    message: String(record.message ?? record.invite_message ?? "").trim(),
    status: apiStatusToFormValue(record.status),
  };
}

/**
 * Reads the selected project language for Find User question filtering.
 * Prefers primary urlInfo language, then project-level language fields.
 * @param {object | null | undefined} project
 * @returns {string} lowercase language slug (e.g. "english")
 */
export function extractProjectLanguage(project) {
  if (!project || typeof project !== "object") return "";

  const urlInfos = Array.isArray(project.urlInfo)
    ? project.urlInfo
    : project.urlInfo && typeof project.urlInfo === "object"
      ? [project.urlInfo]
      : [];

  for (const info of urlInfos) {
    if (!info || typeof info !== "object") continue;
    const fromUrl =
      info.Language ??
      info.language ??
      info.project_language ??
      info.projectLanguage;
    if (fromUrl != null && String(fromUrl).trim() !== "") {
      return String(fromUrl).trim().toLowerCase();
    }
  }

  const raw =
    project.Language ??
    project.language ??
    project.project_language ??
    project.projectLanguage ??
    "";

  return String(raw).trim().toLowerCase();
}

/**
 * @param {object | null | undefined} project
 * @returns {string}
 */
export function extractProjectName(project) {
  if (!project || typeof project !== "object") return "";
  return String(
    project.Project_Name ??
      project.project_name ??
      project.projectName ??
      project.name ??
      ""
  ).trim();
}

/**
 * @param {object | null | undefined} project
 * @returns {string}
 */
export function extractProjectCode(project) {
  if (!project || typeof project !== "object") return "";
  return String(
    project.Project_code ??
      project.project_code ??
      project.survey_id ??
      project.surveyId ??
      ""
  ).trim();
}

/**
 * GET /api/find-user/questions?language={language}
 * @param {string} language
 * @returns {Promise<Array<{
 *   id: string,
 *   question_title: string,
 *   question_text: string,
 *   options: string[] | null,
 *   raw: object,
 * }>>}
 */
export async function getFindUserQuestions(language) {
  const normalizedLanguage = String(language ?? "").trim().toLowerCase();
  if (!normalizedLanguage) {
    throw new ApiError("Project language is required.", null);
  }

  const data = await apiRequest(
    appendListQuery(API_ROUTES.findUser.questions, {
      extra: { language: normalizedLanguage },
    })
  );
  assertSuccess(data);

  return extractQuestionList(data)
    .map(mapFindUserQuestion)
    .filter(Boolean);
}

/**
 * GET /api/find-user/questions/{question_id}/answers
 * @param {string|number} questionId
 * @returns {Promise<string[]>}
 */
export async function getFindUserQuestionAnswers(questionId) {
  const normalizedId = String(questionId ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Question id is required.", null);
  }

  const data = await apiRequest(API_ROUTES.findUser.questionAnswers(normalizedId));
  assertSuccess(data);

  const record =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const options = record?.options;
  return normalizeQuestionOptions(options) ?? [];
}

/**
 * POST /api/find-user/{project_id}/search
 * @param {{
 *   surveyId: string,
 *   filters: { questionId: string, answer: string }[],
 *   page?: number,
 *   pageSize?: number,
 *   limit?: number,
 * }} params
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

  const payloadFilters = (Array.isArray(filters) ? filters : [])
    .map((filter) => {
      const rawQuestionId = filter?.questionId ?? filter?.question_id;
      const numericId = Number(rawQuestionId);
      const questionId = Number.isFinite(numericId) ? numericId : rawQuestionId;
      const answer = String(filter?.answer ?? "").trim();

      if (questionId == null || questionId === "" || !answer) return null;
      return { question_id: questionId, answer };
    })
    .filter(Boolean);

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
 * @param {{
 *   surveyId: string,
 *   userIds: Array<string|number>,
 *   emailTemplateId: string|number,
 * }} params
 */
export async function inviteFindUsers({ surveyId, userIds = [], emailTemplateId }) {
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

  const data = await apiRequest(API_ROUTES.findUser.invite(projectId), {
    method: "POST",
    body: {
      panelist_ids: panelistIds,
      email_template_id: numericTemplateId,
    },
  });
  assertSuccess(data);
  return data;
}

/**
 * GET /api/find-user/{project_id}/invited?page=&limit=
 * @param {{
 *   surveyId: string,
 *   page?: number,
 *   pageSize?: number,
 *   limit?: number,
 * }} params
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
