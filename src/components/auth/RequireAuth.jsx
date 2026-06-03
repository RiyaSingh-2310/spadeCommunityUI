import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../services/auth/authStorage";

function RequireAuth() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
