import { LOGIN_ROLES } from "../../services/auth/loginRole";
import { PERMISSION_MODULE_KEYS } from "./permissionModules";
import { createEmptyModulePermission } from "./permissionsUtils";

function createRolePermissions(grants) {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = grants[key] ?? createEmptyModulePermission();
    return acc;
  }, /** @type {Record<string, { canRead: boolean, canWrite: boolean }>} */ ({}));
}

const readWrite = { canRead: true, canWrite: true };
const readOnly = { canRead: true, canWrite: false };

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
  return null;
}
