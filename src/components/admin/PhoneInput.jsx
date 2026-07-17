import { useEffect, useMemo, useRef } from "react";
import {
  getDefaultPhoneCountryCode,
  getPhoneCountryByCode,
} from "../../modules/shared/data/phoneCountries";
import {
  CONTACT_NUMBER_DIGIT_LENGTH,
  formatPhoneValue,
  parsePhoneValue,
  sanitizePhoneDigits,
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

  const nationalNumber = useMemo(
    () => parsePhoneValue(value, countryCode).nationalNumber,
    [value, countryCode]
  );

  const prevCountryLabelRef = useRef(formCountryLabel);

  useEffect(() => {
    if (!hasCountry) return;
    if (prevCountryLabelRef.current === formCountryLabel) return;

    prevCountryLabelRef.current = formCountryLabel;

    const nextCode = getDefaultPhoneCountryCode(formCountryLabel);
    const national = parsePhoneValue(value, nextCode).nationalNumber;
    const nextValue = national ? formatPhoneValue(nextCode, national) : "";
    if (nextValue !== value) {
      onChange?.(nextValue);
    }
  }, [formCountryLabel, hasCountry, value, onChange]);

  const isDisabled = disabled || !hasCountry;

  const handleNationalChange = (raw) => {
    const digits = sanitizePhoneDigits(raw).slice(0, CONTACT_NUMBER_DIGIT_LENGTH);
    onChange?.(digits ? formatPhoneValue(countryCode, digits) : "");
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const parsed = parsePhoneValue(pasted, countryCode);
    const digits = sanitizePhoneDigits(parsed.nationalNumber).slice(
      0,
      CONTACT_NUMBER_DIGIT_LENGTH
    );
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
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        id={id}
        aria-label={ariaLabel}
        disabled={isDisabled}
        placeholder={hasCountry ? placeholder : "Select a country first"}
        value={nationalNumber}
        maxLength={CONTACT_NUMBER_DIGIT_LENGTH}
        onChange={(e) => handleNationalChange(e.target.value)}
        onPaste={handlePaste}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
            e.preventDefault();
          }
        }}
        className="admin-number-input admin-text min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none shadow-none ring-0 placeholder:text-[var(--admin-subtle-foreground)] focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

export default PhoneInput;
