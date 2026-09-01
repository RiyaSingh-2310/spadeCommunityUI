import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getAdminUser,
  getAuthToken,
} from "../../services/auth/authStorage";
import { getEffectivePermissions, isSuperAdminUser } from "./getEffectivePermissions";
import {
  canMutateNotificationInbox,
  canOpenMessagesPage,
  canReadModule,
  canShowNotificationBell,
  canWriteModule,
} from "./permissionsUtils";
import { hasPathPermissionAccess } from "./routePermissions";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const location = useLocation();
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const sync = () => setSessionVersion((v) => v + 1);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
  }, []);

  const admin = useMemo(() => getAdminUser(), [sessionVersion, location.pathname]);
  const token = useMemo(() => getAuthToken(), [sessionVersion]);

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

    const options = { isSuperAdmin: superAdmin };

    return {
      permissions,
      isSuperAdmin: superAdmin,
      canRead,
      canWrite,
      canAccessNavItem,
      canShowNotificationBell: canShowNotificationBell(permissions, options),
      canOpenMessagesPage: canOpenMessagesPage(permissions, options),
      canMutateNotificationInbox: canMutateNotificationInbox(permissions, options),
      hasPathAccess: (pathname) => hasPathPermissionAccess(pathname, permissions, options),
    };
  }, [admin, token, location.pathname]);

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
