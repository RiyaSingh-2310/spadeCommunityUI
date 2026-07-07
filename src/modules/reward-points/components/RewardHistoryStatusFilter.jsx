import { getAdminInputClass } from "../../shared/utils/formStyles";

export const REWARD_HISTORY_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const FILTER_LABEL_CLASS = "admin-text mb-2 block text-sm font-semibold";
const FILTER_SELECT_CLASS = `${getAdminInputClass()} h-10`;

function RewardHistoryStatusFilter({ value = "all", onChange, className = "" }) {
  return (
    <div
      className={`w-full min-w-[min(100%,11.25rem)] shrink-0 sm:w-[11.25rem] ${className}`.trim()}
    >
      <label htmlFor="reward-history-status-filter" className={FILTER_LABEL_CLASS}>
        Status
      </label>
      <select
        id="reward-history-status-filter"
        className={FILTER_SELECT_CLASS}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label="Filter by status"
      >
        {REWARD_HISTORY_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RewardHistoryStatusFilter;
