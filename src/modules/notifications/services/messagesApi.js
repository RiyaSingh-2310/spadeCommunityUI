/**
 * Messages API stubs — static demo data only.
 * Real backend integration is disabled until the final Messages API is ready.
 * Do not call network endpoints from this module.
 */
import {
  DEMO_MESSAGES,
  getDemoMessageById,
} from "../data/demoMessages";

function filterMessages(search = "") {
  const q = String(search ?? "").trim().toLowerCase();
  if (!q) return [...DEMO_MESSAGES];
  return DEMO_MESSAGES.filter((msg) => {
    const haystack = [msg.name, msg.subject, msg.body, msg.id]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Static list — no /api/messages/list network call.
 */
export async function getMessages({ page = 1, limit = 10, search = "" } = {}) {
  const filtered = filterMessages(search);
  const total = filtered.length;
  const pageSize = limit > 0 ? limit : 10;
  const safePage = page > 0 ? page : 1;
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const unreadCount = DEMO_MESSAGES.filter((msg) => !msg.isRead).length;

  return {
    success: true,
    items,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
    unreadCount,
  };
}

export async function getMessagesUnreadCount() {
  return DEMO_MESSAGES.filter((msg) => !msg.isRead).length;
}

export async function getMessage(id) {
  const mapped = getDemoMessageById(id);
  if (!mapped) {
    throw new Error("Message not found!");
  }
  return mapped;
}

export async function markMessageAsRead(id) {
  const item = getDemoMessageById(id);
  return {
    success: true,
    item: item ? { ...item, isRead: true, read: true } : null,
    unreadCount: DEMO_MESSAGES.filter((msg) => !msg.isRead).length,
  };
}

export async function markAllMessagesAsRead() {
  return {
    success: true,
    unreadCount: 0,
  };
}

export async function deleteMessage() {
  return {
    success: true,
    unreadCount: DEMO_MESSAGES.filter((msg) => !msg.isRead).length,
  };
}

/** Kept for compatibility with prior imports; unused by static UI. */
export function mapMessageRecord(record) {
  return record && typeof record === "object" ? record : null;
}
