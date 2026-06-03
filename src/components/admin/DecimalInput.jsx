import {
  DEFAULT_DECIMAL_PLACES,
  preventBlockedNumericKeys,
  preventWheelValueChange,
  sanitizeDecimal,
} from "../../modules/shared/utils/numericInputUtils";

/** Decimal input with max 2 places after the decimal point by default. */
function DecimalInput({
  value,
  onChange,
  className = "",
  decimalPlaces = DEFAULT_DECIMAL_PLACES,
  ...props
}) {
  const handleChange = (event) => {
    onChange(sanitizeDecimal(event.target.value, decimalPlaces));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onKeyDown={preventBlockedNumericKeys}
      onWheel={preventWheelValueChange}
      className={`admin-number-input ${className}`}
      {...props}
    />
  );
}

export default DecimalInput;
