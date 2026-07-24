import { API_ROUTES } from "../../../config/api";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import {
  formatActivityLogDate,
  formatLocaleDateLabel,
  formatLocaleTimeLabel,
} from "../../shared/utils/dateTime";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractMessageList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.messages)) return data.messages;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function parseIsRead(value) {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["read", "true", "yes", "y"].includes(normalized)) return true;
  if (["unread", "false", "no", "n"].includes(normalized)) return false;
  return Boolean(value);
}

/**
 * @param {object} record
 */
export function mapMessageRecord(record) {
  if (!record || typeof record !== "object") return null;

  const id = record.id ?? record.message_id ?? record.messageId;
  if (id == null || id === "") return null;

  const createdRaw =
    record.created_at ??
    record.createdAt ??
    record.date ??
    record.datetime ??
    "";

  const isRead = parseIsRead(
    record.is_read ?? record.isRead ?? record.read ?? record.status
  );

  const name = String(
    record.sender_name ??
      record.senderName ??
      record.name ??
      record.from_name ??
      ""
  ).trim();

  const email = String(
    record.sender_email ??
      record.senderEmail ??
      record.email ??
      record.from_email ??
      ""
  ).trim();

  const subject = String(record.subject ?? record.title ?? "").trim();
  const body = String(
    record.body ?? record.message ?? record.content ?? record.description ?? ""
  );

  return {
    id: String(id),
    name: name || "—",
    email: email || "—",
    subject: subject || "—",
    body,
    isRead,
    createdAt: createdRaw || null,
    dateTime: createdRaw ? formatActivityLogDate(createdRaw) : "—",
    date: createdRaw ? formatLocaleDateLabel(createdRaw) : "—",
    time: createdRaw ? formatLocaleTimeLabel(createdRaw) : "—",
    // Header notification shape
    title: subject || "Message",
    description: body,
    datetime: createdRaw ? formatActivityLogDate(createdRaw) : "—",
    read: isRead,
  };
}

/**
 * GET /api/messages/list?page=&limit=&search=
 */
export async function getMessages({ page = 1, limit = 10, search = "" } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.messages.list, { page, limit, search })
  );
  assertSuccess(data);

  const records = extractMessageList(data);
  const items = safeMapListItems(records, mapMessageRecord);
  const total = extractListTotalFromResponse(data, items.length);
  const unreadCount = Number(data.unreadCount ?? data.unread_count);
  const responsePage = Number(data.page);
  const responseLimit = Number(data.limit ?? data.pageSize);
  const responseTotalPages = Number(data.totalPages ?? data.total_pages);

  return {
    success: true,
    items,
    total,
    page: Number.isFinite(responsePage) && responsePage > 0 ? responsePage : page,
    pageSize:
      Number.isFinite(responseLimit) && responseLimit > 0 ? responseLimit : limit,
    totalPages: Number.isFinite(responseTotalPages)
      ? Math.max(0, responseTotalPages)
      : Math.max(1, Math.ceil(total / (limit || 10)) || 1),
    unreadCount: Number.isFinite(unreadCount) ? unreadCount : undefined,
  };
}

/**
 * GET /api/messages/unread-count
 */
export async function getMessagesUnreadCount() {
  const data = await apiRequest(API_ROUTES.messages.unreadCount);
  assertSuccess(data);
  const unreadCount = Number(data.unreadCount ?? data.unread_count ?? 0);
  return Number.isFinite(unreadCount) ? unreadCount : 0;
}

/**
 * GET /api/messages/:id
 */
export async function getMessage(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Message id is required.", null);
  }

  const data = await apiRequest(API_ROUTES.messages.byId(normalizedId));
  assertSuccess(data);

  const record = data.data ?? data.message ?? data;
  const mapped = mapMessageRecord(record);
  if (!mapped) {
    throw new ApiError("Message not found!", data);
  }
  return mapped;
}

/**
 * PATCH /api/messages/:id/read
 */
export async function markMessageAsRead(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Message id is required.", null);
  }

  const data = await apiRequest(API_ROUTES.messages.markRead(normalizedId), {
    method: "PATCH",
  });
  assertSuccess(data);

  const record = data.data ?? data.message;
  const mapped = record ? mapMessageRecord(record) : null;
  const unreadCount = Number(data.unreadCount ?? data.unread_count);

  return {
    success: true,
    message: data.message,
    item: mapped,
    unreadCount: Number.isFinite(unreadCount) ? unreadCount : undefined,
  };
}

/**
 * PATCH /api/messages/read-all
 */
export async function markAllMessagesAsRead() {
  const data = await apiRequest(API_ROUTES.messages.readAll, {
    method: "PATCH",
  });
  assertSuccess(data);
  const unreadCount = Number(data.unreadCount ?? data.unread_count);
  return {
    success: true,
    message: data.message,
    unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0,
  };
}

/**
 * DELETE /api/messages/:id
 */
export async function deleteMessage(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Message id is required.", null);
  }

  const data = await apiRequest(API_ROUTES.messages.delete(normalizedId), {
    method: "DELETE",
  });
  assertSuccess(data);
  const unreadCount = Number(data.unreadCount ?? data.unread_count);
  return {
    success: true,
    message: data.message,
    unreadCount: Number.isFinite(unreadCount) ? unreadCount : undefined,
  };
}
