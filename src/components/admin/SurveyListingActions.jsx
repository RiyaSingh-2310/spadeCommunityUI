import { Copy, Eye, LayoutDashboard, Pencil, UserRound } from "lucide-react";

const iconBtnClass = (isDarkMode, { disabled = false } = {}) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
    disabled
      ? "cursor-not-allowed opacity-40"
      : isDarkMode
        ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
        : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
  }`;

function ActionIconButton({
  isDarkMode,
  label,
  onClick,
  disabled = false,
  children,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={iconBtnClass(isDarkMode, { disabled })}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function SurveyListingActions({
  isDarkMode,
  onView,
  onEdit,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
}) {
  const hasAny =
    onView || onEdit || onFindUser || onUserSurveyData || onSurveyClone;

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <ActionIconButton
        isDarkMode={isDarkMode}
        label="View"
        onClick={onView}
        disabled={!onView}
      >
        <Eye size={13} />
      </ActionIconButton>
      <ActionIconButton
        isDarkMode={isDarkMode}
        label="Edit"
        onClick={onEdit}
        disabled={!onEdit}
      >
        <Pencil size={13} />
      </ActionIconButton>
      <ActionIconButton
        isDarkMode={isDarkMode}
        label="Find User"
        onClick={onFindUser}
        disabled={!onFindUser}
      >
        <UserRound size={13} />
      </ActionIconButton>
      <ActionIconButton
        isDarkMode={isDarkMode}
        label="User Survey Data"
        onClick={onUserSurveyData}
        disabled={!onUserSurveyData}
      >
        <LayoutDashboard size={13} />
      </ActionIconButton>
      <ActionIconButton
        isDarkMode={isDarkMode}
        label="Survey Clone"
        onClick={onSurveyClone}
        disabled={!onSurveyClone}
      >
        <Copy size={13} />
      </ActionIconButton>
    </div>
  );
}

export default SurveyListingActions;
