import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDebouncedValue } from "../../modules/shared/hooks/useDebouncedValue";
import { SEARCH_DEBOUNCE_MS } from "../../modules/shared/utils/debounce";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";
import SearchClearButton from "./SearchClearButton";

/**
 * Controlled search field with 500ms debounce.
 * Uses the same clear button as header search (no native browser clear icon).
 */
function DebouncedSearchInput({
  value,
  onChange,
  onDebouncedChange,
  placeholder = "Search...",
  debounceMs = SEARCH_DEBOUNCE_MS,
  className = "",
  inputClassName = "",
  maxWidthClass = "sm:max-w-[340px]",
  "aria-label": ariaLabel = "Search",
}) {
  const debouncedValue = useDebouncedValue(value, debounceMs);
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  const lastEmittedRef = useRef(null);
  const isFirstEmitRef = useRef(true);
  const hasValue = String(value ?? "").length > 0;

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  });

  useEffect(() => {
    const normalized = normalizeSearchQuery(debouncedValue);

    if (isFirstEmitRef.current) {
      isFirstEmitRef.current = false;
      lastEmittedRef.current = normalized;
      return;
    }

    if (lastEmittedRef.current === normalized) {
      return;
    }

    lastEmittedRef.current = normalized;
    onDebouncedChangeRef.current?.(normalized);
  }, [debouncedValue]);

  return (
    <label
      className={`admin-search-field w-full ${maxWidthClass} ${className}`}
    >
      <Search size={16} strokeWidth={2} className="admin-text-subtle shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`admin-text w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--admin-subtle-foreground)] ${inputClassName}`}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {hasValue ? (
        <SearchClearButton
          onClick={() => onChange("")}
          ariaLabel="Clear search"
        />
      ) : null}
    </label>
  );
}

export default DebouncedSearchInput;
