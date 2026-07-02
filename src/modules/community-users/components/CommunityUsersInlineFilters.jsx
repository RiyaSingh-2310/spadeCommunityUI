import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  EMAIL_VERIFIED_OPTIONS,
  PRESCREEN_OPTIONS,
  STATUS_OPTIONS,
} from "./CommunityUsersFilterPanel";

const FILTER_LABEL_CLASS = "admin-text text-sm font-semibold";
const FILTER_SELECT_CLASS = `${getAdminInputClass()} h-11`;
const FILTER_SELECT_WIDTH_CLASS = "w-full min-w-[11.25rem] sm:w-[11.25rem]";

function FilterField({ id, label, value, options, onChange }) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <label htmlFor={id} className={FILTER_LABEL_CLASS}>
        {label}
      </label>
      <select
        id={id}
        className={`${FILTER_SELECT_CLASS} ${FILTER_SELECT_WIDTH_CLASS}`}
        value={value}
        onChange={onChange}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CommunityUsersInlineFilters({ filters, onChange }) {
  const setFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex w-full flex-wrap items-end gap-3 sm:flex-nowrap sm:gap-4 lg:w-auto">
      <FilterField
        id="community-users-status-filter"
        label="Status"
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(event) => setFilter("status", event.target.value)}
      />
      <FilterField
        id="community-users-email-verified-filter"
        label="Email Verified"
        value={filters.emailVerified}
        options={EMAIL_VERIFIED_OPTIONS}
        onChange={(event) => setFilter("emailVerified", event.target.value)}
      />
      <FilterField
        id="community-users-prescreen-filter"
        label="Questionnaire Completed"
        value={filters.prescreenCompleted}
        options={PRESCREEN_OPTIONS}
        onChange={(event) => setFilter("prescreenCompleted", event.target.value)}
      />
    </div>
  );
}

export default CommunityUsersInlineFilters;
