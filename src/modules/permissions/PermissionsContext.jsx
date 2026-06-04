import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getAdminUser } from "../../services/auth/authStorage";
import { getEffectivePermissions, isSuperAdminUser } from "./getEffectivePermissions";
import { canReadModule, canWriteModule } from "./permissionsUtils";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const location = useLocation();
  const admin = getAdminUser();

  const value = useMemo(() => {
    const superAdmin = isSuperAdminUser(admin);
    const permissions = getEffectivePermissions(admin);

    const canRead = (moduleKey) =>
      canReadModule(permissions, moduleKey, { isSuperAdmin: superAdmin });
    const canWrite = (moduleKey) =>
      canWriteModule(permissions, moduleKey, { isSuperAdmin: superAdmin });

    const canAccessNavItem = (permissionKeys = []) => {
      if (!permissionKeys.length) return true;
      return permissionKeys.some((key) => canRead(key));
    };

    return {
      permissions,
      isSuperAdmin: superAdmin,
      canRead,
      canWrite,
      canAccessNavItem,
    };
  }, [admin, location.pathname]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}

export function usePermissionsOptional() {
  return useContext(PermissionsContext);
}
