import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useDebouncedValue } from "../../modules/shared/hooks/useDebouncedValue";
import { normalizeSearchQuery } from "../../modules/shared/utils/searchQuery";
import SearchClearButton from "./SearchClearButton";
import { useClearOrCloseSearch } from "./useClearOrCloseSearch";

/**
 * Global admin header search (single shared control).
 * One X button: clear text first; close only when already empty.
 */
function HeaderSearch({ onDebouncedSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const inputRef = useRef(null);
  const { handleClearOrClose } = useClearOrCloseSearch({
    query,
    setQuery,
    setIsOpen,
    inputRef,
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !debouncedQuery) return;
    onDebouncedSearch?.(normalizeSearchQuery(debouncedQuery));
  }, [debouncedQuery, isOpen, onDebouncedSearch]);

  const openSearch = () => setIsOpen(true);

  return (
    <div className="flex items-center justify-end">
      <div
        className={`overflow-hidden transition-all duration-[350ms] ease-in-out ${
          isOpen
            ? "w-full max-w-[220px] opacity-100 sm:max-w-[300px] md:max-w-[360px]"
            : "w-0 opacity-0"
        }`}
      >
        <div
          className={`admin-header-search-input flex h-10 min-w-[200px] items-center gap-2 rounded-xl border px-3 sm:min-w-[260px] md:min-w-[320px] ${
            isOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Here"
            className="admin-text w-full bg-transparent text-sm outline-none placeholder:text-[var(--admin-subtle-foreground)]"
            aria-label="Search"
          />
          <SearchClearButton
            onClick={handleClearOrClose}
            ariaLabel={query ? "Clear search" : "Close search"}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={openSearch}
        className={`admin-icon-btn admin-text-subtle rounded-xl p-2.5 transition-all duration-[350ms] ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-header-search-border)] ${
          isOpen
            ? "pointer-events-none ml-0 w-0 scale-95 overflow-hidden p-0 opacity-0"
            : "ml-0 opacity-100"
        }`}
        aria-label="Open search"
        tabIndex={isOpen ? -1 : 0}
      >
        <Search size={18} />
      </button>
    </div>
  );
}

export default HeaderSearch;
