import {
  DEFAULT_DURATION,
  pushToast,
  removeToast,
  clearToasts,
  setToastTheme,
} from "./toastStore";

function show(type, message, duration = DEFAULT_DURATION) {
  return pushToast(type, message, duration);
}

const toast = {
  success: (message, duration) => show("success", message, duration),
  error: (message, duration) => show("error", message, duration),
  warning: (message, duration) => show("warning", message, duration),
  info: (message, duration) => show("info", message, duration),
  dismiss: removeToast,
  clear: clearToasts,
  setTheme: setToastTheme,
};

export default toast;
