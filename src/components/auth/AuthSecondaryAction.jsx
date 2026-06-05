/**
 * Secondary navigation action below auth form primary buttons.
 * Matches primary button width/height; uses admin cancel button theme tokens.
 */
function AuthSecondaryAction({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`admin-btn-cancel mt-4 flex h-[52px] w-full items-center justify-center rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default AuthSecondaryAction;
