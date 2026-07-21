import { getSidebarNavItemsForRole } from "../../config/roleSidebarNav";
import { getAdminUser } from "../../services/auth/authStorage";
import { getLoginRole } from "../../services/auth/loginRole";
import { getEffectivePermissions, isSuperAdminUser } from "./getEffectivePermissions";
import { canReadModule } from "./permissionsUtils";

/**
 * Walks sidebar nav (links + group children) and returns the first route the
 * user can access. Group children may omit `type: "link"`.
 *
 * @param {Array<{ type?: string, root?: string, permissionKeys?: string[], children?: Array<{ root?: string, permissionKeys?: string[] }> }>} navItems
 * @param {(permissionKeys?: string[]) => boolean} canAccessNavItem
 * @returns {string | null}
 */
export function getFirstAccessibleNavPath(navItems, canAccessNavItem) {
  for (const item of navItems ?? []) {
    if (!item) continue;

    if (item.type === "group") {
      for (const child of item.children ?? []) {
        if (!child?.root) continue;
        if (canAccessNavItem(child.permissionKeys ?? [])) {
          return child.root;
        }
      }
      continue;
    }

    if (item.root && canAccessNavItem(item.permissionKeys ?? [])) {
      return item.root;
    }
  }

  return null;
}

/**
 * Post-login / authenticated landing path from the current session.
 * Skips Dashboard when the user lacks dashboard permission.
 * Falls back to "/" only when no navigable module is found.
 *
 * @returns {string}
 */
export function resolveAuthenticatedLandingPath() {
  const admin = getAdminUser();
  const loginRole = getLoginRole();
  const permissions = getEffectivePermissions(admin);
  const superAdmin = isSuperAdminUser(admin);
  const navItems = getSidebarNavItemsForRole(loginRole);

  const canAccessNavItem = (permissionKeys = []) => {
    if (!permissionKeys || permissionKeys.length === 0) return true;
    return permissionKeys.some((key) =>
      canReadModule(permissions, key, { isSuperAdmin: superAdmin })
    );
  };

  return getFirstAccessibleNavPath(navItems, canAccessNavItem) ?? "/";
}
