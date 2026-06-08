import { Eye, Pencil, Shield, Trash2 } from "lucide-react";

const iconBtnClass = (isDarkMode) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
    isDarkMode
      ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
      : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
  }`;

function UserManagementActions({
  isDarkMode,
  onView,
  onEdit,
  onDelete,
  onManagePermissions,
  showView = true,
  showEdit = true,
  showDelete = true,
  showManagePermissions = true,
}) {
  if (!onView && !onEdit && !onDelete && !onManagePermissions) return null;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {showView && onView && (
        <button
          type="button"
          onClick={onView}
          className={iconBtnClass(isDarkMode)}
          aria-label="View"
        >
          <Eye size={13} />
        </button>
      )}
      {showManagePermissions && onManagePermissions && (
        <button
          type="button"
          onClick={onManagePermissions}
          className={iconBtnClass(isDarkMode)}
          title="Manage Permissions"
          aria-label="Manage Permissions"
        >
          <Shield size={13} />
        </button>
      )}
      {showEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={iconBtnClass(isDarkMode)}
          aria-label="Edit"
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
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default UserManagementActions;
