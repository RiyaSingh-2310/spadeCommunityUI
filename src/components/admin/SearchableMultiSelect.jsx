import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
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

function SearchableMultiSelect({
  value = [],
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
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value.map((item) => String(item)) : []),
    [value]
  );
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const isSearchable =
    searchable ?? normalizedOptions.length > 5;

  const filteredOptions = useMemo(() => {
    if (!isSearchable) return normalizedOptions;
    return filterSelectOptions(normalizedOptions, search);
  }, [normalizedOptions, search, isSearchable]);

  const menuStyle = usePortalDropdownPosition(isOpen, triggerRef, menuRef);

  const triggerClass = inputClass?.trim() || getAdminInputClass();

  const selectedLabel = useMemo(() => {
    if (!selectedValues.length) return "";
    const labels = selectedValues.map((selected) => {
      const match = normalizedOptions.find((option) => String(option.value) === selected);
      return match?.label ?? selected;
    });
    return labels.join(", ");
  }, [selectedValues, normalizedOptions]);

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

  const handleToggle = (nextValue) => {
    const normalizedValue = String(nextValue);
    const nextSelected = selectedSet.has(normalizedValue)
      ? selectedValues.filter((item) => item !== normalizedValue)
      : [...selectedValues, normalizedValue];
    onChange?.(nextSelected);
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
        className={`${triggerClass} flex min-h-11 items-center justify-between gap-2 py-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
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
            const isSelected = selectedSet.has(String(option.value));
            return (
              <PortalDropdownOption
                key={`${option.value}-${option.label}`}
                isSelected={isSelected}
                onSelect={() => handleToggle(option.value)}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? "border-[var(--admin-primary-color)] bg-[var(--admin-primary-color)] text-white"
                      : "border-[var(--admin-checkbox-border)] bg-[var(--admin-checkbox-bg)]"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                </span>
                <span className="admin-portal-dropdown-text min-w-0 truncate">{option.label}</span>
              </PortalDropdownOption>
            );
          })}
        </PortalDropdownOptions>
      </PortalDropdownMenu>
    </>
  );
}

export default SearchableMultiSelect;
