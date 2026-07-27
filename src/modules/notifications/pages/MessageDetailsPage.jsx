import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import {
  getAdminCancelButtonClass,
} from "../../shared/utils/formStyles";
import { toastApiError } from "../../../services/toast/apiToast";
import { useMessages } from "../context/MessagesContext";
import { getMessage } from "../services/messagesApi";

function MessageDetailsPage({ isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markAsRead, refreshRecent } = useMessages();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setMessage(null);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadMessage() {
      setIsLoading(true);
      try {
        const record = await getMessage(id);
        if (cancelled) return;
        setMessage(record);

        if (!record.isRead) {
          try {
            const result = await markAsRead(record.id);
            if (cancelled) return;
            if (result?.item) {
              setMessage(result.item);
            } else {
              setMessage((prev) =>
                prev ? { ...prev, isRead: true, read: true } : prev
              );
            }
            await refreshRecent({ silent: true });
          } catch (error) {
            if (!cancelled) toastApiError(error);
          }
        }
      } catch (error) {
        if (cancelled) return;
        setMessage(null);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadMessage();
    return () => {
      cancelled = true;
    };
  }, [id, markAsRead, refreshRecent]);

  if (!message) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Message Details"
          isDarkMode={isDarkMode}
          breadcrumbs={[
            { label: "Messages", to: "/notifications/messages" },
            { label: "Details" },
          ]}
        />
        <p className="admin-text-muted text-sm">
          {isLoading ? "Loading message..." : "Message not found."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/notifications/messages", { state: { refresh: true } })}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Message Details"
        isDarkMode={isDarkMode}
        breadcrumbs={[
          { label: "Messages", to: "/notifications/messages" },
          { label: message.subject || "Details" },
        ]}
      />

      <TableCard isDarkMode={isDarkMode}>
        <div className="space-y-6 p-1 sm:p-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="admin-text text-lg font-bold break-words">
                {message.name}
              </h2>
              <p className="admin-text-muted mt-1 break-all text-sm">
                {message.email}
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="admin-text text-sm font-semibold">{message.date}</p>
              <p className="admin-text-muted mt-1 text-sm">{message.time}</p>
            </div>
          </div>

          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            <p className="admin-text-subtle mb-1 text-xs font-semibold uppercase tracking-wide">
              Subject
            </p>
            <p className="admin-text text-base font-semibold break-words">
              {message.subject}
            </p>
          </div>

          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            <p className="admin-text-subtle mb-2 text-xs font-semibold uppercase tracking-wide">
              Message
            </p>
            <div className="admin-text whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.body || "—"}
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/notifications/messages", { state: { refresh: true } })
              }
              className={getAdminCancelButtonClass("modal")}
            >
              Back
            </button>
            <button
              type="button"
              className="h-10 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
            >
              Reply
            </button>
          </div>
        </div>
      </TableCard>
    </div>
  );
}

export default MessageDetailsPage;
