import { useMemo } from "react";
import { toLanguageFilterOptions } from "../../../services/languages/languagesApi";
import { useLanguages } from "../../shared/hooks/useLanguages";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { GROUP_STATUS_FILTER_OPTIONS } from "../../survey/utils/reportFilterConstants";

export const QUESTIONNAIRE_GROUP_STATUS_FILTERS = GROUP_STATUS_FILTER_OPTIONS;

const FILTER_LABEL_CLASS = "admin-text mb-1.5 block text-sm font-semibold leading-5";

function QuestionnaireGroupListFilters({
  status,
  language,
  onStatusChange,
  onLanguageChange,
  extraLanguages = [],
  showLanguage = true,
}) {
  const { languages, isLoading } = useLanguages();
  const languageOptions = useMemo(
    () => toLanguageFilterOptions(languages, { extra: extraLanguages, selected: language }),
    [languages, extraLanguages, language]
  );

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
          disabled={isLoading}
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
