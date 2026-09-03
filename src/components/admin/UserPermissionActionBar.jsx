import { Loader2 } from "lucide-react";

/**
 * Shared action bar for Edit User + Manage Permissions.
 * Order: Update → Cancel
 */
function UserPermissionActionBar({
  isSubmitting = false,
  canSubmit = true,
  submitLabel = "Update",
  submittingLabel = "Updating...",
  onCancel,
  disableCancel = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {isSubmitting ? submittingLabel : submitLabel}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={disableCancel || isSubmitting}
        className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

export default UserPermissionActionBar;
