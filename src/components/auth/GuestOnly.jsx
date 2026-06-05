import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  isAuthenticated,
} from "../../services/auth/authStorage";

function GuestOnly() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
  }, []);

  if (authed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default GuestOnly;
