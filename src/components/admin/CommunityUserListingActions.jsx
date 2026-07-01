import { Eye, KeyRound, Mail, Pencil, Trash2 } from "lucide-react";

function ActionIconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`admin-icon-action ${danger ? "admin-icon-action--danger" : ""}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function CommunityUserListingActions({
  onView,
  onEdit,
  onDelete,
  onRewardLog,
  onResendEmail,
  showEdit = true,
  showDelete = true,
  resendDisabled = false,
}) {
  if (!onView && !onEdit && !onDelete && !onRewardLog && !onResendEmail) return null;

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
      {onView && (
        <ActionIconButton label="View" onClick={onView}>
          <Eye size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {showEdit && onEdit && (
        <ActionIconButton label="Edit" onClick={onEdit}>
          <Pencil size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {showDelete && onDelete && (
        <ActionIconButton label="Delete" onClick={onDelete} danger>
          <Trash2 size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onRewardLog && (
        <ActionIconButton label="Reward Log" onClick={onRewardLog}>
          <KeyRound size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onResendEmail && (
        <ActionIconButton
          label="Resend Email"
          onClick={onResendEmail}
          disabled={resendDisabled}
        >
          <Mail size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default CommunityUserListingActions;
