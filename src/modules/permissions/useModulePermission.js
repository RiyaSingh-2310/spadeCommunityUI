import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "./PermissionsContext";
import { getRoutePermissionAccess } from "./routePermissions";

/**
 * Module-level permission helpers for listing pages, forms, and detail views.
 * @param {string | null} moduleKey
 */
export function useModulePermission(moduleKey) {
  const { hasPermission, permissions, isSuperAdmin } = usePermissions();

  return useMemo(() => {
    if (!moduleKey) {
      return {
        moduleKey: null,
        canRead: true,
        canWrite: true,
        canDownload: true,
        isReadOnly: false,
        showActions: true,
        showAddButton: true,
        showSubmit: true,
        showDownloadButton: true,
        filterColumns: (columns) => (Array.isArray(columns) ? columns : []),
      };
    }

    const allowRead = hasPermission(moduleKey, "read");
    const allowWrite = hasPermission(moduleKey, "write");
    const allowDownload = hasPermission(moduleKey, "csv_download");

    return {
      moduleKey,
      canRead: allowRead,
      canWrite: allowWrite,
      canDownload: allowDownload,
      isReadOnly: allowRead && !allowWrite,
      showActions: allowWrite,
      showAddButton: allowWrite,
      showSubmit: allowWrite,
      showDownloadButton: allowDownload,
      permissions,
      isSuperAdmin,
      filterColumns: (columns = []) => (Array.isArray(columns) ? columns : []),
    };
  }, [moduleKey, hasPermission, permissions, isSuperAdmin]);
}

/**
 * Form route permission — derived from current URL.
 */
export function useFormPermissions() {
  const location = useLocation();
  const { hasPathAccess } = usePermissions();
  const { moduleKey, requiresWrite } = getRoutePermissionAccess(location.pathname);
  const module = useModulePermission(moduleKey);

  return {
    ...module,
    moduleKey,
    requiresWrite,
    allowed: hasPathAccess(location.pathname),
    readOnly: module.canRead && !module.canWrite,
    showSubmit: module.canWrite,
  };
}
