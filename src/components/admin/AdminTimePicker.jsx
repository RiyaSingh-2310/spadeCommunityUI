import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { getAdminDateTriggerClass } from "../../modules/shared/utils/formStyles";
import { PORTAL_DROPDOWN_Z_INDEX } from "../../modules/shared/constants/portalDropdown";
import { usePortalDropdownCloseOthers } from "./portalDropdown/usePortalDropdownCloseOthers";
import { useTheme } from "../../context/ThemeContext";

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const POPUP_WIDTH = 220;
const VIEWPORT_PADDING = 12;
const POPUP_GAP = 8;

export function parseTimeValue(value) {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hour: "", minute: "" };
  const hour = String(Math.min(23, Number(match[1]))).padStart(2, "0");
  const minute = String(Math.min(59, Number(match[2]))).padStart(2, "0");
  return { hour, minute };
}

export function formatTimeValue(hour, minute) {
  if (!hour || !minute) return "";
  return `${hour}:${minute}`;
}

function useTimePickerPosition(isOpen, triggerRef, menuRef) {
  const [menuStyle, setMenuStyle] = useState(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const popupWidth = Math.min(POPUP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
    const popupHeight = menu?.offsetHeight ?? 320;

    let left = rect.left;
    if (left + popupWidth > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - VIEWPORT_PADDING - popupWidth;
    }
    left = Math.max(VIEWPORT_PADDING, left);

    const spaceBelow = window.innerHeight - rect.bottom - POPUP_GAP;
    const spaceAbove = rect.top - POPUP_GAP;
    const openUpward = spaceBelow < popupHeight && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      left,
      width: popupWidth,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + POPUP_GAP, top: "auto" }
        : { top: rect.bottom + POPUP_GAP, bottom: "auto" }),
    });
  }, [triggerRef, menuRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(() => {
      updatePosition();
      window.requestAnimationFrame(updatePosition);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, updatePosition]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updatePosition]);

  return menuStyle;
}

function AdminTimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "Select time",
}) {
  const triggerClass = getAdminDateTriggerClass();
  const { isDarkMode } = useTheme();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const pickerTheme = isDarkMode ? "dark" : "light";
  const parsed = useMemo(() => parseTimeValue(value), [value]);
  const displayValue = formatTimeValue(parsed.hour, parsed.minute);
  const hasValue = Boolean(displayValue);

  const menuStyle = useTimePickerPosition(isOpen, triggerRef, menuRef);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
  }, [disabled]);

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

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const frame = window.requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector("[data-selected='true']")
        ?.scrollIntoView({ block: "center" });
      minuteListRef.current
        ?.querySelector("[data-selected='true']")
        ?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, parsed.hour, parsed.minute]);

  const emitTime = (hour, minute) => {
    if (!hour || !minute) return;
    onChange?.(formatTimeValue(hour, minute));
  };

  const handleClear = () => {
    onChange?.("");
    closeMenu();
  };

  const popupStyle = menuStyle ?? {
    position: "fixed",
    top: -9999,
    left: 0,
    visibility: "hidden",
  };

  return (
    <div className={`admin-date-range-root w-full ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        disabled={disabled}
        className={`${triggerClass} disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span
          className={`admin-date-range-value min-w-0 flex-1 whitespace-nowrap text-sm ${
            hasValue ? "admin-text" : "admin-text-subtle"
          }`}
        >
          {hasValue ? displayValue : placeholder}
        </span>
        <Clock size={16} className="admin-date-range-icon shrink-0" aria-hidden />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label={ariaLabel}
            className="admin-date-range-picker"
            data-theme={pickerTheme}
            style={{
              ...popupStyle,
              zIndex: PORTAL_DROPDOWN_Z_INDEX,
            }}
          >
            <p className="admin-date-range-picker__title mb-3">Select time</p>
            <div className="admin-time-picker-columns">
              <div ref={hourListRef} className="admin-time-picker-col">
                <div className="admin-time-picker-col-label">Hour</div>
                {HOURS.map((hour) => {
                  const selected = parsed.hour === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      data-selected={selected ? "true" : undefined}
                      className={`admin-time-picker-option${
                        selected ? " admin-time-picker-option--selected" : ""
                      }`}
                      onClick={() => emitTime(hour, parsed.minute || "00")}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
              <div ref={minuteListRef} className="admin-time-picker-col">
                <div className="admin-time-picker-col-label">Minute</div>
                {MINUTES.map((minute) => {
                  const selected = parsed.minute === minute;
                  return (
                    <button
                      key={minute}
                      type="button"
                      data-selected={selected ? "true" : undefined}
                      className={`admin-time-picker-option${
                        selected ? " admin-time-picker-option--selected" : ""
                      }`}
                      onClick={() => emitTime(parsed.hour || "00", minute)}
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="admin-date-range-picker__footer">
              <p className="admin-date-range-picker__hint">24-hour format</p>
              <button
                type="button"
                className="admin-date-range-picker__clear"
                onClick={handleClear}
                disabled={!hasValue}
              >
                Clear
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminTimePicker;
