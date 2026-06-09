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
  labels = {},
}) {
  const hasAny =
    onView || onEdit || onFindUser || onUserSurveyData || onSurveyClone;

  if (!hasAny) return null;

  const viewLabel = labels.view ?? "View";
  const editLabel = labels.edit ?? "Edit";
  const findUserLabel = labels.findUser ?? "Find User";
  const userSurveyDataLabel = labels.userSurveyData ?? "User Survey Data";
  const surveyCloneLabel = labels.surveyClone ?? "Survey Clone";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {onView && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label={viewLabel}
          onClick={onView}
        >
          <Eye size={13} />
        </ActionIconButton>
      )}
      {onEdit && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label={editLabel}
          onClick={onEdit}
        >
          <Pencil size={13} />
        </ActionIconButton>
      )}
      {onFindUser && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label={findUserLabel}
          onClick={onFindUser}
        >
          <UserRound size={13} />
        </ActionIconButton>
      )}
      {onUserSurveyData && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label={userSurveyDataLabel}
          onClick={onUserSurveyData}
        >
          <LayoutDashboard size={13} />
        </ActionIconButton>
      )}
      {onSurveyClone && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label={surveyCloneLabel}
          onClick={onSurveyClone}
        >
          <Copy size={13} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default SurveyListingActions;
