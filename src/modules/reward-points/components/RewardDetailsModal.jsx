import { Loader2 } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import { getAdminCancelButtonClass, getAdminTextareaClass } from "../../shared/utils/formStyles";

const DETAIL_FIELDS = [
  { label: "User Name", key: "userName" },
  { label: "Email", key: "email" },
  { label: "Reward Type", key: "rewardType" },
  { label: "Reward Points", key: "rewardPoints" },
  { label: "Created Date", key: "createdDate" },
  { label: "Completed Date", key: "completedDate" },
  { label: "Status", key: "status" },
];

function formatDetailValue(value) {
  if (value == null || String(value).trim() === "") return "—";
  return String(value);
}

function RewardDetailsModal({
  isOpen,
  mode = "view",
  row,
  comment = "",
  commentError = "",
  isSubmitting = false,
  onCommentChange,
  onCancel,
  onConfirm,
}) {
  if (!isOpen || !row) return null;

  const textareaClass = getAdminTextareaClass();
  const isView = mode === "view";
  const isApprove = mode === "approve";
  const isReject = mode === "reject";

  const title = isView
    ? "Reward Request Details"
    : isApprove
      ? "Approve Reward Request"
      : "Reject Reward Request";

  const confirmMessage = isApprove
    ? "Are you sure you want to approve this reward request?"
    : isReject
      ? "Are you sure you want to reject this reward request?"
      : "";

  const visibleFields = DETAIL_FIELDS.filter((field) => {
    if (field.key === "completedDate") {
      return isView || row.completedDate;
    }
    return true;
  });

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close reward details"
        onClick={onCancel}
        disabled={isSubmitting}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-lg rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-details-modal-title"
      >
        <h2 id="reward-details-modal-title" className="admin-text mb-4 text-lg font-semibold">
          {title}
        </h2>

        <dl className="mb-4 grid gap-3 sm:grid-cols-2">
          {visibleFields.map((field) => (
            <div key={field.key} className="min-w-0">
              <dt className="admin-text-muted text-xs font-medium">{field.label}</dt>
              <dd className="admin-text mt-0.5 text-sm break-words">
                {formatDetailValue(row[field.key])}
              </dd>
            </div>
          ))}
        </dl>

        {isView && row.comments ? (
          <div className="mb-4">
            <p className="admin-text-muted text-xs font-medium">Comments</p>
            <p className="admin-text mt-1 text-sm whitespace-pre-wrap break-words">{row.comments}</p>
          </div>
        ) : null}

        {!isView ? (
          <>
            <p className="admin-text-muted mb-4 text-sm">{confirmMessage}</p>
            <FormField label="Comments" required error={commentError}>
              <textarea
                className={textareaClass}
                value={comment}
                onChange={(e) => onCommentChange?.(e.target.value)}
                placeholder="Enter comments..."
                disabled={isSubmitting}
                readOnly={false}
              />
            </FormField>
          </>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={getAdminCancelButtonClass("modal")}
          >
            Cancel
          </button>
          {!isView ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isReject
                  ? "bg-[var(--admin-danger-text)] hover:opacity-90"
                  : "bg-[#10a950] hover:bg-[#0f9b49]"
              }`}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? (isApprove ? "Approving..." : "Rejecting...") : isApprove ? "Approve" : "Reject"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default RewardDetailsModal;
