import { Loader2 } from "lucide-react";
import { getAdminCancelButtonClass } from "../../modules/shared/utils/formStyles";

function DeleteConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  isDeleting = false,
  title = "Delete Record",
  message = "Are you sure you want to delete this record?",
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close delete confirmation"
        onClick={onCancel}
        disabled={isDeleting}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <h2 id="delete-modal-title" className="admin-text mb-2 text-lg font-semibold">
          {title}
        </h2>
        <p className="admin-text-muted mb-4 text-sm">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className={getAdminCancelButtonClass("modal")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--admin-danger-text)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
