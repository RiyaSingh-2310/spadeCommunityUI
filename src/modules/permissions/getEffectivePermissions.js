import { getLoginRole, isAdminLoginRole } from "../../services/auth/loginRole";
import { resolvePermissionsFromRecord } from "./permissionsUtils";
import { getRolePermissions } from "./rolePermissions";

/**
 * True only for an explicit super-admin type. Regular `admin` users still
 * receive only the modules assigned in their API permission payload.
 */
function isSuperAdminUser(admin) {
  if (!admin) return false;
  const type = String(admin.permission_type ?? admin.permissionType ?? "").toLowerCase();
  return type === "super_admin" || type === "superadmin";
}

/**
 * Session permissions come from the login/profile API payload.
 * Admin login role does not unlock every module.
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

  return resolvePermissionsFromRecord(admin);
}

export { isSuperAdminUser };
