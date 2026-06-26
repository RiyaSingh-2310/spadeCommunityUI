import { Pencil, Trash2 } from "lucide-react";

function UserManagementActions({
  onEdit,
  onDelete,
  onManagePermissions,
  showEdit = true,
  showDelete = true,
  showManagePermissions = true,
}) {
  if (!onEdit && !onDelete && !onManagePermissions) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {showEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="admin-icon-action"
          aria-label="Edit"
          title="Edit"
        >
          <Pencil size={16} strokeWidth={2} />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="admin-icon-action admin-icon-action--danger"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export default UserManagementActions;
