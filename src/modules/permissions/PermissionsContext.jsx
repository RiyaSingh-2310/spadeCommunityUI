import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getAdminUser,
  getAuthToken,
} from "../../services/auth/authStorage";
import { getEffectivePermissions, isSuperAdminUser } from "./getEffectivePermissions";
import {
  canAccessAnyModule,
  canDownloadModule,
  canMutateNotificationInbox,
  canOpenMessagesPage,
  canReadModule,
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
    const permissions = getEffectivePermissions(admin);

    const canRead = (moduleKey) => canReadModule(permissions, moduleKey);
    const canWrite = (moduleKey) => canWriteModule(permissions, moduleKey);
    const canDownload = (moduleKey) => canDownloadModule(permissions, moduleKey);
    const canAccessNavItem = (permissionKeys = []) =>
      canAccessAnyModule(permissions, permissionKeys);

    return {
      permissions,
      isSuperAdmin: isSuperAdminUser(admin),
      canRead,
      canWrite,
      canDownload,
      canAccessNavItem,
      canShowNotificationBell: true,
      canOpenMessagesPage: canOpenMessagesPage(permissions),
      canMutateNotificationInbox: canMutateNotificationInbox(permissions),
      hasPathAccess: (pathname) => hasPathPermissionAccess(pathname, permissions),
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
