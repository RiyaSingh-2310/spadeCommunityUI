import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  isAuthenticated,
} from "../../services/auth/authStorage";
import { resolveAuthenticatedLandingPath } from "../../modules/permissions/resolveAuthenticatedLandingPath";

function GuestOnly() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
  }, []);

  if (authed) {
    // Must match post-login routing — never hardcode Dashboard ("/").
    return <Navigate to={resolveAuthenticatedLandingPath()} replace />;
  }

  return <Outlet />;
}

export default GuestOnly;
