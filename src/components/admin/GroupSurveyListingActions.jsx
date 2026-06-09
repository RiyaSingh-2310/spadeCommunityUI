import { Eye, Pencil, Plus } from "lucide-react";

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

function GroupSurveyListingActions({
  isDarkMode,
  onEdit,
  onAddProject,
  onListProjects,
}) {
  if (!onEdit && !onAddProject && !onListProjects) return null;

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
      {onListProjects && (
        <ActionIconButton
          isDarkMode={isDarkMode}
          label="View Projects"
          onClick={onListProjects}
        >
          <Eye size={13} />
        </ActionIconButton>
      )}
    </div>
  );
}

export default GroupSurveyListingActions;
