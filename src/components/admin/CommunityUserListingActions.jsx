import { Eye, KeyRound, Pencil, Trash2 } from "lucide-react";

const iconBtnClass = (isDarkMode, { danger = false, disabled = false } = {}) =>
  `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
    disabled
      ? "cursor-not-allowed opacity-40"
      : danger
        ? isDarkMode
          ? "text-[#f18484] hover:bg-[#301f2d]"
          : "text-[#de3d3d] hover:bg-[#fff1f1]"
        : isDarkMode
          ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
          : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
  }`;

function ActionIconButton({
  isDarkMode,
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
      className={iconBtnClass(isDarkMode, { danger, disabled })}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function CommunityUserListingActions({
  isDarkMode,
  onView,
  onEdit,
  onDelete,
  onRewardLog,
  showEdit = true,
  showDelete = true,
}) {
  if (!onView && !onEdit && !onDelete && !onRewardLog) return null;

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap">
      {onView && (
        <ActionIconButton isDarkMode={isDarkMode} label="View" onClick={onView}>
          <Eye size={13} />
        </ActionIconButton>
      )}
      {showEdit && onEdit && (
        <ActionIconButton isDarkMode={isDarkMode} label="Edit" onClick={onEdit}>
          <Pencil size={13} />
        </ActionIconButton>
      )}
      {showDelete && onDelete && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="Delete"
          onClick={onDelete}
          danger
        >
          <Trash2 size={13} />
        </ActionIconButton>
      )}
      {onRewardLog && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="Reward Log"
          onClick={onRewardLog}
        >
          <KeyRound size={13} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default CommunityUserListingActions;
