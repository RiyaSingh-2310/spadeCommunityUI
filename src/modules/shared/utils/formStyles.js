export function getAdminInputClass() {
  return "h-11 w-full rounded-xl border px-3 text-sm outline-none transition border-[var(--admin-header-search-border)] bg-[var(--admin-header-search-bg)] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]";
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
      "h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]",
    cancelClass: getAdminCancelButtonClass(),
    navigate,
    cancelPath,
    canSubmit,
  };
}
