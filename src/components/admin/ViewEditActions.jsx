import { Eye, Pencil } from "lucide-react";

const iconBtnClass = (isDarkMode) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
    isDarkMode
      ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
      : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
  }`;

function ViewEditActions({ isDarkMode, onView, onEdit }) {
  if (!onView && !onEdit) return null;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <button
          type="button"
          onClick={onView}
          className={iconBtnClass(isDarkMode)}
          aria-label="View"
        >
          <Eye size={13} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={iconBtnClass(isDarkMode)}
          aria-label="Edit"
        >
          <Pencil size={13} />
        </button>
      )}
    </div>
  );
}

export default ViewEditActions;
