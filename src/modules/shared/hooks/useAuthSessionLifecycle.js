import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  isAuthenticated,
} from "../../../services/auth/authStorage";
import { performLogout } from "../../../services/auth/authApi";
import {
  startAuthSessionLifecycle,
  stopAuthSessionLifecycle,
} from "../../../services/auth/sessionLifecycle";

/**
 * Keeps the admin session alive while the user is active, and signs out after
 * the configured inactivity timeout (minimum 10 minutes).
 */
export function useAuthSessionLifecycle() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const syncLifecycle = () => {
      if (!isAuthenticated()) {
        stopAuthSessionLifecycle();
        return;
      }

      startAuthSessionLifecycle({
        onIdleLogout: () =>
          performLogout(navigateRef.current, { reason: "inactivity" }),
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
