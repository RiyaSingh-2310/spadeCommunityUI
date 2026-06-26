import { ToggleLeft, ToggleRight } from "lucide-react";
import {
  STATUS_UI_ACTIVE,
  STATUS_UI_INACTIVE,
} from "../../modules/shared/utils/statusLabels";

function getStatusShellClass(compact) {
  return compact
    ? "inline-flex min-w-[100px] w-[100px] max-w-[100px] items-center gap-1"
    : "inline-flex min-w-[140px] w-[140px] items-center gap-1.5";
}

function StatusToggleContent({ checked, labelOn, labelOff, compact = false }) {
  return (
    <>
      <span className="admin-status-icon inline-flex h-5 w-5 shrink-0 items-center justify-center">
        {checked ? (
          <ToggleRight size={18} className="text-[var(--admin-success-text)]" />
        ) : (
          <ToggleLeft size={18} className="text-[var(--admin-warning-text)]" />
        )}
      </span>
      <span
        className={`text-left text-xs font-semibold ${
          compact ? "min-w-[62px]" : "min-w-[96px]"
        } ${checked ? "text-[var(--admin-success-text)]" : "text-[var(--admin-warning-text)]"}`}
      >
        {checked ? labelOn : labelOff}
      </span>
    </>
  );
}

function StatusToggle({
  checked,
  onChange,
  labelOn = STATUS_UI_ACTIVE,
  labelOff = STATUS_UI_INACTIVE,
  readOnly = false,
  compact = false,
}) {
  const statusShellClass = getStatusShellClass(compact);
  if (readOnly) {
    return (
      <span
        aria-label={checked ? labelOn : labelOff}
        className={`${statusShellClass} cursor-default`}
      >
        <StatusToggleContent
          checked={checked}
          labelOn={labelOn}
          labelOff={labelOff}
          compact={compact}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`${statusShellClass} cursor-pointer`}
    >
      <StatusToggleContent
        checked={checked}
        labelOn={labelOn}
        labelOff={labelOff}
        compact={compact}
      />
    </button>
  );
}

export default StatusToggle;
