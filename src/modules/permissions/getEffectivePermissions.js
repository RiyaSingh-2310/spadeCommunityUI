import { getLoginRole, isAdminLoginRole } from "../../services/auth/loginRole";
import {
  createFullPermissions,
  hasAnyPermissionGrant,
  resolvePermissionsFromRecord,
} from "./permissionsUtils";
import { getRolePermissions } from "./rolePermissions";

function isSuperAdminUser(admin) {
  if (!admin) return false;
  const type = String(admin.permission_type ?? admin.permissionType ?? "").toLowerCase();
  return type === "admin" || type === "super_admin" || type === "superadmin";
}

/**
 * Single source of truth for active session permissions (login API → decrypted storage).
 * @param {object | null} admin
 */
export function getEffectivePermissions(admin) {
  const loginRole = getLoginRole();
  if (!isAdminLoginRole()) {
    const rolePermissions = getRolePermissions(loginRole);
    if (rolePermissions) {
      return rolePermissions;
    }
  }

  const superAdmin = isSuperAdminUser(admin);
  const permissions = resolvePermissionsFromRecord(admin);

  if (hasAnyPermissionGrant(permissions)) {
    return permissions;
  }

  if (superAdmin) {
    return createFullPermissions();
  }

  return permissions;
}

export { isSuperAdminUser };
