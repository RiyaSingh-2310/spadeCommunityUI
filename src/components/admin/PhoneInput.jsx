import { useEffect, useMemo, useRef } from "react";
import {
  getDefaultPhoneCountryCode,
  getPhoneCountryByCode,
} from "../../modules/shared/data/phoneCountries";
import {
  formatPhoneValue,
  getNationalPhoneLength,
  limitNationalPhoneDigits,
  parsePhoneValue,
  preventNonDigitPhoneKeys,
} from "../../modules/shared/utils/phoneValidation";

function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  inputClassName = "",
  placeholder = "Enter phone number",
  /** Country name from the related Country field, e.g. "India" */
  formCountryLabel = "",
  defaultCountryCode,
  id,
  "aria-label": ariaLabel = "Phone number",
}) {
  const hasCountry = Boolean(String(formCountryLabel ?? "").trim());

  const countryCode = useMemo(
    () =>
      hasCountry
        ? getDefaultPhoneCountryCode(formCountryLabel)
        : defaultCountryCode ?? "IN",
    [formCountryLabel, hasCountry, defaultCountryCode]
  );

  const country = getPhoneCountryByCode(countryCode);
  const nationalLength = getNationalPhoneLength(countryCode);

  const nationalNumber = useMemo(
    () =>
      limitNationalPhoneDigits(
        parsePhoneValue(value, countryCode).nationalNumber,
        nationalLength
      ),
    [value, countryCode, nationalLength]
  );

  const prevCountryLabelRef = useRef(formCountryLabel);

  useEffect(() => {
    if (!hasCountry) return;
    if (prevCountryLabelRef.current === formCountryLabel) return;

    prevCountryLabelRef.current = formCountryLabel;

    const nextCode = getDefaultPhoneCountryCode(formCountryLabel);
    const maxLen = getNationalPhoneLength(nextCode);
    const national = limitNationalPhoneDigits(
      parsePhoneValue(value, nextCode).nationalNumber,
      maxLen
    );
    const nextValue = national ? formatPhoneValue(nextCode, national) : "";
    if (nextValue !== value) {
      onChange?.(nextValue);
    }
  }, [formCountryLabel, hasCountry, value, onChange]);

  const isDisabled = disabled || !hasCountry;

  const handleNationalChange = (raw) => {
    const digits = limitNationalPhoneDigits(raw, nationalLength);
    onChange?.(digits ? formatPhoneValue(countryCode, digits) : "");
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const parsed = parsePhoneValue(pasted, countryCode);
    const digits = limitNationalPhoneDigits(parsed.nationalNumber, nationalLength);
    onChange?.(digits ? formatPhoneValue(countryCode, digits) : "");
  };

  return (
    <div
      className={`admin-phone-input flex items-center ${inputClassName} ${
        isDisabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      {hasCountry && (
        <span className="admin-text shrink-0 select-none pr-2" aria-hidden="true">
          {country.dialCode}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel-national"
        id={id}
        aria-label={ariaLabel}
        disabled={isDisabled}
        placeholder={hasCountry ? placeholder : "Select a country first"}
        value={nationalNumber}
        maxLength={nationalLength}
        onChange={(e) => handleNationalChange(e.target.value)}
        onPaste={handlePaste}
        onBlur={onBlur}
        onKeyDown={preventNonDigitPhoneKeys}
        className="admin-number-input admin-text min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none shadow-none ring-0 placeholder:text-[var(--admin-subtle-foreground)] focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

export default PhoneInput;
