import { Pencil, ShieldCheck, Trash2 } from "lucide-react";

function UserManagementActions({
  onEdit,
  onDelete,
  onManagePermissions,
  showEdit = true,
  showDelete = true,
  showManagePermissions = true,
}) {
  const canEdit = showEdit && Boolean(onEdit);
  const canDelete = showDelete && Boolean(onDelete);
  const canManagePermissions =
    showManagePermissions && Boolean(onManagePermissions);

  if (!canEdit && !canDelete && !canManagePermissions) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
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
      {canManagePermissions && (
        <button
          type="button"
          onClick={onManagePermissions}
          className="admin-icon-action"
          aria-label="Manage Permissions"
          title="Manage Permissions"
        >
          <ShieldCheck size={16} strokeWidth={2} />
        </button>
      )}
      {canDelete && (
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
