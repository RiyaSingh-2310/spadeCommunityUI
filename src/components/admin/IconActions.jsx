import { Pencil, Trash2 } from "lucide-react";

const ICON_SIZE = 15;

function IconActions({ isDarkMode, onEdit, onDelete, showDelete = true }) {
  if (!onEdit && !(showDelete && onDelete)) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="admin-icon-action-btn admin-icon-action-btn--edit"
          aria-label="Edit"
          title="Edit"
        >
          <Pencil size={ICON_SIZE} strokeWidth={2} />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="admin-icon-action-btn admin-icon-action-btn--delete"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={ICON_SIZE} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export default IconActions;
