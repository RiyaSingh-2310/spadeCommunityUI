import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  getDefaultPhoneCountryCode,
  getPhoneCountryByCode,
  PHONE_COUNTRIES,
} from "../../modules/shared/data/phoneCountries";
import {
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
  /** ISO country code hint from related country field, e.g. "India" */
  formCountryLabel = "",
  defaultCountryCode,
  id,
  "aria-label": ariaLabel = "Phone number",
}) {
  const resolvedDefault =
    defaultCountryCode ?? getDefaultPhoneCountryCode(formCountryLabel);

  const parsed = useMemo(
    () => parsePhoneValue(value, resolvedDefault),
    [value, resolvedDefault]
  );

  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    setCountryCode(parsed.countryCode);
    setNationalNumber(parsed.nationalNumber);
  }, [parsed.countryCode, parsed.nationalNumber]);

  useEffect(() => {
    if (!formCountryLabel) return;
    const next = getDefaultPhoneCountryCode(formCountryLabel);
    if (next !== countryCode && !value) {
      setCountryCode(next);
      onChange?.(formatPhoneValue(next, nationalNumber));
    }
  }, [formCountryLabel, countryCode, value, nationalNumber, onChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const country = getPhoneCountryByCode(countryCode);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dialCode.includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [search]);

  const emitChange = (nextCountryCode, nextNational) => {
    onChange?.(formatPhoneValue(nextCountryCode, nextNational));
  };

  const handleNationalChange = (raw) => {
    const digits = sanitizePhoneDigits(raw);
    const maxLen = getPhoneCountryByCode(countryCode).nationalLength;
    const trimmed = digits.slice(0, maxLen);
    setNationalNumber(trimmed);
    emitChange(countryCode, trimmed);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const fullParsed = parsePhoneValue(pasted, countryCode);
    setCountryCode(fullParsed.countryCode);
    setNationalNumber(fullParsed.nationalNumber);
    emitChange(fullParsed.countryCode, fullParsed.nationalNumber);
  };

  const handleCountrySelect = (code) => {
    setCountryCode(code);
    setIsOpen(false);
    setSearch("");
    emitChange(code, nationalNumber);
  };

  return (
    <div ref={rootRef} className="flex gap-2">
      <div className="relative shrink-0">
        <button
          type="button"
          id={id ? `${id}-country` : undefined}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`admin-phone-country-btn flex h-11 min-w-[7.5rem] items-center gap-2 rounded-xl border px-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Country code"
        >
          <span className="text-base leading-none" aria-hidden>
            {country.flag}
          </span>
          <span className="admin-text whitespace-nowrap">{country.dialCode}</span>
          <ChevronDown size={14} className="admin-text-subtle ml-auto shrink-0" />
        </button>

        {isOpen && (
          <div
            className="admin-header-surface absolute left-0 z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg"
            role="listbox"
            aria-label="Select country"
          >
            <div
              className="border-b p-2"
              style={{ borderColor: "var(--admin-header-surface-border)" }}
            >
              <div className="relative">
                <Search
                  size={14}
                  className="admin-text-subtle pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="admin-text h-9 w-full rounded-lg border border-[var(--admin-header-surface-border)] bg-transparent pl-8 pr-2 text-sm outline-none focus:border-[#10a950]"
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {filteredCountries.length === 0 ? (
                <li className="admin-text-muted px-3 py-2 text-sm">No countries found</li>
              ) : (
                filteredCountries.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.code === countryCode}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--admin-header-surface-border)]/30 ${
                        item.code === countryCode ? "bg-[var(--admin-success-text)]/10" : ""
                      }`}
                      onClick={() => handleCountrySelect(item.code)}
                    >
                      <span className="text-base leading-none">{item.flag}</span>
                      <span className="admin-text min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="admin-text-muted shrink-0">{item.dialCode}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        placeholder={placeholder}
        value={nationalNumber}
        onChange={(e) => handleNationalChange(e.target.value)}
        onPaste={handlePaste}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
            e.preventDefault();
          }
        }}
        className={`admin-number-input min-w-0 flex-1 ${inputClassName}`}
      />
    </div>
  );
}

export default PhoneInput;
