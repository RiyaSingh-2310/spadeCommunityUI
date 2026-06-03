import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../../services/auth/authStorage";

function GuestOnly() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default GuestOnly;
