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
        <ToggleRight size={18} className="text-[#18a354]" />
      ) : (
        <ToggleLeft size={18} className="text-[#f0a339]" />
      )}
      <span
        className={`text-xs font-semibold ${
          checked ? "text-[#18a354]" : "text-[#f0a339]"
        }`}
      >
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

export default StatusToggle;
