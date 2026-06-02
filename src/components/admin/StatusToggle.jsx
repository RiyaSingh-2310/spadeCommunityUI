import { ToggleLeft, ToggleRight } from "lucide-react";

function StatusToggle({
  checked,
  onChange,
  labelOn = "Activated",
  labelOff = "Deactivated",
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="inline-flex items-center gap-1.5"
    >
      {checked ? (
        <ToggleRight size={18} className="text-[var(--admin-success-text)]" />
      ) : (
        <ToggleLeft size={18} className="text-[var(--admin-warning-text)]" />
      )}
      <span
        className={`text-xs font-semibold ${
          checked ? "text-[var(--admin-success-text)]" : "text-[var(--admin-warning-text)]"
        }`}
      >
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

export default StatusToggle;
