import { useEffect, useRef } from "react";
import { isAdminLoginRole } from "../../services/auth/loginRole";
import { isAuthenticated } from "../../services/auth/authStorage";
import { fetchProfile } from "../settings/services/settingsApi";

/**
 * Re-reads /me once per admin session so sidebar/route guards match current
 * API permissions after refresh or a permission change.
 */
export function useSyncSessionPermissions() {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return undefined;
    if (!isAuthenticated() || !isAdminLoginRole()) return undefined;

    requestedRef.current = true;
    fetchProfile().catch(() => {
      requestedRef.current = false;
    });

    return undefined;
  }, []);
}
