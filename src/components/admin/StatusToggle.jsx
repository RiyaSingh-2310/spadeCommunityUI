import {
  STATUS_UI_ACTIVE,
  STATUS_UI_INACTIVE,
} from "../../modules/shared/utils/statusLabels";

function getStatusShellClass(compact) {
  return compact
    ? "inline-flex min-w-[100px] w-[100px] max-w-[100px] items-center justify-center"
    : "inline-flex min-w-[88px] items-center justify-center";
}

function StatusToggleContent({ checked, labelOn, labelOff, compact = false }) {
  const label = checked ? labelOn : labelOff;

  return (
    <span
      className={`admin-status-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        compact ? "px-2 py-0.5 text-[11px]" : ""
      } ${checked ? "admin-status-badge--active" : "admin-status-badge--inactive"}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          checked ? "bg-[var(--admin-success-text)]" : "bg-[var(--admin-subtle-foreground)]"
        }`}
        aria-hidden
      />
      {label}
    </span>
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
  const ariaLabel = checked ? labelOn : labelOff;

  if (readOnly) {
    return (
      <span aria-label={ariaLabel} className={`${statusShellClass} cursor-default`}>
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
      aria-label={`${ariaLabel}. Click to toggle status`}
      title={`Toggle to ${checked ? labelOff : labelOn}`}
      className={`${statusShellClass} cursor-pointer rounded-full transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]`}
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
