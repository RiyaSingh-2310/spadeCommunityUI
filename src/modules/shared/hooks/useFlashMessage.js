import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "../../../services/toast/toast";

/**
 * Reads flash from router state, shows toast, clears navigation state.
 */
export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const flash = location.state?.flash;
    if (!flash?.message) return;

    if (flash.type === "error") {
      toast.error(flash.message);
    } else if (flash.type === "warning") {
      toast.warning(flash.message);
    } else if (flash.type === "info") {
      toast.info(flash.message);
    } else {
      toast.success(flash.message);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const showFlash = (nextMessage, nextType = "success") => {
    const trimmed = String(nextMessage ?? "").trim();
    if (!trimmed) return;

    if (nextType === "error") {
      toast.error(trimmed);
    } else if (nextType === "warning") {
      toast.warning(trimmed);
    } else if (nextType === "info") {
      toast.info(trimmed);
    } else {
      toast.success(trimmed);
    }
  };

  return { showFlash };
}
