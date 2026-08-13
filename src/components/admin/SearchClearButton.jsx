import { X } from "lucide-react";

/** Shared clear/close control used by header and listing search fields. */
function SearchClearButton({ onClick, ariaLabel = "Clear search" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="admin-icon-btn admin-text-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
      aria-label={ariaLabel}
    >
      <X size={14} />
    </button>
  );
}

export default SearchClearButton;
