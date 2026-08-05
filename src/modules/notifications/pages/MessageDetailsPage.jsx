import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Reply, Trash2 } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import Avatar from "../../../components/shared/Avatar";
import { toastApiInfo } from "../../../services/toast/apiToast";
import { useMessages } from "../context/MessagesContext";
import { getDemoMessageById } from "../data/demoMessages";

const MESSAGES_PATH = "/notifications/messages";
const SECTION_BORDER = { borderColor: "var(--admin-header-surface-border)" };

function MessageDetailsPage({ isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markAsRead, removeMessage } = useMessages();
  const message = getDemoMessageById(id);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const goBack = () => navigate(MESSAGES_PATH);

  useEffect(() => {
    if (!id) return;
    markAsRead(id);
  }, [id, markAsRead]);

  const pageHeader = (
    <AdminPageHeader
      title="Message Details"
      breadcrumbs={[
        { label: "Messages", to: MESSAGES_PATH },
        { label: "View Message" },
      ]}
      isDarkMode={isDarkMode}
      // rightContent={
      //   <button
      //     type="button"
      //     onClick={goBack}
      //     className="admin-btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 text-sm font-semibold"
      //   >
      //     <ArrowLeft size={16} strokeWidth={2} aria-hidden />
      //     Back
      //   </button>
      // }
    />
  );

  if (!message) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <p className="admin-text-muted text-sm">Message not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pageHeader}

      <TableCard isDarkMode={isDarkMode}>
        <div className="p-2 sm:p-3 lg:p-4">
          {/* Sender + Date/Time */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <Avatar name={message.name} size="profile" />
              <div className="min-w-0 pt-0.5">
                <h2 className="admin-text text-lg font-bold break-words sm:text-xl">
                  {message.name}
                </h2>
                <p className="admin-text-muted mt-1 break-all text-sm">
                  {message.email}
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

          {/* Subject */}
          <div className="mt-6 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Subject
            </p>
            <p className="admin-text text-base font-bold break-words sm:text-lg">
              {message.subject}
            </p>
          </div>

          {/* Message body */}
          <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
              Message
            </p>
            <div className="admin-text whitespace-pre-wrap break-words text-sm leading-7 sm:text-[15px] sm:leading-8">
              {message.body || "—"}
            </div>
          </div>

          {/* Actions — bottom left */}
          <div
            className="mt-8 flex flex-wrap items-center justify-start gap-2.5 border-t pt-5"
            style={SECTION_BORDER}
          >
            <button
              type="button"
              onClick={() =>
                toastApiInfo({
                  message:
                    "Reply will be available when the Messages API is connected.",
                })
              }
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

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleteOpen(false);
          await removeMessage(id);
          navigate(MESSAGES_PATH);
        }}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
      />
    </div>
  );
}

export default MessageDetailsPage;
