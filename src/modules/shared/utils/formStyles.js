export function getAdminInputClass() {
  return "h-11 w-full rounded-xl border px-3 text-sm outline-none transition border-[var(--admin-header-search-border)] bg-[var(--admin-header-search-bg)] text-[var(--admin-foreground)] placeholder:text-[var(--admin-subtle-foreground)]";
}

export function getFormActions(navigate, cancelPath, canSubmit, isDarkMode) {
  return {
    submitClass:
      "h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]",
    cancelClass: `h-11 rounded-xl px-5 text-sm font-semibold transition ${
      isDarkMode
        ? "bg-[#1f3047] text-[var(--admin-foreground)]"
        : "bg-[#eef4fb] text-[var(--admin-foreground)]"
    }`,
    navigate,
    cancelPath,
    canSubmit,
  };
}
