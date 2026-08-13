import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DEFAULT_SUCCESS_TOAST,
  resolveApiToastMessage,
} from "../../../services/toast/apiToast";
import toast from "../../../services/toast/toast";

/**
 * Reads flash from router state, shows toast, clears navigation state.
 */
export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const flash = location.state?.flash;
    if (!flash) return;

    const message = resolveApiToastMessage(
      flash.message,
      flash.type === "error" ? "Something went wrong. Please try again." : DEFAULT_SUCCESS_TOAST
    );
    if (!message) return;

    if (flash.type === "error") {
      toast.error(message, { force: true });
    } else if (flash.type === "warning") {
      toast.warning(message, { force: true });
    } else if (flash.type === "info") {
      toast.info(message, { force: true });
    } else {
      toast.success(message, { force: true });
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const showFlash = (nextMessage, nextType = "success") => {
    const trimmed = resolveApiToastMessage(
      nextMessage,
      nextType === "error"
        ? "Something went wrong. Please try again."
        : DEFAULT_SUCCESS_TOAST
    );
    if (!trimmed) return;

    if (nextType === "error") {
      toast.error(trimmed, { force: true });
    } else if (nextType === "warning") {
      toast.warning(trimmed, { force: true });
    } else if (nextType === "info") {
      toast.info(trimmed, { force: true });
    } else {
      toast.success(trimmed, { force: true });
    }
  };

  return { showFlash };
}
