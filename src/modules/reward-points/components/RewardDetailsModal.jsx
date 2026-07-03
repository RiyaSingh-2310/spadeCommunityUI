import { Loader2 } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import { getAdminCancelButtonClass, getAdminTextareaClass } from "../../shared/utils/formStyles";

const USER_INFO_FIELDS = [
  { label: "User Name", key: "userName" },
  { label: "Email", key: "email" },
];

const REWARD_INFO_FIELDS = [
  { label: "Reward Type", key: "rewardType" },
  { label: "Reward Points", key: "rewardPoints" },
];

const REQUEST_DETAIL_FIELDS = [
  { label: "Created Date", key: "createdDate" },
  { label: "Status", key: "status" },
];

const VIEW_EXTRA_FIELDS = [{ label: "Completed Date", key: "completedDate" }];

function formatDetailValue(value) {
  if (value == null || String(value).trim() === "") return "—";
  return String(value);
}

function resolveRowValue(row, key) {
  if (key === "rewardPoints") {
    return row.rewardPoints ?? row.totalRewardBalance ?? row.totalRewardCredit ?? "";
  }
  if (key === "createdDate") {
    return row.createdDate ?? row.createdAt ?? "";
  }
  return row[key];
}

function DetailSection({ title, fields, row }) {
  const visibleFields = fields.filter((field) => {
    const value = resolveRowValue(row, field.key);
    return value != null && String(value).trim() !== "";
  });

  if (!visibleFields.length) return null;

  return (
    <div className="mb-4">
      <h3 className="admin-text-muted mb-2 text-xs font-semibold uppercase tracking-[0.04em]">
        {title}
      </h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {visibleFields.map((field) => (
          <div key={field.key} className="min-w-0">
            <dt className="admin-text-muted text-xs font-medium">{field.label}</dt>
            <dd className="admin-text mt-0.5 text-sm break-words">
              {formatDetailValue(resolveRowValue(row, field.key))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
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
  const isAction = isApprove || isReject;

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

  const requestFields = isView
    ? [...REQUEST_DETAIL_FIELDS, ...VIEW_EXTRA_FIELDS.filter((field) => row[field.key])]
    : REQUEST_DETAIL_FIELDS;

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

        <DetailSection title="User Information" fields={USER_INFO_FIELDS} row={row} />
        <DetailSection title="Reward Information" fields={REWARD_INFO_FIELDS} row={row} />
        <DetailSection title="Request Details" fields={requestFields} row={row} />

        {isView && row.comments ? (
          <div className="mb-4">
            <p className="admin-text-muted text-xs font-medium">Comments</p>
            <p className="admin-text mt-1 text-sm whitespace-pre-wrap break-words">{row.comments}</p>
          </div>
        ) : null}

        {isAction ? (
          <>
            <p className="admin-text-muted mb-4 text-sm">{confirmMessage}</p>
            <FormField label="Comments" required={isReject} error={commentError}>
              <textarea
                className={textareaClass}
                value={comment}
                onChange={(e) => onCommentChange?.(e.target.value)}
                placeholder={
                  isApprove ? "Optional comments..." : "Enter comments (minimum 3 characters)..."
                }
                disabled={isSubmitting}
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
          {isAction ? (
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
