import { Loader2 } from "lucide-react";

/**
 * Shared action bar for Edit User + Manage Permissions.
 * Order: Update → Download CSV → Cancel
 */
function UserPermissionActionBar({
  showDownloadCsv = false,
  canDownloadCsv = false,
  isDownloadingCsv = false,
  isSubmitting = false,
  canSubmit = true,
  submitLabel = "Update",
  submittingLabel = "Updating...",
  onCancel,
  onDownloadCsv,
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

      {showDownloadCsv ? (
        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={!canDownloadCsv || isDownloadingCsv || isSubmitting}
          className="admin-btn-cancel inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          title={
            canDownloadCsv
              ? "Download CSV for selected modules"
              : "Select at least one Download checkbox to enable CSV download"
          }
        >
          {isDownloadingCsv ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : null}
          {isDownloadingCsv ? "Downloading..." : "Download CSV"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onCancel}
        disabled={disableCancel || isSubmitting || isDownloadingCsv}
        className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

export default UserPermissionActionBar;
