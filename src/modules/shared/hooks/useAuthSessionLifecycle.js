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
 * Watch the authenticated admin session for JWT expiry (and refresh-before-expiry).
 * Does not use an inactivity timer. Automatic logout runs only when the token
 * expires or an authenticated request reports an expired session.
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
