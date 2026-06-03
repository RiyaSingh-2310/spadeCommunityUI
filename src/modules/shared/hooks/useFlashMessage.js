import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Reads flash from router state, clears it, and auto-dismisses after 5s.
 */
export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");

  useEffect(() => {
    const flash = location.state?.flash;
    if (!flash?.message) return;

    setMessage(flash.message);
    setType(flash.type === "error" ? "error" : "success");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const showFlash = (nextMessage, nextType = "success") => {
    setMessage(nextMessage);
    setType(nextType === "error" ? "error" : "success");
  };

  return { message, type, showFlash, clearMessage: () => setMessage("") };
}
