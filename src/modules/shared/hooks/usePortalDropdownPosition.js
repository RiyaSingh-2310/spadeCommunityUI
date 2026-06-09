import { useCallback, useLayoutEffect, useState } from "react";
import { PORTAL_DROPDOWN_MAX_HEIGHT } from "../constants/portalDropdown";

const DEFAULT_MENU_MAX_HEIGHT = PORTAL_DROPDOWN_MAX_HEIGHT;
const MIN_MENU_HEIGHT = 120;
const MENU_GAP = 4;

/**
 * Positions a fixed portal menu below or above its trigger based on viewport space.
 * @param {boolean} isOpen
 * @param {import('react').RefObject<HTMLElement | null>} triggerRef
 * @param {import('react').RefObject<HTMLElement | null>} menuRef
 */
export function usePortalDropdownPosition(isOpen, triggerRef, menuRef) {
  const [menuStyle, setMenuStyle] = useState(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUpward = spaceBelow < MIN_MENU_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      MIN_MENU_HEIGHT,
      Math.min(DEFAULT_MENU_MAX_HEIGHT, openUpward ? spaceAbove : spaceBelow)
    );

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 0),
      maxHeight,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
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
