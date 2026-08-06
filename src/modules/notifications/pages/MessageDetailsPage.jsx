import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, Reply, Trash2 } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import Avatar from "../../../components/shared/Avatar";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import MessageReplyModal from "../components/MessageReplyModal";
import { useMessages } from "../context/MessagesContext";
import { getMessage, replyToMessage } from "../services/messagesApi";

const MESSAGES_PATH = "/notifications/messages";
const SECTION_BORDER = { borderColor: "var(--admin-header-surface-border)" };

function MessageDetailsPage({ isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markAsRead, removeMessage } = useMessages();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [loadError, setLoadError] = useState("");

  const goBack = () => navigate(MESSAGES_PATH);

  const loadMessage = useCallback(async ({ silent = false } = {}) => {
    const normalizedId = String(id ?? "").trim();
    if (!normalizedId) {
      setMessage(null);
      setLoadError("Message not found.");
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setLoadError("");
    }
    try {
      const data = await getMessage(normalizedId);
      setMessage(data);
      setLoadError("");
      if (!data.isRead) {
        markAsRead(normalizedId)
          .then(() => {
            setMessage((prev) =>
              prev
                ? { ...prev, isRead: true, read: true, readStatus: "Read" }
                : prev
            );
          })
          .catch(() => {});
      }
    } catch (error) {
      if (!silent) {
        setMessage(null);
        const messageText =
          error instanceof Error && error.message
            ? error.message
            : "Unable to load message.";
        setLoadError(messageText);
        toastApiError(error);
      } else {
        toastApiError(error);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [id, markAsRead]);

  useEffect(() => {
    loadMessage();
  }, [loadMessage]);

  const handleReplySubmit = useCallback(
    async (replyBody) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return;

      setIsReplying(true);
      try {
        const data = await replyToMessage(normalizedId, { replyBody });
        toastApiSuccess(data);
        setIsReplyOpen(false);
        await loadMessage({ silent: true });
      } catch (error) {
        toastApiError(error);
      } finally {
        setIsReplying(false);
      }
    },
    [id, loadMessage]
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
          <div className="p-4">
            <TableLoadingSkeleton rowCount={4} />
          </div>
        </TableCard>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <p className="admin-text-muted text-sm">{loadError || "Message not found."}</p>
        <button
          type="button"
          onClick={goBack}
          className="admin-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pageHeader}

      <TableCard isDarkMode={isDarkMode}>
        <div className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <Avatar name={message.name} size="profile" />
              <div className="min-w-0 pt-0.5">
                <h2 className="admin-text text-lg font-bold break-words sm:text-xl">
                  {message.name || "—"}
                </h2>
                <p className="admin-text-muted mt-1 break-all text-sm">
                  {message.email || "—"}
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
                <span>{message.date}</span>
              </div>
              <div className="admin-text-muted inline-flex items-center gap-2 text-sm">
                <Clock
                  size={15}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                />
                <span>{message.time}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Subject
            </p>
            <p className="admin-text text-base font-bold break-words sm:text-lg">
              {message.subject || "—"}
            </p>
          </div>

          <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
              Message
            </p>
            <div className="admin-text whitespace-pre-wrap break-words text-sm leading-7 sm:text-[15px] sm:leading-8">
              {message.body?.trim() ? message.body : "—"}
            </div>
          </div>

          {Array.isArray(message.replies) && message.replies.length > 0 ? (
            <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
              <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
                Replies
              </p>
              <ul className="space-y-4">
                {message.replies.map((reply) => (
                  <li
                    key={reply.id ?? `${reply.dateTime}-${reply.name}`}
                    className="rounded-xl border p-3 sm:p-4"
                    style={SECTION_BORDER}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="admin-text text-sm font-semibold break-words">
                          {reply.name || "—"}
                        </p>
                        {reply.email ? (
                          <p className="admin-text-muted mt-0.5 break-all text-xs">
                            {reply.email}
                          </p>
                        ) : null}
                      </div>
                      <p className="admin-text-subtle shrink-0 text-xs">
                        {reply.dateTime || reply.date || "—"}
                      </p>
                    </div>
                    <p className="admin-text mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                      {reply.body?.trim() ? reply.body : "—"}
                    </p>
                  </li>
                ))}
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
        recipientName={message.name}
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
          setIsDeleting(true);
          try {
            const data = await removeMessage(id);
            toastApiSuccess(data);
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
