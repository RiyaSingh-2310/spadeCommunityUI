import { Pencil, Plus, Trash2 } from "lucide-react";

const iconBtnClass = (isDarkMode, { disabled = false, danger = false } = {}) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
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
      className={iconBtnClass(isDarkMode, { disabled, danger })}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function GroupSurveyProjectListingActions({
  isDarkMode,
  onEdit,
  onAddProject,
  onDelete,
}) {
  if (!onEdit && !onAddProject && !onDelete) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {onEdit && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="Edit Project"
          onClick={onEdit}
        >
          <Pencil size={13} />
        </ActionIconButton>
      )}
      {onAddProject && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="Add Project"
          onClick={onAddProject}
        >
          <Plus size={13} />
        </ActionIconButton>
      )}
      {onDelete && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="Delete Project"
          onClick={onDelete}
          danger
        >
          <Trash2 size={13} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default GroupSurveyProjectListingActions;
