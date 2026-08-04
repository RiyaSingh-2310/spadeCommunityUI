import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import TableCard from "../../../components/admin/TableCard";
import { getDemoMessageById } from "../data/demoMessages";

function DetailField({ label, children }) {
  return (
    <div
      className="border-t pt-4"
      style={{ borderColor: "var(--admin-header-surface-border)" }}
    >
      <p className="admin-text-subtle mb-1 text-xs font-semibold uppercase tracking-wide">
        {label}
      </p>
      <div className="admin-text text-sm break-words">{children}</div>
    </div>
  );
}

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
        <div className="space-y-0 p-1 sm:p-2">
          <div className="pb-4">
            <p className="admin-text-subtle mb-1 text-xs font-semibold uppercase tracking-wide">
              Name
            </p>
            <h2 className="admin-text text-lg font-bold break-words">{message.name}</h2>
          </div>

          <DetailField label="Message ID">
            <span className="font-medium">{message.id}</span>
          </DetailField>

          <DetailField label="Date">
            <span className="font-medium">{message.date}</span>
          </DetailField>

          <DetailField label="Time">
            <span className="font-medium">{message.time}</span>
          </DetailField>

          <DetailField label="Subject">
            <span className="text-base font-semibold">{message.subject}</span>
          </DetailField>

          <DetailField label="Full Message">
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.body || "—"}
            </div>
          </DetailField>

          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t pt-4 mt-4"
            style={{ borderColor: "var(--admin-header-surface-border)" }}
          >
            <button
              type="button"
              className="admin-btn-primary h-10 rounded-xl px-5 text-sm font-semibold transition hover:opacity-90"
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
