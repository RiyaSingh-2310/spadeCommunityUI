function PreferenceToggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[var(--admin-primary-color)]" : "bg-[var(--admin-input-border)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-[var(--admin-header-surface)] shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default PreferenceToggle;
