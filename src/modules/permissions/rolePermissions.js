import { LOGIN_ROLES } from "../../services/auth/loginRole";
import { PERMISSION_MODULE_KEYS } from "./permissionModules";
import { createEmptyModulePermission } from "./permissionsUtils";

function createRolePermissions(grants) {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = grants[key] ?? createEmptyModulePermission();
    return acc;
  }, /** @type {Record<string, { canRead: boolean, canWrite: boolean, canDownload: boolean }>} */ ({}));
}

const readWrite = { canRead: true, canWrite: true, canDownload: true };
const readOnly = { canRead: true, canWrite: false, canDownload: false };

const readDownload = { canRead: true, canWrite: false, canDownload: true };

const SALES_PERMISSIONS = createRolePermissions({
  dashboard: readOnly,
  rfq: readWrite,
  survey: readOnly,
});

const MANAGER_PERMISSIONS = createRolePermissions({
  dashboard: readOnly,
  survey: readWrite,
  group_survey: readWrite,
});

const PARTNER_PERMISSIONS = createRolePermissions({
  dashboard: readOnly,
  survey: readDownload,
});

/**
 * Fixed permission sets for portal login roles (sales / manager).
 * Admin login uses API permissions unchanged.
 * @param {string} loginRole
 */
export function getRolePermissions(loginRole) {
  if (loginRole === LOGIN_ROLES.SALES) {
    return SALES_PERMISSIONS;
  }
  if (loginRole === LOGIN_ROLES.MANAGER) {
    return MANAGER_PERMISSIONS;
  }
  if (loginRole === LOGIN_ROLES.PARTNER) {
    return PARTNER_PERMISSIONS;
  }
  return null;
}
