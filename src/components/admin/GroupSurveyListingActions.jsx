import { Eye, Pencil, Plus } from "lucide-react";

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

function GroupSurveyListingActions({ onEdit, onAddProject, onListProjects }) {
  if (!onEdit && !onAddProject && !onListProjects) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {onEdit && (
        <ActionIconButton label="Edit Group Survey" onClick={onEdit}>
          <Pencil size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onAddProject && (
        <ActionIconButton label="Add Project" onClick={onAddProject}>
          <Plus size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onListProjects && (
        <ActionIconButton label="View Details" onClick={onListProjects}>
          <Eye size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default GroupSurveyListingActions;
