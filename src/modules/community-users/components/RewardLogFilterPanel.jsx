import FormField from "../../../components/admin/FormField";
import { getAdminInputClass } from "../../shared/utils/formStyles";

export const REWARD_LOG_REASON_OPTIONS = [
  { value: "all", label: "All Reasons" },
  { value: "Survey Completion", label: "Survey Completion" },
  { value: "Referral Bonus", label: "Referral Bonus" },
  { value: "Manual Adjustment", label: "Manual Adjustment" },
  { value: "Reward Redemption", label: "Reward Redemption" },
  { value: "Survey Participation", label: "Survey Participation" },
];

const POINTS_TYPE_OPTIONS = [
  { value: "all", label: "All Transactions" },
  { value: "credit", label: "Credits (+)" },
  { value: "debit", label: "Debits (-)" },
];

function RewardLogFilterPanel({ filters, onChange }) {
  const inputClass = getAdminInputClass();

  const setFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="Reason">
        <select
          className={inputClass}
          value={filters.reason}
          onChange={(event) => setFilter("reason", event.target.value)}
          aria-label="Filter by reason"
        >
          {REWARD_LOG_REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Transaction Type">
        <select
          className={inputClass}
          value={filters.pointsType}
          onChange={(event) => setFilter("pointsType", event.target.value)}
          aria-label="Filter by transaction type"
        >
          {POINTS_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

export default RewardLogFilterPanel;
