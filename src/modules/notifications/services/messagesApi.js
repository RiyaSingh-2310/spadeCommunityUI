import { API_ROUTES } from "../../../config/api";
import { ApiError } from "../../../services/api/ApiError";
import { apiRequest } from "../../../services/api/client";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import {
  formatLocaleDateTime,
  formatLocaleTimeLabel,
  formatSurveyListDate,
} from "../../shared/utils/dateTime";

function assertSuccess(data, fallbackMessage = "Unable to load messages.") {
  if (data?.success !== true && data?.success !== "true") {
    throw new ApiError(data?.message ?? fallbackMessage, data);
  }
  return data;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeMessageId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid message id.", null);
  }
  return normalizedId;
}

function isReadFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric === 1;
  return Boolean(value);
}

function extractMessageList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.messages)) return data.messages;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function extractMessageRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.message && typeof data.message === "object") {
    return data.message;
  }
  if (data.id != null) return data;
  return null;
}

function mapReplyRecord(reply) {
  if (!reply || typeof reply !== "object") return null;
  const createdAt = reply.created_at ?? reply.createdAt ?? "";
  return {
    id: reply.id,
    name: coerceText(
      reply.sender_name ??
        reply.senderName ??
        reply.name ??
        reply.replied_by_name ??
        reply.admin_name ??
        (reply.replied_by != null ? `Admin #${reply.replied_by}` : "")
    ),
    email: coerceText(reply.sender_email ?? reply.senderEmail ?? reply.email),
    body: String(
      reply.body ?? reply.reply_body ?? reply.replyBody ?? reply.message ?? reply.content ?? ""
    ),
    date: formatSurveyListDate(createdAt),
    time: formatLocaleTimeLabel(createdAt),
    dateTime: formatLocaleDateTime(createdAt),
    createdAtRaw: createdAt,
  };
}

/** Maps an API message record to the Messages UI shape. */
export function mapMessageRecord(record) {
  if (!record || typeof record !== "object") return null;

  const createdAt = record.created_at ?? record.createdAt ?? "";
  const updatedAt = record.updated_at ?? record.updatedAt ?? "";
  const isRead = isReadFlag(record.is_read ?? record.isRead ?? record.read);
  const name = coerceText(record.sender_name ?? record.senderName ?? record.name);
  const email = coerceText(
    record.sender_email ?? record.senderEmail ?? record.email
  );
  const subject = coerceText(record.subject);
  const rawBody = record.body ?? record.message ?? record.content ?? "";
  const body = typeof rawBody === "string" ? rawBody : String(rawBody);
  const date = formatSurveyListDate(createdAt);
  const time = formatLocaleTimeLabel(createdAt);
  const dateTime = formatLocaleDateTime(createdAt);
  const replies = Array.isArray(record.replies)
    ? record.replies.map(mapReplyRecord).filter(Boolean)
    : [];

  return {
    id: record.id,
    name,
    email,
    senderName: name,
    senderEmail: email,
    subject,
    body,
    date,
    time,
    dateTime,
    isRead,
    readStatus: isRead ? "Read" : "Unread",
    createdAtRaw: createdAt,
    updatedAtRaw: updatedAt,
    recipientAdminId: record.recipient_admin_id ?? record.recipientAdminId ?? null,
    deletedAt: record.deleted_at ?? record.deletedAt ?? null,
    replies,
    // Notification drawer fields
    title: subject,
    description: body.trim() || subject || email,
    datetime: dateTime,
    read: isRead,
  };
}

function messageMatchesSearch(item, search) {
  const query = String(search ?? "").trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    item?.name,
    item?.email,
    item?.subject,
    item?.body,
    item?.id,
    item?.readStatus,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * GET /api/messages/list
 * @param {{ page?: number, limit?: number, search?: string }} [params]
 */
export async function getMessages({ page = 1, limit = 10, search = "" } = {}) {
  const normalizedSearch = String(search ?? "").trim();
  const path = appendListQuery(API_ROUTES.messages.list, {
    page,
    limit,
    search: normalizedSearch,
  });
  const data = await apiRequest(path);
  assertSuccess(data);

  const rawItems = extractMessageList(data);
  let items = safeMapListItems(rawItems, mapMessageRecord);

  // Frontend filter fallback when backend ignores `search`.
  if (normalizedSearch) {
    const filtered = items.filter((item) =>
      messageMatchesSearch(item, normalizedSearch)
    );
    if (filtered.length !== items.length) {
      items = filtered;
    }
  }

  const total = extractListTotalFromResponse(data, items.length);
  const safePage = toNumber(data?.page, page);
  const pageSize = toNumber(data?.limit, limit);
  const totalPages = toNumber(
    data?.totalPages,
    Math.max(1, Math.ceil(total / (pageSize || 10)) || 1)
  );
  // Unread badge source: list `is_read` (per product requirement).
  const unreadCount = items.filter((item) => !item.isRead).length;

  return {
    success: true,
    items,
    total,
    page: safePage,
    pageSize,
    limit: pageSize,
    totalPages,
    unreadCount,
  };
}

/** Alias used by listing pages via useApiListing. */
export async function getRecords(params) {
  return getMessages(params);
}

/** GET /api/messages/unread-count — derived from list `is_read` when dedicated endpoint is unused */
export async function getMessagesUnreadCount() {
  const list = await getMessages({ page: 1, limit: 100 });
  return list.items.filter((item) => !item.isRead).length;
}

/** GET /api/messages/:id — full message detail including body and replies */
export async function getMessage(id) {
  const normalizedId = normalizeMessageId(id);
  const data = await apiRequest(API_ROUTES.messages.byId(normalizedId));
  assertSuccess(data, "Message not found!");

  const mapped = mapMessageRecord(extractMessageRecord(data));
  if (!mapped) {
    throw new ApiError("Message not found!", data);
  }
  return mapped;
}

/**
 * Individual PATCH /api/messages/:id/read is not available on the backend (404).
 * Read state is updated via GET /api/messages/:id (details) and
 * PATCH /api/messages/read-all. Kept as a no-op helper for compatibility.
 */
export async function markMessageAsRead(id) {
  normalizeMessageId(id);
  return { success: true, item: null, optimistic: true };
}

/** PATCH /api/messages/read-all */
export async function markAllMessagesAsRead() {
  const data = await apiRequest(API_ROUTES.messages.readAll, {
    method: "PATCH",
  });
  assertSuccess(data, "Unable to mark all messages as read.");
  return {
    success: true,
    unreadCount: 0,
    ...data,
  };
}

/**
 * POST /api/messages/:id/reply
 * @param {string|number} id
 * @param {{ replyBody?: string, reply_body?: string }} payload
 */
export async function replyToMessage(id, payload = {}) {
  const normalizedId = normalizeMessageId(id);
  const replyBody = String(
    payload.replyBody ?? payload.reply_body ?? ""
  ).trim();

  if (!replyBody) {
    throw new ApiError("Reply message is required.", null);
  }

  const data = await apiRequest(API_ROUTES.messages.reply(normalizedId), {
    method: "POST",
    body: { reply_body: replyBody },
  });
  assertSuccess(data, "Unable to send reply.");
  return data;
}

/** DELETE /api/messages/:id */
export async function deleteMessage(id) {
  const normalizedId = normalizeMessageId(id);
  const data = await apiRequest(API_ROUTES.messages.delete(normalizedId), {
    method: "DELETE",
  });
  assertSuccess(data, "Unable to delete message.");
  return {
    success: true,
    unreadCount: toNumber(data?.unreadCount ?? data?.unread_count, undefined),
    ...data,
  };
}
