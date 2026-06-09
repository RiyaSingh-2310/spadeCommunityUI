import { useMemo } from "react";
import { getCountriesOrFallback } from "../../services/countries/countriesApi";
import { useCountries } from "../../modules/shared/hooks/useCountries";
import { mapCountryToSelectOption } from "../../modules/shared/utils/dropdownSearch";
import { getAdminInputClass } from "../../modules/shared/utils/formStyles";
import SearchableSelect from "./SearchableSelect";

function CountrySelect({
  value,
  onChange,
  onBlur,
  disabled = false,
  inputClass = "",
  placeholder = "Select Country",
  id,
}) {
  const { countries, isLoading } = useCountries();

  const options = useMemo(() => {
    const source = countries.length > 0 ? countries : getCountriesOrFallback();
    return source.map((country) => mapCountryToSelectOption(country));
  }, [countries]);

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
      loading={isLoading}
      loadingLabel="Loading countries..."
      emptyMessage="No countries found"
      searchPlaceholder="Search country..."
      searchable
      aria-label="Select country"
    />
  );
}

export default CountrySelect;
