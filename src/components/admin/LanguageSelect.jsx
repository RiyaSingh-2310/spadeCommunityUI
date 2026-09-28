import { useMemo } from "react";
import { mergeLanguageNames } from "../../services/languages/languagesApi";
import { useLanguages } from "../../modules/shared/hooks/useLanguages";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import SearchableSelect from "./SearchableSelect";

function LanguageSelect({
  value,
  onChange,
  onBlur,
  disabled = false,
  inputClass = "",
  placeholder = "Select Language",
  id,
  searchable = true,
  loading = false,
  "aria-label": ariaLabel = "Select language",
}) {
  const { languages, isLoading } = useLanguages();
  const showLoading = loading || isLoading;

  const options = useMemo(
    () => mergeLanguageNames(languages, { selected: value }),
    [languages, value]
  );

  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      inputClass={inputClass || getAdminInputClass()}
      loading={showLoading}
      loadingLabel="Loading languages..."
      emptyMessage="No languages found"
      searchPlaceholder="Search language..."
      searchable={searchable}
      aria-label={ariaLabel}
    />
  );
}

export default LanguageSelect;
