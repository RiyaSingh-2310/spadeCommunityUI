import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, Reply, Trash2 } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import Avatar from "../../../components/shared/Avatar";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import MessageReplyModal from "../components/MessageReplyModal";
import { useMessages } from "../context/MessagesContext";
import { getMessage, replyToMessage } from "../services/messagesApi";

const MESSAGES_PATH = "/messages";
const SECTION_BORDER = { borderColor: "var(--admin-header-surface-border)" };

function normalizeRouteMessageId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    return "";
  }
  return normalizedId;
}

function MessageDetailsLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Loading message">
      <div className="flex items-start gap-4">
        <div className="h-[60px] w-[60px] shrink-0 animate-pulse rounded-full bg-[var(--admin-skeleton-bg)]" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="h-5 w-40 max-w-full animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
        </div>
      </div>
      <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
      <div className="h-5 w-3/4 max-w-md animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
        <div className="h-4 w-full animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
        <div className="h-4 w-2/3 max-w-sm animate-pulse rounded-md bg-[var(--admin-skeleton-bg)]" />
      </div>
    </div>
  );
}

function MessageDetailsPage({ isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markAsReadLocal, removeMessage, refreshRecent } = useMessages();
  const markAsReadLocalRef = useRef(markAsReadLocal);
  const routeMessageId = normalizeRouteMessageId(id);

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(routeMessageId));
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [loadError, setLoadError] = useState(
    routeMessageId ? "" : "Message not found."
  );

  useEffect(() => {
    markAsReadLocalRef.current = markAsReadLocal;
  }, [markAsReadLocal]);

  const goBack = () => navigate(MESSAGES_PATH);

  const syncLocalReadState = useCallback((normalizedId, data) => {
    if (!data || !normalizedId) return;
    // No PATCH /api/messages/:id/read — sync drawer/list unread state locally after detail GET.
    markAsReadLocalRef.current?.(normalizedId);
    if (!data.isRead) {
      setMessage((prev) =>
        prev && String(prev.id) === String(normalizedId)
          ? { ...prev, isRead: true, read: true, readStatus: "Read" }
          : prev
      );
    }
  }, []);

  const fetchMessageById = useCallback(
    async (messageId, { silent = false } = {}) => {
      const normalizedId = normalizeRouteMessageId(messageId);
      if (!normalizedId) {
        if (!silent) {
          setMessage(null);
          setLoadError("Message not found.");
          setIsLoading(false);
        }
        return null;
      }

      if (!silent) {
        setIsLoading(true);
        setLoadError("");
      }

      try {
        const data = await getMessage(normalizedId);
        setMessage(data);
        setLoadError("");
        syncLocalReadState(normalizedId, data);
        return data;
      } catch (error) {
        if (!silent) {
          setMessage(null);
          const messageText =
            error instanceof Error && error.message
              ? error.message
              : "Unable to load message.";
          setLoadError(messageText);
        }
        toastApiError(error);
        return null;
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [syncLocalReadState]
  );

  useEffect(() => {
    if (!routeMessageId) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getMessage(routeMessageId);
        if (cancelled) return;
        setMessage(data);
        setLoadError("");
        syncLocalReadState(routeMessageId, data);
      } catch (error) {
        if (cancelled) return;
        setMessage(null);
        const messageText =
          error instanceof Error && error.message
            ? error.message
            : "Unable to load message.";
        setLoadError(messageText);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [routeMessageId, syncLocalReadState]);

  const handleReplySubmit = useCallback(
    async (replyBody) => {
      if (!routeMessageId) return;

      setIsReplying(true);
      try {
        const data = await replyToMessage(routeMessageId, { replyBody });
        toastApiSuccess(data, "Reply sent successfully!");
        setIsReplyOpen(false);
        await fetchMessageById(routeMessageId, { silent: true });
        refreshRecent?.({ silent: true })?.catch?.(() => {});
      } catch (error) {
        toastApiError(error);
      } finally {
        setIsReplying(false);
      }
    },
    [routeMessageId, fetchMessageById, refreshRecent]
  );

  const pageHeader = (
    <AdminPageHeader
      title="Message Details"
      breadcrumbs={[
        { label: "Messages", to: MESSAGES_PATH },
        { label: "View Message" },
      ]}
      isDarkMode={isDarkMode}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <TableCard isDarkMode={isDarkMode}>
          <MessageDetailsLoadingSkeleton />
        </TableCard>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <TableCard isDarkMode={isDarkMode}>
          <div className="flex flex-col items-start gap-4 p-4 sm:p-6">
            <p className="admin-text-muted text-sm">
              {loadError || "Message not found."}
            </p>
            <button
              type="button"
              onClick={goBack}
              className="admin-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
              Back to Messages
            </button>
          </div>
        </TableCard>
      </div>
    );
  }

  const replies = Array.isArray(message.replies) ? message.replies : [];
  const bodyText =
    typeof message.body === "string" ? message.body : String(message.body ?? "");
  const displayName = String(message.name ?? "").trim() || "—";
  const displayEmail = String(message.email ?? "").trim() || "—";
  const displaySubject = String(message.subject ?? "").trim() || "—";
  const displayDate = String(message.date ?? "").trim() || "—";
  const displayTime = String(message.time ?? "").trim() || "—";

  return (
    <div className="space-y-6">
      {pageHeader}

      <TableCard isDarkMode={isDarkMode}>
        <div className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <Avatar name={displayName === "—" ? "User" : displayName} size="profile" />
              <div className="min-w-0 pt-0.5">
                <h2 className="admin-text text-lg font-bold break-words sm:text-xl">
                  {displayName}
                </h2>
                <p className="admin-text-muted mt-1 break-all text-sm">
                  {displayEmail}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 text-left sm:items-end sm:text-right">
              <div className="admin-text inline-flex items-center gap-2 text-sm font-medium">
                <Calendar
                  size={15}
                  strokeWidth={2}
                  className="admin-text-muted shrink-0"
                  aria-hidden
                />
                <span>{displayDate}</span>
              </div>
              <div className="admin-text-muted inline-flex items-center gap-2 text-sm">
                <Clock
                  size={15}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                />
                <span>{displayTime}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Subject
            </p>
            <p className="admin-text text-base font-bold break-words sm:text-lg">
              {displaySubject}
            </p>
          </div>

          <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
              Message
            </p>
            <div className="admin-text whitespace-pre-wrap break-words text-sm leading-7 sm:text-[15px] sm:leading-8">
              {bodyText.trim() ? bodyText : "—"}
            </div>
          </div>

          {replies.length > 0 ? (
            <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
              <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
                Replies
              </p>
              <ul className="space-y-4">
                {replies.map((reply, index) => {
                  if (!reply || typeof reply !== "object") return null;
                  const replyBody =
                    typeof reply.body === "string"
                      ? reply.body
                      : String(reply.body ?? "");
                  const replyName = String(reply.name ?? "").trim() || "—";
                  const replyEmail = String(reply.email ?? "").trim();
                  const replyWhen =
                    String(reply.dateTime ?? reply.date ?? "").trim() || "—";
                  return (
                    <li
                      key={reply.id ?? `reply-${index}`}
                      className="rounded-xl border p-3 sm:p-4"
                      style={SECTION_BORDER}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="admin-text text-sm font-semibold break-words">
                            {replyName}
                          </p>
                          {replyEmail ? (
                            <p className="admin-text-muted mt-0.5 break-all text-xs">
                              {replyEmail}
                            </p>
                          ) : null}
                        </div>
                        <p className="admin-text-subtle shrink-0 text-xs">
                          {replyWhen}
                        </p>
                      </div>
                      <p className="admin-text mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                        {replyBody.trim() ? replyBody : "—"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div
            className="mt-8 flex flex-wrap items-center justify-start gap-2.5 border-t pt-5"
            style={SECTION_BORDER}
          >
            <button
              type="button"
              onClick={() => setIsReplyOpen(true)}
              className="admin-btn-primary inline-flex h-10 items-center justify-center gap-2 px-5"
            >
              <Reply size={16} strokeWidth={2} aria-hidden />
              Reply
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--admin-danger-text)] bg-transparent px-5 text-sm font-semibold text-[var(--admin-danger-text)] transition hover:bg-[var(--admin-danger-text)]/10"
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden />
              Delete
            </button>
          </div>
        </div>
      </TableCard>

      <MessageReplyModal
        isOpen={isReplyOpen}
        isSubmitting={isReplying}
        recipientName={displayName === "—" ? "" : displayName}
        onCancel={() => {
          if (isReplying) return;
          setIsReplyOpen(false);
        }}
        onSubmit={handleReplySubmit}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        isDeleting={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setIsDeleteOpen(false);
        }}
        onConfirm={async () => {
          if (!routeMessageId) return;

          setIsDeleting(true);
          try {
            const data = await removeMessage(routeMessageId);
            toastApiSuccess(data, "Message deleted successfully!");
            setIsDeleteOpen(false);
            navigate(MESSAGES_PATH, { state: { refresh: true } });
          } catch (error) {
            toastApiError(error);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
      />
    </div>
  );
}

export default MessageDetailsPage;
