import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

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

function RfqListingActions({
  onEdit,
  onDelete,
  onAddLog,
  onViewLogs,
}) {
  if (!onEdit && !onDelete && !onAddLog && !onViewLogs) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onViewLogs && (
        <ActionIconButton label="View Log" onClick={onViewLogs}>
          <Eye size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onAddLog && (
        <ActionIconButton label="Add Log" onClick={onAddLog}>
          <Plus size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onEdit && (
        <ActionIconButton label="Edit RFQ" onClick={onEdit}>
          <Pencil size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onDelete && (
        <ActionIconButton label="Delete RFQ" onClick={onDelete} danger>
          <Trash2 size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default RfqListingActions;
