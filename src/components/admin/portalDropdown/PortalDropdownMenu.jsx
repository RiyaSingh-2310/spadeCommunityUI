import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import {
  PORTAL_DROPDOWN_MAX_HEIGHT,
  PORTAL_DROPDOWN_Z_INDEX,
} from "./portalDropdownConstants";

/**
 * @param {import('react').CSSProperties | null | undefined} menuStyle
 * @param {string} [menuWidth]
 */
export function getPortalDropdownStyle(menuStyle, menuWidth) {
  return {
    ...(menuStyle ?? {
      position: "fixed",
      top: -9999,
      left: 0,
      maxHeight: PORTAL_DROPDOWN_MAX_HEIGHT,
    }),
    visibility: menuStyle ? "visible" : "hidden",
    zIndex: PORTAL_DROPDOWN_Z_INDEX,
    backgroundColor: "#ffffff",
    ...(menuWidth ? { width: menuWidth } : {}),
  };
}

export function PortalDropdownMenu({
  isOpen,
  menuRef,
  menuStyle,
  ariaLabel,
  menuWidth,
  children,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel}
      className="admin-portal-dropdown flex flex-col overflow-hidden rounded-xl"
      style={getPortalDropdownStyle(menuStyle, menuWidth)}
    >
      {children}
    </div>,
    document.body
  );
}

export function PortalDropdownSearch({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="admin-portal-dropdown-search shrink-0 border-b p-2.5">
      <div className="relative">
        <Search
          size={14}
          className="admin-portal-dropdown-text-muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="admin-portal-dropdown-search-input h-9 w-full rounded-lg pl-8 pr-2.5 text-sm"
          autoFocus
        />
      </div>
    </div>
  );
}

export function PortalDropdownOptions({ children, emptyMessage = "No options found", isEmpty }) {
  return (
    <ul className="admin-portal-dropdown-list min-h-0 flex-1 overflow-y-auto py-1.5">
      {isEmpty ? (
        <li className="admin-portal-dropdown-empty px-3 py-2.5 text-sm">{emptyMessage}</li>
      ) : (
        children
      )}
    </ul>
  );
}

export function PortalDropdownOption({ isSelected, onSelect, children, className = "" }) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        className={`admin-portal-dropdown-option flex w-full items-center gap-2 px-3 text-left text-sm ${className} ${
          isSelected ? "admin-portal-dropdown-option-selected" : ""
        }`}
        onClick={onSelect}
      >
        {children}
      </button>
    </li>
  );
}
