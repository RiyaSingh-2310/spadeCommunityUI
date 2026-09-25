import { getAdminInputClass } from "../../shared/utils/formStyles";
import { GROUP_STATUS_FILTER_OPTIONS } from "../../survey/utils/reportFilterConstants";

export const QUESTIONNAIRE_GROUP_STATUS_FILTERS = GROUP_STATUS_FILTER_OPTIONS;

export const QUESTIONNAIRE_GROUP_LANGUAGE_FILTERS = [
  { value: "all", label: "All languages" },
  { value: "english", label: "English" },
  { value: "dutch", label: "Dutch" },
  { value: "korean", label: "Korean" },
];

const FILTER_LABEL_CLASS = "admin-text mb-1.5 block text-sm font-semibold leading-5";

function QuestionnaireGroupListFilters({
  status,
  language,
  onStatusChange,
  onLanguageChange,
  extraLanguages = [],
  showLanguage = true,
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

  const selectClass = getAdminInputClass();

  return (
    <div className="flex w-full flex-wrap items-end justify-end gap-3 sm:flex-nowrap sm:gap-4 lg:w-auto">
      <div className="w-full min-w-[min(100%,11.25rem)] shrink-0 sm:w-[11.25rem]">
        <label htmlFor="questionnaire-group-status-filter" className={FILTER_LABEL_CLASS}>
          Status
        </label>
        <select
          id="questionnaire-group-status-filter"
          className={selectClass}
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
      {showLanguage ? (
      <div className="w-full min-w-[min(100%,11.25rem)] shrink-0 sm:w-[11.25rem]">
        <label htmlFor="questionnaire-group-language-filter" className={FILTER_LABEL_CLASS}>
          Language
        </label>
        <select
          id="questionnaire-group-language-filter"
          className={selectClass}
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
      ) : null}
    </div>
  );
}

export default QuestionnaireGroupListFilters;
