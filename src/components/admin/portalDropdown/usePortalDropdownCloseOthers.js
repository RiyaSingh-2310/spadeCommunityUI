import { useEffect, useId } from "react";
import { PORTAL_DROPDOWN_OPEN_EVENT } from "./portalDropdownConstants";

/**
 * Closes this dropdown when another portal dropdown opens.
 */
export function usePortalDropdownCloseOthers(isOpen, onClose) {
  const dropdownId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOtherOpen = (event) => {
      if (event.detail?.id !== dropdownId) {
        onClose();
      }
    };

    window.dispatchEvent(
      new CustomEvent(PORTAL_DROPDOWN_OPEN_EVENT, { detail: { id: dropdownId } })
    );
    window.addEventListener(PORTAL_DROPDOWN_OPEN_EVENT, handleOtherOpen);

    return () => {
      window.removeEventListener(PORTAL_DROPDOWN_OPEN_EVENT, handleOtherOpen);
    };
  }, [isOpen, onClose, dropdownId]);
}
