import { Pencil, Plus, Trash2 } from "lucide-react";

function ActionIconButton({ label, onClick, disabled = false, danger = false, children }) {
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

function GroupSurveyProjectListingActions({ onEdit, onAddProject, onDelete }) {
  if (!onEdit && !onAddProject && !onDelete) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {onEdit && (
        <ActionIconButton label="Edit Project" onClick={onEdit}>
          <Pencil size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onAddProject && (
        <ActionIconButton label="Add Project" onClick={onAddProject}>
          <Plus size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
      {onDelete && (
        <ActionIconButton label="Delete Project" onClick={onDelete} danger>
          <Trash2 size={16} strokeWidth={2} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default GroupSurveyProjectListingActions;
