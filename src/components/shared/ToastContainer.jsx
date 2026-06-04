import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import toast from "../../services/toast/toast";
import { removeToast, subscribe } from "../../services/toast/toastStore";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastContainer({ isDarkMode }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return subscribe(setItems);
  }, []);

  useEffect(() => {
    toast.setTheme(isDarkMode);
  }, [isDarkMode]);

  const theme = isDarkMode ? "dark" : "light";

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-viewport"
      data-theme={theme}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => {
        const Icon = ICONS[item.type] || Info;
        return (
          <div
            key={item.id}
            className={`toast-item toast-item--${item.type}`}
            role="alert"
          >
            <Icon size={18} className="toast-item__icon shrink-0" aria-hidden />
            <p className="toast-item__message">{item.message}</p>
            <button
              type="button"
              className="toast-item__close"
              onClick={() => removeToast(item.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
