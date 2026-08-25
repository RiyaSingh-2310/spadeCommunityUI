/**
 * Pre-Screen respondent + report APIs.
 * Survey token (partner URL) is not the admin JWT.
 */

import { API_ROUTES, buildApiUrl } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { getAuthToken } from "../../../services/auth/authStorage";
import { downloadCsvExport } from "../../../services/api/csvExport";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import { clampApiListLimit } from "../../shared/utils/listQueryParams";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";

export const PRESCREEN_RESPONSE_STATUSES = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  TERMINATED: "TERMINATED",
};

function coerceText(value) {
  return String(value ?? "").trim();
}

function isApiSuccess(data) {
  const value = data?.success;
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

function assertSuccess(data, fallback = "Request failed. Please try again.") {
  if (!isApiSuccess(data)) {
    throw new ApiError(coerceText(data?.message) || fallback, data);
  }
  return data;
}

function partnerSurveyRequestOptions(extra = {}) {
  const hasToken = Boolean(getAuthToken());
  return {
    auth: hasToken,
    skipSessionExpiryOn401: true,
    ...extra,
  };
}

function toQuestionId(value) {
  if (value == null || value === "") return value;
  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && String(asNumber) === String(value).trim()) {
    return asNumber;
  }
  return value;
}

/**
 * Answers must always be an array of strings. Do not join or split on commas.
 * @param {unknown} value
 * @returns {string[]}
 */
export function toPreScreenAnswerArray(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  }
  const text = String(value).trim();
  return text ? [text] : [];
}

export function normalizePreScreenStatus(status) {
  const normalized = coerceText(status).toUpperCase().replace(/[\s-]+/g, "_");
  if (Object.values(PRESCREEN_RESPONSE_STATUSES).includes(normalized)) {
    return normalized;
  }
  throw new ApiError("Invalid pre-screen status.", { status });
}

function answerSignature(questionId, answer) {
  return `${String(questionId)}:${JSON.stringify(toPreScreenAnswerArray(answer))}`;
}

const inFlightSaves = new Map();

function buildSavePayload({ token, question, answer }) {
  const surveyToken = coerceText(token);
  if (!surveyToken) {
    throw new ApiError("Missing survey token.", null);
  }
  if (!question || question.id == null || question.id === "") {
    throw new ApiError("Missing pre-screen question.", null);
  }

  const answerArray = toPreScreenAnswerArray(answer);
  if (answerArray.length === 0) {
    throw new ApiError("Please answer this question to continue.", null);
  }

  return {
    token: surveyToken,
    question_id: toQuestionId(question.id),
    question_text: coerceText(
      question.questionTitle ?? question.question_title ?? question.questionText
    ),
    question_type: coerceText(question.questionType ?? question.question_type),
    answer: answerArray,
  };
}

/**
 * POST /api/survey/prescreenResponse
 * One request per intended answer submission. Duplicate in-flight posts are ignored.
 */
export async function savePreScreenResponse({ token, question, answer } = {}) {
  const payload = buildSavePayload({ token, question, answer });
  const signature = answerSignature(payload.question_id, payload.answer);

  const existing = inFlightSaves.get(signature);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const data = await apiRequest(API_ROUTES.survey.prescreenResponse, {
      ...partnerSurveyRequestOptions({ method: "POST" }),
      body: payload,
    });
    assertSuccess(data, "Unable to save the pre-screen answer.");
    return data;
  })();

  inFlightSaves.set(signature, request);
  try {
    return await request;
  } finally {
    inFlightSaves.delete(signature);
  }
}

function buildEndPath(token, status) {
  const surveyToken = coerceText(token);
  if (!surveyToken) {
    throw new ApiError("Missing survey token.", null);
  }
  const normalizedStatus = normalizePreScreenStatus(status);
  const params = new URLSearchParams({
    token: surveyToken,
    status: normalizedStatus,
  });
  return `${API_ROUTES.survey.prescreenResponseEnd}?${params.toString()}`;
}

const inFlightEnds = new Map();

/**
 * GET /api/survey/prescreenResponseEnd?token=&status=
 */
export async function endPreScreenResponse(
  { token, status } = {},
  { keepalive = false } = {}
) {
  const path = buildEndPath(token, status);
  const key = path;

  if (keepalive && typeof fetch === "function") {
    const headers = { Accept: "application/json" };
    const authToken = getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    fetch(buildApiUrl(path), {
      method: "GET",
      headers,
      keepalive: true,
    }).catch(() => {});
    return { success: true, keepalive: true };
  }

  const existing = inFlightEnds.get(key);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const data = await apiRequest(path, partnerSurveyRequestOptions());
    assertSuccess(data, "Unable to update the pre-screen status.");
    return data;
  })();

  inFlightEnds.set(key, request);
  try {
    return await request;
  } finally {
    inFlightEnds.delete(key);
  }
}

function pickField(record, keys) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    const parts = value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  return String(value);
}

function mapPrescreenReportRow(record, index = 0) {
  return {
    id: String(pickField(record, ["id", "record_id", "client_id", "clientId"]) ?? index + 1),
    slNo: formatCellValue(
      pickField(record, ["sl_no", "slNo", "sno", "serial_no", "serialNo"]) ?? index + 1
    ),
    vendorId: formatCellValue(
      pickField(record, ["vendor_id", "vendorId", "Vendor_ID", "supplier_id", "supplierId"])
    ),
    clientId: formatCellValue(
      pickField(record, ["client_id", "clientId", "Client_ID", "ClientId"])
    ),
    ip: formatCellValue(
      pickField(record, ["ip", "ip_address", "ipAddress", "IP", "IP_Address"])
    ),
    question: formatCellValue(
      pickField(record, ["question", "Question", "question_text", "questionText"])
    ),
    answer: formatCellValue(
      pickField(record, ["answer", "Answer", "response", "Response"])
    ),
    status: formatCellValue(pickField(record, ["status", "Status"])),
  };
}

function extractReportRecords(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.records)) return data.data.records;
    if (Array.isArray(data.data.rows)) return data.data.rows;
  }
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

function paginateRows(items, page = 1, limit = 10) {
  const safeLimit = clampApiListLimit(limit);
  const parsedPage = Number(page);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
}

/**
 * GET /api/project-reports/pre-screen-report?projectid=<PROJECT_ID>
 */
export async function getPreScreenReport({
  projectId,
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const resolvedProjectId = coerceText(projectId);
  if (!resolvedProjectId) {
    throw new ApiError("Project id is required.", null);
  }

  const params = new URLSearchParams({ projectid: resolvedProjectId });
  const path = `${API_ROUTES.projectReports.preScreenReport}?${params.toString()}`;
  const data = await apiRequest(path);
  if (data && typeof data === "object" && "success" in data) {
    assertSuccess(data, "Unable to load the pre-screen report.");
  }

  const records = extractReportRecords(data);
  const mapped = records
    .map((record, index) => {
      try {
        return mapPrescreenReportRow(record, index);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const query = normalizeSearchQuery(search).toLowerCase();
  const filtered = query
    ? mapped.filter((row) =>
        Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query))
      )
    : mapped;
  const items = paginateRows(filtered, page, limit);
  const total = extractListTotalFromResponse(data, filtered.length) || filtered.length;

  return {
    success: true,
    items,
    total: query ? filtered.length : total,
    page,
    limit,
  };
}

/**
 * GET /api/project-reports/pre-screen-report/export/csv?projectid=<PROJECT_ID>
 */
export async function downloadPreScreenReportCsv({ projectId } = {}) {
  const resolvedProjectId = coerceText(projectId);
  if (!resolvedProjectId) {
    throw new ApiError("Project id is required.", null);
  }

  const params = new URLSearchParams({ projectid: resolvedProjectId });
  const path = `${API_ROUTES.projectReports.preScreenReportExportCsv}?${params.toString()}`;
  return downloadCsvExport(path, {
    defaultFilename: `pre-screen-report-${resolvedProjectId}.csv`,
  });
}
