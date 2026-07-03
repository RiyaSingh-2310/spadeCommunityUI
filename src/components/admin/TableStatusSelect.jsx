import { ChevronDown } from "lucide-react";
import { getAdminTableSelectClass } from "../../modules/shared/utils/formStyles";

function TableStatusSelect({
  value,
  options,
  disabled = false,
  onChange,
  "aria-label": ariaLabel = "Status",
}) {
  const currentValue = String(value ?? "").trim();
  const normalizedOptions = options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return { value: option.value, label: option.label ?? option.value };
  });

  const hasCurrentValue = normalizedOptions.some((option) => option.value === currentValue);
  const selectValue = hasCurrentValue ? currentValue : normalizedOptions[0]?.value ?? "";

  return (
    <div className="admin-table-select-wrap">
      <select
        className={getAdminTableSelectClass()}
        value={selectValue}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="admin-table-select-chevron admin-text-muted pointer-events-none"
        aria-hidden
      />
    </div>
  );
}

export default TableStatusSelect;
