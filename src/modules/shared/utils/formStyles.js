const ADMIN_INPUT_BASE =
  "admin-input h-11 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)] placeholder:font-medium disabled:cursor-not-allowed disabled:opacity-60";

/** Theme-aware form input styling (matches Partner / Client modules). */
export function getAdminInputClass() {
  return ADMIN_INPUT_BASE;
}

/** Theme-aware textarea styling — same as inputs with flexible height. */
export function getAdminTextareaClass(extraClass = "") {
  return `${ADMIN_INPUT_BASE} min-h-[112px] resize-y py-3 ${extraClass}`.trim();
}

/** Theme-aware secondary/cancel button (uses .admin-btn-cancel in index.css). */
export function getAdminCancelButtonClass(size = "form") {
  if (size === "modal") {
    return "admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  }
  return "admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
}

export function getFormActions(navigate, cancelPath, canSubmit) {
  return {
    submitClass:
      "admin-btn-primary h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none",
    cancelClass: getAdminCancelButtonClass(),
    navigate,
    cancelPath,
    canSubmit,
  };
}
