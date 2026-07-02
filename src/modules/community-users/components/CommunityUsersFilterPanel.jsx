import FormField from "../../../components/admin/FormField";
import { getAdminInputClass } from "../../shared/utils/formStyles";

export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const PRESCREEN_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const EMAIL_VERIFIED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function CommunityUsersFilterPanel({ filters, onChange }) {
  const inputClass = getAdminInputClass();

  const setFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="Status">
        <select
          className={inputClass}
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Email Verified">
        <select
          className={inputClass}
          value={filters.emailVerified}
          onChange={(event) => setFilter("emailVerified", event.target.value)}
          aria-label="Filter by email verified"
        >
          {EMAIL_VERIFIED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Questionnaire Completed">
        <select
          className={inputClass}
          value={filters.prescreenCompleted}
          onChange={(event) => setFilter("prescreenCompleted", event.target.value)}
          aria-label="Filter by questionnaire completed"
        >
          {PRESCREEN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

export default CommunityUsersFilterPanel;
