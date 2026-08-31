import { useEffect } from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  isAuthenticated,
} from "../../../services/auth/authStorage";
import { forceLogoutAfterSessionExpired } from "../../../services/auth/sessionExpiry";
import {
  startAuthSessionLifecycle,
  stopAuthSessionLifecycle,
} from "../../../services/auth/sessionLifecycle";

/**
 * Watch the authenticated admin session for JWT expiry, refresh-before-expiry,
 * and idle auto-logout. Idle logout uses the same session-expired logout flow.
 */
export function useAuthSessionLifecycle() {
  useEffect(() => {
    const syncLifecycle = () => {
      if (!isAuthenticated()) {
        stopAuthSessionLifecycle();
        return;
      }

      startAuthSessionLifecycle({
        onSessionExpired: () => forceLogoutAfterSessionExpired(),
      });
    };

    syncLifecycle();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncLifecycle);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncLifecycle);
      stopAuthSessionLifecycle();
    };
  }, []);
}
