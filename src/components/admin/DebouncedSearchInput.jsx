import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDebouncedValue } from "../../modules/shared/hooks/useDebouncedValue";
import { SEARCH_DEBOUNCE_MS } from "../../modules/shared/utils/debounce";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";

/**
 * Controlled search field with 500ms debounce.
 * `onChange` fires on every keystroke (immediate UI).
 * `onDebouncedChange` fires after debounce — use for filtering / API calls.
 */
function DebouncedSearchInput({
  value,
  onChange,
  onDebouncedChange,
  placeholder = "Search...",
  isDarkMode,
  debounceMs = SEARCH_DEBOUNCE_MS,
  className = "",
  inputClassName = "",
  maxWidthClass = "sm:max-w-[340px]",
  "aria-label": ariaLabel = "Search",
}) {
  const debouncedValue = useDebouncedValue(value, debounceMs);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  });

  useEffect(() => {
    onDebouncedChangeRef.current?.(normalizeSearchQuery(debouncedValue));
  }, [debouncedValue]);

  const borderClass = isDarkMode
    ? "border-[#344662] bg-[#101a2a]"
    : "border-[#d8e3ef] bg-white";

  return (
    <label
      className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 ${maxWidthClass} ${borderClass} ${className}`}
    >
      <Search size={15} className="admin-text-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`admin-text w-full bg-transparent text-sm outline-none placeholder:text-[var(--admin-subtle-foreground)] ${inputClassName}`}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  );
}

export default DebouncedSearchInput;
