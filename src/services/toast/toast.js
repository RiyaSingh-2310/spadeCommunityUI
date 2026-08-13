import {
  DEFAULT_DURATION,
  pushToast,
  removeToast,
  clearToasts,
  setToastTheme,
} from "./toastStore";

function show(type, message, durationOrOptions, maybeOptions) {
  let duration = DEFAULT_DURATION;
  let options = {};

  if (typeof durationOrOptions === "number") {
    duration = durationOrOptions;
    options = maybeOptions && typeof maybeOptions === "object" ? maybeOptions : {};
  } else if (durationOrOptions && typeof durationOrOptions === "object") {
    options = durationOrOptions;
    if (typeof options.duration === "number") duration = options.duration;
  }

  return pushToast(type, message, duration, options);
}

const toast = {
  success: (message, durationOrOptions, maybeOptions) =>
    show("success", message, durationOrOptions, maybeOptions),
  error: (message, durationOrOptions, maybeOptions) =>
    show("error", message, durationOrOptions, maybeOptions),
  warning: (message, durationOrOptions, maybeOptions) =>
    show("warning", message, durationOrOptions, maybeOptions),
  info: (message, durationOrOptions, maybeOptions) =>
    show("info", message, durationOrOptions, maybeOptions),
  dismiss: removeToast,
  clear: clearToasts,
  setTheme: setToastTheme,
};

export default toast;
