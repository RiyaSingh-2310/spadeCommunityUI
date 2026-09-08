import { getAdminInputClass } from "../../shared/utils/formStyles";

export const QUESTIONNAIRE_GROUP_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const QUESTIONNAIRE_GROUP_LANGUAGE_FILTERS = [
  { value: "all", label: "All languages" },
  { value: "english", label: "English" },
  { value: "dutch", label: "Dutch" },
  { value: "korean", label: "Korean" },
];

const FILTER_LABEL_CLASS = "admin-text mb-2 block text-sm font-semibold";

function QuestionnaireGroupListFilters({
  status,
  language,
  onStatusChange,
  onLanguageChange,
  extraLanguages = [],
}) {
  const languageOptions = [...QUESTIONNAIRE_GROUP_LANGUAGE_FILTERS];
  extraLanguages.forEach((slug) => {
    const value = String(slug ?? "").trim().toLowerCase();
    if (!value || languageOptions.some((option) => option.value === value)) return;
    languageOptions.push({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
    });
  });

  return (
    <div className="flex w-full flex-wrap items-end justify-end gap-3 sm:flex-nowrap sm:gap-4 lg:w-auto">
      <div className="w-full min-w-[min(100%,11.25rem)] shrink-0 sm:w-[11.25rem]">
        <label htmlFor="questionnaire-group-status-filter" className={FILTER_LABEL_CLASS}>
          Status
        </label>
        <select
          id="questionnaire-group-status-filter"
          className={getAdminInputClass()}
          value={status}
          onChange={(event) => onStatusChange?.(event.target.value)}
          aria-label="Filter by status"
        >
          {QUESTIONNAIRE_GROUP_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-[min(100%,11.25rem)] shrink-0 sm:w-[11.25rem]">
        <label htmlFor="questionnaire-group-language-filter" className={FILTER_LABEL_CLASS}>
          Language
        </label>
        <select
          id="questionnaire-group-language-filter"
          className={getAdminInputClass()}
          value={language}
          onChange={(event) => onLanguageChange?.(event.target.value)}
          aria-label="Filter by language"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default QuestionnaireGroupListFilters;
