import { Pencil, Trash2 } from "lucide-react";

function IconActions({ isDarkMode, onEdit, onDelete, showDelete = true }) {
  if (!onEdit && !(showDelete && onDelete)) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          isDarkMode
            ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
            : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
        }`}
        aria-label="edit"
      >
        <Pencil size={13} />
      </button>
      )}
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            isDarkMode
              ? "text-[#f18484] hover:bg-[#301f2d]"
              : "text-[#de3d3d] hover:bg-[#fff1f1]"
          }`}
          aria-label="delete"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default IconActions;
