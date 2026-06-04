import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { isActionColumn, isDetailsColumn } from "../shared/utils/tableHelpers";
import { usePermissions } from "./PermissionsContext";
import { getRoutePermissionAccess } from "./routePermissions";

/**
 * Module-level permission helpers for listing pages, forms, and detail views.
 * @param {string | null} moduleKey
 */
export function useModulePermission(moduleKey) {
  const { canRead, canWrite, permissions, isSuperAdmin } = usePermissions();

  return useMemo(() => {
    if (!moduleKey) {
      return {
        moduleKey: null,
        canRead: true,
        canWrite: true,
        isReadOnly: false,
        showActions: true,
        showAddButton: true,
        showSubmit: true,
        filterColumns: (columns) => columns,
      };
    }

    const allowRead = canRead(moduleKey);
    const allowWrite = canWrite(moduleKey);

    return {
      moduleKey,
      canRead: allowRead,
      canWrite: allowWrite,
      isReadOnly: allowRead && !allowWrite,
      showActions: allowWrite,
      showAddButton: allowWrite,
      showSubmit: allowWrite,
      permissions,
      isSuperAdmin,
      filterColumns: (columns = []) => {
        if (allowWrite) return columns;
        return columns.filter(
          (col) => !isActionColumn(col) && !isDetailsColumn(col)
        );
      },
    };
  }, [moduleKey, canRead, canWrite, permissions, isSuperAdmin]);
}

/**
 * Form route permission — derived from current URL.
 */
export function useFormPermissions() {
  const location = useLocation();
  const { moduleKey, requiresWrite } = getRoutePermissionAccess(location.pathname);
  const module = useModulePermission(moduleKey);

  const allowed = requiresWrite ? module.canWrite : module.canRead;

  return {
    ...module,
    moduleKey,
    requiresWrite,
    allowed,
    readOnly: module.canRead && !module.canWrite,
    showSubmit: module.canWrite,
  };
}
