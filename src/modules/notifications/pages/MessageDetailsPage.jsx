import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import { getDemoMessageById } from "../data/demoMessages";

const SECTION_BORDER = { borderColor: "var(--admin-header-surface-border)" };

function MessageDetailsPage({ isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const message = getDemoMessageById(id);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!message) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="View Message"
          isDarkMode={isDarkMode}
          breadcrumbs={[
            { label: "Messages", to: "/notifications/messages" },
            { label: "View Message" },
          ]}
        />
        <p className="admin-text-muted text-sm">Message not found.</p>
        <button
          type="button"
          onClick={() => navigate("/notifications/messages")}
          className="admin-btn-primary h-11 rounded-xl px-5 text-sm font-semibold"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="View Message"
        isDarkMode={isDarkMode}
        breadcrumbs={[
          { label: "Messages", to: "/notifications/messages" },
          { label: "View Message" },
        ]}
      />

      <TableCard isDarkMode={isDarkMode}>
        <div className="p-1 sm:p-2">
          {/* Sender + Date/Time */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="admin-text text-lg font-semibold break-words sm:text-xl">
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

          {/* Subject */}
          <div className="mt-6 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Subject
            </p>
            <p className="admin-text text-base font-semibold break-words sm:text-lg">
              {message.subject}
            </p>
          </div>

          {/* Message body */}
          <div className="mt-5 border-t pt-5" style={SECTION_BORDER}>
            <p className="admin-text-subtle mb-3 text-xs font-semibold uppercase tracking-wide">
              Message
            </p>
            <div
              className="admin-input rounded-xl border p-4 sm:p-5"
              style={{
                borderColor: "var(--admin-input-border)",
                background: "var(--admin-input-bg)",
              }}
            >
              <div className="admin-text whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[15px] sm:leading-7">
                {message.body || "—"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-5"
            style={SECTION_BORDER}
          >
            <button
              type="button"
              className="admin-btn-primary h-10 cursor-pointer rounded-xl px-5 text-sm font-semibold transition hover:opacity-90"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[var(--admin-danger-text)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      </TableCard>

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          setIsDeleteOpen(false);
          navigate("/notifications/messages");
        }}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
      />
    </div>
  );
}

export default MessageDetailsPage;
