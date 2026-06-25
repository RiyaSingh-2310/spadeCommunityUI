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

  const borderClass = "admin-search-input border";

  return (
    <label
      className={`flex h-11 w-full items-center gap-2.5 rounded-xl border px-3.5 ${maxWidthClass} ${borderClass} ${className}`}
    >
      <Search size={16} strokeWidth={2} className="admin-text-subtle shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`admin-text w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--admin-subtle-foreground)] ${inputClassName}`}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  );
}

export default DebouncedSearchInput;
