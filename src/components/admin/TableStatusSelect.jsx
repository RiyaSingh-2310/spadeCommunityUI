import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePortalDropdownPosition } from "../../modules/shared/hooks/usePortalDropdownPosition";
import { getAdminTableSelectTriggerClass } from "../../modules/shared/utils/formStyles";
import {
  PortalDropdownMenu,
  PortalDropdownOption,
  PortalDropdownOptions,
} from "./portalDropdown/PortalDropdownMenu";
import { usePortalDropdownCloseOthers } from "./portalDropdown/usePortalDropdownCloseOthers";

function normalizeOptions(options) {
  return options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return { value: option.value, label: option.label ?? option.value };
  });
}

function TableStatusSelect({
  value,
  options,
  disabled = false,
  isDarkMode = false,
  onChange,
  "aria-label": ariaLabel = "Status",
}) {
  const generatedId = useId();
  const controlId = generatedId;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(() => String(value ?? "").trim());

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  useEffect(() => {
    setLocalValue(String(value ?? "").trim());
  }, [value]);

  const selectedOption =
    normalizedOptions.find((option) => option.value === localValue) ?? normalizedOptions[0];
  const selectedLabel = selectedOption?.label ?? localValue ?? "Select status";

  const menuStyle = usePortalDropdownPosition(isOpen, triggerRef, menuRef);
  const triggerClass = getAdminTableSelectTriggerClass();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openMenu = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  usePortalDropdownCloseOthers(isOpen, closeMenu);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutside = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeMenu]);

  const handleSelect = (nextValue) => {
    if (nextValue === localValue) {
      closeMenu();
      return;
    }
    setLocalValue(nextValue);
    onChange?.(nextValue);
    closeMenu();
  };

  return (
    <div className="admin-table-select-wrap">
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`${triggerClass} ${isOpen ? "admin-table-status-select-trigger-open" : ""}`}
      >
        <span className="admin-table-status-select-label">{selectedLabel}</span>
        <ChevronDown
          size={12}
          className={`admin-table-status-select-chevron transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <PortalDropdownMenu
        isOpen={isOpen}
        menuRef={menuRef}
        menuStyle={menuStyle}
        ariaLabel={ariaLabel}
        theme={isDarkMode ? "dark" : "light"}
        menuWidth={menuStyle?.width ? `${menuStyle.width}px` : undefined}
      >
        <PortalDropdownOptions isEmpty={normalizedOptions.length === 0}>
          {normalizedOptions.map((option) => {
            const isSelected = option.value === localValue;
            return (
              <PortalDropdownOption
                key={option.value}
                isSelected={isSelected}
                onSelect={() => handleSelect(option.value)}
              >
                <span className="admin-portal-dropdown-text whitespace-nowrap">{option.label}</span>
              </PortalDropdownOption>
            );
          })}
        </PortalDropdownOptions>
      </PortalDropdownMenu>
    </div>
  );
}

export default TableStatusSelect;
