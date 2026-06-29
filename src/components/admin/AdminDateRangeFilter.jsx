import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import { PORTAL_DROPDOWN_Z_INDEX } from "../../modules/shared/constants/portalDropdown";
import { usePortalDropdownCloseOthers } from "./portalDropdown/usePortalDropdownCloseOthers";
import { useTheme } from "../../context/ThemeContext";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const POPUP_MIN_WIDTH = 300;
const POPUP_MAX_WIDTH = 336;
const VIEWPORT_PADDING = 12;
const POPUP_GAP = 8;

function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = parseIsoDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRangeDisplay(fromDate, toDate) {
  const fromLabel = formatDisplayDate(fromDate);
  const toLabel = formatDisplayDate(toDate);
  if (fromLabel && toLabel) return `${fromLabel} - ${toLabel}`;
  if (fromLabel) return fromLabel;
  if (toLabel) return toLabel;
  return "";
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetweenDays(day, start, end) {
  if (!day || !start || !end) return false;
  const time = day.getTime();
  return time > start.getTime() && time < end.getTime();
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(viewMonth) {
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const leading = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((leading + monthEnd.getDate()) / 7) * 7;
  const days = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - leading + 1;
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNumber);
    days.push({
      date,
      inCurrentMonth: date.getMonth() === viewMonth.getMonth(),
    });
  }

  return days;
}

function getPopupWidth() {
  return Math.min(
    POPUP_MAX_WIDTH,
    Math.max(POPUP_MIN_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2)
  );
}

function useDateRangePickerPosition(isOpen, triggerRef, menuRef, viewMonth) {
  const [menuStyle, setMenuStyle] = useState(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const popupWidth = getPopupWidth();
    const popupHeight = menu?.offsetHeight ?? 380;

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
  }, [isOpen, viewMonth, updatePosition]);

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

function AdminDateRangeFilter({
  fromDate = "",
  toDate = "",
  onFromChange,
  onToChange,
  placeholder = "From Date - To Date",
  className = "",
}) {
  const inputClass = getAdminInputClass();
  const { isDarkMode } = useTheme();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseIsoDate(fromDate) ?? new Date());
  const [pendingStart, setPendingStart] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const pickerTheme = isDarkMode ? "dark" : "light";

  const menuStyle = useDateRangePickerPosition(isOpen, triggerRef, menuRef, viewMonth);
  const displayValue = formatRangeDisplay(fromDate, toDate);
  const hasValue = Boolean(displayValue);

  const committedStart = parseIsoDate(fromDate);
  const committedEnd = parseIsoDate(toDate);

  const highlightBounds = useMemo(() => {
    let start = pendingStart ?? committedStart;
    let end = pendingStart ? hoverDate ?? null : committedEnd;

    if (start && end && end < start) {
      [start, end] = [end, start];
    }

    return { start, end };
  }, [pendingStart, hoverDate, committedStart, committedEnd]);

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setPendingStart(null);
    setHoverDate(null);
  }, []);

  const openMenu = useCallback(() => {
    setViewMonth(parseIsoDate(fromDate) ?? parseIsoDate(toDate) ?? new Date());
    setPendingStart(null);
    setHoverDate(null);
    setIsOpen(true);
  }, [fromDate, toDate]);

  usePortalDropdownCloseOthers(isOpen, closeMenu);

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

  const handleDaySelect = (date) => {
    if (!pendingStart) {
      setPendingStart(date);
      return;
    }

    let start = pendingStart;
    let end = date;
    if (end < start) {
      [start, end] = [end, start];
    }

    onFromChange?.(toIsoDate(start));
    onToChange?.(toIsoDate(end));
    closeMenu();
  };

  const handleGridMouseLeave = () => {
    if (pendingStart) setHoverDate(null);
  };

  const handleDayMouseEnter = (date) => {
    if (pendingStart) setHoverDate(date);
  };

  const hasClearable = hasValue || Boolean(pendingStart);

  const handleClear = () => {
    onFromChange?.("");
    onToChange?.("");
    setPendingStart(null);
    setHoverDate(null);
    setViewMonth(new Date());
    closeMenu();
  };

  const popupStyle = menuStyle ?? {
    position: "fixed",
    top: -9999,
    left: 0,
    visibility: "hidden",
  };

  return (
    <div
      className={`admin-date-range-root w-full min-w-[min(100%,20.5rem)] shrink-0 sm:w-[20.5rem] ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className={`${inputClass} admin-date-range-trigger flex h-10 w-full items-center gap-2.5 px-3.5 text-left`}
        aria-label="Select date range"
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
        <Calendar
          size={16}
          className="admin-date-range-icon shrink-0"
          aria-hidden
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Date range picker"
            className="admin-date-range-picker"
            data-theme={pickerTheme}
            style={{
              ...popupStyle,
              zIndex: PORTAL_DROPDOWN_Z_INDEX,
            }}
          >
            <div className="admin-date-range-picker__header">
              <button
                type="button"
                className="admin-date-range-picker__nav"
                onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="admin-date-range-picker__title">
                {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </p>
              <button
                type="button"
                className="admin-date-range-picker__nav"
                onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="admin-date-range-picker__weekdays">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="admin-date-range-picker__weekday">
                  {label}
                </span>
              ))}
            </div>

            <div
              className="admin-date-range-picker__grid"
              onMouseLeave={handleGridMouseLeave}
            >
              {calendarDays.map(({ date, inCurrentMonth }) => {
                const { start, end } = highlightBounds;
                const hasRange = Boolean(start && end);
                const isStart = start && isSameDay(date, start);
                const isEnd = end && isSameDay(date, end);
                const isSingleDay = isStart && isEnd;
                const inRange =
                  hasRange &&
                  !isSingleDay &&
                  isBetweenDays(date, start, end);

                return (
                  <button
                    key={toIsoDate(date)}
                    type="button"
                    className={[
                      "admin-date-range-picker__day",
                      !inCurrentMonth && "admin-date-range-picker__day--outside",
                      inRange && "admin-date-range-picker__day--in-range",
                      isStart && "admin-date-range-picker__day--range-start",
                      isEnd && "admin-date-range-picker__day--range-end",
                      (isStart || isEnd) && "admin-date-range-picker__day--selected",
                      isSingleDay && "admin-date-range-picker__day--single",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleDaySelect(date)}
                    onMouseEnter={() => handleDayMouseEnter(date)}
                  >
                    <span className="admin-date-range-picker__day-label">
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="admin-date-range-picker__footer">
              <p className="admin-date-range-picker__hint">
                {pendingStart ? "Select end date" : "Select start date"}
              </p>
              <button
                type="button"
                className="admin-date-range-picker__clear"
                onClick={handleClear}
                disabled={!hasClearable}
                aria-label="Clear date range"
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

export default AdminDateRangeFilter;
