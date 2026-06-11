import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Re-fetches listing data when navigation state includes `{ refresh: true }`. */
export function useListingRefresh(refresh) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.refresh) {
      refresh();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, refresh]);
}
