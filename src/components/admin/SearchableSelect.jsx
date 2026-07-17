import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePortalDropdownPosition } from "../../modules/shared/hooks/usePortalDropdownPosition";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import { filterSelectOptions } from "../../modules/shared/utils/dropdownSearch";
import { toSelectOptions } from "../../modules/shared/utils/selectOptions";
import {
  PortalDropdownMenu,
  PortalDropdownOption,
  PortalDropdownOptions,
  PortalDropdownSearch,
} from "./portalDropdown/PortalDropdownMenu";
import { usePortalDropdownCloseOthers } from "./portalDropdown/usePortalDropdownCloseOthers";

function SearchableSelect({
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = "Select...",
  disabled = false,
  inputClass = "",
  id,
  searchable = null,
  loading = false,
  loadingLabel = "Loading...",
  emptyMessage = "No options found",
  searchPlaceholder = "Search...",
  "aria-label": ariaLabel,
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedOptions = useMemo(() => toSelectOptions(options), [options]);
  const isSearchable =
    searchable ?? normalizedOptions.length > 5;

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? "")
  );
  const selectedLabel = selectedOption?.label ?? "";

  const filteredOptions = useMemo(() => {
    if (!isSearchable) return normalizedOptions;
    return filterSelectOptions(normalizedOptions, search);
  }, [normalizedOptions, search, isSearchable]);

  const menuStyle = usePortalDropdownPosition(isOpen, triggerRef, menuRef);

  const triggerClass =
    inputClass?.trim() || getAdminInputClass();

  const closeMenu = useCallback(
    (shouldBlur = false) => {
      setIsOpen(false);
      setSearch("");
      if (shouldBlur) onBlur?.();
    },
    [onBlur]
  );

  const openMenu = () => {
    if (disabled || loading) return;
    setIsOpen(true);
  };

  usePortalDropdownCloseOthers(isOpen, () => closeMenu());

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutside = (event) => {
      const target = event.target;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu(true);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeMenu]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    closeMenu(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        disabled={disabled || loading}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`${triggerClass} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            loading || !selectedLabel ? "admin-text-subtle" : "admin-text"
          }`}
        >
          {loading ? loadingLabel : selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`admin-text-subtle shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <PortalDropdownMenu
        isOpen={isOpen}
        menuRef={menuRef}
        menuStyle={menuStyle}
        ariaLabel={ariaLabel ?? placeholder}
      >
        {isSearchable && (
          <PortalDropdownSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        )}
        <PortalDropdownOptions
          isEmpty={filteredOptions.length === 0}
          emptyMessage={emptyMessage}
        >
          {filteredOptions.map((option) => {
            const isSelected = String(option.value) === String(value ?? "");
            return (
              <PortalDropdownOption
                key={`${option.value}-${option.label}`}
                isSelected={isSelected}
                onSelect={() => handleSelect(option.value)}
              >
                <span className="admin-portal-dropdown-text min-w-0 truncate">{option.label}</span>
              </PortalDropdownOption>
            );
          })}
        </PortalDropdownOptions>
      </PortalDropdownMenu>
    </>
  );
}

export default SearchableSelect;
