import { Download, Mail, Trash2 } from "lucide-react";

function CommunityUsersBulkActions({
  allVisibleSelected,
  someVisibleSelected,
  onSelectAllChange,
  onBulkDeleteRequest,
  onBulkDownloadRequest,
  onBulkResendRequest,
  selectedCount,
  disabled = false,
  isResending = false,
  isDownloading = false,
}) {
  const hasSelection = selectedCount > 0;
  const actionsDisabled = disabled || !hasSelection;

  return (
    <div className="flex h-11 shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={allVisibleSelected}
        ref={(element) => {
          if (element) {
            element.indeterminate = someVisibleSelected;
          }
        }}
        onChange={(event) => onSelectAllChange(event.target.checked)}
        disabled={disabled}
        aria-label="Select all"
      />
      <button
        type="button"
        onClick={onBulkDeleteRequest}
        disabled={actionsDisabled}
        className="admin-icon-action admin-icon-action--danger inline-flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Delete Selected"
        title="Delete Selected"
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onBulkDownloadRequest}
        disabled={actionsDisabled || isDownloading}
        className="admin-icon-action inline-flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Download Selected"
        title="Download Selected"
      >
        <Download size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onBulkResendRequest}
        disabled={actionsDisabled || isResending}
        className="admin-icon-action inline-flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Resend Email"
        title="Resend Email"
      >
        <Mail size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

export default CommunityUsersBulkActions;
