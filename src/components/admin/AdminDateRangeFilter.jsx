import { getAdminInputClass } from "../../modules/shared/utils/formStyles";

function AdminDateRangeFilter({
  fromDate = "",
  toDate = "",
  onFromChange,
  onToChange,
  label = "Date Range",
  className = "",
}) {
  const inputClass = getAdminInputClass();

  return (
    <div className={className}>
      <span className="admin-text-muted mb-1.5 block text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange?.(e.target.value)}
          className={`${inputClass} h-10 min-w-0 w-[140px] sm:w-[150px]`}
          aria-label="Start Date"
        />
        <span className="admin-text-subtle shrink-0 text-sm" aria-hidden>
          →
        </span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange?.(e.target.value)}
          className={`${inputClass} h-10 min-w-0 w-[140px] sm:w-[150px]`}
          aria-label="End Date"
        />
      </div>
    </div>
  );
}

export default AdminDateRangeFilter;
