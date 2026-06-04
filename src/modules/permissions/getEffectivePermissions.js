import { MOCK_PERMISSIONS, USE_MOCK_PERMISSIONS } from "./mockPermissions";
import {
  createFullPermissions,
  hasAnyPermissionGrant,
  normalizePermissions,
} from "./permissionsUtils";

function isSuperAdminUser(admin) {
  if (!admin) return false;
  const type = String(admin.permission_type ?? admin.permissionType ?? "").toLowerCase();
  return type === "admin" || type === "super_admin" || type === "superadmin";
}

/**
 * Resolves active permissions: API/stored → mock (dev) → full (super admin).
 * @param {object | null} admin
 */
export function getEffectivePermissions(admin) {
  const superAdmin = isSuperAdminUser(admin);
  const stored = admin?.permissions;

  if (USE_MOCK_PERMISSIONS) {
    return normalizePermissions(MOCK_PERMISSIONS);
  }

  if (hasAnyPermissionGrant(stored)) {
    return normalizePermissions(stored);
  }

  if (superAdmin) {
    return createFullPermissions();
  }

  return normalizePermissions(stored);
}

export { isSuperAdminUser };
