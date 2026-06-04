import { ToggleLeft, ToggleRight } from "lucide-react";
import {
  STATUS_UI_ACTIVE,
  STATUS_UI_INACTIVE,
} from "../../modules/shared/utils/statusLabels";

function StatusToggle({
  checked,
  onChange,
  labelOn = STATUS_UI_ACTIVE,
  labelOff = STATUS_UI_INACTIVE,
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="inline-flex min-w-[140px] w-[140px] items-center gap-1.5"
    >
      <span className="inline-flex w-[18px] shrink-0 items-center justify-center">
        {checked ? (
          <ToggleRight size={18} className="text-[var(--admin-success-text)]" />
        ) : (
          <ToggleLeft size={18} className="text-[var(--admin-warning-text)]" />
        )}
      </span>
      <span
        className={`min-w-[96px] text-left text-xs font-semibold ${
          checked ? "text-[var(--admin-success-text)]" : "text-[var(--admin-warning-text)]"
        }`}
      >
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

export default StatusToggle;
