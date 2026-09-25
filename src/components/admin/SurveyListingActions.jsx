import { Copy, Eye, Info, LayoutDashboard, Pencil, UserRound } from "lucide-react";

function ActionIconButton({ label, onClick, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="admin-icon-action"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function SurveyListingActions({
  onView,
  onEdit,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onProjectUrlInfo,
  labels = {},
}) {
  const hasAny =
    onView || onEdit || onFindUser || onUserSurveyData || onSurveyClone || onProjectUrlInfo;

  if (!hasAny) return null;

  const viewLabel = labels.view ?? "View";
  const editLabel = labels.edit ?? "Edit";
  const findUserLabel = labels.findUser ?? "Find User";
  const userSurveyDataLabel = labels.userSurveyData ?? "User Survey Data";
  const surveyCloneLabel = labels.surveyClone ?? "Survey Clone";
  const infoLabel = labels.projectUrlInfo ?? "Project URL Info";

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
      {onView && (
        <ActionIconButton label={viewLabel} onClick={onView}>
          <Eye size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onEdit && (
        <ActionIconButton label={editLabel} onClick={onEdit}>
          <Pencil size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onFindUser && (
        <ActionIconButton label={findUserLabel} onClick={onFindUser}>
          <UserRound size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onUserSurveyData && (
        <ActionIconButton label={userSurveyDataLabel} onClick={onUserSurveyData}>
          <LayoutDashboard size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onSurveyClone && (
        <ActionIconButton label={surveyCloneLabel} onClick={onSurveyClone}>
          <Copy size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onProjectUrlInfo && (
        <ActionIconButton
          label={infoLabel}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onProjectUrlInfo(event);
          }}
        >
          <Info size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default SurveyListingActions;
